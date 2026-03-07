import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../hooks/useI18n';

type LoadingScreenMode = 'auth' | 'data';

interface LoadingScreenProps {
  mode?: LoadingScreenMode;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ mode = 'data' }) => {
  const { locale, direction, t } = useI18n();
  const isArabic = locale === 'ar';
  const [progress, setProgress] = useState(mode === 'auth' ? 20 : 14);

  useEffect(() => {
    setProgress(mode === 'auth' ? 20 : 14);
  }, [mode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress(previous => {
        if (previous >= 92) {
          return previous;
        }

        const step = previous < 45 ? 5 : previous < 75 ? 3 : 1;
        return Math.min(92, previous + step);
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  const content = useMemo(() => {
    const loadingTitle = t('loadingScreen.loadingData');
    const loadingSubtitle = t('loadingScreen.pleaseWait');

    if (mode === 'auth') {
      return isArabic
        ? {
            badge: 'تهيئة الدخول',
            title: 'جاري تجهيز مساحة العمل',
            subtitle: 'يتم التحقق من الحساب والصلاحيات قبل فتح النظام.',
            progressLabel: 'قيد التحميل',
            items: ['التحقق من الحساب', 'استعادة العيادة', 'تطبيق الصلاحيات'],
          }
        : {
            badge: 'Starting session',
            title: 'Preparing your workspace',
            subtitle: 'Verifying account access and permissions before the app opens.',
            progressLabel: 'Loading',
            items: ['Validating account', 'Restoring clinic', 'Applying permissions'],
          };
    }

    return isArabic
      ? {
          badge: 'تحميل البيانات',
          title: loadingTitle !== 'loadingScreen.loadingData' ? loadingTitle : 'جاري تحميل البيانات',
          subtitle: loadingSubtitle !== 'loadingScreen.pleaseWait' ? loadingSubtitle : 'يرجى الانتظار، يتم تجهيز بيانات العيادة.',
          progressLabel: 'قيد التحميل',
          items: ['المرضى', 'المواعيد', 'لوحة التحكم'],
        }
      : {
          badge: 'Loading data',
          title: loadingTitle !== 'loadingScreen.loadingData' ? loadingTitle : 'Loading clinic data',
          subtitle: loadingSubtitle !== 'loadingScreen.pleaseWait' ? loadingSubtitle : 'Please wait while clinic data is prepared.',
          progressLabel: 'Loading',
          items: ['Patients', 'Appointments', 'Dashboard'],
        };
  }, [isArabic, mode, t]);

  return (
    <div
      dir={direction}
      className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)] text-white"
    >
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl animate-pulse-slow motion-reduce:animate-none" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute right-0 top-16 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_24px_100px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse motion-reduce:animate-none" />
            {content.badge}
          </div>

          <div className="relative mx-auto mt-8 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-300/25" />
            <div className="absolute inset-[-12px] rounded-full border border-cyan-200/15 [animation:spin_16s_linear_infinite] motion-reduce:animate-none" />
            <div className="rounded-[28px] bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-5 shadow-[0_18px_50px_rgba(14,165,233,0.4)]">
              <img src="/logo.svg" alt="CuraSoft logo" className="h-12 w-12 object-contain" />
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            {content.subtitle}
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/35 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
              <span>{content.progressLabel}</span>
              <span className="font-semibold text-white">{progress}%</span>
            </div>

            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={content.progressLabel}
            >
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.32)_45%,transparent_100%)] [background-size:200%_100%] [animation:shimmer_2.2s_linear_infinite]" />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {content.items.map(item => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
