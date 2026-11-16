import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, AlignRight, Languages, Check, SlidersHorizontal, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';
import { MushafLayout, MushafEdition } from '../types/mushaf';

interface MushafLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
  activeLayout: MushafLayout;
  onSelectLayout: (layout: MushafLayout) => void;
  activeEdition: MushafEdition;
  onSelectEdition: (edition: MushafEdition) => void;
  showTransliteration: boolean;
  onToggleTransliteration: (val: boolean) => void;
  showTranslation: boolean;
  onToggleTranslation: (val: boolean) => void;
  enableTajweedColors: boolean;
  onToggleTajweedColors: (val: boolean) => void;
  arabicFontSize: number;
  onChangeArabicFontSize: (val: number) => void;
  onOpenTajweedLegend: () => void;
}

export const MushafLayoutModal: React.FC<MushafLayoutModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
  activeLayout,
  onSelectLayout,
  activeEdition,
  onSelectEdition,
  showTransliteration,
  onToggleTransliteration,
  showTranslation,
  onToggleTranslation,
  enableTajweedColors,
  onToggleTajweedColors,
  arabicFontSize,
  onChangeArabicFontSize,
  onOpenTajweedLegend,
}) => {
  if (!isOpen) return null;

  const layoutOptions = [
    {
      id: 'book' as MushafLayout,
      title: isArabic ? 'مصحف المدينة (صفحات كاملة)' : 'Book (Madani Mushaf)',
      subtitle: isArabic ? 'العرض الأصلي لمصحف مجمع الملك فهد (١٤٠٥هـ) بصفحاته الـ ٦٠٤ كاملة' : 'Traditional 604-page Madani Mushaf (1405 AH) with authentic page divisions',
      icon: Book,
      badge: isArabic ? 'التقليدي الأصيل' : 'Traditional'
    },
    {
      id: 'text' as MushafLayout,
      title: isArabic ? 'النص القرآني (آية آية)' : 'Quran Text',
      subtitle: isArabic ? 'عرض الآيات بخط عثماني نقي وواضح مع التحكم التام بحجم الخط وسهولة القراءة' : 'Clean verse-by-verse text with smooth scrolling and adjustable Arabic calligraphy',
      icon: AlignRight,
      badge: isArabic ? 'قراءة سلسة' : 'Clean Text'
    },
    {
      id: 'translation' as MushafLayout,
      title: isArabic ? 'الترجمة واللفظ الصوتي' : 'Translation & Transliteration',
      subtitle: isArabic ? 'عرض النص العربي مع ترجمة المعاني المعتمدة والنطق الصوتي اللاتيني' : 'Arabic verses alongside verified translation and optional phonetic transliteration',
      icon: Languages,
      badge: isArabic ? 'تدبر ودراسة' : 'Study Mode'
    }
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border shadow-2xl max-h-[88vh] flex flex-col relative overflow-hidden ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3.5 border-b mb-4 shrink-0 ${
            isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-white/[0.06] border-white/[0.1] text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}>
                <Book className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'تخطيط المصحف الشريف' : 'Mushaf Layout'}
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? 'اختر طريقة العرض المفضلة ومصحف القراءة' : 'Select your reading layout and Mushaf edition'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl active:scale-90 transition-all cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
              }`}
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto pr-1 space-y-5 no-scrollbar flex-1 pb-2">
            {/* 1. Reading Layout Options */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'طريقة القراءة والعرض' : 'Reading Layout'}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? '٣ طرق عرض معتمدة' : '3 Verified Views'}
                </span>
              </div>

              <div className="space-y-2.5">
                {layoutOptions.map((opt) => {
                  const isSelected = activeLayout === opt.id;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectLayout(opt.id)}
                      className={`w-full p-3.5 rounded-2xl text-left rtl:text-right border transition-all duration-200 cursor-pointer active:scale-[0.99] relative overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/35 text-white'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] shadow-xs'
                          : isDark
                          ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06]'
                          : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.18] hover:bg-black/[0.03]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Radio Icon Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? isDark
                                ? 'border-white bg-white text-[#111214]'
                                : 'border-[#111214] bg-[#111214] text-white'
                              : isDark ? 'border-stone-500 bg-transparent' : 'border-stone-400 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Layout Icon & Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`w-4 h-4 ${isSelected ? (isDark ? 'text-white' : 'text-[#111214]') : (isDark ? 'text-stone-400' : 'text-[#5A5D63]')}`} />
                              <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? (isDark ? 'text-white' : 'text-[#111214]') : ''}`}>
                                {opt.title}
                              </span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-medium border shrink-0 ${
                              isDark ? 'bg-white/[0.06] text-stone-300 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                            }`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mushaf Edition Selection */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'طبعة المصحف الشريف' : 'Mushaf Edition'}
                </span>
                <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>
                  <ShieldCheck className="w-3 h-3" />
                  {isArabic ? 'موثق ومعتمد' : 'Verified'}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  activeEdition === 'madani-1405'
                    ? isDark
                      ? 'bg-white/[0.08] border-white/30 shadow-sm'
                      : 'bg-[#111214]/[0.05] border-[#111214]/35'
                    : isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm shrink-0 ${
                      isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                    }`}>
                      ١٤٠٥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                          {isArabic ? 'مصحف المدينة المنورة (١٤٠٥هـ)' : 'Madani Mushaf (1405 AH)'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md border font-semibold ${
                          isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}>
                          {isArabic ? 'المعتمد الرسمي' : 'Official Print'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic
                          ? 'مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة - الخطاط عثمان طه (٦٠٤ صفحة)'
                          : 'King Fahd Complex for Printing the Holy Quran, Medina - Calligrapher Uthman Taha (604 pages)'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Reading Customization Options */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'إعدادات القراءة والخط' : 'Reading Customization'}
                </span>
                <SlidersHorizontal className={`w-3.5 h-3.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
                }`}
              >
                {/* Arabic Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-medium ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {isArabic ? 'حجم الخط العربي' : 'Arabic Font Size'}
                    </span>
                    <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{arabicFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="44"
                    step="1"
                    value={arabicFontSize}
                    onChange={(e) => onChangeArabicFontSize(Number(e.target.value))}
                    className={`w-full cursor-pointer h-2 rounded-lg ${isDark ? 'accent-white bg-white/[0.14]' : 'accent-[#111214] bg-black/[0.12]'}`}
                  />
                  <div className={`text-right font-arabic text-sm mt-1 select-none ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                </div>

                {/* Transliteration Toggle */}
                <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                  <div>
                    <div className="text-xs font-semibold">
                      {isArabic ? 'اللفظ الصوتي اللاتيني (Transliteration)' : 'Phonetic Transliteration'}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {isArabic ? 'مساعدة نطق الكلمات بالحروف اللاتينية' : 'Romanized pronunciation guide beneath verses'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTransliteration(!showTransliteration)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      showTransliteration
                        ? isDark ? 'bg-white' : 'bg-[#111214]'
                        : isDark ? 'bg-white/[0.16]' : 'bg-black/[0.16]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full shadow-sm transition-transform ${
                        showTransliteration && isDark ? 'bg-[#111214]' : 'bg-white'
                      } ${
                        showTransliteration ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Tajweed Colors Toggle & Legend Button */}
                <div className={`space-y-2.5 pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{isArabic ? 'ألوان أحكام التجويد' : 'Tajweed Rule Colors'}</span>
                        <Sparkles className={`w-3 h-3 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic ? 'تمييز الغنة والمدود والقلقلة' : 'Visual color guidance for Ghunnah, Madd and Qalqalah'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleTajweedColors(!enableTajweedColors)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        enableTajweedColors
                          ? isDark ? 'bg-white' : 'bg-[#111214]'
                          : isDark ? 'bg-white/[0.16]' : 'bg-black/[0.16]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full shadow-sm transition-transform ${
                          enableTajweedColors && isDark ? 'bg-[#111214]' : 'bg-white'
                        } ${
                          enableTajweedColors ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Button to Open Tajweed Legend */}
                  <button
                    type="button"
                    onClick={onOpenTajweedLegend}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.06] border-white/[0.1] text-stone-200 hover:bg-white/[0.12]'
                        : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] hover:bg-black/[0.08]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {isArabic ? '📖 عرض دليل أحكام التجويد والأسطورة' : '📖 View Tajweed Rules Legend'}
                    </span>
                  </button>
                </div>

                {/* Translation Toggle */}
                <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                  <div>
                    <div className="text-xs font-semibold">
                      {isArabic ? 'إظهار الترجمة المعتمدة' : 'Show Verified Translation'}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {isArabic ? 'ترجمة معاني الآيات باللغة المختارة' : 'Displays approved translation below verses'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTranslation(!showTranslation)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      showTranslation
                        ? isDark ? 'bg-white' : 'bg-[#111214]'
                        : isDark ? 'bg-white/[0.16]' : 'bg-black/[0.16]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full shadow-sm transition-transform ${
                        showTranslation && isDark ? 'bg-[#111214]' : 'bg-white'
                      } ${
                        showTranslation ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Button */}
          <div className={`pt-3 border-t mt-2 shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isArabic ? 'تطبيق وحفظ التفضيلات' : 'Apply & Save Preferences'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
