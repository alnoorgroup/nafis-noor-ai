import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  GraduationCap,
  ChevronRight,
  RotateCcw,
  Check,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Layers,
  Heart,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Compass,
  ArrowRight,
  Sliders,
  SunMedium,
  CheckCircle2,
  Bell,
  BellRing,
  ShieldAlert
} from 'lucide-react';
import { UserStats, Dua } from '../types';
import { NavTab } from './Navigation';
import { calculatePrayerTimes } from '../utils/prayerTimes';
import { DUAS_LIST } from '../data/duasData';
import { LocationModal } from './LocationModal';
import { recordUserActivity } from '../utils/streakManager';
import { useBackHandler } from '../utils/historyManager';
import { NoorAIIcon } from './NoorAIIcon';
import { PullToRefresh } from './PullToRefresh';
import { t, getLanguageCode } from '../utils/i18n';
import { DhikrVoiceController } from '../utils/dhikrVoiceReader';

interface HomeScreenProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenQuranSurah?: (surahNumber: number) => void;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isDark,
  userStats,
  onUpdateStats,
  onNavigate,
  onOpenQuranSurah,
  onOpenNoorAIWithPrompt,
}) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [prayerData, setPrayerData] = useState(() =>
    calculatePrayerTimes({
      latitude: userStats.userLatitude,
      longitude: userStats.userLongitude,
      locationName: userStats.userLocation,
      calculationMethod: userStats.prayerCalculationMethod,
      asrMadhab: userStats.asrJuristicMethod,
    })
  );
  const [copiedDua, setCopiedDua] = useState(false);
  const [isSpeakingDua, setIsSpeakingDua] = useState(false);
  const [isLoadingDuaAudio, setIsLoadingDuaAudio] = useState(false);
  const [isDhikrAnimating, setIsDhikrAnimating] = useState(false);
  const [showAllPrayers, setShowAllPrayers] = useState(false);
  const duaVoiceControllerRef = useRef<DhikrVoiceController | null>(null);
  if (!duaVoiceControllerRef.current) {
    duaVoiceControllerRef.current = new DhikrVoiceController();
  }

  useEffect(() => {
    return () => {
      duaVoiceControllerRef.current?.stop();
    };
  }, []);

  // Browser Back button navigation hooks
  useBackHandler(isLocationModalOpen, () => setIsLocationModalOpen(false), 'home-location-modal');
  useBackHandler(showAllPrayers, () => setShowAllPrayers(false), 'home-all-prayers');

  // Compute the designated Dua for today based on calendar day
  const todayDuaIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % DUAS_LIST.length;
  }, []);

  const [activeDuaIndex, setActiveDuaIndex] = useState(todayDuaIndex);
  const currentDua: Dua = DUAS_LIST[activeDuaIndex] || DUAS_LIST[0];

  // Update prayer times on options change or 1-second interval
  useEffect(() => {
    const update = () => {
      setPrayerData(
        calculatePrayerTimes({
          latitude: userStats.userLatitude,
          longitude: userStats.userLongitude,
          locationName: userStats.userLocation,
          calculationMethod: userStats.prayerCalculationMethod,
          asrMadhab: userStats.asrJuristicMethod,
        })
      );
    };

    update();
    // 15-second interval avoids 60 re-renders/minute on iOS while keeping time accurate
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, [
    userStats.userLatitude,
    userStats.userLongitude,
    userStats.userLocation,
    userStats.prayerCalculationMethod,
    userStats.asrJuristicMethod,
  ]);

  // Dhikr options
  const dhikrOptions = [
    { text: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', meaningAr: 'تسبيح الله وتنزيهه عن كل نقص' },
    { text: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All Praise is to Allah', meaningAr: 'الثناء الكامل والمطلق لله وحده' },
    { text: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', meaningAr: 'الله أعظم وأجلّ من كل شيء' },
    { text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: "I seek Allah's Forgiveness", meaningAr: 'طلب المغفرة والستر من الله' },
    { text: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', meaningAr: 'كلمة التوحيد: لا معبود بحق إلا الله' },
  ];

  const activeDhikrObj = dhikrOptions.find((d) => d.text === userStats.currentDhikrText) || dhikrOptions[0];

  // Subtle audio click chime synthesized on demand
  const playTactileChime = () => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      }
    } catch {
      // Audio optional
    }
  };

  const handleIncrementDhikr = (amount = 1) => {
    playTactileChime();
    setIsDhikrAnimating(true);
    setTimeout(() => setIsDhikrAnimating(false), 200);

    const newCount = userStats.dhikrCount + amount;
    const streakUpdates = recordUserActivity(userStats, 'dhikr');

    onUpdateStats({
      dhikrCount: newCount,
      ...streakUpdates,
    });
  };

  const handleResetDhikr = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStats({ dhikrCount: 0 });
  };

  const handleSelectDhikrText = (dhikrText: string) => {
    onUpdateStats({ currentDhikrText: dhikrText });
  };

  const handleToggleSaveDua = () => {
    const saved = userStats.savedDuas || [];
    const isSaved = saved.includes(currentDua.id);
    const newSaved = isSaved
      ? saved.filter((id) => id !== currentDua.id)
      : [...saved, currentDua.id];
    onUpdateStats({ savedDuas: newSaved });
  };

  const handleCopyDua = () => {
    const textToCopy = `${currentDua.title}\n\n${currentDua.arabic}\n\n${currentDua.transliteration}\n\n"${currentDua.translation}"\n— ${currentDua.source} (Via NOOR)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDua(true);
    setTimeout(() => setCopiedDua(false), 2000);
  };

  const handleSpeakDua = () => {
    const controller = duaVoiceControllerRef.current;
    if (!controller) return;
    void controller.toggle(`home-${currentDua.id}`, currentDua.arabic, currentDua.audio, {
      onLoading: (loading) => setIsLoadingDuaAudio(loading),
      onPlay: () => {
        setIsLoadingDuaAudio(false);
        setIsSpeakingDua(true);
      },
      onPause: () => {
        setIsLoadingDuaAudio(false);
        setIsSpeakingDua(false);
      },
      onEnded: () => {
        setIsLoadingDuaAudio(false);
        setIsSpeakingDua(false);
      },
      onError: () => {
        setIsLoadingDuaAudio(false);
        setIsSpeakingDua(false);
      },
    });
  };

  const isDuaSaved = (userStats.savedDuas || []).includes(currentDua.id);
  const lang = getLanguageCode(userStats.language);

  const getPrayerLocalizedName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fajr')) return t(lang, 'fajr');
    if (lower.includes('sun')) return t(lang, 'sunrise');
    if (lower.includes('dhuhr') || lower.includes('zuhr')) return t(lang, 'dhuhr');
    if (lower.includes('asr')) return t(lang, 'asr');
    if (lower.includes('maghrib')) return t(lang, 'maghrib');
    if (lower.includes('isha')) return t(lang, 'isha');
    return name;
  };

  const handlePullRefresh = async () => {
    setPrayerData(
      calculatePrayerTimes({
        latitude: userStats.userLatitude,
        longitude: userStats.userLongitude,
        locationName: userStats.userLocation,
        calculationMethod: userStats.prayerCalculationMethod,
        asrMadhab: userStats.asrJuristicMethod,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh} isDark={isDark}>
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 pb-32 lg:pb-16 space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOP PEACEFUL DIGITAL HOME GREETING                                     */}
      {/* ========================================================================= */}
      <div className="pt-1 px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className={`text-xs font-cinzel font-semibold tracking-widest ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            {t(lang, 'peaceBeUponYou')}
          </p>
          <h2
            className={`text-2xl sm:text-3xl font-serif-heading font-bold tracking-tight mt-0.5 ${
              isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
            }`}
          >
            {userStats.userName ? t(lang, 'welcomeUser', { name: userStats.userName }) : t(lang, 'authWelcomeTitle')}
          </h2>
          <p className={`text-xs mt-1 font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            {t(lang, 'verseRestReflection')}
          </p>
        </div>

        {/* Location & Method Badge */}
        <div className="flex items-center gap-2">
          <button
            id="home-location-badge"
            onClick={() => setIsLocationModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all group cursor-pointer ${
              isDark
                ? 'border-white/[0.1] bg-[#14161A] text-[#F3F4F6] hover:bg-[#1B1D23]'
                : 'border-black/[0.08] bg-white text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
            title={lang === 'ar' ? 'تغيير الموقع وطريقة الحساب' : 'Change Location & Calculation Method'}
          >
            <MapPin className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span className="truncate max-w-[140px]">{userStats.userLocation || 'Makkah'}</span>
            <Sliders className={`w-3 h-3 ml-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP BENTO ROW: 🕌 PRAYER CARD & 📖 QUR'AN CARD                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PRAYER CARD */}
        <div
          id="home-prayer-card"
          className={`rounded-3xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🕌</span>
                <div>
                  <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {t(lang, 'nextPrayer')}
                  </span>
                  <h3 className="text-xl font-bold font-cinzel text-[#DFBA7F]">
                    {getPrayerLocalizedName(prayerData.nextPrayer.name)}
                  </h3>
                </div>
              </div>

              {/* Countdown Pill */}
              <div
                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-mono text-xs font-bold ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6]'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{prayerData.timeUntilNext}</span>
              </div>
            </div>

            {/* 5 Daily Prayers Pill Grid */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {prayerData.prayers.map((prayer) => {
                const isNext = prayer.name === prayerData.nextPrayer.name;
                return (
                  <div
                    key={prayer.name}
                    className={`py-2.5 px-1 rounded-2xl text-center border transition-all ${
                      isNext
                        ? isDark
                          ? 'bg-white text-[#111214] border-white shadow-sm'
                          : 'bg-[#111214] text-white border-[#111214] shadow-sm'
                        : isDark
                        ? 'bg-[#1B1D23] border-white/[0.06] text-stone-400'
                        : 'bg-[#F3F3F1] border-black/[0.06] text-[#5A5D63]'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-medium tracking-tight ${
                        isNext ? 'font-bold' : ''
                      }`}
                    >
                      {getPrayerLocalizedName(prayer.name)}
                    </div>
                    <div
                      className={`text-[11px] font-bold font-mono mt-0.5 ${
                        isNext ? '' : isDark ? 'text-stone-200' : 'text-[#111214]'
                      }`}
                    >
                      {prayer.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Access to Daily Prayer Check */}
            <div className="pt-2.5">
              <button
                type="button"
                onClick={() => onNavigate('prayer-check')}
                className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                  isDark
                    ? 'bg-[#1B1D23] hover:bg-white/[0.08] border-[#DFBA7F]/40 text-[#DFBA7F]'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-[#DFBA7F]/40 text-[#A67C38]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>{t(lang, 'dailyPrayerCheck')}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Toggle Calculation & Notification info */}
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-1.5 transition-colors group ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
              title={lang === 'ar' ? 'انقر لتعديل وتيرة التذكيرات' : 'Click to adjust notification frequency'}
            >
              {userStats.notificationsEnabled ? (
                <>
                  <BellRing className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>
                    {t(lang, 'remindersLabel')}:{' '}
                    <strong className={isDark ? 'text-white' : 'text-[#111214]'}>
                      {userStats.personalization?.reminderFrequency === 'Normal' || !userStats.personalization?.reminderFrequency
                        ? t(lang, 'remindersNormal')
                        : userStats.personalization.reminderFrequency}
                    </strong>
                  </span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t(lang, 'remindersLabel')}: <strong className="text-stone-500">{t(lang, 'remindersPaused')}</strong></span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className={`hover:underline font-semibold flex items-center gap-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}
            >
              <Sliders className="w-3 h-3" />
              <span>{t(lang, 'edit')}</span>
            </button>
          </div>
        </div>

        {/* QUR'AN CARD */}
        <div
          id="home-quran-card"
          onClick={() => onNavigate('quran')}
          className={`group rounded-3xl p-5 sm:p-6 border cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] hover:border-white/[0.2] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] hover:border-black/[0.2] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                  isDark
                    ? 'bg-[#1B1D23] border-[#DFBA7F]/40 text-[#DFBA7F]'
                    : 'bg-[#F3F3F1] border-[#DFBA7F]/40 text-[#A67C38]'
                }`}>
                  <BookOpen className="w-5 h-5 text-[#DFBA7F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {t(lang, 'quranHeader')}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold font-serif-heading ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {userStats.quranPagesRead > 0
                      ? `${t(lang, 'surah')} ${userStats.lastReadSurah || 1} • ${t(lang, 'ayah')} ${userStats.lastReadAyah || 1}`
                      : t(lang, 'continueReading')}
                  </h3>
                </div>
              </div>

              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                isDark
                  ? 'border-white/[0.1] bg-[#1B1D23] text-stone-300 group-hover:bg-white group-hover:text-[#111214]'
                  : 'border-black/[0.08] bg-[#F3F3F1] text-[#111214] group-hover:bg-[#111214] group-hover:text-white'
              }`}>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Arabic Calligraphy Snippet */}
            <div className={`p-3.5 rounded-2xl border my-2 text-center ${
              isDark ? 'bg-[#0B0C0E] border-white/[0.07]' : 'bg-[#F3F3F1] border-black/[0.06]'
            }`}>
              <p className={`font-arabic text-xl ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
              <p className={`text-[11px] font-light mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {t(lang, 'bismillahTranslation')}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className={`flex items-center justify-between mt-3 text-xs pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {t(lang, 'pagesReadCount', { count: userStats.quranPagesRead })}
            </span>
            <span className={`font-cinzel font-bold flex items-center gap-1 group-hover:underline ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              <span>{userStats.quranPagesRead > 0 ? t(lang, 'continueReading') : t(lang, 'quran')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE BENTO ROW: 📿 DHIKR & 🔥 DAILY DUA                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DHIKR CARD */}
        <div
          id="home-dhikr-card"
          className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📿</span>
                <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {t(lang, 'tasbihCounter')}
                </span>
              </div>
              <button
                onClick={handleResetDhikr}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                  isDark
                    ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                    : 'text-[#6B6F76] hover:text-[#111214] hover:bg-black/[0.05]'
                }`}
                title={lang === 'ar' ? 'إعادة ضبط العداد' : 'Reset counter'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t(lang, 'resetCounter')}</span>
              </button>
            </div>

            {/* Dhikr Arabic & Meaning */}
            <div className="text-center my-3">
              <div className={`font-arabic text-2xl font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {activeDhikrObj.arabic}
              </div>
              {lang !== 'ar' && (
                <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                  {activeDhikrObj.text}
                </div>
              )}
              <div className={`text-[11px] font-light mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {lang === 'ar' ? activeDhikrObj.meaningAr : activeDhikrObj.meaning}
              </div>
            </div>
          </div>

          {/* Interactive Tap Button */}
          <button
            id="home-dhikr-tap-btn"
            type="button"
            onClick={() => handleIncrementDhikr(1)}
            className={`w-full mt-3 py-3.5 px-4 rounded-2xl font-mono text-center border transition-all duration-150 transform active:scale-95 ${
              isDhikrAnimating
                ? isDark
                  ? 'scale-95 bg-white text-[#111214] border-white ring-4 ring-white/25'
                  : 'scale-95 bg-[#111214] text-white border-[#111214] ring-4 ring-black/15'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-white hover:bg-white/[0.12]'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:bg-black/[0.08]'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold">{userStats.dhikrCount}</div>
            <div className="text-[10px] tracking-wider uppercase font-sans font-semibold opacity-80 mt-0.5">
              {t(lang, 'tapToCount')} {lang === 'ar' ? '(+١)' : '(+1)'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className={`w-full mt-2.5 py-1.5 text-center text-xs transition-colors flex items-center justify-center gap-1.5 opacity-90 hover:opacity-100 cursor-pointer font-medium ${
              isDark ? 'text-stone-300 hover:text-white' : 'text-[#3F4248] hover:text-[#111214]'
            }`}
          >
            <span>{lang === 'ar' ? 'مكتبة الأدعية والأذكار في قسم الرحلة' : "Dua’s & Dhikr Library in Journey"}</span>
            <ArrowRight className={`w-3 h-3 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* DAILY DUA CARD */}
        <div
          id="home-daily-dua-card"
          className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${isDark ? 'text-white fill-white' : 'text-[#111214] fill-[#111214]'}`} />
                <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {t(lang, 'dailyReflection')} • {t(lang, 'streak')}: {userStats.overallStreak} {t(lang, 'days')}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSpeakDua}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isSpeakingDua
                      ? isDark
                        ? 'text-emerald-400 animate-pulse'
                        : 'text-emerald-600 animate-pulse'
                      : isDark
                      ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                      : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
                  }`}
                  title={t(lang, 'listenAyah')}
                >
                  {isLoadingDuaAudio ? (
                    <span className={`inline-block w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-white' : 'border-[#111214]'}`} />
                  ) : isSpeakingDua ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleCopyDua}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark
                      ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                      : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
                  }`}
                  title={t(lang, 'copy')}
                >
                  {copiedDua ? <Check className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleSaveDua}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark
                      ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                      : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
                  }`}
                  title={t(lang, 'saveDua')}
                >
                  <Bookmark className={`w-4 h-4 ${isDuaSaved ? (isDark ? 'text-white fill-white' : 'text-[#111214] fill-[#111214]') : ''}`} />
                </button>
              </div>
            </div>

            <h4 className={`text-base font-serif-heading font-bold ${lang === 'ar' ? 'font-arabic text-right' : ''} ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {lang === 'ar' ? (currentDua.titleAr || currentDua.title) : currentDua.title}
            </h4>

            {/* Arabic Text */}
            <p className={`font-arabic text-lg sm:text-xl text-right my-2 leading-loose ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {currentDua.arabic}
            </p>

            {/* Transliteration & Translation (Only for non-Arabic) */}
            {lang !== 'ar' && (
              <>
                <p className={`text-xs italic mb-1 font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {currentDua.transliteration}
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  "{currentDua.translation}"
                </p>
              </>
            )}
            {lang === 'ar' && currentDua.benefit && (
              <p className={`text-xs leading-relaxed font-light mt-1 text-right ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {currentDua.benefit}
              </p>
            )}
          </div>

          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-white/[0.08] text-stone-400' : 'border-black/[0.08] text-[#6B6F76]'}`}>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className={`text-[10px] hover:underline font-semibold flex items-center gap-0.5 group cursor-pointer ${
                isDark ? 'text-stone-300 hover:text-white' : 'text-[#111214]'
              }`}
            >
              <span>{lang === 'ar' ? 'المكتبة في الرحلة' : 'Library in Journey'}</span>
              <ArrowRight className={`w-3 h-3 group-hover:translate-x-0.5 transition-transform ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveDuaIndex((prev) => (prev > 0 ? prev - 1 : DUAS_LIST.length - 1))}
                className={`p-1 rounded transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#111214]'}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {activeDuaIndex + 1} / {DUAS_LIST.length}
              </span>
              <button
                onClick={() => setActiveDuaIndex((prev) => (prev < DUAS_LIST.length - 1 ? prev + 1 : 0))}
                className={`p-1 rounded transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#111214]'}`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM BENTO ROW: 🤖 NOOR AI HERO & 🎓 LEARN CARD                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ASK NOOR AI (Spans 2 columns on lg) */}
        <div
          id="home-noor-ai-orb-card"
          onClick={() => onNavigate('noor-ai')}
          className={`lg:col-span-2 group relative overflow-hidden rounded-3xl p-5 sm:p-6 cursor-pointer border transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${
            isDark
              ? 'bg-[#14161A] border-white/[0.1] hover:border-white/[0.24] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] hover:border-black/[0.22] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                  isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                }`}>
                  <NoorAIIcon className="w-6 h-6 animate-pulse" />
                  <div className={`absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 shadow-sm ${isDark ? 'ring-[#14161A]' : 'ring-white'}`} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-cinzel font-bold tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      ✦ {t(lang, 'noorCompanion')}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isDark
                        ? 'bg-[#1B1D23] text-stone-200 border-white/[0.1]'
                        : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                    }`}>
                      {t(lang, 'askNoor')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                      isDark
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {t(lang, 'liveGuide')}
                    </span>
                  </div>
                  <p className={`text-xs font-light mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {t(lang, 'noorAiSubheader')}
                  </p>
                </div>
              </div>

              <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                isDark
                  ? 'border-white/[0.1] bg-[#1B1D23] text-stone-300 group-hover:bg-white group-hover:text-[#111214]'
                  : 'border-black/[0.08] bg-[#F3F3F1] text-[#111214] group-hover:bg-[#111214] group-hover:text-white'
              }`}>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* LEARN CARD (1 column on lg) */}
        <div
          id="home-learn-card"
          onClick={() => onNavigate('learn')}
          className={`group rounded-3xl p-5 sm:p-6 border cursor-pointer flex flex-col justify-between transition-all transform hover:-translate-y-0.5 active:scale-[0.99] ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] hover:border-white/[0.2] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] hover:border-black/[0.2] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <GraduationCap className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {t(lang, 'studyHeader')}
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-[#1B1D23] text-stone-200 border-white/[0.08]'
                  : 'bg-[#F3F3F1] text-[#111214] border-black/[0.06]'
              }`}>
                {userStats.totalXP} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}
              </span>
            </div>

            <h4 className={`text-base font-bold font-serif-heading mt-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {userStats.lessonsCompleted === 0
                ? t(lang, 'startLesson')
                : `${userStats.lessonsCompleted} ${t(lang, 'lessonsCompleted')}`}
            </h4>
            <p className={`text-xs font-light mt-1 line-clamp-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {t(lang, 'studySubheader')}
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
              {userStats.completedLessonIds.length === 0 ? t(lang, 'courses') : t(lang, 'continueLesson')}
            </span>
            <span className={`font-cinzel font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              <span>{t(lang, 'next')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. HOMEPAGE STUDY & ISLAMIC LEARNING SHOWCASE                            */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-3xl border relative overflow-hidden ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {lang === 'ar' ? 'التعليم والتفقه في الدين' : 'ISLAMIC STUDY PATH'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isDark
                    ? 'bg-[#1B1D23] text-stone-200 border-white/[0.08]'
                    : 'bg-[#F3F3F1] text-[#111214] border-black/[0.06]'
                }`}>
                  {userStats.totalXP} XP
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif-heading font-bold mt-0.5">
                {lang === 'ar' ? 'دروس تفاعلية في التفسير والتجويد والسنة' : 'Interactive Islamic Lessons & Study Tracks'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigate('learn')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-cinzel flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <span>{lang === 'ar' ? 'استعراض المسارات' : 'Open Study'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Interactive Study Tracks Carousel/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              titleAr: 'تفسير وتدبر القرآن',
              titleEn: 'Quran Tafsir & Tadabbur',
              descAr: 'فهم معاني الآيات وأسباب النزول',
              descEn: 'Meanings of the verses and context',
              icon: BookOpen,
              tag: 'Tafsir',
            },
            {
              titleAr: 'مخارج الحروف والتجويد',
              titleEn: 'Tajweed & Phonology',
              descAr: 'النطق الصحيح لحروف كتاب الله',
              descEn: 'Authentic Arabic articulation & rules',
              icon: Sparkles,
              tag: 'Tajweed',
            },
            {
              titleAr: 'الأحاديث النبوية والآداب',
              titleEn: 'Prophetic Hadith & Adab',
              descAr: 'الأربعون النووية ومكارم الأخلاق',
              descEn: 'Forty Hadith and noble character',
              icon: Heart,
              tag: 'Hadith',
            },
            {
              titleAr: 'فقه العبادات والخشوع',
              titleEn: 'Daily Fiqh & Khushu',
              descAr: 'أحكام الطهارة والصلاة والسنن',
              descEn: 'Purity, Salah, and prayer focus',
              icon: Compass,
              tag: 'Fiqh',
            },
          ].map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate('learn')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:-translate-y-0.5 active:scale-95 ${
                  isDark
                    ? 'bg-[#0B0C0E] hover:bg-[#1B1D23] border-white/[0.08] hover:border-white/[0.2]'
                    : 'bg-[#FCFCFA] hover:bg-[#F3F3F1] border-black/[0.08] hover:border-black/[0.2]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-[#1B1D23] text-white' : 'bg-[#F3F3F1] text-[#111214]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-white/[0.08] text-stone-300' : 'bg-white text-[#3F4248] border border-black/[0.08]'
                  }`}>
                    {track.tag}
                  </span>
                </div>
                <h4 className={`text-xs sm:text-sm font-bold font-serif-heading line-clamp-1 transition-colors ${
                  isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                }`}>
                  {lang === 'ar' ? track.titleAr : track.titleEn}
                </h4>
                <p className={`text-[11px] mt-1 line-clamp-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {lang === 'ar' ? track.descAr : track.descEn}
                </p>
                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-semibold ${
                  isDark ? 'border-white/[0.08] text-stone-300 group-hover:text-white' : 'border-black/[0.08] text-[#111214]'
                }`}>
                  <span>{lang === 'ar' ? 'ابدأ الدرس' : 'Start Lesson'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. HOMEPAGE QUICK TASBIH & DHIKR PULSE SHOWCASE CARD                      */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="space-y-3 flex-1 text-center md:text-left rtl:md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className={`text-[10px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {lang === 'ar' ? 'المسبحة الإلكترونية اليومية' : 'DAILY TASBIH & DHIKR'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              {userStats.dhikrStreak} {lang === 'ar' ? 'أيام متتالية' : 'Days Streak'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif-heading font-bold">
            {lang === 'ar' ? 'ألا بذكر الله تطمئن القلوب' : 'Heartfelt Daily Remembrance'}
          </h3>

          <p className={`text-xs max-w-lg ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            {lang === 'ar'
              ? 'ردد أذكار اليوم المباركة واكسب الحسنات وضاعف رصيدك الإيماني بنقرة واحدة.'
              : 'Recite authentic daily Adhkar to cultivate peace of mind and steady faith.'}
          </p>

          {/* Quick Dhikr Chips */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {dhikrOptions.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => onUpdateStats({ currentDhikrText: opt.text })}
                className={`px-3 py-1.5 rounded-xl text-xs font-arabic border transition-all cursor-pointer ${
                  userStats.currentDhikrText === opt.text
                    ? isDark
                      ? 'bg-white border-white text-[#111214] font-bold shadow-xs'
                      : 'bg-[#111214] border-[#111214] text-white font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#1B1D23] hover:bg-white/[0.1] border-white/[0.08] text-stone-300'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.06] text-[#3F4248]'
                }`}
              >
                {opt.arabic}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Tasbih Tap Button */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <button
            onClick={() => handleIncrementDhikr(1)}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full relative flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDhikrAnimating ? 'scale-95' : 'hover:scale-105'
            } ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214] shadow-[0_8px_28px_rgba(255,255,255,0.14)]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white shadow-[0_8px_28px_rgba(0,0,0,0.14)]'
            }`}
          >
            <span className="text-3xl font-bold font-mono tracking-tight leading-none">
              {userStats.dhikrCount}
            </span>
            <span className="text-[10px] font-cinzel uppercase tracking-widest font-bold opacity-80 mt-1">
              {lang === 'ar' ? 'انقر للتسبيح' : 'TAP TASBIH'}
            </span>
          </button>
          <span className={`text-[11px] mt-2 font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            {lang === 'ar' ? `الهدف: ${userStats.dhikrGoal || 33} تسبيحة` : `Goal: ${userStats.dhikrGoal || 33} counts`}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. DUA'S & DHIKR SANCTUARY IN JOURNEY — EXPLANATION & ACTION CARD         */}
      {/* ========================================================================= */}
      <div
        id="home-journey-dhikr-spotlight-card"
        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-cinzel font-bold tracking-widest uppercase border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#1B1D23] text-stone-200 border-white/[0.1]'
                  : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                {lang === 'ar' ? 'مكتبة رحلتي الإيمانية' : 'Spiritual Journey Library'}
              </span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {lang === 'ar' ? '٢٨٨ ذكراً ودعاءً' : '288 Authentic Invocations'}
              </span>
            </div>

            <h3 className={`text-xl sm:text-2xl font-serif-heading font-bold tracking-tight ${
              isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
            }`}>
              {lang === 'ar' ? 'مكتبة الأدعية والأذكار في قسم الرحلة' : "Dua’s & Dhikr Library in Journey"}
            </h3>

            <p className={`text-xs sm:text-sm leading-relaxed font-light ${
              isDark ? 'text-stone-300' : 'text-[#5A5D63]'
            }`}>
              {lang === 'ar'
                ? 'المكتبة الشاملة لأذكار وأدعية حصن المسلم الموثقة تم حفظها بالكامل داخل قسم "الرحلة". يمكنك استعراض ٣٢ تصنيفاً مباركاً تشمل الأوراد اليومية، أذكار الصلوات، الحفظ، الرزق، والمناسبات مع التلاوات الصوتية والتخريج الصحيح.'
                : 'The complete library of 288 authentic Hisn al-Muslim supplications is preserved inside your Spiritual Journey section. Explore 32 curated categories spanning Daily, Azkar, and Occasional invocations with verified Hadith citations and audio recitations.'}
            </p>

            {/* Feature Badges */}
            <div className={`flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-[#F3F3F1] border-black/[0.06] text-[#111214]'
              }`}>
                <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{lang === 'ar' ? '٣٢ تصنيفاً شاملاً' : '32 Curated Categories'}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-[#F3F3F1] border-black/[0.06] text-[#111214]'
              }`}>
                <Volume2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>{lang === 'ar' ? 'تلاوات صوتية صحيحة' : 'Audio Recitations'}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200' : 'bg-[#F3F3F1] border-black/[0.06] text-[#111214]'
              }`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{lang === 'ar' ? 'تخريج الأحاديث' : 'Hadith References'}</span>
              </div>
            </div>
          </div>

          {/* Action Button to Journey Section */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch md:items-end justify-center gap-2">
            <button
              id="home-open-journey-dhikr-btn"
              type="button"
              onClick={() => onNavigate('profile')}
              className={`px-6 py-4 rounded-2xl font-cinzel text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm active:scale-98 cursor-pointer group ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'فتح مكتبة الأدعية في الرحلة' : 'Open Dua’s in Journey'}</span>
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>
            <p className={`text-[10px] text-center md:text-right ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {lang === 'ar' ? 'قسم الرحلة > أذكار وأدعية حصن المسلم' : 'Spiritual Journey > Dua’s & Dhikr Library'}
            </p>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          isDark={isDark}
          userStats={userStats}
          onClose={() => setIsLocationModalOpen(false)}
          onUpdateStats={(locData) => {
            onUpdateStats(locData);
            setIsLocationModalOpen(false);
          }}
        />
      )}
      </div>
    </PullToRefresh>
  );
};
