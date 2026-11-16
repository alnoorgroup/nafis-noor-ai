import React, { useEffect, useRef } from 'react';

export type VisualizerPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface NoorLivingLightVisualizerProps {
  phase: VisualizerPhase;
  userVolume: number;
  aiVolume: number;
  isMuted?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
}

export const NoorLivingLightVisualizer: React.FC<NoorLivingLightVisualizerProps> = ({
  phase,
  userVolume,
  aiVolume,
  isMuted = false,
  onClick,
  ariaLabel,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitAreaRef = useRef<HTMLButtonElement | null>(null);
  const centerNormRef = useRef({ x: 0.5, y: 0.45 });
  const stateRef = useRef({
    phase,
    userVolume,
    aiVolume,
    isMuted,
  });

  stateRef.current = { phase, userVolume, aiVolume, isMuted };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let smoothedEnergy = 0;
    let smoothedSpeakingWeight = 0;
    let smoothedThinkingWeight = 0;
    let smoothedListeningWeight = 0;
    let time = 0;
    let lastTs = performance.now();

    const syncGeometry = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = Math.max(320, window.innerWidth);
      const vh = Math.max(320, window.innerHeight);
      const w = Math.round(vw * dpr);
      const h = Math.round(vh * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (hitAreaRef.current) {
        const rect = hitAreaRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          centerNormRef.current = {
            x: (rect.left + rect.width * 0.5) / vw,
            y: (rect.top + rect.height * 0.5) / vh,
          };
        }
      }
    };

    syncGeometry();
    window.addEventListener('resize', syncGeometry);

    const traceOrganicContour = (
      cx: number,
      cy: number,
      baseR: number,
      t: number,
      energy: number,
      thinkWeight: number,
      speakWeight: number
    ) => {
      const steps = 96;
      const points: Array<{ x: number; y: number }> = [];
      const morphStrength =
        0.02 + energy * (0.055 + speakWeight * 0.03) + thinkWeight * 0.02;
      const driftRate = 0.8 + thinkWeight * 0.65 + speakWeight * 0.45;

      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const lobeA = Math.sin(theta * 2 + t * 0.85 * driftRate) * 0.55;
        const lobeB = Math.cos(theta * 3 - t * 0.62 * driftRate) * 0.35;
        const lobeC = Math.sin(theta * 4 + t * 0.44) * 0.16;
        const offset = (lobeA + lobeB + lobeC) * morphStrength;
        const r = baseR * (1 + offset);
        points.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r,
        });
      }

      ctx.beginPath();
      const firstMidX = (points[steps - 1].x + points[0].x) * 0.5;
      const firstMidY = (points[steps - 1].y + points[0].y) * 0.5;
      ctx.moveTo(firstMidX, firstMidY);

      for (let i = 0; i < steps; i++) {
        const p = points[i];
        const next = points[(i + 1) % steps];
        const midX = (p.x + next.x) * 0.5;
        const midY = (p.y + next.y) * 0.5;
        ctx.quadraticCurveTo(p.x, p.y, midX, midY);
      }
      ctx.closePath();
    };

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const { phase: curPhase, userVolume: uVol, aiVolume: aVol, isMuted: muted } =
        stateRef.current;

      const rawTargetEnergy =
        curPhase === 'speaking'
          ? Math.min(1, aVol * 1.4)
          : curPhase === 'listening' && !muted
          ? Math.min(1, Math.max(0, (uVol - 0.01) * 1.65))
          : 0;

      // Smooth organic attack & graceful release
      const lerpSpeed = rawTargetEnergy > smoothedEnergy ? 0.18 : 0.075;
      smoothedEnergy += (rawTargetEnergy - smoothedEnergy) * lerpSpeed;

      smoothedSpeakingWeight +=
        ((curPhase === 'speaking' ? 1 : 0) - smoothedSpeakingWeight) * 0.07;
      smoothedThinkingWeight +=
        ((curPhase === 'thinking' ? 1 : 0) - smoothedThinkingWeight) * 0.07;
      smoothedListeningWeight +=
        ((curPhase === 'listening' && !muted ? 1 : 0) - smoothedListeningWeight) * 0.07;

      const speedFactor = prefersReducedMotion
        ? 0.25
        : 1 + smoothedSpeakingWeight * 0.35 + smoothedThinkingWeight * 0.3;
      time += dt * speedFactor;

      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const minSide = Math.min(w, h);
      if (hitAreaRef.current) {
        const rect = hitAreaRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const vw = Math.max(320, window.innerWidth);
          const vh = Math.max(320, window.innerHeight);
          const targetX = (rect.left + rect.width * 0.5) / vw;
          const targetY = (rect.top + rect.height * 0.5) / vh;
          centerNormRef.current.x += (targetX - centerNormRef.current.x) * 0.25;
          centerNormRef.current.y += (targetY - centerNormRef.current.y) * 0.25;
        }
      }
      const cx = w * centerNormRef.current.x;
      const cy = h * centerNormRef.current.y;

      ctx.clearRect(0, 0, w, h);

      // Clean responsive radius that can freely bloom without any box/square crop
      const baseUnit = Math.min(Math.max(minSide * 0.135, 58 * dpr), 108 * dpr);
      const breathe = Math.sin(time * 1.35) * 0.03;
      const thinkPulse = smoothedThinkingWeight * Math.sin(time * 2.1) * 0.025;
      const energyExpansion =
        smoothedEnergy * (0.28 + smoothedSpeakingWeight * 0.12);
      const coreRadius = baseUnit * (1 + breathe + thinkPulse + energyExpansion);

      // 1. Wide uncropped lower-horizon electric-blue ambient glow spreading gently across the entire background
      const horizonY = h * 0.88;
      const horizonR = Math.max(w, h) * (0.78 + smoothedEnergy * 0.25);
      const horizonGrad = ctx.createRadialGradient(
        cx,
        horizonY,
        coreRadius * 0.2,
        cx,
        horizonY,
        horizonR
      );
      const horizonAlpha = 0.28 + smoothedEnergy * 0.22 + smoothedListeningWeight * 0.05;
      horizonGrad.addColorStop(0, `rgba(59, 130, 246, ${horizonAlpha})`);
      horizonGrad.addColorStop(0.35, `rgba(37, 99, 235, ${horizonAlpha * 0.62})`);
      horizonGrad.addColorStop(0.7, `rgba(29, 78, 216, ${horizonAlpha * 0.18})`);
      horizonGrad.addColorStop(1, 'rgba(4, 7, 17, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Uncropped electric-blue under-orb atmospheric halo (spreads everywhere smoothly)
      const underGlowY = cy + coreRadius * 0.42;
      const underGlowR = coreRadius * (4.6 + smoothedEnergy * 2.4);
      const underGlowGrad = ctx.createRadialGradient(
        cx,
        underGlowY,
        coreRadius * 0.15,
        cx,
        underGlowY,
        underGlowR
      );
      const blueAuraAlpha = 0.36 + smoothedEnergy * 0.26 + smoothedListeningWeight * 0.06;
      underGlowGrad.addColorStop(0, `rgba(96, 165, 250, ${blueAuraAlpha})`);
      underGlowGrad.addColorStop(0.28, `rgba(59, 130, 246, ${blueAuraAlpha * 0.7})`);
      underGlowGrad.addColorStop(0.6, `rgba(37, 99, 235, ${blueAuraAlpha * 0.26})`);
      underGlowGrad.addColorStop(1, 'rgba(4, 7, 17, 0)');
      ctx.fillStyle = underGlowGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Delicate wide outer corona surrounding the living white-blue pool
      const coronaR = coreRadius * (2.35 + smoothedEnergy * 0.9);
      const coronaGrad = ctx.createRadialGradient(
        cx,
        cy + coreRadius * 0.08,
        coreRadius * 0.35,
        cx,
        cy,
        coronaR
      );
      coronaGrad.addColorStop(0, `rgba(191, 219, 254, ${0.42 + smoothedEnergy * 0.24})`);
      coronaGrad.addColorStop(0.45, `rgba(59, 130, 246, ${0.24 + smoothedEnergy * 0.2})`);
      coronaGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');

      ctx.save();
      ctx.filter = `blur(${Math.round(baseUnit * 0.28)}px)`;
      traceOrganicContour(
        cx,
        cy + coreRadius * 0.05,
        coreRadius * (1.42 + smoothedEnergy * 0.22),
        time * 0.72,
        smoothedEnergy,
        smoothedThinkingWeight,
        smoothedSpeakingWeight
      );
      ctx.fillStyle = coronaGrad;
      ctx.fill();
      ctx.restore();

      // 4. Primary living pool body: seamless luminous white center to electric-blue rim
      ctx.save();
      ctx.shadowColor = `rgba(96, 165, 250, ${0.58 + smoothedEnergy * 0.3})`;
      ctx.shadowBlur = baseUnit * (0.65 + smoothedEnergy * 0.45);
      ctx.shadowOffsetY = baseUnit * 0.1;

      const bodyShiftX = Math.cos(time * 0.55) * coreRadius * 0.07;
      const bodyShiftY = Math.sin(time * 0.48) * coreRadius * 0.07 - coreRadius * 0.08;
      const bodyGrad = ctx.createRadialGradient(
        cx + bodyShiftX,
        cy + bodyShiftY,
        coreRadius * 0.08,
        cx,
        cy + coreRadius * 0.06,
        coreRadius * 1.15
      );
      bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.99)');
      bodyGrad.addColorStop(0.44, 'rgba(239, 246, 255, 0.95)');
      bodyGrad.addColorStop(0.76, 'rgba(147, 197, 253, 0.84)');
      bodyGrad.addColorStop(1, 'rgba(59, 130, 246, 0.35)');

      traceOrganicContour(
        cx,
        cy,
        coreRadius,
        time,
        smoothedEnergy,
        smoothedThinkingWeight,
        smoothedSpeakingWeight
      );
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.restore();

      // 5. Subtle internal flowing light caustics & white inner luminescence
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const causticOneX = cx + Math.cos(time * 0.85) * coreRadius * 0.24;
      const causticOneY = cy + Math.sin(time * 0.7) * coreRadius * 0.22 - coreRadius * 0.06;
      const causticOneGrad = ctx.createRadialGradient(
        causticOneX,
        causticOneY,
        0,
        causticOneX,
        causticOneY,
        coreRadius * 0.76
      );
      causticOneGrad.addColorStop(
        0,
        `rgba(255, 255, 255, ${0.54 + smoothedEnergy * 0.26})`
      );
      causticOneGrad.addColorStop(0.55, 'rgba(219, 234, 254, 0.24)');
      causticOneGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');

      ctx.fillStyle = causticOneGrad;
      ctx.beginPath();
      ctx.arc(causticOneX, causticOneY, coreRadius * 0.76, 0, Math.PI * 2);
      ctx.fill();

      const causticTwoX = cx - Math.sin(time * 0.62) * coreRadius * 0.22;
      const causticTwoY = cy + Math.cos(time * 0.8) * coreRadius * 0.2 + coreRadius * 0.14;
      const causticTwoGrad = ctx.createRadialGradient(
        causticTwoX,
        causticTwoY,
        0,
        causticTwoX,
        causticTwoY,
        coreRadius * 0.68
      );
      causticTwoGrad.addColorStop(
        0,
        `rgba(147, 197, 253, ${0.4 + smoothedSpeakingWeight * 0.2 + smoothedEnergy * 0.18})`
      );
      causticTwoGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.15)');
      causticTwoGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');

      ctx.fillStyle = causticTwoGrad;
      ctx.beginPath();
      ctx.arc(causticTwoX, causticTwoY, coreRadius * 0.68, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncGeometry);
    };
  }, []);

  return (
    <>
      {/* Full-viewport edge-to-edge canvas so luminous glow never clips to a square */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none block z-0"
      />

      {/* Transparent centered interactive tap target aligned with the orb */}
      <button
        ref={hitAreaRef}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
        className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 select-none"
      />
    </>
  );
};
