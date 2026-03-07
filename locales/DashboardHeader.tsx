import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Bell, Calendar } from 'lucide-react';

const DashboardHeader = () => {
  const { t } = useTranslation();
  
  // تحديد التحية بناءً على الوقت الحالي
  const date = new Date();
  const hours = date.getHours();
  const greeting = hours < 12 ? t('dashboard.greeting.morning') : t('dashboard.greeting.evening');
  
  // تنسيق التاريخ باللغة العربية
  const formattedDate = new Intl.DateTimeFormat('ar-EG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date);

  return (
    <div className="w-full mb-8">
      {/* الكرت الرئيسي بتصميم متدرج وزوايا دائرية */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-xl border border-blue-400/30 transition-all hover:shadow-2xl">
        
        {/* عناصر خلفية زخرفية لإضافة عمق وجمالية */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 gap-6">
          
          {/* الجانب الأيمن: الترحيب والمعلومات */}
          <div className="flex-1 space-y-3">
            {/* شارة التاريخ */}
            <div className="inline-flex items-center gap-2 bg-blue-900/30 px-4 py-1.5 rounded-2xl text-sm font-medium text-blue-100 backdrop-blur-sm border border-white/20">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            
            {/* عنوان الترحيب */}
            <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
              {greeting}، <span className="text-blue-200">د. أحمد</span>
            </h1>
            
            {/* رسالة الترحيب الفرعية */}
            <p className="text-blue-100 text-lg max-w-2xl opacity-90 leading-relaxed font-light">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>

          {/* الجانب الأيسر: الإجراءات السريعة */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            {/* زر التنبيهات */}
            <button 
              className="group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white p-3.5 rounded-2xl backdrop-blur-md transition-all duration-300 border border-white/20 hover:border-white/40"
              aria-label={t('sidebar.notifications')}
            >
              <Bell className="h-6 w-6 transition-transform group-hover:rotate-12" />
            </button>
            
            {/* زر إضافة مريض (الإجراء الرئيسي) */}
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:text-blue-700 dark:hover:bg-blue-50 px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              <div className="bg-white/20 dark:bg-blue-100 p-1 rounded-full">
                <Plus className="h-4 w-4 text-white dark:text-blue-700" />
              </div>
              <span>{t('dashboard.addPatient')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
