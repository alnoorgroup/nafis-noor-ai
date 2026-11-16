import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { NoorAIMessage } from '../../types';
import {
  formatVoiceTime,
  getCachedSessionAudioUrl,
  loadVoiceClipUrl,
  normalizeWaveformBars,
  stopAllVoicePlayback,
} from './voiceAudioCache';

interface NoorVoiceMessagePlayerProps {
  message: NoorAIMessage;
  isDark: boolean;
  isArabic: boolean;
  onUnavailable?: () => void;
}

export const NoorVoiceMessagePlayer: React.FC<NoorVoiceMessagePlayerProps> = ({
  message,
  isDark,
  isArabic,
  onUnavailable,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.audioDuration || 1);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    return (
      getCachedSessionAudioUrl(message.id) ||
      (message.audioUrl && !message.audioUrl.startsWith('blob:')
        ? message.audioUrl
        : message.audioUrl || null)
    );
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const bars = useMemo(
    () => normalizeWaveformBars(message.audioWaveform || [], 28),
    [message.audioWaveform]
  );

  // Hydrate persistent blob URL from IndexedDB if needed (e.g. after page refresh)
  useEffect(() => {
    let active = true;
    if (!resolvedUrl || resolvedUrl.startsWith('blob:')) {
      loadVoiceClipUrl(message.id).then((url) => {
        if (active && url) {
          setResolvedUrl(url);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [message.id, resolvedUrl]);

  // Smooth 60fps playback progress & waveform sweep while audio plays
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const updatePlaybackTick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
        rafRef.current = requestAnimationFrame(updatePlaybackTick);
      }
    };

    rafRef.current = requestAnimationFrame(updatePlaybackTick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  // Listen to global stop events so only one audio clip plays at a time
  useEffect(() => {
    const handleStopOthers = (e: Event) => {
      const detail = (e as CustomEvent<{ exceptId?: string }>).detail;
      if (detail?.exceptId !== message.id && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('noor:stop-voice-playback', handleStopOthers);
    return () => {
      window.removeEventListener('noor:stop-voice-playback', handleStopOthers);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [message.id]);

  const ensureAudioElement = async (): Promise<HTMLAudioElement | null> => {
    if (audioRef.current) return audioRef.current;

    let src = resolvedUrl || getCachedSessionAudioUrl(message.id);
    if (!src) {
      src = (await loadVoiceClipUrl(message.id)) || undefined;
      if (src) setResolvedUrl(src);
    }
    if (!src) return null;

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = async () => {
      const dbUrl = await loadVoiceClipUrl(message.id);
      if (dbUrl && dbUrl !== audio.src) {
        setResolvedUrl(dbUrl);
        audio.src = dbUrl;
        audio.load();
        return;
      }
      setIsPlaying(false);
      onUnavailable?.();
    };

    return audio;
  };

  const handleTogglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = await ensureAudioElement();
    if (!audio) {
      onUnavailable?.();
      return;
    }

    stopAllVoicePlayback(message.id);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      onUnavailable?.();
    }
  };

  const handleScrub = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const audio = await ensureAudioElement();
    const total =
      audio && Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : duration;
    const nextTime = ratio * total;
    if (audio) {
      audio.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  };

  const safeDuration = Math.max(1, duration);
  const progress = Math.max(0, Math.min(1, currentTime / safeDuration));

  return (
    <div
      dir="ltr"
      className="flex items-center gap-3 w-[235px] sm:w-[275px] max-w-full py-0.5 select-none"
    >
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
          isDark
            ? 'bg-white text-[#111214]'
            : 'bg-[#111214] text-white'
        }`}
        aria-label={
          isPlaying
            ? isArabic
              ? 'إيقاف الصوت'
              : 'Pause voice message'
            : isArabic
            ? 'تشغيل الرسالة الصوتية'
            : 'Play voice message'
        }
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-[1px]" />
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div
          onClick={handleScrub}
          role="slider"
          aria-label={isArabic ? 'موضع التشغيل' : 'Audio playback position'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-6 flex items-center justify-between gap-[2px] cursor-pointer"
        >
          {bars.map((val, idx) => {
            const barPos = (idx + 0.5) / bars.length;
            const isPlayed = barPos <= progress;
            const distance = Math.abs(barPos - progress);
            const activePulse = isPlaying && distance < 0.08 ? 1 + (0.08 - distance) * 2.2 : 1;
            const barHeight = Math.min(22, Math.round((4 + val * 16) * activePulse));

            return (
              <span
                key={idx}
                className={`w-[2.5px] rounded-full transition-[height,background-color] duration-75 ${
                  isPlayed
                    ? isDark
                      ? 'bg-white'
                      : 'bg-[#111214]'
                    : isDark
                    ? 'bg-white/25'
                    : 'bg-black/20'
                }`}
                style={{ height: `${barHeight}px` }}
              />
            );
          })}
        </div>

        <div
          className={`flex items-center justify-between text-[11px] font-medium tabular-nums leading-none ${
            isDark ? 'text-stone-400' : 'text-[#6B6F76]'
          }`}
        >
          <span>{formatVoiceTime(currentTime)}</span>
          <span>{formatVoiceTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
