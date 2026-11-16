import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  Heart,
  BookOpen,
  Compass,
  ArrowRight,
  X,
  Share2,
  AlertCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { HijriDateInfo } from '../../utils/hijriCalendar';

interface NoorRamadanUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  ramadanStatus: HijriDateInfo | null;
  isRamadanSimulated: boolean;
  onToggleSimulated?: () => void;
  onProceedToRamadan?: () => void;
}

export const NoorRamadanUpdatesModal: React.FC<NoorRamadanUpdatesModalProps> = ({
  isOpen,
  onClose,
  isDark,
  ramadanStatus,
  isRamadanSimulated,
  onToggleSimulated,
  onProceedToRamadan,
}) => {
  const [currentLiveTime, setCurrentLiveTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [currentLiveDate, setCurrentLiveDate] = useState<string>(() =>
    new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  // Update clock every second while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentLiveDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isRamadanActive = Boolean(ramadanStatus?.isRamadan || isRamadanSimulated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl relative transition-all flex flex-col ${
          isDark
            ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
            : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214]'
        }`}
      >
        {/* Modal Header */}
        <div className={`sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-xl flex items-center justify-between ${
          isDark ? 'border-white/[0.08] bg-[#14161A]/95' : 'border-black/[0.08] bg-[#FCFCFA]/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <Moon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  Ramadan Updates & Features
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  isDark ? 'bg-white/[0.08] text-white border-white/15' : 'bg-[#F3F3F1] text-[#111214] border-black/10'
                }`}>
                  Release Notes
                </span>
              </div>
              <p className={`text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Verified Islamic Schedule & Guidelines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'border-white/10 bg-white/[0.06] hover:bg-white/[0.12] text-stone-300'
                : 'border-black/[0.08] bg-black/[0.04] hover:bg-black/[0.08] text-[#3F4248]'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Real-Time Date & Time Verification Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isRamadanActive
                ? isDark
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>Real-Time Date & Time Verification</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-[#14161A] border-white/10 text-white'
                  : 'bg-white border-black/[0.08] text-[#111214]'
              }`}>
                <Clock className={`w-3 h-3 animate-spin ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                <span>{currentLiveTime}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border space-y-0.5 ${isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
                <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Gregorian Live:</span>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{currentLiveDate}</p>
              </div>

              <div className={`p-2.5 rounded-xl border space-y-0.5 ${isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
                <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Hijri Calendar:</span>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {ramadanStatus ? `${ramadanStatus.day} ${ramadanStatus.monthNameEn} ${ramadanStatus.year} AH` : 'Calculating...'}
                  {ramadanStatus?.monthNameAr && ` (${ramadanStatus.monthNameAr})`}
                </p>
              </div>
            </div>

            {/* Lock / Active Status Notice */}
            <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-white/10' : 'border-black/[0.08]'}`}>
              <div className="flex items-center gap-2">
                {isRamadanActive ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Ramadan Active (Month 9) • Events Unlocked
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                    <span className={`font-semibold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                      Events Locked: Currently outside Ramadan (Month {ramadanStatus?.monthNumber || 5} of 12).
                    </span>
                  </>
                )}
              </div>

              <span className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Aladhan Sync
              </span>
            </div>
          </div>

          {/* 2. Important Architectural Rules Notice */}
          <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ramadan Event Access & Day Locking Rules</span>
            </h4>
            <p className={`text-xs leading-relaxed font-light ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              By Islamic principle and app design, Ramadan events activate <strong>only on verified Ramadan dates</strong>. Furthermore, to keep focus on today's sincere efforts, upcoming days in the Ramadan journey are locked sequentially:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                isDark
                  ? 'bg-[#14161A] border-white/10 text-stone-200'
                  : 'bg-white border-black/[0.08] text-[#111214]'
              }`}>
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="font-bold block">Tomorrow:</span>
                  <span className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>Locked with label <strong>"Tomorrow Insha'Allah"</strong> (unlocks at Fajr).</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                isDark
                  ? 'bg-[#14161A] border-white/10 text-stone-300'
                  : 'bg-white border-black/[0.08] text-[#3F4248]'
              }`}>
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="font-bold block">Future Days (Day +2 onward):</span>
                  <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Locked with label <strong>"Insha'Allah that time"</strong>.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ramadan Features & Updates */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              What's Included in the Ramadan Update
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Feature 1 */}
              <div className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20' : 'bg-white border-black/[0.08] hover:border-black/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'}`}>
                  <Moon className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>1. One Personal Spiritual Dream</h5>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Set a single, heart-centered goal for Ramadan (Fast 30 days, Read full Quran, Taraweeh nightly, Daily charity, Memorize surahs, Stop a bad habit, Patience) or enter a custom dream.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20' : 'bg-white border-black/[0.08] hover:border-black/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>2. Al-Noor Plan & Custom Daily Routine</h5>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Pre-built 10-step routine combining best practices (Suhoor before Fajr, post-Fajr Quran, Morning & Afternoon Adhkar, Maghrib/Iftar, Taraweeh, Tahajjud) with customizable times.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20' : 'bg-white border-black/[0.08] hover:border-black/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>3. Daily Maghrib Check-In & Affirmation</h5>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    "Did you work toward your dream today?" with affirmative reinforcement or guilt-free encouragement grounded in Allah's mercy.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20' : 'bg-white border-black/[0.08] hover:border-black/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>4. 30-Day Journey Calendar & Progress</h5>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Visual 30-day grid with streak tracker and completion percentage. Today is active; Tomorrow shows "Tomorrow Insha'Allah"; all subsequent days show "Insha'Allah that time".
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20' : 'bg-white border-black/[0.08] hover:border-black/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'}`}>
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>5. 24-Hour Daily Inspiration Pulse</h5>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Full-screen card with calm monochrome styling featuring rotating Quranic verses, life transformations, global charity calls, and authentic hadiths.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Area */}
          <div className={`pt-2 border-t space-y-3 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            {isRamadanActive ? (
              <div className="space-y-2">
                <div className={`p-3 rounded-xl border text-xs text-center ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
                  Ramadan date verified! You can enter and interact with the Ramadan module.
                </div>
                {onProceedToRamadan && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToRamadan();
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 fill-current" />
                    <span>Open Ramadan Events</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-50 border-sky-200'}`}>
                <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                  <Lock className="w-4 h-4" />
                  <span>Ramadan Events are locked until Ramadan begins.</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  The live date & time check confirms that we are currently in Month {ramadanStatus?.monthNumber || 5} ({ramadanStatus?.monthNameEn || 'Islamic Calendar'}). Ramadan events will unlock automatically on 1 Ramadan 1447, Insha'Allah.
                </p>
              </div>
            )}

            {/* Developer Testing Simulation Toggler */}
            {onToggleSimulated && (
              <div className={`flex items-center justify-between pt-2 text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <span>Testing Mode (Simulate Ramadan Date):</span>
                <button
                  type="button"
                  onClick={onToggleSimulated}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                    isRamadanSimulated
                      ? isDark
                        ? 'border-white/30 bg-white text-[#111214]'
                        : 'border-[#111214] bg-[#111214] text-white'
                      : isDark
                      ? 'border-white/10 bg-[#1B1D23] text-stone-300'
                      : 'border-black/10 bg-[#F3F3F1] text-[#3F4248]'
                  }`}
                >
                  {isRamadanSimulated ? 'Simulation Enabled (Testing)' : 'Real Date Check (Standard)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 border-t bg-inherit flex items-center justify-between text-xs ${
          isDark ? 'border-white/[0.08] text-stone-400' : 'border-black/[0.08] text-[#5A5D63]'
        }`}>
          <span>NOOR Islamic App • Ramadan 1447</span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              isDark
                ? 'border-white/10 hover:bg-white/[0.08] text-stone-300'
                : 'border-black/[0.1] hover:bg-black/[0.04] text-[#3F4248]'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
