import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Mic,
  Radio,
  Layers,
  Brain,
  FileQuestion,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { LetterLabView } from './LetterLabView';
import { SpeakingView } from './SpeakingView';
import { LiveArabicView } from './LiveArabicView';
import { ListeningView } from './ListeningView';
import { ReadingView } from './ReadingView';
import { VocabularyFlashcardsView } from './VocabularyFlashcardsView';
import { ArabicIQMemoryView } from './ArabicIQMemoryView';
import { DiagnosticTestView } from './DiagnosticTestView';
import { PersonalAITeacherView } from './PersonalAITeacherView';
import { ArabicProgressTrackingView } from './ArabicProgressTrackingView';
import { ArabicLearningOnboarding } from './ArabicLearningOnboarding';
import { loadArabicProgress } from '../../utils/arabicStorage';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface ArabicLearningViewProps {
  isDark: boolean;
  language?: string;
  onBackToStudyDashboard?: () => void;
}

export type ArabicModuleId =
  | 'overview'
  | 'alphabet'
  | 'speaking'
  | 'live_arabic'
  | 'listening'
  | 'reading'
  | 'vocabulary'
  | 'iq_memory'
  | 'test'
  | 'teacher'
  | 'progress';

interface ModuleCard {
  id: ArabicModuleId;
  title: string;
  arabicTitle: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const ArabicLearningView: React.FC<ArabicLearningViewProps> = ({
  isDark,
  language,
  onBackToStudyDashboard,
}) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [isOnboarded, setIsOnboarded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('nafis_noor_learning_onboarded') === 'true';
  });
  const [reviewOnboarding, setReviewOnboarding] = useState(false);
  const [activeModule, setActiveModule] = useState<ArabicModuleId>('overview');
  const [progress, setProgress] = useState(() => loadArabicProgress());

  const modules: ModuleCard[] = [
    {
      id: 'alphabet',
      title: st.modules.alphabet.title,
      arabicTitle: st.modules.alphabet.arabicTitle,
      description: st.modules.alphabet.description,
      badge: st.modules.alphabet.badge,
      icon: Layers,
      accentColor: '#111214',
    },
    {
      id: 'speaking',
      title: st.modules.speaking.title,
      arabicTitle: st.modules.speaking.arabicTitle,
      description: st.modules.speaking.description,
      badge: st.modules.speaking.badge,
      icon: Mic,
      accentColor: '#34D399',
    },
    {
      id: 'live_arabic',
      title: st.modules.live_arabic.title,
      arabicTitle: st.modules.live_arabic.arabicTitle,
      description: st.modules.live_arabic.description,
      badge: st.modules.live_arabic.badge,
      icon: Radio,
      accentColor: '#60A5FA',
    },
    {
      id: 'listening',
      title: st.modules.listening.title,
      arabicTitle: st.modules.listening.arabicTitle,
      description: st.modules.listening.description,
      badge: st.modules.listening.badge,
      icon: Volume2,
      accentColor: '#818CF8',
    },
    {
      id: 'reading',
      title: st.modules.reading.title,
      arabicTitle: st.modules.reading.arabicTitle,
      description: st.modules.reading.description,
      badge: st.modules.reading.badge,
      icon: BookOpen,
      accentColor: '#0EA5E9',
    },
    {
      id: 'vocabulary',
      title: st.modules.vocabulary.title,
      arabicTitle: st.modules.vocabulary.arabicTitle,
      description: st.modules.vocabulary.description,
      badge: st.modules.vocabulary.badge,
      icon: Layers,
      accentColor: '#A78BFA',
    },
    {
      id: 'iq_memory',
      title: st.modules.iq_memory.title,
      arabicTitle: st.modules.iq_memory.arabicTitle,
      description: st.modules.iq_memory.description,
      badge: st.modules.iq_memory.badge,
      icon: Brain,
      accentColor: '#38BDF8',
    },
    {
      id: 'test',
      title: st.modules.test.title,
      arabicTitle: st.modules.test.arabicTitle,
      description: st.modules.test.description,
      badge: st.modules.test.badge,
      icon: FileQuestion,
      accentColor: '#10B981',
    },
    {
      id: 'teacher',
      title: st.modules.teacher.title,
      arabicTitle: st.modules.teacher.arabicTitle,
      description: st.modules.teacher.description,
      badge: st.modules.teacher.badge,
      icon: GraduationCap,
      accentColor: '#111214',
    },
    {
      id: 'progress',
      title: st.modules.progress.title,
      arabicTitle: st.modules.progress.arabicTitle,
      description: st.modules.progress.description,
      badge: st.modules.progress.badge,
      icon: TrendingUp,
      accentColor: '#38BDF8',
    },
  ];

  const localizedReadingLevel =
    progress.readingLevel === 'beginner'
      ? st.levelBeginner
      : progress.readingLevel === 'elementary'
      ? st.levelElementary
      : progress.readingLevel === 'intermediate'
      ? st.levelIntermediate
      : st.levelAdvanced;

  // Show the Lifetime Free Reveal -> Terms -> Pre-Release Notice flow on first visit or when reviewing
  if (!isOnboarded || reviewOnboarding) {
    return (
      <div className="space-y-4">
        {reviewOnboarding && (
          <div className="flex justify-end max-w-4xl mx-auto px-4">
            <button
              onClick={() => setReviewOnboarding(false)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ← {st.backToAcademy}
            </button>
          </div>
        )}
        <ArabicLearningOnboarding
          isDark={isDark}
          language={activeLang}
          initialStage={reviewOnboarding ? 'terms' : 'intro'}
          onComplete={() => {
            setIsOnboarded(true);
            setReviewOnboarding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar for Arabic Modules */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 overflow-x-auto scrollbar-none transition-all ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="flex items-center gap-2">
          {activeModule !== 'overview' && (
            <button
              onClick={() => setActiveModule('overview')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all mr-1 ${
                isDark
                  ? 'border-white/10 bg-white/[0.06] text-stone-300 hover:bg-white/10'
                  : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.08]'
              }`}
              title="Return to Arabic Curriculum Hub"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{st.hub}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-white' : 'bg-[#111214]'}`} />
            <span className={`text-xs font-bold font-serif whitespace-nowrap ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {st.academyTitle}
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
              {st.lifetimeFree}
            </span>
          </div>
        </div>

        {/* Quick Module Switcher Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveModule('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'overview'
                ? isDark
                  ? 'bg-white text-[#111214] shadow-xs'
                  : 'bg-[#111214] text-white shadow-xs'
                : isDark
                ? 'text-stone-400 hover:text-white'
                : 'text-[#5A5D63] hover:text-[#111214]'
            }`}
          >
            {st.curriculum}
          </button>
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeModule === m.id
                  ? isDark
                    ? 'bg-white text-[#111214] shadow-xs'
                    : 'bg-[#111214] text-white shadow-xs'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              {m.title}
            </button>
          ))}

          {/* Discreet Terms & Pre-Release Notice Link */}
          <button
            onClick={() => setReviewOnboarding(true)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1 cursor-pointer ${
              isDark
                ? 'border-white/10 bg-white/[0.06] text-stone-300 hover:text-white hover:bg-white/10'
                : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:text-[#111214] hover:bg-black/[0.08]'
            }`}
            title="Review Lifetime Free Reveal, Terms & Pre-Release Notice"
          >
            <ShieldCheck className={`w-3 h-3 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} />
            <span>{st.termsAndNotice}</span>
          </button>
        </div>
      </div>

      {/* View Router */}
      {activeModule === 'overview' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div
            className={`p-8 rounded-3xl border relative overflow-hidden ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 text-xs font-semibold tracking-wider uppercase rounded-full border ${
                    isDark
                      ? 'bg-white/[0.08] text-white border-white/15'
                      : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                  }`}
                >
                  {st.heroBadge}
                </span>
                <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{st.heroSubBadge}</span>
              </div>

              <h1 className={`text-3xl md:text-4xl font-bold font-serif tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {st.heroTitle}
              </h1>

              <p className={`text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {st.heroDesc}
              </p>

              {/* Real Performance Snapshot */}
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>
                    {st.lettersMastered}: <strong className={isDark ? 'text-white' : 'text-[#111214]'}>{progress.lettersLearned.length}/28</strong>
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  <Brain className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span>
                    {st.arabicIq}: <strong className={isDark ? 'text-white' : 'text-[#111214]'}>{progress.arabicIQScore}</strong>
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  <GraduationCap className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#111214]'}`} />
                  <span>
                    {st.readingLevel}: <strong className={`capitalize ${isDark ? 'text-white' : 'text-[#111214]'}`}>{localizedReadingLevel}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 10 Specialized Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map(m => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`p-6 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08] hover:border-white/25 hover:bg-[#1B1D23]'
                      : 'bg-white border-black/[0.08] hover:border-black/25 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isDark ? 'bg-white/[0.06] text-white' : 'bg-[#F3F3F1] text-[#111214]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isDark
                            ? 'bg-white/[0.06] text-stone-300 border-white/[0.08]'
                            : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className={`text-base font-bold transition-colors ${isDark ? 'text-[#F3F4F6] group-hover:text-white' : 'text-[#111214]'}`}>
                          {m.title}
                        </h3>
                        <span className={`text-xs font-serif ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {m.arabicTitle}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${isDark ? 'border-white/[0.08] text-white' : 'border-black/[0.08] text-[#111214]'}`}>
                    <span>{st.enterModule}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specialized Module Views */}
      {activeModule === 'alphabet' && (
        <LetterLabView
          isDark={isDark}
          language={activeLang}
          onLetterLearned={() => setProgress(loadArabicProgress())}
        />
      )}

      {activeModule === 'speaking' && <SpeakingView isDark={isDark} language={activeLang} />}

      {activeModule === 'live_arabic' && <LiveArabicView isDark={isDark} language={activeLang} />}

      {activeModule === 'listening' && <ListeningView isDark={isDark} language={activeLang} />}

      {activeModule === 'reading' && <ReadingView isDark={isDark} language={activeLang} />}

      {activeModule === 'vocabulary' && <VocabularyFlashcardsView isDark={isDark} language={activeLang} />}

      {activeModule === 'iq_memory' && <ArabicIQMemoryView isDark={isDark} language={activeLang} />}

      {activeModule === 'test' && <DiagnosticTestView isDark={isDark} language={activeLang} />}

      {activeModule === 'teacher' && <PersonalAITeacherView isDark={isDark} language={activeLang} />}

      {activeModule === 'progress' && (
        <ArabicProgressTrackingView
          isDark={isDark}
          language={activeLang}
          onNavigateSection={sec => setActiveModule(sec as any)}
        />
      )}
    </div>
  );
};
