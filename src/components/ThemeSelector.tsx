import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { SupportedLanguageCode, t } from '../utils/i18n';

export type ThemePreferenceMode = 'light' | 'dark' | 'system';

interface ThemeSelectorProps {
  currentPreference: ThemePreferenceMode;
  isDark: boolean;
  onSelectTheme: (theme: ThemePreferenceMode) => void;
  lang: SupportedLanguageCode;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentPreference,
  isDark,
  onSelectTheme,
  lang,
}) => {
  const themes: {
    id: ThemePreferenceMode;
    label: string;
    description: string;
    icon: typeof Sun;
    previewBg: string;
    previewBorder: string;
  }[] = [
    {
      id: 'light',
      label: t(lang, 'themeLight'),
      description: t(lang, 'themeLightDesc'),
      icon: Sun,
      previewBg: 'from-[#FCFCFA] via-white to-[#F3F3F1]',
      previewBorder: 'border-black/15',
    },
    {
      id: 'dark',
      label: t(lang, 'themeDark'),
      description: t(lang, 'themeDarkDesc'),
      icon: Moon,
      previewBg: 'from-[#0B0C0E] via-[#14161A] to-[#0B0C0E]',
      previewBorder: 'border-white/20',
    },
    {
      id: 'system',
      label: t(lang, 'themeSystem'),
      description: t(lang, 'themeSystemDesc'),
      icon: Laptop,
      previewBg: 'from-[#FCFCFA] via-stone-400 to-[#14161A]',
      previewBorder: 'border-black/15 dark:border-white/20',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = currentPreference === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              id={`theme-option-${theme.id}`}
              onClick={() => onSelectTheme(theme.id)}
              className={`group relative text-start p-4 rounded-2xl border transition-all duration-200 transform active:scale-[0.98] focus:outline-none flex flex-col justify-between overflow-hidden cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-[#1C1E24] border-white/40 ring-1 ring-white/20 shadow-md'
                    : 'bg-white border-[#111214] ring-1 ring-[#111214]/15 shadow-sm'
                  : isDark
                  ? 'bg-[#14161A] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#1A1D23]'
                  : 'bg-[#F3F3F1]/70 border-black/[0.08] hover:border-black/[0.18] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-[#111214] shadow-sm scale-105'
                        : 'bg-[#111214] text-white shadow-sm scale-105'
                      : isDark
                      ? 'bg-white/[0.06] text-stone-300 group-hover:text-white'
                      : 'bg-white text-[#3F4248] border border-black/[0.06] group-hover:text-[#111214]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-[#111214] scale-100'
                        : 'bg-[#111214] text-white scale-100'
                      : 'border border-stone-400/40 text-transparent opacity-0 group-hover:opacity-60 scale-90'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" className={isSelected ? 'animate-draw-check' : ''} />
                  </svg>
                </div>
              </div>

              <div>
                <div
                  className={`text-sm font-bold font-display mb-0.5 transition-colors ${
                    isDark ? 'text-white' : 'text-[#111214]'
                  }`}
                >
                  {theme.label}
                </div>
                <div
                  className={`text-[11px] leading-snug ${
                    isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                  }`}
                >
                  {theme.description}
                </div>
              </div>

              <div
                className={`mt-3 h-1.5 w-full rounded-full bg-gradient-to-r ${theme.previewBg} border ${theme.previewBorder} opacity-80 group-hover:opacity-100 transition-opacity`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
