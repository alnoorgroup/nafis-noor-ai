import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { TAJWEED_LEGEND_ITEMS } from '../utils/tajweedHighlighter';

interface TajweedLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
}

export const TajweedLegendModal: React.FC<TajweedLegendModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border shadow-2xl max-h-[88vh] flex flex-col relative overflow-hidden ${
            isDark
              ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
              : 'bg-white border-black/[0.08] text-[#111214] shadow-xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3.5 border-b mb-4 shrink-0 ${
            isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isDark
                  ? 'bg-white/[0.06] border-white/[0.1] text-white'
                  : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
              }`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'دليل أحكام التجويد والألوان' : 'Tajweed Color Rules Legend'}
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? 'دليل الألوان التوضيحية لتلاوة صحيحة ومحكمة' : 'Visual color-coded guide for accurate recitation'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl active:scale-90 transition-all cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
              }`}
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto pr-1 space-y-3 no-scrollbar flex-1 pb-2">
            <div className={`text-xs border p-3 rounded-2xl mb-3 leading-relaxed ${
              isDark ? 'text-stone-300 bg-white/[0.04] border-white/[0.08]' : 'text-[#3F4248] bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              {isArabic
                ? 'تظهر ألوان التجويد تلقائياً عند تفعيل "ألوان أحكام التجويد" في إعدادات المصحف لمساعدتك على تطبيق قواعد المد، الغنة، القلقلة والإقلاب بدقة أثناء القراءة.'
                : 'Tajweed colors automatically highlight when enabled in Mushaf settings, helping you master rules like Madd, Ghunnah, Qalqalah, and Iqlab while reading.'}
            </div>

            {TAJWEED_LEGEND_ITEMS.map((item, idx) => {
              const textColor = isDark ? item.textDarkClass : item.textLightClass;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                    isDark
                      ? 'bg-[#1B1D23] border-white/[0.08] hover:border-white/[0.18]'
                      : 'bg-[#FCFCFA] border-black/[0.08] hover:border-black/[0.16]'
                  }`}
                >
                  {/* Color Dot / Badge */}
                  <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${item.dotClass} shadow-[0_0_10px_currentColor]`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-bold font-serif-heading ${textColor}`}>
                        {isArabic ? item.labelAr : item.labelEn}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                        isDark ? 'bg-white/[0.06] text-stone-300 border-white/[0.1]' : 'bg-[#F3F3F1] text-[#3F4248] border-black/[0.08]'
                      }`}>
                        {isArabic ? item.labelEn : item.labelAr}
                      </span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                      {item.descAr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Close Button */}
          <div className={`pt-3 border-t mt-2 shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isArabic ? 'فهمت، العودة للمصحف' : 'Got it, Return to Mushaf'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
