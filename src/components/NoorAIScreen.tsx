import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  AudioLines,
  Bookmark,
  BookmarkCheck,
  Brain,
  Check,
  ChevronLeft,
  Copy,
  History,
  Image as ImageIcon,
  Lock,
  Menu,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share,
  Sparkles,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import {
  NoorAIConversationSession,
  NoorAIMessage,
  NoorMemoryCategory,
  NoorMemoryItem,
  UserStats,
} from '../types';
import { LiveVoiceModal } from './LiveVoiceModal';
import { LiveTranscriptEntry, TTSPlayer } from '../utils/audioLiveManager';
import { getGlobalLanguage, getLanguageCode, isRTLLanguage, t } from '../utils/i18n';
import { getApiUrl } from '../utils/apiConfig';
import {
  syncChatSessionToFirestore,
  deleteChatSessionFromFirestore,
} from '../lib/firebase';
import { NoorMarkdown } from './noorAi/NoorMarkdown';
import {
  NoorVoiceRecorder,
  RecordedVoicePayload,
  VoiceRecorderState,
} from './noorAi/NoorVoiceRecorder';
import { NoorVoiceMessagePlayer } from './noorAi/NoorVoiceMessagePlayer';
import { ImageStudioModal } from './noorAi/ImageStudioModal';
import {
  cacheSessionAudioUrl,
  saveVoiceClipBlob,
  stopAllVoicePlayback,
} from './noorAi/voiceAudioCache';

export const getInitialWelcomeMessage = (isArabic: boolean): NoorAIMessage => ({
  id: 'welcome-initial',
  sender: 'noor',
  text: isArabic
    ? 'السلام عليكم ورحمة الله وبركاته. مرحباً بكم في نفيس نور. يسعدني الإجابة عن تساؤلاتكم وتدارس العلوم النافعة بكل وضوح وسكينة. كيف يمكنني إعانتكم اليوم؟'
    : 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh. Welcome to Nafis Noor. How may I assist your reflection and learning today?',
  timestamp: isArabic ? 'الآن' : 'Just now',
});

export const DEFAULT_WELCOME_MESSAGE: NoorAIMessage = getInitialWelcomeMessage(true);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

async function compressImageForAnalysis(
  file: File,
  maxDimension = 1024,
  quality = 0.82
): Promise<{ previewUrl: string; mimeType: string; base64Data: string }> {
  const originalDataUrl = await readFileAsDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageEl = new Image();
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = () => reject(new Error('Image decode error'));
      imageEl.src = originalDataUrl;
    });

    const maxSide = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
    const targetW = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const targetH = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

    // Skip re-encoding if already small and compact
    if (scale === 1 && file.size <= 160 * 1024) {
      const mime = file.type || 'image/jpeg';
      return {
        previewUrl: originalDataUrl,
        mimeType: mime,
        base64Data: originalDataUrl.includes(',') ? originalDataUrl.split(',')[1] : originalDataUrl,
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    return {
      previewUrl: compressedDataUrl,
      mimeType: 'image/jpeg',
      base64Data: compressedDataUrl.includes(',') ? compressedDataUrl.split(',')[1] : compressedDataUrl,
    };
  } catch {
    const mime = file.type || 'image/jpeg';
    return {
      previewUrl: originalDataUrl,
      mimeType: mime,
      base64Data: originalDataUrl.includes(',') ? originalDataUrl.split(',')[1] : originalDataUrl,
    };
  }
}

interface NoorAIScreenProps {
  isDark: boolean;
  initialPrompt?: string;
  userStats?: UserStats;
  onUpdateStats?: (stats: Partial<UserStats>) => void;
  messages?: NoorAIMessage[];
  onUpdateMessages?: (messages: NoorAIMessage[]) => void;
}

const STARTER_PROMPTS = {
  en: [
    'Explain the virtues of Surah Al-Kahf on Friday',
    'How can I build consistency in my five daily prayers?',
    'What are authentic morning and evening adhkar?',
    'Summarize the etiquette of making sincere du’a',
  ],
  ar: [
    'ما فضل قراءة سورة الكهف يوم الجمعة؟',
    'كيف أحافظ على الخشوع والمواظبة في الصلوات الخمس؟',
    'اذكر لي أذكار الصباح والمساء المأثورة بإيجاز',
    'ما آداب الدعاء وأوقات الإجابة؟',
  ],
};

interface NormalizedNoorPayload {
  directAnswer: string;
  suggestedTitle?: string;
  transcript?: string;
  memoriesToSave?: Array<{ content: string; category?: NoorMemoryCategory }>;
  memoryIdsToForget?: string[];
}

function parseNormalizedMemories(
  rawList: unknown
): Array<{ content: string; category?: NoorMemoryCategory }> | undefined {
  if (!Array.isArray(rawList)) return undefined;
  const validCats = new Set<NoorMemoryCategory>([
    'preference',
    'personal',
    'learning',
    'goal',
    'context',
  ]);
  const out: Array<{ content: string; category?: NoorMemoryCategory }> = [];
  for (const item of rawList) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ content: item.trim(), category: 'context' });
    } else if (
      item &&
      typeof item === 'object' &&
      typeof (item as any).content === 'string' &&
      (item as any).content.trim()
    ) {
      const cat = String((item as any).category || '').trim().toLowerCase() as NoorMemoryCategory;
      out.push({
        content: (item as any).content.trim(),
        category: validCats.has(cat) ? cat : 'context',
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

function normalizeNoorPayload(rawData: unknown, fallbackText: string): NormalizedNoorPayload {
  if (!rawData) return { directAnswer: fallbackText };

  let candidate: Record<string, unknown> | null = null;
  if (typeof rawData === 'string') {
    const cleaned = rawData
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object') {
        candidate = parsed as Record<string, unknown>;
      }
    } catch {
      return { directAnswer: cleaned || fallbackText };
    }
  } else if (typeof rawData === 'object') {
    candidate = rawData as Record<string, unknown>;
  }

  if (!candidate) return { directAnswer: fallbackText };

  let textValue =
    (typeof candidate.directAnswer === 'string' && candidate.directAnswer) ||
    (typeof candidate.answer === 'string' && candidate.answer) ||
    (typeof candidate.response === 'string' && candidate.response) ||
    (typeof candidate.text === 'string' && candidate.text) ||
    '';

  // Handle nested JSON string accidentally returned inside directAnswer
  if (textValue.trim().startsWith('{') || textValue.trim().startsWith('```')) {
    const cleanedInner = textValue
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    if (cleanedInner.startsWith('{')) {
      try {
        const nested = JSON.parse(cleanedInner) as Record<string, unknown>;
        if (typeof nested.directAnswer === 'string' && nested.directAnswer.trim()) {
          textValue = nested.directAnswer;
        }
      } catch {
        // Keep original textValue if not valid JSON
      }
    }
  }

  const normalizedText = textValue.replace(/\\n/g, '\n').trim() || fallbackText;
  const titleValue =
    typeof candidate.suggestedTitle === 'string' && candidate.suggestedTitle.trim()
      ? candidate.suggestedTitle.trim()
      : undefined;
  const transcriptValue =
    typeof candidate.transcript === 'string' && candidate.transcript.trim()
      ? candidate.transcript.trim()
      : undefined;
  const memoriesToSave = parseNormalizedMemories(candidate.memoriesToSave);
  const memoryIdsToForget = Array.isArray(candidate.memoryIdsToForget)
    ? candidate.memoryIdsToForget
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim())
    : undefined;

  return {
    directAnswer: normalizedText,
    suggestedTitle: titleValue,
    transcript: transcriptValue,
    memoriesToSave,
    memoryIdsToForget: memoryIdsToForget && memoryIdsToForget.length > 0 ? memoryIdsToForget : undefined,
  };
}

function normalizeMemoryComparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyMemoryMutations(
  currentMemories: NoorMemoryItem[],
  memoriesToSave?: Array<{ content: string; category?: NoorMemoryCategory }>,
  memoryIdsToForget?: string[],
  sourceSessionId?: string
): {
  nextMemories: NoorMemoryItem[];
  addedTexts: string[];
  removedTexts: string[];
  changed: boolean;
} {
  let updated = [...currentMemories];
  const removedTexts: string[] = [];
  const addedTexts: string[] = [];
  let changed = false;

  if (memoryIdsToForget && memoryIdsToForget.length > 0) {
    const forgetSet = new Set(memoryIdsToForget);
    updated = updated.filter((mem) => {
      if (forgetSet.has(mem.id)) {
        removedTexts.push(mem.content);
        changed = true;
        return false;
      }
      return true;
    });
  }

  if (memoriesToSave && memoriesToSave.length > 0) {
    const now = new Date().toISOString();
    for (const candidate of memoriesToSave) {
      const clean = candidate.content.trim().slice(0, 300);
      if (!clean) continue;
      const cleanComp = normalizeMemoryComparable(clean);
      if (!cleanComp) continue;

      const duplicateExists = updated.some((existing) => {
        const exComp = normalizeMemoryComparable(existing.content);
        return exComp === cleanComp || (exComp.length > 12 && cleanComp.length > 12 && (exComp.includes(cleanComp) || cleanComp.includes(exComp)));
      });

      if (!duplicateExists) {
        updated.unshift({
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          content: clean,
          category: candidate.category || 'context',
          createdAt: now,
          updatedAt: now,
          sourceSessionId,
        });
        addedTexts.push(clean);
        changed = true;
      }
    }
  }

  return {
    nextMemories: updated.slice(0, 200),
    addedTexts,
    removedTexts,
    changed,
  };
}

