import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Volume2,
  Mic,
  Brain,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { loadArabicProgress } from '../../utils/arabicStorage';
import { ARABIC_LETTERS } from '../../data/arabicCurriculum';

interface ArabicProgressTrackingViewProps {
  isDark: boolean;
  language?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const ArabicProgressTrackingView: React.FC<ArabicProgressTrackingViewProps> = ({
  isDark,
  language,
  onNavigateSection,
}) => {
  const [progress, setProgress] = useState(() => loadArabicProgress());

  const learnedCount = progress.lettersLearned.length;
  const alphabetPercentage = Math.round((learnedCount / 28) * 100);

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
                <TrendingUp className="w-3.5 h-3.5" />
                Empirical Mastery Metrics
              </span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Real Learning Analytics</span>
            </div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Arabic Mastery & Competency Profile
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Accurately tracking your retention across the 28 letters, vocabulary bank, 4 core language competencies, and cognitive metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border text-right ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <span className={`text-[10px] uppercase block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Active Practice Time</span>
              <span className={`text-lg font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {progress.totalLearningMinutes} mins
              </span>
            </div>
          </div>
        </div>

        {/* 4 Competency Bars */}
        <div className={`mt-6 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          {/* Reading */}
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                Reading
              </span>
              <span className={`capitalize font-serif font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{progress.readingLevel}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}>
              <div
                className={`h-full ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
                style={{
                  width:
                    progress.readingLevel === 'advanced'
                      ? '100%'
                      : progress.readingLevel === 'intermediate'
                      ? '70%'
                      : progress.readingLevel === 'elementary'
                      ? '45%'
                      : '20%',
                }}
              />
            </div>
          </div>

          {/* Listening */}
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                <Volume2 className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                Listening
              </span>
              <span className={`capitalize font-serif font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{progress.listeningLevel}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}>
              <div
                className="h-full bg-sky-500"
                style={{
                  width:
                    progress.listeningLevel === 'advanced'
                      ? '100%'
                      : progress.listeningLevel === 'intermediate'
                      ? '70%'
                      : '35%',
                }}
              />
            </div>
          </div>

          {/* Speaking */}
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                <Mic className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                Speaking
              </span>
              <span className={`capitalize font-serif font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{progress.speakingLevel}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}>
              <div
                className="h-full bg-emerald-500"
                style={{
                  width:
                    progress.speakingLevel === 'advanced'
                      ? '100%'
                      : progress.speakingLevel === 'intermediate'
                      ? '70%'
                      : '30%',
                }}
              />
            </div>
          </div>

          {/* Grammar */}
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                Grammar (Naḥw)
              </span>
              <span className={`capitalize font-serif font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{progress.grammarLevel}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}>
              <div
                className={`h-full ${isDark ? 'bg-stone-300' : 'bg-[#3F4248]'}`}
                style={{
                  width:
                    progress.grammarLevel === 'advanced'
                      ? '100%'
                      : progress.grammarLevel === 'intermediate'
                      ? '65%'
                      : '25%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alphabet Map Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Alphabet Mastery (28 Letters)</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {learnedCount} of 28 Letters Mastered ({alphabetPercentage}%)
                </p>
              </div>

              <button
                onClick={() => onNavigateSection?.('alphabet')}
                className={`text-xs font-semibold hover:underline cursor-pointer ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                Open Letter Lab
              </button>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
              {ARABIC_LETTERS.map(l => {
                const isLearned = progress.lettersLearned.includes(l.id);
                const isWeak = progress.weakLetters.includes(l.id);

                return (
                  <div
                    key={l.id}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border text-center transition-all ${
                      isWeak
                        ? isDark
                          ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                          : 'border-rose-300 bg-rose-50 text-rose-700'
                        : isLearned
                        ? isDark
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : isDark
                        ? 'border-white/[0.08] bg-[#1B1D23] text-stone-400'
                        : 'border-black/[0.08] bg-[#F3F3F1] text-[#5A5D63]'
                    }`}
                    title={`${l.name} - ${isLearned ? 'Learned' : isWeak ? 'Needs Practice' : 'Not started'}`}
                  >
                    <span className="text-lg font-serif">{l.letter}</span>
                    <span className="text-[8px]">{l.transliteration}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Examination History */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <Calendar className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>Diagnostic Assessment Record</span>
              </h3>
              <button
                onClick={() => onNavigateSection?.('test')}
                className={`text-xs font-semibold hover:underline cursor-pointer ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                Take Assessment
              </button>
            </div>

            {progress.testsHistory.length === 0 ? (
              <div className={`p-8 text-center text-xs border border-dashed rounded-xl ${
                isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#5A5D63] border-black/[0.1]'
              }`}>
                No formal assessments recorded yet. Take the diagnostic test to benchmark your strengths.
              </div>
            ) : (
              <div className="space-y-3">
                {progress.testsHistory.map(test => (
                  <div
                    key={test.id}
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div>
                      <span className={`font-semibold block ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                        Assessment Date: {test.date}
                      </span>
                      <span className={`capitalize ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        Assessed Level: <strong className={isDark ? 'text-white' : 'text-[#111214]'}>{test.estimatedLevel}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold block font-serif ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {test.totalScore} / {test.maxScore}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                        {Math.round((test.totalScore / test.maxScore) * 100)}% Accuracy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Identified Weaknesses to Target */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <span>Identified Target Weaknesses</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className={`block mb-1 font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Letters Needing Drill:</span>
                {progress.weakLetters.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {progress.weakLetters.map(lId => (
                      <span
                        key={lId}
                        className={`px-2 py-0.5 rounded-md border ${
                          isDark
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {lId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}>All practiced letters solid</span>
                )}
              </div>

              <div className={`border-t pt-3 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={`block mb-1 font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Weak Vocabulary:</span>
                {progress.weakVocabulary.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {progress.weakVocabulary.map(vId => (
                      <span
                        key={vId}
                        className={`px-2 py-0.5 rounded-md border ${
                          isDark
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-sky-50 text-sky-800 border-sky-300'
                        }`}
                      >
                        {vId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}>No weak words flagged</span>
                )}
              </div>

              <div className={`border-t pt-3 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={`block mb-1 font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Cognitive Arabic Index:</span>
                <div
                  className={`flex justify-between items-center p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                  }`}
                >
                  <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>Linguistic IQ</span>
                  <span className={`text-base font-serif font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {progress.arabicIQScore}
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center p-2.5 rounded-xl border mt-2 ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                  }`}
                >
                  <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>Memory Accuracy</span>
                  <span className={`text-base font-serif font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {progress.memoryAccuracy}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
