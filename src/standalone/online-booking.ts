import {
  createReservation,
  getAvailableDentists,
  getAvailableServices,
  getAvailableSlots,
  getPublicBookingContext,
} from '../../services/publicBookingService';

type Scope = {
  clinicId?: string;
  branchId?: string;
};

type Copy = {
  title: string;
  subtitle: string;
  loading: string;
  missingScope: string;
  heroKicker: string;
  trustOne: string;
  trustTwo: string;
  trustThree: string;
  detailsTitle: string;
  detailsSubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
  service: string;
  dentist: string;
  anyDentist: string;
  date: string;
  time: string;
  noTimes: string;
  loadingTimes: string;
  name: string;
  dob: string;
  gender: string;
  male: string;
  female: string;
  other: string;
  phone: string;
  email: string;
  reason: string;
  submit: string;
  submitting: string;
  summary: string;
  summaryHint: string;
  clinicInfo: string;
  branchInfo: string;
  address: string;
  selectedService: string;
  selectedDentist: string;
  selectedDate: string;
  selectedTime: string;
  selectedDob: string;
  selectedGender: string;
  contactInfo: string;
  notSelected: string;
  notesHint: string;
  success: string;
  successBody: string;
  reservationId: string;
  errorFallback: string;
};

const params = new URLSearchParams(window.location.search);
const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
const scope: Scope = {
  clinicId: params.get('clinicId') || undefined,
  branchId: params.get('branchId') || undefined,
};

const copy: Copy = lang === 'ar'
  ? {
      title: 'احجز موعدك بسهولة',
      subtitle: 'اختر الخدمة والتاريخ والوقت المناسب ثم أرسل طلب الحجز مباشرة إلى العيادة.',
      loading: 'يتم تجهيز صفحة الحجز...',
      missingScope: 'رابط الحجز لا يحتوي على بيانات العيادة.',
      heroKicker: 'الحجز الإلكتروني',
      trustOne: 'تأكيد أسرع للموعد',
      trustTwo: 'رابط مخصص لكل عيادة أو فرع',
      trustThree: 'يعمل على الجوال والكمبيوتر',
      detailsTitle: 'تفاصيل الموعد',
      detailsSubtitle: 'حدد الخدمة والطبيب والوقت المناسب لك.',
      contactTitle: 'بيانات المريض',
      contactSubtitle: 'ستستخدم العيادة هذه البيانات لتأكيد الحجز معك.',
      service: 'الخدمة',
      dentist: 'الطبيب',
      anyDentist: 'أي طبيب متاح',
      date: 'التاريخ',
      time: 'الوقت',
      noTimes: 'لا توجد أوقات متاحة في هذا التاريخ',
      loadingTimes: 'يتم تحميل الأوقات المتاحة...',
      name: 'الاسم الكامل',
      dob: 'تاريخ الميلاد',
      gender: 'النوع',
      male: 'ذكر',
      female: 'أنثى',
      other: 'أخرى',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      reason: 'سبب الزيارة',
      submit: 'إرسال طلب الحجز',
      submitting: 'جارٍ الإرسال...',
      summary: 'ملخص الحجز',
      summaryHint: 'ستظهر هنا التفاصيل التي اخترتها قبل الإرسال.',
      clinicInfo: 'العيادة',
      branchInfo: 'الفرع',
      address: 'العنوان',
      selectedService: 'الخدمة المختارة',
      selectedDentist: 'الطبيب المختار',
      selectedDate: 'التاريخ المختار',
      selectedTime: 'الوقت المختار',
      selectedDob: 'تاريخ الميلاد',
      selectedGender: 'النوع',
      contactInfo: 'وسيلة التواصل',
      notSelected: 'لم يتم الاختيار بعد',
      notesHint: 'ملاحظات اختيارية تساعد العيادة على تجهيز زيارتك.',
      success: 'تم إرسال طلب الحجز بنجاح',
      successBody: 'يمكن لفريق العيادة الآن مراجعة الطلب والتواصل معك لتأكيد الموعد.',
      reservationId: 'رقم الحجز',
      errorFallback: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    }
  : {
      title: 'Reserve Your Visit',
      subtitle: 'Pick the service, date, and time that fit your schedule and send your booking request online.',
      loading: 'Preparing your booking experience...',
      missingScope: 'This booking link is missing clinic information.',
      heroKicker: 'Online Reservation',
      trustOne: 'Fast confirmation',
      trustTwo: 'Clinic-specific booking link',
      trustThree: 'Works on mobile and desktop',
      detailsTitle: 'Appointment details',
      detailsSubtitle: 'Select the service, provider, and preferred slot.',
      contactTitle: 'Patient details',
      contactSubtitle: 'We will use these details to confirm the reservation.',
      service: 'Service',
      dentist: 'Dentist',
      anyDentist: 'Any available dentist',
      date: 'Date',
      time: 'Time',
      noTimes: 'No available times for this date',
      loadingTimes: 'Loading available times...',
      name: 'Full name',
      dob: 'Date of birth',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      phone: 'Phone number',
      email: 'Email address',
      reason: 'Reason for visit',
      submit: 'Send reservation request',
      submitting: 'Submitting...',
      summary: 'Reservation summary',
      summaryHint: 'Your selected details will appear here before submission.',
      clinicInfo: 'Clinic',
      branchInfo: 'Branch',
      address: 'Address',
      selectedService: 'Selected service',
      selectedDentist: 'Selected dentist',
      selectedDate: 'Selected date',
      selectedTime: 'Selected time',
      selectedDob: 'Date of birth',
      selectedGender: 'Gender',
      contactInfo: 'Contact',
      notSelected: 'Not selected yet',
      notesHint: 'Optional notes to help the clinic prepare for your visit.',
      success: 'Reservation request sent successfully',
      successBody: 'The clinic team can now review your request and contact you to confirm the appointment.',
      reservationId: 'Reservation ID',
      errorFallback: 'Something went wrong. Please try again.',
    };

