import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  FileText,
  Volume2,
  Mic,
  ArrowRight,
  GraduationCap,
  Info,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface ArabicLearningOnboardingProps {
  isDark: boolean;
  language?: string;
  onComplete: () => void;
  initialStage?: 'intro' | 'reveal' | 'terms' | 'notice';
}

type OnboardingStage = 'intro' | 'reveal' | 'terms' | 'notice';

export const ArabicLearningOnboarding: React.FC<ArabicLearningOnboardingProps> = ({
  isDark,
  language,
  onComplete,
  initialStage = 'intro',
}) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [stage, setStage] = useState<OnboardingStage>(initialStage);
  const [introProgress, setIntroProgress] = useState(0);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // 10-second introductory visual transition (No fake countdown numbers)
  useEffect(() => {
    if (stage !== 'intro') return;

    const durationMs = 10000;
    const intervalMs = 100;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setIntroProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setStage('reveal');
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [stage]);

  // Elegant celebratory effect upon entering the Lifetime Free Reveal
  useEffect(() => {
    if (stage === 'reveal') {
      try {
        // Serene monochrome and emerald celebration capped to 24 particles for iOS Safari
        confetti({
          particleCount: 24,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#111214', '#FFFFFF', '#10B981', '#0EA5E9', '#E5E7EB'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if canvas is restricted
      }
    }
  }, [stage]);

  const handleFinishOnboarding = () => {
    try {
      localStorage.setItem('nafis_noor_learning_onboarded', 'true');
      localStorage.setItem('nafis_noor_learning_onboarded_at', new Date().toISOString());
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
    onComplete();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. INTRODUCTORY SCREEN (10s Visual Transition, NO fake countdown)         */}
      {/* ========================================================================= */}
      {stage === 'intro' && (
        <div
          id="learning-intro-screen"
          className={`p-8 sm:p-14 rounded-3xl border text-center relative overflow-hidden transition-all duration-500 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="relative z-10 max-w-xl mx-auto space-y-8">
            {/* Islamic geometric badge emblem */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border shadow-inner ${
              isDark ? 'bg-white/[0.06] border-white/15' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              <span className={`text-3xl font-serif select-none ${isDark ? 'text-white' : 'text-[#111214]'}`}>ن</span>
            </div>

            <div className="space-y-3">
              <div
                className={`inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
                  isDark
                    ? 'bg-white/[0.08] text-white border-white/15'
                    : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                }`}
              >
                {activeLang === 'ar' ? 'أكاديمية نور' : 'NOOR AI'}
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold font-serif tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {st.onboardingIntroTitle}
              </h1>
              <p className={`text-sm sm:text-base font-medium ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {st.onboardingPreparing}
              </p>
            </div>

            {/* Smooth 10s progress bar animation without fake numerical countdown */}
            <div className="space-y-3 pt-4">
              <div className={`w-full h-2 rounded-full overflow-hidden relative ${isDark ? 'bg-white/10' : 'bg-black/[0.08]'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-100 ease-linear shadow-sm ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
                  style={{ width: `${introProgress}%` }}
                />
              </div>
              <div className={`flex items-center justify-between text-xs pt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <span>
                  {activeLang === 'ar'
                    ? 'تهيئة محرك الصوتيات الفصحى واللغة العربية'
                    : 'Initializing classical phonetics & language engine'}
                </span>
                <button
                  type="button"
                  id="skip-intro-btn"
                  onClick={() => setStage('reveal')}
                  className={`transition-colors underline cursor-pointer text-xs ${isDark ? 'hover:text-white' : 'hover:text-[#111214]'}`}
                >
                  {activeLang === 'ar' ? 'تخطي المقدمة' : 'Skip intro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THE BIG REVEAL (Lifetime Free Announcement)                            */}
      {/* ========================================================================= */}
      {stage === 'reveal' && (
        <div
          id="learning-reveal-screen"
          className={`p-8 sm:p-14 rounded-3xl border text-center relative overflow-hidden transition-all duration-500 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeLang === 'ar' ? 'بشرى سارة' : 'GOOD NEWS'}</span>
            </div>

            <div className="space-y-4">
              <h1 className={`text-3xl sm:text-5xl font-extrabold font-serif tracking-tight leading-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {st.academyTitle} <br className="hidden sm:inline" />
                <span className={isDark ? 'text-white' : 'text-[#111214]'}>
                  {st.onboardingFreeRevealTitle}
                </span>
              </h1>

              <p className={`text-base sm:text-lg max-w-xl mx-auto leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                {st.onboardingFreeRevealDesc}
              </p>
            </div>

            {/* Reassurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-left" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'بدون اشتراكات' : 'No Subscriptions'}</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {activeLang === 'ar'
                    ? 'وصول كامل ومفتوح لكافة المسارات التعليمية العشرة دون أي رسوم متكررة.'
                    : 'Full access to all 10 Arabic learning modules with no recurring billing.'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'بدون رسوم خفية' : 'No Hidden Fees'}</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {activeLang === 'ar'
                    ? 'لا بطاقات دفع، لا بوابات مشتريات، ولا حجب لأي محتوى علمي.'
                    : 'Zero payment processing, zero credit card prompts, zero paywalls.'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'تعليم إسلامي رصين' : 'Dignified Learning'}</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {activeLang === 'ar'
                    ? 'صوتيات فصحى وقراءة وقواعد نحوية وتدبر في بيئة نقية خالية من الإعلانات.'
                    : 'Classical phonetics, reading, and grammar without commercial distraction.'}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                id="reveal-continue-btn"
                onClick={() => setStage('terms')}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer ${
                  isDark ? 'bg-white text-[#111214] hover:bg-stone-200' : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                <span>{st.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TERMS & IMPORTANT INFORMATION                                         */}
      {/* ========================================================================= */}
      {stage === 'terms' && (
        <div
          id="learning-terms-screen"
          className={`p-6 sm:p-10 rounded-3xl border relative transition-all duration-300 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <div className={`border-b pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-1 border ${
                    isDark ? 'bg-white/[0.08] text-white border-white/15' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{activeLang === 'ar' ? 'السياسة التعليمية' : 'Educational Policy'}</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-bold font-serif tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {st.onboardingTermsTitle}
                </h2>
              </div>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {st.termsAndNotice}
              </span>
            </div>

            {/* Sections */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              {/* 1. Terms of Use */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <FileText className={`w-4 h-4 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} />
                  <h3>{activeLang === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}</h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {activeLang === 'ar'
                    ? 'منهاج نور التعليمي أداة تعليمية تهدف إلى مساعدة الراغبين في إتقان لغة القرآن الكريم، مع التركيز على مخارج الحروف الـ٢٨، وضبط أشكالها، والجذور اللغوية، والقراءة المتدرجة، والحوارات الفصيحة، وقواعد النحو الأساسية.'
                    : 'Noor AI Learning is an educational tool designed to help users learn the Arabic language. It provides focused practice across the 28 Arabic letters, pronunciation articulation points (Makhārij), positional forms, vocabulary root structures, graded reading passages, conversational dialogues, and grammar fundamentals.'}
                </p>
              </div>

              {/* 2. Privacy */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <Lock className={`w-4 h-4 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} />
                  <h3>{activeLang === 'ar' ? 'الخصوصية وأمان البيانات' : 'Privacy'}</h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {activeLang === 'ar'
                    ? 'تُعامل جميع البيانات وأذونات الاستخدام كالإدخال الصوتي وفق سياسة الخصوصية الصارمة للتطبيق. يتم حفظ تقدمك الدراسي محلياً على جهازك لضمان استمرارية تعلمك وحفظ سجلك.'
                    : "Any information or permissions used by the learning feature—such as speech input or study progress—are handled strictly in accordance with the application's privacy policy. Your learning activity and progress state are stored locally on your device to maintain your practice history."}
                </p>
              </div>

              {/* 3. AI Information */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <AlertCircle className="w-4 h-4 text-sky-500" />
                  <h3>{activeLang === 'ar' ? 'معلومات الذكاء الاصطناعي' : 'AI Information'}</h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {activeLang === 'ar'
                    ? 'نور رفيق تعليمي مدعوم بالذكاء الاصطناعي مصمم وفق أصول العربية الفصحى. الشروحات والتحليلات الصرفية واللغوية موجهة للتعلم والمدارسة مع أهمية الاستئناس بالمصادر المعتمدة.'
                    : 'Noor AI is an AI-based educational assistant. While designed with rigorous academic guidelines for Classical and Modern Standard Arabic, AI-generated explanations, morphological analyses, and translations can occasionally contain mistakes. We encourage critical review alongside standard educational resources.'}
                </p>
              </div>

              {/* 4. Educational Notice */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <GraduationCap className={`w-4 h-4 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} />
                  <h3>{activeLang === 'ar' ? 'إشعار تعليمي وتنبيه' : 'Educational Notice'}</h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {activeLang === 'ar'
                    ? 'تطبيق نور مخصص للتعلم وتدارس علوم اللغة والقرآن الكريم، ولا يُعتبر مرجعاً بديلاً للإفتاء الشرعي أو الأحكام الفقهية المعتمدة.'
                    : 'Noor AI is intended strictly for learning, language practice, and study support. It should not be treated as an unquestionable authority on theological, jurisprudential, or definitive linguistic matters.'}
                </p>
              </div>

              {/* 5. Voice & Learning Features */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <Mic className="w-4 h-4 text-emerald-500" />
                  <h3>{activeLang === 'ar' ? 'الميزات الصوتية والنطق' : 'Voice & Learning Features'}</h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {activeLang === 'ar'
                    ? 'تعتمد الميزات الصوتية على التعرف على الكلام عبر المتصفح والنطق الصوتي لضبط مخارج الحروف دون ادعاء تقييمات آلية مصطنعة.'
                    : 'Voice features utilize standard web microphone input for speech-to-text practice and client-side speech synthesis for Arabic pronunciation. Noor AI only provides capabilities supported by the technical platform and does not fabricate pronunciation scoring or speech metrics that do not exist.'}
                </p>
              </div>
            </div>

            {/* Mandatory Checkbox Agreement */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                hasAgreedToTerms
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-emerald-50/70 border-emerald-500/40'
                  : isDark
                  ? 'bg-[#1B1D23] border-white/10'
                  : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <input
                type="checkbox"
                id="agree-terms-checkbox"
                checked={hasAgreedToTerms}
                onChange={e => setHasAgreedToTerms(e.target.checked)}
                className={`mt-1 w-4 h-4 rounded border-stone-400 cursor-pointer ${isDark ? 'accent-white' : 'accent-[#111214]'}`}
              />
              <label
                htmlFor="agree-terms-checkbox"
                className={`text-xs sm:text-sm font-medium cursor-pointer select-none leading-relaxed ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}
              >
                {activeLang === 'ar'
                  ? 'قرأت وفهمت الشروط والسياسة التعليمية الهامة وأوافق عليها.'
                  : 'I have read and understood the Terms & Important Information.'}
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className={`text-xs order-2 sm:order-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {activeLang === 'ar'
                  ? 'الموافقة مطلوبة للمتابعة إلى المسارات التعليمية.'
                  : 'Acknowledgment is required to proceed.'}
              </span>
              <button
                type="button"
                id="terms-agree-btn"
                disabled={!hasAgreedToTerms}
                onClick={() => setStage('notice')}
                className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                  hasAgreedToTerms
                    ? isDark
                      ? 'bg-white text-[#111214] hover:bg-stone-200 shadow-md cursor-pointer'
                      : 'bg-[#111214] text-white hover:bg-[#27292D] shadow-md cursor-pointer'
                    : isDark
                    ? 'bg-white/10 text-stone-400 cursor-not-allowed opacity-60'
                    : 'bg-black/10 text-[#6B6F76] cursor-not-allowed opacity-60'
                }`}
              >
                <span>{st.onboardingAgreeButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FINAL PRE-RELEASE NOTICE                                               */}
      {/* ========================================================================= */}
      {stage === 'notice' && (
        <div
          id="learning-prerelease-screen"
          className={`p-6 sm:p-12 rounded-3xl border relative transition-all duration-300 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-sky-500/15 text-sky-500 border border-sky-500/30">
              <Info className="w-3.5 h-3.5" />
              <span>{activeLang === 'ar' ? 'إشعار التطوير المستمر' : 'Pre-Release Notice'}</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-bold font-serif tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {activeLang === 'ar'
                ? 'تطبيق نفيس نور قيد التطوير والتحسين المستمر'
                : 'Nafis Noor is still in development'}
            </h1>

            {/* Exact Specified Professional Notice */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border text-left text-xs sm:text-sm leading-relaxed space-y-3.5 ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
              }`}
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {activeLang === 'ar'
                  ? 'نشكركم على انضمامكم إلى رحاب تطبيق نفيس نور.'
                  : 'Thank you for being part of Nafis Noor.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'تطبيق نفيس نور يمر حالياً بمرحلة تطوير وتحسين مبكرة، ونعمل جاهدين على اختبار ميزاته وتحديثها باستمرار لتقديم أقصى درجات الإتقان والرصانة.'
                  : 'Nafis Noor is currently in an early development and pre-release stage. The application is not yet fully published, and several parts of the experience are still being developed, tested, refined, and improved.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'قد تتطور بعض الميزات والخدمات تباعاً مع التحديثات القادمة بهدف الارتقاء بالتجربة التعليمية والقرآنية.'
                  : 'Some features may change before the official release, and certain functionality may not yet be available or may behave differently during development.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'هدفنا بناء تجربة موثوقة ومتقنة ونافعة تثري أوقاتكم بكل ما يقربكم لكتاب الله تعالى ولغته الخالدة.'
                  : 'Our goal is to build a reliable, useful, and high-quality experience, so we are continuing to work on the application before its full public release.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'لذا فإن استخدامكم الحالي يمثل معاينة مباركة لتطبيق ينمو باستمرار بتوفيق الله ثم ملاحظاتكم الكريمة.'
                  : 'Your current experience should therefore be considered a preview of an application that is still being actively developed.'}
              </p>

              <p className={`pt-1 font-medium ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {activeLang === 'ar'
                  ? 'جزاكم الله خيراً وبارك في مسعاكم وتفهمكم في هذه الرحلة المباركة.'
                  : 'Thank you for your patience and understanding while Nafis Noor continues to grow.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="enter-learning-btn"
                onClick={handleFinishOnboarding}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer ${
                  isDark ? 'bg-white text-[#111214] hover:bg-stone-200' : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                <span>{st.onboardingStartButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
