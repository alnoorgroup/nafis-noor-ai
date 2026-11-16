/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  RotateCcw,
  Send,
  Sliders,
  User,
  VolumeX,
  X,
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import {
  LiveConnectionState,
  LiveTranscriptEntry,
  LiveVoiceSession,
} from '../utils/audioLiveManager';
import { getLanguageCode } from '../utils/i18n';
import {
  NoorLivingLightVisualizer,
  VisualizerPhase,
} from './noorAi/NoorLivingLightVisualizer';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: (transcripts: LiveTranscriptEntry[]) => void;
  isDark: boolean;
  initialVoice?: string;
  memoryContext?: string;
  onSaveToChat?: (transcripts: LiveTranscriptEntry[]) => void;
}

const VOICE_OPTIONS = [
  {
    id: 'Zephyr',
    name: 'Zephyr',
    nameAr: 'زفير · هادئ ومتزن',
    description: 'Serene, balanced & tranquil',
    descAr: 'صوت هادئ ومريح للنفس',
  },
  {
    id: 'Kore',
    name: 'Kore',
    nameAr: 'كور · دافئ ومطمئن',
    description: 'Gentle, warm & soothing',
    descAr: 'نبرة دافئة ولطيفة',
  },
  {
    id: 'Puck',
    name: 'Puck',
    nameAr: 'باك · فصيح وواضح',
    description: 'Clear & articulate',
    descAr: 'صوت واضح وفصيح',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    nameAr: 'فنرير · عميق ورصين',
    description: 'Deep & contemplative',
    descAr: 'عميق ورنان ومفكر',
  },
  {
    id: 'Charon',
    name: 'Charon',
    nameAr: 'شارون · رقيق وخاشع',
    description: 'Soft & reflective',
    descAr: 'رقيق وتدبري هادئ',
  },
];

const SUGGESTED_VOICE_PROMPTS_EN = [
  'What is the virtue of Tahajjud prayer?',
  'Teach me a short du’a for inner peace',
  'Reflect on Surah Al-Inshirah',
];

