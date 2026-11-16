import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, Globe } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  LanguageInfo,
  t,
  isRTLLanguage,
} from '../utils/i18n';
import { AppLogoIcon } from './AppLogoIcon';

interface FirstTimeLanguageScreenProps {
  isDark: boolean;
  onSelectLanguage: (code: SupportedLanguageCode) => void;
}

export const FirstTimeLanguageScreen: React.FC<FirstTimeLanguageScreenProps> = ({
  isDark,
  onSelectLanguage,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageCode>('en');

  const handleCardClick = (code: SupportedLanguageCode) => {
    setSelectedLang(code);
    // Instant live preview of direction
    const isRtl = isRTLLanguage(code);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
  };

  const handleConfirm = () => {
    onSelectLanguage(selectedLang);
  };

  const currentInfo: LanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const isRtl = isRTLLanguage(selectedLang);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 transition-colors ${
        isDark ? 'bg-[#0B0C0E] text-[#F3F4F6] selection:bg-white/20' : 'bg-[#FCFCFA] text-[#111214] selection:bg-black/10'
      }`}
    >
      <div className="relative z-10 w-full max-w-lg mx-auto my-auto animate-fadeIn">
        <div
          id="first-time-language-card"
          className={`rounded-[36px] p-6 sm:p-8 text-center border transition-all ${
            isDark
              ? 'bg-[#14161A] text-[#F3F4F6] shadow-[0_24px_60px_rgba(0,0,0,0.65)] border-white/[0.08]'
              : 'bg-white text-[#111214] border-black/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.08)]'
          }`}
        >
          {/* Orb Emblem */}
          <div className="mx-auto w-20 h-20 rounded-3xl overflow-hidden shadow-md mb-5">
            <AppLogoIcon className="w-full h-full" withContainer={true} />
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${
              isDark
                ? 'bg-[#1B1D23] text-white border-white/[0.12]'
                : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>NAFIS NOOR</span>
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-bold font-serif-heading tracking-wide mb-1.5 ${
              isDark ? 'text-white' : 'text-[#111214]'
            }`}
          >
            {t(selectedLang, 'chooseLanguageTitle')}
          </h1>

          <p className={`text-xs sm:text-sm max-w-sm mx-auto mb-6 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            {t(selectedLang, 'chooseLanguageSubtitle')}
          </p>

          {/* 10 Supported Languages Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6 text-left" dir="ltr">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`lang-choice-${lang.code}`}
                  onClick={() => handleCardClick(lang.code)}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${
                    isSelected
                      ? isDark
                        ? 'bg-white/[0.1] border-white/40 ring-1 ring-white/20'
                        : 'bg-[#111214]/[0.06] border-[#111214]/45 ring-1 ring-[#111214]/15'
                      : isDark
                      ? 'bg-[#1B1D23]/70 border-white/[0.06] hover:border-white/[0.16] text-stone-300 hover:bg-[#1B1D23]'
                      : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.18] text-[#3F4248] hover:bg-[#F3F3F1]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? (isDark ? 'text-white' : 'text-[#111214]') : isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                        }`}
                      >
                        {lang.nativeName}
                      </div>
                      <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{lang.name}</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-white border-white text-[#111214]'
                          : 'bg-[#111214] border-[#111214] text-white'
                        : isDark
                        ? 'border-white/[0.15] text-transparent'
                        : 'border-black/[0.15] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            id="confirm-language-button"
            type="button"
            onClick={handleConfirm}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <span>{t(selectedLang, 'continueWithLanguage', { lang: currentInfo.nativeName })}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          {/* Subtext */}
          <p className={`text-[11px] mt-4 ${isDark ? 'text-stone-500' : 'text-[#6B6F76]'}`}>
            {t(selectedLang, 'languageSelectedDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};
