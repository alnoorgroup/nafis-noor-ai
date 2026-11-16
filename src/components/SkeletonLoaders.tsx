import React from 'react';

interface SkeletonProps {
  className?: string;
  isDark?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'h-4 w-full rounded-xl',
  isDark = true,
}) => {
  return (
    <div
      className={`select-none pointer-events-none transition-colors duration-200 ${
        isDark ? 'skeleton-pulse bg-white/[0.05]' : 'skeleton-pulse-light bg-black/[0.05]'
      } ${className}`}
      aria-hidden="true"
    />
  );
};

interface SkeletonListProps {
  count?: number;
  isDark?: boolean;
  isArabic?: boolean;
}

export const QuranAyahSkeletonList: React.FC<SkeletonListProps> = ({
  count = 4,
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="space-y-4 w-full animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`ayah-skeleton-${idx}`}
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-sm'
              : 'bg-white border-black/[0.08] shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between gap-3 mb-5 pb-3 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-2xl" isDark={isDark} />
              <Skeleton className="h-4 w-24 rounded-lg" isDark={isDark} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
            </div>
          </div>

          <div className="space-y-3.5 my-4" dir="rtl">
            <Skeleton className="h-6 sm:h-7 w-[92%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 sm:h-7 w-[80%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 sm:h-7 w-[65%] rounded-xl" isDark={isDark} />
          </div>

          <div className={`pt-3 mt-4 border-t space-y-2 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
            <Skeleton className="h-3.5 w-[75%] rounded-lg" isDark={isDark} />
            <Skeleton className="h-3.5 w-[50%] rounded-lg" isDark={isDark} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SurahGridSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 6,
  isDark = true,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full animate-fadeIn">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`surah-skeleton-${idx}`}
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" isDark={isDark} />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-lg" isDark={isDark} />
              <Skeleton className="h-3 w-16 rounded-md" isDark={isDark} />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-xl" isDark={isDark} />
        </div>
      ))}
    </div>
  );
};

export const PrayerTimesSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  return (
    <div className="w-full space-y-4 animate-fadeIn">
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
        }`}
      >
        <div className="space-y-2 w-full sm:w-1/2">
          <Skeleton className="h-6 w-48 rounded-xl" isDark={isDark} />
          <Skeleton className="h-4 w-36 rounded-lg" isDark={isDark} />
        </div>
        <Skeleton className="h-12 w-full sm:w-40 rounded-2xl" isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`prayer-card-skeleton-${idx}`}
            className={`p-4 rounded-3xl border space-y-3 ${
              isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16 rounded-md" isDark={isDark} />
              <Skeleton className="h-4 w-12 rounded-full" isDark={isDark} />
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" isDark={isDark} />
            <Skeleton className="h-8 w-20 rounded-xl" isDark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const NoorAIResponseSkeleton: React.FC<{ isDark?: boolean; isArabic?: boolean }> = ({
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="flex items-start gap-3 w-full max-w-2xl animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={`w-9 h-9 rounded-full p-0.5 shrink-0 ${isDark ? 'bg-white/20' : 'bg-black/10'}`}>
        <Skeleton className="w-full h-full rounded-full" isDark={isDark} />
      </div>

      <div
        className={`flex-1 p-5 rounded-3xl rounded-tl-sm border shadow-xs space-y-3 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
            : 'bg-white border-black/[0.08] text-[#111214]'
        }`}
      >
        <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-lg" isDark={isDark} />
            <span className="flex gap-1 items-center">
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white' : 'bg-[#111214]'}`} style={{ animationDelay: '0ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white' : 'bg-[#111214]'}`} style={{ animationDelay: '150ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-white' : 'bg-[#111214]'}`} style={{ animationDelay: '300ms' }} />
            </span>
          </div>
          <Skeleton className="h-4 w-16 rounded-full" isDark={isDark} />
        </div>

        <div className="space-y-2.5 pt-1">
          <Skeleton className="h-4 w-[95%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[88%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[76%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[60%] rounded-lg" isDark={isDark} />
        </div>

        <div className="pt-2 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" isDark={isDark} />
          <Skeleton className="h-6 w-32 rounded-full" isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export const DhikrCardSkeletonList: React.FC<{ count?: number; isDark?: boolean; isArabic?: boolean }> = ({
  count = 3,
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="space-y-4 w-full animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`dhikr-skeleton-${idx}`}
          className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-32 rounded-lg" isDark={isDark} />
            <Skeleton className="h-6 w-20 rounded-full" isDark={isDark} />
          </div>

          <div className="space-y-3 my-4" dir="rtl">
            <Skeleton className="h-6 w-[90%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 w-[70%] rounded-xl" isDark={isDark} />
          </div>

          <div className={`pt-3 mt-4 border-t flex items-center justify-between ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
            <Skeleton className="h-4 w-40 rounded-md" isDark={isDark} />
            <Skeleton className="h-10 w-28 rounded-2xl" isDark={isDark} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DocumentAnalysisSkeleton: React.FC<{ isDark?: boolean; label?: string }> = ({
  isDark = true,
  label = 'AI is reading & processing content...',
}) => {
  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 animate-fadeIn ${
        isDark ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]' : 'bg-white border-black/[0.08] text-[#111214]'
      }`}
    >
      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-md" isDark={isDark} />
          <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{label}</span>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" isDark={isDark} />
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-[94%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[86%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[90%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[60%] rounded-lg" isDark={isDark} />
      </div>

      <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.06]'}`}>
        <Skeleton className="h-3.5 w-32 rounded-md" isDark={isDark} />
        <Skeleton className="h-3 w-[78%] rounded-md" isDark={isDark} />
        <Skeleton className="h-3 w-[55%] rounded-md" isDark={isDark} />
      </div>
    </div>
  );
};

export const FullScreenSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      <div
        className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
        }`}
      >
        <div className="space-y-2 w-full sm:w-1/2">
          <Skeleton className="h-8 w-60 rounded-2xl" isDark={isDark} />
          <Skeleton className="h-4 w-40 rounded-lg" isDark={isDark} />
        </div>
        <Skeleton className="h-12 w-full sm:w-48 rounded-2xl" isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`page-skel-card-${idx}`}
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            }`}
          >
            <Skeleton className="h-5 w-32 rounded-lg" isDark={isDark} />
            <Skeleton className="h-4 w-full rounded-md" isDark={isDark} />
            <Skeleton className="h-4 w-[70%] rounded-md" isDark={isDark} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`page-skel-row-${idx}`}
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" isDark={isDark} />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-lg" isDark={isDark} />
                <Skeleton className="h-3 w-28 rounded-md" isDark={isDark} />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-xl" isDark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
};
