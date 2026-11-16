import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Cloud,
  Check,
} from 'lucide-react';
import { UserStats, UserAccount } from '../types';
import {
  registerAccount,
  authenticateAccount,
  authenticateWithGoogle,
  logoutAccount,
  syncAccountData,
  hasAccountWithEmail,
} from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onAccountLoaded: (stats: UserStats) => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onAccountLoaded,
  onLogout,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'account-sync-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [view, setView] = useState<'status' | 'login' | 'register'>(
    userStats.isLoggedIn ? 'status' : 'login'
  );

  // Form states
  const [name, setName] = useState(userStats.userName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [syncNotice, setSyncNotice] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleSubmitting(true);
    try {
      const res = await authenticateWithGoogle(userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        setErrorMsg(res.error || (isArabic ? 'فشل تسجيل الدخول بحساب Google.' : 'Failed to sign in with Google.'));
      }
    } catch {
      setErrorMsg(isArabic ? 'تعذر إتمام الدخول بحساب Google.' : 'Google sign in was interrupted.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    if (hasAccountWithEmail(cleanEmail)) {
      setIsSubmitting(false);
      setView('login');
      setErrorMsg(
        isArabic
          ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
          : 'You have used this app before. Please log in with your password.'
      );
      return;
    }

    try {
      const res = await registerAccount(name, cleanEmail, password, userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        const errLower = (res.error || '').toLowerCase();
        if (
          errLower.includes('already in use') ||
          errLower.includes('already exists') ||
          errLower.includes('sign in') ||
          errLower.includes('log in')
        ) {
          setView('login');
          setErrorMsg(
            isArabic
              ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
              : 'You have used this app before. Please log in with your password.'
          );
        } else {
          setErrorMsg(res.error || (isArabic ? 'فشل إنشاء الحساب.' : 'Failed to create account.'));
        }
      }
    } catch {
      setErrorMsg(isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'An error occurred during account creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authenticateAccount(email, password, userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        setErrorMsg(res.error || (isArabic ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.'));
      }
    } catch {
      setErrorMsg(isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = () => {
    if (userStats.accountId) {
      syncAccountData(userStats.accountId, userStats);
      setSyncNotice(true);
      setTimeout(() => setSyncNotice(false), 2500);
    }
  };

  const handleSignOut = () => {
    logoutAccount();
    onLogout();
    setView('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(14px,env(safe-area-inset-bottom))] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="account-modal-container"
        className={`w-full max-w-md rounded-[32px] p-5 sm:p-7 border overflow-y-auto max-h-[min(92dvh,700px)] flex flex-col ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.45)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {userStats.isLoggedIn
                  ? (isArabic ? 'حساب نور والمزامنة الآمنة' : 'Noor Account & Device Sync')
                  : (isArabic ? 'الحساب والمزامنة' : 'Account & Sync')}
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {userStats.isLoggedIn
                  ? (isArabic ? 'سجل إيماني محفوظ ومزامن بأمان عبر أجهزتك' : 'Your spiritual journey saved safely across devices')
                  : (isArabic ? 'مزامنة إنجازاتك الحقيقية عبر جميع أجهزتك' : 'Sync your real progress across devices')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: ACTIVE LOGGED IN ACCOUNT STATUS */}
        {userStats.isLoggedIn && view === 'status' && (
          <div className="py-4 space-y-4 text-xs">
            {/* Account Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {userStats.userName || (isArabic ? 'عبد الله' : 'Servant of Allah')}
                </span>
                <span className={`flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
                  isDark
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                }`}>
                  <Cloud className="w-3 h-3" />
                  {isArabic ? 'متزامن بأمان' : 'Safely Synced'}
                </span>
              </div>
              <p className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{userStats.accountEmail || (isArabic ? 'حساب Google' : 'Google Account')}</p>

              {userStats.accountId && (
                <div className="text-[10px] text-stone-500 font-mono truncate">
                  {isArabic ? 'المعرف: ' : 'UID: '}{userStats.accountId}
                </div>
              )}

              <div className={`grid grid-cols-3 gap-2 pt-2 border-t text-center ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <div className={`p-2 rounded-xl ${isDark ? 'bg-[#14161A] border border-white/[0.06]' : 'bg-white border border-black/[0.08]'}`}>
                  <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'المواظبة' : 'Overall Streak'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.overallStreak}{isArabic ? ' يوم' : 'd'}</div>
                </div>
                <div className={`p-2 rounded-xl ${isDark ? 'bg-[#14161A] border border-white/[0.06]' : 'bg-white border border-black/[0.08]'}`}>
                  <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'صفحات القرآن' : 'Pages Read'}</div>
                  <div className={`font-bold ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>{userStats.quranPagesRead}</div>
                </div>
                <div className={`p-2 rounded-xl ${isDark ? 'bg-[#14161A] border border-white/[0.06]' : 'bg-white border border-black/[0.08]'}`}>
                  <div className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'نقاط الإنجاز' : 'Total XP'}</div>
                  <div className={`font-bold ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>{userStats.totalXP}</div>
                </div>
              </div>
            </div>

            {/* Sync Now Action */}
            <button
              onClick={handleManualSync}
              className={`w-full py-2.5 px-4 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.08] hover:bg-white/[0.12] border-white/[0.12] text-white'
                  : 'bg-[#111214] hover:bg-[#27292D] border-[#111214] text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncNotice ? 'animate-spin' : ''}`} />
              <span>
                {syncNotice
                  ? (isArabic ? 'تم حفظ التحديثات بنجاح!' : 'Progress saved successfully!')
                  : (isArabic ? 'حفظ التحديثات الآن' : 'Save Progress Now')}
              </span>
            </button>

            {/* Sign Out Button */}
            <button
              id="account-signout-btn"
              onClick={handleSignOut}
              className={`w-full py-2.5 px-4 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-stone-300 hover:text-red-400'
                  : 'border-stone-300 hover:border-red-300 hover:bg-red-50 text-stone-700 hover:text-red-700'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تسجيل الخروج من هذا الجهاز' : 'Sign Out from This Device'}</span>
            </button>
            <p className={`text-[10px] text-center ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
              {isArabic
                ? 'تسجيل الخروج يحفظ جميع بياناتك وقراءاتك بأمان.'
                : 'Signing out keeps all your reading progress and streaks safe.'}
            </p>
          </div>
        )}

        {/* VIEW 2: LOGIN */}
        {(!userStats.isLoggedIn || view === 'login') && view !== 'register' && (
          <div className="py-4 space-y-3.5 text-xs">
            {errorMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-[11px] ${
                isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-white hover:bg-stone-100 text-stone-800 shadow-md transition-all flex items-center justify-center gap-2.5"
            >
              {isGoogleSubmitting ? (
                <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleSubmitting ? (isArabic ? 'جاري الدخول...' : 'Signing in...') : (isArabic ? 'المتابعة بحساب Google' : 'Continue with Google')}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />
              <span className="text-[10px] text-stone-500 uppercase font-mono">{isArabic ? 'أو بالبريد الإلكتروني' : 'or email'}</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className={`block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100'
                        : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder:text-[#6B6F76]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{isArabic ? 'كلمة المرور' : 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100'
                        : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder:text-[#6B6F76]'
                    }`}
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <span>{isSubmitting ? (isArabic ? 'جاري الدخول...' : 'Signing In...') : (isArabic ? 'دخول واستعادة الإنجازات' : 'Sign In & Restore Progress')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className={`pt-2 text-center text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('register');
                }}
                className={`font-semibold underline hover:opacity-90 ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                {isArabic ? 'إنشاء حساب جديد' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: REGISTER */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="py-4 space-y-3 text-xs">
            {errorMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-[11px] ${
                isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className={`block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{isArabic ? 'الاسم الكريم' : 'Your Name'}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: عبد الله' : 'e.g. Abdullah'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100'
                      : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder:text-[#6B6F76]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100'
                      : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder:text-[#6B6F76]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>{isArabic ? 'كلمة المرور (٦ أحرف كحد أدنى)' : 'Password (min 6 characters)'}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.1] focus:border-white/35 text-stone-100'
                      : 'bg-[#F3F3F1] border-black/[0.1] focus:border-[#111214]/40 text-[#111214] placeholder:text-[#6B6F76]'
                  }`}
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <span>{isSubmitting ? (isArabic ? 'جاري إنشاء الحساب...' : 'Creating Account...') : (isArabic ? 'إنشاء الحساب والمزامنة' : 'Create Account')}</span>
              <Sparkles className="w-4 h-4" />
            </button>

            <div className={`pt-2 text-center text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('login');
                }}
                className={`font-semibold underline hover:opacity-90 ${isDark ? 'text-white' : 'text-[#111214]'}`}
              >
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
