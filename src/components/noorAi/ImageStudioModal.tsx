import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
  onInsertImageIntoChat: (imageUrl: string, prompt: string) => void;
  showToast: (msg: string) => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
  onInsertImageIntoChat,
  showToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateImage = async () => {
    if (!prompt.trim()) {
      showToast(isArabic ? 'يرجى إدخال وصف الصورة المراد إنشاؤها' : 'Please enter an image description');
      return;
    }
    setIsLoading(true);
    setGeneratedImageUrl(null);

    try {
      const res = await fetch(getApiUrl('/api/image/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to create image');
      }
      setGeneratedImageUrl(data.imageUrl);
      showToast(isArabic ? 'تم إنشاء الصورة بنجاح' : 'Image created successfully');
    } catch (err: any) {
      showToast(isArabic ? `تعذر إنشاء الصورة: ${err.message}` : `Image creation error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (!generatedImageUrl) return;
    onInsertImageIntoChat(generatedImageUrl, prompt.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        dir={isArabic ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
            : 'bg-white border-black/[0.08] text-[#111214]'
        }`}
      >
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-inherit">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-white/[0.08] text-white' : 'bg-[#F3F3F1] text-[#111214]'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              {isArabic ? 'استوديو الصور الذكي' : 'Smart Image Studio'}
            </h2>
            <p className={`text-[12.5px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
              {isArabic ? 'إنشاء صور مخصصة بالذكاء الاصطناعي' : 'Create custom images with AI'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-[13px] font-medium mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {isArabic ? 'وصف الصورة (Prompt)' : 'Image Description (Prompt)'}
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isArabic
                  ? 'مثال: منظر طبيعي هادئ مع شروق الشمس ونخل وواحة...'
                  : 'e.g. A serene Islamic oasis garden at golden hour, high quality...'
              }
              className={`w-full rounded-2xl border p-3 text-[14px] leading-relaxed resize-none focus:outline-none ${
                isDark
                  ? 'bg-[#0B0C0E] border-white/[0.12] text-[#F3F4F6] placeholder:text-stone-500'
                  : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] placeholder:text-[#6B6F76]'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[13px] font-medium mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {isArabic ? 'أبعاد الصورة' : 'Aspect Ratio'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['1:1', '16:9', '4:3', '3:4'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 rounded-xl text-[13px] font-medium border transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? isDark
                        ? 'bg-white text-[#111214] border-white'
                        : 'bg-[#111214] text-white border-[#111214]'
                      : isDark
                      ? 'border-white/[0.1] text-stone-400 hover:border-white/[0.22]'
                      : 'border-black/[0.08] text-[#5A5D63] hover:border-black/[0.2]'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {generatedImageUrl && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#0B0C0E] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <h3 className="text-[13.5px] font-semibold flex items-center gap-1.5">
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{isArabic ? 'الصورة المُنشأة' : 'Generated Image'}</span>
              </h3>
              <div className="flex justify-center">
                <img src={generatedImageUrl} alt="Generated" className="max-h-64 rounded-xl object-contain shadow-md" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-inherit">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/[0.08] text-stone-300' : 'hover:bg-black/[0.05] text-[#3F4248]'
            }`}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>

          {generatedImageUrl ? (
            <button
              type="button"
              onClick={handleInsert}
              className={`px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              {isArabic ? 'إدراج في المحادثة' : 'Insert into Chat'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading || !prompt.trim()}
              onClick={handleCreateImage}
              className={`px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all shadow-sm disabled:opacity-40 active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-stone-200 text-[#111214]'
                  : 'bg-[#111214] hover:bg-[#27292D] text-white'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isArabic ? 'جاري الإنشاء...' : 'Creating...'}</span>
                </span>
              ) : (
                isArabic ? 'إنشاء الصورة' : 'Create Image'
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
