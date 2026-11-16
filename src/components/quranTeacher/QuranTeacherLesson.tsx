import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Ayah, Surah } from '../../types';
import {
  QuranTeacherState,
  QuranTeacherMode,
  RecitationEvaluationResult,
  QuranTeacherVoiceId,
  QuranTeacherLanguage,
} from '../../types/quranTeacher';
import { QuranTeacherWaveform } from './QuranTeacherWaveform';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherLessonProps {
  isDark: boolean;
  surah: Surah;
  ayahs: Ayah[];
  currentAyahIndex: number;
  state: QuranTeacherState;
  mode: QuranTeacherMode;
  audioLevel: number;
  frequencyData?: Uint8Array | null;
  teacherMessage: string;
  spokenTranscript: string;
  lastEvaluation: RecitationEvaluationResult | null;
  isMuted: boolean;
  teacherVoice?: QuranTeacherVoiceId;
  teacherLanguage?: QuranTeacherLanguage;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRepeatInstruction: () => void;
  onRepeatCurrentAyah: () => void;
  onExitLesson: () => void;
  onReturnToSetup?: () => void;
}

export const QuranTeacherLesson: React.FC<QuranTeacherLessonProps> = ({
  isDark,
  surah,
  ayahs,
  currentAyahIndex,
  state,
  mode,
  audioLevel,
  frequencyData,
  teacherMessage,
  spokenTranscript,
  lastEvaluation,
  isMuted,
  teacherVoice = 'Fenrir',
  teacherLanguage = 'ar',
  onToggleMute,
  onTogglePause,
  onRepeatInstruction,
  onRepeatCurrentAyah,
  onExitLesson,
  onReturnToSetup,
}) => {
  const isArabic = getLanguageCode() === 'ar' || teacherLanguage === 'ar';
  const currentAyah = ayahs[currentAyahIndex] || ayahs[0];
  const progressPercent = Math.round(((currentAyahIndex + 1) / ayahs.length) * 100);

  // Status Indicator details
  const getStatusBadge = () => {
    switch (state) {
      case 'ai_speaking':
        return {
          label: isArabic ? 'المعلم يتلو الآية المباركة...' : 'AI Teacher Speaking',
          color: isDark ? 'bg-white/[0.1] text-white border-white/25' : 'bg-[#111214]/[0.06] text-[#111214] border-[#111214]/25',
          icon: Volume2,
          pulse: true,
        };
      case 'listening':
        return {
          label: audioLevel > 0.08
            ? (isArabic ? 'نور يستمع لتلاوتك الكريمة...' : 'Listening to Recitation...')
            : (isArabic ? 'دورك الآن · اتلُ الآية المباركة' : 'Your Turn · Recite Now'),
          color: audioLevel > 0.08
            ? isDark
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : isDark
            ? 'bg-white/[0.1] text-white border-white/25'
            : 'bg-[#111214]/[0.06] text-[#111214] border-[#111214]/25',
          icon: Mic,
          pulse: true,
        };
      case 'evaluating':
        return {
          label: isArabic ? 'تحليل التلاوة وتأكيد الحفظ...' : 'Analyzing Recitation...',
          color: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300',
          icon: Sparkles,
          pulse: true,
        };
      case 'paused':
        return {
          label: isArabic ? 'الجلسة متوقفة مؤقتاً' : 'Lesson Paused',
          color: isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.1]',
          icon: Pause,
          pulse: false,
        };
      default:
        return {
          label: isArabic ? 'جاهز للتلاوة' : 'Ready',
          color: isDark ? 'bg-[#1B1D23] text-stone-300 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.1]',
          icon: Mic,
          pulse: false,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  const teacherDisplayName = isArabic
    ? (teacherVoice === 'Fenrir' ? 'الأستاذ راشد' : teacherVoice === 'Kore' ? 'الأستاذة مريم' : 'الشيخ طارق')
    : (teacherVoice === 'Fenrir' ? 'Ustadh Rashid' : teacherVoice === 'Kore' ? 'Ustadha Maryam' : 'Sheikh Tariq');

  const modeDisplayName = isArabic
    ? (mode === 'learn' ? 'تعلّم وتلقين' : mode === 'practice' ? 'تسميع وممارسة' : 'مراجعة وتثبيت')
    : `${mode} Mode`;

  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-[36px] border shadow-md overflow-hidden flex flex-col transition-all duration-200 ${
        isDark
          ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      {/* Top Navigation Bar */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-serif-heading font-bold text-xs ${
              isDark
                ? 'bg-[#1B1D23] text-white border-white/[0.1]'
                : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}
          >
            {surah.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide">
                {isArabic ? `سورة ${surah.name}` : `Surah ${surah.englishName}`}
              </span>
              {!isArabic && (
                <span className={`text-xs font-arabic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {surah.name}
                </span>
              )}
            </div>
            <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              <span>{isArabic ? `الآية ${currentAyah.numberInSurah} من أصل ${surah.numberOfAyahs} آية` : `Ayah ${currentAyah.numberInSurah} of ${surah.numberOfAyahs}`}</span>
              <span>•</span>
              <span>{modeDisplayName}</span>
              <span>•</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-[#111214]'}`}>{teacherDisplayName}</span>
            </div>
          </div>
        </div>

        {/* Progress & Exit */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className={`text-[11px] font-mono font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? `${currentAyahIndex + 1} من ${ayahs.length} آيات` : `${currentAyahIndex + 1} / ${ayahs.length} Ayahs`}
            </span>
            <div className={`w-24 h-1.5 rounded-full overflow-hidden mt-1 border ${isDark ? 'bg-white/[0.08] border-white/[0.1]' : 'bg-black/[0.08] border-black/[0.08]'}`}>
              <div
                className={`h-full transition-all duration-200 ${isDark ? 'bg-white' : 'bg-[#111214]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {onReturnToSetup && (
            <button
              type="button"
              onClick={onReturnToSetup}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.1] text-stone-300 hover:text-white hover:bg-white/[0.08]'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248] hover:text-[#111214] hover:bg-black/[0.06]'
              }`}
              title={isArabic ? 'تغيير إعدادات الجلسة' : 'Session Settings'}
            >
              <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitLesson}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/35'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
            }`}
            title={isArabic ? 'خروج من المعلم والعودة للمصحف' : 'Exit Lesson and return to reader'}
          >
            <X className="w-4 h-4" />
            <span className="font-medium">{isArabic ? 'خروج' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Main Lesson Stage */}
      <div className="p-6 sm:p-10 flex flex-col items-center justify-between min-h-[460px]">
        {/* Status Indicator & Teacher Persona Badge */}
        <div className="flex items-center flex-wrap justify-center gap-2 mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusBadge.color}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${statusBadge.pulse ? 'animate-pulse' : ''}`} />
            <span>{statusBadge.label}</span>
          </span>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/[0.06] text-[#F3F4F6] border-white/[0.1]'
                : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>{teacherDisplayName}</span>
          </span>

          {isMuted && (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                isDark
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-red-50 text-red-700 border-red-300'
              }`}
            >
              {isArabic ? 'الصوت مكتوم' : 'AI Audio Muted'}
            </span>
          )}
        </div>

        {/* Authentic Quran Ayah Card */}
        <div className={`w-full max-w-3xl my-auto text-center px-4 py-8 sm:py-10 rounded-3xl relative overflow-hidden border ${
          isDark ? 'bg-[#0B0C0E] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
        }`}>
          {currentAyah.numberInSurah === 1 && surah.number !== 9 && surah.number !== 1 && (
            <div className={`font-arabic text-xl sm:text-2xl mb-6 select-none ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}

          <div
            className={`font-arabic text-3xl sm:text-4xl md:text-5xl leading-[2.2] sm:leading-[2.3] transition-all tracking-normal ${
              isDark ? 'text-white' : 'text-[#111214]'
            }`}
            dir="rtl"
          >
            {currentAyah.text}
            <span
              className={`inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 mx-2 rounded-full border text-xs sm:text-sm font-sans font-bold align-middle ${
                isDark ? 'border-white/[0.15] text-white bg-[#1B1D23]' : 'border-black/[0.12] text-[#111214] bg-[#F3F3F1]'
              }`}
            >
              {currentAyah.numberInSurah}
            </span>
          </div>

          {!isArabic && currentAyah.translation && (
            <p
              className={`mt-6 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed ${
                isDark ? 'text-stone-300' : 'text-[#3F4248]'
              }`}
            >
              "{currentAyah.translation}"
            </p>
          )}

          {spokenTranscript && (
            <div
              className={`mt-5 inline-block px-4 py-2 rounded-2xl border text-xs max-w-lg ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.1] text-white'
                  : 'bg-white border-black/[0.1] text-[#111214]'
              }`}
            >
              <span className={`text-[10px] uppercase font-mono block mb-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{isArabic ? 'ما تم سماعه:' : 'Heard:'}</span>
              <span className="font-arabic text-sm">{spokenTranscript}</span>
            </div>
          )}
        </div>

        {/* Real-time Reactive Waveform */}
        <div className="w-full max-w-md my-4">
          <QuranTeacherWaveform
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            isActive={state === 'listening'}
            isDark={isDark}
            state={state}
          />
        </div>

        {/* Teacher Instruction Bubble */}
        <div
          className={`w-full max-w-xl p-4 sm:p-5 rounded-2xl border text-center transition-all duration-200 shadow-sm ${
            isDark
              ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
              : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
          }`}
        >
          <div className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>{isArabic ? `توجيه ${teacherDisplayName}` : `${teacherDisplayName} Feedback`}</span>
          </div>

          <p className={`text-sm font-medium leading-relaxed font-arabic text-base sm:text-lg my-1 ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
            {teacherLanguage === 'ar' && lastEvaluation?.spokenFeedbackInstructionAr
              ? lastEvaluation.spokenFeedbackInstructionAr
              : teacherMessage || 'السَّلامُ عَلَيْكُمْ. تَفَضَّلْ بِالتِّلَاوَةِ حِينَ تَكُونُ مُسْتَعِدًّا.'}
          </p>

          {teacherLanguage !== 'ar' && teacherMessage && (
            <p className={`text-xs font-sans mt-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{teacherMessage}</p>
          )}

          {lastEvaluation && !lastEvaluation.isCorrect && (
            <div className={`mt-3 pt-2.5 border-t text-xs ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              {lastEvaluation.missingWords.length > 0 && (
                <div className={`font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                  <span>{isArabic ? 'كلمات ساقطة من التلاوة: ' : 'Missing: '}</span>
                  <span className="font-arabic font-bold text-sm">{lastEvaluation.missingWords.join(' · ')}</span>
                </div>
              )}
              {lastEvaluation.incorrectWords.length > 0 && (
                <div className={`mt-1 font-medium ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                  <span>{isArabic ? 'الصواب: ' : 'Expected: '}</span>
                  <span className="font-arabic font-bold text-sm">{lastEvaluation.incorrectWords[0].expected}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className={`px-6 py-4 border-t flex items-center justify-between gap-2 flex-wrap ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              state === 'paused'
                ? isDark
                  ? 'bg-white text-[#111214] border-white'
                  : 'bg-[#111214] text-white border-[#111214]'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-stone-300 hover:text-white'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#3F4248] hover:text-[#111214]'
            }`}
          >
            {state === 'paused' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{state === 'paused' ? (isArabic ? 'متابعة' : 'Resume') : (isArabic ? 'إيقاف مؤقت' : 'Pause')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs border transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-stone-300 hover:text-white'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#3F4248] hover:text-[#111214]'
            }`}
            title={isMuted ? (isArabic ? 'تشغيل صوت المعلم' : 'Unmute AI voice') : (isArabic ? 'كتم صوت المعلم' : 'Mute AI voice')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onExitLesson}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'text-rose-400 border-rose-500/30 hover:bg-rose-500/15'
                : 'text-rose-700 border-rose-300 hover:bg-rose-50'
            }`}
            title={isArabic ? 'إنهاء جلسة التسميع والخروج' : 'Exit lesson and return to reader'}
          >
            <X className="w-3.5 h-3.5" />
            <span>{isArabic ? 'خروج' : 'Exit'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRepeatInstruction}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-stone-300 hover:text-white'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#3F4248] hover:text-[#111214]'
            }`}
            title={isArabic ? 'إعادة توجيه المعلم' : "Repeat teacher's instruction"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة التوجيه' : 'Repeat Instruction'}</span>
          </button>

          <button
            type="button"
            onClick={onRepeatCurrentAyah}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.12] text-white hover:bg-white/[0.1]'
                : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] hover:bg-black/[0.06]'
            }`}
            title={isArabic ? 'إعادة الاستماع للآية الحالية' : 'Repeat current ayah from beginning'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة الآية' : 'Repeat Ayah'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
