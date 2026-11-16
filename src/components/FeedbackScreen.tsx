import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquarePlus,
  Sparkles,
  Bug,
  BookOpen,
  Mic,
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Clock,
  Lock,
} from 'lucide-react';
import { UserStats } from '../types';
import { SupportedLanguageCode, isRTLLanguage } from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import {
  FeedbackCategory,
  FEEDBACK_CATEGORIES,
  FeedbackSubmission,
  getFeedbackTranslations,
  submitUserFeedback,
  fetchMyFeedbackSubmissions,
  validateFeedbackInput,
} from '../utils/feedbackService';

interface FeedbackScreenProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: SupportedLanguageCode;
  userStats: UserStats;
  onOpenAdminConsole?: () => void;
}

const CATEGORY_META: Record<
  FeedbackCategory,
  {
    icon: React.FC<{ className?: string }>;
    accentClass: string;
  }
> = {
  'General Feedback': {
    icon: MessageSquare,
    accentClass: 'dark:text-white text-[#111214]',
  },
  'Feature Request': {
    icon: Sparkles,
    accentClass: 'dark:text-stone-200 text-[#111214]',
  },
  'Bug Report': {
    icon: Bug,
    accentClass: 'dark:text-rose-400 text-rose-700',
  },
  'Quran Experience': {
    icon: BookOpen,
    accentClass: 'dark:text-emerald-400 text-emerald-700',
  },
  'Tasme3 Experience': {
    icon: Mic,
    accentClass: 'dark:text-sky-400 text-sky-700',
  },
  Other: {
    icon: HelpCircle,
    accentClass: 'dark:text-stone-300 text-[#5A5D63]',
  },
};

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
  userStats,
  onOpenAdminConsole,
}) => {
  useModalScrollLock(isOpen, 'feedback-submission-screen');

  const tr = getFeedbackTranslations(lang);
  const isRtl = isRTLLanguage(lang);
  const isArabic = lang === 'ar';

  const defaultEmail =
    userStats.accountEmail &&
    userStats.accountEmail.includes('@') &&
    !userStats.accountEmail.endsWith('@nafisnoor.local')
      ? userStats.accountEmail
      : '';

  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSubmission, setSavedSubmission] = useState<FeedbackSubmission | null>(null);
  const [founderNotified, setFounderNotified] = useState<boolean>(false);
  const [mySubmissions, setMySubmissions] = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    if (defaultEmail && !email) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchMyFeedbackSubmissions().then((items) => {
      if (active && items.length > 0) {
        setMySubmissions(items);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, savedSubmission]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateFeedbackInput({
      category,
      title,
      message,
      email,
    });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitUserFeedback({
        category,
        title,
        message,
        email,
        userName: userStats.userName || (userStats.isLoggedIn ? 'Registered User' : 'Guest User'),
      });

      setSavedSubmission(result.submission);
      setFounderNotified(result.founderNotified);
      setMySubmissions((prev) => {
        const filtered = prev.filter((item) => item.id !== result.submission.id);
        return [result.submission, ...filtered];
      });
      setTitle('');
      setMessage('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to save your feedback right now. Please verify your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSavedSubmission(null);
    setErrorMessage(null);
    setTitle('');
    setMessage('');
  };

  return (
    <div
      id="nafis-noor-feedback-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 overflow-y-auto transition-colors duration-300 ${
        isDark
          ? 'bg-[#0B0C0E]/95 text-[#F3F4F6]'
          : 'bg-[#FCFCFA]/95 text-[#111214]'
      } backdrop-blur-xl animate-fadeIn`}
    >
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            id="feedback-screen-back-btn"
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#14161A] border-white/[0.1] text-white hover:bg-[#1B1D23]'
                : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-xs'
            }`}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isArabic ? 'العودة للإعدادات' : 'Back to Settings'}</span>
          </button>

          {onOpenAdminConsole && userStats.role === 'admin' && (
            <button
              id="feedback-open-founder-console-btn"
              type="button"
              onClick={onOpenAdminConsole}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                  : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{tr.adminConsoleBtn}</span>
            </button>
          )}
        </div>

        {/* Screen Hero Header Card */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border mb-5 transition-all ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className={`text-lg sm:text-xl font-serif-heading font-bold tracking-wide ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                {tr.screenTitle}
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                  isDark ? 'text-stone-300' : 'text-[#5A5D63]'
                }`}
              >
                {tr.screenSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmed Submission State OR Submission Form */}
        {savedSubmission ? (
          <div
            id="feedback-submission-confirmed-card"
            className={`rounded-3xl p-6 sm:p-8 border transition-all space-y-5 ${
              isDark
                ? 'bg-[#14161A] border-emerald-500/40 shadow-[0_12px_36px_rgba(0,0,0,0.45)]'
                : 'bg-white border-emerald-600/40 shadow-md'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}>
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h2
                className={`text-base sm:text-lg font-serif-heading font-bold ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                {tr.successTitle}
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                {tr.successSubtitle}
              </p>
            </div>

            {/* Saved Details Receipt */}
            <div
              className={`rounded-2xl p-4 border space-y-2.5 text-xs ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}
            >
              <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{tr.submissionIdLabel}</span>
                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{savedSubmission.id}</span>
              </div>
              <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{tr.categoryLabel}</span>
                <span className="font-semibold">
                  {tr.categories[savedSubmission.category] || savedSubmission.category}
                </span>
              </div>
              <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <span className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{tr.statusLabel}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                  isDark
                    ? 'bg-white/[0.08] text-white border-white/[0.14]'
                    : 'bg-white text-[#111214] border-black/[0.12]'
                }`}>
                  {tr.statuses[savedSubmission.status] || savedSubmission.status}
                </span>
              </div>
              <div className="pt-1">
                <div className={`text-[11px] mb-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{tr.titleLabel}</div>
                <div className="font-bold">{savedSubmission.title}</div>
                <p className={`text-[11px] mt-1 whitespace-pre-wrap leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {savedSubmission.message}
                </p>
              </div>
              {founderNotified && (
                <div className={`pt-2 flex items-center gap-1.5 text-[11px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isArabic
                      ? 'تم إرسال إشعار فوري بالبريد الإلكتروني لمؤسس نفيس نور.'
                      : 'Founder email notification dispatched with secure review link.'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                id="feedback-submit-another-btn"
                type="button"
                onClick={handleResetForm}
                className={`w-full sm:flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                {tr.submitAnotherBtn}
              </button>
              <button
                id="feedback-done-return-btn"
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto py-3 px-5 rounded-2xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/[0.12] bg-[#1B1D23] text-stone-200 hover:bg-white/[0.08]'
                    : 'border-black/[0.1] bg-white text-[#111214] hover:bg-[#F3F3F1]'
                }`}
              >
                {isArabic ? 'العودة للإعدادات' : 'Return to Settings'}
              </button>
            </div>
          </div>
        ) : (
          <form
            id="nafis-noor-feedback-form"
            onSubmit={handleSubmit}
            className={`rounded-3xl p-5 sm:p-6 border space-y-5 transition-all ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            {/* 1. Category Selector */}
            <div>
              <label className={`block text-xs font-serif-heading font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {tr.categoryLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  const meta = CATEGORY_META[cat];
                  const IconComponent = meta.icon;
                  return (
                    <button
                      key={cat}
                      id={`feedback-category-${cat.toLowerCase().replace(/\s+/g, '-')}-btn`}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/35 ring-1 ring-white/20'
                            : 'bg-[#111214]/[0.06] border-[#111214]/45 ring-1 ring-[#111214]/15'
                          : isDark
                          ? 'bg-[#1B1D23] border-white/[0.06] hover:border-white/[0.16] text-stone-300'
                          : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.18] text-[#3F4248]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? isDark
                              ? 'bg-white text-[#111214]'
                              : 'bg-[#111214] text-white'
                            : isDark
                            ? 'bg-white/[0.06] ' + meta.accentClass
                            : 'bg-[#F3F3F1] ' + meta.accentClass
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs font-semibold leading-snug ${
                          isSelected
                            ? isDark
                              ? 'text-white'
                              : 'text-[#111214]'
                            : ''
                        }`}
                      >
                        {tr.categories[cat] || cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Feedback Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="feedback-title-input"
                  className={`text-xs font-bold ${
                    isDark ? 'text-stone-200' : 'text-[#111214]'
                  }`}
                >
                  {tr.titleLabel} <span className={isDark ? 'text-white' : 'text-[#111214]'}>*</span>
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  {title.trim().length}/200
                </span>
              </div>
              <input
                id="feedback-title-input"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr.titlePlaceholder}
                className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                    : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
                }`}
              />
            </div>

            {/* 3. Detailed Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="feedback-message-input"
                  className={`text-xs font-bold ${
                    isDark ? 'text-stone-200' : 'text-[#111214]'
                  }`}
                >
                  {tr.messageLabel} <span className={isDark ? 'text-white' : 'text-[#111214]'}>*</span>
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  {message.trim().length}/5000
                </span>
              </div>
              <textarea
                id="feedback-message-input"
                required
                rows={5}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={tr.messagePlaceholder}
                className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm leading-relaxed transition-colors focus:outline-none resize-y ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                    : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
                }`}
              />
            </div>

            {/* 4. Optional Email Address for Receiving Replies */}
            <div>
              <label
                htmlFor="feedback-email-input"
                className={`block text-xs font-bold mb-1.5 ${
                  isDark ? 'text-stone-200' : 'text-[#111214]'
                }`}
              >
                {tr.emailLabel}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                <input
                  id="feedback-email-input"
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tr.emailPlaceholder}
                  dir="ltr"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                      : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/30'
                  }`}
                />
              </div>
              <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                <span>{tr.emailHelper}</span>
              </div>
            </div>

            {/* Error Alert Banner (Real validation/network error feedback) */}
            {errorMessage && (
              <div
                id="feedback-error-alert"
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                  isDark
                    ? 'bg-red-500/15 border-red-500/35 text-red-300'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 5. Submit Feedback Button */}
            <button
              id="submit-feedback-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide shadow-sm active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? tr.submittingBtn : tr.submitBtn}</span>
            </button>
          </form>
        )}

        {/* User's Own Submitted Feedback History (with live Status & Founder Replies) */}
        {mySubmissions.length > 0 && (
          <div
            className={`mt-6 rounded-3xl p-5 sm:p-6 border space-y-3.5 ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08]'
                : 'bg-white border-black/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-xs sm:text-sm font-serif-heading font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                <Clock className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{tr.mySubmissionsTitle}</span>
              </h3>
              <span className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {mySubmissions.length}
              </span>
            </div>

            <div className="space-y-3">
              {mySubmissions.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08]'
                      : 'bg-[#FCFCFA] border-black/[0.08]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {item.id}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                        isDark
                          ? 'bg-white/[0.06] text-stone-200 border-white/[0.1]'
                          : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                      }`}>
                        {tr.categories[item.category] || item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
                          item.status === 'Answered'
                            ? isDark
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'Under Review'
                            ? isDark
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-sky-50 text-sky-800 border-sky-300'
                            : isDark
                            ? 'bg-white/[0.08] text-stone-200 border-white/[0.15]'
                            : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.1]'
                        }`}
                      >
                        {tr.statuses[item.status] || item.status}
                      </span>
                      {item.isResolved && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {tr.resolvedBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold ${
                      isDark ? 'text-white' : 'text-[#111214]'
                    }`}
                  >
                    {item.title}
                  </div>
                  <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {item.message}
                  </p>

                  {item.adminReply && (
                    <div
                      className={`mt-2 p-3 rounded-xl border ${
                        isDark
                          ? 'bg-[#0B0C0E] border-white/[0.12] text-stone-200'
                          : 'bg-white border-black/[0.1] text-[#111214]'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                        {tr.founderReplyLabel}
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {item.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
