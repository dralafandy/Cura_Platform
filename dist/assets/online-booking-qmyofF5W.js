import{c as F,g as N,a as P,d as B,b as x}from"./publicBookingService-CnMW4Q4Y.js";const w=new URLSearchParams(window.location.search),u=w.get("lang")==="ar"?"ar":"en",m={clinicId:w.get("clinicId")||void 0,branchId:w.get("branchId")||void 0},e={en:{title:"Reserve Your Visit",subtitle:"Pick the service, date, and time that fit your schedule and send your booking request online.",loading:"Preparing your booking experience...",missingScope:"This booking link is missing clinic information.",heroKicker:"Online Reservation",trustOne:"Fast confirmation",trustTwo:"Clinic-specific booking link",trustThree:"Works on mobile and desktop",detailsTitle:"Appointment details",detailsSubtitle:"Select the service, provider, and preferred slot.",contactTitle:"Patient details",contactSubtitle:"We will use these details to confirm the reservation.",service:"Service",dentist:"Dentist",anyDentist:"Any available dentist",date:"Date",time:"Time",noTimes:"No available times for this date",loadingTimes:"Loading available times...",name:"Full name",dob:"Date of birth",gender:"Gender",male:"Male",female:"Female",other:"Other",phone:"Phone number",email:"Email address",reason:"Reason for visit",submit:"Send reservation request",submitting:"Submitting...",summary:"Reservation summary",summaryHint:"Your selected details will appear here before submission.",clinicInfo:"Clinic",branchInfo:"Branch",selectedService:"Selected service",selectedDentist:"Selected dentist",selectedDate:"Selected date",selectedTime:"Selected time",selectedDob:"Date of birth",selectedGender:"Gender",contactInfo:"Contact",notSelected:"Not selected yet",notesHint:"Optional notes to help the clinic prepare for your visit.",success:"Reservation request sent successfully",successBody:"The clinic team can now review your request and contact you to confirm the appointment.",reservationId:"Reservation ID",errorFallback:"Something went wrong. Please try again."},ar:{title:"احجز موعدك بسهولة",subtitle:"اختر الخدمة والتاريخ والوقت المناسب ثم أرسل طلب الحجز مباشرة إلى العيادة.",loading:"يتم تجهيز صفحة الحجز...",missingScope:"رابط الحجز لا يحتوي على بيانات العيادة.",heroKicker:"الحجز الإلكتروني",trustOne:"تأكيد أسرع للموعد",trustTwo:"رابط مخصص لكل عيادة أو فرع",trustThree:"يعمل على الجوال والكمبيوتر",detailsTitle:"تفاصيل الموعد",detailsSubtitle:"حدد الخدمة والطبيب والوقت المناسب لك.",contactTitle:"بيانات المريض",contactSubtitle:"ستستخدم العيادة هذه البيانات لتأكيد الحجز معك.",service:"الخدمة",dentist:"الطبيب",anyDentist:"أي طبيب متاح",date:"التاريخ",time:"الوقت",noTimes:"لا توجد أوقات متاحة في هذا التاريخ",loadingTimes:"يتم تحميل الأوقات المتاحة...",name:"الاسم الكامل",dob:"تاريخ الميلاد",gender:"النوع",male:"ذكر",female:"أنثى",other:"أخرى",phone:"رقم الهاتف",email:"البريد الإلكتروني",reason:"سبب الزيارة",submit:"إرسال طلب الحجز",submitting:"جاري الإرسال...",summary:"ملخص الحجز",summaryHint:"ستظهر هنا التفاصيل التي اخترتها قبل الإرسال.",clinicInfo:"العيادة",branchInfo:"الفرع",selectedService:"الخدمة المختارة",selectedDentist:"الطبيب المختار",selectedDate:"التاريخ المختار",selectedTime:"الوقت المختار",selectedDob:"تاريخ الميلاد",selectedGender:"النوع",contactInfo:"وسيلة التواصل",notSelected:"لم يتم الاختيار بعد",notesHint:"ملاحظات اختيارية تساعد العيادة على تجهيز زيارتك.",success:"تم إرسال طلب الحجز بنجاح",successBody:"يمكن لفريق العيادة الآن مراجعة الطلب والتواصل معك لتأكيد الموعد.",reservationId:"رقم الحجز",errorFallback:"حدث خطأ غير متوقع. حاول مرة أخرى."}}[u];document.documentElement.lang=u;document.documentElement.dir=u==="ar"?"rtl":"ltr";document.body.dataset.lang=u;document.title=e.title;const H=document.getElementById("app");if(!H)throw new Error("Missing app root");const t=o=>o.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"),d=(o,a)=>`
  <label class="booking-field">
    <span class="booking-label">${t(o)}</span>
    ${a}
  </label>
