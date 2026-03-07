import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import {
  AvailabilityResponse,
  BookingService,
  CreateReservationRequest,
  CreateReservationResponse,
  OnlineReservation,
  PublicBookingScope,
  ReservationStatusResponse,
  TimeSlot,
  WorkingHours,
} from '../types';

export interface PublicBookingContext {
  clinicId: string;
  clinicName: string;
  branchId?: string;
  branchName?: string;
  displayName: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}

type RpcBookingContextRow = {
  clinic_id: string;
  clinic_name: string;
  branch_id?: string | null;
  branch_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
};

type RpcDentistRow = {
  id: string;
  name: string;
  specialty?: string | null;
};

type RpcServiceRow = {
  id: string;
  name: string;
  description?: string | null;
  base_price?: number | null;
};

type RpcWorkingHoursRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes?: number | null;
  break_start?: string | null;
  break_end?: string | null;
  is_active?: boolean | null;
};

type RpcAppointmentRow = {
  start_time: string;
  end_time: string;
  dentist_id?: string | null;
};

const getClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

const getScopeParams = (scope?: PublicBookingScope) => ({
  p_clinic_id: scope?.clinicId || null,
  p_branch_id: scope?.branchId || null,
});

const toHourMinute = (value?: string | null): string | null => {
  if (!value) return null;
  const [hour, minute] = String(value).split(':');
  if (hour == null || minute == null) return null;
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const toMinutes = (value?: string | null): number | null => {
  const hourMinute = toHourMinute(value);
  if (!hourMinute) return null;
  const [hour, minute] = hourMinute.split(':').map(Number);
  return hour * 60 + minute;
};

const mapContext = (row: RpcBookingContextRow): PublicBookingContext => ({
  clinicId: row.clinic_id,
  clinicName: row.clinic_name,
  branchId: row.branch_id || undefined,
  branchName: row.branch_name || undefined,
  displayName: row.display_name || row.branch_name || row.clinic_name,
  phone: row.phone || undefined,
  email: row.email || undefined,
  address: row.address || undefined,
  logoUrl: row.logo_url || undefined,
});

export const getPublicBookingContext = async (
  scope?: PublicBookingScope,
): Promise<PublicBookingContext | null> => {
  try {
    if (!scope?.clinicId && !scope?.branchId) {
      return null;
    }

    const client = getClient();
    const { data, error } = await client.rpc('get_public_booking_context', getScopeParams(scope));

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? (data[0] as RpcBookingContextRow | undefined) : undefined;
    return row ? mapContext(row) : null;
  } catch (error) {
    console.error('Error fetching public booking context:', error);
    return null;
  }
};

/**
 * Fetch available time slots for a specific date.
 */
export const getAvailableSlots = async (
  date: string,
  dentistId?: string,
  scope?: PublicBookingScope,
): Promise<AvailabilityResponse> => {
  try {
    const client = getClient();
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    if (Number.isNaN(dayOfWeek)) {
      return { date, slots: [] };
    }

    const [dentists, appointmentsResponse, workingHoursResponse] = await Promise.all([
      getAvailableDentists(scope).then((rows) =>
        dentistId ? rows.filter((row) => row.id === dentistId) : rows,
      ),
      client.rpc('get_public_booking_appointments', {
        p_date: date,
        ...getScopeParams(scope),
        p_dentist_id: dentistId || null,
      }),
      client.rpc('get_public_booking_working_hours', {
        p_day_of_week: dayOfWeek,
      }),
    ]);

    if (appointmentsResponse.error) {
      throw appointmentsResponse.error;
    }

    if (workingHoursResponse.error) {
      throw workingHoursResponse.error;
    }

    const workingHoursRows = (workingHoursResponse.data || []) as RpcWorkingHoursRow[];
    const workingHours = workingHoursRows[0];

    if (!workingHours || dentists.length === 0) {
      return { date, slots: [] };
    }

    const startTime = toHourMinute(workingHours.start_time);
    const endTime = toHourMinute(workingHours.end_time);
    const breakStart = toHourMinute(workingHours.break_start);
    const breakEnd = toHourMinute(workingHours.break_end);
    const slotDuration = Number(workingHours.slot_duration_minutes || 30);

    if (!startTime || !endTime || slotDuration <= 0) {
      return { date, slots: [] };
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const openingMinutes = startHour * 60 + startMinute;
    const closingMinutes = endHour * 60 + endMinute;
    const breakStartMinutes = toMinutes(breakStart);
    const breakEndMinutes = toMinutes(breakEnd);

    const appointments = (appointmentsResponse.data || []) as RpcAppointmentRow[];
    const slots: TimeSlot[] = [];

    for (
      let minutes = openingMinutes;
      minutes + slotDuration <= closingMinutes;
      minutes += slotDuration
    ) {
      const slotStart = new Date(`${date}T00:00:00`);
      slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      if (
        breakStartMinutes != null &&
        breakEndMinutes != null &&
        minutes < breakEndMinutes &&
        minutes + slotDuration > breakStartMinutes
      ) {
        continue;
      }

      let availableDentist: { id: string; name: string } | null = null;
      for (const dentist of dentists) {
        const isBooked = appointments.some((appointment) => {
          if (appointment.dentist_id !== dentist.id) return false;
          const appointmentStart = new Date(appointment.start_time);
          const appointmentEnd = new Date(appointment.end_time);
          return slotStart < appointmentEnd && slotEnd > appointmentStart;
        });

        if (!isBooked) {
          availableDentist = { id: dentist.id, name: dentist.name };
          break;
        }
      }

      const hour = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const minute = (minutes % 60).toString().padStart(2, '0');

      slots.push({
        time: `${hour}:${minute}`,
        available: Boolean(availableDentist),
        dentistId: availableDentist?.id,
        dentistName: availableDentist?.name,
      });
    }

    return { date, slots };
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return { date, slots: [] };
  }
};

/**
 * Fetch available dentists.
 */
export const getAvailableDentists = async (
  scope?: PublicBookingScope,
): Promise<{ id: string; name: string; specialty: string }[]> => {
  try {
    const client = getClient();
    const { data, error } = await client.rpc('get_public_booking_dentists', getScopeParams(scope));

    if (error) {
      throw error;
    }

    return ((data || []) as RpcDentistRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty || '',
    }));
  } catch (error) {
    console.error('Error fetching dentists:', error);
    return [];
  }
};

