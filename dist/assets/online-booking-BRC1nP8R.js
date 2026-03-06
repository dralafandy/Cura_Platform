import{c as A,g as M,a as N,d as P,b as B}from"./publicBookingService-V0EtURCW.js";const T=new URLSearchParams(window.location.search),u=T.get("lang")==="ar"?"ar":"en",d={clinicId:T.get("clinicId")||void 0,branchId:T.get("branchId")||void 0},e={en:{title:"Reserve Your Visit",subtitle:"Pick the service, date, and time that fit your schedule and send your booking request online.",loading:"Preparing your booking experience...",missingScope:"This booking link is missing clinic information.",heroKicker:"Online Reservation",trustOne:"Fast confirmation",trustTwo:"Clinic-specific booking link",trustThree:"Works on mobile and desktop",detailsTitle:"Appointment details",detailsSubtitle:"Select the service, provider, and preferred slot.",contactTitle:"Patient details",contactSubtitle:"We will use these details to confirm the reservation.",service:"Service",dentist:"Dentist",anyDentist:"Any available dentist",date:"Date",time:"Time",noTimes:"No available times for this date",loadingTimes:"Loading available times...",name:"Full name",phone:"Phone number",email:"Email address",reason:"Reason for visit",submit:"Send reservation request",submitting:"Submitting...",summary:"Reservation summary",summaryHint:"Your selected details will appear here before submission.",clinicInfo:"Clinic",branchInfo:"Branch",selectedService:"Selected service",selectedDentist:"Selected dentist",selectedDate:"Selected date",selectedTime:"Selected time",contactInfo:"Contact",notSelected:"Not selected yet",notesHint:"Optional notes to help the clinic prepare for your visit.",success:"Reservation request sent successfully",successBody:"The clinic team can now review your request and contact you to confirm the appointment.",reservationId:"Reservation ID",errorFallback:"Something went wrong. Please try again."},ar:{title:"احجز موعدك بسهولة",subtitle:"اختر الخدمة والتاريخ والوقت المناسب ثم أرسل طلب الحجز مباشرة إلى العيادة.",loading:"يتم تجهيز صفحة الحجز...",missingScope:"رابط الحجز لا يحتوي على بيانات العيادة.",heroKicker:"الحجز الإلكتروني",trustOne:"تأكيد أسرع للموعد",trustTwo:"رابط مخصص لكل عيادة أو فرع",trustThree:"يعمل على الجوال والكمبيوتر",detailsTitle:"تفاصيل الموعد",detailsSubtitle:"حدد الخدمة والطبيب والوقت المناسب لك.",contactTitle:"بيانات المريض",contactSubtitle:"ستستخدم العيادة هذه البيانات لتأكيد الحجز معك.",service:"الخدمة",dentist:"الطبيب",anyDentist:"أي طبيب متاح",date:"التاريخ",time:"الوقت",noTimes:"لا توجد أوقات متاحة في هذا التاريخ",loadingTimes:"يتم تحميل الأوقات المتاحة...",name:"الاسم الكامل",phone:"رقم الهاتف",email:"البريد الإلكتروني",reason:"سبب الزيارة",submit:"إرسال طلب الحجز",submitting:"جاري الإرسال...",summary:"ملخص الحجز",summaryHint:"ستظهر هنا التفاصيل التي اخترتها قبل الإرسال.",clinicInfo:"العيادة",branchInfo:"الفرع",selectedService:"الخدمة المختارة",selectedDentist:"الطبيب المختار",selectedDate:"التاريخ المختار",selectedTime:"الوقت المختار",contactInfo:"وسيلة التواصل",notSelected:"لم يتم الاختيار بعد",notesHint:"ملاحظات اختيارية تساعد العيادة على تجهيز زيارتك.",success:"تم إرسال طلب الحجز بنجاح",successBody:"يمكن لفريق العيادة الآن مراجعة الطلب والتواصل معك لتأكيد الموعد.",reservationId:"رقم الحجز",errorFallback:"حدث خطأ غير متوقع. حاول مرة أخرى."}}[u];document.documentElement.lang=u;document.documentElement.dir=u==="ar"?"rtl":"ltr";document.body.dataset.lang=u;document.title=e.title;const L=document.getElementById("app");if(!L)throw new Error("Missing app root");const t=o=>o.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"),p=(o,s)=>`
  <label class="booking-field">
    <span class="booking-label">${t(o)}</span>
    ${s}
  </label>
