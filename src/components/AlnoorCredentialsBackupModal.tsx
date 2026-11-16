import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Mail,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { UserStats } from '../types';
import { hashPassword } from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface AlnoorCredentialsBackupModalProps {
  isOpen: boolean;
  onClose: (updatedUsername?: string, passwordHash?: string, updatedEmail?: string) => void;
  isDark: boolean;
  userStats: UserStats;
  initialEmail?: string;
  initialName?: string;
}

export const AlnoorCredentialsBackupModal: React.FC<AlnoorCredentialsBackupModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  initialEmail,
  initialName,
}) => {
  useModalScrollLock(isOpen, 'alnoor-credentials-backup-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [email, setEmail] = useState(initialEmail || userStats.accountEmail || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(initialName || userStats.userName || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(
        isArabic
          ? 'يرجى إدخال بريد إلكتروني صحيح لتتمكن من تسجيل الدخول في أي وقت.'
          : 'Please enter a valid email address so you can log in anytime.'
      );
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg(
        isArabic
          ? 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل لحماية حسابك.'
          : 'Password must be at least 8 characters for your security.'
      );
      return;
    }

    const cleanUser = username.trim() || cleanEmail.split('@')[0] || 'Servant of Allah';

    setIsSaving(true);
    try {
      const pHash = await hashPassword(password, cleanEmail);
      setIsSaving(false);
      onClose(cleanUser, pHash, cleanEmail);
    } catch {
      setIsSaving(false);
      setErrorMsg(
        isArabic
          ? 'تعذر حفظ بيانات الاعتماد على خادم مجموعة نور.'
          : 'Failed to securely encrypt & backup credentials to Alnoorgroup server.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="alnoor-credentials-backup-container"
        className={`w-full max-w-md rounded-[32px] p-6 sm:p-7 border overflow-y-auto max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_20px_60px_rgba(0,0,0,0.12)]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'خادم مجموعة نور الآمن للنسخ الاحتياطي' : 'Alnoorgroup Secure Cloud Backup'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic ? 'حماية تامة وسرية مطلقة لبياناتك الشخصية' : 'Private & confidential Alnoorgroup server storage'}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 mb-5 ${
          isDark
            ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
            <span>{isArabic ? 'تنبيه أمني هام: بريدك الإلكتروني هو مفتاح دخولك' : 'Important: Your Email is Your Login Key'}</span>
          </div>
          <p className={`font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-sky-950'}`}>
            {isArabic
              ? 'يرجى حفظ بريدك الإلكتروني وكلمة المرور الخاصة بك جيداً! تتيح لك هذه البيانات تسجيل الدخول في أي وقت من أي جهاز، بينما تحافظ مجموعة نور على خصوصية جميع إنجازاتك ونشاطك داخل خوادمنا الآمنة.'
              : 'Please set and remember your login email and password! This ensures you can sign in anytime from any device, while Alnoorgroup securely backs up your progress in our private server.'}
          </p>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          {/* Email Field (Primary) */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
              {isArabic ? 'البريد الإلكتروني الأساسي لتسجيل الدخول' : 'Alnoorgroup Login Email'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isArabic ? 'your.email@example.com' : 'your.email@example.com'}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100 placeholder-stone-500'
                    : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder-[#6B6F76]'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
              {isArabic ? 'أنشئ كلمة المرور الخاصة بك' : 'Create Secure Password'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isArabic ? '٨ أحرف على الأقل...' : 'At least 8 characters...'}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100 placeholder-stone-500'
                    : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder-[#6B6F76]'
                }`}
              />
            </div>
          </div>

          {/* Username Field (Secondary / Optional) */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {isArabic ? 'اسم المستخدم في التطبيق (اختياري)' : 'App Username (Optional)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isArabic ? 'اسمك المستعار...' : 'Your display name...'}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100 placeholder-stone-500'
                    : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder-[#6B6F76]'
                }`}
              />
            </div>
          </div>

          {errorMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              isDark ? 'bg-red-500/15 border-red-500/35 text-red-300' : 'bg-red-50 border-red-300 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSaving
                ? (isArabic ? 'جارٍ الحفظ على خادم مجموعة نور...' : 'Backing up to Alnoorgroup Server...')
                : (isArabic ? 'حفظ ونسخ احتياطي على خادم مجموعة نور' : 'Save & Securely Backup to Alnoorgroup Server')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
