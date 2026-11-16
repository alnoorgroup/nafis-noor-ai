import React from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Check,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { Tasmee3Status } from '../utils/tasmee3Speech';
import { Tasmee3Waveform } from './Tasmee3Waveform';

interface Tasmee3DockedBarProps {
  isDark: boolean;
  status: Tasmee3Status;
  surahName: string;
  surahEnglishName: string;
  currentVerse: number;
  startingVerse: number;
  totalAyahs: number;
  audioLevel: number;
  uncertainMessage: string | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onFinish: () => void;
  onExpand: () => void;
  onDismissUncertain: () => void;
}

export const Tasmee3DockedBar: React.FC<Tasmee3DockedBarProps> = ({
  isDark,
  status,
  surahName,
  surahEnglishName,
  currentVerse,
  startingVerse,
  totalAyahs,
  audioLevel,
  uncertainMessage,
  onPause,
  onResume,
  onStop,
  onFinish,
  onExpand,
  onDismissUncertain,
}) => {
  if (status === 'idle' || status === 'stopped' || status === 'finished') {
    return null;
  }

  return (
    <div
      id="tasmee3-docked-bar"
      className={`fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 z-40 sm:max-w-md w-auto rounded-3xl p-3 sm:p-4 border shadow-md transition-all duration-200 animate-fadeIn ${
        isDark
          ? 'bg-[#14161A]/95 backdrop-blur-xl border-white/[0.1] shadow-[0_2px_12px_rgba(0,0,0,0.4)] text-[#F3F4F6]'
          : 'bg-white/95 backdrop-blur-xl border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-[#111214]'
      }`}
    >
      {/* Top row: Status, Surah info, Expand */}
      <div className={`flex items-center justify-between gap-2 mb-2 pb-2 border-b ${
        isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
      }`}>
        <div className="flex items-center gap-2">
          {/* Audio reactive pulse icon */}
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
              status === 'listening'
                ? isDark
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                : isDark
                ? 'bg-white/[0.08] border-white/[0.15] text-stone-300'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#3F4248]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold font-serif-heading ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Tasmee3 Active
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                  status === 'listening'
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isDark ? 'bg-white/[0.08] text-stone-300' : 'bg-[#F3F3F1] text-[#3F4248] border border-black/[0.08]'
                }`}
              >
                {status === 'listening' ? 'Listening…' : 'Paused'}
              </span>
            </div>
            <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Surah {surahEnglishName} ({surahName})
            </div>
          </div>
        </div>

        {/* Expand full modal */}
        <button
          onClick={onExpand}
          className={`p-1.5 rounded-xl active:scale-95 transition-all ${
            isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
          }`}
          title="Expand Tasmee3 Full View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Position Display */}
      <div className="flex items-center justify-between gap-2 my-1.5">
        <div>
          <div className={`text-[11px] font-cinzel ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Current position:</div>
          <div className={`text-sm font-bold font-serif-heading ${isDark ? 'text-white' : 'text-[#111214]'}`}>
            Verse {currentVerse} <span className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>of {totalAyahs}</span>
          </div>
        </div>

        {/* Real-time Compact Animated Voice Waveform */}
        <div className="w-32 sm:w-36 shrink-0">
          <Tasmee3Waveform
            audioLevel={audioLevel}
            isListening={status === 'listening'}
            isPaused={status === 'paused'}
            isDark={isDark}
            height={28}
            compact={true}
            showStatusHeader={false}
          />
        </div>
      </div>

      {/* Uncertain notice banner */}
      {uncertainMessage && (
        <div className={`mt-2 p-2 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 ${
          isDark ? 'bg-white/[0.06] border-white/[0.12] text-stone-200' : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
        }`}>
          <div className="flex items-center gap-1.5">
            <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
            <span>{uncertainMessage}</span>
          </div>
          <button
            onClick={onDismissUncertain}
            className={`text-[10px] ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#5A5D63] hover:text-[#111214]'}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Control buttons: Pause/Resume, Stop, Finish */}
      <div className={`flex items-center justify-between gap-2 mt-2 pt-2 border-t ${
        isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
      }`}>
        {status === 'listening' ? (
          <button
            onClick={onPause}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 ${
              isDark
                ? 'bg-[#1B1D23] hover:bg-white/[0.08] text-stone-200 border-white/[0.1]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border-black/[0.08]'
            }`}
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onResume}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 ${
              isDark
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={onStop}
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 ${
            isDark
              ? 'bg-[#1B1D23] hover:bg-white/[0.08] text-stone-300 border-white/[0.1]'
              : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#3F4248] border-black/[0.08]'
          }`}
        >
          <Square className="w-3 h-3" />
          <span>Stop</span>
        </button>

        <button
          onClick={onFinish}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 ${
            isDark
              ? 'bg-white hover:bg-stone-200 text-[#111214]'
              : 'bg-[#111214] hover:bg-[#27292D] text-white'
          }`}
        >
          <Check className="w-3 h-3" />
          <span>Finish</span>
        </button>
      </div>
    </div>
  );
};
