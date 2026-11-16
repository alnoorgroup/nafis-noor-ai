/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getGlobalLanguage } from './i18n';
import { getWebSocketUrl, getApiUrl } from './apiConfig';

// PCM conversion and Audio streaming utilities for Gemini Live API & TTS

export interface LiveTranscriptEntry {
  id: string;
  sender: 'user' | 'noor';
  text: string;
  isComplete: boolean;
  timestamp: string;
}

export type LiveConnectionState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export interface LiveSessionCallbacks {
  onStateChange: (state: LiveConnectionState) => void;
  onTranscriptUpdate: (transcripts: LiveTranscriptEntry[]) => void;
  onUserVolume: (volume: number) => void; // 0 to 1
  onAiVolume: (volume: number) => void;   // 0 to 1
  onError: (errorMsg: string) => void;
  onMicStatusChange?: (isActive: boolean) => void;
}

/**
 * Converts Float32Array (Web Audio API buffer) to 16-bit PCM Little Endian Base64
 */
export function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    );
  }
  return btoa(binary);
}

/**
 * Converts Base64 16-bit PCM (from Gemini Live API / TTS at 24kHz) to an AudioBuffer
 */
export function base64PCMToAudioBuffer(
  base64Data: string,
  audioCtx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 32768 : 32767);
  }

  const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);
  return audioBuffer;
}

/**
 * Resamples Float32 audio to target sample rate (16000 Hz for Gemini Live input)
 */
export function resampleAudioBuffer(
  inputData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number = 16000
): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return inputData;
  }
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.max(1, Math.round(inputData.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcPos = i * ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;
    const s0 = inputData[idx] ?? 0;
    const s1 = inputData[Math.min(idx + 1, inputData.length - 1)] ?? s0;
    result[i] = s0 + (s1 - s0) * frac;
  }
  return result;
}

export class LiveVoiceSession {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private outAnalyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private nextPlayTime: number = 0;
  private isMuted: boolean = false;
  private isMicActive: boolean = false;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private callbacks: LiveSessionCallbacks;
  private transcripts: LiveTranscriptEntry[] = [];
  private voiceName: string = 'Fenrir';
  private animFrameId: number | null = null;
  private isConnecting: boolean = false;
  private isServerReady: boolean = false;
  private pendingAudioQueue: string[] = [];
  private memoryContext: string = '';

  constructor(callbacks: LiveSessionCallbacks, voiceName: string = 'Fenrir', memoryContext: string = '') {
    this.callbacks = callbacks;
    this.voiceName = voiceName;
    this.memoryContext = memoryContext;
  }

  public setVoice(voice: string) {
    this.voiceName = voice;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Resilient multi-tier microphone stream acquisition with progressive fallbacks
   */
  private async acquireMicrophoneStream(): Promise<{ stream: MediaStream | null; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        stream: null,
        error: 'Microphone API is not supported in this browser or iframe environment.',
      };
    }