/**
 * Fetch available services/treatments.
 */
export const getAvailableServices = async (
  scope?: PublicBookingScope,
): Promise<BookingService[]> => {
  try {
    const client = getClient();
    const { data, error } = await client.rpc('get_public_booking_services', getScopeParams(scope));

    if (error) {
      throw error;
    }

    return ((data || []) as RpcServiceRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      duration: 30,
      price: row.base_price ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Submit a new online reservation.
 */
export const createReservation = async (
  request: CreateReservationRequest,
): Promise<CreateReservationResponse> => {
  try {
    const client = getClient();
    const { data, error } = await client.rpc('create_public_online_reservation', {
      p_clinic_id: request.clinicId || null,
      p_branch_id: request.branchId || null,
      p_patient_name: request.patientName,
      p_patient_dob: request.patientDob || null,
      p_patient_gender: request.patientGender || null,
      p_patient_phone: request.patientPhone,
      p_patient_email: request.patientEmail || null,
      p_preferred_dentist_id: request.preferredDentistId || null,
      p_service_id: request.serviceId || null,
      p_requested_date: request.requestedDate,
      p_requested_time: request.requestedTime,
      p_duration_minutes: request.durationMinutes,
      p_reason: request.reason || null,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create reservation');
    }

    return {
      success: true,
      reservationId: String(data),
      message: 'Your reservation request has been submitted and is pending approval.',
    };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Failed to submit reservation request.';

    console.error('Error creating reservation:', error);

    return {
      success: false,
      reservationId: '',
      message,
    };
  }
};

/**
 * Check reservation status.
 */
export const getReservationStatus = async (
  reservationId: string,
): Promise<ReservationStatusResponse | null> => {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('online_reservations')
      .select(`
        *,
        dentists!preferred_dentist_id(name)
      `)
      .eq('id', reservationId)
      .single();

    if (error) throw error;
    if (!data) return null;

    let message = '';
    switch (data.status) {
      case 'PENDING':
        message = 'Your reservation is pending staff approval.';
        break;
      case 'APPROVED':
        message = 'Your reservation has been confirmed!';
        break;
      case 'REJECTED':
        message = 'Unfortunately, your reservation was declined.';
        break;
      case 'CANCELLED':
        message = 'Your reservation has been cancelled.';
        break;
      default:
        message = 'Your reservation status is being updated.';
        break;
    }

    return {
      id: data.id,
      status: data.status,
      appointmentDate: data.requested_date,
      appointmentTime: data.requested_time,
      dentistName: data.dentists?.name,
      message,
    };
  } catch (error) {
    console.error('Error fetching reservation status:', error);
    return null;
  }
};

/**
 * Get working hours for a specific day.
 */
export const getWorkingHours = async (dayOfWeek: number): Promise<WorkingHours | null> => {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('working_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      slotDurationMinutes: data.slot_duration_minutes,
      breakStart: data.break_start,
      breakEnd: data.break_end,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching working hours:', error);
    return null;
  }
};

/**
 * Fetch pending reservations for admin approval.
 */
export const getPendingReservations = async (
  scope?: PublicBookingScope,
): Promise<OnlineReservation[]> => {
  try {
    const client = getClient();

    let query = client
      .from('online_reservations')
      .select(`
        *,
        dentists!preferred_dentist_id(name)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (scope?.clinicId) {
      query = query.eq('clinic_id', scope.clinicId);
    }
    if (scope?.branchId) {
      query = query.eq('branch_id', scope.branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      clinicId: item.clinic_id,
      branchId: item.branch_id,
      patientName: item.patient_name,
      patientDob: item.patient_dob,
      patientGender: item.patient_gender,
      patientPhone: item.patient_phone,
      patientEmail: item.patient_email,
      preferredDentistId: item.preferred_dentist_id,
      serviceId: item.service_id,
      requestedDate: item.requested_date,
      requestedTime: item.requested_time,
      durationMinutes: item.duration_minutes,
      reason: item.reason,
      status: item.status as any,
      adminNotes: item.admin_notes,
      approvedBy: item.approved_by,
      approvedAt: item.approved_at,
      rejectionReason: item.rejection_reason,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      dentistName: item.dentists?.name,
    }));
  } catch (error) {
    console.error('Error fetching pending reservations:', error);
    return [];
  }
};

/**
 * Approve a reservation (admin only).
 */
export const approveReservation = async (
  reservationId: string,
  _adminId: string,
): Promise<boolean> => {
  try {
    const client = getClient();

    const { error } = await client
      .from('online_reservations')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving reservation:', error);
    return false;
  }
};

/**
 * Reject a reservation (admin only).
 */
export const rejectReservation = async (
  reservationId: string,
  rejectionReason: string,
): Promise<boolean> => {
  try {
    const client = getClient();

    const { error } = await client
      .from('online_reservations')
      .update({
        status: 'REJECTED',
        rejection_reason: rejectionReason,
      })
      .eq('id', reservationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    return false;
  }
};
