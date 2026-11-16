import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Loader2, Pause, Play, X } from 'lucide-react';
import {
  formatVoiceTime,
  normalizeWaveformBars,
  stopAllVoicePlayback,
} from './voiceAudioCache';

export type VoiceRecorderState =
  | 'idle'
  | 'recording'
  | 'stopped'
  | 'preview'
  | 'sending'
  | 'sent';

export interface RecordedVoicePayload {
  blob: Blob;
  objectUrl: string;
  dataUrl?: string;
  base64Data: string;
  mimeType: string;
  durationSeconds: number;
  waveform: number[];
}

interface NoorVoiceRecorderProps {
  state: VoiceRecorderState;
  onStateChange: (next: VoiceRecorderState) => void;
  onSendVoice: (payload: RecordedVoicePayload) => Promise<void>;
  onCancel: () => void;
  onPermissionError: (message: string) => void;
  isDark: boolean;
  isArabic: boolean;
}

const WAVEFORM_BAR_COUNT = 32;
const IDLE_BASELINE_BARS = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, idx) => {
  const wave = Math.sin((idx / WAVEFORM_BAR_COUNT) * Math.PI * 2.4) * 0.035;
  return 0.16 + wave;
});

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read audio blob'));
      }
    };
    reader.onerror = () => reject(new Error('Audio encoding failed'));
    reader.readAsDataURL(blob);
  });
}

