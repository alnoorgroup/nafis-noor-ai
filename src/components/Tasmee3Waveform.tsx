import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface Tasmee3WaveformProps {
  audioLevel: number; // 0.0 to 1.0 from AnalyserNode
  isListening: boolean;
  isPaused: boolean;
  isDark: boolean;
  height?: number;
  compact?: boolean;
  showStatusHeader?: boolean;
}

export const Tasmee3Waveform: React.FC<Tasmee3WaveformProps> = ({
  audioLevel,
  isListening,
  isPaused,
  isDark,
  height = 68,
  compact = false,
  showStatusHeader = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedLevelRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  // Local state for the dynamic reactive feedback badge
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isActive = true;

    // Number of subtle background spectrum bars
    const BAR_COUNT = compact ? 18 : 28;
    const barHeights = new Float32Array(BAR_COUNT);

    const render = (timestamp: number) => {
      if (!isActive) return;

      // Throttle canvas frame rate to 30fps for smooth iOS battery & thermal balance
      if (timestamp - lastFrameTimeRef.current < 32) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      // Handle Retina / HiDPI screens
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.scale(dpr, dpr);
      }

      const centerY = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Target level with gentle breathing floor when listening so user knows mic is active
      const idleFloor = isListening && !isPaused ? 0.045 : 0.015;
      const targetLevel = isPaused ? 0.01 : isListening ? Math.max(idleFloor, audioLevel) : 0.01;

      // Damped interpolation for wave response
      smoothedLevelRef.current += (targetLevel - smoothedLevelRef.current) * 0.22;
      const currentLevel = smoothedLevelRef.current;
      const isVoiceActive = currentLevel > 0.11 && isListening && !isPaused;

      // Debounce UI state updates to max once per 120ms to prevent React re-render lag
      const now = performance.now();
      if (now - lastUiUpdateRef.current >= 120) {
        lastUiUpdateRef.current = now;
        setVoiceDetected((prev) => (prev !== isVoiceActive ? isVoiceActive : prev));
        setDisplayLevel(currentLevel);
      }

      // Phase progression (faster when reciting, tranquil when idle)
      const speed = isPaused ? 0.005 : isListening ? 0.035 + currentLevel * 0.075 : 0.01;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      // =========================================================================
      // 1. SUBTLE BACKGROUND EQUALIZER BARS (Mirrored frequency spectrum)
      // =========================================================================
      if (!compact && h >= 48) {
        const barSpacing = w / (BAR_COUNT + 1);
        const maxBarHeight = h * 0.35;

        for (let i = 0; i < BAR_COUNT; i++) {
          // Center-weighted distribution with harmonic pseudo-frequency modulation
          const distFromCenter = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
          const weight = Math.cos(distFromCenter * Math.PI * 0.48);
          const noise = Math.sin(phase * 1.5 + i * 0.45) * 0.2 + 0.8;

          const targetBarH = Math.max(
            2,
            currentLevel * maxBarHeight * weight * noise * 1.4 + (isListening ? 2.5 : 1)
          );
          barHeights[i] += (targetBarH - barHeights[i]) * 0.22;

          const bh = barHeights[i];
          const bx = (i + 1) * barSpacing;
          const barWidth = Math.max(1.8, Math.min(3.2, barSpacing * 0.45));

          // Vertical gradient for mirrored bars
          const barGrad = ctx.createLinearGradient(0, centerY - bh, 0, centerY + bh);
          if (isDark) {
            barGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
            barGrad.addColorStop(0.3, isVoiceActive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.14)');
            barGrad.addColorStop(0.5, isVoiceActive ? 'rgba(52, 211, 153, 0.42)' : 'rgba(255, 255, 255, 0.24)');
            barGrad.addColorStop(0.7, isVoiceActive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.14)');
            barGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
          } else {
            barGrad.addColorStop(0, 'rgba(17, 18, 20, 0.0)');
            barGrad.addColorStop(0.3, isVoiceActive ? 'rgba(5, 150, 105, 0.24)' : 'rgba(17, 18, 20, 0.12)');
            barGrad.addColorStop(0.5, isVoiceActive ? 'rgba(5, 150, 105, 0.36)' : 'rgba(17, 18, 20, 0.20)');
            barGrad.addColorStop(0.7, isVoiceActive ? 'rgba(5, 150, 105, 0.24)' : 'rgba(17, 18, 20, 0.12)');
            barGrad.addColorStop(1, 'rgba(17, 18, 20, 0.0)');
          }

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(bx - barWidth / 2, centerY - bh, barWidth, bh * 2, barWidth / 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 2. CENTRAL AMBIENT RADIANT GLOW (Brightens proportionally to voice energy)
      // =========================================================================
      if (isListening && !isPaused) {
        const glowRadius = Math.max(30, Math.min(w * 0.45, currentLevel * w * 0.4 + 40));
        const glowGrad = ctx.createRadialGradient(w / 2, centerY, 0, w / 2, centerY, glowRadius);

        if (isVoiceActive) {
          glowGrad.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.14)');
          glowGrad.addColorStop(0.6, isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 18, 20, 0.05)');
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          glowGrad.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(17, 18, 20, 0.06)');
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // =========================================================================
      // 3. LAYERED HARMONIC SINE CURVES WITH GRADIENTS & SILK REFLECTIONS
      // =========================================================================
      const waves = [
        // Primary crisp monochrome Noor ribbon
        {
          color: isDark ? 'rgba(243, 244, 246, 0.90)' : 'rgba(17, 18, 20, 0.88)',
          glow: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(17, 18, 20, 0.18)',
          amplitudeMult: compact ? 0.7 : 0.88,
          frequency: compact ? 0.035 : 0.022,
          phaseOffset: 0,
          lineWidth: compact ? 1.8 : 2.4,
          fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 18, 20, 0.04)',
        },
        // Secondary emerald tajweed accent wave
        {
          color: isDark ? 'rgba(16, 185, 129, 0.82)' : 'rgba(5, 150, 105, 0.85)',
          glow: isDark ? 'rgba(16, 185, 129, 0.45)' : 'rgba(5, 150, 105, 0.25)',
          amplitudeMult: compact ? 0.55 : 0.68,
          frequency: compact ? 0.045 : 0.029,
          phaseOffset: Math.PI / 2.5,
          lineWidth: compact ? 1.4 : 1.9,
          fill: null,
        },
        // Tertiary subtle muted harmonic filament
        {
          color: isDark ? 'rgba(161, 161, 170, 0.55)' : 'rgba(90, 93, 99, 0.55)',
          glow: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(17, 18, 20, 0.12)',
          amplitudeMult: compact ? 0.4 : 0.48,
          frequency: compact ? 0.055 : 0.036,
          phaseOffset: Math.PI / 1.3,
          lineWidth: compact ? 1.2 : 1.5,
          fill: null,
        },
      ];

      waves.forEach((wave) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.shadowColor = wave.glow;
        ctx.shadowBlur = compact ? 6 : 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const maxAmp = (h / 2 - (compact ? 4 : 8)) * wave.amplitudeMult * Math.min(1.25, currentLevel * 2.4 + 0.14);

        const step = compact ? 4 : 3;
        for (let x = 0; x <= w; x += step) {
          // Window envelope so edges taper smoothly to zero at ends
          const envelope = Math.sin((x / w) * Math.PI);
          // Compound sine equation with vocal harmonics
          const harmonic = Math.sin(x * wave.frequency * 2.1 + phase * 1.6) * 0.18;
          const y = centerY + Math.sin(x * wave.frequency + phase + wave.phaseOffset + harmonic) * maxAmp * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Optional subtle gradient fill under primary wave
        if (wave.fill && !compact) {
          ctx.lineTo(w, centerY);
          ctx.lineTo(0, centerY);
          ctx.closePath();
          ctx.fillStyle = wave.fill;
          ctx.shadowBlur = 0;
          ctx.fill();
        }

        ctx.restore();
      });

      // =========================================================================
      // 4. CENTRAL EQUILIBRIUM BASELINE AXIS
      // =========================================================================
      ctx.save();
      const axisGrad = ctx.createLinearGradient(0, centerY, w, centerY);
      axisGrad.addColorStop(0, 'rgba(128, 128, 128, 0)');
      axisGrad.addColorStop(0.2, isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(17, 18, 20, 0.12)');
      axisGrad.addColorStop(0.5, isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(17, 18, 20, 0.24)');
      axisGrad.addColorStop(0.8, isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(17, 18, 20, 0.12)');
      axisGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');

      ctx.strokeStyle = axisGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isActive = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioLevel, isListening, isPaused, isDark, compact]);

  // Voice level segments for VU feedback meter (0 to 5)
  const activeSegments = isPaused ? 0 : isListening ? Math.min(5, Math.ceil(displayLevel * 6)) : 0;

  return (
    <div
      id="tasmee3-waveform-container"
      className={`relative w-full overflow-hidden rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] shadow-xs'
          : 'bg-[#FCFCFA] border-black/[0.08] shadow-xs'
      } ${compact ? 'p-1.5' : 'p-3'}`}
    >
      {/* ========================================================================= */}
      {/* STATUS HUD: ACTIVE MICROPHONE BEACON + VOICE LEVEL METER                  */}
      {/* ========================================================================= */}
      {showStatusHeader && !compact && (
        <div className={`flex items-center justify-between gap-2 pb-2 mb-1 border-b text-[11px] ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          {/* Left: Active Microphone Status with animated beacon */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              {/* Animated Radar Pulse Rings */}
              {isListening && !isPaused && (
                <>
                  <span
                    className={`absolute w-4 h-4 rounded-full opacity-75 animate-ping ${
                      voiceDetected ? 'bg-emerald-400' : isDark ? 'bg-white' : 'bg-[#111214]'
                    }`}
                  />
                  <span
                    className={`absolute w-3 h-3 rounded-full opacity-50 animate-pulse ${
                      voiceDetected ? 'bg-emerald-300' : isDark ? 'bg-stone-300' : 'bg-[#3F4248]'
                    }`}
                  />
                </>
              )}
              {/* Mic Icon Core */}
              <div
                className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  isPaused
                    ? isDark ? 'bg-white/[0.08] text-stone-300' : 'bg-black/[0.08] text-[#3F4248]'
                    : isListening
                    ? voiceDetected
                      ? isDark ? 'bg-emerald-500/25 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-emerald-100 text-emerald-700'
                      : isDark ? 'bg-white/[0.12] text-white' : 'bg-[#111214] text-white'
                    : isDark ? 'bg-white/[0.06] text-stone-400' : 'bg-[#F3F3F1] text-[#5A5D63]'
                }`}
              >
                {isPaused ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="flex items-center gap-1.5 font-cinzel">
              <span
                className={`text-[11px] font-semibold tracking-wider ${
                  isPaused
                    ? isDark ? 'text-stone-300' : 'text-[#3F4248]'
                    : isListening
                    ? voiceDetected
                      ? isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'
                      : isDark ? 'text-white' : 'text-[#111214]'
                    : isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                }`}
              >
                {isPaused
                  ? 'Microphone Paused'
                  : isListening
                  ? voiceDetected
                    ? 'Voice Detected • Reciting'
                    : 'Microphone Active • Listening'
                  : 'Microphone Inactive'}
              </span>
            </div>
          </div>

          {/* Right: Live VU Voice Activity Gain Meter */}
          <div className="flex items-center gap-1.5">
            <Volume2 className={`w-3 h-3 ${voiceDetected ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-stone-400' : 'text-[#5A5D63]')}`} />
            <span className={`text-[10px] font-mono hidden sm:inline ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>Gain:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((seg) => {
                const isLit = seg <= activeSegments;
                const isEmerald = seg >= 4;
                return (
                  <div
                    key={seg}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      isLit
                        ? isEmerald
                          ? 'h-3 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                          : isDark ? 'h-2.5 bg-white' : 'h-2.5 bg-[#111214]'
                        : `h-1.5 ${isDark ? 'bg-white/[0.15]' : 'bg-black/[0.15]'}`
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANIMATED WAVEFORM CANVAS                                                  */}
      {/* ========================================================================= */}
      <div className="relative w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: `${height}px` }}
        />

        {/* Ambient Subtle Center Status for compact mode */}
        {compact && isListening && !isPaused && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                voiceDetected ? 'bg-emerald-400 animate-ping' : isDark ? 'bg-white animate-pulse' : 'bg-[#111214] animate-pulse'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
