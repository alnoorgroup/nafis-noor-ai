import React, { useState } from 'react';
import {
  X,
  Moon,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Compass,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Clock,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getApiUrl } from '../utils/apiConfig';

interface DreamInterpretationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  initialDreamPrompt?: string;
}

export interface DreamInterpretationResult {
  topic: string;
  symbolsDetected: string[];
  keyElements: string;
  emotionalContext: {
    emotion: string;
    impact: string;
    psychologicalLayer: string;
  };
  primaryInterpretation: {
    text: string;
    why: string;
    supportingEvidence: string;
  };
  alternativeInterpretations: Array<{
    title: string;
    why: string;
    mostLikelyIf: string;
  }>;
  scholarlyReferences: string[];
  importantNotes: string[];
  fullFormattedText: string;
}

const SAMPLE_DREAMS = [
  {
    title: '💧 Clear Blue Water',
    titleAr: '💧 ماء عذب صافٍ',
    text: 'I dreamed I was swimming in clear blue water and I felt very peaceful and refreshed.',
    textAr: 'رأيت في منامي أنني أسبح في ماء زلال صافٍ وشعرت بسكينة وانتعاش عظيمين.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ Flying in the Sky',
    titleAr: '🕊️ الطيران في السماء',
    text: 'I saw myself flying freely high above the ground and green hills, looking down without fear.',
    textAr: 'رأيت نفسي أطير في الفضاء بحرية فوق روابٍ خضراء دون خوف أو وجل.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 Seeing the Holy Kaaba',
    titleAr: '🕋 رؤية الكعبة المشرفة',
    text: 'I dreamed I was standing before the Holy Kaaba in Makkah, touching the Kiswah in tears of gratitude.',
    textAr: 'رأيت أنني أقف أمام الكعبة المشرفة بمكة المكرمة وألمس كسوتها بدموع الشكر لله.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 Finding a Golden Key',
    titleAr: '🔑 العثور على مفتاح ذهبي',
    text: 'I found an ancient ornate golden key lying on a table in a bright, clean house.',
    textAr: 'وجدت مفتاحاً ذهبياً مزخرفاً موضوعاً على طاولة في بيت مشرق ونظيف.',
    emotion: 'joyful',
    timing: 'night',
  },
];

