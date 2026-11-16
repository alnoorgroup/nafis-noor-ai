import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  HelpCircle,
  RotateCw,
} from 'lucide-react';
import { Subject, Topic, PracticeQuestion, QuizDifficulty } from '../../types/study';
import { recordStudyActivity } from '../../utils/studyStorage';

interface PracticeModeViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const PracticeModeView: React.FC<PracticeModeViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState<QuizDifficulty>('medium');
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streakCount, setStreakCount] = useState(0); // local session accuracy tracking

  const fetchNextQuestion = async (lastWasCorrect?: boolean) => {
    setIsLoading(true);
    setIsAnswered(false);
    setSelectedAnswer('');

    // Dynamically adjust difficulty
    let nextDiff: QuizDifficulty = currentDifficulty;
    if (lastWasCorrect === true) {
      if (currentDifficulty === 'easy') nextDiff = 'medium';
      else if (currentDifficulty === 'medium') nextDiff = 'hard';
      else if (currentDifficulty === 'hard') nextDiff = 'exam';
    } else if (lastWasCorrect === false) {
      if (currentDifficulty === 'exam') nextDiff = 'hard';
      else if (currentDifficulty === 'hard') nextDiff = 'medium';
      else if (currentDifficulty === 'medium') nextDiff = 'easy';
    }
    setCurrentDifficulty(nextDiff);

    try {
      const res = await fetch('/api/study/practice-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          difficulty: nextDiff,
          lastCorrect: lastWasCorrect ?? true,
        }),
      });

      const data = await res.json();
      setCurrentQuestion(data);
    } catch (err) {
      console.error(err);
      setCurrentQuestion({
        id: 'fallback-' + Date.now(),
        subjectId: selectedSubject.id,
        topicId: selectedTopic?.id,
        type: 'multiple_choice',
        difficulty: nextDiff,
        question: `Review: What is a foundational principle of mastering ${selectedSubject.name}?`,
        options: ['Continuous reflection and consistent practice', 'Passive skimming only', 'Rushing without comprehension', 'Omitting spaced repetitions'],
        correctAnswer: 'Continuous reflection and consistent practice',
        explanation: 'Consistent daily practice and thoughtful reflection solidify foundational knowledge.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [selectedSubject.id, selectedTopic?.id]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer.trim()) return;

    const correct =
      selectedAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setStreakCount((prev) => prev + 1);
    } else {
      setStreakCount(0);
    }

    recordStudyActivity(
      'practice',
      `Practiced: ${selectedSubject.name}`,
      `${correct ? 'Correct' : 'Incorrect'} on ${currentDifficulty} level question`,
      selectedSubject.id,
      selectedTopic?.id
    );
    onRefreshData?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
            <Target className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>Adaptive Practice</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            One-by-one questions adapting to your mastery level in {selectedSubject.name}{' '}
            {selectedTopic ? `• ${selectedTopic.name}` : ''}
          </p>
        </div>

        {/* Difficulty indicator badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Current Level:</span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              currentDifficulty === 'easy'
                ? isDark ? 'bg-white/[0.08] text-white border-white/[0.14]' : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
                : currentDifficulty === 'medium'
                ? isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-300'
                : currentDifficulty === 'hard'
                ? isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-300'
                : isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}
          >
            {currentDifficulty}
          </span>
        </div>
      </div>

      {/* Main Practice Container */}
      <div
        className={`max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg transition-colors ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className={`w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto ${
              isDark ? 'border-white' : 'border-[#111214]'
            }`} />
            <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Generating your next adaptive question...
            </p>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-6">
            {/* Question Box */}
            <div className="space-y-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                Target Question
              </span>
              <h3 className={`text-base sm:text-lg font-bold leading-relaxed ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Choices */}
            <div className="space-y-2.5">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setSelectedAnswer(option)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.12] border-white text-white font-semibold'
                            : 'bg-[#111214]/[0.08] border-[#111214] text-[#111214] font-semibold'
                          : isDark
                          ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/35 text-stone-200'
                          : 'bg-[#F3F3F1] border-black/[0.08] hover:border-[#111214]/40 text-[#3F4248]'
                      }`}
                    >
                      <span>{option}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? isDark ? 'border-white bg-white' : 'border-[#111214] bg-[#111214]'
                            : isDark ? 'border-stone-500' : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#111214]' : 'bg-white'}`} />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div>
                  <input
                    type="text"
                    disabled={isAnswered}
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Enter your concise answer..."
                    className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                        : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Submit Answer Button */}
            {!isAnswered ? (
              <button
                type="button"
                disabled={!selectedAnswer.trim()}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm disabled:opacity-40 transition-colors ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
                onClick={handleSubmitAnswer}
              >
                Check Answer
              </button>
            ) : (
              /* Answer Feedback Section */
              <div className={`space-y-4 pt-4 border-t animate-fadeIn ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    isCorrect
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isDark
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className={`w-6 h-6 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <XCircle className={`w-6 h-6 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isCorrect ? 'Correct! Well reasoned.' : 'Not quite. Keep going!'}
                    </h4>
                    {!isCorrect && (
                      <p className="text-xs mt-0.5">
                        Correct answer: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
                  }`}
                >
                  <strong className={`block mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>Step-by-Step Explanation:</strong>
                  {currentQuestion.explanation}
                </div>

                {/* Optional follow-up challenge */}
                {currentQuestion.followUpPrompt && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    isDark
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : 'bg-sky-50 border-sky-300 text-sky-800'
                  }`}>
                    <strong className="block mb-0.5">Deeper Reflection:</strong>
                    {currentQuestion.followUpPrompt}
                  </div>
                )}

                {/* Next Question */}
                <button
                  type="button"
                  onClick={() => fetchNextQuestion(isCorrect)}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Failed to load question.</p>
            <button
              type="button"
              onClick={() => fetchNextQuestion()}
              className={`mt-3 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
