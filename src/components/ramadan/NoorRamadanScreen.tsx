import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  CheckCircle2,
  Heart,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Flame,
  BookOpen,
  Share2,
  RotateCcw,
  Compass,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Sliders,
  Check,
  Edit3,
  Bot,
  Layers,
  Award,
  Lock,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  RamadanUserData,
  RamadanActivity,
  RamadanGoalCategory,
} from '../../types/ramadan';
import {
  SUGGESTED_RAMADAN_GOALS,
  generateAlNoorPlan,
  getInspirationPulseForDay,
  getMotivationForCategory,
} from '../../utils/ramadanContent';
import {
  getRamadanUserData,
  saveRamadanUserData,
  recordDailyCheckIn,
  savePlanActivities,
} from '../../utils/ramadanDb';
import { detectRamadanStatus, HijriDateInfo } from '../../utils/hijriCalendar';
import { DailyInspirationPulseModal } from './DailyInspirationPulseModal';
import { NoorRamadanUpdatesModal } from './NoorRamadanUpdatesModal';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface NoorRamadanScreenProps {
  isDark?: boolean;
  language?: string;
  userLocation?: string;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
  onNavigate?: (tab: string) => void;
}

export const NoorRamadanScreen: React.FC<NoorRamadanScreenProps> = ({
  isDark = true,
  language = 'English',
  userLocation = 'Makkah',
  onOpenNoorAIWithPrompt,
  onNavigate,
}) => {
  const lang = getLanguageCode(language);
  const isArabic = lang === 'ar';
  const isRTL = isRTLLanguage(lang);

  // Main user data state from IndexedDB
  const [userData, setUserData] = useState<RamadanUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Real-time Date and Hijri Status
  const [hijriStatus, setHijriStatus] = useState<HijriDateInfo | null>(null);
  const [isDateChecking, setIsDateChecking] = useState<boolean>(true);
  const [isRamadanSimulated, setIsRamadanSimulated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('noor_simulate_ramadan') === 'true';
  });

  // Updates Modal state
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState<boolean>(false);

  // Active view: 'dashboard' | 'onboarding' | 'plan_builder'
  const [viewMode, setViewMode] = useState<'dashboard' | 'onboarding' | 'plan_builder'>('dashboard');

  // Onboarding draft state
  const [selectedGoalChipId, setSelectedGoalChipId] = useState<string>('fast_30');
  const [customGoalText, setCustomGoalText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RamadanGoalCategory>('fasting');

  // Plan builder draft activities
  const [draftActivities, setDraftActivities] = useState<RamadanActivity[]>([]);
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [newActivityTime, setNewActivityTime] = useState<string>('05:30');
  const [newActivityDuration, setNewActivityDuration] = useState<number>(30);
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false);

  // Daily Check-in state
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayFeedback, setTodayFeedback] = useState<string | null>(null);

  // Daily Inspiration Pulse Modal state
  const [isPulseModalOpen, setIsPulseModalOpen] = useState<boolean>(false);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(1);

  // Interactive Day Lock Notice Toast
  const [dayNotice, setDayNotice] = useState<{
    day: number;
    message: string;
    type: 'tomorrow' | 'later' | 'today' | 'past';
  } | null>(null);

  // Auto-clear day lock notice after 4 seconds
  useEffect(() => {
    if (!dayNotice) return;
    const timer = setTimeout(() => {
      setDayNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [dayNotice]);

  // NOOR AI Motivation Advice State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isGeneratingAiAdvice, setIsGeneratingAiAdvice] = useState<boolean>(false);

  // 1. Check live date & time and verify if currently in Ramadan
  useEffect(() => {
    let isMounted = true;
    setIsDateChecking(true);
    detectRamadanStatus().then((status) => {
      if (isMounted) {
        setHijriStatus(status);
        if (status.isRamadan) {
          const boundedDay = Math.max(1, Math.min(30, status.day || 1));
          setCurrentDayIndex(boundedDay);
        }
        setIsDateChecking(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isRamadanSimulated]);

  // 2. Load user data on mount from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getRamadanUserData();
        if (!isMounted) return;
        if (data) {
          setUserData(data);
          setDraftActivities(data.planActivities);
          setViewMode('dashboard');

          // Check if today already answered
          const todayLog = data.dailyLog.find((l) => l.date === todayStr);
          if (todayLog) {
            setTodayFeedback(
              todayLog.status === 'yes'
                ? 'Alhamdulillah! May Allah accept every step of your effort today.'
                : 'Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.'
            );
          }
        } else {
          // If first visit, open onboarding
          setViewMode('onboarding');
        }
      } catch (err) {
        console.warn('Error loading Ramadan data:', err);
        setViewMode('onboarding');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  // Compute current day of Ramadan (1 to 30) based on Hijri status or startDate
  useEffect(() => {
    if (hijriStatus?.isRamadan && hijriStatus.day) {
      setCurrentDayIndex(Math.max(1, Math.min(30, hijriStatus.day)));
    } else if (userData?.startDate) {
      const start = new Date(userData.startDate).getTime();
      const current = new Date(todayStr).getTime();
      const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1;
      const boundedDay = Math.max(1, Math.min(30, diffDays));
      setCurrentDayIndex(boundedDay);
    } else {
      setCurrentDayIndex(1);
    }
  }, [hijriStatus, userData?.startDate, todayStr]);

  // =========================================================================
  // ONBOARDING: Set My Dream
  // =========================================================================
  const handleConfirmDream = async () => {
    const chip = SUGGESTED_RAMADAN_GOALS.find((g) => g.id === selectedGoalChipId);
    const finalGoalText = customGoalText.trim() || chip?.label || 'Fast all 30 days and draw nearer to Allah';
    const finalCategory = chip?.category || selectedCategory;

    const startDate = todayStr;
    const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Seed default recommended Al-Noor Plan
    const defaultActivities = generateAlNoorPlan('05:00', '18:00', '19:30');

    const newProfile: RamadanUserData = {
      dreamId: 'current_ramadan_user',
      goalText: finalGoalText,
      goalCategory: finalCategory,
      startDate,
      endDate,
      dailyLog: [],
      planActivities: defaultActivities,
      inspirationPulse: [],
      isCustomPlan: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveRamadanUserData(newProfile);
    setUserData(saved);
    setDraftActivities(defaultActivities);
    setViewMode('dashboard');
  };

  // =========================================================================
  // PLAN BUILDER: Custom & Al-Noor
  // =========================================================================
  const handleApplyAlNoorPlan = () => {
    const alnoor = generateAlNoorPlan('05:00', '18:00', '19:30');
    setDraftActivities(alnoor);
  };

  const handleToggleActivity = (id: string) => {
    setDraftActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, isActive: !act.isActive } : act))
    );
  };

  const handleDeleteActivity = (id: string) => {
    setDraftActivities((prev) => prev.filter((act) => act.id !== id));
  };

  const handleAddNewActivity = () => {
    if (!newActivityName.trim()) return;
    const newAct: RamadanActivity = {
      id: `custom_${Date.now()}`,
      activityName: newActivityName.trim(),
      scheduledTime: newActivityTime,
      duration: newActivityDuration > 0 ? newActivityDuration : undefined,
      isActive: true,
      category: 'custom',
    };
    setDraftActivities((prev) => [...prev, newAct]);
    setNewActivityName('');
    setIsAddingActivity(false);
  };

  const handleSavePlan = async () => {
    if (!userData) return;
    const updated = await savePlanActivities(draftActivities);
    setUserData(updated);
    setViewMode('dashboard');
  };

  // =========================================================================
  // DAILY CHECK-IN: Yes I did / Not today (Strictly for Today)
  // =========================================================================
  const handleDailyCheckIn = async (status: 'yes' | 'no') => {
    const note = status === 'yes' ? 'Dedicated effort toward Ramadan dream' : 'Intention renewed with patience';
    const updated = await recordDailyCheckIn(todayStr, status, note);
    setUserData(updated);

    if (status === 'yes') {
      setTodayFeedback('Alhamdulillah! May Allah accept every step of your effort today.');
    } else {
      setTodayFeedback('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
    }
  };

  // Ask NOOR AI for tailored motivation
  const handleAskNoorAIForMotivation = () => {
    const goal = userData?.goalText || 'spiritual growth in Ramadan';
    const category = userData?.goalCategory || 'fasting';
    const prompt = `I am pursuing my Ramadan dream: "${goal}" (${category}). Could you share an uplifting, heart-nourishing Islamic reminder with a relevant Quranic verse and practical advice for me today?`;
    if (onOpenNoorAIWithPrompt) {
      onOpenNoorAIWithPrompt(prompt);
    }
  };

  // Compute 30-day stats
  const dailyLogs = userData?.dailyLog || [];
  const daysAchieved = dailyLogs.filter((l) => l.status === 'yes').length;
  const percentageComplete = Math.min(100, Math.round((daysAchieved / 30) * 100));

  const motivationItem = getMotivationForCategory(userData?.goalCategory || 'fasting');
  const inspirationPulseItem = getInspirationPulseForDay(currentDayIndex);

  const isRamadanActive = Boolean(hijriStatus?.isRamadan || isRamadanSimulated);

  return (
    <div className="min-h-screen pt-4 sm:pt-6 pb-32 sm:pb-36 lg:pb-16 px-3.5 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-1 flex-wrap">
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate('profile');
            else window.history.back();
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all group cursor-pointer ${
            isDark
              ? 'border-white/[0.1] bg-[#14161A] hover:bg-white/[0.08] text-white'
              : 'border-black/[0.08] bg-white hover:bg-[#F3F3F1] text-[#111214]'
          }`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Settings</span>
          <span className={isDark ? 'text-stone-500' : 'text-[#6B6F76]'}>•</span>
          <span>Ramadan Events</span>
        </button>

        <div className="flex items-center gap-2">
          {/* See Updates Button in Header */}
          <button
            type="button"
            id="ramadan-screen-see-updates-btn"
            onClick={() => setIsUpdatesModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#14161A] hover:bg-white/[0.08] border-white/[0.1] text-white'
                : 'bg-white hover:bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>See Updates</span>
          </button>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isDark
              ? 'bg-white/[0.06] border-white/[0.1] text-white'
              : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
          }`}>
            <Moon className="w-3.5 h-3.5 fill-current" />
            <span>Ramaḍān 1447 AH</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATE VERIFICATION LOCK SCREEN (Shown when outside Ramadan)                 */}
      {/* ========================================================================= */}
      {!isRamadanActive ? (
        <div className={`rounded-[36px] border p-6 sm:p-12 relative overflow-hidden animate-fadeIn text-center space-y-6 ${
          isDark
            ? 'border-white/[0.08] bg-[#14161A] shadow-[0_2px_10px_rgba(0,0,0,0.25)] text-[#F3F4F6]'
            : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-[#111214]'
        }`}>
          <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto ${
            isDark
              ? 'bg-white/[0.06] border-white/[0.1] text-white'
              : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
          }`}>
            <Lock className={`w-8 h-8 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className={`text-xs font-mono uppercase tracking-widest font-bold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'التزام دقيق بالتقويم الهجري الشرعي' : 'Strict Islamic Calendar Enforcement'}
            </span>
            <h1 className={`text-2xl sm:text-3xl font-serif-heading font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? 'فعاليات رمضان تعمل فقط في أيام شهر رمضان' : 'Ramadan Events Work Only in Ramadan Date'}
            </h1>
            <p className={`text-lg font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
              شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ
            </p>
            <p className={`text-xs sm:text-sm font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {isArabic
                ? 'فعاليات نور الرمضانية مخصصة حصرياً لأيام الشهر الفضيل المبارك (الشهر التاسع). والفحص الزمني المباشر يؤكد أن هلال رمضان لم يحل بعد.'
                : 'Noor Ramadan Events are strictly scheduled for the sacred month of Ramadan (Month 9). The live date and time check verifies that Ramadan has not yet arrived.'}
            </p>
          </div>

          {/* Real-time date & time verification card */}
          <div className={`p-4 sm:p-5 rounded-2xl border max-w-md mx-auto space-y-3 ${isRTL ? 'text-right' : 'text-left'} ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
          }`}>
            <div className={`flex items-center justify-between text-xs border-b pb-2 ${isDark ? 'border-white/10' : 'border-black/[0.08]'}`}>
              <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>{isArabic ? 'فحص التاريخ والوقت المباشر:' : 'Live Date & Time Check:'}</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <Clock className="w-3.5 h-3.5" />
                {hijriStatus?.liveTimeString || new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>{isArabic ? 'الميلادي:' : 'Gregorian:'}</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{hijriStatus?.liveDateString || new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>{isArabic ? 'التقويم الهجري:' : 'Hijri Calendar:'}</span>
              <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {hijriStatus ? `${hijriStatus.day} ${hijriStatus.monthNameEn} ${hijriStatus.year} AH` : 'Calculating...'}
                {hijriStatus && ` (${isArabic ? `الشهر ${hijriStatus.monthNumber} من 12` : `Month ${hijriStatus.monthNumber} of 12`})`}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border text-[11px] ${
              isDark ? 'bg-sky-500/10 border-sky-500/25 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}>
              {isArabic
                ? '🔒 مؤمن: ستفتح هذه الفعاليات المباركة تلقائياً مع أول أيام شهر رمضان 1447هـ بإذن الله تعالى.'
                : '🔒 Locked: This module will automatically unlock on the 1st of Ramadan 1447, Insha\'Allah.'}
            </div>
          </div>

          {/* Action buttons: See Updates & Back to Settings */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
            <button
              type="button"
              onClick={() => setIsUpdatesModalOpen(true)}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs tracking-wide shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{isArabic ? 'عرض التحديثات' : 'See Updates'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('profile');
                else window.history.back();
              }}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl border font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-stone-300'
                  : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#111214]'
              }`}
            >
              <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{isArabic ? 'العودة إلى الإعدادات' : 'Back to Settings'}</span>
            </button>
          </div>

          {/* Discrete testing toggle */}
          <div className={`pt-4 text-[10px] flex items-center justify-center gap-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            <span>Testing/Review Mode:</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isRamadanSimulated;
                setIsRamadanSimulated(nextVal);
                localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
                detectRamadanStatus().then((s) => setHijriStatus(s));
              }}
              className={`hover:underline cursor-pointer font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}
            >
              {isRamadanSimulated ? 'Disable Preview Simulation' : 'Enable Preview Simulation for Testing'}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* RAMADAN ACTIVE VIEW (Unlocked strictly during Ramadan)                     */
        /* ========================================================================= */
        <>
          {/* ========================================================================= */}
          {/* 1. ONBOARDING SCREEN (Set Your Ramadan Dream)                             */}
          {/* ========================================================================= */}
          {viewMode === 'onboarding' ? (
            <div className={`rounded-[36px] border p-6 sm:p-10 relative overflow-hidden animate-fadeIn ${
              isDark
                ? 'border-white/[0.08] bg-[#14161A] shadow-[0_2px_10px_rgba(0,0,0,0.25)] text-[#F3F4F6]'
                : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-[#111214]'
            }`}>
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                {/* Crescent & Lantern Icon */}
                <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto ${
                  isDark
                    ? 'bg-white/[0.06] border-white/[0.1] text-white'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                }`}>
                  <Moon className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className={`text-xs font-mono uppercase tracking-widest font-bold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Noor Ramadan 1447 AH Sanctuary
                  </span>
                  <h1 className={`text-3xl sm:text-4xl font-serif-heading font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    What is your dream for this Ramadan?
                  </h1>
                  <p className={`text-xl font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                    ما هو حلمك وغايتك الإيمانية في هذا الشهر الفضيل؟
                  </p>
                  <p className={`text-xs sm:text-sm font-light max-w-lg mx-auto leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                    Ramadan is the golden season of transformation. Choose one sacred aspiration to dedicate your heart, schedule, and prayers toward.
                  </p>
                </div>

                {/* Suggested Goals Chips Grid */}
                <div className="space-y-3 pt-2 text-left">
                  <label className={`text-[11px] font-mono uppercase tracking-wider block text-center ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Select a recommended spiritual dream:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_RAMADAN_GOALS.map((goal) => {
                      const isSelected = selectedGoalChipId === goal.id && !customGoalText;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => {
                            setSelectedGoalChipId(goal.id);
                            setSelectedCategory(goal.category);
                            setCustomGoalText('');
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 card-hover-lift btn-press-bounce ${
                            isSelected
                              ? isDark
                                ? 'bg-white/[0.1] border-white/40 text-white'
                                : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214]'
                              : isDark
                              ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20 text-stone-300'
                              : 'bg-white border-black/[0.08] hover:border-black/20 text-[#3F4248]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                              isSelected
                                ? isDark ? 'bg-white border-white text-[#111214]' : 'bg-[#111214] border-[#111214] text-white'
                                : isDark ? 'border-stone-500' : 'border-stone-400'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                              <span>{goal.label}</span>
                            </div>
                            <p className={`text-[11px] font-light mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                              {goal.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Goal Input */}
                <div className="pt-2 text-left space-y-1.5">
                  <label className={`text-[11px] font-mono uppercase tracking-wider block ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Or write your custom personal dream:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customGoalText}
                      onChange={(e) => {
                        setCustomGoalText(e.target.value);
                        if (e.target.value) {
                          setSelectedGoalChipId('');
                        }
                      }}
                      placeholder="e.g., Read Surah Al-Baqarah weekly and maintain tahajjud..."
                      className={`w-full py-3 px-4 rounded-2xl border text-xs focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/30 text-white placeholder-stone-500'
                          : 'bg-white border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder-[#6B6F76]'
                      }`}
                    />
                    {customGoalText && (
                      <button
                        type="button"
                        onClick={() => setCustomGoalText('')}
                        className={`absolute right-3 top-3 ${isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmation Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleConfirmDream}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <span>Set My Dream & Build Daily Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'plan_builder' ? (
            /* ========================================================================= */
            /* 2. PLAN BUILDER VIEW (Custom & Al-Noor Plan)                               */
            /* ========================================================================= */
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                  <div>
                    <span className={`text-xs font-mono uppercase tracking-widest font-bold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      Personal Daily Routine
                    </span>
                    <h2 className={`text-xl sm:text-2xl font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      Build Your Daily Ramadan Plan
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      Targeting your dream: <strong className={isDark ? 'text-white' : 'text-[#111214]'}>"{userData?.goalText}"</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyAlNoorPlan}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white'
                          : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#111214]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Al-Noor Plan</span>
                    </button>
                  </div>
                </div>

                {/* Pre-built Al-Noor Plan Info Callout */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-white/[0.08] text-white' : 'bg-white text-[#111214]'
                  }`}>
                    <Info className="w-4 h-4" />
                  </div>
                  <div className={`text-xs space-y-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>The Al-Noor Recommended Routine:</p>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      Combines authentic Sunnah practices: Suhoor 1 hr before Fajr, post-Fajr Quran session, Morning & Afternoon Adhkar, Maghrib Adhkar & Sunset Iftar, Taraweeh after Isha, and Tahajjud in the last third of the night. You may customize any activity or time below.
                    </p>
                  </div>
                </div>

                {/* Activities List */}
                <div className="space-y-2.5">
                  <div className={`flex items-center justify-between text-xs font-mono px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    <span>Scheduled Daily Routines ({draftActivities.length})</span>
                    <span>Toggle to Enable/Disable</span>
                  </div>

                  <div className="space-y-2">
                    {draftActivities.map((act) => (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          act.isActive
                            ? isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08]'
                            : isDark ? 'bg-black/20 border-white/[0.05] opacity-50' : 'bg-[#F3F3F1] border-black/[0.06] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActivity(act.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                              act.isActive
                                ? isDark ? 'bg-white border-white text-[#111214]' : 'bg-[#111214] border-[#111214] text-white'
                                : isDark ? 'border-stone-600' : 'border-stone-400'
                            }`}
                          >
                            {act.isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                              {act.activityName}
                            </span>
                            <span className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                              {act.duration ? `${act.duration} minutes` : 'Fixed prayer/session'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                            isDark
                              ? 'bg-[#14161A] border-white/10 text-white'
                              : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{act.scheduledTime}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className={`p-1.5 transition-colors cursor-pointer ${isDark ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}
                            title="Delete activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Activity Form */}
                {isAddingActivity ? (
                  <div className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
                  }`}>
                    <div className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                      <span>Add Custom Routine</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Activity name (e.g., Memorize Surah Mulk)"
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        className={`py-2 px-3 rounded-xl border text-xs focus:outline-none ${
                          isDark ? 'bg-[#14161A] border-white/10 focus:border-white/30 text-white placeholder-stone-500' : 'bg-white border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder-[#6B6F76]'
                        }`}
                      />
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Time:</span>
                        <input
                          type="time"
                          value={newActivityTime}
                          onChange={(e) => setNewActivityTime(e.target.value)}
                          className={`py-2 px-3 rounded-xl border text-xs focus:outline-none w-full ${
                            isDark ? 'bg-[#14161A] border-white/10 focus:border-white/30 text-white' : 'bg-white border-black/[0.1] focus:border-[#111214]/40 text-[#111214]'
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Min:</span>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={newActivityDuration}
                          onChange={(e) => setNewActivityDuration(Number(e.target.value))}
                          className={`py-2 px-3 rounded-xl border text-xs focus:outline-none w-full ${
                            isDark ? 'bg-[#14161A] border-white/10 focus:border-white/30 text-white' : 'bg-white border-black/[0.1] focus:border-[#111214]/40 text-[#111214]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingActivity(false)}
                        className={`px-3 py-1.5 rounded-xl text-xs ${isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewActivity}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                        }`}
                      >
                        Add Routine
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingActivity(true)}
                    className={`w-full py-2.5 rounded-2xl border border-dashed text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isDark
                        ? 'border-white/20 hover:border-white/40 text-stone-300 hover:text-white'
                        : 'border-black/20 hover:border-black/40 text-[#3F4248] hover:text-[#111214]'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Custom Activity</span>
                  </button>
                )}

                {/* Plan Save Actions */}
                <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/[0.08]'}`}>
                  <button
                    type="button"
                    onClick={() => setViewMode('dashboard')}
                    className={`px-4 py-2.5 rounded-xl text-xs ${isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
                      isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    Save & Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. RAMADAN DASHBOARD VIEW                                                 */
            /* ========================================================================= */
            <div className="space-y-6 animate-fadeIn">
              {/* Dream Banner Card */}
              <div className={`rounded-[32px] p-6 sm:p-8 border relative overflow-hidden ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        isDark
                          ? 'bg-white/[0.08] text-white border-white/15'
                          : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                      }`}>
                        <Moon className="w-3 h-3 fill-current" />
                        <span>Day {currentDayIndex} of 30</span>
                      </span>
                      <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {percentageComplete}% Goal Completed
                      </span>
                    </div>

                    <h2 className={`text-xl sm:text-2xl font-serif-heading font-bold leading-snug ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      "{userData?.goalText}"
                    </h2>

                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      Category: <span className={`capitalize font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userData?.goalCategory}</span> • Saved locally in IndexedDB
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('plan_builder')}
                      className={`py-2.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-stone-200'
                          : 'bg-white hover:bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
                      }`}
                    >
                      <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                      <span>Adjust Daily Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPulseModalOpen(true)}
                      className={`py-2.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                        isDark
                          ? 'bg-white hover:bg-stone-200 border-white text-[#111214]'
                          : 'bg-[#111214] hover:bg-[#27292D] border-[#111214] text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Today's Inspiration Pulse</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('onboarding')}
                      className={`py-2 px-3 text-[11px] font-mono underline text-center cursor-pointer ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#5A5D63] hover:text-[#111214]'}`}
                    >
                      Change My Dream
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Dream Check-In Interactive Section (Day currentDayIndex) */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono uppercase tracking-widest font-bold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                        Daily Dream Accountability
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                        isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}>
                        Day {currentDayIndex} of 30 (Today)
                      </span>
                    </div>
                    <h3 className={`text-lg font-serif-heading font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      Did you work toward your dream today?
                    </h3>
                    <p className={`text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      Upcoming days are locked (Tomorrow Insha'Allah, and subsequent days Insha'Allah that time).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDailyCheckIn('yes')}
                      className={`py-2.5 px-5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm ${
                        isDark
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      <span>Yes, I did!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDailyCheckIn('no')}
                      className={`py-2.5 px-5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-stone-300'
                          : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#111214]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span>Not today</span>
                    </button>
                  </div>
                </div>

                {todayFeedback && (
                  <div className={`p-3.5 rounded-2xl border text-xs text-center font-serif italic animate-fadeIn ${
                    isDark ? 'bg-[#1B1D23] border-white/10 text-stone-200' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}>
                    "{todayFeedback}"
                  </div>
                )}
              </div>

              {/* 30-Day Ramadan Visual Calendar Progress Grid */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                    <div>
                      <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        30-Day Ramadan Journey Calendar
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        Current Day is active • Tomorrow shows "Tomorrow Insha'Allah" • Subsequent days show "Insha'Allah that time"
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs font-mono font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {daysAchieved} Days Achieved • {30 - daysAchieved} Days Left
                  </div>
                </div>

                {/* Day Lock Notice Toast Banner */}
                {dayNotice && (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between animate-fadeIn transition-all ${
                      dayNotice.type === 'tomorrow'
                        ? isDark ? 'bg-sky-500/15 border-sky-500/40 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
                        : dayNotice.type === 'later'
                        ? isDark ? 'bg-[#1B1D23] border-white/10 text-stone-300' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
                        : dayNotice.type === 'today'
                        ? isDark ? 'bg-white/[0.1] border-white/30 text-white' : 'bg-[#111214]/[0.06] border-[#111214]/30 text-[#111214]'
                        : isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {dayNotice.type === 'tomorrow' || dayNotice.type === 'later' ? (
                        <Lock className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      )}
                      <span className="font-medium">{dayNotice.message}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDayNotice(null)}
                      className={`p-1 transition-colors ${isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'}`}
                      aria-label="Dismiss notice"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 30-Day Grid with Day-Locking Rules */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const dayNum = i + 1;
                    const isPast = dayNum < currentDayIndex;
                    const isCurrent = dayNum === currentDayIndex;
                    const isTomorrow = dayNum === currentDayIndex + 1;
                    const hasLogged = dailyLogs[i];

                    let bgClass = isDark
                      ? 'bg-[#1B1D23] border-white/[0.06] text-stone-500'
                      : 'bg-[#F3F3F1] border-black/[0.06] text-[#6B6F76]';
                    let subLabel = '';
                    let icon = null;

                    if (isPast) {
                      if (hasLogged?.status === 'yes') {
                        bgClass = isDark
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                        subLabel = 'Achieved';
                        icon = <Check className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />;
                      } else {
                        bgClass = isDark
                          ? 'bg-white/[0.06] border-white/10 text-stone-300'
                          : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]';
                        subLabel = 'Recorded';
                        icon = <Heart className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />;
                      }
                    } else if (isCurrent) {
                      bgClass = isDark
                        ? 'bg-white text-[#111214] border-white font-bold shadow-sm'
                        : 'bg-[#111214] text-white border-[#111214] font-bold shadow-sm';
                      subLabel = 'Today';
                      icon = <Sparkles className={`w-3 h-3 ${isDark ? 'text-[#111214]' : 'text-white'}`} />;
                    } else if (isTomorrow) {
                      bgClass = isDark
                        ? 'bg-sky-500/15 border-sky-500/35 text-sky-300 hover:border-sky-400/60'
                        : 'bg-sky-50 border-sky-200 text-sky-800 hover:border-sky-400';
                      subLabel = "Tomorrow Insha'Allah";
                      icon = <Lock className={`w-3 h-3 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />;
                    } else {
                      bgClass = isDark
                        ? 'bg-[#1B1D23] border-white/[0.06] text-stone-500 hover:border-white/15'
                        : 'bg-[#F3F3F1] border-black/[0.06] text-[#6B6F76] hover:border-black/15';
                      subLabel = "Insha'Allah that time";
                      icon = <Lock className={`w-2.5 h-2.5 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`} />;
                    }

                    const isLater = dayNum > currentDayIndex + 1;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          if (isTomorrow) {
                            setDayNotice({
                              day: dayNum,
                              message: `Tomorrow Insha'Allah! Day ${dayNum} will unlock tomorrow at Fajr.`,
                              type: 'tomorrow',
                            });
                          } else if (isLater) {
                            setDayNotice({
                              day: dayNum,
                              message: `Insha'Allah that time! Day ${dayNum} is locked until that day arrives.`,
                              type: 'later',
                            });
                          } else if (isCurrent) {
                            setDayNotice({
                              day: dayNum,
                              message: `Today is Day ${dayNum} of Ramadan! Record your daily check-in below.`,
                              type: 'today',
                            });
                          } else {
                            setDayNotice({
                              day: dayNum,
                              message: `Day ${dayNum} (Past Day): ${hasLogged?.status === 'yes' ? 'Alhamdulillah, goal achieved!' : 'Logged with sincere intention.'}`,
                              type: 'past',
                            });
                          }
                        }}
                        className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[72px] transition-all cursor-pointer active:scale-95 ${bgClass}`}
                      >
                        <div className="flex items-center justify-between w-full px-0.5">
                          <span className="text-[9px] font-mono opacity-60">D{dayNum}</span>
                          {icon}
                        </div>
                        <span className="text-xs sm:text-sm font-bold font-mono my-0.5">{dayNum}</span>
                        <span className={`text-[8px] leading-tight text-center line-clamp-2 px-0.5 ${
                          isTomorrow
                            ? isDark ? 'text-sky-300 font-bold' : 'text-sky-800 font-bold'
                            : isCurrent
                            ? isDark ? 'text-[#111214] font-bold' : 'text-white font-bold'
                            : isPast
                            ? isDark ? 'text-stone-300' : 'text-[#3F4248]'
                            : isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                        }`}>
                          {subLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* End of Ramadan Closing Du'a Card if near or complete */}
                {daysAchieved >= 25 && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 mt-4 animate-fadeIn ${
                    isDark ? 'bg-[#1B1D23] border-white/10 text-stone-200' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}>
                    <div className={`font-bold font-cinzel flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      <Award className="w-4 h-4" />
                      <span>Closing Ramadan Du'a of Gratitude:</span>
                    </div>
                    <p className={`font-arabic text-base leading-loose text-center ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
                      « اللَّهُمَّ لَا تَجْعَلْهُ آخِرَ الْعَهْدِ مِنْ صِيَامِنَا إِيَّاهُ، فَإِنْ جَعَلْتَهُ فَاجْعَلْنَا مَرْحُومِينَ وَلَا تَجْعَلْنَا مَحْرُومِينَ »
                    </p>
                    <p className={`italic text-center font-light ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      "O Allah, let this not be the final covenant of our fasting; and if You have decreed it so, make us among those showered in mercy, not those denied."
                    </p>
                  </div>
                )}
              </div>

              {/* Motivation Boost: Categorized Authentic Verses & Hadiths */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-3 relative overflow-hidden ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08]'
                  : 'bg-white border-black/[0.08]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    Motivation Boost (Category: {userData?.goalCategory})
                  </h3>
                </div>

                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}>
                  <p className={`text-xl sm:text-2xl font-arabic font-bold leading-loose text-center ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
                    « {motivationItem.arabicVerseOrHadith} »
                  </p>
                  <p className={`text-xs sm:text-sm font-serif italic text-center ${isDark ? 'text-stone-200' : 'text-[#3F4248]'}`}>
                    "{motivationItem.translation}"
                  </p>
                  <div className={`flex items-center justify-between text-[11px] font-mono pt-2 border-t ${isDark ? 'text-stone-400 border-white/5' : 'text-[#5A5D63] border-black/[0.08]'}`}>
                    <span>Authentic Source: {motivationItem.reference}</span>
                    <span className={`capitalize font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>Category: {motivationItem.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Rotates every 5 days with authentic verses on patience, recitation, and mercy.
                  </p>
                  <button
                    type="button"
                    onClick={handleAskNoorAIForMotivation}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white'
                        : 'bg-[#111214] hover:bg-[#27292D] border-[#111214] text-white'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask NOOR AI for Goal Advice</span>
                  </button>
                </div>
              </div>

              {/* Today's Plan Activities Schedule */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                    <div>
                      <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        Today's Scheduled Routines (Day {currentDayIndex})
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        Tomorrow's routine will unlock Tomorrow Insha'Allah.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('plan_builder')}
                    className={`text-xs hover:underline cursor-pointer font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}
                  >
                    Edit Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(userData?.planActivities || draftActivities)
                    .filter((a) => a.isActive)
                    .map((act) => (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                          isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-[#111214]'}`} />
                          <div>
                            <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                              {act.activityName}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                              {act.duration ? `${act.duration} minutes` : 'Daily time'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-mono ${
                          isDark ? 'bg-[#14161A] border-white/10 text-white' : 'bg-white border-black/[0.08] text-[#111214]'
                        }`}>
                          {act.scheduledTime}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 24-Hour Daily Inspiration Pulse Modal */}
      <DailyInspirationPulseModal
        isOpen={isPulseModalOpen}
        onDismissTemporarily={() => setIsPulseModalOpen(false)}
        onEngagedComplete={() => setIsPulseModalOpen(false)}
        item={inspirationPulseItem}
        dayNumber={currentDayIndex}
        isDark={isDark}
      />

      {/* Ramadan Updates Modal (Shows ONLY updates) */}
      <NoorRamadanUpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        isDark={isDark}
        ramadanStatus={hijriStatus}
        isRamadanSimulated={isRamadanSimulated}
        onToggleSimulated={() => {
          const nextVal = !isRamadanSimulated;
          setIsRamadanSimulated(nextVal);
          localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
          detectRamadanStatus().then((s) => setHijriStatus(s));
        }}
        onProceedToRamadan={
          isRamadanActive
            ? () => {
                setIsUpdatesModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
};
