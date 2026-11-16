import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  FileText,
  Mic,
  ArrowRight,
  GraduationCap,
  Info,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { AppLogoIcon } from './AppLogoIcon';

interface AuthLifetimeFreeFlowProps {
  isDark?: boolean;
  onComplete: () => void;
  userName?: string;
  initialStage?: 'notice' | 'terms';
}

type Stage = 'notice' | 'terms';

export const AuthLifetimeFreeFlow: React.FC<AuthLifetimeFreeFlowProps> = ({
  isDark = true,
  onComplete,
  userName,
  initialStage = 'notice',
}) => {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  const handleFinish = () => {
    try {
      localStorage.setItem('nafis_noor_terms_acknowledged', 'true');
      localStorage.setItem('nafis_noor_terms_date', new Date().toISOString());
    } catch {
      // safe fallback
    }
    onComplete();
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-3 sm:px-6 animate-fadeIn">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStage('notice')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
            stage === 'notice'
              ? isDark
                ? 'bg-white text-[#111214] border-white'
                : 'bg-[#111214] text-white border-[#111214]'
              : isDark
              ? 'bg-[#14161A] text-stone-400 hover:text-stone-200 border-white/[0.08]'
              : 'bg-[#F3F3F1] text-[#5A5D63] hover:text-[#111214] border-black/[0.08]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${stage === 'notice' ? (isDark ? 'bg-[#111214]' : 'bg-white') : 'bg-current opacity-50'}`} />
          <span>1. Development Status</span>
        </button>

        <span className={isDark ? 'text-stone-600 text-xs' : 'text-[#6B6F76] text-xs'}>/</span>

        <button
          type="button"
          onClick={() => setStage('terms')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
            stage === 'terms'
              ? isDark
                ? 'bg-white text-[#111214] border-white'
                : 'bg-[#111214] text-white border-[#111214]'
              : isDark
              ? 'bg-[#14161A] text-stone-400 hover:text-stone-200 border-white/[0.08]'
              : 'bg-[#F3F3F1] text-[#5A5D63] hover:text-[#111214] border-black/[0.08]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${stage === 'terms' ? (isDark ? 'bg-[#111214]' : 'bg-white') : 'bg-current opacity-50'}`} />
          <span>2. Terms &amp; Acceptance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PRE-RELEASE / DEVELOPMENT NOTICE                                       */}
      {/* ========================================================================= */}
      {stage === 'notice' && (
        <div
          id="auth-prerelease-screen"
          className={`p-6 sm:p-10 rounded-[32px] border relative transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-5 text-center">
            {/* Logo Emblem */}
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-md mb-1">
              <AppLogoIcon className="w-full h-full" withContainer={true} />
            </div>

            <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
              isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              <Info className="w-3.5 h-3.5" />
              <span>Pre-Release Notice</span>
            </div>

            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              Nafis Noor is still in development
            </h1>

            <div className={`p-5 rounded-2xl border text-left text-xs leading-relaxed space-y-3 ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300' : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
            }`}>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Thank you for being part of Nafis Noor{userName ? `, ${userName}` : ''}.
              </p>

              <p>
                Nafis Noor is currently in an early development and pre-release stage. The application is not yet fully published, and several parts of the experience are still being developed, tested, refined, and improved.
              </p>

              <p>
                Some features may change before the official release, and certain functionality may not yet be available or may behave differently during development.
              </p>

              <p>
                Our goal is to build a reliable, useful, and high-quality experience, so we are continuing to work on the application before its full public release.
              </p>

              <p>
                Your current experience should therefore be considered a preview of an application that is still being actively developed.
              </p>

              <p className={`font-medium pt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Thank you for your patience and understanding while Nafis Noor continues to grow.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="auth-notice-continue-btn"
                onClick={() => setStage('terms')}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 mx-auto cursor-pointer tracking-wide ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <span>Continue to Terms &amp; Conditions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TERMS & ACCEPTANCE                                                     */}
      {/* ========================================================================= */}
      {stage === 'terms' && (
        <div
          id="auth-terms-screen"
          className={`p-6 sm:p-9 rounded-[32px] border relative transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-5">
            <div className={`border-b pb-4 flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-1 border ${
                  isDark ? 'bg-white/[0.06] text-stone-300 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Essential Information</span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  Terms &amp; Important Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStage('notice')}
                className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                }`}
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Notice</span>
              </button>
            </div>

            {/* Scrollable Terms Sections */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin text-xs leading-relaxed">
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>Terms of Use</span>
                </div>
                <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                  Nafis Noor is an Islamic companion designed to assist Muslims with Qur'an reading, accurate prayer times, dhikr counting, authentic supplications, Islamic learning, and interactive knowledge assistance.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>Privacy &amp; Data Protection</span>
                </div>
                <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                  Your data, bookmarks, and journey progress are protected. When signed in, data syncs safely across your devices. Guest sessions store data strictly within your browser without creating an account.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <AlertCircle className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span>AI Assistance Notice</span>
                </div>
                <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                  Noor AI is an educational assistant grounded in verified Islamic references. While strictly guided, AI responses should not replace formal rulings from qualified scholars.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <GraduationCap className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>Educational Purpose</span>
                </div>
                <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                  All learning modules and phonetics exercises are intended to enrich your spiritual habit and knowledge in a dignified, accessible manner.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                  <span>Voice &amp; Audio Features</span>
                </div>
                <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                  Audio features use standard device microphones and speech synthesis for interactive study. No unauthorized voice recording or profiling takes place.
                </p>
              </div>
            </div>

            {/* Checkbox agreement */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                hasAgreedToTerms
                  ? isDark
                    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}
            >
              <input
                type="checkbox"
                id="agree-auth-terms-checkbox"
                checked={hasAgreedToTerms}
                onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-emerald-600"
              />
              <label
                htmlFor="agree-auth-terms-checkbox"
                className="text-xs font-medium cursor-pointer select-none leading-relaxed"
              >
                I have read and understood the Terms &amp; Important Information.
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStage('notice')}
                className={`text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                }`}
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="auth-terms-agree-btn"
                disabled={!hasAgreedToTerms}
                onClick={handleFinish}
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 tracking-wide ${
                  hasAgreedToTerms
                    ? isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214] shadow-sm cursor-pointer'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white shadow-sm cursor-pointer'
                    : isDark
                    ? 'bg-white/10 text-stone-500 cursor-not-allowed opacity-60'
                    : 'bg-[#F3F3F1] text-[#6B6F76] cursor-not-allowed opacity-70'
                }`}
              >
                <span>I Agree &amp; Enter Nafis Noor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
