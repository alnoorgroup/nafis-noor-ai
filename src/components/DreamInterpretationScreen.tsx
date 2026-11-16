import React, { useState, useRef, useEffect } from 'react';
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
  Clock,
  Layers,
  ArrowRight,
  Info,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DreamInterpretationResult } from './DreamInterpretationModal';
import { useBackHandler } from '../utils/historyManager';
import { getApiUrl } from '../utils/apiConfig';

import { getLanguageCode } from '../utils/i18n';

interface DreamMessage {
  id: string;
  sender: 'user' | 'scholar';
  dreamText?: string;
  emotion?: string;
  timing?: string;
  data?: DreamInterpretationResult;
  timestamp: string;
}

interface DreamInterpretationScreenProps {
  isDark: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const STARTER_DREAMS_EN = [
  {
    title: '💧 Swimming in Clear Blue Water',
    desc: 'Pure water, swimming without struggle, feeling peaceful and light.',
    text: 'I dreamed I was swimming in clear blue water and I felt very peaceful and refreshed.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ Flying High Above the Ground',
    desc: 'Gliding freely over green hills and rivers with ease and joy.',
    text: 'I saw myself flying freely high above the ground and green hills, looking down without fear.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 Standing Before the Holy Kaaba',
    desc: 'Making Tawaf, touching the Kiswah in tears of humility.',
    text: 'I dreamed I was standing before the Holy Kaaba in Makkah, touching the Kiswah in tears of gratitude.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 Finding a Luminous Golden Key',
    desc: 'Discovering an ornate key in a brightly lit house.',
    text: 'I found an ancient ornate golden key lying on a table in a bright, clean house.',
    emotion: 'joyful',
    timing: 'night',
  },
];

const STARTER_DREAMS_AR = [
  {
    title: '💧 السباحة في ماء أزرق نقي',
    desc: 'ماء طاهر زلال، سباحة بيسر وسكينة، شعور بالانشراح والبركة.',
    text: 'رأيت في منامي أنني أسبح في ماء رقراق صافٍ عذب وأشعر بسكينة وانشراح صدر عظيم.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ الطيران والتحليق في السماء',
    desc: 'تحليق خفيف فوق الربى والأودية الخضراء بيسر وسرور دون خوف.',
    text: 'رأيت أنني أطير في السماء بكل يسر وسرور وأنظر إلى الرياض الخضراء من علو دون وجل.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 الوقوف أمام الكعبة المشرفة',
    desc: 'الطواف بالبيت العتيق، ولمس أستار الكعبة مع دموع الخشوع والشكر.',
    text: 'رأيت في منامي أنني قائم بين يدي الكعبة المشرفة بمكة المكرمة ألمس أستارها مع دموع الخشوع.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 العثور على مفتاح ذهبي وضاء',
    desc: 'وجدان مفتاح قديم مذهب وضاء على بساط في دار رحبة منيرة.',
    text: 'رأيت أنني عثرت على مفتاح ذهبي جميل وضاء في منزل رحب مشرق بنور طيب.',
    emotion: 'joyful',
    timing: 'night',
  },
];

export const DreamInterpretationScreen: React.FC<DreamInterpretationScreenProps> = ({
  isDark,
  onClose,
  initialPrompt = '',
}) => {
  // Use Back button to exit dream screen cleanly
  useBackHandler(true, onClose, 'dream-screen-view');

  const lang = getLanguageCode();
  const isArabic = lang === 'ar';
  const starterDreams = isArabic ? STARTER_DREAMS_AR : STARTER_DREAMS_EN;

  const [messages, setMessages] = useState<DreamMessage[]>([]);
  const [inputText, setInputText] = useState(initialPrompt);
  const [selectedEmotion, setSelectedEmotion] = useState('peaceful');
  const [selectedTiming, setSelectedTiming] = useState('sahar');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, 'structured' | 'raw'>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If initialPrompt provided, pre-fill
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSendDream = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || textToSend.trim().length < 3) {
      setErrorMessage(isArabic ? 'يرجى كتابة وصف موجز للرؤيا في بضع جمل.' : 'Please describe your dream in a few sentences.');
      return;
    }

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const newMessages: DreamMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        dreamText: textToSend.trim(),
        emotion: selectedEmotion,
        timing: selectedTiming,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-SA' : [], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/dream-interpretation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamDescription: textToSend.trim(),
          emotionalContext: selectedEmotion,
          timing: selectedTiming,
        }),
      });

      const json = await res.json();
      if (json && json.data) {
        const scholarMsgId = `scholar-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: scholarMsgId,
            sender: 'scholar',
            data: json.data,
            timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-SA' : [], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setViewModes((prev) => ({ ...prev, [scholarMsgId]: 'structured' }));
      } else {
        setErrorMessage(json?.error || (isArabic ? 'تعذر تعبير الرؤيا حالياً، يرجى المحاولة مرة أخرى.' : 'Unable to interpret dream. Please try again.'));
      }
    } catch {
      setErrorMessage(isArabic ? 'خطأ في الاتصال بالشبكة، يرجى إعادة المحاولة.' : 'Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div
      id="dream-interpretation-fullscreen-container"
      className={`fixed inset-0 z-50 flex flex-col w-full h-[100dvh] overflow-hidden select-none animate-fadeIn transition-all duration-200 ${
        isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
      }`}
    >
      {/* 1. TOP HEADER BAR */}
      <header className={`w-full border-b shrink-0 z-10 transition-colors duration-200 ${
        isDark ? 'bg-[#14161A]/95 border-white/[0.08] shadow-md' : 'bg-white/95 border-black/[0.08] shadow-xs'
      }`}>
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm sm:text-base font-cinzel font-bold tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'تفسير الرؤى والأحلام' : 'TAFSIR AL-AHLAM'}
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {isArabic ? 'منهج الإمام ابن سيرين' : 'Ibn Sirin Methodology'}
                </span>
              </div>
              <p className={`text-[11px] font-arabic mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} dir="rtl">
                تعبير الرؤى والأحلام وفق منهج الإمام ابن سيرين والعلماء الأجلاء
              </p>
            </div>
          </div>

          {/* Action Controls & Prominent X Close Button */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  isDark
                    ? 'border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/10 text-stone-400 hover:text-red-400'
                    : 'border-black/[0.08] hover:border-red-300 hover:bg-red-50 text-[#5A5D63] hover:text-red-700'
                }`}
                title={isArabic ? 'مسح المحادثة' : 'Clear dream conversation'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* THE X BUTTON: Exits the Dream Interpretation page and returns user to previous spot */}
            <button
              id="exit-dream-screen-btn"
              type="button"
              onClick={onClose}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer active:scale-95 shadow-sm ${
                isDark
                  ? 'border-white/[0.12] bg-[#1B1D23] hover:bg-white/[0.1] text-white'
                  : 'border-black/[0.1] bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214]'
              }`}
              title={isArabic ? 'إغلاق والعودة' : 'Exit and return to Spiritual Journey'}
            >
              <X className="w-4 h-4" />
              <span>{isArabic ? 'إغلاق' : 'Exit (إغلاق)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE STREAM AREA */}
      <main className="flex-1 overflow-y-auto w-full min-h-0">
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
          {/* Zero-conversation Hero state */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center animate-fadeIn max-w-xl mx-auto">
              <div className="relative mb-4">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${
                  isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                }`}>
                  <Moon className="w-8 h-8" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isDark ? 'bg-[#14161A] border-white/30 text-white' : 'bg-white border-black/15 text-[#111214]'
                }`}>
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <h3 className={`font-serif-heading font-bold text-lg sm:text-xl mb-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'تعبير الرؤى والأحلام في ضوء الكتاب والسنة' : 'Classical Islamic Dream Interpretation'}
              </h3>
              <p className={`text-xs max-w-md mb-6 leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'صِف رؤياك بتفاصيلها ورموزها ومشاعرها ليتم تحليلها وتأويلها وفق الأصول المعتمدة عند أئمة التعبير كالإمام محمد بن سيرين مع الشواهد النبوية والقرآنية.'
                  : "Describe any dream or vision. Analyzed through Muhammad Ibn Sirin's 7-step classical framework: symbol extraction, emotional context, primary ruling, alternative possibilities, and authentic Hadith citations."}
              </p>

              {/* Quick Starter Suggestions */}
              <div className="w-full space-y-2 text-left rtl:text-right" dir={isArabic ? 'rtl' : 'ltr'}>
                <div className={`text-[10px] font-cinzel font-bold uppercase tracking-wider px-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {isArabic ? 'نماذج من الرؤى المأثورة والشائعة' : 'Common Prophetic & Classical Visions'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {starterDreams.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(item.text);
                        setSelectedEmotion(item.emotion);
                        setSelectedTiming(item.timing);
                        handleSendDream(item.text);
                      }}
                      className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all group flex items-start justify-between cursor-pointer ${
                        isDark
                          ? 'bg-[#14161A] hover:bg-[#1B1D23] border-white/[0.08] hover:border-white/[0.2] text-[#F3F4F6]'
                          : 'bg-white hover:bg-[#F3F3F1] border-black/[0.08] hover:border-black/[0.18] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-semibold transition-colors ${
                          isDark ? 'text-white' : 'text-[#111214]'
                        }`}>
                          {item.title}
                        </div>
                        <div className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                          {item.desc}
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0 ml-2 rtl:ml-0 rtl:mr-2 mt-0.5 ${
                        isDark ? 'text-stone-400 group-hover:text-white' : 'text-[#6B6F76] group-hover:text-[#111214]'
                      } ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation Messages */
            messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end animate-fadeIn">
                    <div className={`max-w-xl rounded-3xl p-4 sm:p-5 shadow-sm space-y-2 ${
                      isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                    }`}>
                      <div className={`flex items-center justify-between gap-3 text-[11px] font-bold opacity-80 border-b pb-1.5 ${
                        isDark ? 'border-black/10' : 'border-white/15'
                      }`}>
                        <span>{isArabic ? 'الرؤيا المروية' : 'Dream Narrated'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        "{msg.dreamText}"
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold">
                        <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-black/10' : 'bg-white/15'}`}>
                          {isArabic ? 'المشاعر:' : 'Emotion:'} {msg.emotion}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-black/10' : 'bg-white/15'}`}>
                          {isArabic ? 'الوقت:' : 'Timing:'} {msg.timing}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              const data = msg.data;
              if (!data) return null;
              const currentMode = viewModes[msg.id] || 'structured';

              return (
                <div key={msg.id} className="flex justify-start animate-fadeIn">
                  <div
                    className={`w-full max-w-3xl rounded-3xl p-5 sm:p-6 border space-y-5 transition-all duration-200 shadow-sm ${
                      isDark
                        ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
                        : 'bg-white border-black/[0.08] text-[#111214]'
                    }`}
                  >
                    {/* Analysis Header */}
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                      isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                          isDark ? 'bg-[#1B1D23] border-white/[0.1] text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                        }`}>
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs sm:text-sm font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            {isArabic ? '🌙 تأويل الرؤيا المباركة' : '🌙 Tafsir al-Ahlam Analysis'}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                            {isArabic ? 'الموضوع:' : 'Topic:'} <strong className={isDark ? 'text-white' : 'text-[#111214]'}>{data.topic}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewModes((prev) => ({
                              ...prev,
                              [msg.id]: currentMode === 'structured' ? 'raw' : 'structured',
                            }))
                          }
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                            isDark
                              ? 'border-white/[0.1] hover:border-white/[0.25] bg-[#1B1D23] text-white'
                              : 'border-black/[0.1] hover:border-black/[0.2] bg-[#F3F3F1] text-[#111214]'
                          }`}
                        >
                          {isArabic
                            ? currentMode === 'structured'
                              ? 'عرض النص كاملاً'
                              : 'عرض البطاقات'
                            : currentMode === 'structured'
                            ? 'View Template Box'
                            : 'View Visual Cards'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, data.fullFormattedText)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isDark
                              ? 'border-white/[0.1] hover:border-white/[0.25] bg-[#1B1D23] text-white'
                              : 'border-black/[0.1] hover:border-black/[0.2] bg-[#F3F3F1] text-[#111214]'
                          }`}
                          title={isArabic ? 'نسخ التحليل كاملاً' : 'Copy complete analysis'}
                        >
                          {copiedId === msg.id ? (
                            <Check className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {currentMode === 'structured' ? (
                      <div className="space-y-4">
                        {/* Step 1 & 2: Symbol Extraction & Topic Classification */}
                        <div
                          className={`p-4 rounded-2xl border ${
                            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                          }`}
                        >
                          <div className={`text-[11px] font-mono uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            <Layers className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'استخراج الرموز والمعاني الدلالية' : 'Symbols Detected (استخراج الرموز)'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {data.symbolsDetected.map((sym, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                                  isDark
                                    ? 'bg-white/[0.08] text-white border-white/[0.14]'
                                    : 'bg-white text-[#111214] border-black/[0.1]'
                                }`}
                              >
                                ✦ {sym}
                              </span>
                            ))}
                          </div>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300 font-light' : 'text-[#3F4248]'}`}>
                            {data.keyElements}
                          </p>
                        </div>

                        {/* Step 3: Emotional Context Analysis */}
                        <div
                          className={`p-4 rounded-2xl border ${
                            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                          }`}
                        >
                          <div className={`text-[11px] font-mono uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'السياق الوجداني وحال الرائي' : 'Emotional Context (السياق الوجداني)'}</span>
                          </div>
                          <div className={`text-xs space-y-1 leading-relaxed ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                            <div>
                              <strong>{isArabic ? 'طبيعة الشعور:' : 'Tenor:'} </strong>
                              <span className={isDark ? 'text-white font-semibold' : 'text-[#111214] font-semibold'}>{data.emotionalContext.emotion}</span>
                            </div>
                            <p>{data.emotionalContext.impact}</p>
                            <p className={`italic ${isDark ? 'text-stone-400 font-light' : 'text-[#5A5D63]'}`}>
                              {data.emotionalContext.psychologicalLayer}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Primary Interpretation (Ibn Sirin Methodology) */}
                        <div
                          className={`p-5 rounded-2xl border ${
                            isDark
                              ? 'bg-[#1B1D23] border-white/[0.16] shadow-md'
                              : 'bg-[#F3F3F1] border-black/[0.12] shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                            <h4 className={`text-sm font-bold font-serif-heading ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                              {isArabic ? 'التأويل الراجح وفق أصول ابن سيرين' : 'Primary Classical Interpretation (التأويل الراجح عند ابن سيرين)'}
                            </h4>
                          </div>
                          <p className={`text-xs sm:text-sm font-medium leading-relaxed mb-3 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                            {data.primaryInterpretation.text}
                          </p>

                          <div
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isDark
                                ? 'bg-[#0B0C0E] border-white/[0.08] text-stone-300'
                                : 'bg-white border-black/[0.08] text-[#3F4248]'
                            }`}
                          >
                            <div>
                              <strong className={isDark ? 'text-white' : 'text-[#111214]'}>{isArabic ? 'العلة والتأصيل الشرعي:' : 'Scholarly Reasoning (العلة والتأصيل):'} </strong>
                              {data.primaryInterpretation.why}
                            </div>
                            {data.primaryInterpretation.supportingEvidence && (
                              <div className={`pt-1 border-t text-[11px] ${isDark ? 'border-white/[0.08] text-stone-200' : 'border-black/[0.08] text-[#111214]'}`}>
                                <strong>{isArabic ? 'الشاهد والدليل:' : 'Evidence:'} </strong>
                                {data.primaryInterpretation.supportingEvidence}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 5: Alternative Interpretations */}
                        <div className="space-y-2">
                          <div className={`text-[11px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            <Compass className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'التأويلات والوجوه المحتملة الأخرى' : 'Alternative Contextual Interpretations (التأويلات الأخرى)'}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {data.alternativeInterpretations.map((alt, idx) => (
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
                                <div
                                  className={`text-[11px] p-2 rounded-xl border ${
                                    isDark
                                      ? 'text-stone-400 bg-white/[0.05] border-white/[0.08]'
                                      : 'text-[#5A5D63] bg-white border-black/[0.08]'
                                  }`}
                                >
                                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{isArabic ? 'يرجح هذا الوجه إذا:' : 'Most likely if:'} </span>
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
                          <div className={`font-bold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'المراجع والمصادر المعتمدة' : 'Scholarly References (المراجع المعتمدة)'}</span>
                          </div>
                          <ul className={`space-y-1 text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                            {data.scholarlyReferences.map((ref, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>✦</span>
                                <span>{ref}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Step 7: Prophetic Adab */}
                        <div
                          className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                            isDark
                              ? 'bg-[#1B1D23] border-white/[0.12] text-stone-200'
                              : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
                          }`}
                        >
                          <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isArabic ? 'الآداب النبوية والتوجيهات الإيمانية' : 'Prophetic Adab & Guidance (آداب الرؤى)'}</span>
                          </div>
                          <ul className={`space-y-0.5 text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                            {data.importantNotes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span>•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      /* Verbatim Template View */
                      <pre
                        className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border overflow-x-auto ${
                          isDark ? 'bg-[#0B0C0E] border-white/[0.1] text-stone-200' : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214]'
                        }`}
                      >
                        {data.fullFormattedText}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border text-xs ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.1] text-white'
                    : 'bg-white border-black/[0.1] text-[#111214]'
                }`}
              >
                <RefreshCw className={`w-4 h-4 animate-spin ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{isArabic ? 'جاري استخراج الرموز ومطابقتها مع أصول ابن سيرين...' : 'Consulting Ibn Sirin Hermeneutics & Extracting Symbols...'}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 3. BOTTOM INPUT BAR (Styled exactly like Noor AI) */}
      <footer className={`w-full border-t shrink-0 z-10 transition-colors duration-200 ${
        isDark ? 'bg-[#14161A]/95 border-white/[0.08] shadow-lg' : 'bg-white/95 border-black/[0.08] shadow-md'
      } pb-safe pb-4 sm:pb-5`}>
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 pt-3 space-y-2.5">
          {/* Context Controls (Emotion + Timing) */}
          <div className="flex flex-wrap items-center gap-2 text-xs" dir={isArabic ? 'rtl' : 'ltr'}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#0B0C0E] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <span className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'المشاعر:' : 'Emotion:'}</span>
              <select
                value={selectedEmotion}
                onChange={(e) => setSelectedEmotion(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                <option value="peaceful" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'سكينة واطمئنان' : 'Peaceful (سكينة)'}</option>
                <option value="joyful" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'بشرى وسرور' : 'Joyful (بشرى وفرح)'}</option>
                <option value="fearful" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'خوف وتحذير' : 'Fearful (خوف وتحذير)'}</option>
                <option value="confused" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'حيرة وتساؤل' : 'Confused (حيرة)'}</option>
                <option value="sad" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'حزن وشوق' : 'Sorrowful (حزن وشوق)'}</option>
              </select>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#0B0C0E] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <span className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'الوقت:' : 'Time:'}</span>
              <select
                value={selectedTiming}
                onChange={(e) => setSelectedTiming(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                <option value="sahar" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'وقت السحر (قبل الفجر)' : 'Pre-Dawn / Sahar (وقت السحر)'}</option>
                <option value="night" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'في جوف الليل' : 'Night (في الليل)'}</option>
                <option value="qaylulah" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'نوم القيلولة (نهاراً)' : 'Afternoon Nap (القيلولة)'}</option>
                <option value="unknown" className={isDark ? 'bg-[#14161A] text-stone-100' : 'bg-white text-[#111214]'}>{isArabic ? 'غير محدد' : 'Unspecified'}</option>
              </select>
            </div>
          </div>

          {/* Input box & Send button */}
          <div className="flex items-center gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendDream();
                }
              }}
              rows={1}
              placeholder={isArabic ? 'صِف رؤياك بالتفصيل (الرموز، الأشخاص، الألوان، الأفعال، والمشاعر المصاحبة)...' : 'Describe your dream (symbols, actions, people, colors, sensations)...'}
              className={`flex-1 p-3 rounded-2xl text-xs sm:text-sm border transition-all resize-none focus:outline-hidden ${
                isDark
                  ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                  : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
              }`}
            />

            <button
              type="button"
              onClick={() => handleSendDream()}
              disabled={isLoading || !inputText.trim()}
              className={`p-3 rounded-2xl active:scale-95 font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
              title={isArabic ? 'تعبير الرؤيا' : 'Interpret Dream'}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
