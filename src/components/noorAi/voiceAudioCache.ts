const DB_NAME = 'nafis-noor-voice-cache';
const STORE_NAME = 'voice-clips';
const DB_VERSION = 1;

// Session-scoped in-memory object URL cache for instant playback
const memoryUrlCache = new Map<string, string>();

export function formatVoiceTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function normalizeWaveformBars(samples: number[], targetCount = 28): number[] {
  if (!samples || samples.length === 0) {
    return Array.from({ length: targetCount }, (_, i) => {
      const wave = Math.sin((i / targetCount) * Math.PI * 3) * 0.14;
      return Number(Math.max(0.16, Math.min(0.6, 0.24 + wave)).toFixed(3));
    });
  }

  const bars: number[] = [];
  const step = samples.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    let peak = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      if (samples[j] > peak) peak = samples[j];
    }
    bars.push(Number(Math.max(0.14, Math.min(1, peak)).toFixed(3)));
  }

  return bars;
}

export function cacheSessionAudioUrl(messageId: string, url: string): void {
  if (!messageId || !url) return;
  memoryUrlCache.set(messageId, url);
}

export function getCachedSessionAudioUrl(messageId: string): string | undefined {
  return memoryUrlCache.get(messageId);
}

function openVoiceDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveVoiceClipBlob(messageId: string, blob: Blob): Promise<void> {
  if (!messageId || !blob) return;
  const db = await openVoiceDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, messageId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function loadVoiceClipUrl(messageId: string): Promise<string | null> {
  const existing = memoryUrlCache.get(messageId);
  if (existing) return existing;

  const db = await openVoiceDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(messageId);
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          memoryUrlCache.set(messageId, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export function stopAllVoicePlayback(exceptId?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('noor:stop-voice-playback', { detail: { exceptId } })
  );
}
