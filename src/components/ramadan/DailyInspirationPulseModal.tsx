import React, { useState, useEffect } from 'react';
import {
  Flame,
  X,
  Share2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Heart,
  Check,
  AlertTriangle,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import { DailyInspirationItem } from '../../types/ramadan';
import { trackInspirationPulse } from '../../utils/ramadanDb';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  modalBackdropVariants,
  inspirationCardVariants,
  lineRevealContainer,
  lineRevealItem,
  gentlePulseVariant,
} from '../../utils/animations';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface DailyInspirationPulseModalProps {
  isOpen: boolean;
  onDismissTemporarily: () => void;
  onEngagedComplete: () => void;
  item: DailyInspirationItem;
  dayNumber?: number;
  isDark?: boolean;
  language?: string;
}

export const DailyInspirationPulseModal: React.FC<DailyInspirationPulseModalProps> = ({
  isOpen,
  onDismissTemporarily,
  onEngagedComplete,
  item,
  dayNumber = 1,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'daily-inspiration-pulse-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasCopiedShare, setHasCopiedShare] = useState<boolean>(false);

  const handleReadMore = () => {
    setIsExpanded(true);
    trackInspirationPulse(item.id, item.contentType, true);
  };

  const handleFinishEngagement = () => {
    trackInspirationPulse(item.id, item.contentType, true);
    onEngagedComplete();
  };

  const handleShare = async () => {
    const textToShare = isArabic
      ? `🌙 *نبض نور الإيماني لشهر رمضان (اليوم ${dayNumber})*\n\n"${item.hook}"\n\n${item.shareMessage}\n\nاقرأ المزيد في تطبيق «نور»: رفيقك الإيماني المبارك`
      : `🌙 *NOOR Ramadan Daily Awakening (Day ${dayNumber})*\n\n"${item.hook}"\n\n${item.shareMessage}\n\nRead more in NOOR: Peaceful Islamic Companion`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: textToShare,
          url: window.location.origin + '/noor-ramadan',
        });
        setHasCopiedShare(true);
        setTimeout(() => setHasCopiedShare(false), 3000);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToShare);
      setHasCopiedShare(true);
      setTimeout(() => setHasCopiedShare(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="daily-inspiration-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto ${isDark ? 'bg-[#03050B]/92' : 'bg-stone-900/50 backdrop-blur-sm'}`}
          role="dialog"
          aria-modal="true"
          aria-label={isArabic ? 'نبض الإلهام الرمضاني اليومي' : 'Daily Ramadan Inspiration Pulse'}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Outer Card */}
          <motion.div
            key="daily-inspiration-card"
            variants={inspirationCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`w-full max-w-lg rounded-[32px] border relative overflow-hidden flex flex-col justify-between transition-colors ${
              isDark
                ? 'shadow-2xl bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
                : 'shadow-2xl bg-[#FCFCFA] border-black/[0.08] text-[#111214]'
            }`}
          >
            {/* Header Bar */}
            <div className={`relative z-10 flex items-center justify-between px-6 pt-5 pb-3 border-b backdrop-blur-md ${
              isDark ? 'border-white/[0.08] bg-[#14161A]/90' : 'border-black/[0.08] bg-white/90'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${
                  isDark
                    ? 'bg-white/[0.08] border-white/15 text-white'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                }`}>
                  <Flame className={`w-5 h-5 animate-pulse ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {isArabic ? `نبض إيماني • اليوم ${dayNumber}` : `Daily Inspiration Pulse • Day ${dayNumber}`}
                    </span>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono border ${
                      isDark ? 'bg-white/[0.08] text-stone-200 border-white/15' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.1]'
                    }`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className={`text-xs font-serif-heading ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                    {isArabic ? 'يقظة قلبية مباركة لشهر رمضان' : 'Heart Awakening for Ramadan'}
                  </p>
                </div>
              </div>

              <button
                onClick={onDismissTemporarily}
                className={`p-2 rounded-xl transition-colors cursor-pointer btn-press-bounce ${
                  isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
                }`}
                title={isArabic ? 'تأجيل مؤقت' : 'Swipe away temporarily'}
                aria-label="Dismiss temporarily"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body: Line-by-line staggered reveal */}
            <motion.div
              variants={lineRevealContainer}
              initial="initial"
              animate="animate"
              className="relative z-10 p-6 space-y-4 max-h-[72dvh] overflow-y-auto"
            >
              {/* Arabic Heading if available */}
              {item.arabicHeading && (
                <motion.div variants={lineRevealItem} className="text-center">
                  <p className={`text-xl sm:text-2xl font-arabic font-bold leading-relaxed ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
                    « {item.arabicHeading} »
                  </p>
                </motion.div>
              )}

              {/* Title */}
              <motion.div variants={lineRevealItem}>
                <h2 className={`text-xl sm:text-2xl font-serif-heading font-bold text-center tracking-wide ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {item.title}
                </h2>
              </motion.div>

              {/* Shocking / Stirring Hook Callout */}
              <motion.div
                variants={lineRevealItem}
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                  <p className={`text-sm sm:text-base font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    "{item.hook}"
                  </p>
                </div>
              </motion.div>

              {/* Expandable / Full Content */}
              {!isExpanded ? (
                <motion.div variants={lineRevealItem} className="space-y-3">
                  <p className={`text-xs sm:text-sm leading-relaxed font-light ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                    {item.previewText}
                  </p>

                  <motion.button
                    type="button"
                    variants={gentlePulseVariant}
                    animate="animate"
                    onClick={handleReadMore}
                    className={`w-full py-3.5 px-5 rounded-2xl font-cinzel text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 btn-press-bounce ${
                      isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{isArabic ? 'قراءة المزيد وتدبر المعنى (مطلوب للإتمام)' : 'Read More & Stir Your Heart (Required to Clear)'}</span>
                  </motion.button>

                  <p className={`text-[10px] text-center font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic
                      ? '* سيعاود هذا النبض الظهور إذا أجلته حتى تتدبره وتتمه.'
                      : '* This pulse reappears if dismissed until you engage and reflect.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div variants={lineRevealItem} className="space-y-4">
                  <div className={`p-4 rounded-2xl border space-y-3 text-xs sm:text-sm leading-relaxed font-light whitespace-pre-line ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-white border-black/[0.08] text-[#111214] shadow-2xs'
                  }`}>
                    {item.fullContent}
                  </div>

                  {/* Source or Citation */}
                  <div className={`flex items-center justify-between text-[11px] font-mono px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    <span>{isArabic ? 'المصدر / التخريج: ' : 'Source: '}{item.sourceOrCitation}</span>
                  </div>

                  {/* Call to Action Box */}
                  <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                    <div>
                      <strong className={`block font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{isArabic ? 'العمل والتطبيق الفوري:' : 'Immediate Action:'}</strong>
                      <span>{item.actionCall}</span>
                    </div>
                  </div>

                  {/* Final Complete Button & Share */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleFinishEngagement}
                      className={`w-full sm:flex-1 py-3 px-5 rounded-2xl font-cinzel text-xs font-bold tracking-wider uppercase shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 btn-press-bounce ${
                        isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isArabic ? 'تدبرت بقلبي — إتمام النبض' : 'I Have Reflected — Complete Pulse'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className={`w-full sm:w-auto py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-press-bounce ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-stone-200'
                          : 'bg-white hover:bg-black/[0.03] border-black/[0.08] text-[#111214]'
                      }`}
                      title={isArabic ? 'مشاركة النبض مع الأهل والأصدقاء' : 'Forward this reflection to family & friends'}
                    >
                      <Share2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                      <span>{hasCopiedShare ? (isArabic ? 'تم النسخ!' : 'Copied to Share!') : (isArabic ? 'مشاركة النبض' : 'Share Pulse')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Footer Note */}
            <div className={`relative z-10 px-6 py-3 border-t flex items-center justify-between text-[10px] font-mono ${
              isDark ? 'border-white/[0.08] bg-[#14161A] text-stone-400' : 'border-black/[0.08] bg-white text-[#5A5D63]'
            }`}>
              <span>{isArabic ? 'نبض نور الإيماني الرمضاني' : 'NOOR Ramadan Spiritual Pulse'}</span>
              <button
                onClick={onDismissTemporarily}
                className={`transition-colors underline cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-[#111214]'}`}
              >
                {isArabic ? 'ذكرني بعد ساعتين' : 'Remind me in 2 hours'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