`,G=o=>o.filter(a=>!!a).map(a=>t(a)).join('<span class="booking-dot"></span>'),D=o=>!o||typeof o!="string"?e.notSelected:t(o),y=o=>{H.innerHTML=`
    <main class="booking-page">
      ${o}
    </main>
  `},O=(o,a)=>{y(`
    <section class="booking-panel booking-panel--message">
      <div class="booking-icon-badge">+</div>
      <h1>${t(o)}</h1>
      <p>${t(a)}</p>
    </section>
  `)},C=()=>{y(`
    <section class="booking-hero booking-hero--loading">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(e.title)}</h1>
        <p>${t(e.loading)}</p>
      </div>
      <div class="booking-hero__glow"></div>
    </section>
  `)},R=o=>{y(`
    <section class="booking-panel booking-panel--success">
      <div class="booking-success-mark">✓</div>
      <span class="booking-kicker">${t(e.heroKicker)}</span>
      <h1>${t(e.success)}</h1>
      <p>${t(e.successBody)}</p>
      <div class="booking-success-id">
        <span>${t(e.reservationId)}</span>
        <strong>${t(o)}</strong>
      </div>
    </section>
  `)},M=()=>{const o=new Date,a=o.getTimezoneOffset();return new Date(o.getTime()-a*6e4).toISOString().slice(0,10)},j=async()=>{if(!m.clinicId){O(e.title,e.missingScope);return}C();const o=F();let a=u==="ar"?"العيادة":"Clinic",h="",k="",S="";if(o){const{data:n}=await o.from("clinics").select("name,address,phone,email").eq("id",m.clinicId).maybeSingle(),i=m.branchId?await o.from("clinic_branches").select("name,address,phone,email").eq("id",m.branchId).maybeSingle():{data:null};a=i.data?.name||n?.name||a,S=i.data?.name||"",k=i.data?.address||n?.address||"",h=G([i.data?.phone||n?.phone,i.data?.email||n?.email,k])}const[I,_]=await Promise.all([N(m),P(m)]);y(`
    <section class="booking-hero">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(a)}</h1>
        <p>${t(e.subtitle)}</p>
        <div class="booking-meta">
          <span class="booking-meta__item">${t(e.trustOne)}</span>
          <span class="booking-meta__item">${t(e.trustTwo)}</span>
          <span class="booking-meta__item">${t(e.trustThree)}</span>
        </div>
        ${h?`<div class="booking-contact-strip">${h}</div>`:""}
      </div>
      <div class="booking-hero__card">
        <div class="booking-hero__stat">
          <span>${t(e.clinicInfo)}</span>
          <strong>${t(a)}</strong>
        </div>
        ${S?`<div class="booking-hero__stat"><span>${t(e.branchInfo)}</span><strong>${t(S)}</strong></div>`:""}
        ${k?`<div class="booking-hero__stat"><span>${u==="ar"?"العنوان":"Address"}</span><strong>${t(k)}</strong></div>`:""}
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
              ${I.map(n=>`<option value="${t(n.id)}">${t(n.name)}</option>`).join("")}
            </select>`)}
          ${d(e.dentist,`<select name="dentistId" class="booking-control">
              <option value="">${t(e.anyDentist)}</option>
              ${_.map(n=>{const i=n.specialty?` - ${n.specialty}`:"";return`<option value="${t(n.id)}">${t(`${n.name}${i}`)}</option>`}).join("")}
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
  `);const l=document.getElementById("booking-form"),p=l?.elements.namedItem("time"),$=l?.elements.namedItem("date"),E=l?.elements.namedItem("dentistId"),q=document.getElementById("summary-body"),T=document.getElementById("booking-feedback"),v=()=>{if(!l||!q)return;const n=new FormData(l),i=I.find(g=>g.id===n.get("serviceId")),r=_.find(g=>g.id===n.get("dentistId")),s=n.get("patientName"),c=n.get("patientPhone"),f=n.get("patientGender"),A=[{label:e.selectedService,value:i?.name||e.notSelected},{label:e.selectedDentist,value:r?.name||e.anyDentist},{label:e.selectedDate,value:D(n.get("date"))},{label:e.selectedTime,value:D(n.get("time"))},{label:e.selectedDob,value:D(n.get("patientDob"))},{label:e.selectedGender,value:typeof f=="string"&&f?t(f==="Male"?e.male:f==="Female"?e.female:e.other):e.notSelected},{label:e.contactInfo,value:typeof s=="string"&&s.trim()?t(c?`${s} - ${c}`:s):e.notSelected}];q.innerHTML=A.map(g=>`
          <div class="booking-summary__item">
            <span>${t(g.label)}</span>
            <strong>${typeof g.value=="string"?g.value:e.notSelected}</strong>
          </div>
        `).join("")},b=(n="",i="neutral")=>{T&&(T.textContent=n,T.className=`booking-feedback${n?" is-visible":""}${i==="error"?" is-error":""}`)},L=async()=>{if(!(!p||!$)){if(!$.value){p.innerHTML=`<option value="">${t(e.time)}</option>`,v();return}b(e.loadingTimes),p.disabled=!0,p.innerHTML=`<option value="">${t(e.loadingTimes)}</option>`;try{const i=(await x($.value,E?.value||void 0,m)).slots.filter(r=>r.available);i.length?(p.innerHTML=`
          <option value="">${t(e.time)}</option>
          ${i.map(r=>{const s=r.dentistName?`${r.time} - ${r.dentistName}`:r.time;return`<option value="${t(r.time)}">${t(s)}</option>`}).join("")}
        `,b("")):(p.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.noTimes))}catch(n){console.error(n),p.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.errorFallback,"error")}finally{p.disabled=!1,v()}}};$?.addEventListener("change",()=>{L()}),E?.addEventListener("change",()=>{L()}),l?.addEventListener("input",v),l?.addEventListener("change",v),v(),l?.addEventListener("submit",async n=>{if(n.preventDefault(),!l)return;const i=new FormData(l),r=I.find(c=>c.id===i.get("serviceId")),s=l.querySelector('button[type="submit"]');try{s&&(s.disabled=!0,s.textContent=e.submitting),b("");const c=await B({clinicId:m.clinicId,branchId:m.branchId,serviceId:String(i.get("serviceId")||""),preferredDentistId:String(i.get("dentistId")||"")||void 0,requestedDate:String(i.get("date")||""),requestedTime:String(i.get("time")||""),patientName:String(i.get("patientName")||""),patientDob:String(i.get("patientDob")||"")||void 0,patientGender:String(i.get("patientGender")||"")||void 0,patientPhone:String(i.get("patientPhone")||""),patientEmail:String(i.get("patientEmail")||"")||void 0,reason:String(i.get("reason")||"")||void 0,durationMinutes:r?.duration||30});R(c.reservationId)}catch(c){console.error(c),b(c instanceof Error?c.message:e.errorFallback,"error"),s&&(s.disabled=!1,s.textContent=e.submit)}})};j();
