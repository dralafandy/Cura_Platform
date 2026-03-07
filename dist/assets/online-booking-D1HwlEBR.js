import{g as P,a as A,b as B,e as C,d as G}from"./publicBookingService-LdXP2IpA.js";const m=new URLSearchParams(window.location.search),$=m.get("lang")==="ar"?"ar":"en",g={clinicId:m.get("clinicId")||void 0,branchId:m.get("branchId")||void 0},e=$==="ar"?{title:"احجز موعدك بسهولة",subtitle:"اختر الخدمة والتاريخ والوقت المناسب ثم أرسل طلب الحجز مباشرة إلى العيادة.",loading:"يتم تجهيز صفحة الحجز...",missingScope:"رابط الحجز لا يحتوي على بيانات العيادة.",heroKicker:"الحجز الإلكتروني",trustOne:"تأكيد أسرع للموعد",trustTwo:"رابط مخصص لكل عيادة أو فرع",trustThree:"يعمل على الجوال والكمبيوتر",detailsTitle:"تفاصيل الموعد",detailsSubtitle:"حدد الخدمة والطبيب والوقت المناسب لك.",contactTitle:"بيانات المريض",contactSubtitle:"ستستخدم العيادة هذه البيانات لتأكيد الحجز معك.",service:"الخدمة",dentist:"الطبيب",anyDentist:"أي طبيب متاح",date:"التاريخ",time:"الوقت",noTimes:"لا توجد أوقات متاحة في هذا التاريخ",loadingTimes:"يتم تحميل الأوقات المتاحة...",name:"الاسم الكامل",dob:"تاريخ الميلاد",gender:"النوع",male:"ذكر",female:"أنثى",other:"أخرى",phone:"رقم الهاتف",email:"البريد الإلكتروني",reason:"سبب الزيارة",submit:"إرسال طلب الحجز",submitting:"جارٍ الإرسال...",summary:"ملخص الحجز",summaryHint:"ستظهر هنا التفاصيل التي اخترتها قبل الإرسال.",clinicInfo:"العيادة",branchInfo:"الفرع",address:"العنوان",selectedService:"الخدمة المختارة",selectedDentist:"الطبيب المختار",selectedDate:"التاريخ المختار",selectedTime:"الوقت المختار",selectedDob:"تاريخ الميلاد",selectedGender:"النوع",contactInfo:"وسيلة التواصل",notSelected:"لم يتم الاختيار بعد",notesHint:"ملاحظات اختيارية تساعد العيادة على تجهيز زيارتك.",success:"تم إرسال طلب الحجز بنجاح",successBody:"يمكن لفريق العيادة الآن مراجعة الطلب والتواصل معك لتأكيد الموعد.",reservationId:"رقم الحجز",errorFallback:"حدث خطأ غير متوقع. حاول مرة أخرى."}:{title:"Reserve Your Visit",subtitle:"Pick the service, date, and time that fit your schedule and send your booking request online.",loading:"Preparing your booking experience...",missingScope:"This booking link is missing clinic information.",heroKicker:"Online Reservation",trustOne:"Fast confirmation",trustTwo:"Clinic-specific booking link",trustThree:"Works on mobile and desktop",detailsTitle:"Appointment details",detailsSubtitle:"Select the service, provider, and preferred slot.",contactTitle:"Patient details",contactSubtitle:"We will use these details to confirm the reservation.",service:"Service",dentist:"Dentist",anyDentist:"Any available dentist",date:"Date",time:"Time",noTimes:"No available times for this date",loadingTimes:"Loading available times...",name:"Full name",dob:"Date of birth",gender:"Gender",male:"Male",female:"Female",other:"Other",phone:"Phone number",email:"Email address",reason:"Reason for visit",submit:"Send reservation request",submitting:"Submitting...",summary:"Reservation summary",summaryHint:"Your selected details will appear here before submission.",clinicInfo:"Clinic",branchInfo:"Branch",address:"Address",selectedService:"Selected service",selectedDentist:"Selected dentist",selectedDate:"Selected date",selectedTime:"Selected time",selectedDob:"Date of birth",selectedGender:"Gender",contactInfo:"Contact",notSelected:"Not selected yet",notesHint:"Optional notes to help the clinic prepare for your visit.",success:"Reservation request sent successfully",successBody:"The clinic team can now review your request and contact you to confirm the appointment.",reservationId:"Reservation ID",errorFallback:"Something went wrong. Please try again."},v={clinicName:m.get("clinic")||"",branchName:m.get("branch")||"",displayName:m.get("branch")||m.get("clinic")||"",phone:m.get("phone")||"",email:m.get("email")||"",address:m.get("address")||""};document.documentElement.lang=$;document.documentElement.dir=$==="ar"?"rtl":"ltr";document.body.dataset.lang=$;document.title=e.title;const x=document.getElementById("app");if(!x)throw new Error("Missing app root");const t=n=>n.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"),d=(n,a)=>`
  <label class="booking-field">
    <span class="booking-label">${t(n)}</span>
    ${a}
  </label>
