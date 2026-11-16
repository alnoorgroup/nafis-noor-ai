import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  ArrowRight,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import { ARABIC_READING_CURRICULUM } from '../../data/arabicCurriculum';
import { ArabicReadingPassage } from '../../types/arabic';
import { speakArabic, playChimeSound } from '../../utils/arabicSpeech';

interface ReadingViewProps {
  isDark: boolean;
  language?: string;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ isDark, language }) => {
  const [selectedPassage, setSelectedPassage] = useState<ArabicReadingPassage>(
    ARABIC_READING_CURRICULUM[0]
  );
  const [showTashkeel, setShowTashkeel] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  } | null>(null);

  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, boolean>>({});

  const handlePlayPassageAudio = () => {
    speakArabic(selectedPassage.arabicTashkeel || selectedPassage.arabicText, { rate: 0.8 });
  };

  const vocabList = (selectedPassage.vocabularyHighlights || []) as Array<{
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  }>;

  const questionsList = selectedPassage.questions || selectedPassage.comprehensionQuestions || [];

  const handleSelectWord = (wordObj: {
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  }) => {
    setSelectedWord(wordObj);
    speakArabic(wordObj.arabic);
  };

  const handleAnswerQuestion = (qId: string, optIdx: number, correctIdx: number) => {
    const isCorrect = optIdx === correctIdx;
    if (isCorrect) {
      playChimeSound('success');
    } else {
      playChimeSound('hint');
    }
    setQuestionAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setQuestionFeedback(prev => ({ ...prev, [qId]: isCorrect }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
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
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full border flex items-center gap-1 ${
                isDark
                  ? 'bg-white/[0.08] text-white border-white/[0.14]'
                  : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
              }`}>
                <BookOpen className="w-3.5 h-3.5" />
                Arabic Reading Academy
              </span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Graded Passages (Levels 1 to 4)</span>
            </div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Progressive Arabic Reading & Comprehension
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Read classical and modern Arabic texts. Toggle vowel markings (Tashkeel), tap words for morphology & roots, and verify your comprehension.
            </p>
          </div>

          {/* Controls: Tashkeel toggle & Audio */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTashkeel(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                showTashkeel
                  ? isDark
                    ? 'border-white/35 bg-white/[0.1] text-white'
                    : 'border-[#111214]/40 bg-[#111214]/[0.06] text-[#111214]'
                  : isDark
                  ? 'border-white/[0.08] bg-[#1B1D23] text-stone-400 hover:text-white'
                  : 'border-black/[0.08] bg-[#F3F3F1] text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              <span>{showTashkeel ? 'Vowels ON (مُشَكَّل)' : 'Vowels OFF (غَيْر مُشَكَّل)'}</span>
            </button>

            <button
              onClick={handlePlayPassageAudio}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen to Passage</span>
            </button>
          </div>
        </div>

        {/* Level Passages Ribbon */}
        <div className={`mt-5 pt-4 border-t flex gap-2 overflow-x-auto pb-1 scrollbar-none ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          {ARABIC_READING_CURRICULUM.map(passage => {
            const isSelected = passage.id === selectedPassage.id;
            return (
              <button
                key={passage.id}
                onClick={() => {
                  setSelectedPassage(passage);
                  setSelectedWord(null);
                  setQuestionAnswers({});
                  setQuestionFeedback({});
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex-shrink-0 transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-white bg-white text-[#111214]'
                      : 'border-[#111214] bg-[#111214] text-white'
                    : isDark
                    ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:bg-white/[0.08]'
                    : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.06]'
                }`}
              >
                <span>Level {passage.level}: {passage.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Passage Text Column */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className={`p-7 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
              isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
            }`}>
              <div>
                <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {selectedPassage.title}
                </h3>
                <span className={`text-xs font-serif ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{selectedPassage.arabicTitle}</span>
              </div>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Tap any word to inspect</span>
            </div>

            {/* Arabic Reading Body */}
            <div className={`p-6 rounded-2xl border mb-6 ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              <p
                dir="rtl"
                className={`text-2xl md:text-3xl font-serif leading-[2.2] tracking-wide select-text text-right ${
                  isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                }`}
              >
                {(showTashkeel
                  ? selectedPassage.arabicTashkeel || selectedPassage.arabicText
                  : selectedPassage.arabicPlain ||
                    (selectedPassage.arabicTashkeel || selectedPassage.arabicText).replace(
                      /[\u064B-\u065F\u0670]/g,
                      ''
                    )
                )
                  .split(' ')
                  .map((word, wIdx) => {
                    const cleanWord = word.replace(/[.,،؛!?]/g, '');
                    const matchingVocab = vocabList.find(
                      v =>
                        cleanWord.includes(v.arabic.replace(/[.,،؛!?]/g, '')) ||
                        v.arabic.replace(/[.,،؛!?]/g, '').includes(cleanWord)
                    );

                    return (
                      <span
                        key={wIdx}
                        onClick={() => {
                          if (matchingVocab) {
                            handleSelectWord(matchingVocab);
                          } else {
                            handleSelectWord({
                              arabic: word,
                              english: 'Click to pronounce or analyze',
                            });
                          }
                        }}
                        className={`cursor-pointer mx-1 px-1 py-0.5 rounded-lg transition-colors inline-block ${
                          isDark
                            ? 'hover:text-white hover:bg-white/[0.1]'
                            : 'hover:text-[#111214] hover:bg-black/[0.08]'
                        }`}
                        title="Click to analyze"
                      >
                        {word}
                      </span>
                    );
                  })}
              </p>
            </div>

            {/* English Translation Toggle */}
            <div className="space-y-2">
              <span className={`text-xs font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>English Translation:</span>
              <p className={`text-sm leading-relaxed italic p-4 rounded-xl border ${
                isDark
                  ? 'text-stone-300 bg-[#1B1D23] border-white/[0.08]'
                  : 'text-[#3F4248] bg-[#F3F3F1] border-black/[0.08]'
              }`}>
                "{selectedPassage.englishTranslation}"
              </p>
            </div>

            {/* Comprehension Questions */}
            <div className={`mt-8 pt-6 border-t space-y-5 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <HelpCircle className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>Comprehension Questions</span>
              </h4>

              {questionsList.map((q, qIdx) => {
                const userSelected = questionAnswers[q.id];
                const isAnswered = userSelected !== undefined;
                const isCorrect = questionFeedback[q.id];

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'border-white/[0.08] bg-[#1B1D23]' : 'border-black/[0.08] bg-[#F3F3F1]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = isDark
                          ? 'bg-[#14161A] border-white/[0.08] text-stone-200 hover:bg-white/[0.08]'
                          : 'bg-white border-black/[0.08] text-[#111214] hover:bg-black/[0.04]';

                        if (isAnswered) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = isDark
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                              : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold';
                          } else if (userSelected === optIdx) {
                            btnStyle = isDark
                              ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                              : 'bg-rose-50 border-rose-500 text-rose-700';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswerQuestion(q.id, optIdx, q.correctIndex)}
                            disabled={isAnswered}
                            className={`p-3 rounded-xl border text-xs text-left transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isCorrect
                            ? isDark
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : isDark
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <span className="font-semibold block mb-0.5">
                          {isCorrect ? 'Correct!' : 'Incorrect.'}
                        </span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Word Inspector & Root Analysis Column */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <h4 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              <Search className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <span>Linguistic & Root Inspector</span>
            </h4>

            {selectedWord ? (
              <div className="space-y-4">
                <div className={`text-center p-4 rounded-xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}>
                  <span className={`text-4xl font-serif block mb-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {selectedWord.arabic}
                  </span>
                  <button
                    onClick={() => speakArabic(selectedWord.arabic)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mt-2 border transition-colors ${
                      isDark
                        ? 'bg-white/[0.08] text-white border-white/[0.12] hover:bg-white/[0.14]'
                        : 'bg-white text-[#111214] border-black/[0.1] hover:bg-black/[0.04]'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Pronounce</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                    <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>Meaning:</span>
                    <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{selectedWord.english}</span>
                  </div>

                  {selectedWord.root && (
                    <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                      <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>Tri-literal Root (الجذر):</span>
                      <span className={`font-serif font-bold text-sm ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                        {selectedWord.root}
                      </span>
                    </div>
                  )}

                  {selectedWord.grammar && (
                    <div className="py-1.5">
                      <span className={`block mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Morphology & Grammar:</span>
                      <p className={`p-2.5 rounded-lg border ${
                        isDark ? 'text-stone-300 bg-[#1B1D23] border-white/[0.08]' : 'text-[#3F4248] bg-[#F3F3F1] border-black/[0.08]'
                      }`}>
                        {selectedWord.grammar}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 space-y-2 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                <p className="text-xs">Click or tap any Arabic word in the reading passage to inspect its root, grammar function, and sound.</p>
              </div>
            )}
          </div>

          {/* Key Vocabulary from this Passage */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <span>Vocabulary in this Passage</span>
            </h4>

            <div className="space-y-2">
              {vocabList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectWord(item)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#1B1D23] hover:bg-white/[0.08] border-white/[0.08]'
                      : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08]'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-serif block ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{item.arabic}</span>
                    <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{item.english}</span>
                  </div>
                  {item.root && (
                    <span className={`text-xs font-serif px-2 py-0.5 rounded-md border ${
                      isDark ? 'text-stone-300 bg-white/[0.06] border-white/[0.08]' : 'text-[#3F4248] bg-white border-black/[0.08]'
                    }`}>
                      {item.root}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