export const DreamInterpretationModal: React.FC<DreamInterpretationModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  initialDreamPrompt = '',
}) => {
  // Lock background scroll and return user to exact spot below Qibla Compass
  useModalScrollLock(isOpen, 'dream-interpretation-modal');

  const isArabic = typeof window !== 'undefined'
    ? (localStorage.getItem('noor_app_language') || 'ar') === 'ar'
    : true;

  const [dreamText, setDreamText] = useState(initialDreamPrompt);
  const [selectedEmotion, setSelectedEmotion] = useState('peaceful');
  const [selectedTiming, setSelectedTiming] = useState('sahar');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DreamInterpretationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'raw'>('structured');

  if (!isOpen) return null;

  const handleInterpret = async () => {
    if (!dreamText.trim() || dreamText.trim().length < 4) {
      setErrorMessage(
        isArabic
          ? 'يُرجى كتابة وصف المنام في بضع جمل واضحة.'
          : 'Please describe your dream in a few sentences.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl('/api/dream-interpretation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamDescription: dreamText.trim(),
          emotionalContext: selectedEmotion,
          timing: selectedTiming,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setErrorMessage(
          json.error ||
            (isArabic
              ? 'تعذر تأويل المنام حالياً. يُرجى المحاولة مرة أخرى.'
              : 'Failed to interpret dream. Please try again.')
        );
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر الاتصال بالخادم. يُرجى التحقق من اتصال الإنترنت والمحاولة ثانية.'
          : 'Network connection error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullFormattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_DREAMS)[0]) => {
    setDreamText(isArabic ? sample.textAr : sample.text);
    setSelectedEmotion(sample.emotion);
    setSelectedTiming(sample.timing);
    setResult(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setDreamText('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dream-modal-title"
    >
      <div
        id="dream-interpretation-dialog"
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`w-full max-w-2xl rounded-[32px] border shadow-2xl overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col overscroll-contain ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_24px_70px_rgba(0,0,0,0.7)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <Moon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="dream-modal-title" className={`text-sm sm:text-base font-cinzel font-bold tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'تفسير الرؤى والأحلام' : 'TAFSIR AL-AHLAM'}
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {isArabic ? 'منهج الإمام ابن سيرين' : 'Ibn Sirin Methodology'}
                </span>
              </div>
              <p className={`text-[11px] font-arabic mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} dir="rtl">
                تفسير الأحلام وفق منهج الإمام ابن سيرين والعلماء الأجلاء
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white bg-[#1B1D23] hover:bg-white/[0.1]'
                : 'text-[#6B6F76] hover:text-[#111214] bg-[#F3F3F1] hover:bg-black/[0.08]'
            }`}
            aria-label="Close Dream Interpreter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Methodology Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <div>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'المنهج العلمي الاستقرائي: ' : 'Classical Analytical Process: '}
              </span>
              {isArabic
                ? 'يتم تعبير الرؤيا عبر سبع خطوات شرعية وتراثية أصيلة: استخراج الرموز، تحديد الموضوع، فحص السياق الوجداني، التأويل الراجح عند ابن سيرين، الأوجه والقرائن المحتملة، المراجع التراثية، وآداب وتوجيهات الهدي النبوي الشريف.'
                : 'Dreams are analyzed through 7 scholarly steps: Symbol Extraction, Topic Classification, Emotional Context, Primary Ibn Sirin Interpretation, Alternative Views, Scholarly Citations, and Prophetic Adab.'}
            </div>
          </div>

          {/* INPUT SECTION (Shown when no result or when editing) */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {isArabic ? 'صِف ما رأيت في منامك بالتفصيل:' : 'Describe Your Dream (ماذا رأيت في المنام؟)'}
                </label>
                {dreamText && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className={`text-[11px] transition-colors cursor-pointer ${
                      isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#6B6F76] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                rows={4}
                placeholder={isArabic
                  ? 'اكتب ما رأيته في المنام: الأشخاص، الكائنات، الأماكن، الألوان، الأفعال، وأبرز ما لفت انتباهك...'
                  : 'Describe what you saw in your dream: people, objects, animals, places, colors, actions, and what stood out most...'}
                className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border transition-all resize-none focus:outline-hidden ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                    : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
                }`}
              />
            </div>

            {/* Quick Sample Prompts */}
            {!result && (
              <div className="space-y-1.5">
                <div className={`text-[11px] font-medium flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  <span>{isArabic ? 'استكشف نماذج لرؤى شائعة:' : 'Explore sample visions:'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_DREAMS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#1B1D23] hover:bg-white/[0.1] border-white/[0.1] text-white'
                          : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#111214]'
                      }`}
                    >
                      {isArabic ? sample.titleAr : sample.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Context & Timing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Emotion Selector */}
              <div>
                <label className={`text-[11px] font-semibold block mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {isArabic ? 'ما هو شعورك أثناء الرؤيا؟' : 'How did you feel? (الشعور أثناء الرؤيا)'}
                </label>
                <select
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-hidden ${
                    isDark
                      ? 'bg-[#0B0C0E] border-white/[0.1] text-stone-200'
                      : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214]'
                  }`}
                >
                  <option value="peaceful">{isArabic ? 'سكينة وطمأنينة وراحة' : 'Peaceful & Calm (سكينة وطمأنينة)'}</option>
                  <option value="joyful">{isArabic ? 'فرح واستبشار وسعادة' : 'Joyful & Glad Tidings (فرح واستبشار)'}</option>
                  <option value="fearful">{isArabic ? 'خوف أو قلق وتحذير' : 'Fearful or Anxious (خوف وتحذير)'}</option>
                  <option value="confused">{isArabic ? 'حيرة وتساؤل وعجب' : 'Confused or Puzzled (حيرة وتساؤل)'}</option>
                  <option value="sad">{isArabic ? 'حزن وشوق أو ضيق' : 'Sorrowful or Grieved (حزن وشوق)'}</option>
                </select>
              </div>

              {/* Timing Selector */}
              <div>
                <label className={`text-[11px] font-semibold block mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {isArabic ? 'متى رأيت المنام؟' : 'When did the dream occur? (وقت الرؤيا)'}
                </label>
                <select
                  value={selectedTiming}
                  onChange={(e) => setSelectedTiming(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-hidden ${
                    isDark
                      ? 'bg-[#0B0C0E] border-white/[0.1] text-stone-200'
                      : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214]'
                  }`}
                >
                  <option value="sahar">{isArabic ? 'وقت السحر وقبيل الفجر (أصدق الرؤى)' : 'Pre-Dawn / Before Fajr (وقت السحر - Best)'}</option>
                  <option value="night">{isArabic ? 'في جوف الليل' : 'During the Night (في جوف الليل)'}</option>
                  <option value="qaylulah">{isArabic ? 'القيلولة بعد الظهر' : 'Afternoon Nap (القيلولة بعد الظهر)'}</option>
                  <option value="unknown">{isArabic ? 'غير محدد أو لا أذكر' : 'Unspecified / Unknown'}</option>
                </select>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-red-500/15 border-red-500/30 text-red-300' : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleInterpret}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-2xl active:scale-98 text-xs font-bold font-cinzel tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isArabic ? 'جاري استنباط الدلالات وتأصيل الرؤيا...' : 'Analyzing Ibn Sirin Hermeneutics...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isArabic ? 'تأويل الرؤيا المباركة' : 'Interpret Dream (تأويل الرؤيا)'}</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/[0.12] bg-[#1B1D23] hover:bg-white/[0.1] text-white'
                      : 'border-black/[0.1] bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214]'
                  }`}
                  title={isArabic ? 'نسخ التحليل كاملاً' : 'Copy complete analysis'}
                >
                  {copied ? <Check className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}</span>
                </button>
              )}
            </div>
          </div>

          {/* RESULTS VIEW */}
          {result && (
            <div className={`space-y-4 pt-3 border-t animate-fadeIn ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              {/* Tab Selector between Visual & Full Text */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
                  isDark ? 'bg-[#0B0C0E] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('structured')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'structured'
                        ? isDark
                          ? 'bg-white text-[#111214] font-bold'
                          : 'bg-[#111214] text-white font-bold shadow-2xs'
                        : isDark
                        ? 'text-stone-400 hover:text-stone-200'
                        : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic ? 'عرض تحليلي مفصل' : 'Structured View'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'raw'
                        ? isDark
                          ? 'bg-white text-[#111214] font-bold'
                          : 'bg-[#111214] text-white font-bold shadow-2xs'
                        : isDark
                        ? 'text-stone-400 hover:text-stone-200'
                        : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic ? 'النص التراثي الكامل' : 'Classical Text Layout'}
                  </button>
                </div>

                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {isArabic ? 'الموضوع: ' : 'Topic: '}<strong className={isDark ? 'text-white' : 'text-[#111214]'}>{result.topic}</strong>
                </div>
              </div>

              {activeTab === 'structured' ? (
                <div className="space-y-4">
                  {/* Step 1 & 2: Symbols & Key Elements */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                      <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {isArabic ? 'الرموز المستخرجة' : 'Symbols Detected (استخراج الرموز)'}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {result.symbolsDetected.map((sym, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                            isDark ? 'bg-white/[0.08] text-white border-white/[0.14]' : 'bg-white text-[#111214] border-black/[0.1]'
                          }`}
                        >
                          ✦ {sym}
                        </span>
                      ))}
                    </div>
                    <p className={`text-xs leading-relaxed font-light ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {result.keyElements}
                    </p>
                  </div>

                  {/* Step 3: Emotional Context Analysis */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {isArabic ? 'السياق الوجداني وتأثير الرؤيا' : 'Emotional Context (السياق الوجداني)'}
                      </h4>
                    </div>
                    <div className={`text-xs space-y-1 leading-relaxed ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                      <div>
                        <strong>{isArabic ? 'الحالة الشعورية: ' : 'Tenor: '}</strong>
                        <span className={isDark ? 'text-white font-semibold' : 'text-[#111214] font-semibold'}>{result.emotionalContext.emotion}</span>
                      </div>
                      <p>{result.emotionalContext.impact}</p>
                      <p className={`font-light italic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {result.emotionalContext.psychologicalLayer}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Primary Interpretation (Ibn Sirin) */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.16] shadow-md'
                        : 'bg-[#F3F3F1] border-black/[0.12] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                      <h3 className={`text-sm font-bold font-serif-heading ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {isArabic ? 'التأويل الراجح عند ابن سيرين' : 'Primary Interpretation (التأويل الراجح عند ابن سيرين)'}
                      </h3>
                    </div>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed mb-3 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                      {result.primaryInterpretation.text}
                    </p>

                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isDark ? 'bg-[#0B0C0E] border-white/[0.08] text-stone-300' : 'bg-white border-black/[0.08] text-[#3F4248]'
                    }`}>
                      <div>
                        <strong className={isDark ? 'text-white' : 'text-[#111214]'}>
                          {isArabic ? 'العلة والتأصيل التراثي: ' : 'Scholarly Reasoning (العلة والتأصيل): '}
                        </strong>
                        {result.primaryInterpretation.why}
                      </div>
                      {result.primaryInterpretation.supportingEvidence && (
                        <div className={`pt-1 border-t text-[11px] ${
                          isDark ? 'border-white/[0.08] text-stone-200' : 'border-black/[0.08] text-[#111214]'
                        }`}>
                          <strong>{isArabic ? 'الشاهد والدليل: ' : 'Evidence: '}</strong>
                          {result.primaryInterpretation.supportingEvidence}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 5: Alternative Interpretations */}
                  <div className="space-y-2">
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      <Compass className="w-3.5 h-3.5" />
                      {isArabic ? 'التأويلات والوجوه المحتملة الأخرى' : 'Alternative Interpretations (التأويلات والوجوه الأخرى)'}
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {result.alternativeInterpretations.map((alt, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                          }`}
                        >
                          <div className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            {idx + 1}️⃣ {alt.title}
                          </div>
                          <div className={`mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{alt.why}</div>
                          <div className={`text-[11px] p-2 rounded-xl border ${
                            isDark ? 'text-stone-400 bg-white/[0.05] border-white/[0.08]' : 'text-[#5A5D63] bg-white border-black/[0.08]'
                          }`}>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                              {isArabic ? 'أرجح في حال: ' : 'Most likely if: '}
                            </span>
                            {alt.mostLikelyIf}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 6: Scholarly References */}
                  <div
                    className={`p-4 rounded-2xl border text-xs ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div className={`font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      <BookOpen className="w-3.5 h-3.5" />
                      {isArabic ? 'المراجع والمصادر المعتمدة' : 'Scholarly References (المراجع المعتمدة)'}
                    </div>
                    <ul className={`space-y-1.5 text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {result.scholarlyReferences.map((ref, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>✦</span>
                          <span>{ref}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step 7: Important Notes & Prophetic Adab */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.12] text-stone-200' : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
                  }`}>
                    <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      <ShieldCheck className="w-4 h-4" />
                      {isArabic ? 'آداب الرؤى والتوجيه النبوي الشريف' : 'Prophetic Adab & Guidance (آداب الرؤى والأحلام)'}
                    </div>
                    <ul className={`space-y-1 text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {result.importantNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Raw Exact Template Output View */
                <div className="relative">
                  <pre
                    className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border overflow-x-auto ${
                      isDark ? 'bg-[#0B0C0E] border-white/[0.1] text-stone-200' : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214]'
                    }`}
                  >
                    {result.fullFormattedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0B0C0E]/80 border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
        }`}>
          <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>{isArabic ? 'بواسطة ذكاء نور الاصطناعي · مجموعة النور' : 'Powered by Noor AI · ALNOOR GROUP'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white text-[#111214] hover:bg-stone-200'
                : 'bg-[#111214] text-white hover:bg-[#27292D]'
            }`}
          >
            {isArabic ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