    // Tier 1: Ideal voice processing constraints (non-strict)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });
      return { stream };
    } catch (err1: any) {
      console.warn('[LiveVoice] Tier 1 constraints failed, retrying with basic audio:', err1?.name, err1?.message);
    }

    // Tier 2: Minimal fallback constraints (audio: true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return { stream };
    } catch (err2: any) {
      console.warn('[LiveVoice] Tier 2 fallback failed:', err2?.name, err2?.message);
      const errName = err2?.name || '';
      const errMsg = err2?.message || 'Could not start audio source';

      let friendly = 'Microphone could not be started.';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        friendly = 'Microphone permission was denied. Please grant microphone access in your browser settings to speak.';
      } else if (errName === 'NotReadableError' || errMsg.includes('Could not start audio source')) {
        friendly = 'Microphone is currently unavailable or in use by another application. You can still listen and tap suggested topics below.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        friendly = 'No microphone device was detected on your system.';
      } else {
        friendly = `Microphone access error: ${errMsg}`;
      }

      return { stream: null, error: friendly };
    }
  }

  /**
   * Initializes or gets the shared AudioContext without conflicting hardware sample rates
   */
  private async ensureAudioContext(): Promise<AudioContext> {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioCtxClass();
    }

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('[LiveVoice] AudioContext resume failed (waiting for gesture):', err);
      }
    }

      // Setup output analyser for AI speech visualizer
      if (!this.outAnalyser) {
        this.outAnalyser = this.audioCtx.createAnalyser();
        this.outAnalyser.fftSize = 256;
        this.outAnalyser.smoothingTimeConstant = 0.65;
        this.outAnalyser.connect(this.audioCtx.destination);
      }

      return this.audioCtx;
    }

  /**
   * Attaches microphone stream to the Web Audio pipeline without speaker feedback
   */
  private setupMicrophonePipeline(stream: MediaStream): boolean {
    if (!this.audioCtx) return false;

    try {
      this.mediaStream = stream;

      // Microphone analyser for user voice visualizer
      this.micAnalyser = this.audioCtx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micAnalyser.smoothingTimeConstant = 0.65;

      this.micSource = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.micSource.connect(this.micAnalyser);

      // Buffer size 1024 (~21ms @ 48kHz) delivers ultra-low capture latency for fast VAD & hearing
      this.scriptProcessor = this.audioCtx.createScriptProcessor(1024, 1, 1);
      this.micSource.connect(this.scriptProcessor);

      // Silent gain node to keep script processor alive without echoing user's voice to speakers
      this.silentGain = this.audioCtx.createGain();
      this.silentGain.gain.value = 0;
      this.scriptProcessor.connect(this.silentGain);
      this.silentGain.connect(this.audioCtx.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.ws || this.isMuted) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        const isAiSpeaking = this.activeSourceNodes.length > 0;
        let resampled: Float32Array;

        if (isAiSpeaking) {
          // Light echo-suppression ONLY while AI is playing out loud; keep streaming continuous frames
          let sumSquares = 0;
          for (let i = 0; i < inputChannelData.length; i++) {
            sumSquares += inputChannelData[i] * inputChannelData[i];
          }
          const rms = Math.sqrt(sumSquares / inputChannelData.length);
          if (rms >= 0.028) {
            resampled = resampleAudioBuffer(
              inputChannelData,
              this.audioCtx?.sampleRate || 44100,
              16000
            );
          } else {
            const silentLen = Math.max(
              1,
              Math.round((inputChannelData.length * 16000) / (this.audioCtx?.sampleRate || 44100))
            );
            resampled = new Float32Array(silentLen);
          }
        } else {
          // Stream 100% of user audio & natural trailing pauses continuously so server VAD hears everything cleanly and responds immediately
          resampled = resampleAudioBuffer(
            inputChannelData,
            this.audioCtx?.sampleRate || 44100,
            16000
          );
        }

        const base64PCM = floatTo16BitPCMBase64(resampled);
        if (this.ws.readyState === WebSocket.OPEN && this.isServerReady) {
          this.ws.send(JSON.stringify({ audio: base64PCM }));
        } else if (this.ws.readyState === WebSocket.CONNECTING || (this.ws.readyState === WebSocket.OPEN && !this.isServerReady)) {
          if (this.pendingAudioQueue.length < 40) {
            this.pendingAudioQueue.push(base64PCM);
          }
        }
      };

      this.isMicActive = true;
      this.callbacks.onMicStatusChange?.(true);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.callbacks.onStateChange('listening');
      }
      return true;
    } catch (err: any) {
      console.error('[LiveVoice] Failed to setup microphone pipeline:', err);
      this.isMicActive = false;
      this.callbacks.onMicStatusChange?.(false);
      return false;
    }
  }

  /**
   * Public retry method for microphone access when user clicks "Retry Mic" in UI
   */
  public async retryMicrophone(): Promise<boolean> {
    try {
      await this.ensureAudioContext();

      // Clean up previous mic resources if any
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
      if (this.micSource) {
        try { this.micSource.disconnect(); } catch {}
        this.micSource = null;
      }
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect();
          this.scriptProcessor.onaudioprocess = null;
        } catch {}
        this.scriptProcessor = null;
      }
      if (this.silentGain) {
        try { this.silentGain.disconnect(); } catch {}
        this.silentGain = null;
      }

      const { stream, error } = await this.acquireMicrophoneStream();
      if (stream) {
        const ok = this.setupMicrophonePipeline(stream);
        if (ok) {
          this.callbacks.onError(''); // Clear error on success
          return true;
        }
      }

      this.isMicActive = false;
      this.callbacks.onMicStatusChange?.(false);
      if (error) {
        this.callbacks.onError(error);
      }
      return false;
    } catch (err: any) {
      console.error('[LiveVoice] Retry microphone error:', err);
      this.callbacks.onError(err?.message || 'Could not start microphone');
      return false;
    }
  }

  public async start(): Promise<void> {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;
    this.callbacks.onStateChange('connecting');

    try {
      // 1. Initialize AudioContext for sound playback and visualization
      await this.ensureAudioContext();

      // 2. Register short-lived memory & history context if available, then connect WebSocket
      let contextParam = '';
      if (this.memoryContext && this.memoryContext.trim().length > 0) {
        try {
          const ctxRes = await fetch(getApiUrl('/api/live/context'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryContext: this.memoryContext }),
          });
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json().catch(() => null);
            if (ctxData?.contextId) {
              contextParam = `&contextId=${encodeURIComponent(ctxData.contextId)}`;
            }
          }
        } catch {
          // Non-fatal fallback: connect without memory context
        }
      }

      const wsUrl = getWebSocketUrl(
        `/api/live?voice=${encodeURIComponent(this.voiceName)}&lang=${encodeURIComponent(getGlobalLanguage())}${contextParam}`
      );

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.callbacks.onStateChange(this.isMicActive ? 'listening' : 'connected');
        this.startAudioVisualizerLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[LiveVoice] Error parsing live WS message', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[LiveVoice] WS error:', event);
        this.callbacks.onError('WebSocket connection error. Please try reconnecting.');
        this.callbacks.onStateChange('error');
      };

      this.ws.onclose = () => {
        this.isServerReady = false;
        this.pendingAudioQueue = [];
        this.callbacks.onStateChange('idle');
      };

      // 3. Acquire microphone stream with graceful non-fatal fallback
      const { stream, error: micError } = await this.acquireMicrophoneStream();
      if (stream) {
        this.setupMicrophonePipeline(stream);
      } else {
        this.isMicActive = false;
        this.callbacks.onMicStatusChange?.(false);
        if (micError) {
          // Non-fatal notification: session stays alive so user can listen and use quick prompts
          this.callbacks.onError(micError);
        }
      }
    } catch (err: any) {
      console.error('[LiveVoice] Failed to start Live Voice session:', err);
      this.isConnecting = false;
      this.callbacks.onError(err?.message || 'Could not initialize audio environment');
      this.callbacks.onStateChange('error');
      this.stop();
    }
  }

  private handleServerMessage(msg: any) {
    if (msg.type === 'ready') {
      this.isServerReady = true;
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.pendingAudioQueue.length > 0) {
        for (const chunk of this.pendingAudioQueue) {
          this.ws.send(JSON.stringify({ audio: chunk }));
        }
        this.pendingAudioQueue = [];
      }
      this.callbacks.onStateChange(this.isMicActive ? 'listening' : 'connected');
    } else if (msg.type === 'audio' && msg.audio) {
      this.playAudioChunk(msg.audio);
      this.callbacks.onStateChange('speaking');
    } else if (msg.type === 'input_transcript' && msg.text) {
      this.appendTranscript('user', msg.text);
      this.callbacks.onStateChange('listening');
    } else if (msg.type === 'output_transcript' && msg.text) {
      this.appendTranscript('noor', msg.text);
      this.callbacks.onStateChange('speaking');
    } else if (msg.type === 'interrupted') {
      this.stopAllAudio();
      this.callbacks.onStateChange('listening');
    } else if (msg.type === 'turn_complete') {
      this.markLastTranscriptComplete();
      if (this.activeSourceNodes.length === 0) {
        this.callbacks.onStateChange('listening');
      }
    } else if (msg.type === 'error') {
      this.callbacks.onError(msg.error || 'Live session error');
    }
  }

  private playAudioChunk(base64Audio: string) {
    if (!this.audioCtx || !this.outAnalyser) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      // Convert 24kHz PCM to buffer; AudioContext seamlessly resamples to destination rate
      const audioBuffer = base64PCMToAudioBuffer(base64Audio, this.audioCtx, 24000);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outAnalyser);

      const currentTime = this.audioCtx.currentTime;
      // Schedule gapless playback
      const startTime = Math.max(currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.activeSourceNodes.push(source);
      source.onended = () => {
        const idx = this.activeSourceNodes.indexOf(source);
        if (idx >= 0) this.activeSourceNodes.splice(idx, 1);
        if (this.activeSourceNodes.length === 0 && this.audioCtx) {
          if (this.audioCtx.currentTime >= this.nextPlayTime - 0.05) {
            this.callbacks.onStateChange('listening');
          }
        }
      };
    } catch (err) {
      console.error('[LiveVoice] Audio chunk decoding error', err);
    }
  }

  public interrupt() {
    this.stopAllAudio();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'interrupt' }));
    }
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.appendTranscript('user', text);
      this.markLastTranscriptComplete();
      this.ws.send(JSON.stringify({ text }));
    }
  }

  private stopAllAudio() {
    this.activeSourceNodes.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    this.activeSourceNodes = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  private appendTranscript(sender: 'user' | 'noor', textChunk: string) {
    const last = this.transcripts[this.transcripts.length - 1];
    if (last && last.sender === sender && !last.isComplete) {
      last.text += textChunk;
    } else {
      this.transcripts.push({
        id: `live-tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender,
        text: textChunk,
        isComplete: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
    this.callbacks.onTranscriptUpdate([...this.transcripts]);
  }

  private markLastTranscriptComplete() {
    const last = this.transcripts[this.transcripts.length - 1];
    if (last) {
      last.isComplete = true;
      this.callbacks.onTranscriptUpdate([...this.transcripts]);
    }
  }

  private startAudioVisualizerLoop() {
    const micTimeArray = new Uint8Array(256);
    const micFreqArray = new Uint8Array(128);
    const outTimeArray = new Uint8Array(256);
    const outFreqArray = new Uint8Array(128);

    const checkVolume = () => {
      // Calculate responsive real-time Mic Volume using both time-domain RMS and lower speech spectrum
      if (this.micAnalyser && !this.isMuted && this.isMicActive) {
        this.micAnalyser.getByteTimeDomainData(micTimeArray);
        this.micAnalyser.getByteFrequencyData(micFreqArray);

        let sumSq = 0;
        for (let i = 0; i < micTimeArray.length; i++) {
          const v = (micTimeArray[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / micTimeArray.length);

        let speechSum = 0;
        const speechBins = 24;
        for (let i = 1; i <= speechBins; i++) {
          speechSum += micFreqArray[i];
        }
        const speechAvg = speechSum / (speechBins * 255);
        this.callbacks.onUserVolume(Math.min(1, Math.max(rms * 3.8, speechAvg * 2.1)));
      } else {
        this.callbacks.onUserVolume(0);
      }

      // Calculate vivid real-time AI Output Volume
      if (this.outAnalyser && this.activeSourceNodes.length > 0) {
        this.outAnalyser.getByteTimeDomainData(outTimeArray);
        this.outAnalyser.getByteFrequencyData(outFreqArray);

        let sumSq = 0;
        for (let i = 0; i < outTimeArray.length; i++) {
          const v = (outTimeArray[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / outTimeArray.length);

        let speechSum = 0;
        const speechBins = 24;
        for (let i = 1; i <= speechBins; i++) {
          speechSum += outFreqArray[i];
        }
        const speechAvg = speechSum / (speechBins * 255);
        this.callbacks.onAiVolume(Math.min(1, Math.max(rms * 3.5, speechAvg * 1.9)));
      } else {
        this.callbacks.onAiVolume(0);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  public getTranscripts(): LiveTranscriptEntry[] {
    return this.transcripts;
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.stopAllAudio();

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.silentGain) {
      try { this.silentGain.disconnect(); } catch {}
      this.silentGain = null;
    }

    if (this.micSource) {
      try { this.micSource.disconnect(); } catch {}
      this.micSource = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {}
      this.audioCtx = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.isMicActive = false;
    this.isConnecting = false;
    this.isServerReady = false;
    this.pendingAudioQueue = [];
    this.callbacks.onStateChange('idle');
  }
}

/**
 * Text-to-Speech (TTS) Single Message Player
 */
export class TTSPlayer {
  private static audioCtx: AudioContext | null = null;
  private static currentSource: AudioBufferSourceNode | null = null;
  private static currentHtmlAudio: HTMLAudioElement | null = null;

  public static async playText(
    text: string,
    voice: string = 'Fenrir',
    onStart?: () => void,
    onEnded?: () => void,
    onError?: (err: string) => void
  ): Promise<() => void> {
    this.stop();

    try {
      const response = await fetch(getApiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voice || 'Fenrir' }),
      });

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      // If data has wavUrl, HTML5 audio can be played with maximum fidelity and smooth pauses
      if (data.wavUrl) {
        const audio = new Audio(data.wavUrl);
        this.currentHtmlAudio = audio;
        onStart?.();

        audio.onended = () => {
          if (this.currentHtmlAudio === audio) {
            this.currentHtmlAudio = null;
            onEnded?.();
          }
        };

        audio.onerror = () => {
          if (this.currentHtmlAudio === audio) {
            this.currentHtmlAudio = null;
            onError?.('Audio playback failed');
            onEnded?.();
          }
        };

        await audio.play();

        return () => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {}
          if (this.currentHtmlAudio === audio) {
            this.currentHtmlAudio = null;
            onEnded?.();
          }
        };
      }

      // Fallback to Web Audio API PCM buffer
      if (data.audio) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioCtxClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        const audioBuffer = base64PCMToAudioBuffer(data.audio, this.audioCtx, 24000);
        const source = this.audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioCtx.destination);

        this.currentSource = source;
        onStart?.();

        source.onended = () => {
          if (this.currentSource === source) {
            this.currentSource = null;
            onEnded?.();
          }
        };

        source.start();

        return () => {
          try {
            source.stop();
          } catch {}
          if (this.currentSource === source) {
            this.currentSource = null;
            onEnded?.();
          }
        };
      }

      throw new Error('No audio data received');
    } catch (err: any) {
      console.error('[TTSPlayer] playback error:', err);
      onError?.(err?.message || 'Could not play voice');
      onEnded?.();
      return () => {};
    }
  }

  public static stop() {
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.currentTime = 0;
      } catch {}
      this.currentHtmlAudio = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
  }
}
