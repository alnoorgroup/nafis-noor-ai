import React from 'react';
import { X, FileText, CheckCircle2, Shield, HeartHandshake, Sparkles } from 'lucide-react';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, isDark }) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'terms-of-service-modal');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="terms-of-service-modal"
        className={`w-full max-w-lg rounded-[32px] border overflow-hidden transition-all duration-200 max-h-[90vh] flex flex-col overscroll-contain ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm ${
              isDark ? 'bg-white/[0.08] text-white border-white/[0.12]' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Terms of Service
              </h2>
              <p className={`text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                ALNOOR GROUP (مجموعة نور) · Guidelines & Transparency
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12]'
                : 'text-[#5A5D63] hover:text-[#111214] bg-[#F3F3F1] hover:bg-black/[0.08]'
            }`}
            aria-label="Close Terms Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={`p-5 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}>
            <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <div>
              <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Free Forever · For the Love of Allah
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                Nafis Noor is dedicated to the Muslim Ummah globally without subscriptions, paywalls, or intrusive commercial tracking.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>1. Authentic Religious Sources</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Quranic texts and Hisnul Muslim supplications are cross-checked with certified verified sources (including King Fahd Complex). Users are encouraged to cross-reference with qualified Islamic scholars for personal legal rulings (Fatwa).
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                <span>2. AI Assistant & Guidance</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Noor AI provides grounded Islamic study assistance, historical context, and reflection tools. It is not an issuing authority of religious decrees and should be used respectfully for personal study and contemplation.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <HeartHandshake className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                <span>3. Privacy & Sanctity of User Data</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Your spiritual streaks, prayer logs, bookmarks, and recitations remain private. We do not sell your personal data or prayer history to third-party ad networks.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-stone-500">
            Last updated: 2026 · ALNOOR GROUP (مجموعة نور) · Riyadh, Saudi Arabia
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t shrink-0 flex justify-end ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
