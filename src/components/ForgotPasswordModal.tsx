import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  KeyRound,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Lock,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface ForgotPasswordModalProps {
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
  isDark?: boolean;
}

type ResetStep = 'email' | 'otp' | 'new-password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  initialEmail = '',
  onClose,
  onSuccess,
  isDark = true,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(true, 'forgot-password-modal');

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security token issued upon successful OTP verification
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Resend cooldown timer (in seconds)
  const [cooldown, setCooldown] = useState<number>(0);

  // Input refs for 6 individual digit input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first digit box when stepping into verification
  useEffect(() => {
    if (step === 'otp') {
      const firstInput = otpInputRefs.current[0];
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 150);
      }
    }
  }, [step]);

  // =========================================================================
  // STEP 1 & 2: EMAIL INPUT & ACCOUNT VERIFICATION
  // =========================================================================
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsAccountNotFound(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordResetOtp(cleanEmail);
      if (res.success) {
        setCooldown(res.cooldownSeconds || 30);
        setStatusMessage('We sent a 6-digit verification code to your email.');
        // Advance to Step 3 (Verification Code)
        setTimeout(() => {
          setStep('otp');
          setIsLoading(false);
        }, 300);
      } else {
        if (res.notFound) {
          setIsAccountNotFound(true);
          setErrorMessage("We couldn't find a Noor account with that email.");
        } else {
          setErrorMessage(res.error || "Unable to send verification code. Please try again.");
        }
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('An unexpected network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // =========================================================================
  // STEP 3 & 4: 6-DIGIT OTP ENTRY & VERIFICATION
  // =========================================================================
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    // Handle copy-paste of complete 6 digits
    if (cleaned.length >= 6) {
      const parts = cleaned.slice(0, 6).split('');
      setOtpValues(parts);
      const lastInput = otpInputRefs.current[5];
      if (lastInput) lastInput.focus();
      return;
    }

    // Single digit entry
    const singleDigit = cleaned.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = singleDigit;
    setOtpValues(newOtp);

    // Auto-advance to next box
    if (index < 5 && singleDigit) {
      const nextInput = otpInputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = otpInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const enteredCode = otpValues.join('');
    if (enteredCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyPasswordResetOtp(email, enteredCode);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setStatusMessage('Code verified successfully.');
        // Advance to Step 5 (Set New Password)
        setTimeout(() => {
          setStep('new-password');
          setIsLoading(false);
        }, 300);
      } else {
        if (res.expired) {
          setErrorMessage('That verification code has expired. Request a new one.');
        } else {
          setErrorMessage(res.error || 'That verification code is incorrect. Try again.');
        }
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await requestPasswordResetOtp(email);
      if (res.success) {
        setCooldown(res.cooldownSeconds || 30);
        setStatusMessage('A new verification code has been sent to your email.');
        setOtpValues(['', '', '', '', '', '']);
        const firstInput = otpInputRefs.current[0];
        if (firstInput) firstInput.focus();
      } else {
        setErrorMessage(res.error || 'Could not resend code. Please wait.');
      }
    } catch {
      setErrorMessage('Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // STEP 5: CREATE NEW PASSWORD
  // =========================================================================
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormSubmittable = isLengthValid && isMatchValid && !isLoading;

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!resetToken) {
      setErrorMessage('Reset session invalid. Please verify your email first.');
      setStep('email');
      return;
    }

    if (!isLengthValid) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isMatchValid) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await completePasswordReset(email, resetToken, newPassword);
      if (res.success) {
        setStep('success');
      } else {
        setErrorMessage(res.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setErrorMessage('Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // STEP 6: RETURN TO LOGIN
  // =========================================================================
  const handleContinueToLogin = () => {
    onSuccess(email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 sm:p-7 relative border transition-all ${
          isDark
            ? 'bg-[#14161A] text-[#F3F4F6] border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85)]'
            : 'bg-white text-[#111214] border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isDark
              ? 'text-stone-400 hover:text-white hover:bg-white/10'
              : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.06]'
          }`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* STEP 1: EMAIL INPUT                                               */}
        {/* ----------------------------------------------------------------- */}
        {step === 'email' && (
          <div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3.5 ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <KeyRound className="w-6 h-6" />
            </div>

            <h3
              className={`text-center text-xl font-bold tracking-tight mb-1 ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}
            >
              Reset your password
            </h3>
            <p
              className={`text-center text-xs font-light leading-relaxed mb-5 ${
                isDark ? 'text-stone-400' : 'text-[#5A5D63]'
              }`}
            >
              Enter the email address connected to your Noor account.
            </p>

            {errorMessage && (
              <div className={`p-3 mb-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
                  {isAccountNotFound && (
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      Check for typos or create a new account from the sign up tab.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1.5 uppercase tracking-wider ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs border transition-all focus:outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-white placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking account...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 3 & 4: ENTER VERIFICATION CODE                               */}
        {/* ----------------------------------------------------------------- */}
        {step === 'otp' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>
              <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Step 2 of 3</span>
            </div>

            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3.5 ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3
              className={`text-center text-xl font-bold tracking-tight mb-1 ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}
            >
              Enter verification code
            </h3>
            <p
              className={`text-center text-xs font-light leading-relaxed mb-4 ${
                isDark ? 'text-stone-400' : 'text-[#5A5D63]'
              }`}
            >
              We sent a 6-digit code to:
              <span
                className={`font-medium block truncate mt-0.5 ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                {email}
              </span>
            </p>

            {statusMessage && (
              <div className={`p-2.5 mb-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <Check className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className={`p-2.5 mb-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 Individual Digit Boxes */}
              <div>
                <label
                  className={`block text-center text-[11px] font-semibold mb-2.5 uppercase tracking-wider ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Verification Code
                </label>
                <div className="flex items-center justify-center gap-2">
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border transition-all focus:outline-none ${
                        isDark
                          ? 'bg-[#1B1D23] text-white border-white/[0.12] focus:border-white/45'
                          : 'bg-[#F3F3F1] text-[#111214] border-black/[0.12] focus:border-[#111214]/45'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValues.join('').length !== 6}
                className={`w-full py-3.5 rounded-xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <span>Verify code</span>
                )}
              </button>

              {/* Resend Link with Countdown */}
              <div className="pt-2 text-center">
                <div
                  className={`text-xs flex items-center justify-center gap-1.5 ${
                    isDark ? 'text-stone-400' : 'text-[#5A5D63]'
                  }`}
                >
                  <span>Didn&apos;t receive the email?</span>
                  {cooldown > 0 ? (
                    <span
                      className={`font-mono text-xs font-semibold flex items-center gap-1 ${
                        isDark ? 'text-white' : 'text-[#111214]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Resend code in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className={`font-semibold hover:underline underline-offset-2 transition-all disabled:opacity-50 ${
                        isDark ? 'text-white' : 'text-[#111214]'
                      }`}
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 5: CREATE NEW PASSWORD                                      */}
        {/* ----------------------------------------------------------------- */}
        {step === 'new-password' && (
          <div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3.5 ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <Lock className="w-6 h-6" />
            </div>

            <h3
              className={`text-center text-xl font-bold tracking-tight mb-1 ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}
            >
              Create new password
            </h3>
            <p
              className={`text-center text-xs font-light leading-relaxed mb-4 ${
                isDark ? 'text-stone-400' : 'text-[#5A5D63]'
              }`}
            >
              Your new password must be different from previous passwords.
            </p>

            {errorMessage && (
              <div className={`p-2.5 mb-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCompleteReset} className="space-y-3.5">
              {/* New Password */}
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 uppercase tracking-wider ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-3.5 pr-10 py-3 rounded-xl text-xs border transition-all focus:outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-white placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 uppercase tracking-wider ${
                    isDark ? 'text-stone-300' : 'text-[#3F4248]'
                  }`}
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-3.5 pr-10 py-3 rounded-xl text-xs border transition-all focus:outline-none ${
                      isDark
                        ? 'bg-[#1B1D23] border-white/[0.1] text-white placeholder-stone-500 focus:border-white/35'
                        : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-[#111214]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div
                className={`p-3 rounded-xl space-y-1.5 text-xs border ${
                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isLengthValid
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDark
                        ? 'bg-white/10 text-stone-500'
                        : 'bg-black/10 text-[#6B6F76]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span
                    className={
                      isLengthValid
                        ? isDark
                          ? 'text-stone-200'
                          : 'text-[#111214]'
                        : isDark
                        ? 'text-stone-400'
                        : 'text-[#5A5D63]'
                    }
                  >
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isMatchValid
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDark
                        ? 'bg-white/10 text-stone-500'
                        : 'bg-black/10 text-[#6B6F76]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span
                    className={
                      isMatchValid
                        ? isDark
                          ? 'text-stone-200'
                          : 'text-[#111214]'
                        : isDark
                        ? 'text-stone-400'
                        : 'text-[#5A5D63]'
                    }
                  >
                    Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormSubmittable}
                className={`w-full mt-2 py-3.5 rounded-xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving password...</span>
                  </>
                ) : (
                  <span>Save password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 6: SUCCESS                                                  */}
        {/* ----------------------------------------------------------------- */}
        {step === 'success' && (
          <div className="text-center py-2 animate-fadeIn">
            {/* CSS Animated Checkmark */}
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping opacity-30" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-checkmark-wrapper">
                <svg
                  viewBox="0 0 52 52"
                  className="w-10 h-10"
                  aria-hidden="true"
                >
                  <circle
                    cx="26"
                    cy="26"
                    r="23"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-emerald-500/50 animate-checkmark-circle"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 27l7 7 15-15"
                    className="text-emerald-400 animate-checkmark-check"
                  />
                </svg>
              </div>
            </div>

            <h3
              className={`text-2xl font-bold tracking-tight mb-1.5 ${
                isDark ? 'text-white' : 'text-[#111214]'
              }`}
            >
              Password reset successful
            </h3>
            <p
              className={`text-xs font-light leading-relaxed mb-6 ${
                isDark ? 'text-stone-400' : 'text-[#5A5D63]'
              }`}
            >
              Your Noor account password has been updated. All your stats, streaks, and Quran progress have been preserved.
            </p>

            <button
              type="button"
              onClick={handleContinueToLogin}
              className={`w-full py-3.5 rounded-xl font-bold tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <span>Log in with new password</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
