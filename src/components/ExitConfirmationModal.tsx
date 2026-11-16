import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  BookOpen,
  Heart,
  Compass,
} from 'lucide-react';
import { exitToBrowserHome } from '../utils/historyManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount?: number;
  lastActivityDate?: string;
  isDark?: boolean;
  language?: string;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  streakCount = 0,
  lastActivityDate,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'exit-confirmation-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  const [selectedReason, setSelectedReason] = useState<string>('accidental');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reasons = isArabic
    ? [
        {
          id: 'accidental',
          label: 'نقرتُ زر الرجوع في المتصفح عن طريق الخطأ',
          sublabel: 'ابقَ في واحة نور، فجميع إنجازاتك وسجلاتك محفوظة.',
          icon: RotateCcw,
          recommended: true,
        },
        {
          id: 'break',
          label: 'أرغب في أخذ استراحة قصيرة وسأعود لاحقاً',
          sublabel: 'سلسلتك وإشاراتك المرجعية في أمان تام.',
          icon: Sparkles,
          recommended: false,
        },
        {
          id: 'completed',
          label: 'أتممت وردي القرآني وأذكاري لهذا اليوم',
          sublabel: 'الحمد لله الذي بنعمته تتم الصالحات.',
          icon: Heart,
          recommended: false,
        },
        {
          id: 'browser_home',
          label: 'الانتقال إلى صفحة المتصفح الرئيسية',
          sublabel: 'مغادرة التطبيق والعودة لصفحة البداية.',
          icon: ExternalLink,
          recommended: false,
        },
      ]
    : [
        {
          id: 'accidental',
          label: 'I accidentally clicked the browser Back button',
          sublabel: 'Stay right here in Noor with all your progress saved.',
          icon: RotateCcw,
          recommended: true,
        },
        {
          id: 'break',
          label: 'Taking a short break (I will return later)',
          sublabel: 'Your streaks and bookmarks will be waiting safely.',
          icon: Sparkles,
          recommended: false,
        },
        {
          id: 'completed',
          label: 'Done with my daily recitation & remembrance',
          sublabel: 'Alhamdulillah for completing your daily worship.',
          icon: Heart,
          recommended: false,
        },
        {
          id: 'browser_home',
          label: 'Take me to my browser home page',
          sublabel: 'Leave Noor and return to your browser navigation.',
          icon: ExternalLink,
          recommended: false,
        },
      ];

  const handleConfirmExit = () => {
    exitToBrowserHome();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label={t(langCode, 'exitTitle')}
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden flex flex-col transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
            : 'bg-white border-black/[0.08] text-[#111214]'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-3 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs ${
              isDark ? 'bg-rose-500/15 border-rose-500/30' : 'bg-rose-50 border-rose-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {t(langCode, 'exitTitle')}
              </h3>
              <p className={`text-xs font-sans ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {t(langCode, 'exitSub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
            }`}
            title={isArabic ? 'إغلاق والبقاء في نور' : 'Close and stay in Noor'}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Active Streak Safeguard Reminder */}
          {streakCount > 0 ? (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.1] text-[#F3F4F6]'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-white/[0.08] text-white' : 'bg-white text-[#111214] border border-black/[0.08]'
              }`}>
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs">
                <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <span>{streakCount} {t(langCode, 'days')} {t(langCode, 'activeStreak')}!</span>
                </div>
                <p className={`font-light mt-0.5 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? 'احرص على قراءة وردك القرآني أو إتمام أذكاري اليوم قبل المغادرة حتى لا تفقد سلسلتك المباركة.'
                    : 'Make sure you have recited your Qur\'an or tapped today\'s Dhikr before leaving so your streak is preserved.'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-white/[0.08] text-white' : 'bg-white text-[#111214] border border-black/[0.08]'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <p className={`text-xs font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {isArabic
                  ? 'هل تريد مغادرة واحة نور؟ اختر السبب أدناه أو ابقَ معنا لمواصلة رحلتك الإيمانية الهادئة:'
                  : 'You pressed the browser Back button at the home screen. Tell us why you\'re leaving or stay to keep your peaceful journey going:'}
              </p>
            </div>
          )}

          {/* Interactive Reasons Selection */}
          <div className="space-y-2">
            <label className={`text-[11px] font-semibold uppercase tracking-wider block font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {isArabic ? 'ما هو سبب المغادرة؟' : 'Why are you leaving?'}
            </label>

            {reasons.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;

              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isRTL ? 'text-right' : 'text-left'
                  } ${
                    isSelected
                      ? isDark
                        ? 'bg-white/[0.1] border-white/35'
                        : 'bg-[#111214]/[0.06] border-[#111214]/40'
                      : isDark
                      ? 'bg-[#1B1D23]/70 border-white/[0.06] hover:border-white/[0.15]'
                      : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.18]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? isDark
                          ? 'bg-white text-[#111214]'
                          : 'bg-[#111214] text-white'
                        : isDark ? 'bg-white/[0.06] text-stone-400' : 'bg-[#F3F3F1] text-[#5A5D63]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? isDark ? 'text-white' : 'text-[#111214]'
                            : isDark ? 'text-stone-200' : 'text-[#111214]'
                        }`}
                      >
                        {reason.label}
                      </span>
                      {reason.recommended && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border font-bold ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}>
                          {isArabic ? 'موصى به' : 'Accidental?'}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 font-light ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {reason.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className={`p-5 pt-3 border-t flex flex-col sm:flex-row items-center gap-2.5 ${
          isDark ? 'bg-[#0B0C0E]/70 border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
        }`}>
          <button
            onClick={onClose}
            className={`w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-bold font-cinzel tracking-wider shadow-sm active:scale-95 transition-all text-center cursor-pointer ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            {t(langCode, 'stayInApp')}
          </button>

          <button
            onClick={handleConfirmExit}
            className={`w-full sm:w-auto py-3 px-4 rounded-2xl border text-xs font-semibold transition-all active:scale-95 text-center cursor-pointer ${
              isDark
                ? 'bg-white/[0.05] hover:bg-red-500/15 text-stone-400 hover:text-red-400 border-white/[0.1] hover:border-red-500/30'
                : 'bg-white hover:bg-red-50 text-[#3F4248] hover:text-red-700 border-black/[0.1] hover:border-red-300'
            }`}
          >
            {t(langCode, 'confirmExit')}
          </button>
        </div>
      </div>
    </div>
  );
};
