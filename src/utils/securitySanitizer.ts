import DOMPurify from 'dompurify';
import { NoorAIMessage, NoorAIConversationSession, NoorMemoryItem, UserStats } from '../types';

/**
 * Strips all HTML tags, script payloads, inline event handlers, and dangerous URI schemes
 * while preserving Arabic diacritics, Quranic symbols, and standard Unicode text.
 */
export function sanitizeUserText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  const stripped = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return stripped
    .replace(/\0/g, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes Markdown text before rendering to block injected <script>, <iframe>, or javascript: links
 */
export function sanitizeMarkdownContent(input: unknown, maxLength = 25000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|applet|meta|link|style|form|base)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .slice(0, maxLength);
}

/**
 * Validates that a URL is safe (https:, http:, mailto:, or relative path) and blocks javascript:/data: URIs
 */
export function sanitizeSafeUrl(url: unknown): string {
  if (typeof url !== 'string' || !url.trim()) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
  } catch {
    return '#';
  }
  return '#';
}

function sanitizeNoorMessage(msg: NoorAIMessage): NoorAIMessage {
  return {
    ...msg,
    id: sanitizeUserText(msg.id || `msg-${Date.now()}`, 128) || `msg-${Date.now()}`,
    sender: msg.sender === 'user' ? 'user' : 'noor',
    text: sanitizeMarkdownContent(msg.text, 12000),
    timestamp: sanitizeUserText(msg.timestamp || '', 64),
    savedMemories: Array.isArray(msg.savedMemories)
      ? msg.savedMemories.slice(0, 20).map((m) => sanitizeUserText(m, 300)).filter(Boolean)
      : undefined,
    forgotMemories: Array.isArray(msg.forgotMemories)
      ? msg.forgotMemories.slice(0, 20).map((m) => sanitizeUserText(m, 300)).filter(Boolean)
      : undefined,
  };
}

function sanitizeNoorMemoryItem(mem: NoorMemoryItem): NoorMemoryItem | null {
  const content = sanitizeUserText(mem?.content, 400);
  if (!content) return null;
  const validCategories = ['preference', 'personal', 'learning', 'goal', 'context'] as const;
  const category = validCategories.includes(mem?.category as any)
    ? (mem.category as NoorMemoryItem['category'])
    : 'context';
  return {
    id: sanitizeUserText(mem.id || `mem-${Date.now()}`, 128) || `mem-${Date.now()}`,
    content,
    category,
    createdAt: sanitizeUserText(mem.createdAt || new Date().toISOString(), 64) || new Date().toISOString(),
    updatedAt: sanitizeUserText(mem.updatedAt || new Date().toISOString(), 64) || new Date().toISOString(),
    sourceSessionId: mem.sourceSessionId ? sanitizeUserText(mem.sourceSessionId, 128) : undefined,
  };
}

/**
 * Enforces firebase-blueprint.json volumetric boundaries and XSS sanitization on UserStats
 * prior to saving to Firestore or localStorage.
 */
export function sanitizeUserStatsPayload(stats: UserStats): UserStats {
  return {
    ...stats,
    userName: sanitizeUserText(stats.userName || 'Servant of Allah', 100) || 'Servant of Allah',
    userLocation: sanitizeUserText(stats.userLocation || 'Makkah', 100) || 'Makkah',
    language: sanitizeUserText(stats.language || 'English', 40) || 'English',
    currentDhikrText: sanitizeUserText(stats.currentDhikrText || 'SubhanAllah', 200) || 'SubhanAllah',
    accountId: stats.accountId ? sanitizeUserText(stats.accountId, 128) : undefined,
    accountEmail: stats.accountEmail ? sanitizeUserText(stats.accountEmail, 254) : undefined,
    bookmarks: Array.isArray(stats.bookmarks) ? stats.bookmarks.slice(0, 500) : [],
    savedDuas: Array.isArray(stats.savedDuas)
      ? stats.savedDuas.slice(0, 500).map((id) => sanitizeUserText(id, 64))
      : [],
    completedLessonIds: Array.isArray(stats.completedLessonIds)
      ? stats.completedLessonIds.slice(0, 500).map((id) => sanitizeUserText(id, 64))
      : [],
    prayerHistory: Array.isArray(stats.prayerHistory) ? stats.prayerHistory.slice(-120) : [],
    activityHistory: Array.isArray(stats.activityHistory) ? stats.activityHistory.slice(-120) : [],
    noorAiConversation: Array.isArray(stats.noorAiConversation)
      ? stats.noorAiConversation.slice(-200).map(sanitizeNoorMessage)
      : [],
    noorAiSessions: Array.isArray(stats.noorAiSessions)
      ? stats.noorAiSessions.slice(0, 120).map((sess: NoorAIConversationSession) => ({
          id: sanitizeUserText(sess.id || `session-${Date.now()}`, 128) || `session-${Date.now()}`,
          title: sanitizeUserText(sess.title || 'New Conversation', 200) || 'New Conversation',
          createdAt: sanitizeUserText(sess.createdAt || new Date().toISOString(), 64) || new Date().toISOString(),
          updatedAt: sanitizeUserText(sess.updatedAt || new Date().toISOString(), 64) || new Date().toISOString(),
          messages: Array.isArray(sess.messages) ? sess.messages.slice(-200).map(sanitizeNoorMessage) : [],
        }))
      : [],
    activeNoorSessionId: stats.activeNoorSessionId
      ? sanitizeUserText(stats.activeNoorSessionId, 128)
      : undefined,
    savedNoorMessages: Array.isArray(stats.savedNoorMessages)
      ? stats.savedNoorMessages.slice(0, 200).map(sanitizeNoorMessage)
      : [],
    noorAiMemories: Array.isArray(stats.noorAiMemories)
      ? stats.noorAiMemories
          .slice(0, 200)
          .map(sanitizeNoorMemoryItem)
          .filter((item): item is NoorMemoryItem => item !== null)
      : [],
    noorAiMemoryEnabled: stats.noorAiMemoryEnabled !== false,
  };
}
