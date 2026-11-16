import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  CheckCircle2,
  Heart,
  ChevronRight,
  Flame,
  Calendar,
  Compass,
} from 'lucide-react';
import { RamadanUserData } from '../../types/ramadan';
import { recordDailyCheckIn, getRamadanUserData } from '../../utils/ramadanDb';

interface RamadanCheckInCardProps {
  isDark?: boolean;
  onNavigateToRamadan?: () => void;
  className?: string;
}

export const RamadanCheckInCard: React.FC<RamadanCheckInCardProps> = ({
  isDark = true,
  onNavigateToRamadan,
  className = '',
}) => {
  const [userData, setUserData] = useState<RamadanUserData | null>(null);
  const [todayStatus, setTodayStatus] = useState<'yes' | 'no' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const data = await getRamadanUserData();
      if (!isMounted) return;
      if (data) {
        setUserData(data);
        const todayLog = data.dailyLog.find((l) => l.date === todayStr);
        if (todayLog) {
          setTodayStatus(todayLog.status);
          if (todayLog.status === 'yes') {
            setFeedbackMessage('Alhamdulillah! May Allah accept every step of your effort today.');
          } else {
            setFeedbackMessage('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
          }
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  const handleCheckIn = async (status: 'yes' | 'no') => {
    setIsSubmitting(true);
    setTodayStatus(status);
    if (status === 'yes') {
      setFeedbackMessage('Alhamdulillah! May Allah accept every step of your effort today.');
    } else {
      setFeedbackMessage('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
    }

    try {
      const updated = await recordDailyCheckIn(status, todayStr);
      setUserData(updated);
    } catch (err) {
      console.warn('Check in save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no dream set yet, show an invitation card to set Ramadan dream
  if (!userData) {
    return (
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        } ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
            isDark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
          }`}>
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                Noor Ramadan 1447 AH
              </span>
              <span className={`text-xs font-arabic ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} dir="rtl">
                رمضان كريم
              </span>
            </div>
            <h3 className={`text-sm font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              What is your spiritual dream for this Ramadan?
            </h3>
            <p className={`text-xs font-light mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Set one sincere goal, build your daily schedule, and track 30 days of divine growth.
            </p>
          </div>
        </div>

        {onNavigateToRamadan && (
          <button
            type="button"
            onClick={onNavigateToRamadan}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-cinzel font-bold tracking-wider active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <span>Set My Dream</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Calculate streak from dailyLog
  const daysAchieved = userData.dailyLog.filter((l) => l.status === 'yes').length;
  const progressPercent = Math.min(100, Math.round((daysAchieved / 30) * 100));

  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden space-y-4 ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      } ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
            isDark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
          }`}>
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Daily Ramadan Dream Check-In
            </span>
            <h4 className={`text-xs sm:text-sm font-semibold truncate max-w-xs sm:max-w-md ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              "{userData.goalText}"
            </h4>
          </div>
        </div>

        {onNavigateToRamadan && (
          <button
            type="button"
            onClick={onNavigateToRamadan}
            className={`text-[11px] font-mono hover:underline flex items-center gap-1 cursor-pointer ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}
          >
            <span>View Plan</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Question & Actions */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
            Did you work toward your Ramadan dream today?
          </p>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {daysAchieved}/30 Days Achieved ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCheckIn('yes')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              todayStatus === 'yes'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : isDark
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yes, I did!</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCheckIn('no')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              todayStatus === 'no'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-stone-300'
                : 'bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[#3F4248]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span>Not today</span>
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <p className={`text-[11px] text-center font-light italic animate-fadeIn ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            {feedbackMessage}
          </p>
        )}
      </div>
    </div>
  );
};
