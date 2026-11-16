import React from 'react';
import { X, ShieldAlert, BookOpen, AlertOctagon, HeartHandshake, CheckCircle } from 'lucide-react';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface OathFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  language?: string;
}

export const OathFaqModal: React.FC<OathFaqModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'oath-faq-modal');

  if (!isOpen) return null;

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'الأسئلة الشائعة حول عِظَم اليمين في الإسلام' : 'The Gravity of Swearing Falsely in Islam FAQ'}
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-xl max-h-[88vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.1] text-[#F3F4F6]'
            : 'bg-[#FCFCFA] border-black/[0.08] text-[#111214]'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/[0.08] bg-[#14161A]' : 'border-black/[0.08] bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark ? 'bg-white/[0.08] border-white/15 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'عِظَمُ اليمين في الإسلام' : 'The Weight of an Oath in Islam'}
              </h3>
              <p className={`text-xs font-arabic ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic ? 'حكم اليمين الغموس وحقيقة محاسبة النفس' : 'عِظَمُ اليمين في الإسلام وخطر اليمين الغموس'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
            }`}
            aria-label={isArabic ? 'إغلاق' : 'Close FAQ'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FAQ Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed">
          {isArabic ? (
            <>
              <div className={`p-4 rounded-2xl border space-y-2 text-right ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <AlertOctagon className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                  <span>ما هي اليمين الغموس؟</span>
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  في الفقه الإسلامي، <strong className={isDark ? 'text-white' : 'text-[#111214]'}>اليمين الغموس</strong> هي الحلف بالله تعالى كذباً مع العلم والتعمد. وسُمّيت غموساً لأنها تغمس صاحبها في الإثم ثم تغمسه في نار جهنم والعياذ بالله.
                </p>
                <blockquote className={`border-r-2 pr-3 py-1 my-2 text-xs italic font-serif ${
                  isDark ? 'border-white/30 text-stone-400' : 'border-black/30 text-[#5A5D63]'
                }`}>
                  «الكبائر: الإشراك بالله، وعقوق الوالدين، وقتل النفس، واليمين الغموس»
                  <span className={`block text-[11px] not-italic mt-0.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>— صحيح البخاري (6675)</span>
                </blockquote>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 text-right ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <BookOpen className={`w-4 h-4 shrink-0 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>لماذا يعتمد تطبيق «نور» على نظام الإقرار الشرعي؟</span>
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  الصلاة هي عماد الدين ورابطتنا الوثيقة برب العالمين. في تطبيقات المتابعة الرقمية، قد يقع المرء في فخ الضغط على "تم" فقط للحفاظ على السلسلة دون صدق حقيقي.
                </p>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  وضعنا هذا الإقرار الواعي لنزع الغفلة واستشعار الوقوف بين يدي الله بصدق وإخلاص لا تشوبه شائبة.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 text-right ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <HeartHandshake className={`w-4 h-4 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span>ماذا أفعل إن لم أكن قد صليت بعد؟</span>
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  لا تُحرج أبداً ولا تحلف كذباً؛ اختر ببساطة <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>«لم أصلِّ»</strong>. فالصدق والاعتراف أحب إلى الله تعالى من أي ادعاء باطل.
                </p>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  وإن فاتتك الصلاة لنوم أو نسيان، قال النبي ﷺ: «من نسي صلاة أو نام عنها فكفارتها أن يصليها إذا ذكرها» (صحيح مسلم 684). بادر وتوضأ وصلّها قضاءً الآن.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 text-right ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <CheckCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>ما هو الفرق بين الصلاة «في وقتها» و«قضاءً»؟</span>
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  إذا أديت الصلاة مع الأذان وفي أول وقتها مع مهلة <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>10 دقائق</strong> فتُسجل في وقتها. وإن صليتها بعد ذلك ضمن وقت الفريضة فتُسجل قضاءً أو متأخرة. وإن مضت المدة دون تسجيل فتُحفظ أمانةً بأنها فاتت لتحافظ على مصداقية سجلك.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <AlertOctagon className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                  What is Al-Yameen Al-Ghamoos (اليمين الغموس)?
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  In Islamic jurisprudence, <strong className={isDark ? 'text-white' : 'text-[#111214]'}>Al-Yameen Al-Ghamoos</strong> (the plunging oath) is swearing falsely by Allah deliberately knowing that one is lying. It is called <em>ghamoos</em> because it plunges the person into sin and into the Fire.
                </p>
                <blockquote className={`border-l-2 pl-3 py-1 my-2 text-xs italic font-serif ${
                  isDark ? 'border-white/30 text-stone-400' : 'border-black/30 text-[#5A5D63]'
                }`}>
                  "The major sins are: Associating partners with Allah, disobeying parents, taking an innocent life, and false oath (al-yameen al-ghamoos)."
                  <span className={`block text-[11px] not-italic mt-0.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>— Sahih al-Bukhari 6675</span>
                </blockquote>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <BookOpen className={`w-4 h-4 shrink-0 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  Why does Noor use an Oath Confirmation system?
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  Salah (prayer) is the cornerstone of Islam and our covenant with our Creator. Gamified trackers often tempt users into blindly clicking "Done" just to maintain a streak.
                </p>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  The oath system removes false complacency. It restores absolute mindfulness, ensuring every recorded prayer reflects genuine standing before Allah.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <HeartHandshake className={`w-4 h-4 shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  What if I did not pray yet?
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  Never feel pressured to swear. Simply select <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>"I Did Not Pray"</strong>. Honesty is infinitely more beloved to Allah than a false assertion.
                </p>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  If a prayer was missed due to sleep or forgetfulness, the Prophet ﷺ taught us: <em>"Whoever forgets a prayer or sleeps through it, its expiation is to pray it when he remembers it."</em> (Sahih Muslim 684). Perform wudu now and make up the prayer (Qada).
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-2xs'
              }`}>
                <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <CheckCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  What counts as "On Time" vs "Late"?
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  Our system honors a <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>10-minute grace period</strong> after the adhan/scheduled time as "On time". If you performed the prayer later within its valid prayer window, select "Late". If 30 minutes pass without response, it is respectfully archived as missed so your records remain authentic.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDark ? 'border-white/[0.08] bg-[#14161A]' : 'border-black/[0.08] bg-white'
        }`}>
          <button
            onClick={onClose}
            className={`py-2.5 px-6 rounded-2xl text-xs font-bold font-cinzel tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            {isArabic ? 'فهمت وأقر — العودة إلى التحقق' : 'I Understand — Return to Check'}
          </button>
        </div>
      </div>
    </div>
  );
};
