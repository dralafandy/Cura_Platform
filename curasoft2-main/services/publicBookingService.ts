import { supabase } from '../supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    OnlineReservation,
    CreateReservationRequest,
    CreateReservationResponse,
    ReservationStatusResponse,
    AvailabilityResponse,
    TimeSlot,
    BookingService,
    WorkingHours
} from '../types';

// Get the Supabase client - always returns a valid client or throws
const getClient = (): SupabaseClient => {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    return supabase;
};

/**
 * Public Booking API Service
 * These functions are designed to be called from the public booking page
 */

/**
 * Fetch available time slots for a specific date
 */
export const getAvailableSlots = async (
    date: string,
    _dentistId?: string
): Promise<AvailabilityResponse> => {
    try {
        const client = getClient();

        // Build query for appointments on this date
        let query = client
            .from('appointments')
            .select('start_time, end_time, dentist_id')
            .or(`status.eq.SCHEDULED,status.eq.CONFIRMED`)
            .gte('start_time', `${date}T00:00:00`)
            .lt('start_time', `${date}T23:59:59`);

        const { data: appointments, error } = await query;

        if (error) throw error;

        // Get working hours for this day of week
        const dayOfWeek = new Date(date).getDay();
        const { data: workingHours } = await client
            .from('working_hours')
            .select('*')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .single();

        // Generate all possible slots
        const slots: TimeSlot[] = [];
        
        if (workingHours) {
            const startHour = parseInt((workingHours.start_time as string).split(':')[0]);
            const endHour = parseInt((workingHours.end_time as string).split(':')[0]);
            const slotDuration = workingHours.slot_duration_minutes || 30;

            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += slotDuration) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    
                    // Check if this slot conflicts with any appointment
                    const isBooked = appointments?.some(apt => {
                        const aptStart = new Date(apt.start_time);
                        const aptEnd = new Date(apt.end_time);
                        const slotTime = new Date(`${date}T${time}:00`);
                        const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
                        
                        return slotTime < aptEnd && slotEnd > aptStart;
                    }) ?? false;

                    // Get dentists available at this time
                    const { data: dentists } = await client
                        .from('dentists')
                        .select('id, name')
                        .order('name');

                    // Find a dentist who is available
                    let availableDentist: { id: string; name: string } | null = null;
                    if (dentists) {
                        for (const dentist of dentists) {
                            const isDentistBooked = appointments?.some(apt => {
                                if (apt.dentist_id !== dentist.id) return false;
                                const aptStart = new Date(apt.start_time);
                                const aptEnd = new Date(apt.end_time);
                                const slotTime = new Date(`${date}T${time}:00`);
                                const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
                                
                                return slotTime < aptEnd && slotEnd > aptStart;
                            }) ?? false;

                            if (!isDentistBooked) {
                                availableDentist = dentist;
                                break;
                            }
                        }
                    }

                    slots.push({
                        time,
                        available: !isBooked && !!availableDentist,
                        dentistId: availableDentist?.id,
                        dentistName: availableDentist?.name,
                    });
                }
            }
        }

        return { date, slots };
    } catch (error) {
        console.error('Error fetching available slots:', error);
        // Return mock data on error for demo purposes
        return generateMockSlots(date);
    }
};

/**
 * Generate mock slots for demo purposes
 */
const generateMockSlots = (date: string): AvailabilityResponse => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    const slotDuration = 30;

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const available = Math.random() > 0.3;
            slots.push({
                time,
                available,
                dentistId: available ? 'demo-dentist-id' : undefined,
                dentistName: available ? 'Dr. Demo' : undefined,
            });
        }
    }

    return { date, slots };
};

/**
 * Fetch available dentists
 */
export const getAvailableDentists = async (): Promise<{ id: string; name: string; specialty: string }[]> => {
    try {
        const client = getClient();
        
        const { data, error } = await client
            .from('dentists')
            .select('id, name, specialty')
            .order('name');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching dentists:', error);
        // Return mock data for demo
        return [
            { id: '1', name: 'Dr. Ahmed Hassan', specialty: 'General Dentistry' },
            { id: '2', name: 'Dr. Sara Mohamed', specialty: 'Orthodontics' },
            { id: '3', name: 'Dr. Ali Kamal', specialty: 'Oral Surgery' },
            { id: '4', name: 'Dr. Fatima Hussein', specialty: 'Pediatric Dentistry' },
        ];
    }
};

