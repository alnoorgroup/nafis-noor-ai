import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Trophy,
  ChevronRight,
  Star,
  Columns3,
  Droplets,
  Heart,
  Compass
} from 'lucide-react';
import { Course, Lesson, LessonStep, UserStats, Achievement } from '../types';
import { COURSES, INITIAL_ACHIEVEMENTS } from '../data/learnData';
import { recordUserActivity } from '../utils/streakManager';
import { useBackHandler } from '../utils/historyManager';
import { t, getLanguageCode } from '../utils/i18n';

interface LearnScreenProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  isDark,
  userStats,
  onUpdateStats,
}) => {
  const lang = getLanguageCode(userStats.language);
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [orderItemsState, setOrderItemsState] = useState<{ id: string; text: string; textAr?: string; correctIndex: number }[]>([]);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // Browser Back button navigation hooks
  useBackHandler(Boolean(activeLesson), () => setActiveLesson(null), 'learn-active-lesson');
  useBackHandler(showAchievements, () => setShowAchievements(false), 'learn-achievements');

  // Filter courses
  const filteredCourses = COURSES.filter((c) => {
    if (selectedLevel === 'All') return true;
    return c.level === selectedLevel;
  });

  // Start a lesson
  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentStepIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsCorrectAnswer(null);
    setLessonCompleted(false);

    // Initialize ordering state if first step is ordering
    const firstStep = lesson.steps[0];
    if (firstStep?.type === 'ordering' && firstStep.orderItems) {
      // Shuffle order items
      setOrderItemsState([...firstStep.orderItems].sort(() => Math.random() - 0.5));
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleCheckAnswer = () => {
    if (!activeLesson) return;
    const currentStep = activeLesson.steps[currentStepIndex];

    if (currentStep.type === 'concept') {
      handleNextStep();
      return;
    }

    if (currentStep.type === 'multiple-choice' || currentStep.type === 'match') {
      const selectedOption = currentStep.options?.find(o => o.id === selectedOptionId);
      const isCorrect = !!selectedOption?.isCorrect;
      setIsAnswerSubmitted(true);
      setIsCorrectAnswer(isCorrect);
    } else if (currentStep.type === 'ordering') {
      // Check if current order matches correctIndex 0,1,2...
      const isCorrect = orderItemsState.every((item, idx) => item.correctIndex === idx);
      setIsAnswerSubmitted(true);
      setIsCorrectAnswer(isCorrect);
    }
  };

  const handleMoveOrderItem = (fromIndex: number, toIndex: number) => {
    if (isAnswerSubmitted) return;
    const updated = [...orderItemsState];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setOrderItemsState(updated);
  };

  const handleNextStep = () => {
    if (!activeLesson) return;

    if (currentStepIndex < activeLesson.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsCorrectAnswer(null);

      const nextStep = activeLesson.steps[nextIdx];
      if (nextStep.type === 'ordering' && nextStep.orderItems) {
        setOrderItemsState([...nextStep.orderItems].sort(() => Math.random() - 0.5));
      }
    } else {
      // Completed full lesson!
      setLessonCompleted(true);
      const earnedXP = activeLesson.xp;
      const streakUpdates = recordUserActivity(userStats, 'learning');
      const updatedCompleted = Array.from(new Set([...(userStats.completedLessonIds || []), activeLesson.id]));
      onUpdateStats({
        totalXP: userStats.totalXP + earnedXP,
        lessonsCompleted: updatedCompleted.length,
        completedLessonIds: updatedCompleted,
        ...streakUpdates,
      });

      // Confetti celebration (capped to 24 particles for iOS Safari performance)
      try {
        confetti({
          particleCount: 24,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#f59e0b', '#6366f1'],
        });
      } catch {}
    }
  };

  const currentStep = activeLesson?.steps[currentStepIndex];

  // User Level calculation (e.g. Level 1: Seeker of Knowledge)
  const getUserLevelName = (xp: number) => {
    if (lang === 'ar') {
      if (xp >= 1000) return 'حارس الحكمة (المستوى 5)';
      if (xp >= 500) return 'عالم النور (المستوى 4)';
      if (xp >= 250) return 'طالب الحق (المستوى 3)';
      if (xp >= 100) return 'السالك المخلص (المستوى 2)';
      if (xp === 0) return 'الباحث المبتدئ (المستوى 0)';
      return 'طالب العلم (المستوى 1)';
    }
    if (xp >= 1000) return 'Guardian of Wisdom (Level 5)';
    if (xp >= 500) return 'Scholar of Light (Level 4)';
    if (xp >= 250) return 'Student of Truth (Level 3)';
    if (xp >= 100) return 'Devoted Seeker (Level 2)';
    if (xp === 0) return 'New Seeker (Level 0)';
    return 'Seeker of Knowledge (Level 1)';
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 pb-32 lg:pb-16 space-y-6 animate-fadeIn">
      {/* 1. XP & Level Progress Banner */}
      <div
        id="learn-level-banner"
        className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm font-bold ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className={`flex items-center gap-1.5 text-xs font-cinzel font-semibold ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{getUserLevelName(userStats.totalXP)}</span>
              </div>
              <h2 className={`text-base font-serif-heading font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {userStats.totalXP === 0
                  ? (lang === 'ar' ? 'رحلتك في طلب العلم تبدأ هنا.' : 'Your learning journey starts here.')
                  : `${userStats.totalXP} ${lang === 'ar' ? 'نقطة خبرة' : 'Total XP'}`}
              </h2>
            </div>
          </div>

          {/* Learning Streak Pill */}
          <div className="flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.1] text-white'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <span>
                {userStats.learningStreak === 0
                  ? (lang === 'ar' ? '0 يوم التزام' : '0d Streak')
                  : `${userStats.learningStreak}${lang === 'ar' ? ' يوم التزام' : 'd Streak'}`}
              </span>
            </div>

            <button
              onClick={() => setShowAchievements(true)}
              className={`text-[11px] hover:underline flex items-center gap-0.5 font-medium font-cinzel cursor-pointer ${isDark ? 'text-stone-300 hover:text-white' : 'text-[#3F4248] hover:text-[#111214]'}`}
            >
              <Award className="w-3 h-3" />
              <span>{t(lang, 'achievements')}</span>
            </button>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
          <div
            className={`h-2 rounded-full transition-all duration-200 ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
            style={{ width: `${Math.max(userStats.totalXP > 0 ? 2 : 0, Math.min(100, (userStats.totalXP % 250) / 2.5))}%` }}
          />
        </div>
        <div className={`flex items-center justify-between text-[10px] mt-1.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
          <span>{userStats.lessonsCompleted} {t(lang, 'completed')}</span>
          <span>{lang === 'ar' ? 'المرحلة القادمة: ' : 'Next Milestone: '}{Math.max(50, Math.ceil((userStats.totalXP + 1) / 250) * 250)} {lang === 'ar' ? 'نقطة' : 'XP'}</span>
        </div>
      </div>

      {/* 2. Level Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
          const levelLabel = lang === 'ar'
            ? level === 'All' ? 'الكل' : level === 'Beginner' ? 'مبتدئ' : level === 'Intermediate' ? 'متوسط' : 'متقدم'
            : level === 'All' ? t(lang, 'all') : level;

          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                selectedLevel === level
                  ? isDark
                    ? 'bg-white text-[#111214] border-white shadow-sm font-bold'
                    : 'bg-[#111214] text-white border-[#111214] shadow-sm font-bold'
                  : isDark
                  ? 'bg-[#14161A] border-white/[0.08] text-stone-300 hover:text-white hover:bg-[#1B1D23]'
                  : 'bg-white border-black/[0.08] text-[#5A5D63] hover:text-[#111214] shadow-2xs'
              }`}
            >
              {levelLabel}
            </button>
          );
        })}
      </div>

      {/* 3. Courses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            id={`course-card-${course.id}`}
            className={`rounded-3xl p-5 border transition-all ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-md'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-sm ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.1] text-white'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}
                >
                  {course.id === 'five-pillars' && <Columns3 className="w-5 h-5" />}
                  {course.id === 'wudu-purity' && <Droplets className="w-5 h-5" />}
                  {course.id === 'islamic-manners' && <Heart className="w-5 h-5" />}
                  {course.id === 'quranic-vocabulary' && <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {lang === 'ar' ? (course.arabicTitle || course.title) : course.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      isDark
                        ? 'bg-[#1B1D23] text-stone-200 border-white/[0.1]'
                        : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                    }`}>
                      {lang === 'ar' ? (course.level === 'Beginner' ? 'مبتدئ' : course.level === 'Intermediate' ? 'متوسط' : 'متقدم') : course.level}
                    </span>
                  </div>
                  {lang !== 'ar' && (
                    <div className={`font-arabic text-sm font-medium mt-0.5 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                      {course.arabicTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
              {lang === 'ar' ? (course.descriptionAr || course.description) : course.description}
            </p>

            {/* Lessons in Course */}
            <div className="space-y-2">
              {course.lessons.map((lesson, idx) => {
                const isCompleted = userStats.completedLessonIds?.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    id={`lesson-item-${lesson.id}`}
                    onClick={() => handleStartLesson(lesson)}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] flex items-center justify-between ${
                      isCompleted
                        ? isDark
                          ? 'bg-[#1B1D23] border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                        : isDark
                        ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/[0.22]'
                        : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono border ${
                          isCompleted
                            ? isDark
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                            : isDark
                            ? 'bg-white/[0.08] border-white/[0.12] text-white'
                            : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div>
                        <div className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                          <span>{lang === 'ar' ? (lesson.titleAr || lesson.title) : lesson.title}</span>
                          {isCompleted && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                isDark
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {lang === 'ar' ? 'مكتمل' : 'Completed'}
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                          {lang === 'ar'
                            ? `${lesson.estimatedMinutes} دقائق • ${lesson.steps.length} خطوات تفاعلية`
                            : `${lesson.estimatedMinutes} mins • ${lesson.steps.length} interactive steps`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                          isCompleted
                            ? isDark
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isDark
                            ? 'bg-white/[0.06] text-stone-200 border-white/[0.12]'
                            : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                        }`}
                      >
                        +{lesson.xp} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. ACTIVE LESSON MODAL PLAYER */}
      {activeLesson && currentStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all max-h-[90vh] overflow-y-auto flex flex-col justify-between ${
              isDark
                ? 'bg-[#14161A] border-white/[0.1] shadow-2xl text-[#F3F4F6]'
                : 'bg-white border-black/[0.08] shadow-2xl text-[#111214]'
            }`}
          >
            {lessonCompleted ? (
              /* LESSON COMPLETED CELEBRATION */
              <div className="text-center py-6 space-y-4 animate-scaleUp">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-xl ${
                  isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                }`}>
                  <Award className="w-10 h-10 animate-bounce" />
                </div>

                <div>
                  <h3 className={`text-xl font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {lang === 'ar' ? 'مبارك! تم إكمال الدرس بنجاح' : 'Mubarak! Lesson Completed'}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {lang === 'ar' ? `لقد رسخت علمك في هذا الباب المبارك.` : `You have strengthened your knowledge of ${activeLesson.title}.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3">
                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>{lang === 'ar' ? 'النقاط المكتسبة' : 'XP Earned'}</div>
                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>+{activeLesson.xp} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}</div>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>{lang === 'ar' ? 'استمرار الالتزام' : 'Streak Maintained'}</div>
                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.learningStreak} {lang === 'ar' ? 'أيام' : 'Days'} 🔥</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson(null)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  {lang === 'ar' ? 'الحمد لله، متابعة' : 'Alhamdulillah, Continue'}
                </button>
              </div>
            ) : (
              /* ACTIVE STEP CARD */
              <div className="space-y-4">
                {/* Step Progress & Close */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-cinzel font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {lang === 'ar'
                      ? `المرحلة ${currentStepIndex + 1} من ${activeLesson.steps.length}`
                      : `Step ${currentStepIndex + 1} of ${activeLesson.steps.length}`}
                  </span>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className={`text-xs font-bold cursor-pointer ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#6B6F76] hover:text-[#111214]'}`}
                  >
                    {lang === 'ar' ? '✕ إغلاق' : '✕ Close'}
                  </button>
                </div>

                {/* Progress bar */}
                <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
                  <div
                    className={`h-1.5 rounded-full transition-all duration-200 ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
                    style={{ width: `${((currentStepIndex + 1) / activeLesson.steps.length) * 100}%` }}
                  />
                </div>

                {/* Step Title */}
                <h3 className={`text-base font-serif-heading font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {lang === 'ar' ? (currentStep.titleAr || currentStep.title) : currentStep.title}
                </h3>

                {/* CONCEPT STEP */}
                {currentStep.type === 'concept' && (
                  <div className="space-y-3 my-3">
                    {currentStep.arabicText && (
                      <div
                        className={`p-4 rounded-2xl border text-center ${
                          isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
                        }`}
                      >
                        <div className={`font-arabic text-2xl font-bold leading-loose ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                          {currentStep.arabicText}
                        </div>
                        {currentStep.transliteration && lang !== 'ar' && (
                          <div className={`text-xs italic mt-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                            "{currentStep.transliteration}"
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {lang === 'ar' ? (currentStep.contentAr || currentStep.content) : currentStep.content}
                    </p>
                    <div
                      className={`p-3 rounded-2xl border text-xs italic ${
                        isDark
                          ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                          : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
                      }`}
                    >
                      💡 {lang === 'ar' ? (currentStep.explanationAr || currentStep.explanation) : currentStep.explanation}
                    </div>
                  </div>
                )}

                {/* MULTIPLE CHOICE / MATCH STEP */}
                {(currentStep.type === 'multiple-choice' || currentStep.type === 'match') && (
                  <div className="space-y-3 my-2">
                    <p className={`text-xs font-semibold ${isDark ? 'text-stone-300' : 'text-[#111214]'}`}>
                      {lang === 'ar' ? (currentStep.questionAr || currentStep.question) : currentStep.question}
                    </p>
                    <div className="space-y-2">
                      {currentStep.options?.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        let optionStyle = isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214]';

                        if (isAnswerSubmitted) {
                          if (opt.isCorrect) {
                            optionStyle = isDark
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                              : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold';
                          } else if (isSelected && !opt.isCorrect) {
                            optionStyle = isDark
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-rose-50 border-rose-400 text-rose-700';
                          }
                        } else if (isSelected) {
                          optionStyle = isDark
                            ? 'bg-white/[0.12] border-white/40 text-white font-semibold'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] font-semibold';
                        }

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(opt.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left rtl:text-right text-xs font-medium transition-all cursor-pointer ${optionStyle}`}
                          >
                            {lang === 'ar' ? (opt.textAr || opt.text) : opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ORDERING STEP */}
                {currentStep.type === 'ordering' && (
                  <div className="space-y-3 my-2">
                    <p className={`text-xs font-semibold ${isDark ? 'text-stone-300' : 'text-[#111214]'}`}>
                      {lang === 'ar'
                        ? `${currentStep.questionAr || currentStep.question} (المس الأسهم لإعادة الترتيب)`
                        : `${currentStep.question} (Tap arrows to reorder)`}
                    </p>
                    <div className="space-y-2">
                      {orderItemsState.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                            isAnswerSubmitted
                              ? item.correctIndex === idx
                                ? isDark
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                : isDark
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                : 'bg-rose-50 border-rose-400 text-rose-700'
                              : isDark
                              ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                              : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                                isDark
                                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                                  : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span>{lang === 'ar' ? (item.textAr || item.text) : item.text}</span>
                          </div>

                          {!isAnswerSubmitted && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveOrderItem(idx, idx - 1)}
                                className={`px-2 py-0.5 rounded disabled:opacity-30 text-[10px] cursor-pointer ${
                                  isDark ? 'bg-white/[0.1] text-stone-200' : 'bg-[#F3F3F1] text-[#111214] hover:bg-black/[0.08]'
                                }`}
                              >
                                ▲
                              </button>
                              <button
                                disabled={idx === orderItemsState.length - 1}
                                onClick={() => handleMoveOrderItem(idx, idx + 1)}
                                className={`px-2 py-0.5 rounded disabled:opacity-30 text-[10px] cursor-pointer ${
                                  isDark ? 'bg-white/[0.1] text-stone-200' : 'bg-[#F3F3F1] text-[#111214] hover:bg-black/[0.08]'
                                }`}
                              >
                                ▼
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FEEDBACK BANNER */}
                {isAnswerSubmitted && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs animate-fadeIn ${
                      isCorrectAnswer
                        ? isDark
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : isDark
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-rose-50 border-rose-300 text-rose-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isCorrectAnswer ? (
                        <>
                          <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                          <span>{lang === 'ar' ? 'إجابة صحيحة! بارك الله فيك' : 'Correct! SubhanAllah'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                          <span>{lang === 'ar' ? 'محاولة طيبة، فلنتدبر الصواب' : 'Good effort, keep learning'}</span>
                        </>
                      )}
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {lang === 'ar' ? (currentStep.explanationAr || currentStep.explanation) : currentStep.explanation}
                    </p>
                  </div>
                )}

                {/* BOTTOM BUTTON */}
                <div className="pt-2">
                  {!isAnswerSubmitted && currentStep.type !== 'concept' ? (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={currentStep.type === 'multiple-choice' && !selectedOptionId}
                      className={`w-full py-3.5 rounded-2xl disabled:opacity-40 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer ${
                        isDark
                          ? 'bg-white hover:bg-stone-200 text-[#111214]'
                          : 'bg-[#111214] hover:bg-[#27292D] text-white'
                      }`}
                    >
                      {t(lang, 'checkAnswer')}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextStep}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                        isDark
                          ? 'bg-white hover:bg-stone-200 text-[#111214]'
                          : 'bg-[#111214] hover:bg-[#27292D] text-white'
                      }`}
                    >
                      <span>{t(lang, 'continue')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ACHIEVEMENTS MODAL */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]' : 'bg-white border-black/[0.08] text-[#111214]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {lang === 'ar' ? 'الإنجازات الإيمانية' : 'Spiritual Achievements'}
                </h3>
              </div>
              <button
                onClick={() => setShowAchievements(false)}
                className={`text-xs font-bold cursor-pointer ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#6B6F76] hover:text-[#111214]'}`}
              >
                {lang === 'ar' ? '✕ إغلاق' : '✕'}
              </button>
            </div>

            <div className="space-y-3">
              {INITIAL_ACHIEVEMENTS.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                    ach.unlocked
                      ? isDark
                        ? 'bg-white/[0.08] border-white/25'
                        : 'bg-[#F3F3F1] border-[#111214]/25'
                      : isDark
                      ? 'bg-[#1B1D23]/60 border-white/[0.06] opacity-60'
                      : 'bg-[#FCFCFA] border-black/[0.08] opacity-75'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      ach.unlocked
                        ? isDark
                          ? 'bg-white text-[#111214]'
                          : 'bg-[#111214] text-white'
                        : isDark
                        ? 'bg-white/[0.06] text-stone-500'
                        : 'bg-[#F3F3F1] text-[#6B6F76]'
                    }`}
                  >
                    🏆
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {lang === 'ar' ? (ach.titleAr || ach.title) : ach.title}
                      </h4>
                      {ach.unlocked && (
                        <span className={`text-[10px] font-semibold font-cinzel ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                          {lang === 'ar' ? 'تم الإنجاز' : 'Unlocked'}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {lang === 'ar' ? (ach.descriptionAr || ach.description) : ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
