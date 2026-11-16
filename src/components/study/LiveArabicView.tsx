import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Gauge,
  Sparkles,
  HelpCircle,
  Languages,
  CheckCircle2,
  FileQuestion,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  speakArabic,
  stopArabicSpeech,
  createArabicSpeechRecognition,
  SpeechRecognitionController,
} from '../../utils/arabicSpeech';
import { getLanguageHeaders } from '../../utils/i18n';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface LiveArabicViewProps {
  isDark: boolean;
  language?: string;
}

interface LiveExchange {
  id: string;
  sender: 'user' | 'noor';
  arabic: string;
  transliteration?: string;
  english?: string;
  notes?: string;
  actionTag?: string;
}

export const LiveArabicView: React.FC<LiveArabicViewProps> = ({ isDark, language }) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [sessionActive, setSessionActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85 normal, 0.6 slow
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [exchanges, setExchanges] = useState<LiveExchange[]>([
    {
      id: 'live-start',
      sender: 'noor',
      arabic: 'مَرْحَبًا بِكَ فِي جَلْسَةِ المُحَادَثَةِ المُبَاشِرَةِ! عَمَّ تُرِيدُ أَنْ نَتَحَدَّثَ اليَوْمَ؟',
      transliteration: 'Marḥaban bika fī jalsati al-muḥādathati al-mubāshirah! ‘Amma turīdu an nataḥaddatha al-yawm?',
      english: 'Welcome to the Live Arabic session! What would you like to speak about today?',
      notes: 'Ready for interactive practice. Use any action button below or speak naturally.',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges, isProcessing]);

  const startVoiceInput = () => {
    setSpeechError(null);
    const controller = createArabicSpeechRecognition({
      onStart: () => setIsListening(true),
      onResult: (transcript, isFinal) => {
        setInputVal(transcript);
        if (isFinal) {
          setIsListening(false);
          handleTriggerTurn(transcript);
        }
      },
      onError: err => {
        setIsListening(false);
        setSpeechError(err);
      },
      onEnd: () => setIsListening(false),
    });

    if (controller) {
      recognitionRef.current = controller;
      controller.start();
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Turn Trigger with Action Modifiers
  const handleTriggerTurn = async (
    customText?: string,
    actionOverride?: 'repeat' | 'slow_down' | 'make_easier' | 'explain' | 'translate' | 'correct_me' | 'test_me'
  ) => {
    const text = (customText ?? inputVal).trim();
    if (!text && !actionOverride) return;

    let actionPrompt = '';
    let actionLabel = '';

    if (actionOverride === 'repeat') {
      const lastNoor = exchanges.slice().reverse().find(e => e.sender === 'noor');
      if (lastNoor) {
        speakArabic(lastNoor.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
      }
      return;
    } else if (actionOverride === 'slow_down') {
      setIsSlowMode(prev => !prev);
      const newRate = !isSlowMode ? 0.6 : 0.85;
      setSpeechRate(newRate);
      const lastNoor = exchanges.slice().reverse().find(e => e.sender === 'noor');
      if (lastNoor) {
        speakArabic(lastNoor.arabic, { rate: newRate });
      }
      return;
    } else if (actionOverride === 'make_easier') {
      setIsEasyMode(true);
      actionLabel = 'Make Easier';
      actionPrompt = 'Simplify the conversation: use foundational vocabulary, short 3-word sentences, and very clear elementary Arabic.';
    } else if (actionOverride === 'explain') {
      actionLabel = 'Explain';
      actionPrompt = `Explain the grammar, morphology, and vocabulary of the last sentence thoroughly in the user's selected language (${activeLang}).`;
    } else if (actionOverride === 'translate') {
      actionLabel = 'Translate';
      actionPrompt = `Provide a complete word-by-word breakdown and natural translation in the user's selected language (${activeLang}) of what was just said.`;
    } else if (actionOverride === 'correct_me') {
      actionLabel = 'Correct Me';
      actionPrompt = `Examine the student's Arabic: "${text}". Point out any pronunciation, grammar, or word choice flaws and show the perfect vocalized form. Explain in the user's selected language (${activeLang}).`;
    } else if (actionOverride === 'test_me') {
      actionLabel = 'Test Me';
      actionPrompt = `Ask me a direct check-for-understanding question in Arabic based on our current conversation, with 3 options. Provide brief instructions in the user's selected language (${activeLang}).`;
    }

    if (text) {
      setExchanges(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          arabic: text,
          actionTag: actionLabel || undefined,
        },
      ]);
    }

    setInputVal('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/study/tutor', {
        method: 'POST',
        headers: getLanguageHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          language: activeLang,
          message: actionPrompt
            ? `${actionPrompt}\nUser input: "${text}"`
            : `User spoke: "${text}". Respond in natural conversational Arabic with diacritics. If providing translations or explanations, respond in the user's selected language (${activeLang}). Keep it engaging.`,
          history: exchanges.slice(-6).map(e => ({
            role: e.sender === 'user' ? 'user' : 'model',
            text: e.arabic,
          })),
          mode: 'general',
          subject: 'Live Arabic Conversation',
        }),
      });

      if (!response.ok) throw new Error('Live tutor service unavailable');
      const data = await response.json();
      const rawText = data.result || data.answer || 'مُمْتَاز! لِنُتَابِع المُحَادَثَة.';

      const newNoorMsg: LiveExchange = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabic: rawText,
        notes: actionLabel ? `Handled action: ${actionLabel}` : undefined,
      };

      setExchanges(prev => [...prev, newNoorMsg]);
      speakArabic(newNoorMsg.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
    } catch (err) {
      console.warn('Live tutor fallback:', err);
      const fallbackMsg: LiveExchange = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabic: 'أَحْسَنْتَ قَوْلًا! هَلْ تُرِيدُ أَنْ نُمَارِسَ المَزِيدَ مِنَ الكَلِمَاتِ؟',
        english: 'Well said! Would you like to practice more words together?',
      };
      setExchanges(prev => [...prev, fallbackMsg]);
      speakArabic(fallbackMsg.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Session Banner */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full border ${
                isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                Live Arabic Session Active
              </span>
              {isSlowMode && (
                <span className={`px-2 py-0.5 text-[10px] rounded-md border ${
                  isDark
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  Slow Pace (0.6x)
                </span>
              )}
              {isEasyMode && (
                <span className={`px-2 py-0.5 text-[10px] rounded-md border ${
                  isDark
                    ? 'bg-white/[0.08] text-stone-200 border-white/15'
                    : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                }`}>
                  Elementary Vocabulary
                </span>
              )}
            </div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Live Conversational Arabic with Noor
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Natural real-time dialogue. Control pace, difficulty, translation, explanations, and instant corrections on demand.
            </p>
          </div>

          {/* Real-Time Interaction Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Speak */}
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Stop' : 'Speak'}</span>
            </button>

            {/* Listen */}
            <button
              onClick={() => {
                const last = exchanges.slice().reverse().find(e => e.sender === 'noor');
                if (last) speakArabic(last.arabic, { rate: speechRate });
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/10 text-stone-300 border-white/[0.08]'
                  : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#3F4248] border-black/[0.08]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>

            {/* Repeat */}
            <button
              onClick={() => handleTriggerTurn(undefined, 'repeat')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/10 text-stone-300 border-white/[0.08]'
                  : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#3F4248] border-black/[0.08]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat</span>
            </button>

            {/* Slow down */}
            <button
              onClick={() => handleTriggerTurn(undefined, 'slow_down')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isSlowMode
                  ? isDark
                    ? 'border-sky-500/50 bg-sky-500/20 text-sky-300'
                    : 'border-sky-300 bg-sky-50 text-sky-700'
                  : isDark
                  ? 'border-white/[0.08] bg-white/[0.06] text-stone-300 hover:bg-white/10'
                  : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.08]'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{isSlowMode ? 'Normal Speed' : 'Slow Down'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Action Toolbar: Make easier, Explain, Translate, Correct me, Test me */}
        <div className={`mt-4 pt-4 border-t flex flex-wrap items-center gap-2 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <span className={`text-xs mr-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Noor AI Controls:</span>

          <button
            onClick={() => handleTriggerTurn(undefined, 'make_easier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/10 text-stone-200 border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Make easier</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'explain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/10 text-stone-200 border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <HelpCircle className={`w-3.5 h-3.5 ${isDark ? 'text-sky-300' : 'text-sky-600'}`} />
            <span>Explain</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'translate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/10 text-stone-200 border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <Languages className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <span>Translate</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(inputVal || 'كَتَبْتُ الدَّرْسِ', 'correct_me')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/10 text-stone-200 border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Correct me</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'test_me')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/10 text-stone-200 border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5 text-rose-500" />
            <span>Test me</span>
          </button>
        </div>
      </div>

      {speechError && (
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between ${
          isDark
            ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
            : 'border-sky-300 bg-sky-50 text-sky-800'
        }`}>
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className={isDark ? 'text-stone-300' : 'text-sky-700 font-medium'}>
            Dismiss
          </button>
        </div>
      )}

      {/* Live Conversation Stream */}
      <div
        className={`rounded-2xl border flex flex-col h-[500px] overflow-hidden ${
          isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-sm'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {exchanges.map(ex => {
            const isNoor = ex.sender === 'noor';
            return (
              <div
                key={ex.id}
                className={`flex gap-3 max-w-2xl ${isNoor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isNoor && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
                    isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                  }`}>
                    ن
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border text-sm space-y-2 ${
                    isNoor
                      ? isDark
                        ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                        : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                      : isDark
                      ? 'bg-white/[0.1] border-white/20 text-white'
                      : 'bg-[#111214] border-[#111214] text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-xs font-semibold ${
                      isNoor ? (isDark ? 'text-white' : 'text-[#111214]') : 'text-white/90'
                    }`}>
                      {isNoor ? 'Noor AI (Live)' : 'You'}
                    </span>
                    {ex.actionTag && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${
                        isNoor
                          ? isDark
                            ? 'bg-white/[0.08] text-white border-white/15'
                            : 'bg-white text-[#111214] border-black/[0.08]'
                          : 'bg-white/15 text-white border-white/20'
                      }`}>
                        {ex.actionTag}
                      </span>
                    )}
                    <button
                      onClick={() => speakArabic(ex.arabic, { rate: speechRate })}
                      className={
                        isNoor
                          ? isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                          : 'text-white/80 hover:text-white'
                      }
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className={`text-2xl font-serif text-right leading-relaxed select-text ${
                    isNoor ? (isDark ? 'text-[#F3F4F6]' : 'text-[#111214]') : 'text-white'
                  }`}>
                    {ex.arabic}
                  </p>

                  {ex.transliteration && (
                    <p className={`text-xs italic ${
                      isNoor ? (isDark ? 'text-stone-400' : 'text-[#5A5D63]') : 'text-white/80'
                    }`}>{ex.transliteration}</p>
                  )}

                  {ex.english && (
                    <p className={`text-xs border-t pt-1.5 ${
                      isNoor
                        ? isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#5A5D63] border-black/[0.08]'
                        : 'text-white/80 border-white/15'
                    }`}>
                      {ex.english}
                    </p>
                  )}

                  {ex.notes && (
                    <div className={`p-2 rounded-xl text-xs ${
                      isNoor
                        ? isDark ? 'bg-white/[0.06] text-stone-300' : 'bg-white text-[#3F4248]'
                        : 'bg-white/10 text-white/90'
                    }`}>
                      {ex.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
              }`}>
                ن
              </div>
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-[#111214]'}`} />
                <span>Noor is adapting and responding in Arabic...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Live Input Field */}
        <div className={`p-4 border-t flex items-center gap-2 ${
          isDark ? 'border-white/[0.08] bg-[#14161A]' : 'border-black/[0.08] bg-[#FCFCFA]'
        }`}>
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTriggerTurn()}
            placeholder="Type your Arabic response, or click 'Speak' above..."
            dir="auto"
            className={`flex-1 px-4 py-3 rounded-2xl border text-sm focus:outline-hidden ${
              isDark
                ? 'bg-[#1B1D23] border-white/10 text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                : 'bg-white border-black/[0.08] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]'
            }`}
          />
          <button
            onClick={() => handleTriggerTurn()}
            disabled={!inputVal.trim() || isProcessing}
            className={`p-3 rounded-2xl disabled:opacity-30 transition-all ${
              isDark
                ? 'bg-white text-[#111214] hover:bg-stone-200'
                : 'bg-[#111214] text-white hover:bg-[#27292D]'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
