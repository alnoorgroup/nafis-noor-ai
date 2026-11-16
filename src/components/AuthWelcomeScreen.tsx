import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Compass,
  AlertCircle,
  Sparkles,
  KeyRound,
  X,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { UserStats, UserAccount } from '../types';
import {
  registerAccount,
  authenticateAccount,
  authenticateWithGoogle,
  authenticateAdmin,
  createAdminSession,
  createGuestSession,
  updateAccountCredentialsWithPassword,
  hasAccountWithEmail,
} from '../utils/accountManager';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { AlnoorCredentialsBackupModal } from './AlnoorCredentialsBackupModal';
import { AppLogoIcon } from './AppLogoIcon';
import { AuthLifetimeFreeFlow } from './AuthLifetimeFreeFlow';
import { useBackHandler } from '../utils/historyManager';
import { t, getLanguageCode } from '../utils/i18n';

interface AuthWelcomeScreenProps {
  isDark: boolean;
  onAuthenticated: (stats: UserStats) => void;
  onToggleTheme?: () => void;
  initialZeroStats: UserStats;
  language?: string;
}

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({
  isDark,
  onAuthenticated,
  initialZeroStats,
  language,
}) => {
  const lang = getLanguageCode(language);
  const isArabic = lang === 'ar';

  // Detect if user has used this app before on this device/browser
  const hasUsedAppBefore = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedStats = localStorage.getItem('noor_user_stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        if (
          parsed.userName ||
          parsed.accountEmail ||
          (parsed.overallStreak && parsed.overallStreak > 0) ||
          parsed.hasCompletedWelcome ||
          parsed.isLoggedIn
        ) {
          return true;
        }
      }
      const rawAccounts = localStorage.getItem('noor_accounts_cloud_db');
      if (rawAccounts) {
        const parsed = JSON.parse(rawAccounts);
        if (parsed && Object.keys(parsed).length > 0) return true;
      }
      if (localStorage.getItem('noor_active_session_id')) return true;
      if (localStorage.getItem('noor_last_login_email')) return true;
    } catch {
      // ignore
    }
    return false;
  }, []);

  const lastKnownEmail = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const explicitLast = localStorage.getItem('noor_last_login_email');
      if (explicitLast && explicitLast.includes('@')) return explicitLast.trim();
      const savedStats = localStorage.getItem('noor_user_stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        if (parsed.accountEmail && parsed.accountEmail.includes('@')) {
          return parsed.accountEmail.trim();
        }
      }
      const rawAccounts = localStorage.getItem('noor_accounts_cloud_db');
      if (rawAccounts) {
        const parsed = JSON.parse(rawAccounts);
        const list = Object.values(parsed) as any[];
        if (list.length > 0 && list[0]?.email) {
          return list[0].email.trim();
        }
      }
    } catch {
      // ignore
    }
    return '';
  }, []);

  // Screen views: 'landing' | 'login' | 'signup' | 'onboarding' | 'admin_login' | 'admin_welcome' | 'lifetime_flow'
  const [view, setView] = useState<
    'landing' | 'login' | 'signup' | 'onboarding' | 'admin_login' | 'admin_welcome' | 'lifetime_flow'
  >('landing');

  // Stats to transition into once onboarding / lifetime free flow finishes
  const [pendingStats, setPendingStats] = useState<UserStats | null>(null);

  // Admin access state
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminAuthenticating, setIsAdminAuthenticating] = useState(false);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Log In form state - prefill with last known email if they used this app before
  const [loginEmail, setLoginEmail] = useState(lastKnownEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  React.useEffect(() => {
    if (lastKnownEmail && !loginEmail) {
      setLoginEmail(lastKnownEmail);
    }
  }, [lastKnownEmail]);

  // Status & error states
  const [inlinePasswordError, setInlinePasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [userStatusBanner, setUserStatusBanner] = useState<{
    type: 'new' | 'returning';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Browser Back button navigation hooks
  useBackHandler(showForgotModal, () => setShowForgotModal(false), 'auth-forgot-modal');
  useBackHandler(view !== 'landing', () => setView('landing'), 'auth-view-landing');

  // Onboarding choices state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Qur'an reading",
    'Prayer',
    'Dhikr',
  ]);
  const [selectedLocation, setSelectedLocation] = useState('Makkah (Umm al-Qura)');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'Minimal' | 'Normal' | 'Frequent'>('Normal');

  // Newly created account holder temporarily preserved during onboarding
  const [currentCreatedAccount, setCurrentCreatedAccount] = useState<UserAccount | null>(null);

  // Alnoorgroup Secure Credentials Backup Modal State
  const [showAlnoorCredentialsModal, setShowAlnoorCredentialsModal] = useState(false);
  const [activeAuthAccount, setActiveAuthAccount] = useState<UserAccount | null>(null);
  const [authPostAction, setAuthPostAction] = useState<'onboarding' | 'lifetime'>('onboarding');

  const goalOptions = [
    { id: "Qur'an reading", label: "📖 Qur'an reading", desc: 'Recitation, translation & reading streak' },
    { id: 'Prayer', label: '🕌 Prayer Times', desc: 'Accurate times & upcoming salah countdown' },
    { id: 'Dhikr', label: '📿 Dhikr & Tasbih', desc: 'Tactile counter & morning/evening remembrance' },
    { id: 'Islamic learning', label: '🎓 Islamic Learning', desc: 'Bite-sized interactive lessons & quizzes' },
    { id: 'Duas', label: '🤲 Authentic Duas', desc: 'Daily supplications with audio & sources' },
    { id: 'Noor AI', label: '🤖 Noor AI', desc: 'Grounded Islamic knowledge assistant' },
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ar', name: 'Arabic', native: 'العَرَبِيَّة' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  ];

  const popularLocations = [
    'Makkah (Umm al-Qura)',
    'London (United Kingdom)',
    'New York (United States)',
    'Istanbul (Turkey)',
    'Cairo (Egypt)',
    'Dubai (UAE)',
    'Jakarta (Indonesia)',
    'Kuala Lumpur (Malaysia)',
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setSelectedLocation('Current Location (Detected)');
          setIsDetectingLocation(false);
        },
        () => {
          setSelectedLocation('Makkah (Umm al-Qura)');
          setIsDetectingLocation(false);
        },
        { timeout: 4000 }
      );
    } else {
      setTimeout(() => {
        setSelectedLocation('Makkah (Umm al-Qura)');
        setIsDetectingLocation(false);
      }, 500);
    }
  };

  const proceedToAppOrLifetimeFlow = (targetStats: UserStats) => {
    onAuthenticated(targetStats);
  };

  const handleCredentialsBackupComplete = (updatedUsername?: string, passwordHash?: string, updatedEmail?: string) => {
    setShowAlnoorCredentialsModal(false);
    if (activeAuthAccount) {
      const finalName = updatedUsername || activeAuthAccount.name;
      const finalHash = passwordHash || activeAuthAccount.passwordHash || 'pbkdf2_v2$default';
      const finalEmail = updatedEmail || activeAuthAccount.email;
      updateAccountCredentialsWithPassword(
        activeAuthAccount.id,
        finalEmail,
        finalName,
        finalHash
      );
      activeAuthAccount.name = finalName;
      activeAuthAccount.email = finalEmail;
      activeAuthAccount.passwordHash = finalHash;
      setCurrentCreatedAccount(activeAuthAccount);
    }
    if (authPostAction === 'onboarding') {
      setView('onboarding');
    } else {
      if (activeAuthAccount) {
        const targetStats: UserStats = {
          ...activeAuthAccount.stats,
          userName: activeAuthAccount.name,
          accountEmail: activeAuthAccount.email,
          isLoggedIn: true,
          hasCompletedWelcome: true,
        };
        proceedToAppOrLifetimeFlow(targetStats);
      }
    }
  };

  // Google Sign-In with Firebase (Recognizes New vs Old User)
  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsGoogleLoading(true);

    try {
      const res = await authenticateWithGoogle(initialZeroStats);

      if (res.cancelled) {
        // User closed the popup or cancelled selection - stay on screen without error
        setIsGoogleLoading(false);
        return;
      }

      if (res.success && res.account) {
        const firstName = res.account.name ? res.account.name.split(' ')[0] : 'there';
        if (res.account.email) {
          localStorage.setItem('noor_last_login_email', res.account.email.toLowerCase());
        }

        if (res.isNewUser) {
          // Brand New User -> Welcome them and proceed to onboarding smoothly
          setUserStatusBanner({
            type: 'new',
            message: `Welcome to Noor, ${firstName}!`,
          });
          setActiveAuthAccount(res.account);
          setCurrentCreatedAccount(res.account);
          setIsGoogleLoading(false);
          setView('onboarding');
        } else {
          // Returning User -> NEVER ask to create a password; restore session directly
          setUserStatusBanner({
            type: 'returning',
            message: `Welcome back, ${firstName}! Restored your streak and cloud data.`,
          });
          const targetStats: UserStats = {
            ...res.account!.stats,
            userName: res.account!.name,
            accountEmail: res.account!.email,
            isLoggedIn: true,
            hasCompletedWelcome: true,
          };
          proceedToAppOrLifetimeFlow(targetStats);
          setIsGoogleLoading(false);
        }
      } else {
        setGeneralError(res.error || 'Failed to sign in with Google.');
        setIsGoogleLoading(false);
      }
    } catch {
      setGeneralError('Google authentication was interrupted. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setInlinePasswordError(null);
    setIsLoading(true);

    const cleanEmail = signUpEmail.trim().toLowerCase();

    // If user has used this app before or already has an account with this email:
    if (hasAccountWithEmail(cleanEmail) || (hasUsedAppBefore && lastKnownEmail.toLowerCase() === cleanEmail)) {
      setIsLoading(false);
      setLoginEmail(cleanEmail);
      setView('login');
      setGeneralError(
        isArabic
          ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
          : 'You have used this app before. Please log in with your password.'
      );
      return;
    }

    try {
      const res = await registerAccount(
        signUpName.trim() || 'Servant of Allah',
        cleanEmail,
        signUpPassword,
        initialZeroStats
      );

      if (res.success && res.account) {
        localStorage.setItem('noor_last_login_email', cleanEmail);
        setUserStatusBanner({
          type: 'new',
          message: `Account created for ${res.account.name}!`,
        });
        setActiveAuthAccount(res.account);
        setCurrentCreatedAccount(res.account);
        setIsLoading(false);
        // User already created their password during sign-up; do NOT prompt them again
        setView('onboarding');
      } else {
        setIsLoading(false);
        const errLower = (res.error || '').toLowerCase();
        if (
          errLower.includes('already in use') ||
          errLower.includes('already exists') ||
          errLower.includes('sign in') ||
          errLower.includes('log in')
        ) {
          setLoginEmail(cleanEmail);
          setView('login');
          setGeneralError(
            isArabic
              ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
              : 'You have used this app before. Please log in with your password.'
          );
        } else {
          setGeneralError(res.error || 'Failed to create account.');
        }
      }
    } catch {
      setGeneralError('An unexpected error occurred during account creation.');
      setIsLoading(false);
    }
  };

  // Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setInlinePasswordError(null);
    setIsLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      const res = await authenticateAccount(cleanEmail, loginPassword, initialZeroStats);
      if (res.success && res.account) {
        localStorage.setItem('noor_last_login_email', cleanEmail);
        setUserStatusBanner({
          type: res.isNewUser ? 'new' : 'returning',
          message: isArabic
            ? `أهلاً بعودتك يا ${res.account.name}!`
            : `Welcome back, ${res.account.name}! Ready for your reflections.`,
        });
        setActiveAuthAccount(res.account);
        setCurrentCreatedAccount(res.account);
        setIsLoading(false);

        // Returning / existing user who authenticated with password:
        // Never show "Create a password" modal; directly proceed to the app
        const targetStats: UserStats = {
          ...res.account.stats,
          userName: res.account.name,
          accountEmail: res.account.email,
          isLoggedIn: true,
          hasCompletedWelcome: true,
        };
        proceedToAppOrLifetimeFlow(targetStats);
      } else {
        setIsLoading(false);
        if (res.error && res.error.toLowerCase().includes('password')) {
          setInlinePasswordError(
            isArabic
              ? 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى أو استعادة كلمة المرور.'
              : 'Incorrect password. Please try again or reset your password.'
          );
        } else {
          setGeneralError(res.error || 'Invalid email address or account not found.');
        }
      }
    } catch {
      setIsLoading(false);
      setGeneralError('An unexpected error occurred during sign in.');
    }
  };

  // Continue as Guest (Clearly visible, no account required, no fake data)
  const handleContinueAsGuest = () => {
    const guestStats = createGuestSession(initialZeroStats);
    onAuthenticated(guestStats);
  };

  // Authenticate Admin securely on server backend
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setAdminError('Please enter the administration password.');
      return;
    }
    setIsAdminAuthenticating(true);
    setAdminError(null);

    try {
      const result = await authenticateAdmin(adminPassword.trim());
      if (result.success) {
        setView('admin_welcome');
      } else {
        setAdminError(result.error || 'Invalid administration password.');
      }
    } catch {
      setAdminError('Unable to connect to administration verification server.');
    } finally {
      setIsAdminAuthenticating(false);
    }
  };

  // Admin Next - Enter normal Nafis Noor page with active admin session
  const handleAdminNext = () => {
    const adminStats = createAdminSession(initialZeroStats);
    onAuthenticated(adminStats);
  };

  // Finish Onboarding
  const handleFinishOnboarding = () => {
    const updatedStats: UserStats = {
      ...(currentCreatedAccount ? currentCreatedAccount.stats : initialZeroStats),
      isLoggedIn: true,
      hasCompletedWelcome: true,
      language: selectedLanguage,
      userLocation: selectedLocation,
      notificationsEnabled: true,
      personalization: {
        goals: selectedGoals,
        reminderFrequency,
      },
      overallStreak: 0,
      quranStreak: 0,
      learningStreak: 0,
      dhikrStreak: 0,
      completedLessonIds: [],
      quranPagesRead: 0,
      totalXP: 0,
      lessonsCompleted: 0,
      dhikrCount: 0,
      bookmarks: [],
      savedDuas: [],
      prayerHistory: [],
      unlockedAchievements: [],
      noorAiConversation: [],
    };

    onAuthenticated(updatedStats);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 selection:bg-black/15 dark:selection:bg-white/20 ${
      isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
    }`}>
      {/* Subtle Monochrome Ambient Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[160px] ${
          isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'
        }`} />
        <div className={`absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full blur-[170px] ${
          isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        {/* User recognition banner */}
        {userStatusBanner && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs shadow-sm animate-fadeIn ${
              userStatusBanner.type === 'returning'
                ? isDark
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isDark
                ? 'bg-[#14161A] border-white/[0.12] text-stone-200'
                : 'bg-white border-black/[0.1] text-[#111214]'
            }`}
          >
            {userStatusBanner.type === 'returning' ? (
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
            ) : (
              <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            )}
            <span className="font-medium">{userStatusBanner.message}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 1. LANDING VIEW (Welcome & Choices)                                       */}
        {/* ========================================================================= */}
        {view === 'landing' && (
          <div
            id="noor-auth-landing-card"
            className={`rounded-[32px] p-8 sm:p-10 text-center transition-all animate-fadeIn border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* App Logo Emblem */}
            <div className="mx-auto w-24 h-24 rounded-3xl overflow-hidden shadow-md mb-6">
              <AppLogoIcon className="w-full h-full" withContainer={true} />
            </div>

            <h1
              className={`text-3xl sm:text-4xl font-bold tracking-[0.25em] mb-2 ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}
            >
              {isArabic ? 'نور' : 'NOOR'}
            </h1>

            <p
              className={`italic text-lg font-medium mb-3 ${
                isDark ? 'text-stone-300' : 'text-[#3F4248]'
              }`}
            >
              "{t(lang, 'authWelcomeSubtitle')}"
            </p>

            <p
              className={`text-xs leading-relaxed max-w-xs mx-auto mb-6 font-light ${
                isDark ? 'text-stone-400' : 'text-[#5A5D63]'
              }`}
            >
              {t(lang, 'homeDesc')}
            </p>

            {/* Google Sign In Button (Firebase Auth) */}
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full mb-3.5 py-3.5 px-6 rounded-2xl font-bold text-xs bg-white hover:bg-stone-100 text-stone-800 shadow-[0_6px_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
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
              <span>{isGoogleLoading ? t(lang, 'loading') : t(lang, 'continueWithGoogle')}</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
              <span className={`text-[10px] uppercase tracking-widest font-mono ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                {t(lang, 'emailAddress')}
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
            </div>

            {hasUsedAppBefore && (
              <div
                className={`mb-4 p-3.5 rounded-2xl border text-xs text-left flex items-start gap-2.5 ${
                  isDark
                    ? 'bg-sky-500/10 border-sky-500/30 text-stone-200'
                    : 'bg-sky-50 border-sky-200 text-[#111214]'
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                <div className="flex-1">
                  <div className={`font-semibold text-xs ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>
                    {isArabic ? 'أهلاً بعودتك إلى نور' : 'Welcome back to Noor'}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {isArabic
                      ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
                      : 'You have used this app before. Please log in with your password.'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Continue to Login or Sign Up */}
            <div className="space-y-2.5">
              <button
                id="landing-login-btn"
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setInlinePasswordError(null);
                  if (lastKnownEmail && !loginEmail) {
                    setLoginEmail(lastKnownEmail);
                  }
                  setView('login');
                }}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95`}
              >
                <span>
                  {hasUsedAppBefore
                    ? (isArabic ? 'تسجيل الدخول بكلمة المرور' : 'Log in with Password')
                    : t(lang, 'signIn')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="landing-signup-btn"
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setInlinePasswordError(null);
                  setView('signup');
                }}
                className={`w-full py-3 px-6 rounded-2xl font-bold tracking-wide text-[11px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  isDark
                    ? 'bg-[#1B1D23] hover:bg-white/[0.08] border-white/[0.1] text-white'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.1] text-[#111214]'
                }`}
              >
                <span>{t(lang, 'createAccount')}</span>
              </button>

              <button
                id="landing-guest-btn"
                type="button"
                onClick={handleContinueAsGuest}
                className={`w-full py-3 px-6 rounded-2xl font-bold tracking-wide text-[11px] border active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-stone-300 hover:text-white'
                    : 'bg-white hover:bg-[#F3F3F1] border-black/[0.08] text-[#3F4248] hover:text-[#111214]'
                }`}
              >
                <span>{t(lang, 'continueAsGuest')}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>

            <div className={`mt-6 flex items-center justify-center gap-2 text-[11px] font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
              <span>{isArabic ? 'حفظ آمن وخاص ومزامن بين أجهزتك' : 'Private, secure & synced across your devices'}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. LOGIN SCREEN                                                           */}
        {/* ========================================================================= */}
        {view === 'login' && (
          <div
            id="noor-auth-login-card"
            className={`rounded-[32px] p-8 sm:p-10 transition-all animate-fadeIn border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Top Branding */}
            <div className="text-center mb-5">
              <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-md mb-3">
                <AppLogoIcon className="w-full h-full" withContainer={true} />
              </div>
              <h1
                className={`text-2xl font-bold tracking-[0.2em] ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                NOOR
              </h1>
              <h2
                className={`text-xl font-bold mt-1.5 ${
                  isDark ? 'text-stone-200' : 'text-[#111214]'
                }`}
              >
                Sign In to Noor
              </h2>
              <p className={`text-xs font-light mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Sign in with Google or Email to access your sanctuary and cloud progress.
              </p>
            </div>

            {/* Google Quick Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full mb-3 py-3 px-4 rounded-2xl font-semibold text-xs bg-white hover:bg-stone-100 text-stone-800 shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
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
              <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
              <span className={`text-[10px] uppercase tracking-widest font-mono ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                or
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
            </div>

            {/* General Error */}
            {generalError && (
              <div className={`p-3 mb-4 rounded-2xl border flex items-center gap-2 text-xs ${
                isDark
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email Field */}
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 pl-1 ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                  <label
                    className={`text-[11px] font-semibold ${
                      isDark ? 'text-stone-300' : 'text-[#3F4248]'
                    }`}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setShowForgotModal(true);
                    }}
                    className={`text-[11px] hover:underline transition-colors font-medium ${
                      isDark ? 'text-stone-300 hover:text-white' : 'text-[#3F4248] hover:text-[#111214]'
                    }`}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                  <input
                    id="login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (inlinePasswordError) setInlinePasswordError(null);
                    }}
                    className={`w-full pl-11 pr-11 py-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    } ${inlinePasswordError ? 'border-red-400/60 focus:border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className={`absolute right-4 top-3.5 transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {inlinePasswordError && (
                  <p className={`text-[11px] mt-1 pl-1 flex items-center gap-1.5 animate-fadeIn ${
                    isDark ? 'text-red-400' : 'text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-600'}`} />
                    <span>{inlinePasswordError}</span>
                  </p>
                )}
              </div>

              {/* Primary button */}
              <button
                id="login-continue-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95`}
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In →'}</span>
              </button>

              {/* Clearly visible Guest Option */}
              <div className="pt-2 text-center">
                <button
                  id="login-guest-btn"
                  type="button"
                  onClick={handleContinueAsGuest}
                  className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs border active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-stone-300 hover:text-white'
                      : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#3F4248] hover:text-[#111214]'
                  }`}
                >
                  <span>Continue as Guest</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </form>

            {/* Secondary: "New to Noor? Sign up" */}
            <div className={`pt-5 text-center text-xs border-t mt-5 ${isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#5A5D63] border-black/[0.08]'}`}>
              <span>New to Noor? </span>
              <button
                id="login-to-signup-btn"
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setInlinePasswordError(null);
                  setView('signup');
                }}
                className={`font-semibold hover:underline transition-opacity ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SIGN UP SCREEN                                                         */}
        {/* ========================================================================= */}
        {view === 'signup' && (
          <div
            id="noor-auth-signup-card"
            className={`rounded-[32px] p-8 sm:p-10 transition-all animate-fadeIn border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setInlinePasswordError(null);
                  setView('landing');
                }}
                className={`text-xs transition-colors ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                }`}
              >
                ← Back
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`font-arabic text-lg ${isDark ? 'text-white' : 'text-[#111214]'}`}>نُور</span>
                <span className={`text-xs font-bold tracking-widest ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>NOOR</span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Create Your Account
              </h2>
              <p className={`text-xs mt-0.5 font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'احفظ وردك اليومي وقراءاتك بأمان لتتابع من أي جهاز.'
                  : 'Keep your reading progress, daily prayers, and bookmarks safe wherever you go.'}
              </p>
            </div>

            {/* Google Quick Sign-Up */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full mb-3 py-3 px-4 rounded-2xl font-semibold text-xs bg-white hover:bg-stone-100 text-stone-800 shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
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
              <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
              <span className={`text-[10px] uppercase tracking-widest font-mono ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                or email
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-stone-300'}`} />
            </div>

            {generalError && (
              <div className={`p-3 mb-3 rounded-2xl border flex items-center gap-2 text-xs ${
                isDark
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 pl-1 ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Your Name
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    placeholder="e.g. Abdullah or Fatima"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 pl-1 ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    placeholder="Email address"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    onBlur={() => {
                      const clean = signUpEmail.trim().toLowerCase();
                      if (
                        clean &&
                        (hasAccountWithEmail(clean) || (hasUsedAppBefore && lastKnownEmail.toLowerCase() === clean))
                      ) {
                        setLoginEmail(clean);
                        setView('login');
                        setGeneralError(
                          isArabic
                            ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
                            : 'You have used this app before. Please log in with your password.'
                        );
                      }
                    }}
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 pl-1 ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 w-4 h-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`} />
                  <input
                    id="signup-password-input"
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Create a secure password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className={`absolute right-4 top-3.5 transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="signup-submit-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <span>{isLoading ? 'Creating...' : 'Create Account →'}</span>
              </button>
            </form>

            <div className={`pt-5 text-center text-xs border-t mt-5 ${isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#5A5D63] border-black/[0.08]'}`}>
              <span>Already have an account? </span>
              <button
                id="signup-to-login-btn"
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setInlinePasswordError(null);
                  setView('login');
                }}
                className={`font-semibold hover:underline transition-opacity ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Subtle Admin Access Entry Point (discreet, non-prominent) */}
            <div className="pt-4 flex items-center justify-center">
              <button
                id="admin-access-trigger"
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  setAdminError(null);
                  setAdminPassword('');
                  setView('admin_login');
                }}
                aria-label="Administration"
                className={`opacity-20 hover:opacity-60 transition-opacity p-1 cursor-pointer ${
                  isDark ? 'text-stone-600 hover:text-stone-400' : 'text-stone-400 hover:text-[#111214]'
                }`}
                title="System Administration"
              >
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ONBOARDING PREFERENCES (After Sign Up)                                 */}
        {/* ========================================================================= */}
        {view === 'onboarding' && (
          <div
            id="noor-auth-onboarding-card"
            className={`rounded-[32px] p-7 sm:p-9 transition-all animate-fadeIn border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <span className={`font-arabic text-lg ${isDark ? 'text-white' : 'text-[#111214]'}`}>نُور</span>
                <span className={`text-xs font-bold tracking-widest ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>NOOR</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      onboardingStep === i
                        ? isDark ? 'w-6 bg-white' : 'w-6 bg-[#111214]'
                        : isDark
                        ? 'w-2 bg-white/20'
                        : 'w-2 bg-black/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 0: Language */}
            {onboardingStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    Select Your Language
                  </h3>
                  <p className={`text-xs font-light mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Choose your primary reading and application language.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {languages.map((lang) => {
                    const isSelected = selectedLanguage === lang.name;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.name)}
                        className={`p-3.5 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.1] border-white/40 text-white'
                              : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214]'
                            : isDark
                            ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                            : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                          {lang.name}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                          {lang.native}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className={`w-full mt-4 py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: Goals */}
            {onboardingStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    Your Islamic Priorities
                  </h3>
                  <p className={`text-xs font-light mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Select what you'd like to focus on in Noor.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {goalOptions.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.1] border-white/40 text-white'
                              : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214]'
                            : isDark
                            ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/20'
                            : 'bg-[#F3F3F1] border-black/[0.08] hover:border-black/20'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                            {goal.label}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                            {goal.desc}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? isDark
                                ? 'bg-white border-white text-[#111214]'
                                : 'bg-[#111214] border-[#111214] text-white'
                              : isDark
                              ? 'border-white/25'
                              : 'border-black/25'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(0)}
                    className={`py-3.5 px-5 rounded-2xl border text-xs font-semibold transition-colors ${
                      isDark
                        ? 'border-white/[0.1] bg-[#1B1D23] text-stone-300 hover:bg-white/[0.08]'
                        : 'border-black/[0.1] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.06]'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className={`flex-1 py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-white hover:bg-stone-200 text-[#111214]'
                        : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location & Finalize */}
            {onboardingStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    Prayer Times Location
                  </h3>
                  <p className={`text-xs font-light mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    Select your region for astronomical prayer times calculations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'border-white/[0.12] bg-white/[0.08] text-white hover:bg-white/[0.12]'
                      : 'border-black/[0.12] bg-[#F3F3F1] text-[#111214] hover:bg-black/[0.08]'
                  }`}
                >
                  <Compass className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting Location...' : 'Use My Current Location'}</span>
                </button>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {popularLocations.map((loc) => {
                    const isSelected = selectedLocation === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setSelectedLocation(loc)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.1] text-white font-semibold border-white/35'
                              : 'bg-[#111214]/[0.06] text-[#111214] font-semibold border-[#111214]/40'
                            : isDark
                            ? 'border-transparent text-stone-300 hover:bg-white/[0.05]'
                            : 'border-transparent text-[#3F4248] hover:bg-black/[0.04]'
                        }`}
                      >
                        <span>{loc}</span>
                        {isSelected && <Check className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
                      </button>
                    );
                  })}
                </div>

                {/* Prayer Notification Frequency */}
                <div className="pt-2">
                  <label className={`text-[11px] font-semibold tracking-wider uppercase block mb-1.5 ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}>
                    Prayer Reminder Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Minimal', 'Normal', 'Frequent'] as const).map((freq) => {
                      const isSelected = reminderFrequency === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setReminderFrequency(freq)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? isDark
                                ? 'bg-white/[0.1] border-white/40 text-white'
                                : 'bg-[#111214] border-[#111214] text-white'
                              : isDark
                              ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300 hover:border-white/20'
                              : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248] hover:border-black/20'
                          }`}
                        >
                          <div className="text-xs font-bold">{freq}</div>
                          <div className={`text-[9px] mt-0.5 ${isSelected && !isDark ? 'text-stone-300' : isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                            {freq === 'Minimal' && '1m before'}
                            {freq === 'Normal' && '5m before'}
                            {freq === 'Frequent' && '15m before'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className={`py-3.5 px-5 rounded-2xl border text-xs font-semibold transition-colors ${
                      isDark
                        ? 'border-white/[0.1] bg-[#1B1D23] text-stone-300 hover:bg-white/[0.08]'
                        : 'border-black/[0.1] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.06]'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    id="finish-onboarding-btn"
                    type="button"
                    onClick={handleFinishOnboarding}
                    className={`flex-1 py-3.5 px-6 rounded-2xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-white hover:bg-stone-200 text-[#111214]'
                        : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <span>Continue to Sanctuary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. DEDICATED ADMIN LOGIN SCREEN                                           */}
        {/* ========================================================================= */}
        {view === 'admin_login' && (
          <div
            id="noor-admin-login-card"
            className={`rounded-[32px] p-8 sm:p-10 transition-all animate-fadeIn border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                id="admin-back-btn"
                onClick={() => {
                  setAdminError(null);
                  setAdminPassword('');
                  setView('signup');
                }}
                className={`text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                }`}
              >
                <span>← Back to Sign Up</span>
              </button>
              <span className={`text-[10px] font-mono uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${
                isDark
                  ? 'text-sky-300 bg-sky-500/10 border-sky-500/25'
                  : 'text-sky-800 bg-sky-50 border-sky-200'
              }`}>
                Restricted System
              </span>
            </div>

            <div className="text-center mb-6">
              <div className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 ${
                isDark
                  ? 'bg-white/[0.08] border-white/[0.12] text-white'
                  : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
              }`}>
                <Lock className="w-6 h-6" />
              </div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                Administration Access
              </h1>
              <p className={`text-xs font-light mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                Please authenticate to access the Nafis Noor administration area.
              </p>
            </div>

            {adminError && (
              <div className={`p-3 mb-4 rounded-2xl border flex items-center gap-2 text-xs ${
                isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 pl-1 ${
                  isDark ? 'text-stone-300' : 'text-[#3F4248]'
                }`}>
                  Administration Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
                  <input
                    id="admin-password-input"
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter administration password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (adminError) setAdminError(null);
                    }}
                    className={`w-full pl-11 pr-11 py-3 rounded-2xl text-xs border focus:outline-none transition-all font-mono ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className={`absolute right-4 top-3.5 transition-colors cursor-pointer ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                    aria-label="Toggle password visibility"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="admin-authenticate-btn"
                type="submit"
                disabled={isAdminAuthenticating}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold tracking-wider text-xs shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <span>{isAdminAuthenticating ? 'Authenticating with Backend...' : 'Authenticate →'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. DEDICATED ADMIN WELCOME SCREEN                                         */}
        {/* ========================================================================= */}
        {view === 'admin_welcome' && (
          <div
            id="noor-admin-welcome-card"
            className={`rounded-[32px] p-8 sm:p-12 transition-all animate-fadeIn text-center border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
                : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className={`mx-auto w-20 h-20 rounded-3xl border flex items-center justify-center mb-5 ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214]'
            }`}>
              <Sparkles className={`w-9 h-9 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border mb-4 ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Session Verified</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              Welcome, Everyone 👋
            </h1>

            <div className={`p-5 my-6 rounded-2xl border text-left text-xs leading-relaxed space-y-2.5 ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                You’re now in the Nafis Noor administration area.
              </p>
              <p className={isDark ? 'text-stone-300' : 'text-[#3F4248]'}>
                Manage the platform carefully and securely.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isDark ? 'bg-[#14161A] border-white/[0.08] text-stone-300' : 'bg-white border-black/[0.08] text-[#3F4248]'
                }`}>
                  Nickname: Everyone
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isDark ? 'bg-[#14161A] border-white/[0.08] text-stone-300' : 'bg-white border-black/[0.08] text-[#3F4248]'
                }`}>
                  Role: Administrator
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isDark ? 'bg-[#14161A] border-white/[0.08] text-stone-300' : 'bg-white border-black/[0.08] text-[#3F4248]'
                }`}>
                  Access: Full
                </span>
              </div>
            </div>

            <button
              id="admin-welcome-next-btn"
              type="button"
              onClick={handleAdminNext}
              className={`w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. PRE-RELEASE DEVELOPMENT NOTICE & TERMS ACCEPTANCE FLOW                 */}
        {/* ========================================================================= */}
        {view === 'lifetime_flow' && (
          <AuthLifetimeFreeFlow
            isDark={isDark}
            userName={pendingStats?.userName}
            onComplete={() => {
              if (pendingStats) {
                onAuthenticated(pendingStats);
              } else {
                onAuthenticated({
                  ...initialZeroStats,
                  isLoggedIn: true,
                  hasCompletedWelcome: true,
                });
              }
            }}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FORGOT PASSWORD MODAL (MULTI-STEP SECURE OTP & RESET)                  */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <ForgotPasswordModal
          isDark={isDark}
          initialEmail={forgotEmail}
          onClose={() => setShowForgotModal(false)}
          onSuccess={(resetEmail) => {
            setShowForgotModal(false);
            setLoginEmail(resetEmail);
            setView('login');
          }}
        />
      )}

      {showAlnoorCredentialsModal && (
        <AlnoorCredentialsBackupModal
          isOpen={showAlnoorCredentialsModal}
          onClose={handleCredentialsBackupComplete}
          isDark={isDark}
          userStats={initialZeroStats}
          initialEmail={activeAuthAccount?.email}
          initialName={activeAuthAccount?.name}
        />
      )}
    </div>
  );
};
