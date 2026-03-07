import React from 'react';
import { useI18n } from '../hooks/useI18n';

// Icons
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const LabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TechIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, items }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-violet-100 dark:border-violet-800/50">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl text-violet-600 dark:text-violet-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
    </div>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');

interface Founder {
  name: string;
  role: string;
  photoUrl?: string;
}

const FounderBadge: React.FC<{ founder: Founder }> = ({ founder }) => {
  const { name, role, photoUrl } = founder;
  return (
    <div className="flex items-center gap-3 w-full max-w-md px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-violet-100 dark:border-violet-700 rounded-2xl shadow-sm">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-12 h-12 rounded-xl object-cover border border-violet-200 dark:border-slate-700"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold">
          {initials(name)}
        </div>
      )}
      <div className="text-start">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { direction } = useI18n();

  const sections = [
    {
      title: 'إدارة المرضى والسجلات الطبية',
      icon: <UsersIcon />,
      items: [
        'ملف طبي موحد يشمل التاريخ المرضي، الحساسية، الصور قبل/بعد، والمرفقات.',
        'استيراد/تصدير بيانات المرضى مع صلاحيات وصول دقيقة (RBAC).',
        'خطط علاج مع تكاليف متوقعة وربطها بالمواعيد والمدفوعات.',
        'ملاحظات داخلية وأرشفة تسجيلات صوتية وملفات لكل زيارة.',
        'توثيق الموافقات والتوقيعات الرقمية وسجل كامل للتعديلات.'
      ]
    },
    {
      title: 'المواعيد والحجز',
      icon: <CalendarIcon />,
      items: [
        'تقويم مركزي يومي/أسبوعي متعدد الأطباء والغرف مع كشف التعارض.',
        'إنشاء/تعديل/إلغاء المواعيد وربطها بالخطة العلاجية والفرع.',
        'حجز إلكتروني عبر PublicBookingPage وقائمة PendingReservations للقبول اليدوي أو التلقائي.',
        'الطلب المقبول يُنشئ موعداً في Scheduler مرتبطاً بالمريض والطبيب والفرع.',
        'تأكيدات وتذكيرات تلقائية (SMS/WhatsApp/Email) للحضور والمتابعة.'
      ]
    },
    {
      title: 'الأطباء والفريق والصلاحيات',
      icon: <UsersIcon />,
      items: [
        'قوائم الأطباء مع نسب المشاركة في العلاج وجداول العمل.',
        'ملف تفصيلي لكل طبيب وإحصاءات إنتاجية وتقارير قابلة للطباعة.',
        'إدارة الموظفين والأدوار بصلاحيات دقيقة لكل وحدة (Patients, Appointments, Finance...).',
        'توزيع المهام والتنبيهات الداخلية، ومعلومات بدائل الطوارئ.'
      ]
    },
    {
      title: 'الموردون والمشتريات',
      icon: <WalletIcon />,
      items: [
        'إدارة موردين (مواد أو معامل) مع بيانات الدفع والعملة والضريبة.',
        'تسجيل فواتير المورد ومدفوعات جزئية/كاملة مع مرفقات.',
        'كشوف مورد قابلة للطباعة SupplierStatement وإجمالي الرصيد.',
        'ربط المورد بأوامر الشراء واستهلاك المخزون والحالات المعملية.'
      ]
    },
    {
      title: 'المخزون وأوامر الشراء',
      icon: <PackageIcon />,
      items: [
        'تتبع الكميات وحد إعادة الطلب والباركود والجرد السريع.',
        'تنبيه نقص الكمية مع زر فوري لإنشاء أمر شراء.',
        'CreatePurchaseOrderModal لتجميع البنود والأسعار والضرائب والخصم.',
        'طباعة أمر الشراء PDF عبر PurchaseOrderPrintable.',
        'استلام جزئي/كامل يحدّث المخزون ويغلق الطلبية حسب الكميات المستلمة.'
      ]
    },
    {
      title: 'حالات المعمل',
      icon: <LabIcon />,
      items: [
        'إنشاء Lab Case مرتبطة بالمريض والطبيب والمورد/المعمل.',
        'مراحل تصنيع وتسليم مع مواعيد متوقعة وحالة تأخير.',
        'تتبع التكلفة وربطها بالحسابات وكشوف المعمل LabStatement.',
        'تنبيهات للحالات المتأخرة ولوحة متابعة للحالة الحالية.'
      ]
    },
    {
      title: 'الوصفات الطبية',
      icon: <SettingsIcon />,
      items: [
        'إنشاء وصفة بعدة أدوية (اسم، جرعة، تكرار، ملاحظات) داخل ملف المريض.',
        'حفظ الوصفة وإعادة استخدامها وتعديلها بسرعة.',
        'طباعة/إرسال الوصفة PDF وتخزينها كمرفق في السجل الطبي.'
      ]
    },
    {
      title: 'المالية والحسابات',
      icon: <WalletIcon />,
      items: [
        'حسابات مالية للأطباء والموردين والمعامل مع أرصدة ومعاملات.',
        'فواتير، مطالبات، ومدفوعات تظهر في كشوف قابلة للطباعة.',
        'DoctorAccountsManagement وFinancialAccounts لعرض وتحليل الحركات.',
        'دعم المدفوعات الجزئية، الإيصالات، وتصدير البيانات.'
      ]
    },
    {
      title: 'التأمين',
      icon: <ShieldIcon />,
      items: [
        'إدارة شركات التأمين وربط المرضى والإجراءات بالتغطية.',
        'InsuranceManagementPage للتأمين الموحد والتقارير القابلة للطباعة.',
        'صفحات ربط المريض/العلاج بالتأمين لضبط نسب التغطية والمطالبة.',
        'مطالبات وتأمينات تظهر في الحسابات والتقارير المالية.'
      ]
    },
    {
      title: 'التقارير والتحليلات',
      icon: <ChartIcon />,
      items: [
        'ReportsPage وComprehensiveClinicReportPage لملخصات مالية وسريرية.',
        'تقارير مورد/معمل/تأمين/أطباء قابلة للتصدير PDF.',
        'مؤشرات حضور المواعيد والإيرادات والمصروفات واستهلاك الكراسي.',
        'قوالب طباعة موحدة مع هوية العيادة.'
      ]
    },
    {
      title: 'الإشعارات والتواصل',
      icon: <BellIcon />,
      items: [
        'مركز إشعارات يدعم SMS/WhatsApp/Email عبر NotificationContext.',
        'تذكير مواعيد، قبول/رفض حجز، نقص مخزون، تأخير Lab، وتنبيهات أمنية.',
        'تفضيلات المستخدم لموضع الجرس والكتم المؤقت والقناة المفضلة.'
      ]
    },
    {
      title: 'الإعدادات والفروع والهوية',
      icon: <SettingsIcon />,
      items: [
        'ClinicManagementPage لضبط بيانات العيادة والفروع وربط المخزون بكل فرع.',
        'تخصيص الشعار والألوان وقوالب الفواتير والوصفات والموافقات.',
        'إعدادات تعدد الفروع وربط الصلاحيات والمخزون والصادر والوارد لكل فرع.',
        'إدارة المستخدمين والأدوار عبر UserManagement وRBAC.'
      ]
    }
  ];

  const techFeatures = [
    'منصة سحابية آمنة قابلة للتدرج تدعم العمل من أي مكان.',
    'تحكم دقيق بالأدوار والصلاحيات (RBAC) مدمج في جميع الوحدات.',
    'تصميم متجاوب يعمل بسلاسة على الحاسب والتابلت والموبايل.',
    'تكامل مع Supabase/PostgreSQL، Tailwind CSS، و React Context.',
    'بنية مكونات قابلة لإعادة الاستخدام لتسريع تطوير المزايا الجديدة.',
    'نظام إشعارات آنية (real-time) لتحسين سرعة الاستجابة.',
    'حزم جاهزة للتكامل مع مزودي الدفع والرسائل القصيرة.'
  ];

  const benefits = [
    'تسريع سير العمل الإداري وتقليل الأخطاء اليدوية في الحجز والفوترة.',
    'رفع رضا المرضى عبر حجز إلكتروني سلس وتذكيرات تلقائية.',
    'وضوح مالي لحظي يدعم القرار (أطباء، موردون، تأمين، معمل).',
    'حماية بيانات المرضى والامتثال لممارسات الخصوصية الطبية.',
    'قابلية توسع تدعم تعدد الفروع ونمو العيادة دون تعقيد.'
  ];

  const founders: Founder[] = [
    { name: 'Dr. Mohamed Alafandy', role: 'Founder & Product Strategy', photoUrl: '/founders/alafandy.jpg' },
    { name: 'Dr. Sherif Gamal', role: 'Founder & Clinical Advisor', photoUrl: '/founders/sherif-gamal.jpg' },
    { name: 'Asmaa Toson', role: 'Co-Founder & Operations', photoUrl: '/founders/asmaa-toson.jpg' }
  ];

  return (
    <div dir={direction} className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-purple-500/30 ring-2 ring-violet-100 dark:ring-violet-800/60 mb-6 overflow-hidden">
            <img
              src="/logo.svg"
              alt="CuraDent Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4">
            كـيـورا دِنت | CuraDent
          </h1>
          <p className="text-xl text-violet-600 dark:text-violet-400 font-medium mb-3">
            حل متكامل لإدارة عيادات الأسنان
          </p>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            منصة واحدة تشمل المواعيد، السجلات الطبية، الفوترة، المخزون، حالات المعمل، التأمين، والتقارير مع أمان عالٍ وتجربة سلسة للفريق والمرضى.
          </p>
          <div className="flex flex-col items-center gap-3 mt-6">
            {founders.map((founder) => (
              <FounderBadge key={founder.name} founder={founder} />
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, index) => (
            <FeatureItem key={index} icon={section.icon} title={section.title} items={section.items} />
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 shadow-xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <InfoIcon />
            <h2 className="text-2xl font-bold text-white">فوائد مباشرة للعيادة</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 text-white/90">
                <CheckIcon />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Features */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-8 shadow-xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TechIcon />
            <h2 className="text-2xl font-bold text-white">المميزات التقنية</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-white/90">
                <CheckIcon />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies Used */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
            التقنيات المستخدمة
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['React + TypeScript', 'Tailwind CSS', 'Supabase (PostgreSQL)', 'React Context + Hooks', 'Custom SVG Icons'].map((tech, index) => (
              <span key={index} className="px-4 py-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 dark:text-slate-400">
          <p className="font-medium">CuraDent - الحل الأمثل لإدارة عيادات الأسنان بكفاءة واحترافية</p>
          <p className="text-sm mt-2">© 2024 جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
