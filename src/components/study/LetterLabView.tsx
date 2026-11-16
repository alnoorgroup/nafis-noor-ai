import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  PenTool,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Eraser,
  Eye,
  Layers,
  Award,
} from 'lucide-react';
import { ARABIC_LETTERS } from '../../data/arabicCurriculum';
import { ArabicLetter } from '../../types/arabic';
import { speakArabic, stopArabicSpeech } from '../../utils/arabicSpeech';
import { markLetterLearned, flagWeakLetter } from '../../utils/arabicStorage';

interface LetterLabViewProps {
  isDark: boolean;
  language?: string;
  onLetterLearned?: (letterId: string) => void;
}

type ChallengeType =
  | 'find_letter'
  | 'which_heard'
  | 'which_sound'
  | 'which_different'
  | 'connect_letters';

export const LetterLabView: React.FC<LetterLabViewProps> = ({ isDark, language, onLetterLearned }) => {
  const [selectedLetter, setSelectedLetter] = useState<ArabicLetter>(ARABIC_LETTERS[0]);
  const [activeTab, setActiveTab] = useState<'details' | 'writing' | 'challenges'>('details');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Canvas writing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Challenge game state
  const [challengeType, setChallengeType] = useState<ChallengeType>('find_letter');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [challengeScore, setChallengeScore] = useState({ correct: 0, total: 0 });

  // Play audio safely
  const handlePlayAudio = (text: string, rate = 0.85) => {
    setSpeechError(null);
    setIsPlayingAudio(true);
    const ok = speakArabic(text, {
      rate,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => {
        setIsPlayingAudio(false);
        setSpeechError('Audio playback unavailable in this browser environment.');
      },
    });
    if (!ok) {
      setIsPlayingAudio(false);
      setSpeechError('Audio playback unavailable in this browser environment.');
    }
  };

  // Canvas Drawing Handlers
  useEffect(() => {
    if (activeTab === 'writing' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 10;
        ctx.strokeStyle = isDark ? '#FFFFFF' : '#111214';
      }
    }
  }, [activeTab, selectedLetter, isDark]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const isArabic = language === 'ar' || language === 'العربية' || (typeof localStorage !== 'undefined' && localStorage.getItem('noor_app_language') === 'ar');

  // Challenge Generators
  const generateChallenges = () => {
    const letters = ARABIC_LETTERS;
    const current = selectedLetter;
    const otherLetters = letters.filter(l => l.id !== current.id);
    const randomOthers = otherLetters.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [current, ...randomOthers].sort(() => 0.5 - Math.random());

    if (challengeType === 'find_letter') {
      return {
        prompt: isArabic
          ? `حدد الحرف العربي الذي يمثل: ${current.arabicName} (${current.letter})`
          : `Find the Arabic letter for: ${current.name} (${current.transliteration})`,
        arabicPrompt: undefined,
        audioPlay: current.letter,
        options: options.map(o => o.letter),
        correctAnswer: current.letter,
        explanation: isArabic
          ? `الحرف ${current.letter} هو "${current.arabicName}" ومخرجه الفصيح من: ${current.makhrajDescription}.`
          : `${current.letter} is "${current.name}" (${current.arabicName}), representing the sound "${current.transliteration}".`,
      };
    }

    if (challengeType === 'which_heard') {
      return {
        prompt: isArabic
          ? 'استمع إلى النطق الصوتي وحدد الحرف المطابق:'
          : 'Listen to the sound and select the corresponding Arabic letter:',
        arabicPrompt: isArabic ? '🔊 استماع' : '🔊 Listen',
        audioPlay: current.letter,
        options: options.map(o => o.letter),
        correctAnswer: current.letter,
        explanation: isArabic
          ? `لقد استمعت إلى نطق ${current.arabicName} (${current.letter}). المخرج: ${current.makhrajDescription}.`
          : `You heard the articulation of ${current.name} (${current.letter}). Makhraj: ${current.makhrajDescription}`,
      };
    }

    if (challengeType === 'which_sound') {
      const fathaSample = current.harakat.fatha;
      return {
        prompt: isArabic
          ? `أي صوت يوافق الحرف ${current.letter} عند تحريكه بالفتحة (${fathaSample.text})؟`
          : `Which phonetic sound corresponds to ${current.letter} with Fatha (${fathaSample.text})?`,
        arabicPrompt: fathaSample.text,
        audioPlay: fathaSample.audioText,
        options: isArabic
          ? [fathaSample.text, current.harakat.damma.text, current.harakat.kasra.text, 'سكون'].sort(() => 0.5 - Math.random())
          : [fathaSample.transliteration, current.harakat.damma.transliteration, current.harakat.kasra.transliteration, 'silent'].sort(() => 0.5 - Math.random()),
        correctAnswer: isArabic ? fathaSample.text : fathaSample.transliteration,
        explanation: isArabic
          ? `الفتحة ( َ ) فوق حرف ${current.arabicName} تمنحه صوتاً مفتوحاً خفيفاً "${fathaSample.text}".`
          : `Fatha ( َ ) placed above ${current.name} gives the open short vowel sound "${fathaSample.transliteration}".`,
      };
    }

    if (challengeType === 'which_different') {
      // Find 3 connectors and 1 non-connector, or 3 with dots and 1 without
      const isConnector = current.isConnector;
      const oddCandidate = isConnector
        ? letters.find(l => !l.isConnector) || letters[0]
        : letters.find(l => l.isConnector) || letters[1];

      const sameCandidates = letters
        .filter(l => l.isConnector === isConnector && l.id !== current.id)
        .slice(0, 2);

      const diffOptions = [oddCandidate, current, ...sameCandidates].sort(() => 0.5 - Math.random());

      return {
        prompt: isArabic
          ? (isConnector
            ? 'أي هذه الحروف يُعد من الحروف غير المتصلة (لا يتصل بما بعده)؟'
            : 'أي هذه الحروف يمكنه أن يتصل بما بعده؟')
          : (isConnector
            ? 'Which of these letters is a NON-CONNECTOR (does not connect to the left)?'
            : 'Which of these letters CAN connect to the left?'),
        arabicPrompt: undefined,
        audioPlay: oddCandidate.letter,
        options: diffOptions.map(o => o.letter),
        correctAnswer: oddCandidate.letter,
        explanation: isArabic
          ? (isConnector
            ? `الحرف ${oddCandidate.arabicName} (${oddCandidate.letter}) من الحروف الستة التي لا تتصل بما بعدها (ا، د، ذ، ر، ز، و).`
            : `الحرف ${oddCandidate.arabicName} (${oddCandidate.letter}) يتصل من الطرفين.`)
          : (isConnector
            ? `${oddCandidate.name} (${oddCandidate.letter}) is one of the 6 non-connecting letters (ا, د, ذ, ر, ز, و).`
            : `${oddCandidate.name} (${oddCandidate.letter}) connects from both sides.`),
      };
    }

    // connect_letters
    return {
      prompt: isArabic
        ? 'صل هذه الحروف بالترتيب لتكوين الكلمة: ب - ي - ت'
        : 'Connect these letters in order: ب - ي - ت (B - Y - T)',
      arabicPrompt: 'ب - ي - ت',
      audioPlay: 'بَيْت',
      options: ['بَيْت', 'تَيْب', 'بِتْي', 'يَبْت'],
      correctAnswer: 'بَيْت',
      explanation: isArabic
        ? 'تتصل باء البداية (بـ) مع ياء الوسط (ـيـ) وتاء النهاية (ـت) لتكوين كلمة "بَيْت".'
        : 'بـ (initial Baa) connects to ـيـ (medial Yaa) connects to ـت (final Taa) to spell بَيْت (bayt - house).',
    };
  };

  const currentChallenge = generateChallenges();

  const handleSelectOption = (option: string) => {
    if (challengeFeedback) return;
    setSelectedOption(option);
    const isCorrect = option === currentChallenge.correctAnswer;
    setChallengeScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (isCorrect) {
      markLetterLearned(selectedLetter.id);
      onLetterLearned?.(selectedLetter.id);
    } else {
      flagWeakLetter(selectedLetter.id);
    }

    setChallengeFeedback({
      isCorrect,
      explanation: currentChallenge.explanation,
    });
  };

  const handleNextChallenge = () => {
    setSelectedOption(null);
    setChallengeFeedback(null);
    setCurrentChallengeIndex(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full border ${
                isDark
                  ? 'bg-white/[0.08] text-white border-white/15'
                  : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
              }`}>
                {isArabic ? 'معمل الحروف الهجائية' : 'Alphabet Laboratory'}
              </span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? '٢٨ حرفاً عربياً فصيحاً' : '28 Classical Letters'}
              </span>
            </div>
            <h2 className={`text-2xl font-bold font-serif tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {isArabic ? 'معمل الحروف العربية التفاعلي' : 'Interactive Arabic Letter Lab'}
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'استكشف أصوات الحروف ومخارجها وأشكالها مع الحركات ولوحة رسم المسار والتحديات التفاعلية.'
                : 'Explore letter recognition, pronunciation points (Makhārij), positional shapes, Harakat, and write with stroke practice.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#1B1D23] border-white/10' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'details'
                  ? isDark
                    ? 'bg-white text-[#111214] shadow-xs'
                    : 'bg-[#111214] text-white shadow-xs'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              {isArabic ? 'تشريح الحرف والمخرج' : 'Letter Anatomy'}
            </button>
            <button
              onClick={() => setActiveTab('writing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'writing'
                  ? isDark
                    ? 'bg-white text-[#111214] shadow-xs'
                    : 'bg-[#111214] text-white shadow-xs'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isArabic ? 'لوحة رسم المسار' : 'Stroke Canvas'}</span>
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'challenges'
                  ? isDark
                    ? 'bg-white text-[#111214] shadow-xs'
                    : 'bg-[#111214] text-white shadow-xs'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isArabic ? 'التحديات التفاعلية' : 'Interactive Challenges'}</span>
            </button>
          </div>
        </div>

        {/* 28 Letters Ribbon */}
        <div className={`mt-6 pt-5 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            <span>
              {isArabic ? 'اختر أي حرف للمدارسة والتمرين:' : 'Select any letter to inspect or practice:'}
            </span>
            <span>
              {isArabic ? `الترتيب: ${selectedLetter.order} من ٢٨` : `Order: ${selectedLetter.order} of 28`}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ARABIC_LETTERS.map(letter => {
              const isSelected = selectedLetter.id === letter.id;
              return (
                <button
                  key={letter.id}
                  onClick={() => {
                    setSelectedLetter(letter);
                    handlePlayAudio(letter.letter);
                  }}
                  className={`flex-shrink-0 w-11 h-12 rounded-xl flex flex-col items-center justify-center font-serif text-lg transition-all border ${
                    isSelected
                      ? isDark
                        ? 'border-white bg-white text-[#111214] shadow-sm scale-105'
                        : 'border-[#111214] bg-[#111214] text-white shadow-sm scale-105'
                      : isDark
                      ? 'border-white/[0.08] bg-[#1B1D23] text-stone-200 hover:bg-white/10'
                      : 'border-black/[0.08] bg-[#F3F3F1] text-[#111214] hover:bg-black/[0.08]'
                  }`}
                  title={`${letter.name} (${letter.arabicName})`}
                >
                  <span className="leading-none text-xl font-bold">{letter.letter}</span>
                  <span className={`text-[9px] font-sans font-medium ${
                    isSelected
                      ? isDark ? 'text-[#111214]/70' : 'text-white/80'
                      : isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                  }`}>
                    {isArabic ? letter.arabicName : letter.transliteration}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {speechError && (
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
          isDark
            ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
            : 'border-sky-300 bg-sky-50 text-sky-800'
        }`}>
          <VolumeX className="w-4 h-4 flex-shrink-0" />
          <span>{isArabic ? 'التشغيل الصوتي غير متاح في هذا المتصفح' : speechError}</span>
        </div>
      )}

      {/* Mode 1: Letter Anatomy & Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Letter Card */}
          <div
            className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${
              isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-sm'
            }`}
          >
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {!selectedLetter.isConnector && (
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                  isDark
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}>
                  {isArabic ? 'حرف غير متصل' : 'Non-Connector'}
                </span>
              )}
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                isDark
                  ? 'bg-white/[0.06] text-stone-300 border-white/10'
                  : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
              }`}>
                {isArabic ? `المخرج: ${selectedLetter.makhraj}` : `Makhraj: ${selectedLetter.makhraj}`}
              </span>
            </div>

            {/* Giant Letter Display */}
            <div className="my-6 relative">
              <div className={`text-8xl md:text-9xl font-serif font-bold select-none ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}>
                {selectedLetter.letter}
              </div>
            </div>

            <div className="space-y-1 mb-5">
              <div className={`text-2xl font-bold font-serif flex items-center justify-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <span>{isArabic ? selectedLetter.arabicName : selectedLetter.name}</span>
                {!isArabic && (
                  <span className={`${isDark ? 'text-stone-400' : 'text-[#5A5D63]'} font-normal`}>({selectedLetter.arabicName})</span>
                )}
              </div>
              <p className={`text-xs max-w-sm ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? `المخرج الفصيح: ${selectedLetter.makhrajDescription}`
                  : `Sound: ${selectedLetter.transliteration} — ${selectedLetter.phoneticSound}`}
              </p>
            </div>

            {/* Audio Buttons: Letter Name & Phonetic Sound */}
            <div className="w-full max-w-xs grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePlayAudio(selectedLetter.arabicName)}
                disabled={isPlayingAudio}
                className={`py-3 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-white text-[#111214] hover:bg-stone-200'
                    : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
                title={isArabic ? 'استماع لاسم الحرف العربي' : 'Hear Arabic letter name'}
              >
                <Volume2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {isPlayingAudio
                    ? (isArabic ? 'تشغيل...' : 'Playing...')
                    : (isArabic ? `اسم الحرف (${selectedLetter.arabicName})` : `Name (${selectedLetter.arabicName})`)}
                </span>
              </button>
              <button
                onClick={() => handlePlayAudio(selectedLetter.harakat.fatha.text)}
                disabled={isPlayingAudio}
                className={`py-3 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-white/15 hover:border-white/30 bg-white/[0.06] text-white'
                    : 'border-black/[0.1] hover:border-black/30 bg-[#F3F3F1] text-[#111214]'
                }`}
                title={isArabic ? 'استماع لنطق الحرف بالحركة' : 'Hear phonetic consonant reading'}
              >
                <Volume2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {isArabic
                    ? `النطق الفصيح ("${selectedLetter.harakat.fatha.text}")`
                    : `Phonetic ("${selectedLetter.harakat.fatha.text}")`}
                </span>
              </button>
            </div>

            {/* Mark as Learned Button */}
            <button
              onClick={() => {
                markLetterLearned(selectedLetter.id);
                onLetterLearned?.(selectedLetter.id);
              }}
              className={`mt-2.5 text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isArabic ? 'تعليم الحرف كمُتقَن' : 'Mark Letter as Mastered'}</span>
            </button>
          </div>

          {/* Forms, Harakat & Examples */}
          <div className="lg:col-span-7 space-y-6">
            {/* 4 Positional Forms */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <Layers className="w-4 h-4" />
                  <span>
                    {isArabic
                      ? 'الأشكال الموضعية الأربعة (المس للاستماع)'
                      : 'The 4 Positional Shapes (Tap to Listen)'}
                  </span>
                </h3>
                <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {isArabic ? 'من اليمين إلى اليسار' : 'Right to Left'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <button
                  onClick={() => handlePlayAudio(selectedLetter.forms.isolated || selectedLetter.arabicName)}
                  className={`p-3 rounded-xl border transition-all group cursor-pointer ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/25' : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/25'
                  }`}
                  title={isArabic ? 'استماع للشكل المنفصل' : 'Listen to isolated form'}
                >
                  <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'مُنْفَصِل' : 'Isolated'}
                  </span>
                  <span className={`text-3xl font-serif block mb-1 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.forms.isolated}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? 'في حالة الانفراد' : 'مُنْفَصِل'}
                  </span>
                </button>
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.fatha.text)}
                  className={`p-3 rounded-xl border transition-all group cursor-pointer ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/25' : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/25'
                  }`}
                  title={isArabic ? 'استماع لشكل البداية' : 'Listen to initial form'}
                >
                  <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'فِي البِدَايَةِ' : 'Initial (Start)'}
                  </span>
                  <span className={`text-3xl font-serif block mb-1 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.forms.initial}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? 'أول الكلمة' : 'فِي البِدَايَةِ'}
                  </span>
                </button>
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.fatha.text)}
                  className={`p-3 rounded-xl border transition-all group cursor-pointer ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/25' : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/25'
                  }`}
                  title={isArabic ? 'استماع لشكل الوسط' : 'Listen to medial form'}
                >
                  <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'فِي الوَسَطِ' : 'Medial (Middle)'}
                  </span>
                  <span className={`text-3xl font-serif block mb-1 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.forms.medial}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? 'وسط الكلمة' : 'فِي الوَسَطِ'}
                  </span>
                </button>
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.fatha.text)}
                  className={`p-3 rounded-xl border transition-all group cursor-pointer ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/25' : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/25'
                  }`}
                  title={isArabic ? 'استماع لشكل النهاية' : 'Listen to final form'}
                >
                  <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'فِي النِّهَايَةِ' : 'Final (Ending)'}
                  </span>
                  <span className={`text-3xl font-serif block mb-1 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.forms.final}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? 'آخر الكلمة' : 'فِي النِّهَايَةِ'}
                  </span>
                </button>
              </div>

              {selectedLetter.commonMistakes && (
                <div className={`mt-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  isDark
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                    : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}>
                  <HelpCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span>{selectedLetter.commonMistakes}</span>
                </div>
              )}
            </div>

            {/* Harakat Soundboard */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-xs'
              }`}
            >
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <Volume2 className="w-4 h-4" />
                <span>
                  {isArabic
                    ? 'لوحة أصوات الحركات والتشكيل'
                    : 'Harakat (Short Vowels & Diacritics) Soundboard'}
                </span>
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {/* Fatha */}
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.fatha.audioText)}
                  className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                  }`}
                >
                  <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.harakat.fatha.text}
                  </span>
                  <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                    {isArabic ? 'فَتْحَة' : 'Fatḥah'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? selectedLetter.harakat.fatha.text : `"${selectedLetter.harakat.fatha.transliteration}"`}
                  </span>
                </button>

                {/* Damma */}
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.damma.audioText)}
                  className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                  }`}
                >
                  <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.harakat.damma.text}
                  </span>
                  <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                    {isArabic ? 'ضَمَّة' : 'Ḍammah'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? selectedLetter.harakat.damma.text : `"${selectedLetter.harakat.damma.transliteration}"`}
                  </span>
                </button>

                {/* Kasra */}
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.kasra.audioText)}
                  className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                  }`}
                >
                  <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.harakat.kasra.text}
                  </span>
                  <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                    {isArabic ? 'كَسْرَة' : 'Kasrah'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? selectedLetter.harakat.kasra.text : `"${selectedLetter.harakat.kasra.transliteration}"`}
                  </span>
                </button>

                {/* Sukoon */}
                <button
                  onClick={() => handlePlayAudio(selectedLetter.harakat.sukoon.audioText)}
                  className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                  }`}
                >
                  <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {selectedLetter.harakat.sukoon.text}
                  </span>
                  <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                    {isArabic ? 'سُكُون' : 'Sukūn'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? selectedLetter.harakat.sukoon.text : `"${selectedLetter.harakat.sukoon.transliteration}"`}
                  </span>
                </button>

                {/* Shadda */}
                {selectedLetter.harakat.shadda && (
                  <button
                    onClick={() => handlePlayAudio(selectedLetter.harakat.shadda!.audioText)}
                    className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                    }`}
                  >
                    <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {selectedLetter.harakat.shadda.text}
                    </span>
                    <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                      {isArabic ? 'شَدَّة' : 'Shaddah'}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {isArabic ? 'تشديد' : 'Doubled'}
                    </span>
                  </button>
                )}

                {/* Tanween */}
                {selectedLetter.harakat.tanween && (
                  <button
                    onClick={() => handlePlayAudio(selectedLetter.harakat.tanween!.audioText)}
                    className={`p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                    }`}
                  >
                    <span className={`text-2xl font-serif block group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {selectedLetter.harakat.tanween.text}
                    </span>
                    <span className={`text-[11px] font-semibold block mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                      {isArabic ? 'تَنْوِين' : 'Tanwīn'}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {isArabic ? 'ـاً' : '"-an"'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Example Words in Positions */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-xs'
              }`}
            >
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <Sparkles className="w-4 h-4" />
                <span>
                  {isArabic
                    ? `شواهد وأمثلة لحرف "${selectedLetter.arabicName}"`
                    : `Example Words with "${selectedLetter.name}"`}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedLetter.sampleWords.initial && (
                  <button
                    onClick={() => handlePlayAudio(selectedLetter.sampleWords.initial.arabic)}
                    className={`p-3 rounded-xl border transition-all text-right group cursor-pointer ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                    }`}
                  >
                    <span className={`text-[10px] block text-right ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {isArabic ? 'أول الكلمة:' : 'Beginning:'}
                    </span>
                    <span className={`text-xl font-serif block my-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {selectedLetter.sampleWords.initial.arabic}
                    </span>
                    {!isArabic && (
                      <>
                        <span className={`text-xs block text-right ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                          {selectedLetter.sampleWords.initial.transliteration}
                        </span>
                        <span className={`text-[11px] block text-left ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {selectedLetter.sampleWords.initial.english}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {selectedLetter.sampleWords.medial && (
                  <button
                    onClick={() => handlePlayAudio(selectedLetter.sampleWords.medial.arabic)}
                    className={`p-3 rounded-xl border transition-all text-right group cursor-pointer ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                    }`}
                  >
                    <span className={`text-[10px] block text-right ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {isArabic ? 'وسط الكلمة:' : 'Middle:'}
                    </span>
                    <span className={`text-xl font-serif block my-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {selectedLetter.sampleWords.medial.arabic}
                    </span>
                    {!isArabic && (
                      <>
                        <span className={`text-xs block text-right ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                          {selectedLetter.sampleWords.medial.transliteration}
                        </span>
                        <span className={`text-[11px] block text-left ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {selectedLetter.sampleWords.medial.english}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {selectedLetter.sampleWords.final && (
                  <button
                    onClick={() => handlePlayAudio(selectedLetter.sampleWords.final.arabic)}
                    className={`p-3 rounded-xl border transition-all text-right group cursor-pointer ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23] hover:border-white/25' : 'border-black/[0.08] bg-[#F3F3F1] hover:border-black/25'
                    }`}
                  >
                    <span className={`text-[10px] block text-right ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {isArabic ? 'آخر الكلمة:' : 'Ending:'}
                    </span>
                    <span className={`text-xl font-serif block my-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {selectedLetter.sampleWords.final.arabic}
                    </span>
                    {!isArabic && (
                      <>
                        <span className={`text-xs block text-right ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                          {selectedLetter.sampleWords.final.transliteration}
                        </span>
                        <span className={`text-[11px] block text-left ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {selectedLetter.sampleWords.final.english}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Stroke Writing Practice Canvas */}
      {activeTab === 'writing' && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <PenTool className="w-4 h-4" />
                <span>
                  {isArabic
                    ? `رسم وكتابة حرف "${selectedLetter.arabicName}" (${selectedLetter.letter})`
                    : `Write "${selectedLetter.name}" (${selectedLetter.letter})`}
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'تتبّع مسار الحرف العربي من اليمين إلى اليسار باتباع خط القالب الإرشادي.'
                  : 'Trace and draw the Arabic letter from right to left following the guideline template.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearCanvas}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'border-white/10 bg-[#1B1D23] text-stone-300 hover:bg-white/10'
                    : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.08]'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{isArabic ? 'مسح اللوحة' : 'Clear Canvas'}</span>
              </button>
              <button
                onClick={() => {
                  markLetterLearned(selectedLetter.id);
                  onLetterLearned?.(selectedLetter.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-white text-[#111214] hover:bg-stone-200'
                    : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حفظ التمرين' : 'Save Practice'}</span>
              </button>
            </div>
          </div>

          <div className={`relative w-full max-w-xl mx-auto aspect-video rounded-2xl border border-dashed flex items-center justify-center overflow-hidden ${
            isDark ? 'border-white/15 bg-[#0B0C0E]' : 'border-black/20 bg-[#F3F3F1]'
          }`}>
            {/* Template Ghost Letter in Background */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-25">
              <span className={`text-[170px] font-serif ${isDark ? 'text-white/50' : 'text-[#111214]/30'}`}>
                {selectedLetter.letter}
              </span>
            </div>

            {/* Baseline Guide */}
            <div className={`absolute inset-x-8 top-[60%] border-b pointer-events-none ${isDark ? 'border-white/15' : 'border-black/15'}`} />

            {/* Interactive Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={600}
              height={340}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
          </div>

          <div className={`flex items-center justify-between text-xs max-w-xl mx-auto mt-3 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            <span>{isArabic ? 'ارسم باللمس أو القلم أو الفأرة' : 'Draw with touch, stylus or mouse'}</span>
            {hasDrawn && (
              <span className="text-emerald-500 font-medium">
                {isArabic ? 'أحسنت! رسم دقيق وموفق.' : 'Great stroke effort!'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Interactive Letter Challenges */}
      {activeTab === 'challenges' && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-sm'
          }`}
        >
          {/* Challenge Switcher Sub-nav */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(
              [
                { id: 'find_letter', label: isArabic ? '١. ابحث عن الحرف' : '1. Find This Letter' },
                { id: 'which_heard', label: isArabic ? '٢. أي حرف سمعت؟' : '2. Which Did You Hear?' },
                { id: 'which_sound', label: isArabic ? '٣. أي صوت يطابق؟' : '3. Which Sound Belongs?' },
                { id: 'which_different', label: isArabic ? '٤. أي الحروف مختلف؟' : '4. Which is Different?' },
                { id: 'connect_letters', label: isArabic ? '٥. وصل هذه الحروف' : '5. Connect These Letters' },
              ] as const
            ).map(ch => (
              <button
                key={ch.id}
                onClick={() => {
                  setChallengeType(ch.id);
                  setSelectedOption(null);
                  setChallengeFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  challengeType === ch.id
                    ? isDark
                      ? 'border-white bg-white text-[#111214]'
                      : 'border-[#111214] bg-[#111214] text-white'
                    : isDark
                    ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:text-white'
                    : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.08]'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Current Challenge Container */}
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? `سؤال التحدي رقم ${currentChallengeIndex + 1}` : `Challenge Question #${currentChallengeIndex + 1}`}
              </span>
              <h3 className={`text-lg font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {currentChallenge.prompt}
              </h3>

              {currentChallenge.audioPlay && (
                <button
                  onClick={() => handlePlayAudio(currentChallenge.audioPlay!)}
                  className={`inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.06] text-white border-white/15 hover:bg-white/10'
                      : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08] hover:bg-black/[0.08]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isArabic ? 'تشغيل الصوت' : 'Play Sound'}</span>
                </button>
              )}

              {currentChallenge.arabicPrompt && (
                <div className={`text-4xl font-serif py-3 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {currentChallenge.arabicPrompt}
                </div>
              )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              {currentChallenge.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentChallenge.correctAnswer;
                let optStyle = isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200 hover:bg-white/10'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:bg-black/[0.08]';

                if (challengeFeedback) {
                  if (isCorrect) {
                    optStyle = isDark
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-bold'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                  } else if (isSelected) {
                    optStyle = isDark
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                      : 'bg-rose-50 border-rose-500 text-rose-700';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={Boolean(challengeFeedback)}
                    className={`py-4 px-3 rounded-2xl border text-xl font-serif transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {challengeFeedback && isCorrect && (
                      <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    )}
                    {challengeFeedback && isSelected && !isCorrect && (
                      <XCircle className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next */}
            {challengeFeedback && (
              <div
                className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
                  challengeFeedback.isCorrect
                    ? isDark
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : isDark
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
                }`}
                dir={isArabic ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {challengeFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isArabic ? 'إجابة صحيحة وموفقة!' : 'Correct Answer!'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>{isArabic ? 'إجابة غير دقيقة، فلنتدبر:' : "Not quite right. Let's analyze:"}</span>
                    </>
                  )}
                </div>
                <p className={`${isDark ? 'text-stone-300' : 'text-[#3F4248]'} leading-relaxed`}>{challengeFeedback.explanation}</p>
                <button
                  onClick={handleNextChallenge}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 ml-auto cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-white text-[#111214] hover:bg-stone-200'
                      : 'bg-[#111214] text-white hover:bg-[#27292D]'
                  }`}
                >
                  <span>{isArabic ? 'التحدي التالي' : 'Next Challenge'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`text-xs pt-2 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {isArabic
                ? `نتيجتك في هذه الجلسة: ${challengeScore.correct} صحيحة من أصل ${challengeScore.total} محاولات`
                : `Performance in this session: ${challengeScore.correct} correct of ${challengeScore.total} attempts`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
