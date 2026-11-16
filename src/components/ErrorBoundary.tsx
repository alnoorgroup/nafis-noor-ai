import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NOOR ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isDark = typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : true;
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
        }`}>
          <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-6 ${
            isDark ? 'bg-[#14161A] border-white/[0.1]' : 'bg-white border-black/[0.08]'
          }`}>
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-sm ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className={`text-xl sm:text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                NOOR Islamic Companion
              </h1>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                A browser display update is ready. Please tap below to refresh NOOR and view the latest features.
              </p>
            </div>

            {this.state.error && (
              <div className={`p-3 rounded-xl border text-left overflow-x-auto max-h-32 text-[11px] font-mono ${
                isDark ? 'bg-black/50 border-white/10 text-stone-400' : 'bg-[#F3F3F1] border-black/[0.08] text-[#6B6F76]'
              }`}>
                {this.state.error.message || 'Unknown display error'}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-white text-[#111214] hover:bg-stone-200'
                    : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh NOOR</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-stone-300'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.08] text-[#3F4248]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Browser Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
