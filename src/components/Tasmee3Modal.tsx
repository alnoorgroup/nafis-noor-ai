import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Check,
  ChevronRight,
  Volume2,
  BookOpen,
  Info,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  VolumeX,
  Compass
} from 'lucide-react';
import { Surah, Ayah } from '../types';
import { ALL_SURAHS } from '../data/quranData';
import { loadCompleteSurah } from '../utils/quranLoader';
import { getGlobalLanguage } from '../utils/i18n';
import { Tasmee3Controller, Tasmee3Status, Tasmee3SessionSummary } from '../utils/tasmee3Speech';
import { Tasmee3RangeResult, AyahRecitationReview, WordDetail } from '../utils/tasmee3Analysis';
import { Tasmee3Waveform } from './Tasmee3Waveform';

interface Tasmee3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  initialSurah?: Surah;
  initialVerseNumber?: number;
  onJumpToVerseInReader?: (surah: Surah, verseNumber: number) => void;
}

export const Tasmee3Modal: React.FC<Tasmee3ModalProps> = ({
  isOpen,
  onClose,
  isDark,
  initialSurah,
  initialVerseNumber = 1,
  onJumpToVerseInReader,
}) => {
  // Surah & Range selection
  const [selectedSurah, setSelectedSurah] = useState<Surah>(() => initialSurah || ALL_SURAHS[66] || ALL_SURAHS[0]); // Default to Al-Mulk or initial
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(10);
  const [loadedAyahs, setLoadedAyahs] = useState<Ayah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const isArabic = getGlobalLanguage() === 'ar';

  // Controller state
  const [status, setStatus] = useState<Tasmee3Status>('idle');
  const [currentVerse, setCurrentVerse] = useState<number>(1);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [uncertainMessage, setUncertainMessage] = useState<string | null>(null);
  const [isSilenceWaiting, setIsSilenceWaiting] = useState(false);
  const [spokenTextPreview, setSpokenTextPreview] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result & Review state
  const [rangeResult, setRangeResult] = useState<Tasmee3RangeResult | null>(null);
  const [selectedReviewAyahNumber, setSelectedReviewAyahNumber] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'warning' | 'missing'>('all');

  // View modes
  const [viewMode, setViewMode] = useState<'setup' | 'permission_info' | 'active' | 'review'>('setup');

  const controllerRef = useRef<Tasmee3Controller | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync initialSurah and verse when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = initialSurah || ALL_SURAHS.find(s => s.number === 67) || ALL_SURAHS[0];
      setSelectedSurah(initial);

      const start = Math.max(1, Math.min(initial.numberOfAyahs, initialVerseNumber));
      const end = Math.min(initial.numberOfAyahs, start + 9); // e.g. 1 -> 10 default
      setFromAyah(start);
      setToAyah(end);
      setCurrentVerse(start);
      setRangeResult(null);
      setUncertainMessage(null);
      setErrorMessage(null);
      setSpokenTextPreview('');
      setIsSilenceWaiting(false);
      setViewMode('setup');
    }
  }, [isOpen, initialSurah, initialVerseNumber]);

  // Load complete Ayahs when selectedSurah changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchAyahs() {
      setIsLoadingAyahs(true);
      try {
        const ayahs = await loadCompleteSurah(selectedSurah.number, getGlobalLanguage());
        if (!isCancelled) {
          setLoadedAyahs(ayahs);
          setIsLoadingAyahs(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[Tasmee3] Failed to load surah ayahs:', err);
          setIsLoadingAyahs(false);
        }
      }
    }
    fetchAyahs();
    return () => {
      isCancelled = true;
    };
  }, [selectedSurah.number]);

  // Clean up controller on unmount or close
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
    };
  }, []);

  // Set range presets helper
  const handleSetPreset = (preset: '1-5' | '1-10' | '1-20' | 'full') => {
    if (preset === '1-5') {
      setFromAyah(1);
      setToAyah(Math.min(5, selectedSurah.numberOfAyahs));
    } else if (preset === '1-10') {
      setFromAyah(1);
      setToAyah(Math.min(10, selectedSurah.numberOfAyahs));
    } else if (preset === '1-20') {
      setFromAyah(1);
      setToAyah(Math.min(20, selectedSurah.numberOfAyahs));
    } else if (preset === 'full') {
      setFromAyah(1);
      setToAyah(selectedSurah.numberOfAyahs);
    }
  };

  // Start continuous listening session
  const handleStartSession = useCallback(async () => {
    setErrorMessage(null);
    setUncertainMessage(null);
    setSpokenTextPreview('');
    setIsSilenceWaiting(false);

    let ayahs = loadedAyahs;
    if (ayahs.length === 0) {
      try {
        setIsLoadingAyahs(true);
        ayahs = await loadCompleteSurah(selectedSurah.number, getGlobalLanguage());
        setLoadedAyahs(ayahs);
        setIsLoadingAyahs(false);
      } catch (err) {
        setErrorMessage('Failed to load authoritative Quran text. Please try again.');
        setIsLoadingAyahs(false);
        return;
      }
    }

    const controller = new Tasmee3Controller({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'permission_denied') {
          setViewMode('permission_info');
        }
      },
      onPositionUpdate: (verseNum) => {
        setCurrentVerse(verseNum);
        setUncertainMessage(null);
        setIsSilenceWaiting(false);
      },
      onUncertain: (msg) => {
        setUncertainMessage(msg);
      },
      onAudioLevel: (lvl) => {
        setAudioLevel(lvl);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onSpokenText: (txt) => {
        setSpokenTextPreview(txt);
      },
      onSilenceWaiting: (isWaiting) => {
        setIsSilenceWaiting(isWaiting);
      },
      onRangeFinished: (result) => {
        setRangeResult(result);
        setSelectedReviewAyahNumber(fromAyah);
        setViewMode('review');
      },
    });

    controllerRef.current = controller;

    const started = await controller.start({
      surahNumber: selectedSurah.number,
      surahName: selectedSurah.name,
      surahEnglishName: selectedSurah.englishName,
      startingVerse: fromAyah,
      toVerse: toAyah,
      verses: ayahs,
    });

    if (started) {
      setCurrentVerse(fromAyah);
      setViewMode('active');
    }
  }, [loadedAyahs, selectedSurah, fromAyah, toAyah]);

  const handlePause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const handleStop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  const handleFinish = useCallback(() => {
    if (controllerRef.current) {
      const summary = controllerRef.current.finish();
      if (summary.rangeResult) {
        setRangeResult(summary.rangeResult);
        setSelectedReviewAyahNumber(summary.startingVerse);
      }
      setViewMode('review');
    }
  }, []);

  const handleClose = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
      controllerRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Jump to ayah in review screen
  const handleJumpToReviewAyah = (ayahNum: number) => {
    setSelectedReviewAyahNumber(ayahNum);
    const elem = document.getElementById(`review-ayah-${ayahNum}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isOpen) return null;

  const currentAyahObj = loadedAyahs.find((a) => a.numberInSurah === currentVerse) || null;
  const nextAyahObj = loadedAyahs.find((a) => a.numberInSurah === currentVerse + 1) || null;
  const totalRangeCount = Math.max(1, toAyah - fromAyah + 1);
  const currentProgressCount = Math.min(totalRangeCount, Math.max(1, currentVerse - fromAyah + 1));
  const progressPercent = Math.min(100, Math.round((currentProgressCount / totalRangeCount) * 100));

  return (
    <div
      id="tasmee3-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="tasmee3-modal-container"
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-4 sm:p-7 flex flex-col justify-between transition-all transform-gpu my-auto ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-xl'
        }`}
      >
        {/* TOP BRANDING BAR */}
        <div className={`flex items-center justify-between pb-3.5 border-b mb-4 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm ${
              isDark ? 'bg-[#1B1D23] border-white/[0.1] text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <Mic className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'تسميع القرآن الصوتي' : 'Tasme3 2.0'}
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isDark ? 'bg-white/[0.06] border-white/[0.1] text-[#F3F4F6]' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
                }`}>
                  {isArabic ? 'استماع وتتبع التلاوة' : 'Qur’an Recitation Listening'}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'تتبع مستمر للتلاوة مع كشف الكلمات والآيات في القرآن الكريم'
                  : 'Continuous recitation tracking with Qur’anic Arabic mistake analysis'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-tasmee3"
            onClick={handleClose}
            className={`p-1.5 rounded-xl active:scale-90 transition-all ${
              isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.04]'
            }`}
            title={isArabic ? 'إغلاق التسميع' : 'Close Tasmee3'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: CHOOSE EXACTLY WHAT YOU WANT TO RECITE */}
        {viewMode === 'setup' && (
          <div className="space-y-5">
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
              }`}
            >
              <div className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isArabic ? 'اختر نطاق التسميع المبارك:' : 'Choose your recitation range:'}</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'اختر السورة والآيات التي تريد تسميعها. عند البدء، يستمع نور لتلاوتك بشكل متواصل دون مقاطعة.'
                  : 'Select a Surah and choose your exact starting and ending Ayah. When you start, Noor listens continuously with no interruptions.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold flex items-center justify-between ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                <span>{isArabic ? 'اختيار السورة الكريمة:' : 'Select Surah:'}</span>
                <span className={`font-arabic text-sm ${isDark ? 'text-white' : 'text-[#111214]'}`}>{selectedSurah.name}</span>
              </label>
              <select
                id="tasmee3-surah-select"
                value={selectedSurah.number}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  const found = ALL_SURAHS.find((s) => s.number === num);
                  if (found) {
                    setSelectedSurah(found);
                    setFromAyah(1);
                    setToAyah(Math.min(10, found.numberOfAyahs));
                    setCurrentVerse(1);
                  }
                }}
                className={`w-full p-3 rounded-2xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] focus:ring-white/25'
                    : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] focus:ring-black/20'
                }`}
              >
                {ALL_SURAHS.map((s) => (
                  <option
                    key={s.number}
                    value={s.number}
                    className={isDark ? 'bg-[#14161A] text-[#F3F4F6]' : 'bg-white text-[#111214]'}
                  >
                    {s.number}. {isArabic ? `سورة ${s.name}` : `${s.englishName} (${s.name})`} — {s.numberOfAyahs} {isArabic ? 'آيات' : 'Ayahs'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{isArabic ? 'من الآية:' : 'From Ayah:'}</label>
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{isArabic ? `الآية ${fromAyah}` : `Ayah ${fromAyah}`}</span>
                </div>
                <input
                  id="tasmee3-from-ayah-slider"
                  type="range"
                  min="1"
                  max={toAyah}
                  value={fromAyah}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFromAyah(val);
                    if (val > toAyah) setToAyah(val);
                  }}
                  className={`w-full cursor-pointer h-2 rounded-lg ${isDark ? 'accent-white bg-white/[0.12]' : 'accent-[#111214] bg-black/[0.12]'}`}
                />
                <div className={`flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  <span>{isArabic ? 'الآية ١' : 'Ayah 1'}</span>
                  <span>{isArabic ? `الأقصى: الآية ${toAyah}` : `Max: Ayah ${toAyah}`}</span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{isArabic ? 'إلى الآية:' : 'To Ayah:'}</label>
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{isArabic ? `الآية ${toAyah}` : `Ayah ${toAyah}`}</span>
                </div>
                <input
                  id="tasmee3-to-ayah-slider"
                  type="range"
                  min={fromAyah}
                  max={selectedSurah.numberOfAyahs}
                  value={toAyah}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setToAyah(val);
                  }}
                  className={`w-full accent-emerald-500 cursor-pointer h-2 rounded-lg ${isDark ? 'bg-stone-700/60' : 'bg-stone-200'}`}
                />
                <div className={`flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span>{isArabic ? `الأدنى: الآية ${fromAyah}` : `Min: Ayah ${fromAyah}`}</span>
                  <span>{isArabic ? `نهاية السورة: ${selectedSurah.numberOfAyahs}` : `End of Surah: ${selectedSurah.numberOfAyahs}`}</span>
                </div>
              </div>
            </div>

            {/* Quick Range Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'نطاق سريع:' : 'Quick Range:'}</span>
              <button
                onClick={() => handleSetPreset('1-5')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === 5
                    ? isDark ? 'bg-white text-[#111214] border-white' : 'bg-[#111214] text-white border-[#111214]'
                    : isDark
                    ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08] hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08] hover:bg-black/[0.05]'
                }`}
              >
                {isArabic ? 'الآيات ١ ← ٥' : 'Ayah 1 → 5'}
              </button>
              <button
                onClick={() => handleSetPreset('1-10')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === 10
                    ? isDark ? 'bg-white text-[#111214] border-white' : 'bg-[#111214] text-white border-[#111214]'
                    : isDark
                    ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08] hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08] hover:bg-black/[0.05]'
                }`}
              >
                {isArabic ? 'الآيات ١ ← ١٠' : 'Ayah 1 → 10'}
              </button>
              {selectedSurah.numberOfAyahs >= 20 && (
                <button
                  onClick={() => handleSetPreset('1-20')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                    fromAyah === 1 && toAyah === 20
                      ? isDark ? 'bg-white text-[#111214] border-white' : 'bg-[#111214] text-white border-[#111214]'
                      : isDark
                      ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08] hover:bg-white/[0.08]'
                      : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08] hover:bg-black/[0.05]'
                  }`}
                >
                  {isArabic ? 'الآيات ١ ← ٢٠' : 'Ayah 1 → 20'}
                </button>
              )}
              <button
                onClick={() => handleSetPreset('full')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === selectedSurah.numberOfAyahs
                    ? isDark ? 'bg-white text-[#111214] border-white' : 'bg-[#111214] text-white border-[#111214]'
                    : isDark
                    ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08] hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08] hover:bg-black/[0.05]'
                }`}
              >
                {isArabic ? `كامل السورة (١ ← ${selectedSurah.numberOfAyahs})` : `Entire Surah (1 → ${selectedSurah.numberOfAyahs})`}
              </button>
            </div>

            <div
              className={`p-4 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.1]'
                  : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? 'النطاق المحدد' : 'Selected Range'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold font-mono ${
                  isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                }`}>
                  {isArabic ? `${totalRangeCount} آيات في الجلسة` : `${totalRangeCount} Ayahs in session`}
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className={`text-base sm:text-lg font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {isArabic ? `سورة ${selectedSurah.name} · الآيات ${fromAyah} ← ${toAyah}` : `Surah ${selectedSurah.englishName} · Ayah ${fromAyah} → Ayah ${toAyah}`}
                  </h3>
                  {!isArabic && (
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {selectedSurah.englishNameTranslation} • {selectedSurah.revelationType}
                    </p>
                  )}
                </div>
                <div dir="rtl" className={`font-arabic text-xl sm:text-2xl ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  سُورَةُ {selectedSurah.name} (الآيات {fromAyah}–{toAyah})
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-1">
              <button
                id="btn-start-tasmee3-session"
                onClick={handleStartSession}
                disabled={isLoadingAyahs}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 ${
                  isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isArabic ? `بدء التسميع (الآيات ${fromAyah} ← ${toAyah})` : `Start Tasme3 (Ayah ${fromAyah} → ${toAyah})`}</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'permission_info' && (
          <div className="space-y-4 py-4 text-center">
            <div className={`w-14 h-14 rounded-3xl border flex items-center justify-center mx-auto ${
              isDark ? 'bg-[#1B1D23] border-white/[0.12] text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <MicOff className="w-7 h-7" />
            </div>
            <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? 'إذن استخدام الميكروفون مطلوب' : 'Microphone Access Required'}
            </h3>
            <div className={`max-w-md mx-auto text-xs leading-relaxed space-y-2 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              <p>
                {isArabic
                  ? 'يستمع نظام التسميع لتلاوتك الكريمة بشكل متواصل لتتبع الآيات ورصد أي كلمة ساقطة أو مكررة بدقة.'
                  : 'Tasme3 continuously listens as you recite to detect each verse progression and identify skipped or repeated words in authentic Qur\'anic Arabic.'}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? '• تتم معالجة الصوت أثناء الجلسة فقط ولا يتم تخزينه أو مشاركته إطلاقاً.'
                  : '• Audio is processed strictly in your session and is never permanently stored or shared.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setViewMode('setup')}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold active:scale-95 transition-all ${
                  isDark ? 'border-white/[0.1] text-stone-300 hover:bg-white/[0.06]' : 'border-black/[0.1] text-[#3F4248] hover:bg-black/[0.04]'
                }`}
              >
                {isArabic ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handleStartSession}
                className={`px-5 py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5 ${
                  isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السماح بالميكروفون والبدء' : 'Allow Microphone & Recite'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ONE CONTINUOUS LISTENING SESSION & LIVE QUR'AN TRACKING           */}
        {/* ========================================================================= */}
        {viewMode === 'active' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-3xl border flex flex-col gap-2.5 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm sm:text-base font-mono font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {isArabic ? `الآية ${currentVerse} من ${toAyah}` : `Ayah ${currentVerse} / ${toAyah}`}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      ({isArabic ? `النطاق: ${fromAyah}–${toAyah}` : `Range: ${fromAyah}–${toAyah}`})
                    </span>
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {isArabic ? `سورة ${selectedSurah.name}` : `Surah ${selectedSurah.englishName} (${selectedSurah.name})`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      status === 'listening'
                        ? isSilenceWaiting
                          ? isDark ? 'bg-white/[0.08] border-white/[0.15] text-stone-300' : 'bg-white border-black/[0.12] text-[#3F4248]'
                          : isDark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : status === 'paused'
                        ? isDark ? 'bg-white/[0.08] border-white/[0.15] text-stone-300' : 'bg-white border-black/[0.12] text-[#3F4248]'
                        : isDark ? 'bg-[#0B0C0E] border-white/[0.08] text-stone-400' : 'bg-white border-black/[0.08] text-[#5A5D63]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'listening'
                          ? isSilenceWaiting
                            ? isDark ? 'bg-stone-400' : 'bg-[#5A5D63]'
                            : 'bg-emerald-500 animate-ping'
                          : isDark ? 'bg-stone-500' : 'bg-[#6B6F76]'
                      }`}
                    />
                    <span>
                      {status === 'listening'
                        ? isSilenceWaiting
                          ? (isArabic ? 'يستمع... خذ وقتك بالسكينة' : 'Listening… Take your time')
                          : (isArabic ? 'يستمع لتلاوتك...' : 'Listening...')
                        : status === 'paused'
                        ? (isArabic ? 'متوقف مؤقتاً' : 'Paused')
                        : (isArabic ? 'متوقف' : 'Stopped')}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Tasmee3Waveform
              audioLevel={audioLevel}
              isListening={status === 'listening'}
              isPaused={status === 'paused'}
              isDark={isDark}
              height={52}
            />

            <div
              className={`px-4 py-2 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#0B0C0E] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span className={`text-[10px] shrink-0 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'ما تم رصده:' : 'Detected:'}</span>
                <span dir="rtl" className={`font-arabic text-sm truncate ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {spokenTextPreview || (isArabic ? 'في انتظار تلاوتك الكريمة... اتلُ بوضوح' : 'Waiting for recitation... recite clearly')}
                </span>
              </div>
              <span className={`text-[10px] shrink-0 font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? 'انتقال تلقائي مع التلاوة' : 'No next button required'}
              </span>
            </div>

            <div
              className={`p-5 sm:p-6 rounded-3xl border text-center transition-all ${
                isDark
                  ? 'bg-[#0B0C0E] border-white/[0.08]'
                  : 'bg-[#FCFCFA] border-black/[0.08] shadow-xs'
              }`}
            >
              <div className={`flex items-center justify-between text-xs mb-3 pb-2 border-b ${
                isDark ? 'border-white/[0.08] text-stone-400' : 'border-black/[0.08] text-[#5A5D63]'
              }`}>
                <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {isArabic ? `الآية الحالية المطلوبة [الآية ${currentVerse}]` : `Currently Reciting [Ayah ${currentVerse}]`}
                </span>
                <span className={`font-arabic text-sm ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {selectedSurah.name} : {currentVerse}
                </span>
              </div>

              {currentAyahObj ? (
                <div className="space-y-4">
                  <div
                    dir="rtl"
                    className={`font-arabic text-2xl sm:text-3xl leading-[2.5] font-normal tracking-wide px-2 select-text ${
                      isDark ? 'text-white' : 'text-[#111214]'
                    }`}
                  >
                    {currentAyahObj.text}
                    <span className={`font-sans text-xs px-2.5 py-0.5 rounded-full border mr-2 inline-block ${
                      isDark ? 'border-white/[0.2] text-[#F3F4F6]' : 'border-black/[0.15] text-[#111214]'
                    }`}>
                      ۝{currentVerse}
                    </span>
                  </div>

                  {!isArabic && currentAyahObj.translation && (
                    <div
                      className={`text-xs sm:text-sm leading-relaxed max-w-xl mx-auto pt-3 border-t ${
                        isDark ? 'border-white/[0.08] text-stone-300' : 'border-black/[0.08] text-[#3F4248]'
                      }`}
                    >
                      {currentAyahObj.translation}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`py-6 text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? 'جاري تحميل نص الآية الكريمة...' : 'Loading verse text...'}
                </div>
              )}

              {nextAyahObj && currentVerse < toAyah && (
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-white/[0.08] text-stone-400' : 'border-black/[0.08] text-[#5A5D63]'
                }`}>
                  <span>{isArabic ? `الآية التالية (${currentVerse + 1}):` : `Upcoming Ayah ${currentVerse + 1}:`}</span>
                  <span dir="rtl" className={`font-arabic truncate max-w-[280px] ${isDark ? 'text-stone-300' : 'text-[#111214]'}`}>
                    {nextAyahObj.text}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
              {status === 'listening' ? (
                <button
                  id="btn-tasmee3-pause"
                  onClick={handlePause}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-[#1B1D23] hover:bg-white/[0.1] text-white border-white/[0.12]'
                      : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214] border-black/[0.1]'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  <span>{isArabic ? 'إيقاف مؤقت' : 'Pause'}</span>
                </button>
              ) : (
                <button
                  id="btn-tasmee3-resume"
                  onClick={handleResume}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>{isArabic ? 'متابعة' : 'Resume'}</span>
                </button>
              )}

              <button
                id="btn-tasmee3-stop"
                onClick={handleStop}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl border font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-[#1B1D23] hover:bg-white/[0.1] text-stone-300 border-white/[0.1]'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#3F4248] border-black/[0.1]'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إيقاف' : 'Stop'}</span>
              </button>

              <button
                id="btn-tasmee3-finish"
                onClick={handleFinish}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isArabic ? 'إنهاء ومراجعة' : 'Finish & Review'}</span>
              </button>
            </div>

            <p className={`text-[10px] text-center ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {isArabic
                ? 'اتلُ بتمهل وطمأنينة، وسينتقل تطبيق نور تلقائياً عند إتمام كل آية.'
                : 'Recite naturally at your own pace. Noor moves forward automatically when you finish each ayah.'}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: THE WOW SCREEN 🤯 (AUTHENTIC REVIEW & MISTAKE BREAKDOWN)          */}
        {/* ========================================================================= */}
        {viewMode === 'review' && rangeResult && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div dir="rtl" className={`font-arabic text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                تَسْمِيع مُكْتَمِل
              </div>
              <div className={`text-sm sm:text-base font-serif-heading font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {isArabic
                  ? `سورة ${rangeResult.surahName} · الآيات ${rangeResult.fromAyah}–${rangeResult.toAyah}`
                  : `Surah ${rangeResult.surahEnglishName} (${rangeResult.surahName}) · Ayah ${rangeResult.fromAyah}–${rangeResult.toAyah}`}
              </div>
              <div className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <span className={`font-bold font-mono text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {rangeResult.completedAyahsCount} / {rangeResult.totalRangeAyahs}
                </span>{' '}
                {isArabic
                  ? `آيات مكتملة • المدة: ${Math.floor(rangeResult.durationSeconds / 60)} د ${rangeResult.durationSeconds % 60} ث`
                  : `Ayahs completed • Duration: ${Math.floor(rangeResult.durationSeconds / 60)}m ${rangeResult.durationSeconds % 60}s`}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  filterStatus === 'all'
                    ? isDark ? 'bg-white text-[#111214] border-white' : 'bg-[#111214] text-white border-[#111214]'
                    : isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                {isArabic ? 'الكل' : 'All'} ({rangeResult.ayahReviews.length})
              </button>

              <button
                onClick={() => setFilterStatus('correct')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'correct'
                    ? isDark ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500' : 'bg-emerald-50 text-emerald-800 border-emerald-400'
                    : isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isArabic ? 'متقنة' : 'Correct'} ({rangeResult.ayahReviews.filter((r) => r.status === 'correct').length})</span>
              </button>

              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'warning'
                    ? isDark ? 'bg-sky-500/25 text-sky-300 border-sky-500' : 'bg-sky-50 text-sky-800 border-sky-400'
                    : isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>{isArabic ? 'تنبيه' : 'Possible issue'} ({rangeResult.ayahReviews.filter((r) => r.status === 'warning').length})</span>
              </button>

              <button
                onClick={() => setFilterStatus('missing')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'missing'
                    ? isDark ? 'bg-rose-500/25 text-rose-300 border-rose-500' : 'bg-rose-50 text-rose-800 border-rose-400'
                    : isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{isArabic ? 'مفقودة / غير مطابقة' : 'Missing/incorrect'} ({rangeResult.ayahReviews.filter((r) => r.status === 'missing').length})</span>
              </button>
            </div>

            <div
              className={`p-3.5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <div className={`flex items-center justify-between text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{isArabic ? 'تفصيل نتيجة التسميع:' : 'Your Recitation Breakdown:'}</span>
                <span className="text-[10px]">{isArabic ? 'انقر على الآية للمعاينة' : 'Tap an ayah to inspect'}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {rangeResult.ayahReviews.map((rev) => {
                  const isSelected = selectedReviewAyahNumber === rev.ayahNumber;
                  const isCorrect = rev.status === 'correct';
                  const isWarning = rev.status === 'warning';

                  return (
                    <button
                      key={rev.ayahNumber}
                      onClick={() => handleJumpToReviewAyah(rev.ayahNumber)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? isDark ? 'ring-2 ring-white/50 scale-105' : 'ring-2 ring-[#111214]/40 scale-105'
                          : ''
                      } ${
                        isCorrect
                          ? isDark ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : isWarning
                          ? isDark ? 'bg-sky-500/15 border-sky-500/35 text-sky-300' : 'bg-sky-50 border-sky-300 text-sky-800'
                          : isDark ? 'bg-rose-500/15 border-rose-500/35 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
                      }`}
                    >
                      <span>{isArabic ? `الآية ${rev.ayahNumber}` : `Ayah ${rev.ayahNumber}`}</span>
                      {isCorrect ? (
                        <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      ) : isWarning ? (
                        <AlertTriangle className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                      ) : (
                        <X className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={passageContainerRef}
              className="space-y-3 max-h-[340px] overflow-y-auto pr-1"
            >
              {rangeResult.ayahReviews
                .filter((rev) => filterStatus === 'all' || rev.status === filterStatus)
                .map((rev) => {
                  const isSelected = selectedReviewAyahNumber === rev.ayahNumber;
                  const isCorrect = rev.status === 'correct';
                  const isWarning = rev.status === 'warning';

                  return (
                    <div
                      key={rev.ayahNumber}
                      id={`review-ayah-${rev.ayahNumber}`}
                      onClick={() => setSelectedReviewAyahNumber(rev.ayahNumber)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/35'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 shadow-sm'
                          : isDark
                          ? 'bg-[#0B0C0E] border-white/[0.08] hover:border-white/25'
                          : 'bg-white border-black/[0.08] hover:border-black/25'
                      } ${
                        isCorrect
                          ? 'border-l-4 border-l-emerald-500'
                          : isWarning
                          ? 'border-l-4 border-l-sky-500'
                          : 'border-l-4 border-l-rose-500'
                      }`}
                    >
                      <div className={`flex items-center justify-between pb-2 border-b mb-2.5 ${
                        isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            {isArabic ? `الآية ${rev.ayahNumber}` : `Ayah ${rev.ayahNumber}`}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isCorrect
                                ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isWarning
                                ? isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-50 text-sky-800 border border-sky-200'
                                : isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isCorrect
                              ? (isArabic ? 'متقنة' : 'Correct')
                              : isWarning
                              ? (isArabic ? 'تنبيه' : 'Possible issue')
                              : (isArabic ? 'مفقودة / غير مطابقة' : 'Missing/incorrect')}
                          </span>
                        </div>

                        <span className={`text-[11px] font-arabic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {selectedSurah.name} : {rev.ayahNumber}
                        </span>
                      </div>

                      <div
                        dir="rtl"
                        className={`font-arabic text-xl sm:text-2xl leading-[2.3] font-normal ${isDark ? 'text-white' : 'text-[#111214]'}`}
                      >
                        {rev.words.map((w, wIdx) => {
                          const isWordCorrect = w.status === 'correct';
                          const isWordSkipped = w.status === 'skipped';
                          const isWordRepeated = w.status === 'repeated';
                          const isWordWrong = w.status === 'wrong';

                          return (
                            <span
                              key={wIdx}
                              className={`inline-block mx-1 px-1 rounded-lg transition-colors ${
                                isWordCorrect
                                  ? 'hover:bg-emerald-500/10'
                                  : isWordSkipped
                                  ? isDark ? 'text-rose-400 bg-rose-500/10 underline decoration-rose-500/60' : 'text-rose-700 bg-rose-50 underline decoration-rose-500/60'
                                  : isWordRepeated
                                  ? isDark ? 'text-sky-300 bg-sky-500/15' : 'text-sky-800 bg-sky-100'
                                  : isWordWrong
                                  ? isDark ? 'text-sky-300 bg-sky-500/20' : 'text-sky-800 bg-sky-100'
                                  : ''
                              }`}
                              title={w.explanation || w.canonicalWord}
                            >
                              {w.canonicalWord}
                            </span>
                          );
                        })}
                        <span className={`font-sans text-xs px-2 py-0.5 rounded-full border mr-1.5 inline-block ${
                          isDark ? 'border-white/[0.15] text-[#F3F4F6]' : 'border-black/[0.12] text-[#111214]'
                        }`}>
                          ۝{rev.ayahNumber}
                        </span>
                      </div>

                      <div className={`mt-3 pt-2 border-t space-y-1 text-xs ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                        {rev.spokenTextSnippet ? (
                          <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                            <span className={`shrink-0 font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{isArabic ? 'المقروء:' : 'Recited:'}</span>
                            <span dir="rtl" className={`font-arabic truncate ${isDark ? 'text-stone-300' : 'text-[#111214]'}`}>
                              "{rev.spokenTextSnippet}"
                            </span>
                          </div>
                        ) : (
                          <div className={`text-[11px] italic ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                            {isArabic ? 'لم يُرصد صوت تلاوة لهذه الآية الكريمة.' : 'No recitation detected for this verse.'}
                          </div>
                        )}

                        {rev.summaryNotes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {rev.summaryNotes.map((note, nIdx) => (
                              <span
                                key={nIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  isCorrect
                                    ? isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                                    : isWarning
                                    ? isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-800'
                                    : isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                • {note}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className={`p-3 rounded-2xl border text-[11px] flex items-start gap-2 ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
            }`}>
              <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <div>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{isArabic ? 'تنويه إتقان التجويد:' : 'Tajweed Transparency Note:'}</span>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? 'يقوم نظام التسميع بالتحقق الدقيق من توالي الكلمات والآيات المباركة وفق النص القرآني المعتمد. أما مخارج الحروف وأحكام المدود والغُنن فمستحب عرضها على شيخٍ متقن.'
                    : 'Tasme3 2.0 performs genuine word and ayah sequence alignment against authoritative Qur’anic Arabic text. Vocalized Tajweed articulation (madd lengths, ghunnah, qalqalah) requires human Shaykh verification.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
              {onJumpToVerseInReader && (
                <button
                  onClick={() => {
                    onJumpToVerseInReader(selectedSurah, rangeResult.fromAyah);
                    handleClose();
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5 ${
                    isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'قراءة في المصحف' : 'Read in Quran Reader'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setViewMode('active');
                  handleStartSession();
                }}
                className={`px-4 py-2.5 rounded-2xl border font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5 ${
                  isDark ? 'border-white/[0.12] bg-[#1B1D23] text-white hover:bg-white/[0.08]' : 'border-black/[0.1] bg-[#F3F3F1] text-[#111214] hover:bg-black/[0.06]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إعادة التسميع' : 'Recite Again'}</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('setup');
                }}
                className={`px-4 py-2.5 rounded-2xl border text-xs active:scale-95 transition-all ${
                  isDark ? 'border-white/[0.1] text-stone-300 hover:bg-white/[0.06]' : 'border-black/[0.1] text-[#3F4248] hover:bg-black/[0.04]'
                }`}
              >
                {isArabic ? 'تغيير النطاق' : 'Change Range'}
              </button>

              <button
                onClick={handleClose}
                className={`px-4 py-2.5 rounded-2xl border text-xs active:scale-95 transition-all ${
                  isDark ? 'border-white/[0.1] text-stone-300 hover:bg-white/[0.06]' : 'border-black/[0.1] text-[#3F4248] hover:bg-black/[0.04]'
                }`}
              >
                {isArabic ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
