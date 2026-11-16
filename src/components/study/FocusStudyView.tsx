import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle,
  HelpCircle,
  BookmarkPlus,
  Send,
  Sparkles,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { recordFocusStudySession, saveStudyNote } from '../../utils/studyStorage';

interface FocusStudyViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const FocusStudyView: React.FC<FocusStudyViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [taskGoal, setTaskGoal] = useState(
    selectedTopic ? `Master ${selectedTopic.name}` : `Study ${selectedSubject.name}`
  );
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  // In-session tools
  const [quickNote, setQuickNote] = useState('');
  const [quickNoteSaved, setQuickNoteSaved] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Web Audio Context for calm ambient tone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setSecondsRemaining(durationMinutes * 60);
  }, [durationMinutes]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      handleFinishSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  const handleFinishSession = () => {
    recordFocusStudySession(
      durationMinutes,
      taskGoal,
      selectedSubject.id,
      selectedTopic?.id
    );
    stopAmbientSound();
    setCompletionNotice(`Focus session complete! Masha'Allah, you studied for ${durationMinutes} minutes.`);
    setTimeout(() => setCompletionNotice(null), 6000);
    onRefreshData?.();
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning && ambientSound) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(durationMinutes * 60);
    stopAmbientSound();
  };

  // Calm Ambient Sound using AudioContext
  const startAmbientSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create gentle, warm low-frequency drone (174Hz calm healing tone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(174, ctx.currentTime);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainRef.current = gain;
      setAmbientSound(true);
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  };

  const stopAmbientSound = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      setAmbientSound(false);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveQuickNote = () => {
    if (!quickNote.trim()) return;
    saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: `Focus Note: ${taskGoal}`,
      content: quickNote.trim(),
      tags: ['Focus Mode', 'In-session'],
    });
    setQuickNoteSaved(true);
    setQuickNote('');
    onRefreshData?.();
    setTimeout(() => setQuickNoteSaved(false), 2500);
  };

  const handleAskQuickQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;

    setIsAnswering(true);
    try {
      const res = await fetch('/api/study/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `I am in deep focus mode studying "${taskGoal}". Give me an ultra-concise 2-sentence direct answer to this quick question so I don't get distracted: "${quickQuestion}"`,
            },
          ],
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
        }),
      });

      const data = await res.json();
      setQuickAnswer(data.reply || 'No answer available.');
    } catch (err) {
      console.error(err);
      setQuickAnswer('Error querying quick tutor. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  };

  // Format time MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-6 sm:p-12 overflow-y-auto flex flex-col justify-between ' +
            (isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]')
          : 'space-y-6'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
            <Timer className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>Focus Study Mode</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            Distraction-free environment with ambient acoustics and instant in-session reference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient sound toggle */}
          <button
            type="button"
            onClick={() => (ambientSound ? stopAmbientSound() : startAmbientSound())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              ambientSound
                ? isDark
                  ? 'bg-white text-[#111214] border-white'
                  : 'bg-[#111214] text-white border-[#111214]'
                : isDark
                ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:text-white'
                : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:text-[#111214]'
            }`}
          >
            {ambientSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{ambientSound ? 'Ambient 174Hz On' : 'Ambient Sound'}</span>
          </button>

          {/* Fullscreen distraction-free toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isDark
                ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:text-white'
                : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:text-[#111214]'
            }`}
            title="Distraction Free Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {completionNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-fadeIn ${
          isDark
            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <span>{completionNotice}</span>
          <button
            type="button"
            onClick={() => setCompletionNotice(null)}
            className={`ml-2 ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-[#5A5D63] hover:text-[#111214]'}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Focus Container */}
      <div className="max-w-2xl mx-auto w-full space-y-8 text-center my-auto py-6">
        {/* Goal Input */}
        <div>
          <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            Current Study Task
          </label>
          <input
            type="text"
            value={taskGoal}
            onChange={(e) => setTaskGoal(e.target.value)}
            placeholder="What is your focus target right now?"
            className={`text-lg sm:text-2xl font-extrabold text-center bg-transparent outline-none border-b pb-1 w-full max-w-md mx-auto transition-colors ${
              isDark
                ? 'border-white/[0.1] focus:border-white text-[#F3F4F6]'
                : 'border-black/[0.1] focus:border-[#111214] text-[#111214]'
            }`}
          />
        </div>

        {/* Timer Display */}
        <div className="relative inline-flex items-center justify-center">
          <div className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 flex flex-col items-center justify-center relative ${
            isDark
              ? 'border-white/[0.08] bg-[#14161A] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}>
            {/* Countdown string */}
            <span className={`text-6xl sm:text-7xl font-mono font-extrabold tracking-tight ${
              isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
            }`}>
              {timeFormatted}
            </span>
            <span className={`text-xs uppercase font-bold mt-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isRunning ? 'Deep Focus Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Presets & Controls */}
        <div className="space-y-4">
          {!isRunning && (
            <div className="flex items-center justify-center gap-2">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    durationMinutes === m
                      ? isDark
                        ? 'bg-white text-[#111214] border-white'
                        : 'bg-[#111214] text-white border-[#111214]'
                      : isDark
                      ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:text-white'
                      : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:text-[#111214]'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-colors ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isRunning ? 'Pause Session' : 'Start Focus'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={`p-3.5 rounded-2xl border transition-colors ${
                isDark
                  ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:text-white'
                  : 'border-black/[0.08] bg-white text-[#3F4248] hover:text-[#111214]'
              }`}
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Session Tools (Quick Notes & Quick Question) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6 border-t max-w-xl mx-auto ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          {/* Quick Scratchpad */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>Quick Scratchpad</span>
              <button
                type="button"
                onClick={handleSaveQuickNote}
                disabled={!quickNote.trim()}
                className={`text-[11px] font-bold hover:underline disabled:opacity-30 ${
                  isDark ? 'text-white' : 'text-[#111214]'
                }`}
              >
                Save
              </button>
            </div>
            <textarea
              rows={3}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Jot down a quick thought without breaking flow..."
              className={`w-full p-2 rounded-xl text-xs outline-none border resize-none ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
              }`}
            />
            {quickNoteSaved && (
              <span className={`text-[10px] mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Saved to notes!</span>
            )}
          </div>

          {/* Quick AI Answer */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <span className={`text-xs font-bold block mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Instant Doubt Solver
            </span>
            <form onSubmit={handleAskQuickQuestion} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder="Ask 1 quick question..."
                  className={`flex-1 p-2 rounded-xl text-xs outline-none border ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isAnswering || !quickQuestion.trim()}
                  className={`p-2 rounded-xl disabled:opacity-40 transition-colors ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {quickAnswer && (
              <div className={`mt-2 p-2 rounded-xl border text-[11px] leading-relaxed ${
                isDark
                  ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#3F4248]'
              }`}>
                {quickAnswer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
