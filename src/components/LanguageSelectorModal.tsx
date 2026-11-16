import React, { useState } from 'react';
import { Globe, Check, Search, X } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  LanguageInfo,
  t,
} from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguageCode;
  onSelectLanguage: (lang: SupportedLanguageCode) => void;
  isDark: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
  isDark,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'language-selector-modal');

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="language-selector-modal"
        className={`w-full max-w-md rounded-[28px] border shadow-md overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_12px_40px_rgba(0,0,0,0.12)]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm ${
              isDark
                ? 'bg-[#1B1D23] text-white border-white/[0.1]'
                : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {t(currentLanguage, 'language')}
              </h2>
              <p className={`text-xs font-light ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {t(currentLanguage, 'languageSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'text-stone-400 hover:text-white bg-[#1B1D23] hover:bg-white/[0.1]'
                : 'text-[#6B6F76] hover:text-[#111214] bg-[#F3F3F1] hover:bg-black/[0.08]'
            }`}
            aria-label="Close language selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'بحث عن لغة...' : 'Search language...'}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                  : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
              }`}
            />
          </div>
        </div>

        {/* Language List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {filteredLanguages.map((lang: LanguageInfo) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                id={`language-option-${lang.code}`}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-start group ${
                  isSelected
                    ? isDark
                      ? 'bg-white/[0.1] border-white/30 shadow-sm'
                      : 'bg-[#111214]/[0.06] border-[#111214]/40 shadow-sm'
                    : isDark
                    ? 'bg-[#1B1D23]/70 border-white/[0.06] hover:bg-[#1B1D23] hover:border-white/[0.14]'
                    : 'bg-[#FCFCFA] border-black/[0.08] hover:bg-[#F3F3F1] hover:border-black/[0.15]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xl shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isSelected
                            ? isDark
                              ? 'text-white'
                              : 'text-[#111214]'
                            : isDark
                            ? 'text-stone-200 group-hover:text-white'
                            : 'text-[#111214]'
                        }`}
                      >
                        {lang.name}
                      </span>
                      {lang.direction === 'rtl' && (
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono border ${
                          isDark
                            ? 'bg-white/[0.08] text-stone-200 border-white/[0.14]'
                            : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.1]'
                        }`}>
                          RTL
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        isSelected
                          ? isDark
                            ? 'text-white font-medium'
                            : 'text-[#111214] font-medium'
                          : isDark
                          ? 'text-stone-400'
                          : 'text-[#6B6F76]'
                      }`}
                    >
                      {lang.nativeName}
                    </span>
                  </div>
                </div>

                {/* Selected Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-[#111214] shadow-sm'
                        : 'bg-[#111214] text-white shadow-sm'
                      : 'border border-stone-400/50 text-transparent opacity-0 group-hover:opacity-40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
