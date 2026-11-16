import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Shuffle,
  FileText,
  Upload,
  ArrowRight,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Subject, Topic, Flashcard, FlashcardRating } from '../../types/study';
import {
  saveFlashcard,
  saveBatchFlashcards,
  deleteFlashcard,
  rateFlashcard,
  loadStudyData,
} from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface FlashcardsViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

type StudyFilterMode = 'review' | 'difficult' | 'random' | 'recent' | 'manage';

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [filterMode, setFilterMode] = useState<StudyFilterMode>('review');
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Add Form State
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');

  // AI Gen Form State
  const [aiSourceMode, setAiSourceMode] = useState<'topic' | 'text' | 'file'>('topic');
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [aiCardCount, setAiCardCount] = useState(5);
  const [aiFileAttachment, setAiFileAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load latest cards from storage
  const [allCards, setAllCards] = useState<Flashcard[]>(() => {
    return loadStudyData().flashcards;
  });

  const reloadCards = () => {
    const updated = loadStudyData().flashcards;
    setAllCards(updated);
    onRefreshData?.();
  };

  // Filter cards by subject and topic
  const subjectCards = useMemo(() => {
    return allCards.filter((c) => {
      if (c.subjectId !== selectedSubject.id) return false;
      if (selectedTopic && c.topicId && c.topicId !== selectedTopic.id) return false;
      return true;
    });
  }, [allCards, selectedSubject.id, selectedTopic]);

  // Apply active deck mode
  const activeDeck = useMemo(() => {
    if (filterMode === 'difficult') {
      return subjectCards.filter((c) => c.difficulty === 'again' || c.difficulty === 'hard');
    }
    if (filterMode === 'recent') {
      return [...subjectCards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (filterMode === 'random') {
      return [...subjectCards].sort(() => Math.random() - 0.5);
    }
    // 'review' mode: cards due or not yet reviewed
    return subjectCards;
  }, [subjectCards, filterMode]);

  const currentCard = activeDeck[currentIndex];

  const handleRate = (rating: FlashcardRating) => {
    if (!currentCard) return;
    rateFlashcard(currentCard.id, rating);
    reloadCards();
    setIsFlipped(false);
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFront.trim() || !manualBack.trim()) return;

    saveFlashcard({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      front: manualFront.trim(),
      back: manualBack.trim(),
    });

    setManualFront('');
    setManualBack('');
    setShowAddModal(false);
    reloadCards();
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch(getApiUrl('/api/study/generate-flashcards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          text: aiTextPrompt.trim() || undefined,
          attachment: aiFileAttachment,
          count: aiCardCount,
        }),
      });

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        saveBatchFlashcards(
          data.flashcards.map((fc: { front: string; back: string }) => ({
            front: fc.front,
            back: fc.back,
            subjectId: selectedSubject.id,
            topicId: selectedTopic?.id,
          }))
        );
        reloadCards();
        setShowGenerateModal(false);
        setAiTextPrompt('');
        setAiFileAttachment(null);
      } else {
        setGenerateError(data.error || 'No flashcards generated. Please try a different prompt.');
      }
    } catch (err) {
      console.error(err);
      setGenerateError('Failed to connect to flashcard generator. Please check your network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAiFileAttachment({
        data: reader.result as string,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Deck Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
            <Layers className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>Flashcards</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            Spaced repetition mastery for {selectedSubject.name}{' '}
            {selectedTopic ? `• ${selectedTopic.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.08] text-stone-200 bg-[#1B1D23]'
                : 'border-black/[0.08] hover:bg-black/[0.04] text-[#111214] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generate</span>
          </button>
        </div>
      </div>

      {/* Mode Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'review' as StudyFilterMode, label: 'Review Deck', icon: Layers },
          { id: 'difficult' as StudyFilterMode, label: 'Difficult Cards', icon: AlertCircle },
          { id: 'random' as StudyFilterMode, label: 'Random Shuffle', icon: Shuffle },
          { id: 'recent' as StudyFilterMode, label: 'Recently Created', icon: Clock },
          { id: 'manage' as StudyFilterMode, label: 'Manage All Cards', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterMode(tab.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium shrink-0 border transition-all ${
                isActive
                  ? isDark
                    ? 'bg-white text-[#111214] border-white font-bold'
                    : 'bg-[#111214] text-white border-[#111214] font-bold'
                  : isDark
                  ? 'bg-[#1B1D23] text-stone-300 hover:text-white border-white/[0.08]'
                  : 'bg-[#F3F3F1] text-[#3F4248] hover:text-[#111214] border-black/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'difficult' && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'
                }`}>
                  {
                    subjectCards.filter(
                      (c) => c.difficulty === 'again' || c.difficulty === 'hard'
                    ).length
                  }
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Flashcard Study View */}
      {filterMode !== 'manage' ? (
        activeDeck.length === 0 ? (
          <div
            className={`p-12 text-center rounded-3xl border ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 ${
              isDark
                ? 'bg-white/[0.08] text-white border-white/[0.12]'
                : 'bg-black/[0.04] text-[#111214] border-black/[0.08]'
            }`}>
              <Layers className="w-6 h-6" />
            </div>
            <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>No Flashcards in this Deck</h3>
            <p className={`text-xs max-w-sm mx-auto mb-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {filterMode === 'difficult'
                ? 'No cards are marked as difficult. Great job retaining this material!'
                : 'Create cards manually or let AI generate active-recall cards from your study notes or textbook.'}
            </p>
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              Generate Cards with AI
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Progress / Remaining stats */}
            <div className={`flex items-center justify-between text-xs px-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              <span>
                Card <strong className={`font-mono ${isDark ? 'text-white' : 'text-[#111214]'}`}>{currentIndex + 1}</strong> of{' '}
                <span className="font-mono">{activeDeck.length}</span>
              </span>
              <span className="font-mono">
                {activeDeck.length - (currentIndex + 1)} remaining in session
              </span>
            </div>

            {/* The Flashcard (Interactive Flip) */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative min-h-[320px] sm:min-h-[360px] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer border transition-all duration-300 select-none ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.1] hover:border-white/30 text-[#F3F4F6] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                  : 'bg-white border-black/[0.1] hover:border-[#111214]/40 text-[#111214] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
            >
              {/* Badge indicating Front / Back */}
              <div className={`absolute top-5 left-5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                isDark
                  ? 'bg-white/[0.06] text-stone-300 border-white/[0.08]'
                  : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
              }`}>
                {isFlipped ? 'Answer / Explanation' : 'Question / Concept'}
              </div>

              {/* Tap to flip hint */}
              <div className={`absolute top-5 right-5 flex items-center gap-1 text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap to flip</span>
              </div>

              {/* Card Content */}
              <div className="space-y-4 max-w-lg">
                {!isFlipped ? (
                  <div>
                    <h3 className={`text-lg sm:text-xl font-bold leading-relaxed ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                      {currentCard?.front}
                    </h3>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${isDark ? 'text-stone-200' : 'text-[#3F4248]'}`}>
                      {currentCard?.back}
                    </p>
                  </div>
                )}
              </div>

              {!isFlipped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(true);
                  }}
                  className={`mt-8 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-white/[0.08] text-white border-white/[0.14] hover:bg-white/[0.14]'
                      : 'bg-[#F3F3F1] text-[#111214] border-black/[0.1] hover:bg-black/[0.06]'
                  }`}
                >
                  Show Answer
                </button>
              )}
            </div>

            {/* Spaced Repetition Rating Buttons */}
            {isFlipped && (
              <div className={`p-4 rounded-2xl border space-y-2 animate-fadeIn ${
                isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
              }`}>
                <p className={`text-center text-xs font-semibold mb-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  Rate your recall difficulty:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate('again')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isDark
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                    }`}
                  >
                    <span>Again</span>
                    <span className={`text-[10px] opacity-80 font-mono ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>&lt; 10m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('hard')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isDark
                        ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30 text-sky-300'
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700'
                    }`}
                  >
                    <span>Hard</span>
                    <span className={`text-[10px] opacity-80 font-mono ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>1 day</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('good')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isDark
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                    }`}
                  >
                    <span>Good</span>
                    <span className={`text-[10px] opacity-80 font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>3 days</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('easy')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isDark
                        ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.14] text-white'
                        : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.1] text-[#111214]'
                    }`}
                  >
                    <span>Easy</span>
                    <span className={`text-[10px] opacity-80 font-mono ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>7 days</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Management Table of All Cards */
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`p-4 border-b flex items-center justify-between text-xs ${
            isDark ? 'border-white/[0.08] text-stone-400' : 'border-black/[0.08] text-[#5A5D63]'
          }`}>
            <span>Total Cards: {subjectCards.length}</span>
          </div>

          {subjectCards.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>No cards created yet.</div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-white/[0.08]' : 'divide-black/[0.08]'}`}>
              {subjectCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <p className={`font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{card.front}</p>
                    <p className={`line-clamp-2 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>{card.back}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        card.difficulty === 'again'
                          ? isDark
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-rose-50 text-rose-700'
                          : card.difficulty === 'hard'
                          ? isDark
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-sky-50 text-sky-700'
                          : card.difficulty === 'good'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-700'
                          : isDark
                          ? 'bg-white/[0.1] text-stone-200'
                          : 'bg-black/[0.06] text-[#111214]'
                      }`}
                    >
                      {card.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        deleteFlashcard(card.id);
                        reloadCards();
                      }}
                      className={`p-1.5 transition-colors ${
                        isDark ? 'text-stone-400 hover:text-rose-400' : 'text-[#6B6F76] hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
              isDark
                ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
                : 'bg-white border-black/[0.1] text-[#111214]'
            }`}
          >
            <h3 className="text-base font-bold mb-1">Add Flashcard</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Saving to: {selectedSubject.name} {selectedTopic ? `• ${selectedTopic.name}` : ''}
            </p>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  Front (Question / Prompt)
                </label>
                <textarea
                  required
                  rows={2}
                  value={manualFront}
                  onChange={(e) => setManualFront(e.target.value)}
                  placeholder="e.g. What is the primary function of ribosomes?"
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6]'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  Back (Answer / Explanation)
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualBack}
                  onChange={(e) => setManualBack(e.target.value)}
                  placeholder="e.g. Ribosomes perform protein synthesis by translating mRNA into amino acid polypeptide chains."
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6]'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 text-xs font-medium ${
                    isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Flashcards Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
              isDark
                ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
                : 'bg-white border-black/[0.1] text-[#111214]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <h3 className="text-base font-bold">Generate Active-Recall Flashcards</h3>
            </div>
            <p className={`text-xs mb-4 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              AI creates high-yield cards with key definitions, formulas, and concepts.
            </p>

            <form onSubmit={handleAiGenerate} className="space-y-4">
              {/* Source tabs */}
              <div className={`flex items-center gap-2 p-1 rounded-xl text-xs border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}>
                <button
                  type="button"
                  onClick={() => setAiSourceMode('topic')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'topic'
                      ? isDark
                        ? 'bg-white text-[#111214] font-bold'
                        : 'bg-[#111214] text-white font-bold'
                      : isDark
                      ? 'text-stone-400 hover:text-white'
                      : 'text-[#5A5D63] hover:text-[#111214]'
                  }`}
                >
                  Topic Core
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceMode('text')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'text'
                      ? isDark
                        ? 'bg-white text-[#111214] font-bold'
                        : 'bg-[#111214] text-white font-bold'
                      : isDark
                      ? 'text-stone-400 hover:text-white'
                      : 'text-[#5A5D63] hover:text-[#111214]'
                  }`}
                >
                  Paste Notes
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceMode('file')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'file'
                      ? isDark
                        ? 'bg-white text-[#111214] font-bold'
                        : 'bg-[#111214] text-white font-bold'
                      : isDark
                      ? 'text-stone-400 hover:text-white'
                      : 'text-[#5A5D63] hover:text-[#111214]'
                  }`}
                >
                  Upload PDF/Image
                </button>
              </div>

              {aiSourceMode === 'topic' && (
                <div className={`p-3 rounded-xl border text-xs ${
                  isDark
                    ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300'
                    : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248]'
                }`}>
                  Will generate cards based on: <strong>{selectedTopic?.name || selectedSubject.name}</strong>
                </div>
              )}

              {aiSourceMode === 'text' && (
                <textarea
                  rows={4}
                  value={aiTextPrompt}
                  onChange={(e) => setAiTextPrompt(e.target.value)}
                  placeholder="Paste lecture notes, study guide text, or textbook excerpt here..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6]'
                      : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
                  }`}
                />
              )}

              {aiSourceMode === 'file' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className={`text-xs ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}
                  />
                  {aiFileAttachment && (
                    <div className={`p-2 rounded-lg border text-xs ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    }`}>
                      Attached: {aiFileAttachment.name}
                    </div>
                  )}
                </div>
              )}

              {/* Card Count Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>Number of Cards:</span>
                <div className="flex items-center gap-1.5">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAiCardCount(num)}
                      className={`px-3 py-1 rounded-lg border font-mono font-bold transition-all ${
                        aiCardCount === num
                          ? isDark
                            ? 'bg-white text-[#111214] border-white'
                            : 'bg-[#111214] text-white border-[#111214]'
                          : isDark
                          ? 'border-white/[0.08] text-stone-400 hover:text-white'
                          : 'border-black/[0.08] text-[#5A5D63] hover:text-[#111214]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {generateError && (
                <div className={`p-3 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-rose-50 border-rose-300 text-rose-700'
                }`}>
                  {generateError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className={`px-4 py-2 text-xs font-medium ${
                    isDark ? 'text-stone-400 hover:text-white' : 'text-[#5A5D63] hover:text-[#111214]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl disabled:opacity-40 transition-colors ${
                    isDark
                      ? 'bg-white hover:bg-stone-200 text-[#111214]'
                      : 'bg-[#111214] hover:bg-[#27292D] text-white'
                  }`}
                >
                  {isGenerating ? 'Analyzing & Generating...' : 'Generate Flashcards'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