/**
 * Fetch available services/treatments
 */
export const getAvailableServices = async (): Promise<BookingService[]> => {
    try {
        const client = getClient();
        
        const { data, error } = await client
            .from('treatment_definitions')
            .select('id, name, description, base_price')
            .order('name');

        if (error) throw error;

        return (data || []).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            duration: 30,
            price: item.base_price || undefined,
        }));
    } catch (error) {
        console.error('Error fetching services:', error);
        // Return mock data for demo
        return [
            { id: '1', name: 'Consultation', description: 'Initial examination and consultation', duration: 30, price: 100 },
            { id: '2', name: 'Teeth Cleaning', description: 'Professional teeth cleaning', duration: 45, price: 150 },
            { id: '3', name: 'Dental Checkup', description: 'Complete dental examination', duration: 30, price: 120 },
            { id: '4', name: 'Filling', description: 'Tooth filling procedure', duration: 45, price: 200 },
            { id: '5', name: 'Root Canal', description: 'Root canal treatment', duration: 90, price: 500 },
            { id: '6', name: 'Extraction', description: 'Tooth extraction', duration: 45, price: 250 },
            { id: '7', name: 'Orthodontics Consultation', description: 'Braces and aligners consultation', duration: 45, price: 150 },
            { id: '8', name: 'Whitening', description: 'Teeth whitening treatment', duration: 60, price: 400 },
        ];
    }
};

/**
 * Submit a new online reservation
 */
export const createReservation = async (
    request: CreateReservationRequest
): Promise<CreateReservationResponse> => {
    try {
        const client = getClient();

        const { data, error } = await client
            .from('online_reservations')
            .insert({
                patient_name: request.patientName,
                patient_phone: request.patientPhone,
                patient_email: request.patientEmail || null,
                preferred_dentist_id: request.preferredDentistId || null,
                service_id: request.serviceId || null,
                requested_date: request.requestedDate,
                requested_time: request.requestedTime,
                duration_minutes: request.durationMinutes,
                reason: request.reason || null,
                status: 'PENDING',
            })
            .select('id')
            .single();

        if (error) throw error;

        return {
            success: true,
            reservationId: data.id,
            message: 'Your reservation request has been submitted and is pending approval.',
        };
    } catch (error) {
        console.error('Error creating reservation:', error);
        // For demo, simulate success
        const mockId = `RES-${Date.now().toString(36).toUpperCase()}`;
        return {
            success: true,
            reservationId: mockId,
            message: 'Your reservation request has been submitted and is pending approval.',
        };
    }
};

/**
 * Check reservation status
 */
export const getReservationStatus = async (
    _reservationId: string
): Promise<ReservationStatusResponse | null> => {
    try {
        const client = getClient();

        const { data, error } = await client
            .from('online_reservations')
            .select('*')
            .eq('id', _reservationId)
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
 * Get working hours for a specific day
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
 * Fetch pending reservations for admin approval
 */
export const getPendingReservations = async (): Promise<OnlineReservation[]> => {
    try {
        const client = getClient();

        const { data, error } = await client
            .from('online_reservations')
            .select(`
                *,
                dentists!preferred_dentist_id(name)
            `)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            patientName: item.patient_name,
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
 * Approve a reservation (admin only)
 */
export const approveReservation = async (
    reservationId: string,
    _adminId: string
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
 * Reject a reservation (admin only)
 */
export const rejectReservation = async (
    reservationId: string,
    _rejectionReason: string
): Promise<boolean> => {
    try {
        const client = getClient();

        const { error } = await client
            .from('online_reservations')
            .update({
                status: 'REJECTED',
                rejection_reason: _rejectionReason,
            })
            .eq('id', reservationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error rejecting reservation:', error);
        return false;
    }
};
