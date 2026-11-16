import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Surah } from '../../types';
import { ALL_SURAHS } from '../../data/quranData';
import { QuranTeacherSessionStats } from '../../types/quranTeacher';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherCompletionProps {
  isDark: boolean;
  stats: QuranTeacherSessionStats;
  onPracticeAgain: () => void;
  onClose: () => void;
}

export const QuranTeacherCompletion: React.FC<QuranTeacherCompletionProps> = ({
  isDark,
  stats,
  onPracticeAgain,
  onClose,
}) => {
  const isArabic = getLanguageCode() === 'ar';
  const [selectedAyahIndex, setSelectedAyahIndex] = useState<number | null>(null);
  const [showOnlyStruggled, setShowOnlyStruggled] = useState(false);

  const durationFormatted = `${Math.floor(stats.durationSeconds / 60)}${isArabic ? ' د ' : 'm '}${stats.durationSeconds % 60}${isArabic ? ' ث' : 's'}`;

  const displayedAyahs = showOnlyStruggled
    ? stats.finalAyahStatus.filter((a) => a.status === 'needs_practice')
    : stats.finalAyahStatus;

  const surahArabicName = ALL_SURAHS.find((s) => s.englishName === stats.surahEnglishName)?.name || stats.surahEnglishName;

  return (
    <div
      className={`w-full max-w-3xl mx-auto rounded-[36px] p-6 sm:p-8 border shadow-md transition-all duration-200 ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      {/* Top Trophy Header */}
      <div className={`relative text-center pb-6 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-0 right-0 p-2 rounded-xl transition-colors ${
            isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.04]'
          }`}
          title={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-4 ${
          isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
        }`}>
          <Award className="w-8 h-8" />
        </div>

        <span className={`text-[11px] font-cinzel font-bold tracking-widest uppercase ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
          {isArabic ? 'اكتمل الدرس بنجاح' : 'Lesson Complete'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading mt-1">
          {isArabic ? `سورة ${surahArabicName}` : `Surah ${stats.surahEnglishName}`}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
          {isArabic
            ? `الآيات من ${stats.startAyah} إلى ${stats.endAyah} • تلوت ${stats.totalAyahs} من ${stats.totalAyahs} آية`
            : `Ayahs ${stats.startAyah} to ${stats.endAyah} • ${stats.totalAyahs} / ${stats.totalAyahs} Recited`}
        </p>
      </div>

      {/* High-level Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}
        >
          <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'المكتملة بإتقان' : 'Completed'}</span>
          <span className={`text-xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {stats.completedAyahsCount}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}
        >
          <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'تحتاج تثبيتاً' : 'Needs Practice'}</span>
          <span
            className={`text-xl font-bold font-mono ${
              stats.struggledAyahsCount > 0
                ? isDark ? 'text-sky-400' : 'text-sky-700'
                : isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            {stats.struggledAyahsCount}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}
        >
          <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'مرات الإعادة' : 'Retries'}</span>
          <span className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-[#111214]'}`}>
            {stats.totalRetries}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}
        >
          <span className={`text-[11px] block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'المدة' : 'Duration'}</span>
          <span className={`text-xl font-bold font-mono ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
            {durationFormatted}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 my-5">
        <button
          type="button"
          onClick={() => setShowOnlyStruggled(!showOnlyStruggled)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
            showOnlyStruggled
              ? isDark
                ? 'bg-white text-[#111214] border-white'
                : 'bg-[#111214] text-white border-[#111214]'
              : isDark
              ? 'bg-[#1B1D23] border-white/[0.1] text-stone-200 hover:text-white'
              : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] hover:bg-black/[0.06]'
          }`}
        >
          <span>
            {showOnlyStruggled
              ? (isArabic ? 'عرض مواضع الملاحظات' : 'Showing Mistakes')
              : (isArabic ? 'مراجعة الملاحظات' : 'Review Mistakes')}
          </span>
          {stats.struggledAyahsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                showOnlyStruggled
                  ? isDark ? 'bg-[#111214]/15 text-[#111214]' : 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {stats.struggledAyahsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onPracticeAgain}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
            isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isArabic ? 'التدريب مرة أخرى' : 'Practice Again'}</span>
        </button>
      </div>

      {/* Detailed Ayah-by-Ayah Review List */}
      <div className="mt-4">
        <div className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2 px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
          <span>{isArabic ? 'تفصيل الآيات المباركة' : 'Ayah Breakdown'}</span>
          <span>{isArabic ? 'الحالة' : 'Status'}</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {displayedAyahs.map((item) => {
            const isExpanded = selectedAyahIndex === item.ayahNumber;
            const isPerfect = item.status === 'perfect';

            return (
              <div
                key={item.ayahNumber}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark
                    ? isExpanded
                      ? 'bg-[#1B1D23] border-white/30 shadow-md'
                      : 'bg-[#0B0C0E] border-white/[0.08] hover:border-white/20'
                    : isExpanded
                    ? 'bg-[#F3F3F1] border-[#111214]/35 shadow-sm'
                    : 'bg-white border-black/[0.08] hover:border-black/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedAyahIndex(isExpanded ? null : item.ayahNumber)}
                  className="w-full p-3.5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'
                      }`}
                    >
                      {item.ayahNumber}
                    </span>
                    <span className="font-arabic text-sm line-clamp-1" dir="rtl">
                      {item.ayahText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {isPerfect ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isArabic ? 'متقنة' : 'Recited'}</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                        <AlertCircle className="w-4 h-4" />
                        <span>{isArabic ? 'تحتاج تثبيتاً' : 'Needs practice'}</span>
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} /> : <ChevronDown className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className={`p-4 border-t text-xs leading-relaxed ${
                      isDark ? 'border-white/[0.08] bg-[#14161A]' : 'border-black/[0.08] bg-white'
                    }`}
                  >
                    <div className={`font-arabic text-xl leading-loose text-right mb-3 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {item.ayahText}
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? 'bg-[#1B1D23] border-white/[0.08]'
                          : 'bg-[#F3F3F1] border-black/[0.08]'
                      }`}
                    >
                      <span className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        {isArabic ? 'تقييم المعلم:' : 'Teacher Evaluation:'}
                      </span>
                      <p className={isDark ? 'text-stone-200' : 'text-[#111214]'}>{item.lastFeedback}</p>

                      {item.missingWords && item.missingWords.length > 0 && (
                        <p className={`mt-2 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                          <strong>{isArabic ? 'كلمات ساقطة من التلاوة: ' : 'Missing tokens: '}</strong>
                          <span className="font-arabic text-sm">{item.missingWords.join(' · ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Done Button */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3.5 rounded-xl font-serif-heading font-bold text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#1B1D23] hover:bg-white/[0.1] text-stone-200 border-white/[0.1]'
              : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214] border-black/[0.08]'
          }`}
        >
          {isArabic ? 'تم · العودة للمصحف الشريف' : 'Done · Return to Sanctuary'}
        </button>
      </div>
    </div>
  );
};
