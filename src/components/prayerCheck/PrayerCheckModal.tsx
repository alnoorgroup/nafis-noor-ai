import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  Compass,
  ArrowRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { PrayerName, PrayerCheckStatus, PrayerCheckStep, PrayerRecord } from '../../types/prayerCheck';
import { PRAYER_ARABIC_NAMES } from '../../utils/aladhanService';
import { savePrayerRecord, buildPrayerId, markPrayerAsMissed } from '../../utils/prayerCheckDb';
import { OathFaqModal } from './OathFaqModal';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  modalBackdropVariants,
  modalBloomVariants,
  staggerButtonContainer,
  staggerButtonItem,
  SPRING_TRANSITION,
} from '../../utils/animations';
import { t, getLanguageCode, isRTLLanguage, TranslationKey } from '../../utils/i18n';

interface PrayerCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: PrayerName;
  scheduledTimeStr: string;
  prayerDate?: Date;
  onComplete?: (record: PrayerRecord) => void;
  isDark?: boolean;
  language?: string;
}

export const PrayerCheckModal: React.FC<PrayerCheckModalProps> = ({
  isOpen,
  onClose,
  prayerName,
  scheduledTimeStr,
  prayerDate = new Date(),
  onComplete,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'prayer-check-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  // Step state
  const [currentStep, setCurrentStep] = useState<PrayerCheckStep>(1);
  const [selectedTimingStatus, setSelectedTimingStatus] = useState<'on_time' | 'late'>('on_time');
  const [oathGiven, setOathGiven] = useState<boolean>(false);
  const [finalStatus, setFinalStatus] = useState<PrayerCheckStatus>('on_time');
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);

  // 20-second oath countdown timer (persisted across app close and reload via timestamp delta)
  const [countdownRemaining, setCountdownRemaining] = useState<number>(20);
  const countdownIntervalRef = useRef<any>(null);

  const dateStr = prayerDate.toISOString().split('T')[0];
  const prayerId = buildPrayerId(dateStr, prayerName);

  // Format date readable according to selected language
  const formattedDate = prayerDate.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // STEP 2: 20-Second Locked Countdown with Timestamp Delta Persistence
  useEffect(() => {
    if (currentStep !== 2) return;

    const timerStorageKey = `noor_oath_timer_target_${prayerId}`;
    let targetTimestamp: number;

    const savedTarget = localStorage.getItem(timerStorageKey);
    const now = Date.now();

    if (savedTarget && !isNaN(Number(savedTarget))) {
      targetTimestamp = Number(savedTarget);
      if (targetTimestamp < now - 600000) {
        targetTimestamp = now + 3000;
        localStorage.setItem(timerStorageKey, targetTimestamp.toString());
      }
    } else {
      targetTimestamp = now + 3000;
      localStorage.setItem(timerStorageKey, targetTimestamp.toString());
    }

    const updateTimer = () => {
      const currentNow = Date.now();
      const diffMs = targetTimestamp - currentNow;
      const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
      setCountdownRemaining(remainingSeconds);

      if (remainingSeconds <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };

    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 250);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [currentStep, prayerId]);

  if (!isOpen) return null;

  // STEP 1 Action: User selects On Time or Late
  const handleSelectTiming = (timing: 'on_time' | 'late') => {
    setSelectedTimingStatus(timing);
    setCurrentStep(2);
  };

  // STEP 2 Action: User acknowledges oath education after 20-second countdown
  const handleAcknowledgeOath = () => {
    if (countdownRemaining > 0) return;
    setCurrentStep(3);
  };

  // STEP 3 Actions
  const handleConfirmUnderOath = async () => {
    const record: PrayerRecord = {
      prayerId,
      date: dateStr,
      prayerName,
      status: selectedTimingStatus,
      confirmedAt: new Date().toISOString(),
      oathGiven: true,
      scheduledTime: scheduledTimeStr,
      createdAt: new Date().toISOString(),
    };

    await savePrayerRecord(record);
    setFinalStatus(selectedTimingStatus);
    setOathGiven(true);
    setCurrentStep(4);
    if (onComplete) onComplete(record);
  };

  const handleDidNotPray = async () => {
    const record: PrayerRecord = {
      prayerId,
      date: dateStr,
      prayerName,
      status: 'did_not_pray',
      confirmedAt: new Date().toISOString(),
      oathGiven: false,
      scheduledTime: scheduledTimeStr,
      createdAt: new Date().toISOString(),
    };

    await savePrayerRecord(record);
    setFinalStatus('did_not_pray');
    setOathGiven(false);
    setCurrentStep(4);
    if (onComplete) onComplete(record);
  };

  const arabicPrayerName = PRAYER_ARABIC_NAMES[prayerName] || prayerName;
  const prayerDisplay = isArabic
    ? arabicPrayerName
    : t(langCode, prayerName.toLowerCase() as TranslationKey);

  const stepSubtitle =
    currentStep === 1
      ? t(langCode, 'prayerVerificationStep')
      : currentStep === 2
      ? t(langCode, 'reflectionStep')
      : currentStep === 3
      ? t(langCode, 'confirmationStep')
      : t(langCode, 'recordSavedStep');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="prayer-check-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060C]/90 select-none overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={isArabic ? 'إقرار ومتابعة الصلاة' : 'Prayer Check Confirmation'}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Full-Screen Container Card */}
            <motion.div
              key="prayer-check-card"
              variants={modalBloomVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full max-w-lg min-h-[540px] max-h-[92dvh] rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6] shadow-2xl'
                  : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214] shadow-2xl'
              }`}
            >
              {/* Modal Header Bar with Step Indicator */}
              <div className={`relative z-10 flex items-center justify-between px-6 pt-5 pb-3 border-b backdrop-blur-md ${
                isDark ? 'border-white/[0.08] bg-[#14161A]/90' : 'border-black/[0.08] bg-white/90'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${
                    isDark ? 'bg-white/[0.08] border-white/15 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-cinzel font-bold tracking-wider uppercase ${
                      isDark ? 'text-white' : 'text-[#111214]'
                    }`}>
                      {isArabic ? `التحقق من الصلاة — الخطوة ${currentStep} من 4` : `${t(langCode, 'prayerCheckShort')} — ${t(langCode, 'stepOf')} ${currentStep}/4`}
                    </h3>
                    <p className={`text-[11px] font-sans ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {stepSubtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
                  }`}
                  title={isArabic ? 'إغلاق' : 'Close'}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Pill Indicator */}
              <div className="relative z-10 px-6 pt-3 flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      currentStep >= step
                        ? isDark ? 'bg-white' : 'bg-[#111214]'
                        : isDark ? 'bg-white/10' : 'bg-black/[0.08]'
                    }`}
                  />
                ))}
              </div>

              {/* ========================================================================= */}
              {/* STEP 1: ASK IF THEY PRAYED OR NO                                          */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-3 pt-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
                      isDark ? 'bg-white/[0.06] border-white/15 text-stone-200' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Prayer Name & Calligraphy */}
                    <div className="space-y-1">
                      <h2 className={`text-3xl sm:text-4xl font-serif-heading font-bold tracking-wide ${
                        isDark ? 'text-white' : 'text-[#111214]'
                      }`}>
                        {isArabic ? `صلاة ${arabicPrayerName}` : `${prayerDisplay} Prayer`}
                      </h2>
                      {!isArabic && (
                        <p className={`text-2xl font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                          صلاة {arabicPrayerName}
                        </p>
                      )}
                    </div>

                    {/* Scheduled Time Banner */}
                    <div className={`p-4 rounded-2xl border max-w-sm mx-auto ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
                    }`}>
                      <div className={`text-xs uppercase tracking-widest font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic ? 'وقت الصلاة المقرر' : t(langCode, 'scheduledAt')}
                      </div>
                      <div className={`text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {scheduledTimeStr}
                      </div>
                      <div className={`text-[11px] flex items-center justify-center gap-1 mt-1 font-sans ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        <span>{isArabic ? 'مهلة 10 دقائق تُعد صلاة في الوقت' : '10-Minute Grace Period counts as On-Time'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    variants={staggerButtonContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-3 pt-1"
                  >
                    <p className={`text-sm font-semibold text-center font-sans ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                      {isArabic
                        ? `هل صليت صلاة ${arabicPrayerName}؟`
                        : t(langCode, 'didYouPrayQuestion').replace('{prayer}', prayerDisplay)}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <motion.div variants={staggerButtonItem}>
                        <button
                          type="button"
                          onClick={() => handleSelectTiming('on_time')}
                          className={`w-full p-4 rounded-2xl border hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer group btn-press-bounce ${
                            isDark
                              ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 shadow-lg'
                              : 'bg-emerald-50 border-emerald-300 hover:border-emerald-500 shadow-xs'
                          } ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                              <span>{t(langCode, 'yesOnTime')}</span>
                            </span>
                            <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${
                              isDark ? 'text-emerald-400' : 'text-emerald-600'
                            } ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                          <p className={`text-[11px] mt-1 font-light ${isDark ? 'text-emerald-200/70' : 'text-emerald-700'}`}>
                            {t(langCode, 'yesOnTimeDesc')}
                          </p>
                        </button>
                      </motion.div>

                      <motion.div variants={staggerButtonItem}>
                        <button
                          type="button"
                          onClick={() => handleSelectTiming('late')}
                          className={`w-full p-4 rounded-2xl border hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer group btn-press-bounce ${
                            isDark
                              ? 'bg-gradient-to-b from-sky-500/20 to-sky-950/40 border-sky-500/40 hover:border-sky-400 shadow-lg'
                              : 'bg-sky-50 border-sky-300 hover:border-sky-500 shadow-xs'
                          } ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                              <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                              <span>{t(langCode, 'yesLate')}</span>
                            </span>
                            <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${
                              isDark ? 'text-sky-400' : 'text-sky-600'
                            } ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                          <p className={`text-[11px] mt-1 font-light ${isDark ? 'text-sky-200/70' : 'text-sky-800/80'}`}>
                            {t(langCode, 'yesLateDesc')}
                          </p>
                        </button>
                      </motion.div>
                    </div>

                    <motion.div variants={staggerButtonItem}>
                      <button
                        type="button"
                        onClick={handleDidNotPray}
                        className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.97] btn-press-bounce ${
                          isDark
                            ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300'
                            : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span>{t(langCode, 'noDidNotPray')} ({t(langCode, 'noDidNotPrayDesc')})</span>
                      </button>
                    </motion.div>
                  </motion.div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: REFLECTION & 20-SECOND LOCKED COUNTDOWN                          */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-5 animate-fadeIn">
                  <div className="space-y-4">
                    <div className={`w-14 h-14 rounded-3xl border flex items-center justify-center mx-auto ${
                      isDark ? 'bg-white/[0.08] border-white/15 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                    }`}>
                      <ShieldAlert className="w-7 h-7 animate-pulse" />
                    </div>

                    <div className="text-center space-y-1.5">
                      <h2 className={`text-xl sm:text-2xl font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {t(langCode, 'solemnReflectionTitle')}
                      </h2>
                      <p className={`text-base font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                        {t(langCode, 'solemnReflectionArabic')}
                      </p>
                    </div>

                    {/* Solemn Education Card */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-white border-black/[0.08] text-[#111214] shadow-2xs'
                    }`}>
                      <p>{t(langCode, 'solemnReflectionP1')}</p>
                      <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>{t(langCode, 'solemnReflectionP2')}</p>
                    </div>

                    {/* Learn More Link to FAQ */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsFaqOpen(true)}
                        className={`inline-flex items-center gap-1.5 text-xs underline underline-offset-4 font-medium cursor-pointer transition-colors ${
                          isDark ? 'text-stone-200 hover:text-white' : 'text-[#111214] hover:text-[#3F4248]'
                        }`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>{t(langCode, 'learnMoreFaq')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        onClick={countdownRemaining === 0 ? handleAcknowledgeOath : undefined}
                        className={`relative w-28 h-28 flex items-center justify-center transition-all ${
                          countdownRemaining === 0
                            ? 'cursor-pointer active:scale-95 animate-pulse rounded-full'
                            : ''
                        }`}
                        title={countdownRemaining === 0 ? (isArabic ? 'اضغط للمتابعة' : 'Tap to proceed') : undefined}
                      >
                        <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            className={isDark ? 'stroke-stone-800/80' : 'stroke-stone-200'}
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="url(#monoTimerGradient)"
                            strokeWidth="5"
                            strokeDasharray={263.89}
                            strokeDashoffset={263.89 * (countdownRemaining / 3)}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-300 ease-linear"
                          />
                          <defs>
                            <linearGradient id="monoTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={isDark ? '#A1A1AA' : '#52525B'} />
                              <stop offset="50%" stopColor={isDark ? '#D4D4D8' : '#27292D'} />
                              <stop offset="100%" stopColor={isDark ? '#FFFFFF' : '#111214'} />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className={`absolute inset-0 flex flex-col items-center justify-center ${countdownRemaining === 0 ? 'cursor-pointer' : 'pointer-events-none'}`}>
                          <motion.span
                            key={countdownRemaining}
                            initial={{ scale: 1.25, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                            className={`text-2xl font-bold font-mono drop-shadow-sm ${isDark ? 'text-white' : 'text-[#111214]'}`}
                          >
                            {countdownRemaining === 0 ? '✓' : countdownRemaining}
                          </motion.span>
                          <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${
                            countdownRemaining === 0 ? (isDark ? 'text-white' : 'text-[#111214]') : (isDark ? 'text-stone-400' : 'text-[#5A5D63]')
                          }`}>
                            {countdownRemaining === 0 ? t(langCode, 'ready') : t(langCode, 'secs')}
                          </span>
                        </div>
                      </div>

                      <p className={`text-[11px] mt-2 font-mono text-center ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {countdownRemaining > 0
                          ? t(langCode, 'countdownInProgress')
                          : (isArabic ? 'اضغط على الدائرة أو الزر بالأسفل لتأكيد الصلاة' : 'Ready! Tap circle or button below to confirm')}
                      </p>
                    </div>

                    {/* "I Understand / Ready" Button */}
                    <button
                      type="button"
                      onClick={handleAcknowledgeOath}
                      disabled={countdownRemaining > 0}
                      className={`w-full py-3.5 px-6 rounded-2xl font-cinzel text-xs font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 btn-press-bounce ${
                        countdownRemaining > 0
                          ? isDark
                            ? 'bg-white/[0.06] text-stone-500 border border-white/10 cursor-not-allowed opacity-60'
                            : 'bg-[#F3F3F1] text-[#6B6F76] border border-black/[0.08] cursor-not-allowed opacity-80'
                          : isDark
                          ? 'bg-white hover:bg-stone-200 text-[#111214] shadow-sm cursor-pointer active:scale-95'
                          : 'bg-[#111214] hover:bg-[#27292D] text-white shadow-sm cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{countdownRemaining === 0 ? (isArabic ? 'جاهز • اضغط للمتابعة' : 'Ready • Tap to Proceed') : t(langCode, 'iUnderstandConfirm')}</span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRMATION (OR DID NOT PRAY) */}
              {currentStep === 3 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-4 pt-2">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
                      isDark ? 'bg-white/[0.08] border-white/15 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                    }`}>
                      <Compass className="w-6 h-6" />
                    </div>

                    <div>
                      <div className={`text-xs uppercase font-mono tracking-widest ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic ? `إقرار أداء صلاة ${arabicPrayerName}` : `${t(langCode, 'confirmationStep')}: ${prayerDisplay}`}
                      </div>
                      <h2 className={`text-2xl font-serif-heading font-bold mt-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {t(langCode, 'oathSolemnTitle')}
                      </h2>
                    </div>

                    {/* Arabic Calligraphy Box */}
                    <div className={`p-6 rounded-3xl border space-y-3 relative overflow-hidden ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1]'
                        : 'bg-white border-black/[0.08] shadow-sm'
                    }`}>
                      <p className={`text-xs font-sans uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic ? 'صيغة الإقرار والشهادة الشرعية:' : 'Declaration in Arabic:'}
                      </p>

                      <div className={`text-2xl sm:text-3xl font-arabic font-bold leading-loose py-2 ${
                        isDark ? 'text-white' : 'text-[#111214]'
                      }`} dir="rtl">
                        « أُقْسِمُ بِاللَّهِ الْعَظِيمِ أَنِّي قَدْ أَدَّيْتُ صَلَاةَ {arabicPrayerName} »
                      </div>

                      <p className={`text-xs font-serif italic border-t pt-3 ${
                        isDark ? 'border-white/10 text-stone-300' : 'border-black/[0.08] text-[#3F4248]'
                      }`}>
                        {isArabic
                          ? 'أشهد وأقر بصدق أني أديت هذه الصلاة لوجه الله تعالى'
                          : t(langCode, 'oathEnglishFormula').replace('{prayer}', prayerDisplay)}
                      </p>
                    </div>

                    <p className={`text-[11px] font-sans max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {t(langCode, 'oathSolemnSub')}
                    </p>
                  </div>

                  {/* Two Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmUnderOath}
                      className={`w-full py-4 px-6 rounded-2xl font-cinzel text-xs font-bold tracking-widest uppercase shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t(langCode, 'oathConfirmBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDidNotPray}
                      className={`w-full py-3 px-6 rounded-2xl border font-sans text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.1] text-stone-300 hover:text-white border-white/10 hover:border-white/20'
                          : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#3F4248] hover:text-[#111214] border-black/[0.08]'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 text-purple-500" />
                      <span>{t(langCode, 'noDidNotPray')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: COMPLETION (ACCEPTANCE OR MERCY) */}
              {currentStep === 4 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-5 pt-4">
                    {oathGiven ? (
                      <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto ${
                        isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      }`}>
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto ${
                        isDark ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'bg-purple-50 border-purple-300 text-purple-600'
                      }`}>
                        <Heart className="w-9 h-9" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h2 className={`text-2xl sm:text-3xl font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {oathGiven
                          ? isArabic
                            ? 'تقبّل الله منا ومنكم'
                            : t(langCode, 'prayerRecordedTitle')
                          : isArabic
                          ? 'إن الله غفور رحيم'
                          : 'Allah is Most Merciful'}
                      </h2>
                      <p className={`text-2xl font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                        {oathGiven ? 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ صَالِحَ الْأَعْمَالِ' : 'إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ'}
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border text-xs sm:text-sm max-w-sm mx-auto leading-relaxed ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300' : 'bg-white border-black/[0.08] text-[#3F4248] shadow-2xs'
                    }`}>
                      {oathGiven ? (
                        <p>
                          {isArabic
                            ? `تم تأكيد صلاة ${arabicPrayerName} وحفظها بأمان في سجلك المحلي على هذا الجهاز. تقبل الله طاعتكم وجعلها نوراً لكم.`
                            : t(langCode, 'prayerRecordedSub')}
                        </p>
                      ) : (
                        <p>
                          {isArabic
                            ? 'صدقك وإقرارك أمام الله أمانة ومحبة؛ لا تقنط من رحمة الله الواسعة. بادر بالوضوء الآن وأدِّ الصلاة قضاءً لوجه الله.'
                            : 'Your honesty before Allah is truly valued. Do not lose hope in Allah\'s boundless mercy. Make wudu now and perform this prayer (Qada).'}
                        </p>
                      )}
                    </div>

                    <div className={`inline-flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono ${
                      isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                    }`}>
                      <span className={`px-3 py-1 rounded-full border ${isDark ? 'bg-white/[0.06] border-white/10' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                        {isArabic ? 'الصلاة: ' : 'Prayer: '}<strong className={`uppercase ${isDark ? 'text-white' : 'text-[#111214]'}`}>{prayerDisplay}</strong>
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${isDark ? 'bg-white/[0.06] border-white/10' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                        {isArabic ? 'الحالة: ' : 'Status: '}<strong className={`uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {finalStatus === 'on_time'
                            ? t(langCode, 'statusOnTime')
                            : finalStatus === 'late'
                            ? t(langCode, 'statusLate')
                            : finalStatus === 'did_not_pray'
                            ? t(langCode, 'statusDidNotPray')
                            : t(langCode, 'statusMissed')}
                        </strong>
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${isDark ? 'bg-white/[0.06] border-white/10' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                        {isArabic ? 'الحفظ: ' : 'Storage: '}<strong className={isDark ? 'text-white' : 'text-[#111214]'}>{isArabic ? 'محلي في الجهاز' : 'Local IndexedDB'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`w-full py-3.5 px-6 rounded-2xl font-cinzel text-xs font-bold tracking-wider uppercase shadow-sm active:scale-95 transition-all cursor-pointer ${
                        isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                      }`}
                    >
                      {t(langCode, 'returnHome')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OathFaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        isDark={isDark}
        language={language}
      />
    </>
  );
};
