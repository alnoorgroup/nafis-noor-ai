import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Code2,
  BookOpen,
  Compass,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { AppLogoIcon } from './AppLogoIcon';
import { NoorAIAvatar } from './NoorAIIcon';
import { SupportedLanguageCode, t } from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: SupportedLanguageCode;
  onOpenPrivacyPolicy?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
  onOpenPrivacyPolicy,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'about-nafis-noor-modal');

  const isArabic = lang === 'ar';
  const brandLogoSrc = isDark
    ? 'https://img.sanishtech.com/u/f1fc3476b9fdb454435a4cebfce95b0d.png'
    : 'https://img.sanishtech.com/u/c22bfd5390c8f55c5594618f292c141c.png';

  if (!isOpen) return null;

  // External link target handler without ever displaying raw URL in the DOM text
  const handleOpenNoorAI = () => {
    // Target external platform
    const targetUrl = 'https://noorak.ai.studio';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        id="about-nafis-noor-modal"
        className={`w-full max-w-lg rounded-[32px] border overflow-hidden transition-all duration-200 max-h-[90vh] flex flex-col overscroll-contain ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-white/[0.06] text-white border-white/[0.1]' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}>
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                {t(lang, 'aboutTitle')}
              </h2>
              <p className={`text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {t(lang, 'aboutSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.1]'
                : 'text-[#5A5D63] hover:text-[#111214] bg-black/[0.04] hover:bg-black/[0.08]'
            }`}
            aria-label="Close About Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: NAFIS NOOR IDENTITY & DESCRIPTION */}
          <div className="text-center flex flex-col items-center pt-2">
            <div className={`w-20 h-20 rounded-3xl overflow-hidden border mb-4 p-1 ${
              isDark ? 'border-white/[0.12] bg-[#0B0C0E]' : 'border-black/[0.1] bg-[#111214]'
            }`}>
              <AppLogoIcon className="w-full h-full" withContainer={false} />
            </div>

            <h1 className={`text-2xl font-bold tracking-widest mb-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {isArabic ? 'نور' : 'NAFIS NOOR'}
            </h1>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border mb-3 ${
              isDark ? 'bg-white/[0.06] text-stone-200 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
            }`}>
              <Sparkles className={`w-3 h-3 mr-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
              {isArabic ? 'رفيق المسلم اليومي الهادئ' : 'Peaceful Islamic Companion'}
            </div>

            <p className={`text-xs sm:text-sm font-light leading-relaxed max-w-md mx-auto mb-3 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {isArabic
                ? 'تطبيق إسلامي مجاني ومتكامل مطور بعناية وإخلاص من قِبل مجموعة نور — فريق شغوف بتسهيل الوصول إلى العلوم الإسلامية الصحيحة لكل مسلم حول العالم.'
                : 'A peaceful Islamic companion thoughtfully created by ALNOOR GROUP (مجموعة نور) — a team passionate about making authentic Islamic knowledge accessible to every Muslim worldwide.'}
            </p>

            {/* Badges & Version */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border ${
                isDark ? 'bg-white/[0.06] text-stone-200 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
              }`}>
                <img
                  src={brandLogoSrc}
                  alt="Saudi Tech"
                  loading="lazy"
                  decoding="async"
                  className="h-8 sm:h-9 w-auto max-h-9 object-contain shrink-0 drop-shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = isDark ? '/dark_bg.png' : '/light_bg.png';
                  }}
                />
                <span>{isArabic ? '🇸🇦 تقنية سعودية · صُنع بكل فخر في المملكة العربية السعودية' : '🇸🇦 Saudi Tech · Proudly Made in Saudi Arabia'}</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border ${
                isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <span>{isArabic ? 'مجاني لوجه الله تعالى دائماً وأبداً' : 'Free Forever · For the Love of Allah'}</span>
              </div>
            </div>

            <div className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {isArabic ? 'الإصدار 1.0.0 · عام 2026' : 'Version 1.0.0 · Built in 2026'}
            </div>
          </div>

          {/* SECTION 2: DIVIDER & MADE BY ALNOOR GROUP CREATOR SECTION */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`} />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-3 text-[10px] font-mono tracking-widest uppercase border rounded-full ${
                isDark ? 'text-stone-400 bg-[#14161A] border-white/[0.1]' : 'text-[#5A5D63] bg-white border-black/[0.1]'
              }`}>
                {t(lang, 'madeBy')}
              </span>
            </div>
          </div>

          {/* Legitimate developer/creator credit */}
          <div
            id="creator-credit-card"
            className={`rounded-2xl p-4 sm:p-5 border text-center transition-all ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08]'
                : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <div className={`text-[10px] font-mono uppercase tracking-widest mb-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {t(lang, 'madeBy')}
            </div>
            <div className={`text-lg sm:text-xl font-bold tracking-wider mb-0.5 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              {isArabic ? 'مجموعة نور' : 'ALNOOR GROUP'}
            </div>
            <div className={`text-xs font-arabic mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} dir="rtl">
              {isArabic ? '🇸🇦 المملكة العربية السعودية' : '(مجموعة نور)'}
            </div>
            <div className={`flex items-center justify-center gap-1.5 text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              <Code2 className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
              <span>{isArabic ? 'مبني بإخلاص وتقنية حديثة لخدمة أمة الإسلام' : 'Architected with devotion and modern craftsmanship'}</span>
            </div>
          </div>

          {/* SECTION 3: DIVIDER & NOOR AI COMPANION CARD */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`} />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-3 text-[10px] font-mono tracking-widest uppercase border rounded-full ${
                isDark ? 'text-stone-400 bg-[#14161A] border-white/[0.1]' : 'text-[#5A5D63] bg-white border-black/[0.1]'
              }`}>
                {isArabic ? 'الرفيق الإيماني' : 'Spiritual Companion'}
              </span>
            </div>
          </div>

          {/* NOOR AI Card - NEVER displays raw URL */}
          <div
            id="noor-ai-portal-card"
            className={`rounded-2xl p-5 border transition-all duration-200 ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08]'
                : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <div className="flex items-start gap-3.5 mb-3">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 overflow-hidden ${
                isDark ? 'bg-[#0B0C0E] border-white/[0.12]' : 'bg-[#111214] border-black/[0.12]'
              }`}>
                <NoorAIAvatar size="lg" isDark={isDark} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {t(lang, 'noorAiTitle')}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    isDark ? 'bg-white/[0.06] text-stone-200 border-white/[0.1]' : 'bg-white text-[#3F4248] border-black/[0.08]'
                  }`}>
                    {t(lang, 'noorAiSubtitle')}
                  </span>
                </div>
                <p className={`text-xs font-light mt-1 leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {t(lang, 'noorAiDescShort')}
                </p>
              </div>
            </div>

            {/* Launch button (opens external window without ever exposing the raw URL string) */}
            <button
              type="button"
              id="open-noor-ai-external-btn"
              onClick={handleOpenNoorAI}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
              aria-label="Open Noor AI Assistant"
            >
              <span>{t(lang, 'openNoorAi')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SECTION 4: APPLICATION INFORMATION */}
          <div className="space-y-3 pt-1">
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              <Compass className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
              <span>{t(lang, 'appInfo')}</span>
            </h3>

            <div
              className={`rounded-2xl border divide-y transition-all ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] divide-white/[0.08] text-xs'
                  : 'bg-[#F3F3F1] border-black/[0.08] divide-black/[0.08] text-xs'
              }`}
            >
              {/* Version */}
              <div className="p-3.5 flex items-center justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-[#5A5D63]'}>{t(lang, 'version')}</span>
                <span className={`font-mono font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {isArabic ? 'الإصدار ١.٠.٠ · عام ٢٠٢٦ م' : 'Version 1.0.0 · Built in 2026'}
                </span>
              </div>

              {/* Development Status */}
              <div className="p-3.5 flex items-center justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>{t(lang, 'devStatus')}</span>
                <span className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {t(lang, 'devStatusVal')}
                </span>
              </div>

              {/* AI Information */}
              <div className="p-3.5 space-y-1">
                <div className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{t(lang, 'aiInfo')}</div>
                <p className={`text-[11px] font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  {t(lang, 'aiInfoVal')}
                </p>
              </div>

              {/* Terms & Important Information */}
              <div className="p-3.5 space-y-1">
                <div className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{t(lang, 'termsInfo')}</div>
                <p className={`text-[11px] font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  {t(lang, 'termsInfoVal')}
                </p>
              </div>

              {/* Privacy */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{t(lang, 'privacyInfo')}</div>
                  <p className={`text-[11px] font-light ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                    {t(lang, 'privacyInfoVal')}
                  </p>
                </div>
                {onOpenPrivacyPolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPrivacyPolicy();
                    }}
                    className={`ml-3 shrink-0 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      isDark
                        ? 'border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.1] text-[#F3F4F6]'
                        : 'border-black/[0.1] bg-white hover:bg-black/[0.04] text-[#111214]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'عرض السياسة' : 'View Policy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t shrink-0 flex justify-end ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.1] text-stone-200'
                : 'border-black/[0.08] bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214]'
            }`}
          >
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
