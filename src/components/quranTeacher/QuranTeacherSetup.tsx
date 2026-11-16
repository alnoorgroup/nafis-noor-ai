import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  GraduationCap,
  Play,
  Flame,
  ArrowRight,
  Sliders,
  ChevronDown,
  X
} from 'lucide-react';
import { Surah } from '../../types';
import { ALL_SURAHS } from '../../data/quranData';
import { QuranTeacherMode, QuranTeacherVoiceId, QuranTeacherLanguage } from '../../types/quranTeacher';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherSetupProps {
  isDark: boolean;
  initialSurahNumber?: number;
  initialStartAyah?: number;
  initialEndAyah?: number;
  onStartLesson: (
    surah: Surah,
    startAyah: number,
    endAyah: number,
    mode: QuranTeacherMode,
    voice: QuranTeacherVoiceId,
    language: QuranTeacherLanguage
  ) => void;
  onClose: () => void;
}

export const QuranTeacherSetup: React.FC<QuranTeacherSetupProps> = ({
  isDark,
  initialSurahNumber = 1,
  initialStartAyah = 1,
  initialEndAyah = 7,
  onStartLesson,
  onClose,
}) => {
  const isArabic = getLanguageCode() === 'ar';

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
  const [surahSearch, setSurahSearch] = useState('');
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<QuranTeacherVoiceId>('Fenrir');
  const [selectedLanguage, setSelectedLanguage] = useState<QuranTeacherLanguage>(isArabic ? 'ar' : 'en');

  const selectedSurah = useMemo(() => {
    return ALL_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_SURAHS[0];
  }, [selectedSurahNumber]);

  const maxAyahs = selectedSurah.numberOfAyahs;

  const [startAyah, setStartAyah] = useState<number>(() => {
    return Math.min(Math.max(1, initialStartAyah), maxAyahs);
  });

  const [endAyah, setEndAyah] = useState<number>(() => {
    if (selectedSurah.number === 1) return 7;
    return Math.min(Math.max(startAyah, initialEndAyah || Math.min(startAyah + 6, maxAyahs)), maxAyahs);
  });

  const [selectedMode, setSelectedMode] = useState<QuranTeacherMode>('learn');

  // Filter Surahs by search query (Arabic name, English name, number)
  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return ALL_SURAHS;
    const q = surahSearch.toLowerCase().trim();
    return ALL_SURAHS.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q
    );
  }, [surahSearch]);

  const totalAyahsSelected = useMemo(() => {
    return Math.max(1, endAyah - startAyah + 1);
  }, [startAyah, endAyah]);

  // Quick preset ranges with deduplicated, unique keys
  const presetOptions = useMemo(() => {
    const defaultSteps = [3, 5, 7, 10];
    const validSteps = defaultSteps.filter((n) => n < maxAyahs);
    const result: { count: number; isFull: boolean; key: string }[] = validSteps.map((n) => ({
      count: n,
      isFull: false,
      key: `step-${n}`,
    }));
    result.push({
      count: maxAyahs,
      isFull: true,
      key: `full-surah-${maxAyahs}`,
    });
    return result;
  }, [maxAyahs]);

  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    const surah = ALL_SURAHS.find((s) => s.number === surahNum) || ALL_SURAHS[0];
    setStartAyah(1);
    setEndAyah(Math.min(7, surah.numberOfAyahs));
    setIsSurahDropdownOpen(false);
    setSurahSearch('');
  };

  const handleStartAyahChange = (val: number) => {
    const clamped = Math.min(Math.max(1, val), maxAyahs);
    setStartAyah(clamped);
    if (endAyah < clamped) {
      setEndAyah(clamped);
    }
  };

  const handleEndAyahChange = (val: number) => {
    const clamped = Math.min(Math.max(startAyah, val), maxAyahs);
    setEndAyah(clamped);
  };

  // Quick preset ranges
  const setPresetRange = (count: number) => {
    const targetEnd = Math.min(startAyah + count - 1, maxAyahs);
    setEndAyah(targetEnd);
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-[32px] p-6 sm:p-8 border shadow-md transition-all duration-200 ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between pb-5 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
            isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
          }`}>
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif-heading tracking-wide">
                {isArabic ? 'معلم القرآن التفاعلي' : 'Quran Teacher AI'}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isDark
                    ? 'bg-white/[0.06] text-[#F3F4F6] border-white/[0.1]'
                    : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                {isArabic ? 'جلسة صوتية حية' : 'Live Voice Session'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'تسميع صوتي مباشر وتصحيح تفاعلي مستمر مع توجيهات المعلم الموثوقة'
                : 'Interactive, continuous voice recitation with authentic teacher guidance'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-white/[0.06] hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 border-white/[0.1] hover:border-rose-500/30'
              : 'bg-[#F3F3F1] hover:bg-rose-50 text-[#3F4248] hover:text-rose-700 border-black/[0.08] hover:border-rose-300'
          }`}
          title={isArabic ? 'إغلاق المعلم والعودة' : 'Close and return'}
        >
          <X className="w-4 h-4" />
          <span>{isArabic ? 'إغلاق' : 'Close'}</span>
        </button>
      </div>

      {/* Surah Selection */}
      <div className="mt-6">
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          {isArabic ? 'اختيار السورة الكريمة' : 'Select Surah'}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/25 text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/25 text-[#111214]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-xs font-bold ${
                  isDark
                    ? 'bg-white/[0.08] text-white border-white/[0.12]'
                    : 'bg-white text-[#111214] border-black/[0.1]'
                }`}
              >
                {selectedSurah.number}
              </span>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span>{isArabic ? `سورة ${selectedSurah.name}` : selectedSurah.englishName}</span>
                  {!isArabic && (
                    <span className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>({selectedSurah.englishNameTranslation})</span>
                  )}
                </div>
                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? `${selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${selectedSurah.numberOfAyahs} آيات`
                    : `${selectedSurah.revelationType} • ${selectedSurah.numberOfAyahs} Ayahs`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`font-arabic text-xl ${isDark ? 'text-white' : 'text-[#111214]'}`}>{selectedSurah.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'} ${isSurahDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Surah Dropdown Menu */}
          {isSurahDropdownOpen && (
            <div
              className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border max-h-72 flex flex-col shadow-lg overflow-hidden ${
                isDark ? 'bg-[#14161A] border-white/[0.12]' : 'bg-white border-black/[0.1]'
              }`}
            >
              <div className={`p-3 border-b sticky top-0 bg-inherit ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder={isArabic ? 'ابحث عن السورة باسمها أو رقمها...' : 'Search Surah by name or number...'}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-[#0B0C0E] border-white/[0.1] text-white placeholder-stone-500 focus:border-white/40'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              <div className={`overflow-y-auto divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]'}`}>
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => handleSurahChange(surah.number)}
                    className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                      surah.number === selectedSurah.number
                        ? isDark
                          ? 'bg-white/[0.1] text-white font-semibold'
                          : 'bg-[#111214]/[0.06] text-[#111214] font-semibold'
                        : isDark
                        ? 'hover:bg-white/[0.05] text-stone-300'
                        : 'hover:bg-black/[0.03] text-[#3F4248]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-mono font-bold w-6 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{surah.number}</span>
                      <div>
                        <div className="text-xs font-semibold">{isArabic ? `سورة ${surah.name}` : surah.englishName}</div>
                        <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{isArabic ? `${surah.numberOfAyahs} آيات` : `${surah.numberOfAyahs} Ayahs`}</div>
                      </div>
                    </div>
                    <span className={`font-arabic text-base ${isDark ? 'text-white' : 'text-[#111214]'}`}>{surah.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ayah Range Selection */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            {isArabic ? 'نطاق الآيات المباركة للتسميع' : 'Recitation Range'}
          </label>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-white/[0.06] text-[#F3F4F6] border-white/[0.1]'
                : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}
          >
            {isArabic ? `تم تحديد ${totalAyahsSelected} آيات` : `${totalAyahsSelected} ${totalAyahsSelected === 1 ? 'Ayah' : 'Ayahs'} selected`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'آية البداية' : 'Starting Ayah'}</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                min={1}
                max={maxAyahs}
                value={startAyah}
                onChange={(e) => handleStartAyahChange(parseInt(e.target.value) || 1)}
                className={`w-20 font-mono text-xl font-bold bg-transparent outline-none ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              />
              <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>/ {maxAyahs}</span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'آية النهاية' : 'Ending Ayah'}</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                min={startAyah}
                max={maxAyahs}
                value={endAyah}
                onChange={(e) => handleEndAyahChange(parseInt(e.target.value) || startAyah)}
                className={`w-20 font-mono text-xl font-bold bg-transparent outline-none ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              />
              <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>/ {maxAyahs}</span>
            </div>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
          <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'خيارات سريعة:' : 'Presets:'}</span>
          {presetOptions.map((opt) => {
            const isFull = opt.isFull;
            const label = isFull ? (isArabic ? 'كامل السورة' : 'Full Surah') : `${opt.count} ${isArabic ? 'آيات' : 'Ayahs'}`;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPresetRange(opt.count)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  totalAyahsSelected === Math.min(opt.count, maxAyahs - startAyah + 1)
                    ? isDark
                      ? 'bg-white text-[#111214] font-semibold'
                      : 'bg-[#111214] text-white font-semibold'
                    : isDark
                    ? 'bg-[#1B1D23] text-stone-300 hover:bg-white/[0.08]'
                    : 'bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.06]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Mode Selection */}
      <div className="mt-6">
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          {isArabic ? 'نمط الجلسة التعليمية' : 'Lesson Mode'}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedMode('learn')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'learn'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'تعلّم وتلقين' : 'Learn'}</span>
              {selectedMode === 'learn' && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'توجيه خطوة بخطوة. المعلم يقرأ الآية ويؤكد صحة قراءتك.'
                : 'Step-by-step guidance. AI introduces each ayah and confirms accuracy.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('practice')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'practice'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'تسميع وممارسة' : 'Practice'}</span>
              {selectedMode === 'practice' && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'تسميع حر ومستقل مع تقييم الآيات وتثبيت الحفظ.'
                : 'Independent recitation. Less teacher intervention, evaluates on pause.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('revision')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'revision'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'مراجعة وتثبيت' : 'Revision'}</span>
              {selectedMode === 'revision' && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'تثبيت الحفظ في الذاكرة والتركيز على مواضع الإتقان.'
                : 'Memory reinforcement. Focuses on areas needing perfection.'}
            </p>
          </button>
        </div>
      </div>

      {/* Teacher Voice & Persona Selection */}
      <div className={`mt-6 pt-5 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          {isArabic ? 'نبرة صوت وشخصية المعلم' : 'AI Teacher Voice & Persona'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedVoice('Fenrir')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Fenrir'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الأستاذ راشد' : 'Ustadh Rashid'}</span>
              {selectedVoice === 'Fenrir' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'صوت وقور ورصين بنطق عربي فصيح وهادئ.' : 'Mature, calm & dignified voice with classical Arabic phonetics.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVoice('Kore')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Kore'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الأستاذة مريم' : 'Ustadha Maryam'}</span>
              {selectedVoice === 'Kore' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'صوت دافئ ومريح للنفس بنطق فائق الوضوح.' : 'Warm, serene & soothing voice with crystal-clear pronunciation.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVoice('Charon')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Charon'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الشيخ طارق' : 'Sheikh Tariq'}</span>
              {selectedVoice === 'Charon' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'صوت خاشع ومفكر مع وقفات متأنية ومريحة.' : 'Deep, reflective & measured voice with patient pauses.'}
            </p>
          </button>
        </div>
      </div>

      {/* Instruction Language Preference */}
      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          {isArabic ? 'لغة التوجيه والتعليم' : 'Instruction Language'}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedLanguage('ar')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedLanguage === 'ar'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-400'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#5A5D63]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-arabic text-base">العربية الفصحى</span>
              {selectedLanguage === 'ar' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'توجيهات وإرشادات باللغة العربية' : 'Classical Arabic teacher guidance'}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLanguage('en')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedLanguage === 'en'
                ? isDark
                  ? 'bg-white/[0.1] border-white/35 text-white ring-1 ring-white/25'
                  : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] ring-1 ring-[#111214]/20'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-400'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#5A5D63]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isArabic ? 'الإنجليزية مع المصطلحات' : 'English Bilingual'}</span>
              {selectedLanguage === 'en' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
            </div>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'شرح بالإنجليزية مع مصطلحات القرآن' : 'English with proper Arabic terms'}</p>
          </button>
        </div>
      </div>

      {/* Start Lesson Button */}
      <div className={`mt-8 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <button
          type="button"
          onClick={() =>
            onStartLesson(selectedSurah, startAyah, endAyah, selectedMode, selectedVoice, selectedLanguage)
          }
          className={`w-full py-4 px-6 rounded-2xl font-serif-heading font-bold text-sm tracking-wider uppercase shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2 ${
            isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isArabic ? `بدء جلسة التسميع (${totalAyahsSelected} آيات)` : `START LESSON (${totalAyahsSelected} AYAHS)`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className={`text-center text-[11px] mt-2.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
          {isArabic
            ? 'صوت تعليمي طبيعي ومريح · استماع تفاعلي مستمر'
            : 'Natural, gentle teacher recitation · Continuous listening session'}
        </p>
      </div>
    </div>
  );
};
