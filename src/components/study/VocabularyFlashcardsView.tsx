import React, { useState } from 'react';
import {
  Layers,
  Volume2,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Search,
  BookMarked,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ARABIC_VOCABULARY_BANK, FLASHCARD_DECKS } from '../../data/arabicCurriculum';
import { ArabicVocabularyWord } from '../../types/arabic';
import { speakArabic } from '../../utils/arabicSpeech';
import { markWordPracticed, flagWeakVocabulary } from '../../utils/arabicStorage';

interface VocabularyFlashcardsViewProps {
  isDark: boolean;
  language?: string;
}

export const VocabularyFlashcardsView: React.FC<VocabularyFlashcardsViewProps> = ({ isDark, language }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'flashcards'>('flashcards');

  // Flashcards state
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsReviewed, setCardsReviewed] = useState<Record<string, 'easy' | 'hard' | 'again'>>({});

  // Vocabulary bank state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWordType, setSelectedWordType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentDeck = FLASHCARD_DECKS[currentDeckIndex];
  const currentCard = currentDeck?.cards[cardIndex % (currentDeck?.cards.length || 1)];

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleCardRate = (rating: 'easy' | 'hard' | 'again') => {
    if (!currentCard) return;
    setCardsReviewed(prev => ({ ...prev, [currentCard.id]: rating }));

    if (rating === 'easy') {
      markWordPracticed(currentCard.id, true);
    } else {
      flagWeakVocabulary(currentCard.id);
    }

    setIsFlipped(false);
    setCardIndex(prev => prev + 1);
  };

  // Filtered Vocab Bank
  const filteredWords = ARABIC_VOCABULARY_BANK.filter(w => {
    const matchesCat = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesType = selectedWordType === 'all' || w.grammarCategory === selectedWordType;
    const matchesSearch =
      !searchQuery ||
      w.arabic.includes(searchQuery) ||
      w.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.root && w.root.includes(searchQuery));
    return matchesCat && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
            : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full border flex items-center gap-1 ${
                isDark
                  ? 'bg-white/[0.08] text-white border-white/[0.14]'
                  : 'bg-black/[0.04] text-[#111214] border-black/[0.1]'
              }`}>
                <BookMarked className="w-3.5 h-3.5" />
                Arabic Lexicon & Memory
              </span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Root-based System with Audio</span>
            </div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
              Vocabulary & Smart Flashcards
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              Review words by tri-literal roots, plurals, and contextual sentences, or train spaced recall with interactive flipcards.
            </p>
          </div>

          {/* Mode Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'flashcards'
                  ? isDark
                    ? 'bg-white text-[#111214]'
                    : 'bg-[#111214] text-white'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              Smart Flashcards
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bank'
                  ? isDark
                    ? 'bg-white text-[#111214]'
                    : 'bg-[#111214] text-white'
                  : isDark
                  ? 'text-stone-400 hover:text-white'
                  : 'text-[#5A5D63] hover:text-[#111214]'
              }`}
            >
              Vocabulary Bank
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Smart Flashcards */}
      {activeTab === 'flashcards' && currentCard && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Deck selector ribbon */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
            {FLASHCARD_DECKS.map((deck, dIdx) => (
              <button
                key={deck.id}
                onClick={() => {
                  setCurrentDeckIndex(dIdx);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  currentDeckIndex === dIdx
                    ? isDark
                      ? 'border-white bg-white text-[#111214]'
                      : 'border-[#111214] bg-[#111214] text-white'
                    : isDark
                    ? 'border-white/[0.08] bg-[#1B1D23] text-stone-300 hover:bg-white/[0.08]'
                    : 'border-black/[0.08] bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.06]'
                }`}
              >
                {deck.title}
              </button>
            ))}
          </div>

          {/* Flashcard Box */}
          <div
            onClick={handleFlip}
            className={`cursor-pointer min-h-[340px] p-8 rounded-3xl border flex flex-col items-center justify-between text-center transition-all transform select-none relative ${
              isDark
                ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)] hover:border-white/20'
                : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-black/20'
            }`}
          >
            <div className={`w-full flex items-center justify-between text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              <span>Card {(cardIndex % currentDeck.cards.length) + 1} of {currentDeck.cards.length}</span>
              <span className={`flex items-center gap-1 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                <RotateCw className="w-3 h-3" />
                <span>Tap card to flip</span>
              </span>
            </div>

            {!isFlipped ? (
              /* Front of Card: Arabic Prompt */
              <div className="my-auto space-y-4">
                <span className={`text-5xl md:text-6xl font-serif font-bold block select-text ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {currentCard.frontArabic}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakArabic(currentCard.frontArabic);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    isDark
                      ? 'bg-white/[0.08] text-white border-white/[0.12] hover:bg-white/[0.14]'
                      : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08] hover:bg-black/[0.06]'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              </div>
            ) : (
              /* Back of Card: English & Linguistic breakdown */
              <div className="my-auto space-y-3">
                <span className={`text-3xl font-serif block ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {currentCard.frontArabic}
                </span>
                <p className={`text-xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                  {currentCard.backEnglish}
                </p>
                {currentCard.root && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-serif border ${
                    isDark ? 'bg-[#1B1D23] text-stone-200 border-white/[0.08]' : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08]'
                  }`}>
                    Root: {currentCard.root}
                  </span>
                )}
                {currentCard.exampleSentence && (
                  <p className={`text-xs font-serif italic max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    "{currentCard.exampleSentence}"
                  </p>
                )}
              </div>
            )}

            <div className={`text-[11px] w-full text-center border-t pt-3 ${
              isDark ? 'text-stone-400 border-white/[0.08]' : 'text-[#6B6F76] border-black/[0.08]'
            }`}>
              {isFlipped ? 'How well did you know this word?' : 'Think of the meaning, then tap to check'}
            </div>
          </div>

          {/* Spaced Repetition Rating Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleCardRate('again')}
              className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                isDark
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                  : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>Hard / Again</span>
              <span className={`text-[10px] ${isDark ? 'text-rose-400/80' : 'text-rose-600'}`}>Review soon</span>
            </button>

            <button
              onClick={() => handleCardRate('hard')}
              className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                isDark
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                  : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <span>Medium</span>
              <span className={`text-[10px] ${isDark ? 'text-sky-400/80' : 'text-sky-700'}`}>Recall OK</span>
            </button>

            <button
              onClick={() => handleCardRate('easy')}
              className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                isDark
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span>Easy / Mastered</span>
              <span className={`text-[10px] ${isDark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>Known well</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Full Vocabulary Bank */}
      {activeTab === 'bank' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Arabic, English meaning, or root..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6] placeholder-stone-500'
                    : 'bg-white border-black/[0.08] text-[#111214] placeholder-[#6B6F76]'
                }`}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6]'
                    : 'bg-white border-black/[0.08] text-[#111214]'
                }`}
              >
                <option value="all">All Categories</option>
                <option value="greetings">Greetings & Etiquette</option>
                <option value="family">Family (الأسرة)</option>
                <option value="daily_life">Daily Life & Objects</option>
                <option value="verbs">Essential Verbs</option>
                <option value="education">Education & Knowledge</option>
              </select>

              <select
                value={selectedWordType}
                onChange={e => setSelectedWordType(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-[#F3F4F6]'
                    : 'bg-white border-black/[0.08] text-[#111214]'
                }`}
              >
                <option value="all">All Parts of Speech</option>
                <option value="noun">Nouns (اسم)</option>
                <option value="verb">Verbs (فعل)</option>
                <option value="particle">Particles (حرف)</option>
              </select>
            </div>
          </div>

          {/* Words Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className={`p-5 rounded-2xl border space-y-3 transition-all ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.08] hover:border-white/20'
                    : 'bg-white border-black/[0.08] hover:border-black/20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-2xl font-serif block ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                      {word.arabic}
                    </span>
                    <span className={`text-xs font-sans italic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {word.transliteration}
                    </span>
                  </div>
                  <button
                    onClick={() => speakArabic(word.arabic)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isDark
                        ? 'bg-white/[0.08] text-white border-white/[0.12] hover:bg-white/[0.14]'
                        : 'bg-[#F3F3F1] text-[#111214] border-black/[0.08] hover:bg-black/[0.06]'
                    }`}
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className={`flex justify-between font-semibold ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
                    <span>Meaning:</span>
                    <span>{word.english}</span>
                  </div>

                  {word.plural && (
                    <div className={`flex justify-between ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      <span>Plural (جمع):</span>
                      <span className={`font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{word.plural}</span>
                    </div>
                  )}

                  {word.root && (
                    <div className={`flex justify-between ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      <span>Root (الجذر):</span>
                      <span className={`font-serif ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>{word.root}</span>
                    </div>
                  )}
                </div>

                <div className={`p-2.5 rounded-xl border text-[11px] space-y-0.5 ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.08] text-stone-400'
                    : 'bg-[#F3F3F1] border-black/[0.08] text-[#5A5D63]'
                }`}>
                  <span className={`block ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>Example Context:</span>
                  <p className={`font-serif text-right ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {typeof word.exampleSentence === 'string'
                      ? word.exampleSentence
                      : word.exampleSentence?.arabic}
                  </p>
                  <p className={`italic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                    {word.exampleTranslation ||
                      (typeof word.exampleSentence !== 'string'
                        ? word.exampleSentence?.english
                        : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
