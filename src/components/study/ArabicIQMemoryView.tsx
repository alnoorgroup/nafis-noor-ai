import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  Award,
  HelpCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { ARABIC_IQ_CHALLENGES, ARABIC_MEMORY_CHALLENGES } from '../../data/arabicCurriculum';
import { ArabicIQChallenge, ArabicMemoryChallenge } from '../../types/arabic';
import { recordIQChallengeResult, recordMemoryChallengeResult, loadArabicProgress } from '../../utils/arabicStorage';

interface ArabicIQMemoryViewProps {
  isDark: boolean;
  language?: string;
}

export const ArabicIQMemoryView: React.FC<ArabicIQMemoryViewProps> = ({ isDark, language }) => {
  const [subTab, setSubTab] = useState<'iq' | 'memory'>('iq');

  // Arabic IQ State
  const [currentIqIndex, setCurrentIqIndex] = useState(0);
  const [iqSelectedOpt, setIqSelectedOpt] = useState<number | null>(null);
  const [iqFeedback, setIqFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [progressState, setProgressState] = useState(() => loadArabicProgress());

  // Memory Challenge State
  const [memIndex, setMemIndex] = useState(0);
  const [memPhase, setMemPhase] = useState<'memorize' | 'recall'>('memorize');
  const [memSelectedOpt, setMemSelectedOpt] = useState<number | null>(null);
  const [memFeedback, setMemFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  const currentIq = ARABIC_IQ_CHALLENGES[currentIqIndex % ARABIC_IQ_CHALLENGES.length];
  const currentMem = ARABIC_MEMORY_CHALLENGES[memIndex % ARABIC_MEMORY_CHALLENGES.length];

  // IQ Answer
  const handleIqSelect = (idx: number) => {
    if (iqFeedback) return;
    setIqSelectedOpt(idx);
    const isCorrect = idx === currentIq.correctIndex;
    const updated = recordIQChallengeResult(isCorrect);
    setProgressState(updated);
    setIqFeedback({
      isCorrect,
      explanation: currentIq.explanation,
    });
  };

  const handleNextIq = () => {
    setIqSelectedOpt(null);
    setIqFeedback(null);
    setCurrentIqIndex(prev => prev + 1);
  };

  // Memory Answer
  const handleMemSelect = (idx: number) => {
    if (memFeedback) return;
    setMemSelectedOpt(idx);
    const isCorrect = idx === currentMem.correctIndex;
    const updated = recordMemoryChallengeResult(isCorrect);
    setProgressState(updated);
    setMemFeedback({
      isCorrect,
      explanation: currentMem.explanation,
    });
  };

  const handleNextMem = () => {
    setMemSelectedOpt(null);
    setMemFeedback(null);
    setMemPhase('memorize');
    setMemIndex(prev => prev + 1);
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
              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full border flex items-center gap-1 ${
                  isDark
                    ? 'bg-white/[0.08] text-white border-white/[0.14]'
                    : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                Cognitive Arabic Lab
              </span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Linguistic Reasoning & Memory</span>
            </div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Arabic Linguistic IQ & Memory Arena
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Challenge yourself with root derivations (Wazn), morphological deduction, odd-one-out patterns, and sequential Arabic memory retention.
            </p>
          </div>

          {/* Mode Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <button
              onClick={() => setSubTab('iq')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'iq'
                  ? isDark
                    ? 'bg-white text-[#111214]'
                    : 'bg-[#111214] text-white'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              Arabic IQ Challenges
            </button>
            <button
              onClick={() => setSubTab('memory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'memory'
                  ? isDark
                    ? 'bg-white text-[#111214]'
                    : 'bg-[#111214] text-white'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              Arabic Memory Training
            </button>
          </div>
        </div>

        {/* Real Live Metrics Bar */}
        <div className={`mt-5 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <span className={`text-[11px] block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Linguistic IQ Index</span>
            <span className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {progressState.arabicIQScore}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <span className={`text-[11px] block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>IQ Puzzles Solved</span>
            <span className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {progressState.iqChallengesCompleted}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <span className={`text-[11px] block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Memory Accuracy</span>
            <span className={`text-xl font-bold font-serif ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {progressState.memoryAccuracy}%
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <span className={`text-[11px] block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Memory Sessions</span>
            <span className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {progressState.memorySessionsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab 1: Arabic IQ */}
      {subTab === 'iq' && currentIq && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border text-center space-y-6 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            <span>IQ Puzzle {currentIqIndex + 1} of {ARABIC_IQ_CHALLENGES.length}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase border ${
                isDark
                  ? 'bg-white/[0.08] text-white border-white/[0.12]'
                  : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
              }`}
            >
              {currentIq.type.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {currentIq.question}
            </h3>
            {currentIq.arabicPrompt && (
              <div className={`text-3xl md:text-4xl font-serif py-3 tracking-wide ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {currentIq.arabicPrompt}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {currentIq.options.map((opt, idx) => {
              const isSelected = iqSelectedOpt === idx;
              const isCorrect = idx === currentIq.correctIndex;
              let btnStyle = isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200 hover:bg-white/[0.08]'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:bg-black/[0.06]';

              if (iqFeedback) {
                if (isCorrect) {
                  btnStyle = isDark
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                    : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold';
                } else if (isSelected) {
                  btnStyle = isDark
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-rose-50 border-rose-400 text-rose-700';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleIqSelect(idx)}
                  disabled={Boolean(iqFeedback)}
                  className={`p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <span className="font-serif text-base">{opt}</span>
                  {iqFeedback && isCorrect && <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
                  {iqFeedback && isSelected && !isCorrect && <XCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {iqFeedback && (
            <div
              className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
                iqFeedback.isCorrect
                  ? isDark
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : isDark
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {iqFeedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Linguistic Deduction Correct (+4 IQ points)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Linguistic Analysis</span>
                  </>
                )}
              </div>
              <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>{iqFeedback.explanation}</p>
              <button
                onClick={handleNextIq}
                className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 ml-auto transition-colors ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <span>Next Linguistic Puzzle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Arabic Memory */}
      {subTab === 'memory' && currentMem && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border text-center space-y-6 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            <span>Memory Challenge {memIndex + 1} of {ARABIC_MEMORY_CHALLENGES.length}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase border ${
                isDark
                  ? 'bg-white/[0.08] text-white border-white/[0.12]'
                  : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
              }`}
            >
              {currentMem.type.replace('_', ' ')}
            </span>
          </div>

          {memPhase === 'memorize' ? (
            /* Phase 1: Memorization Display */
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <span className={`text-xs uppercase tracking-wider block ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  Study & Commit to Memory:
                </span>
                <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {currentMem.presentationPrompt || currentMem.title}
                </h3>
              </div>

              {/* Items Card */}
              <div className={`flex flex-wrap items-center justify-center gap-3 p-6 rounded-2xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}>
                {(currentMem.items || currentMem.itemsToMemorize || []).map((item, idx) => {
                  const arabicText = typeof item === 'string' ? item : item.arabic;
                  const meaningText =
                    typeof item === 'object' && item && 'meaning' in item
                      ? (item as any).meaning
                      : '';
                  return (
                    <span
                      key={idx}
                      className={`px-5 py-3 rounded-2xl border text-2xl md:text-3xl font-serif shadow-sm flex flex-col items-center ${
                        isDark
                          ? 'bg-[#14161A] border-white/[0.14] text-[#F3F4F6]'
                          : 'bg-white border-black/[0.1] text-[#111214]'
                      }`}
                    >
                      <span>{arabicText}</span>
                      {meaningText && (
                        <span className={`text-[10px] font-sans mt-0.5 font-normal ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {meaningText}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={() => setMemPhase('recall')}
                className={`px-6 py-3 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span>I Have Memorized This (Start Recall Test)</span>
              </button>
            </div>
          ) : (
            /* Phase 2: Recall Question */
            <div className="space-y-6">
              <div className="space-y-2">
                <span className={`text-xs uppercase tracking-wider block ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  Recall Test:
                </span>
                <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {currentMem.questionText || currentMem.question}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {currentMem.options.map((opt, idx) => {
                  const isSelected = memSelectedOpt === idx;
                  const isCorrect = idx === currentMem.correctIndex;
                  let btnStyle = isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200 hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:bg-black/[0.06]';

                  if (memFeedback) {
                    if (isCorrect) {
                      btnStyle = isDark
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold';
                    } else if (isSelected) {
                      btnStyle = isDark
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                        : 'bg-rose-50 border-rose-400 text-rose-700';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMemSelect(idx)}
                      disabled={Boolean(memFeedback)}
                      className={`p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <span className="font-serif text-lg">{opt}</span>
                      {memFeedback && isCorrect && <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
                      {memFeedback && isSelected && !isCorrect && <XCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />}
                    </button>
                  );
                })}
              </div>

              {memFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
                    memFeedback.isCorrect
                      ? isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : isDark
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-rose-300 bg-rose-50 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {memFeedback.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Flawless Memory Recall!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Memory Review</span>
                      </>
                    )}
                  </div>
                  <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>{memFeedback.explanation}</p>
                  <button
                    onClick={handleNextMem}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 ml-auto transition-colors ${
                      isDark
                        ? 'bg-white hover:bg-stone-200 text-[#111214]'
                        : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <span>Next Memory Exercise</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
