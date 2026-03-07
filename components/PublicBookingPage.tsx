import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { BookingService, TimeSlot } from '../types';
import {
  createReservation,
  getAvailableDentists,
  getAvailableServices,
  getAvailableSlots,
  getPublicBookingContext,
} from '../services/publicBookingService';

type DentistOption = {
  id: string;
  name: string;
  specialty: string;
};

const PublicBookingPage: React.FC = () => {
  const { t, locale, setLocale } = useI18n();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const clinicId = params.get('clinicId') || undefined;
  const branchId = params.get('branchId') || undefined;

  const fallbackClinicName = params.get('clinic') || '';
  const fallbackBranchName = params.get('branch') || '';
  const fallbackDisplayName = fallbackBranchName || fallbackClinicName || t('appName');
  const fallbackPhone = params.get('phone') || '';
  const fallbackAddress = params.get('address') || '';
  const fallbackEmail = params.get('email') || '';

  const [services, setServices] = useState<BookingService[]>([]);
  const [dentists, setDentists] = useState<DentistOption[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookingContext, setBookingContext] = useState<Awaited<ReturnType<typeof getPublicBookingContext>>>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    serviceId: '',
    dentistId: '',
    date: '',
    time: '',
    patientName: '',
    patientDob: '',
    patientGender: '',
    patientPhone: '',
    patientEmail: '',
    reason: '',
  });

  useEffect(() => {
    const lang = params.get('lang');
    if ((lang === 'ar' || lang === 'en') && lang !== locale) {
      setLocale(lang);
    }
  }, [locale, params, setLocale]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [contextData, serviceData, dentistData] = await Promise.all([
        getPublicBookingContext({ clinicId, branchId }),
        getAvailableServices({ clinicId, branchId }),
        getAvailableDentists({ clinicId, branchId }),
      ]);

      if (cancelled) return;

      setBookingContext(contextData);
      setServices(serviceData);
      setDentists(dentistData);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [branchId, clinicId]);

  useEffect(() => {
    if (!form.date) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    const loadSlots = async () => {
      const response = await getAvailableSlots(
        form.date,
        form.dentistId || undefined,
        { clinicId, branchId },
      );

      if (cancelled) return;

      setSlots(response.slots.filter((slot) => slot.available));
    };

    void loadSlots();

    return () => {
      cancelled = true;
    };
  }, [branchId, clinicId, form.date, form.dentistId]);

  const service = services.find((item) => item.id === form.serviceId);
  const displayName = bookingContext?.displayName || fallbackDisplayName;
  const clinicName = bookingContext?.clinicName || fallbackClinicName || displayName;
  const branchName = bookingContext?.branchName || fallbackBranchName || '';
  const clinicPhone = bookingContext?.phone || fallbackPhone;
  const clinicAddress = bookingContext?.address || fallbackAddress;
  const clinicEmail = bookingContext?.email || fallbackEmail;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.serviceId ||
      !form.date ||
      !form.time ||
      !form.patientName.trim() ||
      !form.patientDob ||
      !form.patientGender ||
      !form.patientPhone.trim()
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const response = await createReservation({
      clinicId,
      branchId,
      patientName: form.patientName.trim(),
      patientDob: form.patientDob || undefined,
      patientGender: form.patientGender as 'Male' | 'Female' | 'Other',
      patientPhone: form.patientPhone.trim(),
      patientEmail: form.patientEmail.trim() || undefined,
      preferredDentistId: form.dentistId || undefined,
      serviceId: form.serviceId,
      requestedDate: form.date,
      requestedTime: form.time,
      durationMinutes: service?.duration || 30,
      reason: form.reason.trim() || undefined,
    });

    setSubmitting(false);

    if (response.success) {
      setReservationId(response.reservationId);
      return;
    }

    setSubmitError(response.message || (locale === 'ar' ? 'تعذر إرسال طلب الحجز.' : 'Failed to submit reservation request.'));
  };

  if (reservationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl dark:border-emerald-500/20 dark:bg-slate-900">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('publicBooking.requestSubmitted') || 'Request Submitted!'}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {t('publicBooking.successMessage') || 'Your appointment request has been received and is pending staff approval. We will contact you shortly.'}
          </p>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-start dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>{t('publicBooking.reservationId') || 'Reservation ID'}:</strong> {reservationId}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <strong>{t('publicBooking.status') || 'Status'}:</strong> {t('publicBooking.pendingApproval') || 'Pending Approval'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-emerald-200 bg-white p-8 shadow-xl dark:border-emerald-500/20 dark:bg-slate-900">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{displayName}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t('publicBooking.subtitle') || 'Schedule your visit online'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
            {clinicName && clinicName !== displayName && <span>{clinicName}</span>}
            {branchName && <span>{branchName}</span>}
            {clinicPhone && <a href={`tel:${clinicPhone}`}>{clinicPhone}</a>}
            {clinicEmail && <a href={`mailto:${clinicEmail}`}>{clinicEmail}</a>}
            {clinicAddress && <span>{clinicAddress}</span>}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('publicBooking.title') || 'Book Your Appointment'}
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t('common.loading') || 'Loading...'}
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                <select
                  value={form.serviceId}
                  onChange={(event) => handleChange('serviceId', event.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{t('publicBooking.selectService') || 'Select a Service'}</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.dentistId}
                  onChange={(event) => handleChange('dentistId', event.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{t('publicBooking.anyDentist') || 'Any Available Dentist'}</option>
                  {dentists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.specialty}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => handleChange('date', event.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <select
                  value={form.time}
                  onChange={(event) => handleChange('time', event.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{t('publicBooking.selectTime') || 'Select a Time'}</option>
                  {slots.map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time}
                      {slot.dentistName ? ` - ${slot.dentistName}` : ''}
                    </option>
                  ))}
                </select>
                <input
                  value={form.patientName}
                  onChange={(event) => handleChange('patientName', event.target.value)}
                  placeholder={t('publicBooking.namePlaceholder') || 'Enter your full name'}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  type="date"
                  value={form.patientDob}
                  onChange={(event) => handleChange('patientDob', event.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <select
                  value={form.patientGender}
                  onChange={(event) => handleChange('patientGender', event.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{locale === 'ar' ? 'النوع' : 'Gender'}</option>
                  <option value="Male">{locale === 'ar' ? 'ذكر' : 'Male'}</option>
                  <option value="Female">{locale === 'ar' ? 'أنثى' : 'Female'}</option>
                  <option value="Other">{locale === 'ar' ? 'أخرى' : 'Other'}</option>
                </select>
                <input
                  value={form.patientPhone}
                  onChange={(event) => handleChange('patientPhone', event.target.value)}
                  placeholder={t('publicBooking.phonePlaceholder') || 'Enter your phone number'}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  value={form.patientEmail}
                  onChange={(event) => handleChange('patientEmail', event.target.value)}
                  placeholder={t('publicBooking.emailPlaceholder') || 'Enter your email (optional)'}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                <textarea
                  value={form.reason}
                  onChange={(event) => handleChange('reason', event.target.value)}
                  rows={4}
                  placeholder={t('publicBooking.reasonPlaceholder') || 'Describe your reason for visiting (optional)'}
                  className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
                {submitError && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {submitError}
                  </p>
                )}
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting
                    ? (t('publicBooking.submitting') || 'Submitting...')
                    : (t('publicBooking.submitRequest') || 'Submit Appointment Request')}
                </button>
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('publicBooking.bookingSummary') || 'Booking Summary'}
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p><strong>{t('publicBooking.service') || 'Service'}:</strong> {service?.name || '-'}</p>
              <p><strong>{t('publicBooking.dentist') || 'Dentist'}:</strong> {dentists.find((item) => item.id === form.dentistId)?.name || (t('publicBooking.anyDentist') || 'Any Available Dentist')}</p>
              <p><strong>{t('publicBooking.date') || 'Date'}:</strong> {form.date || '-'}</p>
              <p><strong>{t('publicBooking.time') || 'Time'}:</strong> {form.time || '-'}</p>
              <p><strong>{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}:</strong> {form.patientDob || '-'}</p>
              <p><strong>{locale === 'ar' ? 'النوع' : 'Gender'}:</strong> {form.patientGender || '-'}</p>
              <p><strong>{t('publicBooking.duration') || 'Duration'}:</strong> {service?.duration || 30} min</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default PublicBookingPage;
