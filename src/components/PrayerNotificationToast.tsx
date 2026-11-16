import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Volume2, ChevronRight, Clock } from 'lucide-react';
import { PrayerNotificationEvent, playGentleChime } from '../utils/notificationService';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface PrayerNotificationToastProps {
  notification: PrayerNotificationEvent | null;
  onDismiss: () => void;
  onNavigateToTab?: (tab: string) => void;
  isDark?: boolean;
  language?: string;
}

export const PrayerNotificationToast: React.FC<PrayerNotificationToastProps> = ({
  notification,
  onDismiss,
  onNavigateToTab,
  isDark = true,
  language = 'en',
}) => {
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 12000;
    const startTime = Date.now();

    const dismissTimer = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);
    }, 100);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [notification]);

  if (!notification) return null;

  return (
    <div
      id="prayer-notification-floating-toast"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fadeIn"
      role="alert"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`rounded-3xl p-4 sm:p-5 border shadow-lg relative overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.12] text-[#F3F4F6]'
            : 'bg-white border-black/[0.1] text-[#111214]'
        }`}
      >
        {/* Minimal Progress Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'}`}>
          <div
            className={`h-full transition-all duration-100 ease-linear ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <span className="text-xl">🕌</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${
                  isDark ? 'text-stone-300' : 'text-[#6B6F76]'
                }`}>
                  <Bell className="w-3 h-3 animate-bounce" />
                  <span>{t(langCode, 'prayerReminderTitle')}</span>
                </span>
                {!isArabic && (
                  <span className={`font-arabic text-sm font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {notification.arabicName}
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-bold mt-0.5">
                {isArabic
                  ? `صلاة ${notification.arabicName} ${
                      notification.minutesBefore > 0
                        ? `(خلال ${notification.minutesBefore} دقيقة)`
                        : '(حان وقتها الآن)'
                    }`
                  : `${notification.prayerName} Prayer ${
                      notification.minutesBefore > 0
                        ? `in ${notification.minutesBefore}m`
                        : 'Time (Now)'
                    }`}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => playGentleChime(0.3)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-white/[0.08] text-stone-400 hover:text-white'
                  : 'hover:bg-black/[0.05] text-[#6B6F76] hover:text-[#111214]'
              }`}
              title={isArabic ? 'تشغيل التنبيه' : 'Play Chime'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-white/[0.08] text-stone-400 hover:text-white'
                  : 'hover:bg-black/[0.05] text-[#6B6F76] hover:text-[#111214]'
              }`}
              title={isArabic ? 'إغلاق' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Message & Quran Quote */}
        <div className="mt-2.5 pl-1">
          <p className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isArabic
                ? `الموعد المقرر: ${notification.prayerTime}`
                : `${t(langCode, 'prayerScheduledFor')} ${notification.prayerTime}`}
            </span>
          </p>
          <p className={`text-[11px] mt-1 font-light italic leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            {notification.quote}
          </p>
        </div>

        {/* Bottom Quick Action */}
        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            {isArabic
              ? notification.minutesBefore > 0
                ? 'استعد للوضوء والتأهب للصلاة'
                : 'الله أكبر — حان وقت الوقوف بين يدي الله'
              : notification.minutesBefore > 0
              ? 'Time for Wudhu & preparation'
              : 'Allāhu Akbar'}
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onNavigateToTab('prayer-check');
                  onDismiss();
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'bg-white text-[#111214] hover:bg-stone-200'
                    : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                <span>{isArabic ? 'التحقق من الصلاة' : 'Check Prayer (Oath)'}</span>
                <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            )}
            <button
              onClick={onDismiss}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-[#6B6F76] hover:text-[#111214]'
              }`}
            >
              {isArabic ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
