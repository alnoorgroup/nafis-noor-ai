import React, { useState } from 'react';
import {
  FileQuestion,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ARABIC_DIAGNOSTIC_TEST } from '../../data/arabicCurriculum';
import { ArabicTestResult } from '../../types/arabic';
import { recordArabicTestResult, loadArabicProgress } from '../../utils/arabicStorage';

interface DiagnosticTestViewProps {
  isDark: boolean;
  language?: string;
}

export const DiagnosticTestView: React.FC<DiagnosticTestViewProps> = ({ isDark, language }) => {
  const [testState, setTestState] = useState<'intro' | 'active' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalResult, setFinalResult] = useState<ArabicTestResult | null>(null);

  const questions = ARABIC_DIAGNOSTIC_TEST;
  const currentQ = questions[currentQuestionIndex];

  const handleSelectAnswer = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: optIndex }));

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate real diagnostic results
      finishTest({ ...answers, [currentQ.id]: optIndex });
    }
  };

  const finishTest = (finalAnswers: Record<string, number>) => {
    let totalScore = 0;
    const breakdown: Record<string, { total: number; correct: number }> = {};
    const weaknesses: string[] = [];
    const strengths: string[] = [];

    questions.forEach(q => {
      const userChoice = finalAnswers[q.id];
      const isCorrect = userChoice === q.correctIndex;

      if (!breakdown[q.category]) {
        breakdown[q.category] = { total: 0, correct: 0 };
      }
      breakdown[q.category].total += 1;
      if (isCorrect) {
        breakdown[q.category].correct += 1;
        totalScore += 1;
      } else {
        if (!weaknesses.includes(q.category)) {
          weaknesses.push(`${q.category}: review key concepts`);
        }
      }
    });

    Object.keys(breakdown).forEach(cat => {
      const b = breakdown[cat];
      if (b.correct === b.total) {
        strengths.push(`${cat.toUpperCase()} mastery`);
      }
    });

    const percentage = Math.round((totalScore / questions.length) * 100);
    let level: ArabicTestResult['estimatedLevel'] = 'beginner';
    if (percentage >= 80) level = 'intermediate';
    else if (percentage >= 50) level = 'elementary';

    const plan: string[] = [];
    if (breakdown['alphabet']?.correct < breakdown['alphabet']?.total) {
      plan.push('Spend 10 minutes in the Letter Lab studying Makhārij and non-connecting letters.');
    }
    if (breakdown['vocabulary']?.correct < breakdown['vocabulary']?.total) {
      plan.push('Review the foundational 50 flashcards focusing on triconsonantal roots.');
    }
    if (breakdown['grammar']?.correct < breakdown['grammar']?.total) {
      plan.push('Practice sentence structures in the Live Arabic tutor with real-time corrections.');
    }
    if (plan.length === 0) {
      plan.push('Advance to Level 4 Classical Reading and live Arabic philosophical debates.');
    }

    const testResult: ArabicTestResult = {
      id: `test-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      totalScore,
      maxScore: questions.length,
      estimatedLevel: level,
      sectionBreakdown: breakdown,
      identifiedStrengths: strengths.length ? strengths : ['Diagnostic Baseline Established'],
      identifiedWeaknesses: weaknesses.length ? weaknesses : ['No major defects identified'],
      recommendedPlan: plan,
    };

    recordArabicTestResult(testResult);
    setFinalResult(testResult);
    setTestState('results');
  };

  const handleRetest = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setFinalResult(null);
    setTestState('active');
  };

  return (
    <div className="space-y-6">
      {/* Intro Screen */}
      {testState === 'intro' && (
        <div
          className={`max-w-2xl mx-auto p-8 rounded-3xl border text-center space-y-6 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl border mx-auto flex items-center justify-center ${
            isDark
              ? 'bg-white/[0.08] border-white/[0.14] text-white'
              : 'bg-black/[0.04] border-black/[0.1] text-[#111214]'
          }`}>
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
              Comprehensive Assessment
            </span>
            <h2 className={`text-3xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Arabic Diagnostic Examination
            </h2>
            <p className={`text-sm max-w-lg mx-auto ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Evaluate your Arabic knowledge across Alphabet, Phonetics, Vocabulary, Grammar, and Morphology to identify your true CEFR level and exact weaknesses.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <span className={`text-[10px] uppercase block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Questions</span>
              <span className={`text-base font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {questions.length} Diagnostic Items
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <span className={`text-[10px] uppercase block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Sections</span>
              <span className={`text-base font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                Alphabet, Vocab, Nahw
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <span className={`text-[10px] uppercase block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Duration</span>
              <span className={`text-base font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                ~5 Minutes
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <span className={`text-[10px] uppercase block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Outcome</span>
              <span className={`text-base font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                Personalized Plan
              </span>
            </div>
          </div>

          <button
            onClick={() => setTestState('active')}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <span>Begin Diagnostic Examination</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Examination Screen */}
      {testState === 'active' && currentQ && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border space-y-6 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`flex items-center justify-between text-xs border-b pb-3 ${
            isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#6B6F76] border-black/[0.08]'
          }`}>
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] border ${
              isDark
                ? 'bg-white/[0.08] text-white border-white/[0.12]'
                : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
            }`}>
              Section: {currentQ.category}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {currentQ.question}
            </h3>

            {currentQ.arabicPrompt && (
              <div className={`text-4xl font-serif py-3 text-center ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {currentQ.arabicPrompt}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full p-4 rounded-xl border text-sm text-left font-serif transition-all flex items-center justify-between ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200 hover:border-white/35 hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:border-[#111214]/40 hover:bg-black/[0.06]'
                }`}
              >
                <span>{opt}</span>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                  isDark ? 'border-white/20 text-stone-300' : 'border-black/20 text-[#3F4248]'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Screen */}
      {testState === 'results' && finalResult && (
        <div
          className={`max-w-2xl mx-auto p-8 rounded-3xl border space-y-6 ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 rounded-2xl border mx-auto flex items-center justify-center ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}>
              <Award className="w-8 h-8" />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
              Assessment Complete
            </span>
            <h2 className={`text-3xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Diagnostic Evaluation Report
            </h2>
            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Overall Accuracy:{' '}
              <strong className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {Math.round((finalResult.totalScore / finalResult.maxScore) * 100)}%
              </strong>{' '}
              ({finalResult.totalScore}/{finalResult.maxScore} correct)
            </p>
          </div>

          {/* Level Assessment Badge */}
          <div className={`p-5 rounded-2xl border text-center space-y-1 ${
            isDark ? 'bg-white/[0.06] border-white/[0.14]' : 'bg-[#F3F3F1] border-black/[0.1]'
          }`}>
            <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Assessed Arabic Proficiency
            </span>
            <div className={`text-2xl font-serif font-bold capitalize ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {finalResult.estimatedLevel} Level
            </div>
            <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Your foundational knowledge has been mapped to your personal Arabic curriculum.
            </p>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-3">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Section-by-Section Performance
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(finalResult.sectionBreakdown).map(([sec, stats]) => (
                <div key={sec} className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`capitalize font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{sec}</span>
                    <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>
                      {stats.correct} / {stats.total}
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}>
                    <div
                      className={`h-full ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
                      style={{
                        width: `${Math.round((stats.correct / stats.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Study Plan */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <span>Recommended Study Action Plan</span>
            </h4>
            <ul className={`space-y-2 text-xs ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {finalResult.recommendedPlan.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleRetest}
            className={`w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#1B1D23] hover:bg-white/[0.08] text-stone-200'
                : 'border-black/[0.08] bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retest Assessment to Measure Growth</span>
          </button>
        </div>
      )}
    </div>
  );
};
