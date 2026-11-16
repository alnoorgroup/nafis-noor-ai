import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  Share2,
  Play,
  Pause,
  ArrowLeft,
  X,
  Volume2,
  Check,
  Sparkles,
  Info,
  RotateCcw,
  Moon,
  Droplets,
  Building2,
  Compass,
  Home,
  Shirt,
  Plane,
  Utensils,
  Sun,
  BookOpen,
  Heart,
  Shield,
  Smile,
  Zap,
  Users,
  Activity,
  AlertCircle,
  Clock,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Dua, UserStats } from '../types';
import { DUAS_CATEGORIES_LIBRARY, DuaCategoryItem, DuaOccasion, LibraryDuaEntry, searchDuasLibrary } from '../data/duasLibrary';
import { getLanguageCode, t } from '../utils/i18n';
import { DhikrVoiceController } from '../utils/dhikrVoiceReader';

interface DhikrLibraryScreenProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
  onBackToJourney?: () => void;
}

export const DhikrLibraryScreen: React.FC<DhikrLibraryScreenProps> = ({
  isDark,
  userStats,
  onUpdateStats,
  onOpenNoorAIWithPrompt,
  onBackToJourney,
}) => {
  const lang = getLanguageCode(userStats.language);
  const isArabic = lang === 'ar';

  // Navigation state within Dua's Library:
  // - view: 'main' (category list) | 'detail' (occasion entries) | 'bookmarks' (saved duas modal/view) | 'search' (search results view)
  const [currentView, setCurrentView] = useState<'main' | 'detail' | 'bookmarks'>('main');
  const [selectedCategory, setSelectedCategory] = useState<DuaCategoryItem | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<DuaOccasion | null>(null);
  
  // Expanded category IDs set (supports multiple expanded or accordion style in-place)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Show More / Show Less expanded entry IDs
  const [expandedEntryIds, setExpandedEntryIds] = useState<Record<string, boolean>>({});

  // Audio Player State (Natural Human Neural Voice)
  const [activeAudioDuaId, setActiveAudioDuaId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const voiceControllerRef = useRef<DhikrVoiceController | null>(null);

  if (!voiceControllerRef.current) {
    voiceControllerRef.current = new DhikrVoiceController();
  }

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Scroll preservation ref when returning from detail page
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      voiceControllerRef.current?.stop();
    };
  }, []);

  const handleToggleCategoryExpand = (catId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleSelectOccasion = (cat: DuaCategoryItem, occ: DuaOccasion) => {
    if (mainScrollRef.current) {
      setScrollPosition(mainScrollRef.current.scrollTop);
    }
    setSelectedCategory(cat);
    setSelectedOccasion(occ);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleBackToMain = () => {
    voiceControllerRef.current?.stop();
    setIsAudioPlaying(false);
    setAudioLoading(false);
    setActiveAudioDuaId(null);
    setCurrentView('main');
    setSelectedOccasion(null);
    setTimeout(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: scrollPosition, behavior: 'instant' as ScrollBehavior });
      }
    }, 50);
  };

  // Bookmarks
  const savedDuasIds = userStats.savedDuas || [];
  const handleToggleBookmark = (e: React.MouseEvent, duaId: string) => {
    e.stopPropagation();
    const isSaved = savedDuasIds.includes(duaId);
    const updated = isSaved ? savedDuasIds.filter((id) => id !== duaId) : [...savedDuasIds, duaId];
    onUpdateStats({ savedDuas: updated });
    showToast(isSaved ? (isArabic ? 'تمت الإزالة من المحفوظات' : 'Removed from bookmarks') : (isArabic ? 'تم الحفظ في المفضلة' : 'Saved to bookmarks'));
  };

  // Share
  const handleShareDua = (e: React.MouseEvent, dua: LibraryDuaEntry) => {
    e.stopPropagation();
    const text = `${dua.title}\n\n${dua.arabic}\n\n"${dua.translation}"\n\n— Source: ${dua.source}\n(Preserved in Nafis Noor)`;
    if (navigator.share) {
      navigator.share({ title: dua.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast(isArabic ? 'تم نسخ الذكر للمشاركة' : 'Copied to clipboard for sharing');
    }
  };

  // Human-like Voice Recitation
  const handleToggleAudio = useCallback((dua: LibraryDuaEntry) => {
    const controller = voiceControllerRef.current;
    if (!controller) return;

    setActiveAudioDuaId(dua.id);
    void controller.toggle(dua.id, dua.arabic, dua.audio, {
      onLoading: (loading) => {
        setAudioLoading(loading);
      },
      onPlay: () => {
        setActiveAudioDuaId(dua.id);
        setIsAudioPlaying(true);
        setAudioLoading(false);
      },
      onPause: () => {
        setIsAudioPlaying(false);
        setAudioLoading(false);
      },
      onEnded: () => {
        setIsAudioPlaying(false);
        setAudioLoading(false);
        setActiveAudioDuaId(null);
      },
      onError: () => {
        setIsAudioPlaying(false);
        setAudioLoading(false);
        setActiveAudioDuaId(null);
      },
    });
  }, []);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchDuasLibrary(searchQuery);
  }, [searchQuery]);

  // Icon selector helper
  const renderCategoryIcon = (iconKey: string) => {
    const cls = "w-5 h-5 text-stone-900 dark:text-stone-100 stroke-[1.75]";
    switch (iconKey) {
      case 'moon': return <Moon className={cls} />;
      case 'toilet': return <Droplets className={cls} />;
      case 'droplets': return <Droplets className={cls} />;
      case 'mosque': return <Building2 className={cls} />;
      case 'prayer': return <Compass className={cls} />;
      case 'home': return <Home className={cls} />;
      case 'garment': return <Shirt className={cls} />;
      case 'travel': return <Plane className={cls} />;
      case 'food': return <Utensils className={cls} />;
      case 'sun': return <Sun className={cls} />;
      case 'remembrance': return <Sparkles className={cls} />;
      case 'after-prayers': return <Clock className={cls} />;
      case 'rizq': return <Sparkles className={cls} />;
      case 'knowledge': return <BookOpen className={cls} />;
      case 'faith': return <Shield className={cls} />;
      case 'judgement': return <Clock className={cls} />;
      case 'forgiveness': return <Heart className={cls} />;
      case 'praising': return <Smile className={cls} />;
      case 'protection': return <Shield className={cls} />;
      case 'family': return <Users className={cls} />;
      case 'health': return <Activity className={cls} />;
      case 'loss': return <AlertCircle className={cls} />;
      case 'sorrow-joy': return <Zap className={cls} />;
      case 'patience': return <Shield className={cls} />;
      case 'debt': return <FileText className={cls} />;
      case 'menstruation': return <HelpCircle className={cls} />;
      case 'deceased': return <Moon className={cls} />;
      case 'hajj': return <Compass className={cls} />;
      case 'ramadan': return <Moon className={cls} />;
      case 'nature': return <Sun className={cls} />;
      case 'etiquette': return <Smile className={cls} />;
      case 'guidance': return <Compass className={cls} />;
      default: return <Sparkles className={cls} />;
    }
  };

  return (
    <div
      ref={mainScrollRef}
      className={`min-h-screen transition-colors duration-200 font-sans pb-32 sm:pb-36 ${
        isDark ? 'bg-[#0B0C0E] text-[#F3F4F6]' : 'bg-[#FCFCFA] text-[#111214]'
      }`}
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#111214] text-white dark:bg-[#14161A] dark:text-[#F3F4F6] text-xs font-medium shadow-xl border border-black/[0.08] dark:border-white/[0.12]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW 1: MAIN DUA'S DIRECTORY & CATEGORIES                                 */}
      {/* ========================================================================= */}
      {currentView === 'main' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          {/* Header */}
          <div className={`relative flex items-center justify-between pb-4 mb-4 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            {/* Left Back to Journey / Home trigger if standalone */}
            {onBackToJourney ? (
              <button
                type="button"
                onClick={onBackToJourney}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] hover:bg-[#1B1D23]'
                    : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                }`}
                aria-label={isArabic ? 'العودة للرحلة' : 'Return to Journey'}
              >
                <ArrowLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            ) : <div className="w-10" />}

            {/* Centered Title */}
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-serif-heading font-bold tracking-tight">
              {isArabic ? 'الأدعية والأذكار' : "Dua’s"}
            </h1>

            {/* Right: Search & Bookmark Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] hover:bg-[#1B1D23]'
                    : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                }`}
                aria-label={isArabic ? 'بحث' : 'Search'}
                title={isArabic ? 'بحث' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('bookmarks')}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer relative ${
                  isDark
                    ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] hover:bg-[#1B1D23]'
                    : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                }`}
                aria-label={isArabic ? 'المحفوظات' : 'Bookmarks'}
                title={isArabic ? 'المحفوظات' : 'Bookmarks'}
              >
                <Bookmark className="w-4 h-4" />
                {savedDuasIds.length > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                  }`}>
                    {savedDuasIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Search Bar (when toggled or typing) */}
          <AnimatePresence>
            {(isSearchOpen || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'ابحث في الأقسام والأدعية والأذكار...' : 'Search categories, duas, or Arabic text...'}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm border outline-none transition-all ${
                      isDark
                        ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6] placeholder-stone-500 focus:border-white/30'
                        : 'bg-white border-black/[0.1] text-[#111214] placeholder-[#6B6F76] focus:border-black/35 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                    }`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#111214] dark:hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results View */}
          {searchQuery.trim() ? (
            <div className="space-y-4 animate-fadeIn">
              <div className={`flex items-center justify-between text-xs px-1 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                <span>{isArabic ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`}</span>
                <span className="font-mono">{searchResults?.entries.length || 0} found</span>
              </div>

              {searchResults?.entries.length === 0 ? (
                <div className={`py-16 text-center text-sm ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {isArabic ? 'لا توجد نتائج مطابقة لبحثك.' : 'No matching invocations found.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults?.entries.map(({ entry, category, occasion }) => (
                    <div
                      key={entry.id}
                      onClick={() => handleSelectOccasion(category, occasion)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#14161A] border-white/[0.08] hover:border-white/[0.22]'
                          : 'bg-white border-black/[0.08] hover:border-black/25 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <div className={`flex items-center justify-between text-[11px] mb-1 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                        <span>{isArabic ? category.titleAr : category.title} › {isArabic ? occasion.titleAr : occasion.title}</span>
                        <span className="font-mono">{entry.source.slice(0, 30)}...</span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{isArabic ? (entry.titleAr || entry.title) : entry.title}</h4>
                      <p className={`font-arabic text-lg line-clamp-1 text-right ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">{entry.arabic}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Three Sections: DAILY, AZKAR, OCCASIONAL */
            <div className="space-y-8 animate-fadeIn">
              {(['DAILY', 'AZKAR', 'OCCASIONAL'] as const).map((sectionId) => {
                const sectionCategories = DUAS_CATEGORIES_LIBRARY.filter((c) => c.section === sectionId);
                const sectionTitle =
                  sectionId === 'DAILY'
                    ? (isArabic ? 'اليومي' : 'DAILY')
                    : sectionId === 'AZKAR'
                    ? (isArabic ? 'الأذكار' : 'AZKAR')
                    : (isArabic ? 'المناسبات' : 'OCCASIONAL');

                return (
                  <div key={sectionId} className="space-y-2">
                    {/* Section Title Heading */}
                    <h2 className={`text-xs font-cinzel font-bold tracking-widest px-1 uppercase ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                      {sectionTitle}
                    </h2>

                    {/* Section Categories Container */}
                    <div
                      className={`rounded-3xl border overflow-hidden ${
                        isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      {sectionCategories.map((cat, catIdx) => {
                        const isExpanded = expandedCategoryIds.has(cat.id);
                        const hasSeparator = catIdx < sectionCategories.length - 1;

                        return (
                          <div key={cat.id} className="flex flex-col">
                            {/* Category Row */}
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryExpand(cat.id)}
                              className={`w-full flex items-center justify-between px-4 sm:px-5 py-4 transition-colors cursor-pointer group text-start ${
                                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                                  isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.06]'
                                }`}>
                                  {renderCategoryIcon(cat.icon)}
                                </div>
                                <span className="font-semibold text-sm sm:text-base tracking-tight truncate">
                                  {isArabic ? cat.titleAr : cat.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`text-xs font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                                  {cat.occasions.length} {isArabic ? 'مواضيع' : 'occasions'}
                                </span>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'} ${isExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                  className={`overflow-hidden ${
                                    isDark ? 'bg-[#0B0C0E]/80' : 'bg-[#F3F3F1]'
                                  } px-4 sm:px-6 py-3 space-y-1.5 border-t border-b ${
                                    isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                                  }`}
                                >
                                  {cat.occasions.map((occ) => (
                                    <button
                                      key={occ.id}
                                      type="button"
                                      onClick={() => handleSelectOccasion(cat, occ)}
                                      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-start ${
                                        isDark
                                          ? 'hover:bg-white/[0.06] text-stone-200'
                                          : 'hover:bg-black/[0.04] text-[#111214]'
                                      }`}
                                    >
                                      <span className="truncate">{isArabic ? occ.titleAr : occ.title}</span>
                                      <div className={`flex items-center gap-2 shrink-0 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                                        <span className="text-[11px] font-mono">{occ.entries.length}</span>
                                        <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                                      </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Thin separator */}
                            {hasSeparator && (
                              <div className={`mx-4 sm:mx-5 h-[1px] ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: INDIVIDUAL DHIKR DETAIL PAGE                                      */}
      {/* ========================================================================= */}
      {currentView === 'detail' && selectedOccasion && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 animate-fadeIn">
          {/* Header */}
          <div className={`relative flex items-center justify-between pb-4 mb-6 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <button
              type="button"
              onClick={handleBackToMain}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] hover:bg-[#1B1D23]'
                  : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
              aria-label={isArabic ? 'رجوع' : 'Back'}
              title={isArabic ? 'رجوع' : 'Back'}
            >
              <ChevronLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-base sm:text-lg font-serif-heading font-bold tracking-tight text-center truncate max-w-[220px]">
              {isArabic ? selectedOccasion.titleAr : selectedOccasion.title}
            </h1>

            <div className="w-10" />
          </div>

          {/* Occasion Heading in bold */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-serif-heading mb-1">
              {isArabic ? selectedOccasion.titleAr : selectedOccasion.title}
            </h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {selectedOccasion.entries.length} {isArabic ? 'أذكار وأدعية مأثورة' : 'authentic invocations'}
            </p>
          </div>

          {/* Dhikr Entries List */}
          <div className="space-y-6">
            {selectedOccasion.entries.map((dua, idx) => {
              const isSaved = savedDuasIds.includes(dua.id);
              const isAudioActive = activeAudioDuaId === dua.id && isAudioPlaying;
              const isExpanded = Boolean(expandedEntryIds[dua.id]);

              return (
                <div
                  key={dua.id}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                    isDark
                      ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                      : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  {/* Top Index & Action Buttons */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                      isDark ? 'bg-[#1B1D23] text-stone-300' : 'bg-[#F3F3F1] text-[#3F4248]'
                    }`}>
                      {idx + 1} of {selectedOccasion.entries.length}
                    </span>

                    {/* Three circular action buttons: Share, Bookmark, Audio */}
                    <div className="flex items-center gap-2">
                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={(e) => handleShareDua(e, dua)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark ? 'bg-[#1B1D23] hover:bg-white/[0.12] text-stone-300' : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#3F4248]'
                        }`}
                        aria-label={isArabic ? 'مشاركة' : 'Share'}
                        title={isArabic ? 'مشاركة الذكر' : 'Share Dhikr'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(e, dua.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isSaved
                            ? isDark
                              ? 'bg-white text-[#111214]'
                              : 'bg-[#111214] text-white'
                            : isDark
                            ? 'bg-[#1B1D23] text-stone-300 hover:bg-white/[0.12]'
                            : 'bg-[#F3F3F1] text-[#3F4248] hover:bg-black/[0.08]'
                        }`}
                        aria-label={isArabic ? 'حفظ' : 'Bookmark'}
                        title={isArabic ? 'حفظ في المفضلة' : 'Bookmark'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      {/* Audio Button (Green play/pause icon) */}
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(dua)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-sm ${
                          isAudioActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                        aria-label={isArabic ? 'تشغيل الصوت' : 'Play audio'}
                        title={isArabic ? 'استماع للتلاوة' : 'Listen to recitation'}
                      >
                        {audioLoading && activeAudioDuaId === dua.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isAudioActive ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`font-bold text-sm sm:text-base mb-3 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'}`}>
                    {isArabic ? (dua.titleAr || dua.title) : dua.title}
                  </h3>

                  {/* Authentic Arabic Dhikr in Large Beautiful Typography (Amiri/Naskh) */}
                  <div className="my-3 text-right dir-rtl" dir="rtl">
                    <p className={`font-serif-arabic text-xl sm:text-2xl leading-[2.6rem] tracking-wide select-text ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {dua.arabic}
                    </p>
                  </div>

                  {/* Show More / Show Less control */}
                  <div className={`mt-4 pt-3 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedEntryIds((prev) => ({ ...prev, [dua.id]: !prev[dua.id] }))
                      }
                      className={`text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer ${
                        isDark ? 'text-stone-200' : 'text-[#111214]'
                      }`}
                    >
                      <span>{isExpanded ? (isArabic ? 'إخفاء التفاصيل' : 'Show Less') : (isArabic ? 'عرض التفاصيل الكاملة والترجمة' : 'Show More')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-3 space-y-3 pt-2 text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}
                        >
                          {!isArabic && dua.transliteration && (
                            <div className={`italic ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                              "{dua.transliteration}"
                            </div>
                          )}
                          <div className="leading-relaxed font-light">
                            {dua.translation}
                          </div>

                          {dua.benefit && (
                            <div className={`p-2.5 rounded-xl border text-[11px] ${
                              isDark
                                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-200'
                                : 'bg-[#F3F3F1] border-black/[0.06] text-[#3F4248]'
                            }`}>
                              {dua.benefit}
                            </div>
                          )}

                          <div className={`pt-2 text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                            — {dua.source}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BOOKMARKS & SAVED DUAS VIEW                                     */}
      {/* ========================================================================= */}
      {currentView === 'bookmarks' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 animate-fadeIn">
          {/* Header */}
          <div className={`relative flex items-center justify-between pb-4 mb-6 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <button
              type="button"
              onClick={() => setCurrentView('main')}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] hover:bg-[#1B1D23]'
                  : 'bg-white border-black/[0.08] text-[#111214] hover:bg-[#F3F3F1] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
              }`}
              aria-label={isArabic ? 'رجوع' : 'Back'}
            >
              <ChevronLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-serif-heading font-bold tracking-tight">
              {isArabic ? 'الأذكار المحفوظة' : 'Saved Bookmarks'}
            </h1>

            <div className="w-10" />
          </div>

          {savedDuasIds.length === 0 ? (
            <div className={`py-20 text-center text-sm space-y-2 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              <Bookmark className="w-10 h-10 mx-auto opacity-40 text-stone-400 mb-2" />
              <p>{isArabic ? 'لم تحفظ أي أذكار بعد.' : 'No bookmarked invocations yet.'}</p>
              <p className="text-xs opacity-80">
                {isArabic ? 'انقر على أيقونة الإشارة المرجعية لأي ذكر لحفظه هنا.' : 'Tap the bookmark icon on any Dhikr entry to save it here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedDuasIds.map((id) => {
                const dua = DUAS_CATEGORIES_LIBRARY.flatMap((c) => c.occasions).flatMap((o) => o.entries).find((e) => e.id === id);
                if (!dua) return null;

                return (
                  <div
                    key={dua.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-mono ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                        {isArabic ? (dua.titleAr || dua.title) : dua.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAudio(dua)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-sm ${
                            activeAudioDuaId === dua.id && isAudioPlaying
                              ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
                              : 'bg-emerald-500 hover:bg-emerald-600'
                          }`}
                          aria-label={isArabic ? 'تشغيل الصوت' : 'Play audio'}
                        >
                          {audioLoading && activeAudioDuaId === dua.id ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : activeAudioDuaId === dua.id && isAudioPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, dua.id)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          {isArabic ? 'إزالة' : 'Remove'}
                        </button>
                      </div>
                    </div>
                    <p className={`font-arabic text-xl text-right mb-2 ${isDark ? 'text-white' : 'text-[#111214]'}`} dir="rtl">
                      {dua.arabic}
                    </p>
                    <p className={`text-xs font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      "{dua.translation}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