const fallbackContext = {
  clinicName: params.get('clinic') || '',
  branchName: params.get('branch') || '',
  displayName: params.get('branch') || params.get('clinic') || '',
  phone: params.get('phone') || '',
  email: params.get('email') || '',
  address: params.get('address') || '',
};

document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.body.dataset.lang = lang;
document.title = copy.title;

const app = document.getElementById('app');

if (!app) {
  throw new Error('Missing app root');
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const field = (label: string, control: string) => `
  <label class="booking-field">
    <span class="booking-label">${escapeHtml(label)}</span>
    ${control}
  </label>
`;

const formatMeta = (parts: Array<string | null | undefined>) =>
  parts
    .filter((value): value is string => Boolean(value))
    .map((value) => escapeHtml(value))
    .join('<span class="booking-dot"></span>');

const formatDateValue = (value: FormDataEntryValue | null) => {
  if (!value || typeof value !== 'string') return copy.notSelected;
  return escapeHtml(value);
};

const renderShell = (content: string) => {
  app.innerHTML = `
    <main class="booking-page">
      ${content}
    </main>
  `;
};

const renderMessageState = (title: string, body: string) => {
  renderShell(`
    <section class="booking-panel booking-panel--message">
      <div class="booking-icon-badge">+</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(body)}</p>
    </section>
  `);
};

const renderLoadingState = () => {
  renderShell(`
    <section class="booking-hero booking-hero--loading">
      <div class="booking-hero__content">
        <span class="booking-kicker">${escapeHtml(copy.heroKicker)}</span>
        <h1>${escapeHtml(copy.title)}</h1>
        <p>${escapeHtml(copy.loading)}</p>
      </div>
      <div class="booking-hero__glow"></div>
    </section>
  `);
};

const renderSuccessState = (reservationId: string) => {
  renderShell(`
    <section class="booking-panel booking-panel--success">
      <div class="booking-success-mark">&#10003;</div>
      <span class="booking-kicker">${escapeHtml(copy.heroKicker)}</span>
      <h1>${escapeHtml(copy.success)}</h1>
      <p>${escapeHtml(copy.successBody)}</p>
      <div class="booking-success-id">
        <span>${escapeHtml(copy.reservationId)}</span>
        <strong>${escapeHtml(reservationId)}</strong>
      </div>
    </section>
  `);
};

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const genderLabel = (value: string) => {
  if (value === 'Male') return copy.male;
  if (value === 'Female') return copy.female;
  if (value === 'Other') return copy.other;
  return copy.notSelected;
};

const renderState = async () => {
  if (!scope.clinicId && !scope.branchId) {
    renderMessageState(copy.title, copy.missingScope);
    return;
  }

  renderLoadingState();

  const [bookingContext, services, dentists] = await Promise.all([
    getPublicBookingContext(scope),
    getAvailableServices(scope),
    getAvailableDentists(scope),
  ]);

  const clinicName = bookingContext?.clinicName || fallbackContext.clinicName || copy.clinicInfo;
  const branchName = bookingContext?.branchName || fallbackContext.branchName;
  const displayName = bookingContext?.displayName || fallbackContext.displayName || clinicName;
  const clinicAddress = bookingContext?.address || fallbackContext.address;
  const clinicMeta = formatMeta([
    bookingContext?.phone || fallbackContext.phone,
    bookingContext?.email || fallbackContext.email,
    clinicAddress,
  ]);

  renderShell(`
    <section class="booking-hero">
      <div class="booking-hero__content">
        <span class="booking-kicker">${escapeHtml(copy.heroKicker)}</span>
        <h1>${escapeHtml(displayName)}</h1>
        <p>${escapeHtml(copy.subtitle)}</p>
        <div class="booking-meta">
          <span class="booking-meta__item">${escapeHtml(copy.trustOne)}</span>
          <span class="booking-meta__item">${escapeHtml(copy.trustTwo)}</span>
          <span class="booking-meta__item">${escapeHtml(copy.trustThree)}</span>
        </div>
        ${clinicMeta ? `<div class="booking-contact-strip">${clinicMeta}</div>` : ''}
      </div>
      <div class="booking-hero__card">
        <div class="booking-hero__stat">
          <span>${escapeHtml(copy.clinicInfo)}</span>
          <strong>${escapeHtml(clinicName)}</strong>
        </div>
        ${branchName ? `<div class="booking-hero__stat"><span>${escapeHtml(copy.branchInfo)}</span><strong>${escapeHtml(branchName)}</strong></div>` : ''}
        ${clinicAddress ? `<div class="booking-hero__stat"><span>${escapeHtml(copy.address)}</span><strong>${escapeHtml(clinicAddress)}</strong></div>` : ''}
      </div>
      <div class="booking-hero__glow"></div>
    </section>
    <section class="booking-layout">
      <form id="booking-form" class="booking-panel booking-form">
        <div class="booking-section-heading">
          <span class="booking-section-index">01</span>
          <div>
            <h2>${escapeHtml(copy.detailsTitle)}</h2>
            <p>${escapeHtml(copy.detailsSubtitle)}</p>
          </div>
        </div>
        <div class="booking-grid booking-grid--two">
          ${field(
            copy.service,
            `<select name="serviceId" class="booking-control" required>
              <option value="">${escapeHtml(copy.service)}</option>
              ${services.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}
            </select>`,
          )}
          ${field(
            copy.dentist,
            `<select name="dentistId" class="booking-control">
              <option value="">${escapeHtml(copy.anyDentist)}</option>
              ${dentists
                .map((item) => {
                  const specialty = item.specialty ? ` - ${item.specialty}` : '';
                  return `<option value="${escapeHtml(item.id)}">${escapeHtml(`${item.name}${specialty}`)}</option>`;
                })
                .join('')}
            </select>`,
          )}
          ${field(
            copy.date,
            `<input name="date" class="booking-control" type="date" min="${getToday()}" required />`,
          )}
          ${field(
            copy.time,
            `<select name="time" class="booking-control" required>
              <option value="">${escapeHtml(copy.time)}</option>
            </select>`,
          )}
        </div>

        <div class="booking-section-heading booking-section-heading--spaced">
          <span class="booking-section-index">02</span>
          <div>
            <h2>${escapeHtml(copy.contactTitle)}</h2>
            <p>${escapeHtml(copy.contactSubtitle)}</p>
          </div>
        </div>
        <div class="booking-grid booking-grid--two">
          ${field(copy.name, `<input name="patientName" class="booking-control" placeholder="${escapeHtml(copy.name)}" required />`)}
          ${field(copy.dob, `<input name="patientDob" class="booking-control" type="date" max="${getToday()}" required />`)}
          ${field(
            copy.gender,
            `<select name="patientGender" class="booking-control" required>
              <option value="">${escapeHtml(copy.gender)}</option>
              <option value="Male">${escapeHtml(copy.male)}</option>
              <option value="Female">${escapeHtml(copy.female)}</option>
              <option value="Other">${escapeHtml(copy.other)}</option>
            </select>`,
          )}
          ${field(copy.phone, `<input name="patientPhone" class="booking-control" placeholder="${escapeHtml(copy.phone)}" required />`)}
          ${field(copy.email, `<input name="patientEmail" class="booking-control" type="email" placeholder="${escapeHtml(copy.email)}" />`)}
          ${field(copy.reason, `<textarea name="reason" class="booking-control booking-control--textarea" rows="5" placeholder="${escapeHtml(copy.notesHint)}"></textarea>`)}
        </div>
        <div id="booking-feedback" class="booking-feedback" aria-live="polite"></div>
        <button type="submit" class="booking-submit">${escapeHtml(copy.submit)}</button>
      </form>

      <aside class="booking-panel booking-summary">
        <div class="booking-summary__intro">
          <span class="booking-kicker">${escapeHtml(copy.summary)}</span>
          <h2>${escapeHtml(copy.summary)}</h2>
          <p>${escapeHtml(copy.summaryHint)}</p>
        </div>
        <div id="summary-body" class="booking-summary__list"></div>
      </aside>
    </section>
  `);

  const form = document.getElementById('booking-form') as HTMLFormElement | null;
  const timeSelect = form?.elements.namedItem('time') as HTMLSelectElement | null;
  const dateInput = form?.elements.namedItem('date') as HTMLInputElement | null;
  const dentistSelect = form?.elements.namedItem('dentistId') as HTMLSelectElement | null;
  const summaryBody = document.getElementById('summary-body');
  const feedback = document.getElementById('booking-feedback');

  const updateSummary = () => {
    if (!form || !summaryBody) return;

    const values = new FormData(form);
    const selectedService = services.find((item) => item.id === values.get('serviceId'));
    const selectedDentist = dentists.find((item) => item.id === values.get('dentistId'));
    const patientName = values.get('patientName');
    const patientPhone = values.get('patientPhone');
    const patientGender = values.get('patientGender');

    const items = [
      { label: copy.selectedService, value: selectedService?.name || copy.notSelected },
      { label: copy.selectedDentist, value: selectedDentist?.name || copy.anyDentist },
      { label: copy.selectedDate, value: formatDateValue(values.get('date')) },
      { label: copy.selectedTime, value: formatDateValue(values.get('time')) },
      { label: copy.selectedDob, value: formatDateValue(values.get('patientDob')) },
      {
        label: copy.selectedGender,
        value:
          typeof patientGender === 'string' && patientGender
            ? escapeHtml(genderLabel(patientGender))
            : copy.notSelected,
      },
      {
        label: copy.contactInfo,
        value:
          typeof patientName === 'string' && patientName.trim()
            ? escapeHtml(patientPhone ? `${patientName} - ${patientPhone}` : patientName)
            : copy.notSelected,
      },
    ];

    summaryBody.innerHTML = items
      .map(
        (item) => `
          <div class="booking-summary__item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${typeof item.value === 'string' ? item.value : copy.notSelected}</strong>
          </div>
        `,
      )
      .join('');
  };

  const setFeedback = (message = '', tone: 'error' | 'neutral' = 'neutral') => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `booking-feedback${message ? ' is-visible' : ''}${tone === 'error' ? ' is-error' : ''}`;
  };

  const loadSlots = async () => {
    if (!timeSelect || !dateInput) return;

    if (!dateInput.value) {
      timeSelect.innerHTML = `<option value="">${escapeHtml(copy.time)}</option>`;
      updateSummary();
      return;
    }

    setFeedback(copy.loadingTimes);
    timeSelect.disabled = true;
    timeSelect.innerHTML = `<option value="">${escapeHtml(copy.loadingTimes)}</option>`;

    try {
      const response = await getAvailableSlots(
        dateInput.value,
        dentistSelect?.value || undefined,
        scope,
      );
      const available = response.slots.filter((slot) => slot.available);

      if (!available.length) {
        timeSelect.innerHTML = `<option value="">${escapeHtml(copy.noTimes)}</option>`;
        setFeedback(copy.noTimes);
      } else {
        timeSelect.innerHTML = `
          <option value="">${escapeHtml(copy.time)}</option>
          ${available
            .map((slot) => {
              const label = slot.dentistName ? `${slot.time} - ${slot.dentistName}` : slot.time;
              return `<option value="${escapeHtml(slot.time)}">${escapeHtml(label)}</option>`;
            })
            .join('')}
        `;
        setFeedback('');
      }
    } catch (error) {
      console.error(error);
      timeSelect.innerHTML = `<option value="">${escapeHtml(copy.noTimes)}</option>`;
      setFeedback(copy.errorFallback, 'error');
    } finally {
      timeSelect.disabled = false;
      updateSummary();
    }
  };

  dateInput?.addEventListener('change', () => void loadSlots());
  dentistSelect?.addEventListener('change', () => void loadSlots());
  form?.addEventListener('input', updateSummary);
  form?.addEventListener('change', updateSummary);
  updateSummary();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form) return;

    const values = new FormData(form);
    const selectedService = services.find((item) => item.id === values.get('serviceId'));
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = copy.submitting;
      }

      setFeedback('');

      const response = await createReservation({
        clinicId: scope.clinicId,
        branchId: scope.branchId,
        serviceId: String(values.get('serviceId') || ''),
        preferredDentistId: String(values.get('dentistId') || '') || undefined,
        requestedDate: String(values.get('date') || ''),
        requestedTime: String(values.get('time') || ''),
        patientName: String(values.get('patientName') || ''),
        patientDob: String(values.get('patientDob') || '') || undefined,
        patientGender: (String(values.get('patientGender') || '') as 'Male' | 'Female' | 'Other') || undefined,
        patientPhone: String(values.get('patientPhone') || ''),
        patientEmail: String(values.get('patientEmail') || '') || undefined,
        reason: String(values.get('reason') || '') || undefined,
        durationMinutes: selectedService?.duration || 30,
      });

      if (!response.success) {
        setFeedback(response.message || copy.errorFallback, 'error');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = copy.submit;
        }
        return;
      }

      renderSuccessState(response.reservationId);
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : copy.errorFallback, 'error');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = copy.submit;
      }
    }
  });
};

void renderState();