`,x=o=>o.filter(s=>!!s).map(s=>t(s)).join('<span class="booking-dot"></span>'),q=o=>!o||typeof o!="string"?e.notSelected:t(o),f=o=>{L.innerHTML=`
    <main class="booking-page">
      ${o}
    </main>
  `},F=(o,s)=>{f(`
    <section class="booking-panel booking-panel--message">
      <div class="booking-icon-badge">+</div>
      <h1>${t(o)}</h1>
      <p>${t(s)}</p>
    </section>
  `)},C=()=>{f(`
    <section class="booking-hero booking-hero--loading">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(e.title)}</h1>
        <p>${t(e.loading)}</p>
      </div>
      <div class="booking-hero__glow"></div>
    </section>
  `)},R=o=>{f(`
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
  `)},O=()=>{const o=new Date,s=o.getTimezoneOffset();return new Date(o.getTime()-s*6e4).toISOString().slice(0,10)},j=async()=>{if(!d.clinicId){F(e.title,e.missingScope);return}C();const o=A();let s=u==="ar"?"العيادة":"Clinic",k="",h="",y="";if(o){const{data:n}=await o.from("clinics").select("name,address,phone,email").eq("id",d.clinicId).maybeSingle(),i=d.branchId?await o.from("clinic_branches").select("name,address,phone,email").eq("id",d.branchId).maybeSingle():{data:null};s=i.data?.name||n?.name||s,y=i.data?.name||"",h=i.data?.address||n?.address||"",k=x([i.data?.phone||n?.phone,i.data?.email||n?.email,h])}const[S,w]=await Promise.all([M(d),N(d)]);f(`
    <section class="booking-hero">
      <div class="booking-hero__content">
        <span class="booking-kicker">${t(e.heroKicker)}</span>
        <h1>${t(s)}</h1>
        <p>${t(e.subtitle)}</p>
        <div class="booking-meta">
          <span class="booking-meta__item">${t(e.trustOne)}</span>
          <span class="booking-meta__item">${t(e.trustTwo)}</span>
          <span class="booking-meta__item">${t(e.trustThree)}</span>
        </div>
        ${k?`<div class="booking-contact-strip">${k}</div>`:""}
      </div>
      <div class="booking-hero__card">
        <div class="booking-hero__stat">
          <span>${t(e.clinicInfo)}</span>
          <strong>${t(s)}</strong>
        </div>
        ${y?`<div class="booking-hero__stat"><span>${t(e.branchInfo)}</span><strong>${t(y)}</strong></div>`:""}
        ${h?`<div class="booking-hero__stat"><span>${u==="ar"?"العنوان":"Address"}</span><strong>${t(h)}</strong></div>`:""}
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
          ${p(e.service,`<select name="serviceId" class="booking-control" required>
              <option value="">${t(e.service)}</option>
              ${S.map(n=>`<option value="${t(n.id)}">${t(n.name)}</option>`).join("")}
            </select>`)}
          ${p(e.dentist,`<select name="dentistId" class="booking-control">
              <option value="">${t(e.anyDentist)}</option>
              ${w.map(n=>{const i=n.specialty?` - ${n.specialty}`:"";return`<option value="${t(n.id)}">${t(`${n.name}${i}`)}</option>`}).join("")}
            </select>`)}
          ${p(e.date,`<input name="date" class="booking-control" type="date" min="${O()}" required />`)}
          ${p(e.time,`<select name="time" class="booking-control" required>
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
          ${p(e.name,`<input name="patientName" class="booking-control" placeholder="${t(e.name)}" required />`)}
          ${p(e.phone,`<input name="patientPhone" class="booking-control" placeholder="${t(e.phone)}" required />`)}
          ${p(e.email,`<input name="patientEmail" class="booking-control" type="email" placeholder="${t(e.email)}" />`)}
          ${p(e.reason,`<textarea name="reason" class="booking-control booking-control--textarea" rows="5" placeholder="${t(e.notesHint)}"></textarea>`)}
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
  `);const c=document.getElementById("booking-form"),m=c?.elements.namedItem("time"),$=c?.elements.namedItem("date"),_=c?.elements.namedItem("dentistId"),D=document.getElementById("summary-body"),I=document.getElementById("booking-feedback"),v=()=>{if(!c||!D)return;const n=new FormData(c),i=S.find(g=>g.id===n.get("serviceId")),r=w.find(g=>g.id===n.get("dentistId")),a=n.get("patientName"),l=n.get("patientPhone"),H=[{label:e.selectedService,value:i?.name||e.notSelected},{label:e.selectedDentist,value:r?.name||e.anyDentist},{label:e.selectedDate,value:q(n.get("date"))},{label:e.selectedTime,value:q(n.get("time"))},{label:e.contactInfo,value:typeof a=="string"&&a.trim()?t(l?`${a} - ${l}`:a):e.notSelected}];D.innerHTML=H.map(g=>`
          <div class="booking-summary__item">
            <span>${t(g.label)}</span>
            <strong>${typeof g.value=="string"?g.value:e.notSelected}</strong>
          </div>
        `).join("")},b=(n="",i="neutral")=>{I&&(I.textContent=n,I.className=`booking-feedback${n?" is-visible":""}${i==="error"?" is-error":""}`)},E=async()=>{if(!(!m||!$)){if(!$.value){m.innerHTML=`<option value="">${t(e.time)}</option>`,v();return}b(e.loadingTimes),m.disabled=!0,m.innerHTML=`<option value="">${t(e.loadingTimes)}</option>`;try{const i=(await B($.value,_?.value||void 0,d)).slots.filter(r=>r.available);i.length?(m.innerHTML=`
          <option value="">${t(e.time)}</option>
          ${i.map(r=>{const a=r.dentistName?`${r.time} - ${r.dentistName}`:r.time;return`<option value="${t(r.time)}">${t(a)}</option>`}).join("")}
        `,b("")):(m.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.noTimes))}catch(n){console.error(n),m.innerHTML=`<option value="">${t(e.noTimes)}</option>`,b(e.errorFallback,"error")}finally{m.disabled=!1,v()}}};$?.addEventListener("change",()=>{E()}),_?.addEventListener("change",()=>{E()}),c?.addEventListener("input",v),c?.addEventListener("change",v),v(),c?.addEventListener("submit",async n=>{if(n.preventDefault(),!c)return;const i=new FormData(c),r=S.find(l=>l.id===i.get("serviceId")),a=c.querySelector('button[type="submit"]');try{a&&(a.disabled=!0,a.textContent=e.submitting),b("");const l=await P({clinicId:d.clinicId,branchId:d.branchId,serviceId:String(i.get("serviceId")||""),preferredDentistId:String(i.get("dentistId")||"")||void 0,requestedDate:String(i.get("date")||""),requestedTime:String(i.get("time")||""),patientName:String(i.get("patientName")||""),patientPhone:String(i.get("patientPhone")||""),patientEmail:String(i.get("patientEmail")||"")||void 0,reason:String(i.get("reason")||"")||void 0,durationMinutes:r?.duration||30});R(l.reservationId)}catch(l){console.error(l),b(l instanceof Error?l.message:e.errorFallback,"error"),a&&(a.disabled=!1,a.textContent=e.submit)}})};j();
