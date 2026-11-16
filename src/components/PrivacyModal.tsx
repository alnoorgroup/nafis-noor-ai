import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  EyeOff,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserStats } from '../types';
import { exportUserDataJSON, deleteAccount } from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onResetAllData?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onUpdateStats,
  onResetAllData,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'privacy-sanctuary-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'policy' | 'manage' | 'delete'>('policy');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [copiedExport, setCopiedExport] = useState(false);
  const [hasClearedChat, setHasClearedChat] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    const jsonString = exportUserDataJSON(userStats);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noor-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleClearAiChatHistory = () => {
    onUpdateStats({
      noorAiConversation: [],
      noorAiSessions: [],
      activeNoorSessionId: undefined,
    });
    setHasClearedChat(true);
    setTimeout(() => setHasClearedChat(false), 3000);
  };

  const handleDeleteAccountPermanent = () => {
    if (userStats.accountId) {
      deleteAccount(userStats.accountId);
    }
    if (onResetAllData) {
      onResetAllData();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="privacy-modal-container"
        className={`w-full max-w-lg rounded-[32px] p-6 sm:p-7 border overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_24px_60px_rgba(0,0,0,0.65)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
              isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'الخصوصية وأمان البيانات' : 'Privacy & Data Sanctuary'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic ? 'شفافية كاملة وتحكم تام في بياناتك الشخصية' : 'Clear, transparent & respectful data control'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]' : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-1.5 p-1 my-4 rounded-2xl border shrink-0 text-xs ${
          isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
        }`}>
          <button
            onClick={() => setActiveTab('policy')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'policy'
                ? isDark
                  ? 'bg-white text-[#111214] shadow-sm'
                  : 'bg-[#111214] text-white shadow-sm'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-[#5A5D63] hover:text-[#111214]'
            }`}
          >
            {isArabic ? 'مبادئ الخصوصية' : 'Privacy Principles'}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? isDark
                  ? 'bg-white text-[#111214] shadow-sm'
                  : 'bg-[#111214] text-white shadow-sm'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-[#5A5D63] hover:text-[#111214]'
            }`}
          >
            {isArabic ? 'إدارة بياناتي' : 'Manage My Data'}
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'delete'
                ? isDark
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-red-50 text-red-700 border border-red-300 shadow-2xs'
                : isDark
                ? 'text-stone-400 hover:text-red-400'
                : 'text-[#5A5D63] hover:text-red-600'
            }`}
          >
            {isArabic ? 'حذف الحساب' : 'Delete Account'}
          </button>
        </div>

        {/* Tab 1: Privacy Principles */}
        {activeTab === 'policy' && (
          <div className={`overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed no-scrollbar ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            {/* Core Privacy Promise Callout */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <Sparkles className="w-4 h-4" />
                <span>{isArabic ? 'خصوصيتك أمانة مقدسة' : 'Your privacy matters.'}</span>
              </h3>
              <p className={isDark ? 'text-stone-200' : 'text-[#111214]'}>
                {isArabic
                  ? 'نستخدم فقط البيانات التي تختار تقديمها لتخصيص تجربتك الإيمانية في نور وتحسين عبادتك اليومية.'
                  : 'We only use the information you choose to provide to personalize Noor and improve your spiritual experience.'}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {isArabic ? (
                  <>
                    • بياناتك الشخصية لا تُنشر علناً بأي شكل من الأشكال.<br />
                    • تُحفظ معلوماتك بأمان في حسابك السحابي لتبقى إعداداتك وإنجازاتك متزامنة عبر أجهزتك.<br />
                    • خالٍ تماماً من الإعلانات، بيع البيانات، أو برمجيات التتبع والتجسس.
                  </>
                ) : (
                  <>
                    • Your private information is never displayed publicly.<br />
                    • Some information is stored securely with your Noor account so your settings and progress can follow you across devices.<br />
                    • No ads, no data selling, no tracking pixels.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Server className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>{isArabic ? 'ماذا نحفظ ولماذا؟' : 'What We Store & Why'}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic ? (
                    <>
                      <strong>معرّف الحساب والتفضيلات:</strong> لحفظ لغتك المختارة، المظهر، والموقع الجغرافي لحساب مواقيت الصلاة بدقة فلكية.<br />
                      <strong>سجلات العبادة الحقيقية:</strong> صفحات القرآن التي تقرأها، عداد الأذكار، الدروس المكتملة، ونقاط الإنجاز الفعلية.<br />
                      <strong>أسئلة نور الإسلامي:</strong> تُحفظ محلياً ومع حسابك فقط لربط سياق المحادثة عبر الشاشات المختلفة.
                    </>
                  ) : (
                    <>
                      <strong>Account ID & Preferences:</strong> To maintain your chosen language, theme, and location for astronomical prayer calculations.<br />
                      <strong>Legitimate Activity Records:</strong> Only the Qur'an pages you read, Dhikr counts, completed lessons, and earned XP you actually finish.<br />
                      <strong>Noor AI Questions:</strong> Saved locally / with your account only to preserve your conversational thread across screens.
                    </>
                  )}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Lock className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>{isArabic ? 'أمان كلمة المرور والتشفير' : 'Password Security'}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? 'يتم تشفير كلمات المرور باستخدام خوارزميات التشفير العالمية الموثوقة مع التمليح الأمني. لا تُحفظ أي كلمة مرور بنصها الصريح مطلقاً.'
                    : 'Passwords are cryptographically hashed using industry-standard SHA-256 with salting. Plaintext passwords are never stored in any database.'}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
                <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <EyeOff className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                  <span>{isArabic ? 'من يمكنه الوصول لبياناتك؟' : 'Who Can Access Your Data'}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? 'أنت وحدك من يملك الوصول لإحصائياتك وسجل محادثاتك. يمكنك تصدير بياناتك أو حذفها بالكامل في أي وقت بحرية تامة.'
                    : 'Only you have access to your personal stats and conversation history. You can export or delete your entire record at any time with complete autonomy.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manage My Data */}
        {activeTab === 'manage' && (
          <div className={`overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'}`}>
              <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <FileText className={`w-4 h-4 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`} />
                <span>{isArabic ? 'سجل بياناتك الحالي' : 'Current Data Footprint'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'معرف الحساب' : 'Account ID'}</div>
                  <div className={`font-mono truncate font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.accountId || (isArabic ? 'جلسة ضيف' : 'Guest Session')}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'أيام المواظبة' : 'Overall Streak'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.overallStreak} {isArabic ? 'يوم' : 'days'}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'صفحات القرآن' : 'Pages Read'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.quranPagesRead} {isArabic ? 'صفحة' : 'pages'}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'الآيات المحفوظة' : 'Saved Bookmarks'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.bookmarks.length} {isArabic ? 'آية' : 'ayahs'}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'نقاط الإنجاز' : 'Total XP'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.totalXP} {isArabic ? 'نقطة' : 'XP'}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#14161A] border-white/[0.06]' : 'bg-white border-black/[0.08]'}`}>
                  <div className={isDark ? 'text-stone-400' : 'text-[#6B6F76]'}>{isArabic ? 'رسائل نور الإسلامي' : 'AI Chat Messages'}</div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{userStats.noorAiConversation?.length || 0} {isArabic ? 'رسالة' : 'messages'}</div>
                </div>
              </div>
            </div>

            {/* Actions: Export Data & Clear AI History */}
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className={`w-full py-3 px-4 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-stone-200 border-white text-[#111214]'
                    : 'bg-[#111214] hover:bg-[#27292D] border-[#111214] text-white'
                }`}
              >
                {copiedExport ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
                <span>{copiedExport ? (isArabic ? 'تم تصدير وتنزيل ملف البيانات بنجاح!' : 'Data Exported to Download File!') : (isArabic ? 'تصدير كامل بياناتي بتنسيق JSON' : 'Export My Data as JSON')}</span>
              </button>

              <button
                onClick={handleClearAiChatHistory}
                className={`w-full py-3 px-4 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#1B1D23] hover:bg-white/[0.08] border-white/[0.1] text-stone-200'
                    : 'bg-[#F3F3F1] hover:bg-black/[0.06] border-black/[0.1] text-[#111214]'
                }`}
              >
                {hasClearedChat ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Trash2 className="w-4 h-4 text-stone-500" />}
                <span>{hasClearedChat ? (isArabic ? 'تم مسح سجل محادثات نور' : 'AI Chat History Cleared') : (isArabic ? 'مسح سجل محادثات نور الإسلامي' : 'Clear Noor AI Conversation History')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Delete Account */}
        {activeTab === 'delete' && (
          <div className={`overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
            <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'}`}>
              <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                <AlertTriangle className="w-5 h-5" />
                <span>{isArabic ? 'حذف الحساب نهائياً بلا رجعة' : 'Irreversible Account Deletion'}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-300' : 'text-red-900'}`}>
                {isArabic
                  ? 'حذف الحساب سيقوم بمسح كافة سجلات عبادتك وإنجازاتك، والعلامات المرجعية للقرآن، ونقاط الأكاديمية، والأدعية المحفوظة من هذا الجهاز ومن قاعدة البيانات نهائياً.'
                  : 'Deleting your account will permanently purge your progress records, Qur\'an bookmarks, learning XP, streaks, and saved duas from this device and our persistent database.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className={`block text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic ? (
                  <>
                    لتأكيد الحذف النهائي، اكتب <strong className={isDark ? 'text-red-400' : 'text-red-600'}>حذف</strong> في الحقل أدناه:
                  </>
                ) : (
                  <>
                    To confirm, type <strong className={isDark ? 'text-red-400' : 'text-red-600'}>DELETE</strong> in the box below:
                  </>
                )}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={isArabic ? 'اكتب كلمة حذف للتأكيد' : 'Type DELETE to confirm'}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs focus:outline-none focus:border-red-500 ${
                  isDark
                    ? 'bg-[#1B1D23] border-white/[0.1] text-stone-100 placeholder-stone-500'
                    : 'bg-[#F3F3F1] border-black/[0.1] text-[#111214] placeholder-[#6B6F76]'
                }`}
              />

              <button
                disabled={isArabic ? deleteConfirmText.trim() !== 'حذف' : deleteConfirmText.trim() !== 'DELETE'}
                onClick={handleDeleteAccountPermanent}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isArabic ? 'حذف حسابي وبياناتي نهائياً' : 'Permanently Delete My Account & Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Close */}
        <div className={`pt-4 mt-auto border-t shrink-0 flex justify-end ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1B1D23] hover:bg-white/[0.1] text-stone-200 border border-white/[0.08]'
                : 'bg-[#F3F3F1] hover:bg-black/[0.08] text-[#111214] border border-black/[0.08]'
            }`}
          >
            {isArabic ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
