import React, { memo } from 'react';
import { Sun, Moon, Flame, Sparkles } from 'lucide-react';
import { AppLogoIcon } from './AppLogoIcon';
import { t, getLanguageCode } from '../utils/i18n';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  streak: number;
  hijriDate: string;
  language?: string;
  isAtRisk?: boolean;
  riskFormattedTime?: string;
  onOpenStreakRisk?: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({
  isDark,
  onToggleTheme,
  streak,
  hijriDate,
  language,
  isAtRisk = false,
  onOpenStreakRisk,
}) => {
  const lang = getLanguageCode(language);
  const isArabic = lang === 'ar';
  return (
    <header
      id="app-header"
      className={`lg:hidden sticky top-0 z-30 px-3.5 sm:px-6 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 backdrop-blur-xl transition-colors duration-200 border-b ${
        isDark
          ? 'bg-[#0B0C0E]/90 border-white/[0.08]'
          : 'bg-[#FCFCFA]/90 border-black/[0.08]'
      }`}
    >
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Calligraphy */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-xs shrink-0">
            <AppLogoIcon className="w-full h-full" withContainer={true} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className={`text-sm sm:text-base font-cinzel font-bold tracking-widest truncate ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'نور' : 'NOOR'}
              </h1>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium border shrink-0 ${
                  isDark
                    ? 'bg-white/[0.06] text-stone-300 border-white/[0.1]'
                    : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}
              >
                <Sparkles className={`w-2.5 h-2.5 mr-0.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                {t(lang, 'sanctuaryEmblem')}
              </span>
            </div>
            <p className={`text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {hijriDate}
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Daily Streak Pill */}
          <button
            id="header-streak-pill"
            onClick={isAtRisk && onOpenStreakRisk ? onOpenStreakRisk : undefined}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border min-h-[38px] transition-all cursor-pointer ${
              isAtRisk
                ? isDark
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : isDark
                ? 'bg-white/[0.06] border-white/[0.1] text-white'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-2xs'
            }`}
            title={
              isAtRisk
                ? `⚠️ ${t(lang, 'atRisk')}`
                : t(lang, 'activeStreak')
            }
          >
            <Flame
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all shrink-0 ${
                isAtRisk
                  ? isDark
                    ? 'text-rose-400 fill-rose-400 animate-bounce'
                    : 'text-rose-600 fill-rose-600 animate-bounce'
                  : isDark
                  ? 'text-white fill-white'
                  : 'text-[#111214] fill-[#111214]'
              }`}
            />
            <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
              {streak} {t(lang, 'days')}{isAtRisk ? ' ⚠️' : ''}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-button"
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-[#14161A] border-white/[0.1] text-stone-200 hover:text-white hover:bg-white/[0.08]'
                : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-2xs'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
});