function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const NoorAIScreen: React.FC<NoorAIScreenProps> = ({
  isDark,
  initialPrompt,
  userStats,
  onUpdateStats,
  messages: externalMessages,
  onUpdateMessages,
}) => {
  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';
  const isRtl = isRTLLanguage(lang);
  const requestLanguage = userStats?.language || getGlobalLanguage();
  const existingSessions = userStats?.noorAiSessions || [];
  const currentActiveId = userStats?.activeNoorSessionId;

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (currentActiveId && existingSessions.some((s) => s.id === currentActiveId)) {
      return currentActiveId;
    }
    if (existingSessions.length > 0) {
      return existingSessions[0].id;
    }
    return `session-${Date.now()}`;
  });

  // Sync activeSessionId if sessions hydrate asynchronously after initial mount
  useEffect(() => {
    if (
      currentActiveId &&
      currentActiveId !== activeSessionId &&
      existingSessions.some((s) => s.id === currentActiveId) &&
      !existingSessions.some((s) => s.id === activeSessionId && s.messages.length > 0)
    ) {
      setActiveSessionId(currentActiveId);
    }
  }, [currentActiveId, existingSessions, activeSessionId]);

  const currentSession = existingSessions.find((s) => s.id === activeSessionId);
  const activeMessages = currentSession
    ? currentSession.messages
    : externalMessages && externalMessages.length > 0
    ? externalMessages
    : [];

  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceRecorderState, setVoiceRecorderState] = useState<VoiceRecorderState>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Smooth streaming state for freshly received responses
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamingFullText, setStreamingFullText] = useState<string>('');
  const [streamedCharCount, setStreamedCharCount] = useState<number>(0);

  // Navigation, menus, drawers, modals
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'chats' | 'saved' | 'memory'>('chats');
  const [historySearch, setHistorySearch] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [moreMenuDir, setMoreMenuDir] = useState<'up' | 'down'>('up');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [confirmClearAllMemories, setConfirmClearAllMemories] = useState(false);
  const [confirmClearAllHistory, setConfirmClearAllHistory] = useState(false);
  const [manualMemoryInput, setManualMemoryInput] = useState('');
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showImageStudioModal, setShowImageStudioModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ previewUrl: string; mimeType: string; base64Data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const memorySettingsRef = useRef<HTMLDivElement | null>(null);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Zephyr');

  // Saved Long-Term Memories + Refs for race-free cross-conversation persistence
  const savedMemoriesList = userStats?.noorAiMemories || [];
  const memoryEnabled = userStats?.noorAiMemoryEnabled !== false;
  const sessionsRef = useRef<NoorAIConversationSession[]>(existingSessions);
  const memoriesRef = useRef<NoorMemoryItem[]>(savedMemoriesList);
  const memoryEnabledRef = useRef<boolean>(memoryEnabled);

  useEffect(() => {
    sessionsRef.current = existingSessions;
  }, [existingSessions]);

  useEffect(() => {
    memoriesRef.current = savedMemoriesList;
  }, [savedMemoriesList]);

  useEffect(() => {
    memoryEnabledRef.current = memoryEnabled;
  }, [memoryEnabled]);

  // Audio playback (Listen)
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);
  const [isTtsLoadingId, setIsTtsLoadingId] = useState<string | null>(null);

  // Scroll & mobile keyboard layout state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ttsStopFnRef = useRef<(() => void) | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledInitialPromptRef = useRef<string | null>(null);
  const userScrolledUpRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  // Auto-resize composer textarea matched cleanly to 36px button baseline
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 144);
    el.style.height = `${Math.max(nextHeight, 36)}px`;
  }, [inputQuery]);

  // Smooth keyboard resize handling on iOS/Android using visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const updateViewportOffset = () => {
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setKeyboardOffset(offset);
    };
    vv.addEventListener('resize', updateViewportOffset);
    vv.addEventListener('scroll', updateViewportOffset);
    return () => {
      vv.removeEventListener('resize', updateViewportOffset);
      vv.removeEventListener('scroll', updateViewportOffset);
    };
  }, []);

  // Progressive smooth word-by-word reveal for newly received answers
  useEffect(() => {
    if (!streamingMsgId || !streamingFullText) return;
    if (streamedCharCount >= streamingFullText.length) {
      setStreamingMsgId(null);
      return;
    }

    const total = streamingFullText.length;
    const step = total > 900 ? 14 : total > 400 ? 9 : 6;
    const timer = window.setTimeout(() => {
      setStreamedCharCount((prev) => Math.min(total, prev + step));
    }, 16);

    return () => window.clearTimeout(timer);
  }, [streamingMsgId, streamingFullText, streamedCharCount]);

  // Scroll only the inner chat container (prevents page/viewport jumping)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    userScrolledUpRef.current = false;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (streamingMsgId) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [activeMessages.length, isLoading, streamedCharCount, streamingMsgId]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAway = distanceFromBottom > 140;
    userScrolledUpRef.current = isAway;
    setShowScrollBottom(isAway);
  };

  // Close floating popovers on outside click
  useEffect(() => {
    if (!openMoreMenuId && !showPlusMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-noor-popover]')) {
        setOpenMoreMenuId(null);
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openMoreMenuId, showPlusMenu]);

  const handleOpenVoiceRecorder = () => {
    if (isLoading) return;
    setOpenMoreMenuId(null);
    setShowPlusMenu(false);
    setVoiceRecorderState('recording');
  };

  const persistSessionMessages = useCallback(
    (
      sessId: string,
      newMessages: NoorAIMessage[],
      customTitle?: string,
      nextMemoriesOverride?: NoorMemoryItem[]
    ) => {
      const now = new Date().toISOString();
      const sessions = [...(sessionsRef.current || [])];
      const existingIndex = sessions.findIndex((s) => s.id === sessId);

      let title = customTitle;
      if (!title) {
        const firstUserMsg = newMessages.find((m) => m.sender === 'user');
        if (firstUserMsg) {
          title = firstUserMsg.text.slice(0, 38);
          if (firstUserMsg.text.length > 38) title += '...';
        } else {
          title = isArabic ? 'محادثة جديدة' : 'New Conversation';
        }
      }

      let updatedSessionObj: NoorAIConversationSession;
      if (existingIndex >= 0) {
        const currentTitle = sessions[existingIndex].title;
        const shouldReplaceTitle =
          !currentTitle ||
          currentTitle === 'New Conversation' ||
          currentTitle === 'محادثة جديدة';
        updatedSessionObj = {
          ...sessions[existingIndex],
          title: shouldReplaceTitle ? title : currentTitle,
          updatedAt: now,
          messages: newMessages,
        };
        sessions[existingIndex] = updatedSessionObj;
      } else {
        updatedSessionObj = {
          id: sessId,
          title: title || (isArabic ? 'محادثة جديدة' : 'New Conversation'),
          createdAt: now,
          updatedAt: now,
          messages: newMessages,
        };
        sessions.unshift(updatedSessionObj);
      }

      sessionsRef.current = sessions;
      if (nextMemoriesOverride !== undefined) {
        memoriesRef.current = nextMemoriesOverride;
      }

      if (onUpdateStats) {
        onUpdateStats({
          noorAiSessions: sessions,
          activeNoorSessionId: sessId,
          noorAiConversation: newMessages,
          ...(nextMemoriesOverride !== undefined ? { noorAiMemories: nextMemoriesOverride } : {}),
        });
      }
      if (onUpdateMessages) {
        onUpdateMessages(newMessages);
      }
      if (userStats?.accountId && newMessages.length > 0) {
        syncChatSessionToFirestore(userStats.accountId, updatedSessionObj).catch(() => {});
      }
    },
    [isArabic, onUpdateMessages, onUpdateStats, userStats?.accountId]
  );

  const buildPastConversationsContext = useCallback((excludeSessionId: string) => {
    const sorted = [...(sessionsRef.current || [])]
      .filter((s) => s && s.id !== excludeSessionId && Array.isArray(s.messages) && s.messages.some((m) => !m.isError))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return sorted.slice(0, 35).map((s) => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt,
      messages: s.messages
        .filter((m) => !m.isError)
        .slice(-14)
        .map((m) => ({
          sender: m.sender,
          text: m.text.slice(0, 500),
          timestamp: m.timestamp,
        })),
    }));
  }, []);

  const callNoorBackend = useCallback(
    async (
      question: string,
      historyForContext: NoorAIMessage[],
      audioPayload?: { data: string; mimeType: string; durationSeconds: number },
      imagePayload?: { data: string; mimeType: string },
      sessionIdForExclude: string = activeSessionId
    ) => {
      const pastConversations = buildPastConversationsContext(sessionIdForExclude);
      const userMemories = memoriesRef.current || [];
      const isMemEnabled = memoryEnabledRef.current;

      const response = await fetch(getApiUrl('/api/noor-ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': requestLanguage,
          'x-language': requestLanguage,
        },
        body: JSON.stringify({
          question,
          audio: audioPayload,
          image: imagePayload,
          conversationHistory: historyForContext
            .filter((m) => !m.isError)
            .map((m) => ({ sender: m.sender, text: m.text })),
          pastConversations,
          userMemories: userMemories.map((m) => ({
            id: m.id,
            content: m.content,
            category: m.category,
            updatedAt: m.updatedAt,
          })),
          memoryEnabled: isMemEnabled,
          language: requestLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const payload = await response.json();
      const rawData = payload?.data ?? payload;
      const fallbackDefault = isArabic
        ? 'طلب العلم النافع بإخلاص وسكينة من أعظم القربات.'
        : 'Seeking beneficial knowledge with sincerity is deeply rewarded.';

      if (payload?.success === false) {
        throw new Error(payload?.error || 'Backend returned an error');
      }

      return normalizeNoorPayload(rawData, fallbackDefault);
    },
    [activeSessionId, buildPastConversationsContext, isArabic, requestLanguage]
  );

  const handleSendMessage = useCallback(
    async (queryText?: string) => {
      const textToSend = (queryText ?? inputQuery).trim();
      const currentImage = pendingImage;
      if ((!textToSend && !currentImage) || isLoading) return;

      setLastFailedQuery(null);
      setOpenMoreMenuId(null);
      setShowPlusMenu(false);
      userScrolledUpRef.current = false;
      setPendingImage(null);

      const userMessage: NoorAIMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: textToSend || (isArabic ? 'صورة مرفقة للتحليل' : 'Attached image for analysis'),
        messageType: 'text',
        attachedImage: currentImage?.previewUrl,
        timestamp: isArabic ? 'الآن' : 'Just now',
      };

      const cleanedMessages = activeMessages.filter((m) => !m.isError);
      const newHistory = [...cleanedMessages, userMessage];
      persistSessionMessages(activeSessionId, newHistory);
      setInputQuery('');
      setIsLoading(true);

      try {
        const noorReply = await callNoorBackend(
          textToSend || (isArabic ? 'حلل هذه الصورة بالتفصيل' : 'Analyze this attached image'),
          newHistory,
          undefined,
          currentImage ? { data: currentImage.base64Data, mimeType: currentImage.mimeType } : undefined,
          activeSessionId
        );
        const answerText = noorReply.directAnswer;

        const memResult = applyMemoryMutations(
          memoriesRef.current || [],
          memoryEnabledRef.current ? noorReply.memoriesToSave : undefined,
          noorReply.memoryIdsToForget,
          activeSessionId
        );

        const noorMessageId = `noor-${Date.now()}`;
        const noorMessage: NoorAIMessage = {
          id: noorMessageId,
          sender: 'noor',
          text: answerText,
          timestamp: isArabic ? 'الآن' : 'Just now',
          ...(memResult.addedTexts.length > 0 ? { savedMemories: memResult.addedTexts } : {}),
          ...(memResult.removedTexts.length > 0 ? { forgotMemories: memResult.removedTexts } : {}),
        };

        const updatedWithNoor = [...newHistory, noorMessage];
        persistSessionMessages(
          activeSessionId,
          updatedWithNoor,
          noorReply.suggestedTitle,
          memResult.changed ? memResult.nextMemories : undefined
        );

        if (memResult.addedTexts.length > 0) {
          showToast(isArabic ? 'تم الحفظ في الذاكرة الدائمة' : 'Saved to memory');
        } else if (memResult.removedTexts.length > 0) {
          showToast(isArabic ? 'تم تحديث الذاكرة' : 'Memory updated');
        }

        setStreamingMsgId(noorMessageId);
        setStreamingFullText(answerText);
        setStreamedCharCount(Math.min(12, answerText.length));
      } catch (err) {
        console.error('Error fetching Noor AI:', err);
        setLastFailedQuery(textToSend);

        const errorReply: NoorAIMessage = {
          id: `noor-err-${Date.now()}`,
          sender: 'noor',
          text: isArabic
            ? 'تعذر إتمام الإجابة حالياً. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
            : "I couldn't complete that response right now. Please check your connection and try again.",
          isError: true,
          timestamp: isArabic ? 'الآن' : 'Just now',
        };
        persistSessionMessages(activeSessionId, [...newHistory, errorReply]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeMessages,
      activeSessionId,
      callNoorBackend,
      inputQuery,
      isArabic,
      isLoading,
      pendingImage,
      persistSessionMessages,
      showToast,
    ]
  );

  const handleSendVoiceMessage = useCallback(
    async (payload: RecordedVoicePayload) => {
      if (isLoading) return;

      setLastFailedQuery(null);
      setOpenMoreMenuId(null);
      setShowPlusMenu(false);
      userScrolledUpRef.current = false;

      const userMsgId = `user-voice-${Date.now()}`;
      cacheSessionAudioUrl(userMsgId, payload.objectUrl);
      void saveVoiceClipBlob(userMsgId, payload.blob);

      const userVoiceMessage: NoorAIMessage = {
        id: userMsgId,
        sender: 'user',
        text: isArabic ? 'رسالة صوتية' : 'Voice message',
        messageType: 'voice',
        audioUrl: payload.dataUrl,
        audioMimeType: payload.mimeType,
        audioDuration: payload.durationSeconds,
        audioWaveform: payload.waveform,
        timestamp: isArabic ? 'الآن' : 'Just now',
      };

      const cleanedMessages = activeMessages.filter((m) => !m.isError);
      const newHistory = [...cleanedMessages, userVoiceMessage];
      persistSessionMessages(activeSessionId, newHistory);

      setVoiceRecorderState('sent');
      window.setTimeout(() => {
        setVoiceRecorderState('idle');
      }, 140);
      setIsLoading(true);

      try {
        const noorReply = await callNoorBackend(
          '',
          newHistory,
          {
            data: payload.base64Data,
            mimeType: payload.mimeType,
            durationSeconds: payload.durationSeconds,
          },
          undefined,
          activeSessionId
        );

        const enrichedHistory = noorReply.transcript
          ? newHistory.map((m) =>
              m.id === userMsgId ? { ...m, text: noorReply.transcript || m.text } : m
            )
          : newHistory;

        const memResult = applyMemoryMutations(
          memoriesRef.current || [],
          memoryEnabledRef.current ? noorReply.memoriesToSave : undefined,
          noorReply.memoryIdsToForget,
          activeSessionId
        );

        const answerText = noorReply.directAnswer;
        const noorMessageId = `noor-${Date.now()}`;
        const noorMessage: NoorAIMessage = {
          id: noorMessageId,
          sender: 'noor',
          text: answerText,
          timestamp: isArabic ? 'الآن' : 'Just now',
          ...(memResult.addedTexts.length > 0 ? { savedMemories: memResult.addedTexts } : {}),
          ...(memResult.removedTexts.length > 0 ? { forgotMemories: memResult.removedTexts } : {}),
        };

        persistSessionMessages(
          activeSessionId,
          [...enrichedHistory, noorMessage],
          noorReply.suggestedTitle,
          memResult.changed ? memResult.nextMemories : undefined
        );

        if (memResult.addedTexts.length > 0) {
          showToast(isArabic ? 'تم الحفظ في الذاكرة الدائمة' : 'Saved to memory');
        } else if (memResult.removedTexts.length > 0) {
          showToast(isArabic ? 'تم تحديث الذاكرة' : 'Memory updated');
        }

        setStreamingMsgId(noorMessageId);
        setStreamingFullText(answerText);
        setStreamedCharCount(Math.min(12, answerText.length));
      } catch (err) {
        console.error('Error sending voice message to Noor AI:', err);
        const errorReply: NoorAIMessage = {
          id: `noor-err-${Date.now()}`,
          sender: 'noor',
          text: isArabic
            ? 'تعذر معالجة الرسالة الصوتية حالياً. يرجى المحاولة مرة أخرى.'
            : "I couldn't process that voice message right now. Please try again.",
          isError: true,
          timestamp: isArabic ? 'الآن' : 'Just now',
        };
        persistSessionMessages(activeSessionId, [...newHistory, errorReply]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeMessages, activeSessionId, callNoorBackend, isArabic, isLoading, persistSessionMessages, showToast]
  );

  // Trigger initialPrompt once when passed externally
  useEffect(() => {
    if (
      initialPrompt &&
      initialPrompt.trim().length > 0 &&
      handledInitialPromptRef.current !== initialPrompt
    ) {
      handledInitialPromptRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, handleSendMessage]);

  const handleRetry = () => {
    if (!lastFailedQuery || isLoading) return;
    const filtered = activeMessages.filter((m) => !m.isError);
    persistSessionMessages(activeSessionId, filtered);
    handleSendMessage(lastFailedQuery);
  };

  // Regenerate an assistant response using the preceding user prompt
  const handleRegenerateMessage = async (targetMsgId: string) => {
    if (isLoading) return;
    setOpenMoreMenuId(null);

    const targetIndex = activeMessages.findIndex((m) => m.id === targetMsgId);
    if (targetIndex === -1) return;

    let promptIndex = -1;
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (activeMessages[i].sender === 'user') {
        promptIndex = i;
        break;
      }
    }
    if (promptIndex === -1) return;

    const promptText = activeMessages[promptIndex].text;
    const historyUpToPrompt = activeMessages.slice(0, promptIndex + 1).filter((m) => !m.isError);

    persistSessionMessages(activeSessionId, historyUpToPrompt);
    setIsLoading(true);
    userScrolledUpRef.current = false;

    try {
      const noorReply = await callNoorBackend(
        promptText,
        historyUpToPrompt,
        undefined,
        undefined,
        activeSessionId
      );
      const answerText = noorReply.directAnswer;

      const memResult = applyMemoryMutations(
        memoriesRef.current || [],
        memoryEnabledRef.current ? noorReply.memoriesToSave : undefined,
        noorReply.memoryIdsToForget,
        activeSessionId
      );

      const regeneratedId = `noor-${Date.now()}`;
      const noorMessage: NoorAIMessage = {
        id: regeneratedId,
        sender: 'noor',
        text: answerText,
        timestamp: isArabic ? 'الآن' : 'Just now',
        ...(memResult.addedTexts.length > 0 ? { savedMemories: memResult.addedTexts } : {}),
        ...(memResult.removedTexts.length > 0 ? { forgotMemories: memResult.removedTexts } : {}),
      };

      persistSessionMessages(
        activeSessionId,
        [...historyUpToPrompt, noorMessage],
        noorReply.suggestedTitle,
        memResult.changed ? memResult.nextMemories : undefined
      );
      if (memResult.addedTexts.length > 0) {
        showToast(isArabic ? 'تم الحفظ في الذاكرة الدائمة' : 'Saved to memory');
      } else if (memResult.removedTexts.length > 0) {
        showToast(isArabic ? 'تم تحديث الذاكرة' : 'Memory updated');
      }
      setStreamingMsgId(regeneratedId);
      setStreamingFullText(answerText);
      setStreamedCharCount(Math.min(12, answerText.length));
    } catch (err) {
      console.error('Error regenerating Noor AI message:', err);
      setLastFailedQuery(promptText);
      const errorReply: NoorAIMessage = {
        id: `noor-err-${Date.now()}`,
        sender: 'noor',
        text: isArabic
          ? 'تعذر إعادة توليد الإجابة حالياً. يرجى المحاولة مرة أخرى.'
          : "Couldn't regenerate that response right now. Please try again.",
        isError: true,
        timestamp: isArabic ? 'الآن' : 'Just now',
      };
      persistSessionMessages(activeSessionId, [...historyUpToPrompt, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTTS = async (msg: NoorAIMessage) => {
    stopAllVoicePlayback();

    if (playingTtsId === msg.id) {
      if (ttsStopFnRef.current) {
        ttsStopFnRef.current();
        ttsStopFnRef.current = null;
      }
      TTSPlayer.stop();
      setPlayingTtsId(null);
      return;
    }

    if (ttsStopFnRef.current) {
      ttsStopFnRef.current();
      ttsStopFnRef.current = null;
    }
    TTSPlayer.stop();

    setIsTtsLoadingId(msg.id);

    const rawSpeech = [
      msg.text || '',
      msg.explanation
        ? isArabic
          ? `البيان: ${msg.explanation}`
          : `Explanation: ${msg.explanation}`
        : '',
      msg.concludingDua
        ? isArabic
          ? `الدعاء: ${msg.concludingDua}`
          : `Supplication: ${msg.concludingDua}`
        : '',
    ]
      .filter(Boolean)
      .join('. ');

    const cleanSpeech = stripMarkdownForSpeech(rawSpeech);

    const stopFn = await TTSPlayer.playText(
      cleanSpeech,
      activeVoiceName,
      () => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(msg.id);
      },
      () => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(null);
        ttsStopFnRef.current = null;
      },
      (err) => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(null);
        showToast(isArabic ? `تعذر تشغيل الصوت: ${err}` : `Voice playback: ${err}`);
      }
    );
    ttsStopFnRef.current = stopFn;
  };

  const handleLiveSessionTranscripts = (liveEntries: LiveTranscriptEntry[]) => {
    if (!liveEntries || liveEntries.length === 0) return;

    const newMsgs: NoorAIMessage[] = liveEntries.map((entry) => ({
      id: entry.id,
      sender: entry.sender === 'user' ? 'user' : 'noor',
      text: entry.text,
      timestamp: entry.timestamp || (isArabic ? 'الآن' : 'Just now'),
      sourceVerification:
        entry.sender === 'noor'
          ? isArabic
            ? 'محادثة صوتية مباشرة'
            : 'Live Voice Conversation'
          : undefined,
    }));

    const updatedMessages = [...activeMessages, ...newMsgs];
    persistSessionMessages(
      activeSessionId,
      updatedMessages,
      isArabic ? 'محادثة صوتية' : 'Live Voice Talk'
    );
    showToast(
      isArabic ? 'تم حفظ المحادثة الصوتية في السجل' : 'Live voice conversation saved'
    );
  };

  const handleNewChat = () => {
    if (ttsStopFnRef.current) {
      ttsStopFnRef.current();
      ttsStopFnRef.current = null;
    }
    TTSPlayer.stop();
    setPlayingTtsId(null);
    setStreamingMsgId(null);
    setOpenMoreMenuId(null);
    setShowPlusMenu(false);

    // Keep all non-empty conversations intact; prune old 0-message empty placeholders to keep history clean
    const nonEmptySessions = (sessionsRef.current || []).filter((s) => s.messages && s.messages.length > 0);
    sessionsRef.current = nonEmptySessions;

    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    persistSessionMessages(newId, [], isArabic ? 'محادثة جديدة' : 'New Conversation');
    setInputQuery('');
    setShowHistoryDrawer(false);
    setTimeout(() => textareaRef.current?.focus(), 60);
  };

  const handleSwitchSession = (sessionId: string) => {
    setStreamingMsgId(null);
    setOpenMoreMenuId(null);
    setActiveSessionId(sessionId);
    const target = (sessionsRef.current || []).find((s) => s.id === sessionId);
    if (target && onUpdateStats) {
      onUpdateStats({
        activeNoorSessionId: sessionId,
        noorAiConversation: target.messages,
      });
    }
    setShowHistoryDrawer(false);
    userScrolledUpRef.current = false;
  };

  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let sessions = [...(sessionsRef.current || [])];
    sessions = sessions.filter((s) => s.id !== sessionId);
    sessionsRef.current = sessions;

    let nextActiveId = activeSessionId;
    if (activeSessionId === sessionId) {
      nextActiveId = sessions.length > 0 ? sessions[0].id : `session-${Date.now()}`;
      setActiveSessionId(nextActiveId);
    }

    const nextMessages = sessions.find((s) => s.id === nextActiveId)?.messages || [];

    if (onUpdateStats) {
      onUpdateStats({
        noorAiSessions: sessions,
        activeNoorSessionId: nextActiveId,
        noorAiConversation: nextMessages,
      });
    }
    if (userStats?.accountId) {
      deleteChatSessionFromFirestore(userStats.accountId, sessionId).catch(() => {});
    }
    showToast(isArabic ? 'تم حذف المحادثة' : 'Conversation deleted');
  };

  const handleClearCurrentConversation = () => {
    persistSessionMessages(activeSessionId, []);
    setShowClearConfirmModal(false);
    showToast(isArabic ? 'تم مسح المحادثة' : 'Conversation cleared');
  };

  const handleToggleMemoryEnabled = () => {
    const nextVal = !memoryEnabledRef.current;
    memoryEnabledRef.current = nextVal;
    if (onUpdateStats) {
      onUpdateStats({ noorAiMemoryEnabled: nextVal });
    }
    showToast(
      nextVal
        ? isArabic
          ? 'تم تفعيل الذاكرة الدائمة'
          : 'Saved memory enabled'
        : isArabic
        ? 'تم إيقاف الحفظ التلقائي للذاكرة'
        : 'Automatic memory paused'
    );
  };

  const handleAddManualMemory = () => {
    const clean = manualMemoryInput.trim().slice(0, 300);
    if (!clean) return;
    const result = applyMemoryMutations(
      memoriesRef.current || [],
      [{ content: clean, category: 'preference' }],
      undefined,
      activeSessionId
    );
    if (result.changed) {
      memoriesRef.current = result.nextMemories;
      if (onUpdateStats) {
        onUpdateStats({ noorAiMemories: result.nextMemories });
      }
      setManualMemoryInput('');
      showToast(isArabic ? 'تمت الإضافة للذاكرة الدائمة' : 'Added to memory');
    } else {
      setManualMemoryInput('');
      showToast(isArabic ? 'هذه المعلومة محفوظة بالفعل' : 'Already remembered');
    }
  };

  const handleDeleteMemory = (memoryId: string) => {
    const nextMemories = (memoriesRef.current || []).filter((m) => m.id !== memoryId);
    memoriesRef.current = nextMemories;
    if (onUpdateStats) {
      onUpdateStats({ noorAiMemories: nextMemories });
    }
    showToast(isArabic ? 'تم حذف المعلومة من الذاكرة' : 'Memory removed');
  };

  const handleClearAllMemories = () => {
    memoriesRef.current = [];
    setConfirmClearAllMemories(false);
    if (onUpdateStats) {
      onUpdateStats({ noorAiMemories: [] });
    }
    showToast(isArabic ? 'تم مسح جميع الذكريات المحفوظة' : 'All saved memories cleared');
  };

  const handleClearAllHistory = () => {
    const previousIds = (sessionsRef.current || []).map((s) => s.id);
    const freshId = `session-${Date.now()}`;
    const freshSession: NoorAIConversationSession = {
      id: freshId,
      title: isArabic ? 'محادثة جديدة' : 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    sessionsRef.current = [freshSession];
    setActiveSessionId(freshId);
    setConfirmClearAllHistory(false);

    if (onUpdateStats) {
      onUpdateStats({
        noorAiSessions: [freshSession],
        activeNoorSessionId: freshId,
        noorAiConversation: [],
      });
    }
    if (onUpdateMessages) {
      onUpdateMessages([]);
    }
    if (userStats?.accountId) {
      previousIds.forEach((id) => {
        deleteChatSessionFromFirestore(userStats.accountId!, id).catch(() => {});
      });
    }
    showToast(isArabic ? 'تم مسح جميع المحادثات السابقة' : 'All conversation history cleared');
  };

  const openMemoryManager = () => {
    setShowSettingsModal(true);
    setTimeout(() => {
      memorySettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  };

  const handleFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
    const updated = activeMessages.map((m) =>
      m.id === msgId ? { ...m, feedback: m.feedback === type ? undefined : type } : m
    );
    persistSessionMessages(activeSessionId, updated);
    setOpenMoreMenuId(null);
    showToast(
      type === 'helpful'
        ? isArabic
          ? 'شكراً لتقييمك'
          : 'Marked as helpful'
        : isArabic
        ? 'تم تسجيل ملاحظتك'
        : 'Feedback noted'
    );
  };

  const handleToggleSave = (msg: NoorAIMessage) => {
    const isNowSaved = !msg.isSaved;
    const updatedMessages = activeMessages.map((m) =>
      m.id === msg.id ? { ...m, isSaved: isNowSaved } : m
    );
    persistSessionMessages(activeSessionId, updatedMessages);

    if (onUpdateStats && userStats) {
      let saved = [...(userStats.savedNoorMessages || [])];
      if (isNowSaved) {
        if (!saved.some((s) => s.id === msg.id)) {
          saved.push({ ...msg, isSaved: true });
        }
      } else {
        saved = saved.filter((s) => s.id !== msg.id);
      }
      onUpdateStats({ savedNoorMessages: saved });
    }

    setOpenMoreMenuId(null);
    showToast(
      isNowSaved
        ? isArabic
          ? 'تم الحفظ في الفوائد'
          : 'Saved to insights'
        : isArabic
        ? 'تمت الإزالة من المحفوظات'
        : 'Removed from saved'
    );
  };

  const handleCopyMessage = (msg: NoorAIMessage) => {
    let fullText = '';
    if (msg.greeting) fullText += `${msg.greeting}\n\n`;
    fullText += msg.text;
    navigator.clipboard.writeText(fullText);
    setCopiedId(msg.id);
    showToast(isArabic ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleShareMessage = async (msg: NoorAIMessage) => {
    const textToShare = `${msg.greeting ? `${msg.greeting}\n\n` : ''}${msg.text}\n\n— ${
      isArabic ? 'نفيس نور' : 'Nafis Noor AI'
    }`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isArabic ? 'نفيس نور' : 'Nafis Noor AI',
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard when dismissed or unsupported
      }
    }
    handleCopyMessage(msg);
  };

  const handleShareConversation = async () => {
    if (activeMessages.length === 0) {
      showToast(isArabic ? 'لا توجد رسائل لمشاركتها بعد' : 'Start a conversation to share');
      return;
    }

    const formattedThread = activeMessages
      .filter((m) => !m.isError)
      .map((m) => `${m.sender === 'user' ? (isArabic ? 'أنت' : 'You') : 'Nafis Noor'}: ${m.text}`)
      .join('\n\n');

    const title = currentSession?.title || (isArabic ? 'محادثة نفيس نور' : 'Nafis Noor Conversation');
    const payload = `${title}\n\n${formattedThread}\n\n— Nafis Noor`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: payload });
        return;
      } catch {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(payload);
    showToast(isArabic ? 'تم نسخ المحادثة للمشاركة' : 'Conversation copied to share');
  };

  const filteredSessions = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return existingSessions;
    return existingSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [existingSessions, historySearch]);

  const savedMessages = userStats?.savedNoorMessages || [];
  const starterPrompts = isArabic ? STARTER_PROMPTS.ar : STARTER_PROMPTS.en;
  const hasTypedText = inputQuery.trim().length > 0;

  const liveVoiceMemoryContext = useMemo(() => {
    const parts: string[] = [];
    if (memoryEnabled && savedMemoriesList.length > 0) {
      parts.push(
        `Saved User Memories:\n${savedMemoriesList
          .slice(0, 40)
          .map((m) => `- ${m.content}`)
          .join('\n')}`
      );
    }
    const recentSessions = existingSessions
      .filter((s) => s.messages && s.messages.length > 0)
      .slice(0, 6);
    if (recentSessions.length > 0) {
      parts.push(
        `Recent Past Conversations:\n${recentSessions
          .map((s) => {
            const snippet = s.messages
              .filter((m) => !m.isError)
              .slice(-4)
              .map((m) => `${m.sender === 'user' ? 'User' : 'Noor'}: ${m.text.slice(0, 140)}`)
              .join(' | ');
            return `- "${s.title}": ${snippet}`;
          })
          .join('\n')}`
      );
    }
    return parts.join('\n\n');
  }, [existingSessions, memoryEnabled, savedMemoriesList]);

  return (
    <div
      className={`relative flex flex-col w-full h-[calc(100dvh-env(safe-area-inset-top,0px))] overflow-hidden select-text transition-colors duration-200 ${
        isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
      }`}
      style={{
        paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined,
        transition: 'padding-bottom 160ms ease-out',
      }}
    >
      {/* Subtle Top Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-[64px] left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-2rem)] px-4 py-2 rounded-full text-[12.5px] font-medium shadow-md flex items-center gap-2 pointer-events-none border whitespace-nowrap ${
              isDark
                ? 'bg-[#14161A] text-[#F3F4F6] border-white/[0.12]'
                : 'bg-[#111214] text-white border-black/10'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 bg-white"
            />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Top Navigation */}
      <header
        dir="ltr"
        className={`pointer-events-none absolute top-0 inset-x-0 z-30 pt-3 sm:pt-3.5 pb-5 px-3 sm:px-6 lg:px-8 bg-gradient-to-b to-transparent ${
          isDark
            ? 'from-[#0B0C0E] via-[#0B0C0E]/90'
            : 'from-[#FCFCFA] via-[#FCFCFA]/90'
        }`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Upper-left: Circular Hamburger Menu + Clean Brand Title */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              id="open-history-btn"
              type="button"
              onClick={() => {
                setDrawerTab('chats');
                setShowHistoryDrawer(true);
              }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-[#14161A]/95 hover:bg-[#1B1D23] border-white/[0.1] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.45)]'
                  : 'bg-white/95 hover:bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
              aria-label={isArabic ? 'فتح سجل المحادثات' : 'Open conversations'}
              title={isArabic ? 'سجل المحادثات' : 'Conversation History'}
            >
              <Menu className="w-[18px] h-[18px] stroke-[1.85]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('chats');
                setShowHistoryDrawer(true);
              }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-full transition-colors min-w-0 cursor-pointer ${
                isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.03]'
              }`}
            >
              <NoorAIIcon
                className={`w-[18px] h-[18px] shrink-0 ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              />
              <span
                className={`text-[15px] font-semibold tracking-tight truncate ${
                  isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                }`}
              >
                {isArabic ? 'نفيس نور' : 'Nafis Noor'}
              </span>
            </button>
          </div>

          {/* Upper-right: Floating Capsule for New Conversation & Share (plus connected mobile drawer arrow on < lg) */}
          <div
            className={`pointer-events-auto flex items-center h-10 px-1 rounded-full border backdrop-blur-md shrink-0 ${
              isDark
                ? 'bg-[#14161A]/95 border-white/[0.1] shadow-[0_2px_10px_rgba(0,0,0,0.45)]'
                : 'bg-white/95 border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <button
              id="new-chat-btn"
              type="button"
              onClick={handleNewChat}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                isDark
                  ? 'text-[#F3F4F6] hover:bg-white/[0.07]'
                  : 'text-[#111214] hover:bg-black/[0.05]'
              }`}
              aria-label={isArabic ? 'محادثة جديدة' : 'New conversation'}
              title={isArabic ? 'محادثة جديدة' : 'New conversation'}
            >
              <SquarePen className="w-[17px] h-[17px] stroke-[1.85]" />
            </button>

            <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.08]'}`} />

            <button
              id="share-chat-btn"
              type="button"
              onClick={handleShareConversation}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer disabled:opacity-35 ${
                isDark
                  ? 'text-[#F3F4F6] hover:bg-white/[0.07]'
                  : 'text-[#111214] hover:bg-black/[0.05]'
              }`}
              aria-label={isArabic ? 'مشاركة المحادثة' : 'Share conversation'}
              title={isArabic ? 'مشاركة المحادثة' : 'Share conversation'}
            >
              <Share className="w-[17px] h-[17px] stroke-[1.85]" />
            </button>

            <div
              className={`lg:hidden w-px h-4 mx-0.5 ${
                isDark ? 'bg-white/[0.1]' : 'bg-black/[0.08]'
              }`}
            />

            <button
              id="mobile-drawer-trigger"
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('noor:open-mobile-drawer'))}
              className={`lg:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer group ${
                isDark
                  ? 'text-[#F3F4F6] hover:bg-white/[0.07]'
                  : 'text-[#111214] hover:bg-black/[0.05]'
              }`}
              aria-label={isArabic ? 'فتح قائمة التنقل وتغيير الأقسام' : 'Open Navigation & Change Sections'}
              title={isArabic ? 'تغيير الأقسام أو الخروج' : 'Exit or change sections'}
            >
              <ChevronLeft
                className={`w-[17px] h-[17px] stroke-[1.85] transition-transform duration-200 ${
                  isRtl ? 'rotate-180 group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Conversation Column */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-[70px] pb-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto min-h-full flex flex-col min-w-0">
          {activeMessages.length === 0 ? (
            /* Clean Editorial Empty State */
            <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 px-1 text-center animate-fadeIn">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/[0.12] text-white'
                    : 'bg-black/[0.04] border-black/[0.1] text-[#111214]'
                }`}
              >
                <NoorAIIcon className="w-6 h-6" />
              </div>

              <h1
                dir="auto"
                className={`text-[24px] sm:text-[28px] font-semibold tracking-tight mb-2 ${
                  isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                }`}
              >
                {isArabic ? 'كيف أستطيع مساعدتك اليوم؟' : 'What can I help with?'}
              </h1>
              <p
                dir="auto"
                className={`text-[14.5px] max-w-md leading-relaxed mb-8 ${
                  isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                }`}
              >
                {isArabic
                  ? 'اسأل نفيس نور عن القرآن الكريم، السنة النبوية، الأذكار، أو العبادات اليومية بكل وضوح واطمئنان.'
                  : 'Ask Nafis Noor about the Qur’an, authentic Hadith, daily worship, or spiritual reflection.'}
              </p>

              {/* Quiet Editorial Starter Prompts */}
              <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-start">
                {starterPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    dir="auto"
                    onClick={() => handleSendMessage(prompt)}
                    className={`p-3.5 rounded-2xl border text-[13.5px] leading-snug transition-all text-start cursor-pointer active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#14161A] border-white/[0.08] hover:border-white/[0.22] hover:bg-[#1B1D23] text-[#F3F4F6]'
                        : 'bg-white border-black/[0.08] hover:border-black/30 hover:bg-black/[0.02] text-[#111214]'
                    }`}
                  >
                    <span className="line-clamp-2">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {activeMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isSaved =
                  msg.isSaved || userStats?.savedNoorMessages?.some((s) => s.id === msg.id);
                const isStreamingThis = streamingMsgId === msg.id;
                const displayText = isStreamingThis
                  ? streamingFullText.slice(0, streamedCharCount)
                  : msg.text;
                const isMoreOpen = openMoreMenuId === msg.id;

                if (isUser) {
                  const isVoiceMsg = msg.messageType === 'voice';
                  return (
                    <div
                      key={msg.id}
                      id={`chat-msg-${msg.id}`}
                      dir="ltr"
                      className="flex justify-end min-w-0 animate-fadeIn"
                    >
                      <div
                        className={`min-w-0 w-fit max-w-[84%] sm:max-w-[72%] rounded-[22px] rounded-br-[6px] px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-2 ${
                          isDark
                            ? 'bg-[#1B1D23] border border-white/[0.1] text-[#F3F4F6]'
                            : 'bg-[#F3F3F1] text-[#111214]'
                        }`}
                      >
                        {msg.attachedImage && (
                          <div className="overflow-hidden rounded-xl max-w-xs">
                            <img src={msg.attachedImage} alt="Attached" className="w-full h-auto object-cover max-h-56" />
                          </div>
                        )}
                        {isVoiceMsg ? (
                          <NoorVoiceMessagePlayer
                            message={msg}
                            isDark={isDark}
                            isArabic={isArabic}
                            onUnavailable={() =>
                              showToast(
                                isArabic
                                  ? 'تعذر تشغيل المقطع الصوتي من الجلسة السابقة'
                                  : 'Voice audio unavailable from this session'
                              )
                            }
                          />
                        ) : (
                          <p
                            dir="auto"
                            className="text-[15.5px] leading-[1.6] font-normal whitespace-pre-wrap [overflow-wrap:anywhere] break-words"
                          >
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-${msg.id}`}
                    className="flex flex-col items-start min-w-0 w-full animate-fadeIn"
                  >
                    {msg.isError ? (
                      <div
                        className={`w-full min-w-0 max-w-[72ch] rounded-2xl border p-4 space-y-2.5 ${
                          isDark
                            ? 'border-red-500/35 bg-red-950/25'
                            : 'border-red-200 bg-red-50/70'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 text-[13.5px] font-medium ${
                            isDark ? 'text-red-300' : 'text-red-700'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            {isArabic ? 'تعذر إتمام الإجابة' : 'Unable to complete response'}
                          </span>
                        </div>
                        <p
                          dir="auto"
                          className={`text-[14.5px] leading-relaxed [overflow-wrap:anywhere] ${
                            isDark ? 'text-stone-300' : 'text-[#2A2C30]'
                          }`}
                        >
                          {msg.text}
                        </p>
                        {lastFailedQuery && (
                          <button
                            type="button"
                            onClick={handleRetry}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-colors cursor-pointer active:scale-95 ${
                              isDark
                                ? 'bg-red-500/15 border-red-500/40 hover:bg-red-500/25 text-red-200'
                                : 'bg-white border-red-200 hover:border-red-300 text-red-700'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'إعادة المحاولة' : 'Try again'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full min-w-0 max-w-[72ch]">
                        {((msg.savedMemories && msg.savedMemories.length > 0) ||
                          (msg.forgotMemories && msg.forgotMemories.length > 0)) && (
                          <button
                            type="button"
                            onClick={openMemoryManager}
                            title={
                              msg.savedMemories?.join(' • ') ||
                              msg.forgotMemories?.join(' • ') ||
                              (isArabic ? 'إدارة الذاكرة' : 'Manage memory')
                            }
                            className={`mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                              isDark
                                ? 'text-stone-300 hover:text-white'
                                : 'text-[#5A5D63] hover:text-[#111214]'
                            }`}
                          >
                            <Brain className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {msg.savedMemories?.length && msg.forgotMemories?.length
                                ? isArabic
                                  ? 'تم تحديث الذاكرة الدائمة'
                                  : 'Updated saved memory'
                                : msg.savedMemories?.length
                                ? isArabic
                                  ? 'تم الحفظ في الذاكرة الدائمة'
                                  : 'Saved to memory'
                                : isArabic
                                ? 'تم الحذف من الذاكرة الدائمة'
                                : 'Removed from memory'}
                            </span>
                          </button>
                        )}
                        {msg.attachedImage && (
                          <div className="mb-3 overflow-hidden rounded-2xl max-w-sm border border-black/10 dark:border-white/[0.1]">
                            <img
                              src={msg.attachedImage}
                              alt={isArabic ? 'صورة مُنشأة' : 'Generated image'}
                              className="w-full h-auto object-contain max-h-80"
                            />
                          </div>
                        )}
                        {/* Borderless Editorial Assistant Response */}
                        <NoorMarkdown
                          text={displayText}
                          message={msg}
                          isArabic={isArabic}
                          isDark={isDark}
                          isStreaming={isStreamingThis}
                        />

                        {/* Action Bar under completed response: Copy, Share, Listen, More */}
                        {!isStreamingThis && (
                          <div
                            dir="ltr"
                            className={`relative mt-2.5 flex items-center gap-0.5 select-none ${
                              isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                            }`}
                          >
                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                isDark
                                  ? 'hover:bg-white/[0.06] hover:text-white'
                                  : 'hover:bg-black/[0.05] hover:text-[#111214]'
                              }`}
                              aria-label={isArabic ? 'نسخ' : 'Copy'}
                              title={isArabic ? 'نسخ الإجابة' : 'Copy'}
                            >
                              {copiedId === msg.id ? (
                                <Check
                                  className={`w-4 h-4 ${
                                    isDark ? 'text-white' : 'text-[#111214]'
                                  }`}
                                />
                              ) : (
                                <Copy className="w-4 h-4 stroke-[1.75]" />
                              )}
                            </button>

                            {/* Share */}
                            <button
                              type="button"
                              onClick={() => handleShareMessage(msg)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                isDark
                                  ? 'hover:bg-white/[0.06] hover:text-white'
                                  : 'hover:bg-black/[0.05] hover:text-[#111214]'
                              }`}
                              aria-label={isArabic ? 'مشاركة' : 'Share'}
                              title={isArabic ? 'مشاركة الإجابة' : 'Share'}
                            >
                              <Share className="w-4 h-4 stroke-[1.75]" />
                            </button>

                            {/* Listen (Read Aloud) */}
                            <button
                              type="button"
                              onClick={() => handleToggleTTS(msg)}
                              disabled={isTtsLoadingId === msg.id}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                playingTtsId === msg.id
                                  ? isDark
                                    ? 'text-white bg-white/[0.1]'
                                    : 'text-[#111214] bg-black/[0.08]'
                                  : isDark
                                  ? 'hover:bg-white/[0.06] hover:text-white'
                                  : 'hover:bg-black/[0.05] hover:text-[#111214]'
                              }`}
                              aria-label={
                                playingTtsId === msg.id
                                  ? isArabic
                                    ? 'إيقاف الاستماع'
                                    : 'Stop listening'
                                  : isArabic
                                  ? 'استماع'
                                  : 'Listen'
                              }
                              title={
                                playingTtsId === msg.id
                                  ? isArabic
                                    ? 'إيقاف الصوت'
                                    : 'Stop audio'
                                  : isArabic
                                  ? 'الاستماع للإجابة'
                                  : 'Listen'
                              }
                            >
                              {isTtsLoadingId === msg.id ? (
                                <div
                                  className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                                    isDark ? 'border-white' : 'border-[#111214]'
                                  }`}
                                />
                              ) : playingTtsId === msg.id ? (
                                <VolumeX
                                  className={`w-4 h-4 ${
                                    isDark ? 'text-white' : 'text-[#111214]'
                                  }`}
                                />
                              ) : (
                                <Volume2 className="w-4 h-4 stroke-[1.75]" />
                              )}
                            </button>

                            {/* More Options (⋯) */}
                            <div className="relative" data-noor-popover="true">
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (isMoreOpen) {
                                    setOpenMoreMenuId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setMoreMenuDir(rect.top < 250 ? 'down' : 'up');
                                    setOpenMoreMenuId(msg.id);
                                  }
                                }}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  isMoreOpen
                                    ? isDark
                                      ? 'bg-white/[0.1] text-white'
                                      : 'bg-black/[0.06] text-[#111214]'
                                    : isDark
                                    ? 'hover:bg-white/[0.06] hover:text-white'
                                    : 'hover:bg-black/[0.05] hover:text-[#111214]'
                                }`}
                                aria-label={isArabic ? 'المزيد من الخيارات' : 'More options'}
                                title={isArabic ? 'المزيد' : 'More options'}
                              >
                                <MoreHorizontal className="w-4 h-4 stroke-[1.75]" />
                              </button>

                              <AnimatePresence>
                                {isMoreOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: moreMenuDir === 'up' ? 4 : -4, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: moreMenuDir === 'up' ? 4 : -4, scale: 0.96 }}
                                    transition={{ duration: 0.14 }}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                    className={`absolute left-0 z-40 w-48 max-w-[calc(100vw-2rem)] rounded-2xl border p-1.5 text-[13px] ${
                                      moreMenuDir === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                                    } ${
                                      isDark
                                        ? 'bg-[#14161A] border-white/[0.12] text-[#F3F4F6] shadow-[0_12px_36px_rgba(0,0,0,0.65)]'
                                        : 'bg-white border-black/[0.1] text-[#111214] shadow-[0_8px_28px_rgba(0,0,0,0.09)]'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleRegenerateMessage(msg.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-start cursor-pointer ${
                                        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                                      }`}
                                    >
                                      <RotateCcw
                                        className={`w-4 h-4 ${
                                          isDark ? 'text-stone-300' : 'text-[#5A5D63]'
                                        }`}
                                      />
                                      <span>
                                        {isArabic ? 'إعادة توليد الإجابة' : 'Regenerate response'}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleSave(msg)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-start cursor-pointer ${
                                        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                                      }`}
                                    >
                                      {isSaved ? (
                                        <BookmarkCheck
                                          className={`w-4 h-4 ${
                                            isDark ? 'text-white' : 'text-[#111214]'
                                          }`}
                                        />
                                      ) : (
                                        <Bookmark
                                          className={`w-4 h-4 ${
                                            isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                                          }`}
                                        />
                                      )}
                                      <span>
                                        {isSaved
                                          ? isArabic
                                            ? 'إزالة من المحفوظات'
                                            : 'Remove bookmark'
                                          : isArabic
                                          ? 'حفظ الفائدة'
                                          : 'Save insight'}
                                      </span>
                                    </button>

                                    <div
                                      className={`my-1 border-t ${
                                        isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'
                                      }`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleFeedback(msg.id, 'helpful')}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-start cursor-pointer ${
                                        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                                      } ${
                                        msg.feedback === 'helpful'
                                          ? isDark
                                            ? 'text-white font-semibold'
                                            : 'text-[#111214] font-semibold'
                                          : ''
                                      }`}
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                      <span>{isArabic ? 'إجابة نافعة' : 'Helpful'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleFeedback(msg.id, 'unhelpful')}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-start cursor-pointer ${
                                        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                                      } ${msg.feedback === 'unhelpful' ? 'font-medium' : ''}`}
                                    >
                                      <ThumbsDown className="w-4 h-4" />
                                      <span>{isArabic ? 'غير دقيقة' : 'Not helpful'}</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Minimal Editorial Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2.5 py-2 animate-fadeIn">
                  <span
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      isDark ? 'bg-white' : 'bg-[#111214]'
                    }`}
                  />
                  <span
                    className={`text-[14px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}
                  >
                    {isArabic ? 'نفيس نور يكتب...' : 'Nafis Noor is thinking...'}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="h-2 shrink-0" />
        </div>
      </div>

      {/* Floating Bottom Message Composer */}
      <div
        className={`shrink-0 z-20 bg-gradient-to-t to-transparent pt-2 pb-[max(12px,env(safe-area-inset-bottom))] px-3 sm:px-6 lg:px-8 ${
          isDark
            ? 'from-[#0B0C0E] via-[#0B0C0E]/96'
            : 'from-[#FCFCFA] via-[#FCFCFA]/96'
        }`}
      >
        <div className="max-w-3xl mx-auto relative">
          {/* Centered Scroll-to-bottom helper anchored relative to chat column & composer */}
          <AnimatePresence>
            {showScrollBottom && activeMessages.length > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                onClick={() => scrollToBottom('smooth')}
                className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.12] text-[#F3F4F6] hover:bg-[#1B1D23] shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
                    : 'bg-white border-black/[0.1] text-[#111214] hover:bg-[#F5F5F2] shadow-[0_2px_10px_rgba(0,0,0,0.08)]'
                }`}
                aria-label={isArabic ? 'النزول لآخر رسالة' : 'Scroll to bottom'}
              >
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Plus Button Action Menu */}
          <AnimatePresence>
            {showPlusMenu && (
              <motion.div
                data-noor-popover="true"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`absolute bottom-full mb-2.5 left-0 z-30 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border p-1.5 text-[13.5px] ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.12] text-[#F3F4F6] shadow-[0_12px_36px_rgba(0,0,0,0.65)]'
                    : 'bg-white border-black/[0.09] text-[#111214] shadow-[0_10px_32px_rgba(0,0,0,0.09)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setShowImageStudioModal(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-start cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <ImageIcon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>{isArabic ? 'إنشاء صورة (الاستوديو)' : 'Create Image (Studio)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setDrawerTab('saved');
                    setShowHistoryDrawer(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-start cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}
                  />
                  <span>
                    {isArabic
                      ? `الفوائد المحفوظة (${savedMessages.length})`
                      : `Saved insights (${savedMessages.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setDrawerTab('memory');
                    setShowHistoryDrawer(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-start cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <Brain
                    className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}
                  />
                  <span>
                    {isArabic
                      ? `الذاكرة الدائمة (${savedMemoriesList.length})`
                      : `Saved memory (${savedMemoriesList.length})`}
                  </span>
                </button>

                <div
                  className={`my-1 border-t ${
                    isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setShowSettingsModal(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-start cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}
                  />
                  <span>{isArabic ? 'إعدادات نور والخصوصية' : 'Noor AI settings'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rounded Capsule Input / Seamless 3-Pill Voice Recorder */}
          <AnimatePresence mode="wait" initial={false}>
            {voiceRecorderState === 'idle' || voiceRecorderState === 'sent' ? (
              <motion.form
                key="idle-composer"
                dir="ltr"
                initial={{ opacity: 0, scale: 0.985, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: 4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className={`flex flex-col gap-2 rounded-[26px] border p-2 sm:px-3 sm:py-2 transition-colors ${
                  isDark
                    ? 'bg-[#14161A] shadow-[0_8px_28px_rgba(0,0,0,0.5)] border-white/[0.1] focus-within:border-white/[0.26]'
                    : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-black/[0.11] focus-within:border-black/[0.28]'
                }`}
              >
                {/* Pending Image Preview Pill */}
                {pendingImage && (
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/10 dark:bg-white/10 w-fit">
                    <img src={pendingImage.previewUrl} alt="Pending" className="w-12 h-12 rounded-xl object-cover" />
                    <span className="text-xs font-medium truncate max-w-[140px]">
                      {isArabic ? 'صورة مرفقة' : 'Attached image'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="p-1 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-1.5 sm:gap-2 w-full">
                  {/* Plus Button (Left) */}
                  <button
                    type="button"
                    data-noor-popover="true"
                    onClick={() => setShowPlusMenu((prev) => !prev)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95 cursor-pointer ${
                      showPlusMenu
                        ? isDark
                          ? 'bg-white text-[#111214]'
                          : 'bg-[#111214] text-white'
                        : isDark
                        ? 'bg-white/[0.07] hover:bg-white/[0.12] text-[#F3F4F6]'
                        : 'bg-[#F3F3F1] hover:bg-[#EAEAE6] text-[#111214]'
                    }`}
                    aria-label={isArabic ? 'خيارات إضافية' : 'More options'}
                    title={isArabic ? 'خيارات إضافية' : 'More options'}
                  >
                    <Plus
                      className={`w-[18px] h-[18px] transition-transform duration-150 ${
                        showPlusMenu ? 'rotate-45' : ''
                      }`}
                    />
                  </button>

                  {/* Hidden File Input for Image Attachment */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        showToast(isArabic ? 'يرجى اختيار ملف صورة صالحة' : 'Please select a valid image file');
                        return;
                      }
                      try {
                        const compressed = await compressImageForAnalysis(file);
                        setPendingImage(compressed);
                      } catch {
                        showToast(isArabic ? 'تعذر تجهيز الصورة' : 'Unable to prepare image');
                      }
                    }}
                  />

                  {/* Image Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95 cursor-pointer disabled:opacity-40 ${
                      isDark
                        ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                        : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.04]'
                    }`}
                    aria-label={isArabic ? 'إرفاق صورة للتحليل' : 'Attach image for analysis'}
                    title={isArabic ? 'إرفاق صورة' : 'Attach image'}
                  >
                    <ImageIcon className="w-[18px] h-[18px] stroke-[1.85]" />
                  </button>

                  {/* Textarea Input */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    dir="auto"
                    value={inputQuery}
                    disabled={isLoading}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      pendingImage
                        ? isArabic
                          ? 'أضف تعليقاً على الصورة...'
                          : 'Add a comment about the image...'
                        : isArabic
                        ? 'اسأل نفيس نور'
                        : 'Ask Nafis Noor'
                    }
                    className={`flex-1 min-w-0 min-h-[36px] max-h-36 py-[7px] px-1.5 bg-transparent text-[15.5px] leading-[22px] resize-none focus:outline-none disabled:opacity-60 ${
                      isDark
                        ? 'text-[#F3F4F6] placeholder:text-stone-500'
                        : 'text-[#111214] placeholder:text-[#8A8E96]'
                    }`}
                  />

                  {/* Right Controls: Microphone (Activates Voice Recorder) + Send (when typing or image attached) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenVoiceRecorder}
                      disabled={isLoading}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer disabled:opacity-40 ${
                        isDark
                          ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                          : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.04]'
                      }`}
                      aria-label={isArabic ? 'تسجيل رسالة صوتية' : 'Record voice message'}
                      title={isArabic ? 'تسجيل رسالة صوتية' : 'Record voice message'}
                    >
                      <Mic className="w-[18px] h-[18px] stroke-[1.85]" />
                    </button>

                    {(hasTypedText || pendingImage) ? (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-9 h-9 rounded-full disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                          isDark
                            ? 'bg-white hover:bg-stone-200 text-[#111214]'
                            : 'bg-[#111214] hover:bg-[#27292D] text-white'
                        }`}
                        aria-label={isArabic ? 'إرسال' : 'Send message'}
                        title={isArabic ? 'إرسال' : 'Send'}
                      >
                        <ArrowUp className="w-[18px] h-[18px] stroke-[2.2]" />
                      </button>
                    ) : (
                      <button
                        id="open-live-voice-btn"
                        type="button"
                        onClick={() => {
                          if (ttsStopFnRef.current) {
                            ttsStopFnRef.current();
                            ttsStopFnRef.current = null;
                          }
                          TTSPlayer.stop();
                          stopAllVoicePlayback();
                          setPlayingTtsId(null);
                          setShowPlusMenu(false);
                          setShowLiveVoiceModal(true);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                          isDark
                            ? 'bg-white hover:bg-stone-200 text-[#111214]'
                            : 'bg-[#111214] hover:bg-[#27292D] text-white'
                        }`}
                        aria-label={isArabic ? 'محادثة صوتية مباشرة' : 'Live Voice Talk'}
                        title={isArabic ? 'محادثة صوتية مباشرة' : 'Live Voice Talk'}
                      >
                        <AudioLines className="w-[17px] h-[17px]" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.form>
            ) : (
              <NoorVoiceRecorder
                key="voice-recorder-composer"
                state={voiceRecorderState}
                onStateChange={setVoiceRecorderState}
                onSendVoice={handleSendVoiceMessage}
                onCancel={() => setVoiceRecorderState('idle')}
                onPermissionError={(msg) => showToast(msg)}
                isDark={isDark}
                isArabic={isArabic}
              />
            )}
          </AnimatePresence>

          <p
            className={`text-[11px] text-center mt-2 leading-tight ${
              isDark ? 'text-stone-500' : 'text-[#787C84]'
            }`}
          >
            {isArabic
              ? 'نفيس نور للاستئناس والتعلّم؛ يُرجى مراجعة أهل العلم في الفتاوى الخاصة.'
              : 'Nafis Noor assists learning and reflection. Verify personal rulings with a trusted scholar.'}
          </p>
        </div>
      </div>

      {/* Left Slide-Out Conversation History Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <motion.div
            key="history-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-50 flex justify-start backdrop-blur-[2px] ${
              isDark ? 'bg-black/65' : 'bg-black/35'
            }`}
            onClick={() => setShowHistoryDrawer(false)}
          >
            <motion.aside
              key="history-drawer-panel"
              initial={{ x: '-100%' }}
              animate={{
                x: 0,
                transition: { type: 'spring', damping: 32, stiffness: 360 },
              }}
              exit={{
                x: '-100%',
                transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
              }}
              dir={isArabic ? 'rtl' : 'ltr'}
              className={`w-[86vw] max-w-[330px] h-full border-r shadow-xl flex flex-col pt-[max(14px,env(safe-area-inset-top))] pb-[max(14px,env(safe-area-inset-bottom))] px-4 ${
                isDark
                  ? 'bg-[#0B0C0E] text-[#F3F4F6] border-white/[0.1]'
                  : 'bg-[#FCFCFA] text-[#111214] border-black/[0.08]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <NoorAIIcon
                    className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`}
                  />
                  <span className="font-semibold text-[15px] tracking-tight">
                    {isArabic ? 'نفيس نور' : 'Nafis Noor'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark
                      ? 'hover:bg-white/[0.06] text-stone-400 hover:text-white'
                      : 'hover:bg-black/[0.05] text-[#5A5D63] hover:text-[#111214]'
                  }`}
                  aria-label="Close"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Search + New Chat */}
              <div
                className={`space-y-2.5 pb-3 border-b ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'
                }`}
              >
                <div className="relative">
                  <Search
                    className={`w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDark ? 'text-stone-500' : 'text-[#8A8E96]'
                    }`}
                  />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder={isArabic ? 'ابحث في المحادثات...' : 'Search conversations...'}
                    className={`w-full ps-9 pe-3 py-2 rounded-xl border text-[13.5px] focus:outline-none ${
                      isDark
                        ? 'bg-[#14161A] border-white/[0.09] text-[#F3F4F6] placeholder:text-stone-500 focus:border-white/30'
                        : 'bg-white border-black/[0.08] text-[#111214] placeholder:text-[#8A8E96] focus:border-black/35'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNewChat}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-[13.5px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214] font-semibold'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  <SquarePen className="w-4 h-4" />
                  <span>{isArabic ? 'محادثة جديدة' : 'New Conversation'}</span>
                </button>

                {/* Tab Switcher: Chats vs Saved Insights vs Memory */}
                <div
                  className={`grid grid-cols-3 gap-1 p-1 rounded-xl text-[12px] font-medium ${
                    isDark ? 'bg-[#14161A]' : 'bg-[#EFEFEB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDrawerTab('chats')}
                    className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                      drawerTab === 'chats'
                        ? isDark
                          ? 'bg-[#1B1D23] text-white'
                          : 'bg-white text-[#111214] shadow-2xs'
                        : isDark
                        ? 'text-stone-400 hover:text-stone-200'
                        : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic ? 'المحادثات' : 'Chats'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('saved')}
                    className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                      drawerTab === 'saved'
                        ? isDark
                          ? 'bg-[#1B1D23] text-white'
                          : 'bg-white text-[#111214] shadow-2xs'
                        : isDark
                        ? 'text-stone-400 hover:text-stone-200'
                        : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic
                      ? `المحفوظات (${savedMessages.length})`
                      : `Saved (${savedMessages.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('memory')}
                    className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                      drawerTab === 'memory'
                        ? isDark
                          ? 'bg-[#1B1D23] text-white'
                          : 'bg-white text-[#111214] shadow-2xs'
                        : isDark
                        ? 'text-stone-400 hover:text-stone-200'
                        : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {isArabic
                      ? `الذاكرة (${savedMemoriesList.length})`
                      : `Memory (${savedMemoriesList.length})`}
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto py-3 space-y-1 no-scrollbar">
                {drawerTab === 'chats' ? (
                  filteredSessions.length === 0 ? (
                    <div
                      className={`py-12 text-center text-[13px] ${
                        isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                      }`}
                    >
                      {historySearch
                        ? isArabic
                          ? 'لا توجد نتائج مطابقة.'
                          : 'No matching conversations.'
                        : isArabic
                        ? 'لا توجد محادثات محفوظة بعد.'
                        : 'No conversations yet.'}
                    </div>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isActive = sess.id === activeSessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => handleSwitchSession(sess.id)}
                          className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isActive
                              ? isDark
                                ? 'bg-white/[0.1] text-white border border-white/[0.16] font-medium'
                                : 'bg-[#EFEFEB] text-[#111214] font-medium'
                              : isDark
                              ? 'hover:bg-white/[0.04] text-stone-200'
                              : 'hover:bg-black/[0.035] text-[#2A2C30]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MessageSquare
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? isDark
                                    ? 'text-white'
                                    : 'text-[#111214]'
                                  : isDark
                                  ? 'text-stone-500'
                                  : 'text-[#8A8E96]'
                              }`}
                            />
                            <div className="min-w-0">
                              <p dir="auto" className="text-[13.5px] truncate">
                                {sess.title}
                              </p>
                              <p
                                className={`text-[11px] ${
                                  isDark ? 'text-stone-400' : 'text-[#787C84]'
                                }`}
                              >
                                {isArabic
                                  ? `${sess.messages.length} رسالة`
                                  : `${sess.messages.length} ${
                                      sess.messages.length === 1 ? 'message' : 'messages'
                                    }`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer ${
                              isDark
                                ? 'text-stone-500 hover:text-red-400 hover:bg-red-500/15'
                                : 'text-[#8A8E96] hover:text-red-600 hover:bg-red-50'
                            }`}
                            aria-label={isArabic ? 'حذف المحادثة' : 'Delete conversation'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )
                ) : drawerTab === 'memory' ? (
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-xl border space-y-2.5 ${
                        isDark
                          ? 'bg-[#14161A] border-white/[0.08]'
                          : 'bg-white border-black/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold">
                            {isArabic ? 'تفعيل الذاكرة الدائمة' : 'Reference saved memories'}
                          </p>
                          <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                            {isArabic
                              ? 'تذكّر تفضيلاتك عبر كل المحادثات الجديدة'
                              : 'Nafis Noor remembers facts & history across new chats'}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={memoryEnabled}
                          onClick={handleToggleMemoryEnabled}
                          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                            memoryEnabled
                              ? isDark
                                ? 'bg-white'
                                : 'bg-[#111214]'
                              : isDark
                              ? 'bg-white/15'
                              : 'bg-black/15'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                              memoryEnabled
                                ? isArabic
                                  ? 'left-1 ' + (isDark ? 'bg-[#111214]' : 'bg-white')
                                  : 'right-1 ' + (isDark ? 'bg-[#111214]' : 'bg-white')
                                : isArabic
                                ? 'right-1 bg-white'
                                : 'left-1 bg-white'
                            }`}
                          />
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddManualMemory();
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          dir="auto"
                          value={manualMemoryInput}
                          onChange={(e) => setManualMemoryInput(e.target.value)}
                          placeholder={isArabic ? 'أضف معلومة ليتذكرها...' : 'Add something to remember...'}
                          className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-[12px] focus:outline-none ${
                            isDark
                              ? 'bg-[#0B0C0E] border-white/[0.08] text-[#F3F4F6] placeholder:text-stone-500 focus:border-white/30'
                              : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214] placeholder:text-[#8A8E96] focus:border-black/30'
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={!manualMemoryInput.trim()}
                          className={`h-8 px-2.5 rounded-lg text-[12px] font-medium shrink-0 disabled:opacity-40 cursor-pointer ${
                            isDark
                              ? 'bg-white text-[#111214] font-semibold'
                              : 'bg-[#111214] text-white'
                          }`}
                        >
                          {isArabic ? 'حفظ' : 'Save'}
                        </button>
                      </form>
                    </div>

                    {savedMemoriesList.length === 0 ? (
                      <div
                        className={`py-8 text-center text-[12.5px] leading-relaxed px-2 ${
                          isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                        }`}
                      >
                        {isArabic
                          ? 'لا توجد ذكريات محفوظة بعد. شارك تفضيلاتك أو قل «تذكّر أن...» وسيحفظها نفيس نور تلقائياً.'
                          : 'No saved memories yet. Tell Nafis Noor your preferences or say "remember that..." and it will remember across all chats.'}
                      </div>
                    ) : (
                      savedMemoriesList.map((mem) => (
                        <div
                          key={mem.id}
                          className={`group flex items-start justify-between gap-2 p-2.5 rounded-xl border ${
                            isDark
                              ? 'bg-[#14161A] border-white/[0.08]'
                              : 'bg-white border-black/[0.08]'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p dir="auto" className="text-[12.5px] leading-snug">
                              {mem.content}
                            </p>
                            <p className={`text-[10.5px] ${isDark ? 'text-stone-500' : 'text-[#8A8E96]'}`}>
                              {new Date(mem.updatedAt || mem.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className={`p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                              isDark
                                ? 'text-stone-500 hover:text-red-400 hover:bg-red-500/15'
                                : 'text-[#8A8E96] hover:text-red-600 hover:bg-red-50'
                            }`}
                            aria-label={isArabic ? 'حذف من الذاكرة' : 'Delete memory'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : savedMessages.length === 0 ? (
                  <div
                    className={`py-12 text-center text-[13px] ${
                      isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                    }`}
                  >
                    {isArabic
                      ? 'لم تحفظ أي فوائد بعد. يمكنك الحفظ من خيارات أي إجابة.'
                      : 'No saved insights yet. Bookmark any response from More options.'}
                  </div>
                ) : (
                  savedMessages.map((saved) => (
                    <div
                      key={saved.id}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isDark
                          ? 'bg-[#14161A] border-white/[0.08]'
                          : 'bg-white border-black/[0.08]'
                      }`}
                    >
                      <p
                        dir="auto"
                        className={`text-[13px] leading-relaxed line-clamp-4 ${
                          isDark ? 'text-stone-200' : 'text-[#111214]'
                        }`}
                      >
                        {saved.text}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-2 pt-1 border-t ${
                          isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(saved)}
                          className={`text-[11.5px] font-medium flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                            isDark
                              ? 'text-stone-400 hover:text-white'
                              : 'text-[#5A5D63] hover:text-[#111214]'
                          }`}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSave(saved)}
                          className={`text-[11.5px] font-medium flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                            isDark
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isArabic ? 'إزالة' : 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer: Settings Trigger */}
              <div
                className={`pt-3 border-t ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'
                }`}
              >
                <button
                  id="noor-ai-settings-btn"
                  type="button"
                  onClick={() => {
                    setShowHistoryDrawer(false);
                    setShowSettingsModal(true);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Settings
                      className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}
                    />
                    <span>{isArabic ? 'إعدادات نور والذاكرة' : 'Memory & Settings'}</span>
                  </span>
                  <span className={`text-[11.5px] ${isDark ? 'text-stone-400' : 'text-[#787C84]'}`}>
                    {activeVoiceName}
                  </span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Noor AI Settings Modal (Privacy, AI Voice, Conversation Management) */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            key="noor-ai-settings-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] overflow-y-auto ${
              isDark ? 'bg-black/75' : 'bg-black/40'
            }`}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              key="noor-ai-settings-modal-card"
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              dir={isArabic ? 'rtl' : 'ltr'}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-6 my-auto ${
                isDark
                  ? 'bg-[#0B0C0E] text-[#F3F4F6] border-white/[0.1]'
                  : 'bg-[#FCFCFA] text-[#111214] border-black/[0.09]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b mb-4 ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDark
                        ? 'bg-white/[0.08] text-white'
                        : 'bg-black/[0.06] text-[#111214]'
                    }`}
                  >
                    <Settings className="w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[16px]">
                      {isArabic ? 'إعدادات نفيس نور' : 'Noor AI Settings'}
                    </h3>
                    <p className={`text-[12px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {isArabic
                        ? 'تفضيلات الصوت، الخصوصية، وإدارة المحادثات'
                        : 'Voice preferences, privacy & conversation controls'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark
                      ? 'hover:bg-white/[0.07] text-stone-400'
                      : 'hover:bg-black/[0.05] text-[#5A5D63]'
                  }`}
                  aria-label="Close"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              <div className="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
                {/* Privacy */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08]'
                      : 'bg-white border-black/[0.08]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 font-semibold text-[13.5px] mb-1.5 ${
                      isDark ? 'text-white' : 'text-[#111214]'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isArabic ? 'الخصوصية وأمان المحادثات' : 'Privacy & Data Transparency'}
                    </span>
                  </div>
                  <p
                    className={`text-[12.5px] leading-relaxed mb-2.5 ${
                      isDark ? 'text-stone-300' : 'text-[#4E5259]'
                    }`}
                  >
                    {isArabic
                      ? 'محادثاتك محفوظة لخصوصيتك فقط ولا تُباع أو تُستخدم لأغراض إعلانية، مع إمكانية حذف أي محادثة في أي وقت.'
                      : 'Your conversations remain private to your account, are never sold for advertising, and are grounded in authentic Islamic sources.'}
                  </p>
                  <div
                    className={`space-y-1 text-[12px] ${
                      isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDark ? 'text-white' : 'text-[#111214]'
                        }`}
                      />
                      <span>
                        {isArabic
                          ? 'مرتبطة بأمان بحسابك الشخصي'
                          : 'Securely scoped to your personal account'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDark ? 'text-white' : 'text-[#111214]'
                        }`}
                      />
                      <span>
                        {isArabic
                          ? 'حرية كاملة في مسح السجل متى شئت'
                          : 'Delete any conversation record at any time'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Voice */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08]'
                      : 'bg-white border-black/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-[13.5px] mb-1">
                    <Volume2
                      className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`}
                    />
                    <span>
                      {isArabic ? 'نبرة الصوت (الاستماع والمباشر)' : 'AI Voice Tone'}
                    </span>
                  </div>
                  <p className={`text-[12px] mb-3 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic
                      ? 'اختر الصوت المستخدم عند الاستماع للإجابات والمحادثة الصوتية'
                      : 'Used for Read Aloud and Live Voice Talk'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Zephyr', name: isArabic ? 'زفير (هادئ)' : 'Zephyr · Serene' },
                      { id: 'Puck', name: isArabic ? 'باك (واضح)' : 'Puck · Crisp' },
                      { id: 'Fenrir', name: isArabic ? 'فينرير (عميق)' : 'Fenrir · Deep' },
                      { id: 'Aoede', name: isArabic ? 'أويدي (دافئ)' : 'Aoede · Warm' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setActiveVoiceName(v.id);
                          showToast(
                            isArabic ? `تم اختيار صوت ${v.id}` : `Selected ${v.id} voice`
                          );
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-start text-[12.5px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          activeVoiceName === v.id
                            ? isDark
                              ? 'bg-white/[0.1] border-white/[0.25] text-white'
                              : 'bg-black/[0.06] border-black/40 text-[#111214]'
                            : isDark
                            ? 'bg-[#0B0C0E] border-white/[0.08] text-stone-300 hover:border-white/20'
                            : 'bg-[#FCFCFA] border-black/[0.08] text-[#2A2C30] hover:border-black/[0.2]'
                        }`}
                      >
                        <span className="truncate">{v.name}</span>
                        {activeVoiceName === v.id && (
                          <Check
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isDark ? 'text-white' : 'text-[#111214]'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Long-Term Memory Manager */}
                <div
                  ref={memorySettingsRef}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08]'
                      : 'bg-white border-black/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-[13.5px]">
                        <Brain
                          className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111214]'}`}
                        />
                        <span>{isArabic ? 'الذاكرة الدائمة (لا ينسى)' : 'Saved Memory'}</span>
                      </div>
                      <p className={`text-[12px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                        {isArabic
                          ? 'يتذكر نفيس نور تفضيلاتك وسجل محادثاتك عبر كل المحادثات الجديدة إلا إذا حذفتها.'
                          : 'Nafis Noor remembers facts & non-deleted chats across new conversations unless deleted.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={memoryEnabled}
                      onClick={handleToggleMemoryEnabled}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                        memoryEnabled
                          ? isDark
                            ? 'bg-white'
                            : 'bg-[#111214]'
                          : isDark
                          ? 'bg-white/15'
                          : 'bg-black/15'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                          memoryEnabled
                            ? isArabic
                              ? 'left-1 ' + (isDark ? 'bg-[#111214]' : 'bg-white')
                              : 'right-1 ' + (isDark ? 'bg-[#111214]' : 'bg-white')
                            : isArabic
                            ? 'right-1 bg-white'
                            : 'left-1 bg-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Manual Add Memory Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddManualMemory();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      dir="auto"
                      value={manualMemoryInput}
                      onChange={(e) => setManualMemoryInput(e.target.value)}
                      placeholder={
                        isArabic
                          ? 'أضف معلومة أو تفضيلاً ليتذكره دائماً...'
                          : 'Add something for Nafis Noor to remember...'
                      }
                      className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-[12.5px] focus:outline-none ${
                        isDark
                          ? 'bg-[#0B0C0E] border-white/[0.08] text-[#F3F4F6] placeholder:text-stone-500 focus:border-white/30'
                          : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214] placeholder:text-[#8A8E96] focus:border-black/30'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!manualMemoryInput.trim()}
                      className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium shrink-0 disabled:opacity-40 cursor-pointer ${
                        isDark
                          ? 'bg-white text-[#111214] font-semibold'
                          : 'bg-[#111214] text-white'
                      }`}
                    >
                      {isArabic ? 'حفظ' : 'Add'}
                    </button>
                  </form>

                  {/* Saved Memory List */}
                  {savedMemoriesList.length > 0 ? (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 no-scrollbar">
                      {savedMemoriesList.map((mem) => (
                        <div
                          key={mem.id}
                          className={`flex items-start justify-between gap-2 px-3 py-2 rounded-xl border text-[12.5px] ${
                            isDark
                              ? 'bg-[#0B0C0E] border-white/[0.07] text-stone-200'
                              : 'bg-[#FCFCFA] border-black/[0.07] text-[#111214]'
                          }`}
                        >
                          <span dir="auto" className="leading-snug flex-1 min-w-0">
                            {mem.content}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className={`p-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                              isDark
                                ? 'text-stone-500 hover:text-red-400 hover:bg-red-500/15'
                                : 'text-[#8A8E96] hover:text-red-600 hover:bg-red-50'
                            }`}
                            aria-label={isArabic ? 'حذف الذاكرة' : 'Delete memory'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-[12px] py-1 ${isDark ? 'text-stone-500' : 'text-[#8A8E96]'}`}>
                      {isArabic
                        ? 'لا توجد ذكريات محفوظة حالياً.'
                        : 'No saved memories yet.'}
                    </p>
                  )}

                  {savedMemoriesList.length > 0 && (
                    <div className="pt-1 flex justify-end">
                      {confirmClearAllMemories ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmClearAllMemories(false)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer ${
                              isDark ? 'bg-white/[0.08] text-stone-300' : 'bg-black/[0.06] text-[#2A2C30]'
                            }`}
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAllMemories}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium cursor-pointer"
                          >
                            {isArabic ? 'تأكيد مسح الذكريات' : 'Confirm Clear Memories'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmClearAllMemories(true)}
                          className={`text-[12px] font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? 'text-red-400 hover:bg-red-500/15'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'مسح جميع الذكريات' : 'Clear all memories'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Conversation Management */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08]'
                      : 'bg-white border-black/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-[13.5px] mb-1">
                    <Sparkles
                      className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`}
                    />
                    <span>{isArabic ? 'إدارة المحادثة' : 'Conversation Management'}</span>
                  </div>
                  <p className={`text-[12px] mb-3 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic
                      ? `المحادثة الحالية تحتوي على ${activeMessages.length} رسالة · إجمالي المحادثات المحفوظة: ${existingSessions.filter((s) => s.messages.length > 0).length}.`
                      : `Current conversation has ${activeMessages.length} messages · ${existingSessions.filter((s) => s.messages.length > 0).length} saved conversations.`}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      id="settings-clear-current-chat-btn"
                      type="button"
                      disabled={activeMessages.length === 0}
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowClearConfirmModal(true);
                      }}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl border text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                        isDark
                          ? 'bg-red-500/15 hover:bg-red-500/25 border-red-500/35 text-red-300'
                          : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {isArabic ? 'مسح المحادثة الحالية' : 'Clear Current Conversation'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setDrawerTab('chats');
                        setShowHistoryDrawer(true);
                      }}
                      className={`py-2.5 px-3.5 rounded-xl text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.07] hover:bg-white/[0.12] text-[#F3F4F6]'
                          : 'bg-[#F3F3F1] hover:bg-[#E8E8E4] text-[#111214]'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'عرض السجل' : 'View History'}</span>
                    </button>
                  </div>

                  {existingSessions.some((s) => s.messages.length > 0) && (
                    <div className="mt-2.5 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.07] flex justify-end">
                      {confirmClearAllHistory ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmClearAllHistory(false)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer ${
                              isDark ? 'bg-white/[0.08] text-stone-300' : 'bg-black/[0.06] text-[#2A2C30]'
                            }`}
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAllHistory}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium cursor-pointer"
                          >
                            {isArabic ? 'تأكيد مسح كل السجل' : 'Confirm Clear All History'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmClearAllHistory(true)}
                          className={`text-[12px] font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? 'text-red-400 hover:bg-red-500/15'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'مسح سجل جميع المحادثات' : 'Clear all conversation history'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`pt-4 mt-3 border-t flex justify-end ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-5 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214] font-semibold'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  {isArabic ? 'تم' : 'Done'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Studio Modal */}
      <ImageStudioModal
        isOpen={showImageStudioModal}
        onClose={() => setShowImageStudioModal(false)}
        isDark={isDark}
        isArabic={isArabic}
        showToast={showToast}
        onInsertImageIntoChat={(imageUrl, imgPrompt) => {
          const cleanedMessages = activeMessages.filter((m) => !m.isError);
          const nowTs = Date.now();
          const userMsg: NoorAIMessage = {
            id: `user-${nowTs}`,
            sender: 'user',
            text: imgPrompt,
            timestamp: isArabic ? 'الآن' : 'Just now',
          };
          const noorMsg: NoorAIMessage = {
            id: `noor-${nowTs + 1}`,
            sender: 'noor',
            attachedImage: imageUrl,
            text: isArabic
              ? `تم إنشاء الصورة بناءً على وصفك: **"${imgPrompt}"**`
              : `Here is your generated image for: **"${imgPrompt}"**`,
            timestamp: isArabic ? 'الآن' : 'Just now',
          };
          userScrolledUpRef.current = false;
          persistSessionMessages(activeSessionId, [...cleanedMessages, userMsg, noorMsg], imgPrompt.slice(0, 42));
        }}
      />

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <motion.div
            key="clear-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] ${
              isDark ? 'bg-black/75' : 'bg-black/40'
            }`}
            onClick={() => setShowClearConfirmModal(false)}
          >
            <motion.div
              key="clear-modal-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.16 }}
              dir={isArabic ? 'rtl' : 'ltr'}
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDark
                  ? 'bg-[#14161A] text-[#F3F4F6] border-white/[0.1]'
                  : 'bg-[#FCFCFA] text-[#111214] border-black/[0.09]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center mx-auto mb-3.5 ${
                  isDark
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-center font-semibold text-[16px] mb-1.5">
                {isArabic ? 'مسح المحادثة الحالية؟' : 'Clear conversation?'}
              </h3>
              <p
                className={`text-center text-[13px] leading-relaxed mb-5 ${
                  isDark ? 'text-stone-400' : 'text-[#6B6F76]'
                }`}
              >
                {isArabic
                  ? 'سيتم مسح رسائل هذه المحادثة فقط مع بقاء بقية المحادثات في السجل.'
                  : 'This clears messages in the active conversation while keeping other chats in your history.'}
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-full border text-[13px] font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/15 hover:bg-white/[0.06]'
                      : 'border-black/[0.1] hover:bg-black/[0.04]'
                  }`}
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  id="confirm-delete-chat-btn"
                  type="button"
                  onClick={handleClearCurrentConversation}
                  className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  {isArabic ? 'مسح' : 'Clear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini Live Voice Real-Time Talk Modal */}
      <LiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        isDark={isDark}
        initialVoice={activeVoiceName}
        memoryContext={liveVoiceMemoryContext}
        onSaveToChat={handleLiveSessionTranscripts}
      />
    </div>
  );
};
