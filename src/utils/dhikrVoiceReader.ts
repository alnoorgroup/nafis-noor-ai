import { getApiUrl } from './apiConfig';

export interface DhikrPlaybackCallbacks {
  onLoading?: (loading: boolean) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (err?: unknown) => void;
}

const dhikrAudioCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 80;

/**
 * Strips Quranic brackets, chapter numbers, and Markdown noise
 * so the neural voice speaks pure, natural Arabic prose and supplications.
 */
export function prepareDhikrSpeechText(rawArabic: string): string {
  if (!rawArabic) return '';
  return rawArabic
    .replace(/[﴿﴾\[\]\(\)*_`#~•]/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class DhikrVoiceController {
  private audioEl: HTMLAudioElement | null = null;
  private activeId: string | null = null;
  private abortController: AbortController | null = null;
  private callbacks: DhikrPlaybackCallbacks = {};

  public getActiveId(): string | null {
    return this.activeId;
  }

  public isPlaying(): boolean {
    if (this.audioEl && !this.audioEl.paused && !this.audioEl.ended) {
      return true;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
    }
    return false;
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.audioEl) {
      try {
        this.audioEl.oncanplay = null;
        this.audioEl.onplay = null;
        this.audioEl.onpause = null;
        this.audioEl.onended = null;
        this.audioEl.onerror = null;
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {
        // ignore cleanup error
      }
      this.audioEl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    this.activeId = null;
    this.callbacks.onLoading?.(false);
  }

  public async toggle(
    id: string,
    arabicText: string,
    fallbackAudioUrl: string | undefined,
    callbacks: DhikrPlaybackCallbacks
  ): Promise<void> {
    // Pause or resume if toggling the currently active Dhikr
    if (this.activeId === id && this.audioEl) {
      if (!this.audioEl.paused && !this.audioEl.ended) {
        this.audioEl.pause();
        callbacks.onPause?.();
        return;
      }
      if (this.audioEl.paused && !this.audioEl.ended) {
        try {
          await this.audioEl.play();
          callbacks.onPlay?.();
          return;
        } catch {
          // Proceed to regenerate if resume fails
        }
      }
    }

    // If tapping the currently loading item, cancel it cleanly
    if (this.activeId === id && this.abortController) {
      this.stop();
      callbacks.onEnded?.();
      return;
    }

    // Stop any previous playback
    this.stop();
    this.callbacks = callbacks;
    this.activeId = id;

    const cleanText = prepareDhikrSpeechText(arabicText);
    if (!cleanText) {
      this.activeId = null;
      callbacks.onEnded?.();
      return;
    }

    const cacheKey = `dhikr:Charon:${cleanText}`;
    const cachedUrl = dhikrAudioCache.get(cacheKey);
    if (cachedUrl) {
      await this.playAudioUrl(id, cachedUrl, fallbackAudioUrl, arabicText, callbacks);
      return;
    }

    const controller = new AbortController();
    this.abortController = controller;
    callbacks.onLoading?.(true);

    try {
      const response = await fetch(getApiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: 'Charon',
          mode: 'dhikr',
        }),
        signal: controller.signal,
      });

      if (controller.signal.aborted || this.activeId !== id) return;

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const data = await response.json();
      const wavUrl: string | undefined =
        data.wavUrl || (data.audio ? `data:audio/wav;base64,${data.audio}` : undefined);

      if (!wavUrl) {
        throw new Error(data.error || 'No audio received');
      }

      if (dhikrAudioCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = dhikrAudioCache.keys().next().value;
        if (firstKey) dhikrAudioCache.delete(firstKey);
      }
      dhikrAudioCache.set(cacheKey, wavUrl);

      this.abortController = null;
      if (this.activeId !== id) return;

      await this.playAudioUrl(id, wavUrl, fallbackAudioUrl, arabicText, callbacks);
    } catch (err: any) {
      this.abortController = null;
      if (err?.name === 'AbortError' || this.activeId !== id) {
        callbacks.onLoading?.(false);
        return;
      }

      // Fallback 1: external MP3 if available
      if (fallbackAudioUrl) {
        await this.playAudioUrl(id, fallbackAudioUrl, undefined, arabicText, callbacks);
        return;
      }

      // Fallback 2: browser speech synthesis
      this.playBrowserSpeechFallback(id, cleanText, callbacks);
    }
  }

  private async playAudioUrl(
    id: string,
    url: string,
    fallbackAudioUrl: string | undefined,
    arabicText: string,
    callbacks: DhikrPlaybackCallbacks
  ): Promise<void> {
    if (this.activeId !== id) return;

    const audio = new Audio(url);
    this.audioEl = audio;

    audio.oncanplay = () => {
      if (this.activeId === id) callbacks.onLoading?.(false);
    };

    audio.onplay = () => {
      if (this.activeId === id) {
        callbacks.onLoading?.(false);
        callbacks.onPlay?.();
      }
    };

    audio.onended = () => {
      if (this.audioEl === audio) {
        this.audioEl = null;
        this.activeId = null;
        callbacks.onLoading?.(false);
        callbacks.onEnded?.();
      }
    };

    audio.onerror = () => {
      if (this.audioEl !== audio) return;
      this.audioEl = null;
      callbacks.onLoading?.(false);
      if (fallbackAudioUrl && url !== fallbackAudioUrl) {
        void this.playAudioUrl(id, fallbackAudioUrl, undefined, arabicText, callbacks);
      } else {
        this.playBrowserSpeechFallback(id, prepareDhikrSpeechText(arabicText), callbacks);
      }
    };

    try {
      await audio.play();
    } catch {
      if (this.audioEl !== audio) return;
      this.audioEl = null;
      callbacks.onLoading?.(false);
      if (fallbackAudioUrl && url !== fallbackAudioUrl) {
        await this.playAudioUrl(id, fallbackAudioUrl, undefined, arabicText, callbacks);
      } else {
        this.playBrowserSpeechFallback(id, prepareDhikrSpeechText(arabicText), callbacks);
      }
    }
  }

  private playBrowserSpeechFallback(
    id: string,
    cleanText: string,
    callbacks: DhikrPlaybackCallbacks
  ): void {
    callbacks.onLoading?.(false);
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !cleanText) {
      this.activeId = null;
      callbacks.onEnded?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const naturalAr =
        voices.find((v) => v.lang.startsWith('ar') && /natural|google|online/i.test(v.name)) ||
        voices.find((v) => v.lang === 'ar-SA' || v.lang === 'ar_SA') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ar'));

      if (naturalAr) utterance.voice = naturalAr;
      utterance.lang = naturalAr?.lang || 'ar-SA';
      utterance.rate = 0.85;
      utterance.pitch = 0.96;

      utterance.onstart = () => {
        if (this.activeId === id) callbacks.onPlay?.();
      };
      utterance.onend = () => {
        if (this.activeId === id) {
          this.activeId = null;
          callbacks.onEnded?.();
        }
      };
      utterance.onerror = () => {
        if (this.activeId === id) {
          this.activeId = null;
          callbacks.onEnded?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.activeId = null;
      callbacks.onEnded?.();
    }
  }
}