export const NoorVoiceRecorder: React.FC<NoorVoiceRecorderProps> = ({
  state,
  onStateChange,
  onSendVoice,
  onCancel,
  onPermissionError,
  isDark,
  isArabic,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveBars, setLiveBars] = useState<number[]>(IDLE_BASELINE_BARS);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>(IDLE_BASELINE_BARS);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const capturedAmplitudesRef = useRef<number[]>([]);
  const scrollingBarsRef = useRef<number[]>([...IDLE_BASELINE_BARS]);
  const finalizedPayloadRef = useRef<RecordedVoicePayload | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopResolveRef = useRef<((payload: RecordedVoicePayload | null) => void) | null>(null);
  const sessionSeqRef = useRef<number>(0);
  const handedOffRef = useRef<boolean>(false);

  const stopAudioEngine = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const cleanupPreviewAudio = useCallback(() => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
      previewAudioRef.current = null;
    }
  }, []);

  const buildRecordedPayload = useCallback(
    async (chunks: Blob[], mimeType: string, durationSec: number): Promise<RecordedVoicePayload | null> => {
      if (!chunks.length) return null;
      const finalMime = mimeType || chunks[0]?.type || 'audio/webm';
      const blob = new Blob(chunks, { type: finalMime });
      if (blob.size === 0) return null;

      const objectUrl = URL.createObjectURL(blob);
      const dataUrl = await blobToDataUrl(blob);
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const waveform = normalizeWaveformBars(capturedAmplitudesRef.current, WAVEFORM_BAR_COUNT);

      return {
        blob,
        objectUrl,
        dataUrl: dataUrl.length <= 120_000 ? dataUrl : undefined,
        base64Data,
        mimeType: finalMime,
        durationSeconds: Math.max(1, durationSec),
        waveform,
      };
    },
    []
  );

  const startRecording = useCallback(
    async (activeSeq: number) => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        onPermissionError(
          isArabic
            ? 'تسجيل الصوت غير مدعوم في هذا المتصفح.'
            : 'Audio recording is not supported in this browser.'
        );
        onCancel();
        return;
      }

      try {
        stopAllVoicePlayback();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Guard against StrictMode unmount / stale async resolution
        if (sessionSeqRef.current !== activeSeq) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        audioChunksRef.current = [];
        capturedAmplitudesRef.current = [];
        scrollingBarsRef.current = [...IDLE_BASELINE_BARS];
        finalizedPayloadRef.current = null;
        handedOffRef.current = false;
        setElapsedSeconds(0);
        setPreviewProgress(0);
        setPreviewCurrentTime(0);
        setLiveBars(IDLE_BASELINE_BARS);

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          if (sessionSeqRef.current !== activeSeq) {
            audioCtx.close().catch(() => {});
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.72;
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        }

        const preferredMime = pickSupportedMimeType();
        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const finalDuration = Math.max(
            1,
            Math.round((Date.now() - startTimeRef.current) / 1000)
          );
          stopAudioEngine();

          try {
            const payload = await buildRecordedPayload(
              audioChunksRef.current,
              recorder.mimeType || preferredMime,
              finalDuration
            );
            if (sessionSeqRef.current === activeSeq && payload) {
              finalizedPayloadRef.current = payload;
              setRecordedWaveform(payload.waveform);
              setRecordedDuration(payload.durationSeconds);
            }
            if (stopResolveRef.current) {
              stopResolveRef.current(payload);
              stopResolveRef.current = null;
            }
          } catch {
            if (stopResolveRef.current) {
              stopResolveRef.current(null);
              stopResolveRef.current = null;
            }
          }
        };

        startTimeRef.current = Date.now();
        recorder.start(100);

        timerIntervalRef.current = window.setInterval(() => {
          if (sessionSeqRef.current !== activeSeq) return;
          const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(secs);
        }, 200);

        const freqBuffer = analyserRef.current
          ? new Uint8Array(analyserRef.current.frequencyBinCount)
          : null;
        const timeBuffer = analyserRef.current
          ? new Uint8Array(analyserRef.current.fftSize)
          : null;

        let lastUiUpdate = 0;

        const updateWaveformFrame = (timestamp: number) => {
          if (sessionSeqRef.current !== activeSeq) return;

          if (timestamp - lastUiUpdate >= 32) {
            lastUiUpdate = timestamp;
            const analyser = analyserRef.current;

            if (analyser && freqBuffer && timeBuffer) {
              analyser.getByteTimeDomainData(timeBuffer);
              analyser.getByteFrequencyData(freqBuffer);

              // True RMS vocal loudness from time-domain waveform
              let sumSquares = 0;
              for (let i = 0; i < timeBuffer.length; i++) {
                const centered = (timeBuffer[i] - 128) / 128;
                sumSquares += centered * centered;
              }
              const rms = Math.sqrt(sumSquares / timeBuffer.length);

              // Lower-mid speech frequency energy (bins 1..28)
              let freqSum = 0;
              const speechBins = Math.min(28, freqBuffer.length);
              for (let i = 1; i < speechBins; i++) {
                freqSum += freqBuffer[i];
              }
              const avgFreq = speechBins > 1 ? freqSum / ((speechBins - 1) * 255) : 0;

              const combinedAmplitude = Math.max(rms * 3.1, avgFreq * 2.2);
              const isSilent = rms < 0.012 && avgFreq < 0.025;

              const recordedPoint = isSilent
                ? 0.15
                : Math.min(1, Math.max(0.18, combinedAmplitude));
              capturedAmplitudesRef.current.push(recordedPoint);

              // Blend scrolling speech cadence + shaped frequency bars for organic Apple waveform motion
              const prev = scrollingBarsRef.current;
              const nextBars = new Array<number>(WAVEFORM_BAR_COUNT);
              for (let idx = 0; idx < WAVEFORM_BAR_COUNT; idx++) {
                if (isSilent) {
                  const idleBreath = Math.sin(timestamp * 0.0032 + idx * 0.42) * 0.032;
                  const targetIdle = 0.16 + idleBreath;
                  nextBars[idx] = prev[idx] + (targetIdle - prev[idx]) * 0.2;
                } else {
                  const neighbor = idx < WAVEFORM_BAR_COUNT - 1 ? prev[idx + 1] : recordedPoint;
                  const binIdx = 1 + Math.floor((idx / WAVEFORM_BAR_COUNT) * Math.max(1, speechBins - 2));
                  const binVal = Math.min(1, (freqBuffer[binIdx] / 255) * 1.9);
                  const ripple = (neighbor * 0.42) + (binVal * 0.34) + (recordedPoint * 0.24);
                  const clamped = Math.min(1, Math.max(0.16, ripple));
                  nextBars[idx] = prev[idx] + (clamped - prev[idx]) * 0.48;
                }
              }
              scrollingBarsRef.current = nextBars;
              setLiveBars(nextBars);
            } else {
              const fallbackBars = IDLE_BASELINE_BARS.map(
                (_, idx) => 0.16 + Math.abs(Math.sin(timestamp * 0.004 + idx * 0.45)) * 0.14
              );
              setLiveBars(fallbackBars);
            }
          }

          rafRef.current = requestAnimationFrame(updateWaveformFrame);
        };

        rafRef.current = requestAnimationFrame(updateWaveformFrame);
      } catch (err: unknown) {
        if (sessionSeqRef.current !== activeSeq) return;
        stopAudioEngine();
        const errName = err instanceof DOMException ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          onPermissionError(
            isArabic
              ? 'يرجى السماح بالوصول إلى الميكروفون لتسجيل رسالة صوتية.'
              : 'Microphone permission was denied. Please allow access to record.'
          );
        } else if (errName === 'NotFoundError') {
          onPermissionError(
            isArabic
              ? 'لم يتم العثور على ميكروفون متصل.'
              : 'No microphone was detected on this device.'
          );
        } else {
          onPermissionError(
            isArabic
              ? 'تعذر بدء التسجيل الصوتي حالياً.'
              : 'Could not start audio recording.'
          );
        }
        onCancel();
      }
    },
    [buildRecordedPayload, isArabic, onCancel, onPermissionError, stopAudioEngine]
  );

  // Start microphone recording cleanly on mount; safe under React 19 StrictMode
  useEffect(() => {
    const currentSeq = ++sessionSeqRef.current;
    if (state === 'recording') {
      void startRecording(currentSeq);
    }

    return () => {
      sessionSeqRef.current++;
      stopAudioEngine();
      cleanupPreviewAudio();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors during unmount
        }
      }
      if (!handedOffRef.current && finalizedPayloadRef.current?.objectUrl) {
        URL.revokeObjectURL(finalizedPayloadRef.current.objectUrl);
      }
    };
  }, []);

  // Smooth 60fps progress animation during preview playback
  useEffect(() => {
    if (state !== 'preview') {
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
      return;
    }

    const tickPreviewProgress = () => {
      const audio = previewAudioRef.current;
      const payload = finalizedPayloadRef.current;
      if (audio && payload && !audio.paused) {
        const total =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : payload.durationSeconds;
        setPreviewCurrentTime(audio.currentTime);
        setPreviewProgress(total > 0 ? Math.min(1, audio.currentTime / total) : 0);
        previewRafRef.current = requestAnimationFrame(tickPreviewProgress);
      }
    };

    previewRafRef.current = requestAnimationFrame(tickPreviewProgress);
    return () => {
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
    };
  }, [state]);

  const stopActiveRecording = useCallback((): Promise<RecordedVoicePayload | null> => {
    if (finalizedPayloadRef.current) {
      return Promise.resolve(finalizedPayloadRef.current);
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopAudioEngine();
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      } catch {
        stopAudioEngine();
        resolve(null);
      }
    });
  }, [stopAudioEngine]);

  const handleStopTap = async () => {
    if (state !== 'recording') return;
    const payload = await stopActiveRecording();
    if (!payload) {
      onPermissionError(
        isArabic
          ? 'لم يتم التقاط صوت كافٍ. حاول مرة أخرى.'
          : 'No audio was captured. Please try again.'
      );
      onCancel();
      return;
    }
    onStateChange('stopped');
  };

  const handleTogglePreview = () => {
    const payload = finalizedPayloadRef.current;
    if (!payload) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(payload.objectUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        const total =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : payload.durationSeconds;
        setPreviewCurrentTime(audio.currentTime);
        setPreviewProgress(total > 0 ? Math.min(1, audio.currentTime / total) : 0);
      };

      audio.onended = () => {
        setPreviewProgress(0);
        setPreviewCurrentTime(0);
        onStateChange('stopped');
      };

      audio.onerror = () => {
        onStateChange('stopped');
      };
    }

    const audio = previewAudioRef.current;
    if (state === 'preview') {
      audio.pause();
      onStateChange('stopped');
    } else {
      stopAllVoicePlayback();
      audio
        .play()
        .then(() => {
          onStateChange('preview');
        })
        .catch(() => {
          onStateChange('stopped');
        });
    }
  };

  const handleSeekPreview = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state !== 'stopped' && state !== 'preview') return;
    const payload = finalizedPayloadRef.current;
    if (!payload) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = ratio * payload.durationSeconds;

    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = targetSeconds;
    }
    setPreviewProgress(ratio);
    setPreviewCurrentTime(targetSeconds);
  };

  const handleDiscard = async () => {
    cleanupPreviewAudio();
    if (state === 'recording') {
      await stopActiveRecording();
    }
    if (finalizedPayloadRef.current?.objectUrl) {
      URL.revokeObjectURL(finalizedPayloadRef.current.objectUrl);
      finalizedPayloadRef.current = null;
    }
    onCancel();
  };

  const handleSend = async () => {
    if (state === 'sending' || state === 'sent') return;
    cleanupPreviewAudio();
    onStateChange('sending');

    let payload = finalizedPayloadRef.current;
    if (!payload) {
      payload = await stopActiveRecording();
    }

    if (!payload) {
      onPermissionError(
        isArabic
          ? 'تعذر تجهيز المقطع الصوتي للإرسال.'
          : 'Could not prepare the voice recording.'
      );
      onCancel();
      return;
    }

    handedOffRef.current = true;
    finalizedPayloadRef.current = null;
    await onSendVoice(payload);
  };

  const isRecording = state === 'recording';
  const isStoppedOrPreview = state === 'stopped' || state === 'preview';
  const isSending = state === 'sending';
  const displayedBars = isRecording ? liveBars : recordedWaveform;
  const displayedTime = isRecording
    ? elapsedSeconds
    : state === 'preview' || previewCurrentTime > 0
    ? Math.floor(previewCurrentTime)
    : recordedDuration || elapsedSeconds;

  const pillSurfaceClass = isDark
    ? 'bg-[#14161A] border-white/[0.1] shadow-[0_6px_24px_rgba(0,0,0,0.45)]'
    : 'bg-white border-black/[0.1] shadow-[0_3px_14px_rgba(0,0,0,0.05)]';

  return (
    <motion.div
      dir="ltr"
      initial={{ opacity: 0, scale: 0.985, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: 4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 sm:gap-2.5 w-full"
    >
      <button
        type="button"
        disabled={isSending}
        onClick={isRecording ? handleStopTap : handleTogglePreview}
        className={`w-[68px] sm:w-[78px] h-[52px] rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${pillSurfaceClass} ${
          isDark
            ? 'hover:bg-[#1B1D23] text-white'
            : 'hover:bg-[#F7F7F5] text-[#111214]'
        }`}
        aria-label={
          isRecording
            ? isArabic
              ? 'إيقاف التسجيل'
              : 'Stop recording'
            : state === 'preview'
            ? isArabic
              ? 'إيقاف المعاينة'
              : 'Pause preview'
            : isArabic
            ? 'استماع للمعاينة'
            : 'Preview recording'
        }
        title={
          isRecording
            ? isArabic
              ? 'إيقاف التسجيل'
              : 'Stop recording'
            : state === 'preview'
            ? isArabic
              ? 'إيقاف المعاينة'
              : 'Pause'
            : isArabic
            ? 'معاينة الصوت'
            : 'Preview'
        }
      >
        {isRecording ? (
          <span
            className={`w-[14px] h-[14px] rounded-[3.5px] block transition-transform ${
              isDark ? 'bg-white' : 'bg-[#111214]'
            }`}
          />
        ) : state === 'preview' ? (
          <Pause className="w-[17px] h-[17px] fill-current" />
        ) : (
          <Play className="w-[17px] h-[17px] fill-current translate-x-[1px]" />
        )}
      </button>

      <div
        className={`flex-1 min-w-0 h-[52px] rounded-full border px-4 sm:px-5 flex items-center gap-3.5 overflow-hidden transition-colors ${pillSurfaceClass}`}
      >
        <span
          className={`text-[15px] font-medium tabular-nums tracking-tight shrink-0 min-w-[38px] ${
            isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
          }`}
        >
          {formatVoiceTime(displayedTime)}
        </span>

        <div
          onClick={handleSeekPreview}
          role={isStoppedOrPreview ? 'slider' : undefined}
          aria-label={isArabic ? 'مؤشر الصوت' : 'Audio waveform'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(previewProgress * 100)}
          className={`flex-1 min-w-0 h-7 flex items-center justify-between gap-[2px] sm:gap-[3px] select-none ${
            isStoppedOrPreview ? 'cursor-pointer' : ''
          }`}
        >
          {displayedBars.map((level, idx) => {
            const barRatio = (idx + 0.5) / displayedBars.length;
            const isPlayed = isStoppedOrPreview && barRatio <= previewProgress;
            const heightPx = Math.round(4 + Math.max(0.12, Math.min(1, level)) * 22);

            return (
              <span
                key={idx}
                className={`w-[2.5px] rounded-full transition-[height,background-color] duration-75 ${
                  isRecording
                    ? isDark
                      ? level > 0.28
                        ? 'bg-white/90'
                        : 'bg-white/25'
                      : level > 0.28
                      ? 'bg-[#636770]'
                      : 'bg-[#C4C7CE]'
                    : isPlayed
                    ? isDark
                      ? 'bg-white'
                      : 'bg-[#111214]'
                    : isDark
                    ? 'bg-white/25'
                    : 'bg-[#C4C7CE]'
                }`}
                style={{ height: `${heightPx}px` }}
              />
            );
          })}
        </div>

        {isStoppedOrPreview && (
          <button
            type="button"
            onClick={handleDiscard}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]'
                : 'text-[#6B6F76] hover:text-[#111214] hover:bg-black/[0.06]'
            }`}
            aria-label={isArabic ? 'إلغاء التسجيل' : 'Discard recording'}
            title={isArabic ? 'إلغاء' : 'Discard'}
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={isSending}
        onClick={handleSend}
        className={`w-[68px] sm:w-[78px] h-[52px] rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
          isDark
            ? 'bg-white hover:bg-stone-200 text-[#111214] shadow-md'
            : 'bg-[#111214] hover:bg-[#23252A] text-white shadow-[0_3px_12px_rgba(0,0,0,0.16)]'
        }`}
        aria-label={isArabic ? 'إرسال الرسالة الصوتية' : 'Send voice message'}
        title={isArabic ? 'إرسال' : 'Send'}
      >
        {isSending ? (
          <Loader2 className="w-[18px] h-[18px] animate-spin" />
        ) : (
          <ArrowUp className="w-[19px] h-[19px] stroke-[2.2]" />
        )}
      </button>
    </motion.div>
  );
};
