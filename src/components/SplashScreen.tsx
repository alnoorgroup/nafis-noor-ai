/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_EASE, isReducedMotionActive } from '../utils/animations';
import { t, getLanguageCode } from '../utils/i18n';

interface SplashScreenProps {
  onComplete: () => void;
  isDark?: boolean;
  language?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  scale: number;
  duration: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isDark = true, language }) => {
  const lang = getLanguageCode(language);
  const [phase, setPhase] = useState<'fade-in' | 'scattering' | 'complete'>('fade-in');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isReducedMotionActive()) {
      onComplete();
      return;
    }

    const generated: Particle[] = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const distance = 90 + Math.random() * 160;
      generated.push({
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: Math.random() * 3 + 2,
        scale: Math.random() * 0.8 + 0.6,
        duration: 0.6 + Math.random() * 0.4,
      });
    }
    setParticles(generated);

    const scatterTimer = setTimeout(() => {
      setPhase('scattering');
    }, 2000);

    const finishTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(scatterTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('complete');
    onComplete();
  };

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.4, ease: DEFAULT_EASE },
          }}
          onClick={handleSkip}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden ${
            isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
          }`}
        >
          {/* Subtle Ambient Neutral Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1.2 }}
            transition={{ duration: 1.5, ease: DEFAULT_EASE }}
            className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              isDark ? 'bg-white/10' : 'bg-black/[0.06]'
            }`}
          />

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-4">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={
                phase === 'fade-in'
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{
                duration: phase === 'fade-in' ? 1.2 : 0.5,
                ease: DEFAULT_EASE,
              }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <span className={`text-2xl ${isDark ? 'text-white' : 'text-[#111214]'}`}>☪</span>
              </div>

              <h1
                dir="rtl"
                className={`font-arabic text-3xl sm:text-5xl font-bold leading-relaxed select-none ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </h1>

              <p className={`font-serif-heading italic text-xs sm:text-sm font-light tracking-wide max-w-md mx-auto ${
                isDark ? 'text-stone-300' : 'text-[#5A5D63]'
              }`}>
                {t(lang, 'bismillahTranslation')}
              </p>

              <div className="pt-4 flex items-center justify-center gap-2">
                <div className={`h-[1px] w-8 bg-gradient-to-r from-transparent ${isDark ? 'to-white/40' : 'to-black/25'}`} />
                <span className={`text-[10px] font-cinzel uppercase tracking-[0.25em] ${
                  isDark ? 'text-stone-300' : 'text-[#111214]'
                }`}>
                  {t(lang, 'appEmblemText')}
                </span>
                <div className={`h-[1px] w-8 bg-gradient-to-l from-transparent ${isDark ? 'to-white/40' : 'to-black/25'}`} />
              </div>
            </motion.div>

            {phase === 'scattering' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: 0,
                      scale: 0.2,
                    }}
                    transition={{
                      duration: p.duration,
                      ease: DEFAULT_EASE,
                    }}
                    className={`absolute rounded-full ${isDark ? 'bg-white/80' : 'bg-[#111214]/70'}`}
                    style={{
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={`absolute bottom-6 text-[11px] font-sans tracking-wide ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
            Tap anywhere to enter
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