`,O=n=>n.filter(a=>!!a).map(a=>t(a)).join('<span class="booking-dot"></span>'),D=n=>!n||typeof n!="string"?e.notSelected:t(n),f=n=>{x.innerHTML=`
    <main class="booking-page">
      ${n}
    </main>
  `},R=(n,a)=>{f(`
    <section class="booking-panel booking-panel--message">
      <div class="booking-icon-badge">+</div>
      <h1>${t(n)}</h1>
      <p>${t(a)}</p>
    </section>
  `)},j=()=>{f(`
    <section class="booking-hero booking-hero--loading">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(e.title)}</h1>
        <p>${t(e.loading)}</p>
      </div>
      <div class="booking-hero__glow"></div>
    </section>
  `)},K=n=>{f(`
    <section class="booking-panel booking-panel--success">
      <div class="booking-success-mark">&#10003;</div>
      <span class="booking-kicker">${t(e.heroKicker)}</span>
      <h1>${t(e.success)}</h1>
      <p>${t(e.successBody)}</p>
      <div class="booking-success-id">
        <span>${t(e.reservationId)}</span>
        <strong>${t(n)}</strong>
      </div>
    </section>
  `)},M=()=>{const n=new Date,a=n.getTimezoneOffset();return new Date(n.getTime()-a*6e4).toISOString().slice(0,10)},V=n=>n==="Male"?e.male:n==="Female"?e.female:n==="Other"?e.other:e.notSelected,W=async()=>{if(!g.clinicId&&!g.branchId){R(e.title,e.missingScope);return}j();const[n,a,y]=await Promise.all([P(g),A(g),B(g)]),_=n?.clinicName||v.clinicName||e.clinicInfo,w=n?.branchName||v.branchName,H=n?.displayName||v.displayName||_,S=n?.address||v.address,N=O([n?.phone||v.phone,n?.email||v.email,S]);f(`
    <section class="booking-hero">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(H)}</h1>
        <p>${t(e.subtitle)}</p>
        <div class="booking-meta">
          <span class="booking-meta__item">${t(e.trustOne)}</span>
          <span class="booking-meta__item">${t(e.trustTwo)}</span>
          <span class="booking-meta__item">${t(e.trustThree)}</span>
        </div>
        ${N?`<div class="booking-contact-strip">${N}</div>`:""}
      </div>
      <div class="booking-hero__card">
        <div class="booking-hero__stat">
          <span>${t(e.clinicInfo)}</span>
          <strong>${t(_)}</strong>
        </div>
        ${w?`<div class="booking-hero__stat"><span>${t(e.branchInfo)}</span><strong>${t(w)}</strong></div>`:""}
        ${S?`<div class="booking-hero__stat"><span>${t(e.address)}</span><strong>${t(S)}</strong></div>`:""}
      </div>
      <div class="booking-hero__glow"></div>
    </section>
    <section class="booking-layout">
      <form id="booking-form" class="booking-panel booking-form">
        <div class="booking-section-heading">
          <span class="booking-section-index">01</span>
          <div>
            <h2>${t(e.detailsTitle)}</h2>
            <p>${t(e.detailsSubtitle)}</p>
          </div>
        </div>
        <div class="booking-grid booking-grid--two">
          ${d(e.service,`<select name="serviceId" class="booking-control" required>
              <option value="">${t(e.service)}</option>
              ${a.map(i=>`<option value="${t(i.id)}">${t(i.name)}</option>`).join("")}
            </select>`)}
          ${d(e.dentist,`<select name="dentistId" class="booking-control">
              <option value="">${t(e.anyDentist)}</option>
              ${y.map(i=>{const o=i.specialty?` - ${i.specialty}`:"";return`<option value="${t(i.id)}">${t(`${i.name}${o}`)}</option>`}).join("")}
            </select>`)}
          ${d(e.date,`<input name="date" class="booking-control" type="date" min="${M()}" required />`)}
          ${d(e.time,`<select name="time" class="booking-control" required>
              <option value="">${t(e.time)}</option>
            </select>`)}
        </div>

        <div class="booking-section-heading booking-section-heading--spaced">
          <span class="booking-section-index">02</span>
          <div>
            <h2>${t(e.contactTitle)}</h2>
            <p>${t(e.contactSubtitle)}</p>
          </div>
        </div>
        <div class="booking-grid booking-grid--two">
          ${d(e.name,`<input name="patientName" class="booking-control" placeholder="${t(e.name)}" required />`)}
          ${d(e.dob,`<input name="patientDob" class="booking-control" type="date" max="${M()}" required />`)}
          ${d(e.gender,`<select name="patientGender" class="booking-control" required>
              <option value="">${t(e.gender)}</option>
              <option value="Male">${t(e.male)}</option>
              <option value="Female">${t(e.female)}</option>
              <option value="Other">${t(e.other)}</option>
            </select>`)}
          ${d(e.phone,`<input name="patientPhone" class="booking-control" placeholder="${t(e.phone)}" required />`)}
          ${d(e.email,`<input name="patientEmail" class="booking-control" type="email" placeholder="${t(e.email)}" />`)}
          ${d(e.reason,`<textarea name="reason" class="booking-control booking-control--textarea" rows="5" placeholder="${t(e.notesHint)}"></textarea>`)}
        </div>
        <div id="booking-feedback" class="booking-feedback" aria-live="polite"></div>
        <button type="submit" class="booking-submit">${t(e.submit)}</button>
      </form>

      <aside class="booking-panel booking-summary">
        <div class="booking-summary__intro">
          <span class="booking-kicker">${t(e.summary)}</span>
          <h2>${t(e.summary)}</h2>
          <p>${t(e.summaryHint)}</p>
        </div>
        <div id="summary-body" class="booking-summary__list"></div>
      </aside>
    </section>
  `);const l=document.getElementById("booking-form"),p=l?.elements.namedItem("time"),h=l?.elements.namedItem("date"),E=l?.elements.namedItem("dentistId"),L=document.getElementById("summary-body"),I=document.getElementById("booking-feedback"),k=()=>{if(!l||!L)return;const i=new FormData(l),o=a.find(u=>u.id===i.get("serviceId")),c=y.find(u=>u.id===i.get("dentistId")),s=i.get("patientName"),r=i.get("patientPhone"),T=i.get("patientGender"),F=[{label:e.selectedService,value:o?.name||e.notSelected},{label:e.selectedDentist,value:c?.name||e.anyDentist},{label:e.selectedDate,value:D(i.get("date"))},{label:e.selectedTime,value:D(i.get("time"))},{label:e.selectedDob,value:D(i.get("patientDob"))},{label:e.selectedGender,value:typeof T=="string"&&T?t(V(T)):e.notSelected},{label:e.contactInfo,value:typeof s=="string"&&s.trim()?t(r?`${s} - ${r}`:s):e.notSelected}];L.innerHTML=F.map(u=>`
          <div class="booking-summary__item">
            <span>${t(u.label)}</span>
            <strong>${typeof u.value=="string"?u.value:e.notSelected}</strong>
          </div>
        `).join("")},b=(i="",o="neutral")=>{I&&(I.textContent=i,I.className=`booking-feedback${i?" is-visible":""}${o==="error"?" is-error":""}`)},q=async()=>{if(!(!p||!h)){if(!h.value){p.innerHTML=`<option value="">${t(e.time)}</option>`,k();return}b(e.loadingTimes),p.disabled=!0,p.innerHTML=`<option value="">${t(e.loadingTimes)}</option>`;try{const o=(await G(h.value,E?.value||void 0,g)).slots.filter(c=>c.available);o.length?(p.innerHTML=`
          <option value="">${t(e.time)}</option>
          ${o.map(c=>{const s=c.dentistName?`${c.time} - ${c.dentistName}`:c.time;return`<option value="${t(c.time)}">${t(s)}</option>`}).join("")}
        `,b("")):(p.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.noTimes))}catch(i){console.error(i),p.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.errorFallback,"error")}finally{p.disabled=!1,k()}}};h?.addEventListener("change",()=>{q()}),E?.addEventListener("change",()=>{q()}),l?.addEventListener("input",k),l?.addEventListener("change",k),k(),l?.addEventListener("submit",async i=>{if(i.preventDefault(),!l)return;const o=new FormData(l),c=a.find(r=>r.id===o.get("serviceId")),s=l.querySelector('button[type="submit"]');try{s&&(s.disabled=!0,s.textContent=e.submitting),b("");const r=await C({clinicId:g.clinicId,branchId:g.branchId,serviceId:String(o.get("serviceId")||""),preferredDentistId:String(o.get("dentistId")||"")||void 0,requestedDate:String(o.get("date")||""),requestedTime:String(o.get("time")||""),patientName:String(o.get("patientName")||""),patientDob:String(o.get("patientDob")||"")||void 0,patientGender:String(o.get("patientGender")||"")||void 0,patientPhone:String(o.get("patientPhone")||""),patientEmail:String(o.get("patientEmail")||"")||void 0,reason:String(o.get("reason")||"")||void 0,durationMinutes:c?.duration||30});if(!r.success){b(r.message||e.errorFallback,"error"),s&&(s.disabled=!1,s.textContent=e.submit);return}K(r.reservationId)}catch(r){console.error(r),b(r instanceof Error?r.message:e.errorFallback,"error"),s&&(s.disabled=!1,s.textContent=e.submit)}})};W();
