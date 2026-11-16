import React, { useMemo } from 'react';
import { QuranTeacherState } from '../../types/quranTeacher';

interface QuranTeacherWaveformProps {
  audioLevel: number; // 0 to 1
  frequencyData?: Uint8Array | null;
  isActive: boolean;
  isDark: boolean;
  state: QuranTeacherState;
}

export const QuranTeacherWaveform: React.FC<QuranTeacherWaveformProps> = ({
  audioLevel,
  frequencyData,
  isActive,
  isDark,
  state,
}) => {
  const barCount = 28;

  // Compute heights for each bar from live frequency spectrum if available, or smoothed level
  const bars = useMemo(() => {
    const list: number[] = [];
    if (frequencyData && frequencyData.length > 0 && isActive && state === 'listening') {
      const step = Math.floor(frequencyData.length / barCount);
      for (let i = 0; i < barCount; i++) {
        const val = frequencyData[i * step] || 0;
        // Normalize 0..255 to min 12% max 100%
        const normalized = Math.max(0.12, Math.min(1.0, (val / 255) * 1.5 + (audioLevel * 0.4)));
        list.push(normalized);
      }
    } else if (state === 'ai_speaking') {
      // Gentle rhythmic teacher wave
      for (let i = 0; i < barCount; i++) {
        const curve = Math.sin((i / barCount) * Math.PI) * 0.65 + 0.25;
        list.push(curve);
      }
    } else if (state === 'evaluating') {
      // Shimmering evaluation pulse
      for (let i = 0; i < barCount; i++) {
        list.push(0.35);
      }
    } else {
      // Resting subtle baseline
      for (let i = 0; i < barCount; i++) {
        list.push(0.12);
      }
    }
    return list;
  }, [frequencyData, audioLevel, isActive, state]);

  // Color theme according to state
  const getBarColor = (index: number) => {
    if (state === 'ai_speaking') {
      return isDark ? 'bg-white' : 'bg-[#111214]';
    }
    if (state === 'evaluating') {
      return isDark ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600 animate-pulse';
    }
    if (state === 'listening') {
      if (audioLevel > 0.08) {
        return isDark
          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
          : 'bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.3)]';
      }
      return isDark ? 'bg-white/40' : 'bg-[#111214]/40';
    }
    return isDark ? 'bg-stone-700' : 'bg-stone-300';
  };

  return (
    <div className="w-full flex items-center justify-center gap-1.5 h-14 px-4 overflow-hidden select-none">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-75 origin-center ${getBarColor(i)}`}
          style={{
            height: `${Math.round(height * 48)}px`,
            minHeight: '6px',
            transform: state === 'ai_speaking' ? `scaleY(${0.6 + 0.4 * Math.sin((i + Date.now() / 200) * 0.5)})` : 'scaleY(1)',
          }}
        />
      ))}
    </div>
  );
};
