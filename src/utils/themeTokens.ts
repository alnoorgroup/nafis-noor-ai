/**
 * Noor Unified Theme Design Tokens
 * 
 * Calibrated to the minimalist Noor AI design language:
 * 🌙 Dark Mode (obsidian #0B0C0E canvas, #14161A elevated surfaces, crisp white/stone ink)
 * ☀️ Light Mode (warm alabaster #FCFCFA canvas, pure white elevated cards, crisp #111214 ink)
 */

export interface ThemeTokens {
  isDark: boolean;

  // Background canvases
  canvas: string;
  canvasPattern: string;

  // Surfaces & Cards
  cardPrimary: string;
  cardSecondary: string;
  cardHero: string;
  cardModal: string;
  navFloating: string;
  orb: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textGold: string;
  textGoldBright: string;
  textArabic: string;
  textHeading: string;

  // Borders & Dividers
  borderSubtle: string;
  borderCard: string;
  borderGold: string;
  borderActive: string;
  divider: string;

  // Form Controls
  input: string;
  inputCompact: string;
  select: string;

  // Buttons
  btnPrimary: string;
  btnSecondary: string;
  btnGhost: string;
  btnGoldOutline: string;

  // Status & Badges
  badgeGold: string;
  badgeEmerald: string;
  badgeAmber: string;
  badgeRose: string;
  badgeNeutral: string;

  // Interactive items
  itemHover: string;
  itemActive: string;
}

export function getThemeTokens(isDark: boolean): ThemeTokens {
  if (isDark) {
    return {
      isDark: true,
      canvas: 'bg-[#0B0C0E] text-[#F3F4F6]',
      canvasPattern: 'islamic-pattern opacity-40',

      cardPrimary: 'liquid-glass-primary-dark',
      cardSecondary: 'liquid-glass-secondary-dark',
      cardHero: 'liquid-glass-hero-dark',
      cardModal: 'liquid-glass-modal-dark',
      navFloating: 'liquid-glass-floating-nav-dark',
      orb: 'liquid-glass-orb',

      textPrimary: 'text-[#F3F4F6]',
      textSecondary: 'text-stone-300',
      textMuted: 'text-stone-400',
      textGold: 'text-[#DFBA7F]',
      textGoldBright: 'text-[#FFF5E1]',
      textArabic: 'text-[#FFF5E1]',
      textHeading: 'text-[#FFF5E1]',

      borderSubtle: 'border-white/[0.08]',
      borderCard: 'border-white/[0.08]',
      borderGold: 'border-[#DFBA7F]/30',
      borderActive: 'border-[#DFBA7F]',
      divider: 'bg-white/[0.08]',

      input: 'liquid-glass-input-dark',
      inputCompact: 'bg-[#1A1C22] border border-[#DFBA7F]/30 text-[#F3F4F6] placeholder:text-stone-500 focus:border-[#DFBA7F]',
      select: 'bg-[#1A1C22] border border-[#DFBA7F]/30 text-[#F3F4F6] focus:border-[#DFBA7F]',

      btnPrimary: 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] hover:opacity-95 text-[#080A0E] font-bold shadow-sm active:scale-[0.98] transition-all',
      btnSecondary: 'bg-white/[0.06] border border-[#DFBA7F]/30 hover:bg-white/[0.1] text-[#DFBA7F] hover:text-white active:scale-[0.98] transition-all',
      btnGhost: 'text-stone-400 hover:text-[#DFBA7F] hover:bg-white/[0.06] active:scale-95 transition-all',
      btnGoldOutline: 'border border-[#DFBA7F]/40 text-[#DFBA7F] hover:bg-white/[0.08] active:scale-[0.98] transition-all',

      badgeGold: 'bg-[#DFBA7F]/15 border border-[#DFBA7F]/35 text-[#DFBA7F]',
      badgeEmerald: 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300',
      badgeAmber: 'bg-amber-500/15 border border-amber-500/35 text-amber-300',
      badgeRose: 'bg-rose-500/15 border border-rose-500/35 text-rose-300',
      badgeNeutral: 'bg-white/[0.06] border border-white/[0.1] text-stone-300',

      itemHover: 'hover:bg-white/[0.05] hover:border-[#DFBA7F]/30 transition-colors',
      itemActive: 'bg-[#DFBA7F]/20 border-[#DFBA7F] text-[#FFF5E1]',
    };
  }

  // Light Mode: Alabaster Canvas with Opulent Gold Touch Accents
  return {
    isDark: false,
    canvas: 'bg-[#FCFCFA] text-[#111214]',
    canvasPattern: 'islamic-pattern-light opacity-50',

    cardPrimary: 'liquid-glass-primary-light',
    cardSecondary: 'liquid-glass-secondary-light',
    cardHero: 'liquid-glass-hero-light',
    cardModal: 'liquid-glass-modal-light',
    navFloating: 'liquid-glass-floating-nav-light',
    orb: 'liquid-glass-orb-light',

    textPrimary: 'text-[#111214]',
    textSecondary: 'text-[#3F4248]',
    textMuted: 'text-[#6B6F76]',
    textGold: 'text-[#C9A063]',
    textGoldBright: 'text-[#A6782E]',
    textArabic: 'text-[#111214]',
    textHeading: 'text-[#111214]',

    borderSubtle: 'border-black/[0.08]',
    borderCard: 'border-black/[0.08]',
    borderGold: 'border-[#DFBA7F]/45',
    borderActive: 'border-[#C9A063]',
    divider: 'bg-black/[0.08]',

    input: 'liquid-glass-input-light',
    inputCompact: 'bg-white border border-[#DFBA7F]/40 text-[#111214] placeholder:text-[#6B6F76] focus:border-[#C9A063]',
    select: 'bg-white border border-[#DFBA7F]/40 text-[#111214] focus:border-[#C9A063]',

    btnPrimary: 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] hover:opacity-95 text-[#080A0E] font-bold shadow-sm active:scale-[0.98] transition-all',
    btnSecondary: 'bg-white border border-[#DFBA7F]/40 hover:bg-[#FFF5E1]/50 text-[#9E7432] shadow-2xs active:scale-[0.98] transition-all',
    btnGhost: 'text-[#6B6F76] hover:text-[#C9A063] hover:bg-black/[0.04] active:scale-95 transition-all',
    btnGoldOutline: 'border border-[#DFBA7F]/60 text-[#9E7432] hover:bg-[#FFF5E1]/30 active:scale-[0.98] transition-all',

    badgeGold: 'bg-[#DFBA7F]/15 border border-[#DFBA7F]/40 text-[#9E7432]',
    badgeEmerald: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    badgeAmber: 'bg-amber-50 border border-amber-200 text-amber-800',
    badgeRose: 'bg-rose-50 border border-rose-200 text-rose-800',
    badgeNeutral: 'bg-[#F3F3F1] border border-black/[0.08] text-[#3F4248]',

    itemHover: 'hover:bg-black/[0.03] hover:border-[#DFBA7F]/40 transition-colors',
    itemActive: 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] border-[#C9A063] text-[#080A0E] font-bold shadow-xs',
  };
}
