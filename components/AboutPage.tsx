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

const AboutPage: React.FC = () => {
  const { t, direction } = useI18n();

  const sections = [
    {
      title: 'قسم إدارة المرضى',
      icon: <UsersIcon />,
      items: [
        'قائمة المرضى: عرض وإدارة جميع المرضى مع البحث والترتيب',
        'إضافة/تعديل المريض: نموذج شامل لتسجيل البيانات الكاملة',
        'تفاصيل المريض: صفحة متكاملة تشمل المعلومات والعلاجات والمدفوعات',
        'المدفوعات: تسجيل ومتابعة مع خيارات متعددة (نقدي، بطاقة، تحويل)',
        'الخصومات: إدارة مرنة للخصومات',
        'سجل العلاجات: تتبع جميع العلاجات لكل مريض',
        'الوصفات الطبية: إنشاء وإدارة الوصفات',
        'مرفقات المريض: رفع وإدارة الملفات والصور',
        'الرسم البياني للأسنان: أداة تفاعلية لتوثيق حالة الأسنان'
      ]
    },
    {
      title: 'قسم المواعيد والحجز',
      icon: <CalendarIcon />,
      items: [
        'جدول المواعيد: عرض أسبوعي/يومي',
        'حجز المواعيد: تحديد موعد جديد مع اختيار الطبيب',
        'إدارة جداول الأطباء: متابعة التوفر',
        'الحجز العام: صفحة حجز إلكترونية للمرضى',
        'إدارة الحجوزات المعلقة'
      ]
    },
    {
      title: 'قسم الأطباء',
      icon: <UsersIcon />,
      items: [
        'قائمة الأطباء',
        'صفحة الطبيب التفصيلية',
        'تقرير الطبيب المفصل',
        'حسابات الأطباء ومتابعة المستحقات',
        'نظام مشاركة الأطباء في الإيرادات'
      ]
    },
    {
      title: 'قسم المالية والمحاسبة',
      icon: <WalletIcon />,
      items: [
        'لوحة الحسابات',
        'المصروفات والإيرادات',
        'حسابات الأطباء',
        'التقارير المالية',
        'إدارة متعددة الحسابات'
      ]
    },
    {
      title: 'قسم المخزون والمستلزمات',
      icon: <PackageIcon />,
      items: [
        'إدارة المخزون',
        'تنبيهات المخزون المنخفض',
        'أوامر الشراء التلقائية',
        'إدارة الموردين',
        'تتبع المشتريات والفواتير'
      ]
    },
    {
      title: 'قسم المعامل dentist labCases',
      icon: <LabIcon />,
      items: [
        'إدارةCases dentist labdentistlabdentistlab الصادرة والواردة',
        'تتبع حالة كل case',
        'كشف حساب lab dentist'
      ]
    },
    {
      title: 'قسم التأمين',
      icon: <ShieldIcon />,
      items: [
        'شركات التأمين',
        'حسابات التأمين',
        'معاملات التأمين',
        'ربط المرضى بالتأمين',
        'ربط العلاجات بالتأمين',
        'متابعة حالة المطالبات',
        'تقارير التأمين'
      ]
    },
    {
      title: 'قسم الإعدادات',
      icon: <SettingsIcon />,
      items: [
        'إعدادات العيادة',
        'تعريف أنواع العلاجات والأسعار',
        'الوضع الفاتح والداكن',
        'دعم العربية والإنجليزية',
        'تفضيلات المستخدم',
        'إعدادات الإشعارات والطباعة'
      ]
    },
    {
      title: 'قسم التقارير والإحصائيات',
      icon: <ChartIcon />,
      items: [
        'لوحة التقارير الشاملة',
        'تقرير المرضى والأطباء',
        'التقارير المالية',
        'تقرير الموردين',
        'طباعة التقارير'
      ]
    },
    {
      title: 'قسم الإشعارات',
      icon: <BellIcon />,
      items: [
        'إشعارات المواعيد',
        'إشعارات المخزون',
        'إشعاراتCases dentist lab',
        'الإشعارات العاجلة',
        'صندوق الإشعارات'
      ]
    }
  ];

  const techFeatures = [
    'نظام أمان متقدم وتسجيل الدخول الآمن',
    'تحكم بالوصول وصلاحيات دقيق (RBAC)',
    'الوضع الداكن',
    'دعم اللغات (العربية والإنجليزية)',
    'تصميم متجاوب لجميع الأجهزة',
    'نظام إشعارات ذكي',
    'لوحة معلومات إحصائيات real-time'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-lg shadow-purple-500/30 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4">
            كيورا دنت | CuraDent
          </h1>
          <p className="text-xl text-violet-600 dark:text-violet-400 font-medium mb-4">
            نظام إدارة عيادات الأسنان
          </p>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            نظام متكامل لإدارة عيادات طب الأسنان، يوفر حلاً شاملاً لإدارة المرضى والمواعيد والمالية والمخزون في مكان واحد
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, index) => (
            <FeatureItem
              key={index}
              icon={section.icon}
              title={section.title}
              items={section.items}
            />
          ))}
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
          <p className="font-medium">كيورا دنت | CuraDent - الحل الأمثل لإدارة عيادات الأسنان بكفاءة واحترافية</p>
          <p className="text-sm mt-2">© 2024 جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