const SUGGESTED_VOICE_PROMPTS_AR = [
  'ما فضل قيام الليل والتهجد؟',
  'علمني دعاءً مأثوراً للسكينة وراحة القلب',
  'تأمل معي معاني سورة الشرح',
];

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  initialVoice = 'Zephyr',
  memoryContext = '',
  onSaveToChat,
}) => {
  const isArabic = getLanguageCode() === 'ar';
  const suggestedPrompts = isArabic
    ? SUGGESTED_VOICE_PROMPTS_AR
    : SUGGESTED_VOICE_PROMPTS_EN;

  const [connectionState, setConnectionState] =
    useState<LiveConnectionState>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoice);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isRetryingMic, setIsRetryingMic] = useState<boolean>(false);
  const [userVolume, setUserVolume] = useState<number>(0);
  const [aiVolume, setAiVolume] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<LiveTranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [showTranscriptSheet, setShowTranscriptSheet] = useState<boolean>(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState<boolean>(false);
  const [customInputText, setCustomInputText] = useState<string>('');

  const sessionRef = useRef<LiveVoiceSession | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voiceActivityTimerRef = useRef<number | null>(null);

  const isSpeakingRef = useRef<boolean>(false);

  const clearVoiceActivityTimer = () => {
    if (voiceActivityTimerRef.current) {
      window.clearTimeout(voiceActivityTimerRef.current);
      voiceActivityTimerRef.current = null;
    }
  };

  const createSessionCallbacks = () => ({
    onStateChange: (state: LiveConnectionState) => {
      setConnectionState(state);
      isSpeakingRef.current = state === 'speaking';
      if (state === 'speaking' || state === 'error' || state === 'idle') {
        clearVoiceActivityTimer();
        setIsAwaitingResponse(false);
      }
    },
    onTranscriptUpdate: (newTranscripts: LiveTranscriptEntry[]) => {
      setTranscripts(newTranscripts);
      const last = newTranscripts[newTranscripts.length - 1];
      if (last?.sender === 'user') {
        setIsAwaitingResponse(true);
      } else if (last?.sender === 'noor') {
        clearVoiceActivityTimer();
        setIsAwaitingResponse(false);
      }
    },
    onUserVolume: (vol: number) => {
      setUserVolume(vol);
      if (vol > 0.04 && !isSpeakingRef.current) {
        setIsAwaitingResponse(false);
        clearVoiceActivityTimer();
        voiceActivityTimerRef.current = window.setTimeout(() => {
          if (!isSpeakingRef.current) {
            setIsAwaitingResponse(true);
          }
        }, 900);
      }
    },
    onAiVolume: (vol: number) => {
      setAiVolume(vol);
    },
    onError: (err: string) => {
      setErrorMessage(err || null);
    },
    onMicStatusChange: (isActive: boolean) => {
      setIsMicActive(isActive);
      if (isActive) {
        setErrorMessage(null);
      }
    },
  });

  // Sync incoming initialVoice prop when changed
  useEffect(() => {
    if (initialVoice) setSelectedVoice(initialVoice);
  }, [initialVoice]);

  // Initialize and start live session when modal opens
  useEffect(() => {
    if (!isOpen) {
      clearVoiceActivityTimer();
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      isSpeakingRef.current = false;
      setIsAwaitingResponse(false);
      return;
    }

    setErrorMessage(null);
    setTranscripts([]);
    setIsMicActive(true);
    setIsAwaitingResponse(false);
    isSpeakingRef.current = false;

    const session = new LiveVoiceSession(createSessionCallbacks(), selectedVoice, memoryContext);

    sessionRef.current = session;
    session.start();

    return () => {
      clearVoiceActivityTimer();
      isSpeakingRef.current = false;
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, [isOpen, selectedVoice, memoryContext]);

  // Auto-scroll transcript sheet when open
  useEffect(() => {
    if (showTranscriptSheet) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, showTranscriptSheet]);

  const handleToggleMute = () => {
    if (!isMicActive) {
      handleRetryMic();
      return;
    }
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sessionRef.current?.setMuted(nextMute);
  };

  const handleRetryMic = async () => {
    if (!sessionRef.current) return;
    setIsRetryingMic(true);
    setErrorMessage(null);
    try {
      const ok = await sessionRef.current.retryMicrophone();
      setIsMicActive(ok);
      if (ok) {
        setIsMuted(false);
      }
    } finally {
      setIsRetryingMic(false);
    }
  };

  const handleInterrupt = () => {
    clearVoiceActivityTimer();
    isSpeakingRef.current = false;
    setIsAwaitingResponse(false);
    sessionRef.current?.interrupt();
  };

  const handleSendQuickPrompt = (prompt: string) => {
    if (!prompt.trim()) return;
    clearVoiceActivityTimer();
    setIsAwaitingResponse(true);
    sessionRef.current?.sendTextMessage(prompt.trim());
    setCustomInputText('');
  };

  const handleReconnect = () => {
    clearVoiceActivityTimer();
    isSpeakingRef.current = false;
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    setErrorMessage(null);
    setIsAwaitingResponse(false);
    const session = new LiveVoiceSession(createSessionCallbacks(), selectedVoice, memoryContext);
    sessionRef.current = session;
    session.start();
  };

  const handleClose = () => {
    clearVoiceActivityTimer();
    isSpeakingRef.current = false;
    const currentTranscripts = sessionRef.current
      ? sessionRef.current.getTranscripts()
      : transcripts;
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    if (currentTranscripts.length > 0 && onSaveToChat) {
      onSaveToChat(currentTranscripts);
    }
    onClose(currentTranscripts);
  };

  // Compute smooth visual phase for the living light pool
  const visualizerPhase: VisualizerPhase = useMemo(() => {
    if (connectionState === 'speaking') return 'speaking';
    if (connectionState === 'connecting' || isAwaitingResponse) return 'thinking';
    if ((connectionState === 'listening' || connectionState === 'connected') && isMicActive && !isMuted) {
      return 'listening';
    }
    return 'idle';
  }, [connectionState, isAwaitingResponse, isMicActive, isMuted]);

  const latestCaption =
    transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;

  const statusText = useMemo(() => {
    if (connectionState === 'speaking') {
      return isArabic ? 'نفيس نور يتحدث...' : 'Speaking';
    }
    if (connectionState === 'connecting') {
      return isArabic ? 'جاري الاتصال بهدوء...' : 'Connecting...';
    }
    if (connectionState === 'error') {
      return isArabic ? 'انقطع الاتصال الصوتي' : 'Connection interrupted';
    }
    if (isAwaitingResponse) {
      return isArabic ? 'يتأمل الإجابة...' : 'Thinking...';
    }
    if (!isMicActive) {
      return isArabic ? 'الميكروفون غير متاح' : 'Microphone offline';
    }
    if (isMuted) {
      return isArabic ? 'تم كتم الميكروفون' : 'Muted';
    }
    if (connectionState === 'listening' || connectionState === 'connected') {
      return isArabic ? 'أستمع إليك...' : 'Listening';
    }
    return isArabic ? 'مستعد للحديث' : 'Ready';
  }, [connectionState, isArabic, isAwaitingResponse, isMicActive, isMuted]);

  const selectedVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice);
  const selectedVoiceLabel =
    isArabic && selectedVoiceObj ? selectedVoiceObj.name : selectedVoice;

  if (!isOpen) return null;

  return (
    <div
      id="live-voice-sanctuary-modal"
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#040711] text-white pt-[max(12px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))] animate-fadeIn"
    >

      {/* Minimal Spacious Top Bar */}
      <header className="relative z-20 w-full max-w-2xl mx-auto px-5 sm:px-6 pt-2 pb-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <NoorAIIcon className="w-5 h-5 text-blue-200/90" />
          <span className="text-[14.5px] font-medium tracking-tight text-white/90">
            {isArabic ? 'نفيس نور الصوتي' : 'Nafis Noor'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVoiceSettings((prev) => !prev)}
            className={`h-9 px-3 rounded-full border text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showVoiceSettings
                ? 'bg-white/15 border-white/25 text-white'
                : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-white/75'
            }`}
            title={isArabic ? 'نبرة الصوت' : 'Voice Tone'}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{selectedVoiceLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/75 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Voice Tone Picker Popover */}
      {showVoiceSettings && (
        <div className="relative z-30 w-full max-w-md mx-auto px-5 pt-2 shrink-0 animate-fadeIn">
          <div className="rounded-2xl bg-[#0A1020]/90 backdrop-blur-xl border border-white/12 p-3 shadow-2xl space-y-2">
            <div className="text-[11.5px] font-medium text-blue-200/80 px-1">
              {isArabic ? 'اختيار نبرة الصوت' : 'Voice Persona'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    setShowVoiceSettings(false);
                  }}
                  className={`p-2.5 rounded-xl border text-start flex items-center justify-between transition-colors cursor-pointer ${
                    selectedVoice === voice.id
                      ? 'bg-blue-500/20 border-blue-400/45 text-white'
                      : 'bg-white/[0.04] border-white/[0.06] text-white/75 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium truncate">
                      {isArabic ? voice.nameAr : voice.name}
                    </div>
                    <div className="text-[10.5px] text-white/50 truncate">
                      {isArabic ? voice.descAr : voice.description}
                    </div>
                  </div>
                  {selectedVoice === voice.id && (
                    <Check className="w-3.5 h-3.5 text-blue-300 shrink-0 ms-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacious Central Visualizer Sanctuary */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        {!showTranscriptSheet ? (
          <div className="flex flex-col items-center justify-center w-full max-w-lg text-center">
            {/* Luminous White & Electric-Blue Living Pool */}
            <NoorLivingLightVisualizer
              phase={visualizerPhase}
              userVolume={userVolume}
              aiVolume={aiVolume}
              isMuted={isMuted}
              onClick={
                connectionState === 'speaking'
                  ? handleInterrupt
                  : !isMicActive
                  ? handleRetryMic
                  : handleToggleMute
              }
              ariaLabel={
                connectionState === 'speaking'
                  ? isArabic
                    ? 'انقر للمقاطعة'
                    : 'Tap to interrupt'
                  : isArabic
                  ? 'انقر للتحكم بالصوت'
                  : 'Tap to toggle voice'
              }
              title={
                connectionState === 'speaking'
                  ? isArabic
                    ? 'انقر للمقاطعة'
                    : 'Tap to interrupt'
                  : !isMicActive
                  ? isArabic
                    ? 'إعادة فحص الميكروفون'
                    : 'Tap to enable microphone'
                  : isMuted
                  ? isArabic
                    ? 'إلغاء كتم الميكروفون'
                    : 'Tap to unmute'
                  : isArabic
                  ? 'نفيس نور يستمع'
                  : 'Tap to mute'
              }
            />

            {/* Calm Unboxed Status & Single-Line Live Caption */}
            <div className="mt-4 space-y-2 max-w-md px-4">
              <p className="text-[13.5px] font-medium tracking-wide text-blue-100/80">
                {statusText}
              </p>

              {latestCaption && (
                <p
                  dir="auto"
                  className="text-[14px] leading-relaxed text-white/70 line-clamp-2"
                >
                  {latestCaption.text}
                </p>
              )}
            </div>

            {/* Quiet Error Guidance Only When Needed */}
            {errorMessage && (
              <div className="mt-5 px-4 py-3 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/12 text-white/85 text-xs max-w-sm space-y-2.5">
                <p className="leading-relaxed">{errorMessage}</p>
                <div className="flex items-center justify-center gap-2">
                  {!isMicActive && (
                    <button
                      type="button"
                      onClick={handleRetryMic}
                      disabled={isRetryingMic}
                      className="px-3 py-1.5 rounded-full bg-blue-500/25 hover:bg-blue-500/35 border border-blue-400/40 text-blue-100 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw
                        className={`w-3.5 h-3.5 ${isRetryingMic ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {isRetryingMic
                          ? isArabic
                            ? 'جاري الفحص...'
                            : 'Checking...'
                          : isArabic
                          ? 'تفعيل الميكروفون'
                          : 'Enable Mic'}
                      </span>
                    </button>
                  )}
                  {connectionState === 'error' && (
                    <button
                      type="button"
                      onClick={handleReconnect}
                      className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'إعادة الاتصال' : 'Reconnect'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-white/70 text-[11.5px] transition-colors cursor-pointer"
                  >
                    {isArabic ? 'تجاهل' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Clean Optional Transcript & Text Input Drawer */
          <div className="w-full max-w-xl h-full max-h-[66vh] flex flex-col rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] p-4 sm:p-5 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] shrink-0">
              <span className="text-[13px] font-medium text-blue-100/90">
                {isArabic ? 'نص المحادثة الصوتية' : 'Live Conversation Transcript'}
              </span>
              <button
                type="button"
                onClick={() => setShowTranscriptSheet(false)}
                className="text-[12px] text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                {isArabic ? 'إخفاء' : 'Back to visualizer'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pe-1">
              {transcripts.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-[13px] text-white/55">
                    {isArabic
                      ? 'تحدث بهدوء أو اختر سؤالاً للبدء:'
                      : 'Speak naturally or ask a question below:'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendQuickPrompt(prompt)}
                        className="px-3.5 py-2 rounded-2xl bg-white/[0.06] hover:bg-blue-500/20 border border-white/[0.08] hover:border-blue-400/35 text-[12px] text-white/80 transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                transcripts.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-2xl text-[13px] leading-relaxed ${
                      entry.sender === 'user'
                        ? 'bg-blue-500/15 text-blue-50 ms-8 border border-blue-400/25'
                        : 'bg-white/[0.07] text-white/90 me-8 border border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-1">
                      {entry.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <NoorAIIcon className="w-3 h-3 text-blue-300" />
                      )}
                      <span>
                        {entry.sender === 'user'
                          ? isArabic
                            ? 'أنت'
                            : 'You'
                          : isArabic
                          ? 'نفيس نور'
                          : 'Nafis Noor'}
                      </span>
                    </div>
                    <p dir="auto" className="whitespace-pre-wrap">
                      {entry.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuickPrompt(customInputText);
              }}
              className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                dir="auto"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder={
                  isArabic
                    ? 'اكتب سؤالاً للإجابة الصوتية...'
                    : 'Type a question to ask aloud...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50"
              />
              <button
                type="submit"
                disabled={!customInputText.trim()}
                className="w-10 h-10 rounded-full bg-white text-[#040711] hover:bg-blue-50 disabled:opacity-35 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label={isArabic ? 'إرسال' : 'Send'}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Floating Minimal Control Dock */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-6 pt-3 pb-2 flex items-center justify-center gap-4 shrink-0">
        {/* Mic / Mute */}
        {!isMicActive ? (
          <button
            type="button"
            onClick={handleRetryMic}
            disabled={isRetryingMic}
            className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label={isArabic ? 'تفعيل الميكروفون' : 'Enable Microphone'}
            title={isArabic ? 'تفعيل الميكروفون' : 'Enable Microphone'}
          >
            <RotateCcw
              className={`w-5 h-5 ${isRetryingMic ? 'animate-spin' : ''}`}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? 'bg-red-500/25 border-red-400/45 text-red-100'
                : 'bg-white/[0.1] hover:bg-white/[0.18] border-white/[0.15] text-white'
            }`}
            aria-label={
              isMuted
                ? isArabic
                  ? 'إلغاء الكتم'
                  : 'Unmute'
                : isArabic
                ? 'كتم الميكروفون'
                : 'Mute'
            }
            title={
              isMuted
                ? isArabic
                  ? 'إلغاء الكتم'
                  : 'Unmute'
                : isArabic
                ? 'كتم الميكروفون'
                : 'Mute'
            }
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Interrupt speaking */}
        {connectionState === 'speaking' && (
          <button
            type="button"
            onClick={handleInterrupt}
            className="w-14 h-14 rounded-full bg-white/[0.14] hover:bg-white/[0.22] border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label={isArabic ? 'مقاطعة' : 'Interrupt'}
            title={isArabic ? 'مقاطعة' : 'Interrupt'}
          >
            <VolumeX className="w-5 h-5" />
          </button>
        )}

        {/* Captions / Transcript Sheet Toggle */}
        <button
          type="button"
          onClick={() => setShowTranscriptSheet((prev) => !prev)}
          className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            showTranscriptSheet
              ? 'bg-blue-500/30 border-blue-400/50 text-white'
              : 'bg-white/[0.1] hover:bg-white/[0.18] border-white/[0.15] text-white'
          }`}
          aria-label={isArabic ? 'النص المباشر' : 'Transcript'}
          title={isArabic ? 'النص المباشر' : 'Transcript'}
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Close Live Session */}
        <button
          type="button"
          onClick={handleClose}
          className="w-14 h-14 rounded-full bg-white text-[#040711] hover:bg-blue-50 flex items-center justify-center shadow-[0_6px_24px_rgba(59,130,246,0.28)] transition-all active:scale-95 cursor-pointer"
          aria-label={isArabic ? 'إنهاء المحادثة' : 'End live voice'}
          title={isArabic ? 'إنهاء المحادثة' : 'End live voice'}
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </footer>
    </div>
  );
};
