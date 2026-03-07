import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { AppointmentStatus, NotificationType, OnlineReservation, Patient } from '../types';
import {
  approveReservation,
  getPendingReservations,
  rejectReservation,
} from '../services/publicBookingService';
import { supabase } from '../supabaseClient';

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

interface PendingReservationsPageProps {
  clinicData: ClinicData;
}

interface ApprovalDialogState {
  reservation: OnlineReservation;
  selectedDentistId: string;
  matchedPatientId: string | null;
  matchedPatientLabel: string | null;
}

type WhatsAppDraftWindow = Window | null;

const PendingReservationsPage: React.FC<PendingReservationsPageProps> = ({ clinicData }) => {
  const { t, locale } = useI18n();
  const { user, currentClinic, currentBranch } = useAuth();
  const { addNotification } = useNotification();
  const [reservations, setReservations] = useState<OnlineReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState | null>(null);

  const clinicName = currentClinic?.name || clinicData.clinicInfo.name || t('appName');
  const clinicPhone = currentBranch?.phone || currentClinic?.phone || clinicData.clinicInfo.phone || '';
  const clinicAddress = currentBranch?.address || currentClinic?.address || clinicData.clinicInfo.address || '';
  const clinicEmail = currentBranch?.email || currentClinic?.email || clinicData.clinicInfo.email || '';

  const bookingUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    if (currentClinic?.id) params.set('clinicId', currentClinic.id);
    if (currentBranch?.id) params.set('branchId', currentBranch.id);
    if (currentClinic?.name || clinicData.clinicInfo.name) {
      params.set('clinic', currentClinic?.name || clinicData.clinicInfo.name);
    }
    if (currentBranch?.name) {
      params.set('branch', currentBranch.name);
    }
    if (clinicPhone) {
      params.set('phone', clinicPhone);
    }
    if (clinicEmail) {
      params.set('email', clinicEmail);
    }
    if (clinicAddress) {
      params.set('address', clinicAddress);
    }
    params.set('lang', locale);
    return `${window.location.origin}/online-booking.html?${params.toString()}`;
  }, [
    clinicAddress,
    clinicData.clinicInfo.name,
    clinicEmail,
    clinicPhone,
    currentBranch?.id,
    currentBranch?.name,
    currentClinic?.id,
    currentClinic?.name,
    locale,
  ]);

  const bookingQrUrl = useMemo(() => {
    if (!bookingUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bookingUrl)}`;
  }, [bookingUrl]);

  const handleDownloadQr = useCallback(async () => {
    if (!bookingQrUrl) return;

    try {
      const response = await fetch(bookingQrUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const branchOrClinicName = (currentBranch?.name || currentClinic?.name || 'booking').replace(/[^\w\u0600-\u06FF-]+/g, '-');

      link.href = objectUrl;
      link.download = `${branchOrClinicName}-booking-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      addNotification({
        message: 'تم حفظ QR code كصورة بنجاح.',
        type: NotificationType.SUCCESS,
      });
    } catch (error) {
      addNotification({
        message: 'فشل حفظ QR code كصورة.',
        type: NotificationType.ERROR,
      });
    }
  }, [addNotification, bookingQrUrl, currentBranch?.name, currentClinic?.name]);

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    const data = await getPendingReservations({
      clinicId: currentClinic?.id,
      branchId: currentBranch?.id || undefined,
    });
    setReservations(data);
    setIsLoading(false);
  }, [currentBranch?.id, currentClinic?.id]);

  const normalizePhone = useCallback((value?: string | null) => (value || '').replace(/[^\d+]/g, '').trim(), []);
  const normalizeName = useCallback((value?: string | null) => (value || '').trim().toLowerCase(), []);

  const findMatchingPatient = useCallback((reservation: OnlineReservation): Patient | null => {
    const reservationPhone = normalizePhone(reservation.patientPhone);
    const reservationName = normalizeName(reservation.patientName);

    const byPhone = clinicData.patients.find(patient => {
      return reservationPhone && normalizePhone(patient.phone) === reservationPhone;
    });
    if (byPhone) return byPhone;

    const byName = clinicData.patients.find(patient => normalizeName(patient.name) === reservationName);
    return byName || null;
  }, [clinicData.patients, normalizeName, normalizePhone]);

  const buildAppointmentDateRange = useCallback((reservation: OnlineReservation) => {
    const start = new Date(`${reservation.requestedDate}T${reservation.requestedTime}`);
    const end = new Date(start.getTime() + reservation.durationMinutes * 60 * 1000);
    return { start, end };
  }, []);

  const formatWhatsAppPhone = useCallback((value?: string | null) => {
    const rawValue = (value || '').trim();
    if (!rawValue) return null;

    const hadPlusPrefix = rawValue.startsWith('+');
    let digits = rawValue.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }

    if (hadPlusPrefix) {
      return digits;
    }

    if (digits.startsWith('20')) {
      return digits;
    }

    if (digits.startsWith('0')) {
      return `20${digits.slice(1)}`;
    }

    return digits;
  }, []);

  const buildApprovalWhatsAppMessage = useCallback((reservation: OnlineReservation, dentistId: string) => {
    const dentistName = clinicData.dentists.find(dentist => dentist.id === dentistId)?.name
      || reservation.dentistName
      || (t('publicBooking.anyDentist') || 'Any Available Dentist');

    const appointmentDate = new Date(`${reservation.requestedDate}T00:00:00`).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const fallbackTemplate = locale === 'ar'
      ? 'مرحباً {patientName}، تم تأكيد موعدك في {clinicName} يوم {appointmentDate} الساعة {appointmentTime} مع {doctorName}. العنوان: {clinicAddress}. للاستفسار: {clinicPhone}'
      : 'Hello {patientName}, your appointment at {clinicName} has been confirmed for {appointmentDate} at {appointmentTime} with {doctorName}. Address: {clinicAddress}. Phone: {clinicPhone}';

    const template = clinicData.reminderMessageTemplate || clinicData.whatsappMessageTemplate || fallbackTemplate;

    return template
      .replace(/\{patientName\}/g, reservation.patientName || '')
      .replace(/\{clinicName\}/g, clinicName || '')
      .replace(/\{clinicAddress\}/g, clinicAddress || '')
      .replace(/\{clinicPhone\}/g, clinicPhone || '')
      .replace(/\{appointmentDate\}/g, appointmentDate)
      .replace(/\{appointmentTime\}/g, reservation.requestedTime || '')
      .replace(/\{doctorName\}/g, dentistName || '');
  }, [
    clinicAddress,
    clinicData.dentists,
    clinicData.reminderMessageTemplate,
    clinicData.whatsappMessageTemplate,
    clinicName,
    clinicPhone,
    locale,
    t,
  ]);

  const openWhatsAppDraftWindow = useCallback((reservation: OnlineReservation): WhatsAppDraftWindow => {
    if (typeof window === 'undefined' || !reservation.patientPhone?.trim()) {
      return null;
    }

    return window.open('about:blank', '_blank');
  }, []);

  const launchApprovalWhatsApp = useCallback((
    reservation: OnlineReservation,
    dentistId: string,
    draftWindow?: WhatsAppDraftWindow,
  ) => {
    const whatsappPhone = formatWhatsAppPhone(reservation.patientPhone);
    if (!whatsappPhone) {
      if (draftWindow && !draftWindow.closed) {
        draftWindow.close();
      }
      addNotification({
        message: locale === 'ar'
          ? 'تمت الموافقة على الموعد لكن رقم واتساب للمريض غير صالح.'
          : 'Appointment approved, but the patient WhatsApp number is invalid.',
        type: NotificationType.WARNING,
      });
      return;
    }

    const message = buildApprovalWhatsAppMessage(reservation, dentistId);
    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    if (draftWindow && !draftWindow.closed) {
      draftWindow.location.href = url;
      return;
    }

    const openedWindow = window.open(url, '_blank');
    if (!openedWindow) {
      addNotification({
        message: locale === 'ar'
          ? 'تمت الموافقة على الموعد لكن المتصفح حظر فتح واتساب.'
          : 'Appointment approved, but the browser blocked opening WhatsApp.',
        type: NotificationType.WARNING,
      });
    }
  }, [addNotification, buildApprovalWhatsAppMessage, formatWhatsAppPhone, locale]);

  const fetchCreatedPatientId = useCallback(async (reservation: OnlineReservation): Promise<string | null> => {
    if (!supabase) return null;

    let query = supabase
      .from('patients')
      .select('id,name,phone,created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (currentClinic?.id) {
      query = query.eq('clinic_id', currentClinic.id);
    }
    if (currentBranch?.id) {
      query = query.eq('branch_id', currentBranch.id);
    }

    const phone = reservation.patientPhone.trim();
    if (phone) {
      const { data } = await query.eq('phone', phone);
      if (data?.[0]?.id) return data[0].id;
    }

    let fallbackQuery = supabase
      .from('patients')
      .select('id,name,created_at')
      .eq('name', reservation.patientName.trim())
      .order('created_at', { ascending: false })
      .limit(10);

    if (currentClinic?.id) {
      fallbackQuery = fallbackQuery.eq('clinic_id', currentClinic.id);
    }
    if (currentBranch?.id) {
      fallbackQuery = fallbackQuery.eq('branch_id', currentBranch.id);
    }

    const { data: fallbackData } = await fallbackQuery;
    return fallbackData?.[0]?.id || null;
  }, [currentBranch?.id, currentClinic?.id]);

  const completeApproval = useCallback(async (
    reservation: OnlineReservation,
    patientId: string,
    dentistId: string,
    whatsappDraftWindow?: WhatsAppDraftWindow,
  ) => {
    try {
    const { start, end } = buildAppointmentDateRange(reservation);

    await clinicData.addAppointment({
      patientId,
      dentistId,
      startTime: start,
      endTime: end,
      reason: reservation.reason || 'Online reservation',
      status: AppointmentStatus.SCHEDULED,
      reminderTime: 'none',
    });

    if (!supabase) {
      if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
        whatsappDraftWindow.close();
      }
      addNotification({
        message: 'تعذر التحقق من إنشاء الموعد.',
        type: NotificationType.ERROR,
      });
      return false;
    }

    let appointmentQuery = supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('dentist_id', dentistId)
      .eq('start_time', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (currentClinic?.id) {
      appointmentQuery = appointmentQuery.eq('clinic_id', currentClinic.id);
    }
    if (currentBranch?.id) {
      appointmentQuery = appointmentQuery.eq('branch_id', currentBranch.id);
    }

    const { data: appointmentRows, error: appointmentError } = await appointmentQuery;
    const createdAppointmentId = appointmentRows?.[0]?.id;

    if (appointmentError || !createdAppointmentId) {
      if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
        whatsappDraftWindow.close();
      }
      addNotification({
        message: 'فشل إنشاء الموعد في الجدول.',
        type: NotificationType.ERROR,
      });
      return false;
    }

    await supabase
      .from('appointments')
      .update({ online_reservation_id: reservation.id })
      .eq('id', createdAppointmentId);

    const success = await approveReservation(reservation.id, user?.id || '');
    if (!success) {
      if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
        whatsappDraftWindow.close();
      }
      addNotification({
        message: t('onlineReservations.approveFailed') || 'Failed to approve reservation.',
        type: NotificationType.ERROR,
      });
      return false;
    }

    setReservations(prev => prev.filter(item => item.id !== reservation.id));
    launchApprovalWhatsApp(reservation, dentistId, whatsappDraftWindow);
    addNotification({
      message: t('onlineReservations.approved') || 'Reservation approved.',
      type: NotificationType.SUCCESS,
    });
    return true;
    } catch (error) {
      if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
        whatsappDraftWindow.close();
      }
      addNotification({
        message: error instanceof Error ? error.message : (t('onlineReservations.approveFailed') || 'Failed to approve reservation.'),
        type: NotificationType.ERROR,
      });
      return false;
    }
  }, [addNotification, buildAppointmentDateRange, clinicData, currentBranch?.id, currentClinic?.id, launchApprovalWhatsApp, t, user?.id]);

  const handleCreatePatientAndApprove = useCallback(async () => {
    if (!approvalDialog) return;

    const { reservation, selectedDentistId, matchedPatientId } = approvalDialog;
    setActiveReservationId(reservation.id);
    const whatsappDraftWindow = openWhatsAppDraftWindow(reservation);

    try {
      let patientId = matchedPatientId;

      if (!patientId) {
        await clinicData.addPatient({
          name: reservation.patientName.trim(),
          dob: reservation.patientDob || '',
          gender: reservation.patientGender || 'Other',
          phone: reservation.patientPhone.trim(),
          email: reservation.patientEmail?.trim() || '',
          address: '',
          medicalHistory: '',
          treatmentNotes: reservation.reason || '',
          lastVisit: '',
          allergies: '',
          medications: '',
          insuranceProvider: '',
          insurancePolicyNumber: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          images: [],
          attachments: [],
        });

        patientId = await fetchCreatedPatientId(reservation);
        if (!patientId) {
          addNotification({
            message: 'تم إنشاء المريض لكن تعذر العثور عليه لإضافة الموعد.',
            type: NotificationType.ERROR,
          });
          if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
            whatsappDraftWindow.close();
          }
          return;
        }
      }

      const completed = await completeApproval(reservation, patientId, selectedDentistId, whatsappDraftWindow);
      if (completed) {
        setApprovalDialog(null);
      }
    } finally {
      setActiveReservationId(null);
    }
  }, [addNotification, approvalDialog, clinicData, completeApproval, fetchCreatedPatientId, openWhatsAppDraftWindow]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const copyBookingUrl = useCallback(async () => {
    if (!bookingUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bookingUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = bookingUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      addNotification({
        message: t('onlineReservations.linkCopied') || 'Reservation link copied.',
        type: NotificationType.SUCCESS,
      });
    } catch (error) {
      addNotification({
        message: t('onlineReservations.copyFailed') || 'Failed to copy reservation link.',
        type: NotificationType.ERROR,
      });
    }
  }, [addNotification, bookingUrl, t]);

  const openBookingPage = useCallback(() => {
    if (!bookingUrl) return;
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  }, [bookingUrl]);

  const handleApprove = useCallback(async (reservation: OnlineReservation) => {
    if (!user?.id) return;
    const matchedPatient = findMatchingPatient(reservation);
    const hasPreferredDentist = reservation.preferredDentistId && clinicData.dentists.some(dentist => dentist.id === reservation.preferredDentistId);
    const defaultDentistId = hasPreferredDentist
      ? reservation.preferredDentistId!
      : (clinicData.dentists[0]?.id || '');

    if (!defaultDentistId) {
      addNotification({
        message: 'لا يوجد طبيب متاح لإنشاء الموعد.',
        type: NotificationType.ERROR,
      });
      return;
    }

    if (!matchedPatient || !hasPreferredDentist) {
      setApprovalDialog({
        reservation,
        selectedDentistId: defaultDentistId,
        matchedPatientId: matchedPatient?.id || null,
        matchedPatientLabel: matchedPatient ? `${matchedPatient.name} - ${matchedPatient.phone}` : null,
      });
      return;
    }

    setActiveReservationId(reservation.id);
    const whatsappDraftWindow = openWhatsAppDraftWindow(reservation);
    try {
      await completeApproval(reservation, matchedPatient.id, defaultDentistId, whatsappDraftWindow);
    } finally {
      setActiveReservationId(null);
    }
  }, [addNotification, clinicData.dentists, completeApproval, findMatchingPatient, openWhatsAppDraftWindow, user?.id]);

  const handleReject = useCallback(async (reservation: OnlineReservation) => {
    const reason = window.prompt(t('onlineReservations.rejectPrompt') || 'Reason for rejection (optional):', '') ?? '';
    setActiveReservationId(reservation.id);
    const success = await rejectReservation(reservation.id, reason);
    setActiveReservationId(null);
    if (!success) {
      addNotification({
        message: t('onlineReservations.rejectFailed') || 'Failed to reject reservation.',
        type: NotificationType.ERROR,
      });
      return;
    }
    setReservations(prev => prev.filter(item => item.id !== reservation.id));
    addNotification({
      message: t('onlineReservations.rejected') || 'Reservation rejected.',
      type: NotificationType.SUCCESS,
    });
  }, [addNotification, t]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-cyan-200/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <LinkIcon />
              <span>{t('onlineReservations.badge') || 'Shareable booking page'}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('onlineReservations.title') || 'Online Reservations'}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
              {t('onlineReservations.subtitle') || 'Share this link with patients so they can send appointment requests online.'}
            </p>
            <div className="mt-4 rounded-2xl bg-slate-950/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {t('onlineReservations.publicLink') || 'Public link'}
              </p>
              <p className="mt-2 break-all text-sm font-medium text-white">
                {bookingUrl}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[22rem]">
            <button
              type="button"
              onClick={copyBookingUrl}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
            >
              {copied
                ? (t('onlineReservations.copied') || 'Copied')
                : (t('onlineReservations.copyLink') || 'Copy link')}
            </button>
            <button
              type="button"
              onClick={openBookingPage}
              className="rounded-2xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {t('onlineReservations.openPage') || 'Open page'}
            </button>
            <button
              type="button"
              onClick={() => void loadReservations()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-slate-950/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-950/25"
            >
              <RefreshIcon />
              <span>{t('onlineReservations.refresh') || 'Refresh'}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('onlineReservations.pendingTitle') || 'Pending Requests'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('onlineReservations.pendingSubtitle') || 'Approve or reject incoming reservation requests.'}
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {reservations.length} {t('onlineReservations.requests') || 'requests'}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t('common.loading') || 'Loading...'}
              </div>
            )}

            {!isLoading && reservations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t('adminReservations.noPending') || 'No pending reservations'}
              </div>
            )}

            {!isLoading && reservations.map(reservation => {
              const isBusy = activeReservationId === reservation.id;
              return (
                <article
                  key={reservation.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {reservation.patientName}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                          {reservation.patientPhone}
                        </span>
                        {reservation.patientEmail && (
                          <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                            {reservation.patientEmail}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        {reservation.patientDob && (
                          <p>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {locale === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}:
                            </span>{' '}
                            {new Date(`${reservation.patientDob}T00:00:00`).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        {reservation.patientGender && (
                          <p>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {locale === 'ar' ? 'النوع' : 'Gender'}:
                            </span>{' '}
                            {reservation.patientGender === 'Male'
                              ? (locale === 'ar' ? 'ذكر' : 'Male')
                              : reservation.patientGender === 'Female'
                                ? (locale === 'ar' ? 'أنثى' : 'Female')
                                : (locale === 'ar' ? 'أخرى' : 'Other')}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {t('publicBooking.date') || 'Date'}:
                          </span>{' '}
                          {new Date(`${reservation.requestedDate}T00:00:00`).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {t('publicBooking.time') || 'Time'}:
                          </span>{' '}
                          {reservation.requestedTime}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {t('publicBooking.dentist') || 'Dentist'}:
                          </span>{' '}
                          {reservation.dentistName || (t('publicBooking.anyDentist') || 'Any Available Dentist')}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {t('publicBooking.duration') || 'Duration'}:
                          </span>{' '}
                          {reservation.durationMinutes} min
                        </p>
                      </div>
                      {reservation.reason && (
                        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {reservation.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleApprove(reservation)}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t('adminReservations.approve') || 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleReject(reservation)}
                        className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                      >
                        {t('adminReservations.reject') || 'Reject'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              QR Code
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              امسح الكود لفتح صفحة الحجز مباشرة.
            </p>
            <div className="mt-4 flex justify-center">
              {bookingQrUrl ? (
                <img
                  src={bookingQrUrl}
                  alt="Booking QR Code"
                  className="h-56 w-56 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  QR unavailable
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void handleDownloadQr()}
                disabled={!bookingQrUrl}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                حفظ QR كصورة
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('onlineReservations.clinicCard') || 'Shared page details'}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t('onlineReservations.clinicName') || 'Clinic'}
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{clinicName}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t('publicBooking.needHelp') || 'Need help?'}
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{clinicPhone || '-'}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{clinicEmail || clinicAddress || '-'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('onlineReservations.howItWorks') || 'How it works'}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>1. {t('onlineReservations.stepOne') || 'Copy the booking page link and send it to patients.'}</p>
              <p>2. {t('onlineReservations.stepTwo') || 'Patients submit a preferred date, time, and contact details.'}</p>
              <p>3. {t('onlineReservations.stepThree') || 'Review the pending requests here and confirm the suitable ones.'}</p>
            </div>
          </div>
        </aside>
      </section>

      {approvalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {approvalDialog.matchedPatientId ? 'استكمال الموافقة' : 'إنشاء مريض جديد'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {approvalDialog.matchedPatientId
                ? `تم العثور على مريض مطابق: ${approvalDialog.matchedPatientLabel}`
                : 'لم يتم العثور على مريض مطابق بالاسم أو رقم الهاتف. هل تريد إنشاء مريض جديد بنفس بيانات الحجز؟'}
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <p><strong>الاسم:</strong> {approvalDialog.reservation.patientName}</p>
                <p className="mt-1"><strong>الهاتف:</strong> {approvalDialog.reservation.patientPhone}</p>
                {approvalDialog.reservation.patientEmail && (
                  <p className="mt-1"><strong>البريد:</strong> {approvalDialog.reservation.patientEmail}</p>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">الطبيب</span>
                <select
                  value={approvalDialog.selectedDentistId}
                  onChange={(event) =>
                    setApprovalDialog(prev => prev ? { ...prev, selectedDentistId: event.target.value } : null)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {clinicData.dentists.map(dentist => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setApprovalDialog(null)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={activeReservationId === approvalDialog.reservation.id || !approvalDialog.selectedDentistId}
                onClick={() => void handleCreatePatientAndApprove()}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvalDialog.matchedPatientId ? 'إضافة الموعد والموافقة' : 'إنشاء المريض ثم إضافة الموعد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReservationsPage;
