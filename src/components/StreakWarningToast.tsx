import React from 'react';
import { Flame, X, BookOpen, GraduationCap, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { StreakRiskStatus } from '../utils/streakManager';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface StreakWarningToastProps {
  status: StreakRiskStatus | null;
  onDismiss: () => void;
  onNavigate: (tab: 'quran' | 'dhikr' | 'learn') => void;
  isDark?: boolean;
  language?: string;
}

export const StreakWarningToast: React.FC<StreakWarningToastProps> = ({
  status,
  onDismiss,
  onNavigate,
  isDark = true,
  language = 'en',
}) => {
  if (!status || !status.isAtRisk) return null;

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  return (
    <div
      id="streak-risk-floating-toast"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[92%] max-w-md animate-fadeIn select-none"
      role="alert"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`rounded-3xl p-4 sm:p-5 border shadow-lg relative overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-rose-500/40 text-[#F3F4F6]'
            : 'bg-white border-rose-300 text-[#111214]'
        }`}
      >
        {/* Semantic Alert Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/20">
          <div className="h-full bg-rose-500" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 animate-flame-radiant ${
              isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'
            }`}>
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isDark
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>{t(langCode, 'streakAtRiskBadge')}</span>
                </span>
                <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{status.formattedTime} {t(langCode, 'timeLeft')}</span>
                </span>
              </div>
              <h4 className={`text-sm font-bold tracking-wide mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic
                  ? `لا تفقد سلسلة الأيام المتواصلة (${status.currentStreak} يوم)!`
                  : `${t(langCode, 'dontLoseStreak')} (${status.currentStreak})`}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className={`p-1 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]'
                : 'text-[#6B6F76] hover:text-[#111214] hover:bg-black/[0.05]'
            }`}
            title={isArabic ? 'إغلاق التنبيه' : 'Dismiss warning'}
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanatory Message */}
        <p className={`text-xs font-normal leading-relaxed mb-3.5 pl-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          {t(langCode, 'streakActionPrompt')}
        </p>

        {/* Quick Action Navigation Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNavigate('learn')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-white text-[#111214] border-white hover:bg-stone-200'
                : 'bg-[#111214] text-white border-[#111214] hover:bg-[#27292D]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t(langCode, 'study')}</span>
          </button>

          <button
            onClick={() => onNavigate('quran')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-stone-200'
                : 'bg-[#F3F3F1] hover:bg-black/[0.07] border-black/[0.08] text-[#111214]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t(langCode, 'quran')}</span>
          </button>

          <button
            onClick={() => onNavigate('dhikr')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-stone-200'
                : 'bg-[#F3F3F1] hover:bg-black/[0.07] border-black/[0.08] text-[#111214]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t(langCode, 'dhikr')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
