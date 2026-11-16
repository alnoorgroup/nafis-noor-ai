import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
  RotateCcw,
  Calendar,
  Compass,
  ArrowRight,
  ChevronRight,
  BellRing,
  Heart,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { PrayerName, PrayerRecord, PrayerTimingItem } from '../../types/prayerCheck';
import {
  PRAYER_NAMES,
  PRAYER_ARABIC_NAMES,
  fetchAladhanPrayerTimes,
  getPrayerScheduleMetrics,
  isPrayerTimeArrived,
  ON_TIME_GRACE_PERIOD_MINUTES,
  AUTO_MISS_THRESHOLD_MINUTES,
} from '../../utils/aladhanService';
import {
  getRecordsByDate,
  getAllPrayerRecords,
  savePrayerRecord,
  buildPrayerId,
} from '../../utils/prayerCheckDb';
import { sendPrayerCheckNotification } from '../../utils/prayerNotificationHelper';
import { PrayerCheckModal } from './PrayerCheckModal';
import { OathFaqModal } from './OathFaqModal';
import { t, getLanguageCode, isRTLLanguage, TranslationKey } from '../../utils/i18n';
import { PrayerTimesSkeleton } from '../SkeletonLoaders';

interface PrayerCheckScreenProps {
  isDark?: boolean;
  userLocation?: string;
  userLatitude?: number;
  userLongitude?: number;
  language?: string;
  onNavigate?: (tab: string) => void;
}

export const PrayerCheckScreen: React.FC<PrayerCheckScreenProps> = ({
  isDark = true,
  userLocation = 'Makkah',
  userLatitude,
  userLongitude,
  language = 'English',
  onNavigate,
}) => {
  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  // Prayer timings state from Aladhan API
  const [timings, setTimings] = useState<Record<PrayerName, string>>({
    Fajr: '05:08',
    Dhuhr: '12:15',
    Asr: '15:35',
    Maghrib: '17:58',
    Isha: '19:28',
  });
  const [dataSource, setDataSource] = useState<'aladhan' | 'local'>('aladhan');
  const [isLoadingTimings, setIsLoadingTimings] = useState<boolean>(true);

  // Today's prayer records from IndexedDB
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayRecords, setTodayRecords] = useState<Record<PrayerName, PrayerRecord | undefined>>({
    Fajr: undefined,
    Dhuhr: undefined,
    Asr: undefined,
    Maghrib: undefined,
    Isha: undefined,
  });

  // Historical records from IndexedDB
  const [historyRecords, setHistoryRecords] = useState<PrayerRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Active Oath Modal state
  const [activeCheckPrayer, setActiveCheckPrayer] = useState<{
    name: PrayerName;
    timeStr: string;
  } | null>(null);

  // FAQ Modal state
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);

  // Current time ticker for live countdowns
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Load timings from Aladhan API
  useEffect(() => {
    let isMounted = true;
    async function loadTimings() {
      setIsLoadingTimings(true);
      try {
        const result = await fetchAladhanPrayerTimes(userLocation, userLatitude, userLongitude);
        if (isMounted) {
          setTimings(result.timings);
          setDataSource(result.source);
        }
      } catch (err) {
        console.warn('Could not fetch from Aladhan API:', err);
      } finally {
        if (isMounted) setIsLoadingTimings(false);
      }
    }

    loadTimings();
    return () => {
      isMounted = false;
    };
  }, [userLocation, userLatitude, userLongitude]);

  // Load today's records and historical records from local IndexedDB
  const loadDbRecords = async () => {
    try {
      const records = await getRecordsByDate(todayStr);
      const mapped: Record<PrayerName, PrayerRecord | undefined> = {
        Fajr: undefined,
        Dhuhr: undefined,
        Asr: undefined,
        Maghrib: undefined,
        Isha: undefined,
      };

      records.forEach((r) => {
        mapped[r.prayerName] = r;
      });

      setTodayRecords(mapped);

      const all = await getAllPrayerRecords();
      setHistoryRecords(all);
    } catch (err) {
      console.warn('Error loading prayer check records from IndexedDB:', err);
    }
  };

  useEffect(() => {
    loadDbRecords();
  }, [todayStr]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute schedule metrics
  const metrics = getPrayerScheduleMetrics(timings, currentTime);
  const activePrayerItem = metrics.currentItem;
  const nextPrayerItem = metrics.nextItem;

  // Handler when oath flow completes
  const handleOathComplete = (record: PrayerRecord) => {
    setTodayRecords((prev) => ({
      ...prev,
      [record.prayerName]: record,
    }));
    loadDbRecords();
    setActiveCheckPrayer(null);
  };

  // Launch modal for prayer
  const handleOpenCheck = (name: PrayerName) => {
    setActiveCheckPrayer({
      name,
      timeStr: timings[name] || '12:00',
    });
  };

  // Stats calculation
  const totalCompleted = Object.values(todayRecords).filter((r) => r && (r.status === 'on_time' || r.status === 'late')).length;

  // Arrived prayers check
  const arrivedPrayers = PRAYER_NAMES.filter((p) => isPrayerTimeArrived(timings[p], currentTime));
  const unrecordedArrived = arrivedPrayers.find((p) => !todayRecords[p]);
  const quickCheckPrayer = unrecordedArrived || (arrivedPrayers.length > 0 ? arrivedPrayers[arrivedPrayers.length - 1] : null);

  const getPrayerLocalizedName = (prayer: PrayerName): string => {
    if (isArabic) {
      return PRAYER_ARABIC_NAMES[prayer];
    }
    return t(langCode, prayer.toLowerCase() as TranslationKey);
  };

  return (
    <div
      className="min-h-screen pt-4 sm:pt-6 pb-32 sm:pb-36 lg:pb-16 px-3.5 sm:px-6 max-w-5xl mx-auto space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Banner */}
      <div className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border transition-all ${
        isDark
          ? 'border-white/[0.08] bg-[#14161A] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
          : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
              isDark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <Compass className="w-3.5 h-3.5" />
              <span className="capitalize">{userLocation}</span>
            </div>

            <h1 className={`text-3xl sm:text-4xl font-serif-heading font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {t(langCode, 'prayerCheckHeroTitle')}
            </h1>
            {!isArabic && (
              <p className={`text-xl font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                تحقيق ومتابعة الصلوات الخمس اليومية
              </p>
            )}
            <p className={`text-xs sm:text-sm font-light max-w-2xl leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
              {t(langCode, 'prayerCheckHeroDesc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            {quickCheckPrayer ? (
              <button
                type="button"
                onClick={() => handleOpenCheck(quickCheckPrayer)}
                className={`py-3 px-5 rounded-2xl text-xs font-bold font-cinzel tracking-wider uppercase shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {t(langCode, 'checkNow')} ({getPrayerLocalizedName(quickCheckPrayer)})
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className={`py-3 px-5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed ${
                  isDark ? 'bg-white/[0.04] border-white/10 text-stone-500' : 'bg-[#F3F3F1] border-black/[0.08] text-[#6B6F76]'
                }`}
              >
                <Lock className="w-4 h-4 text-stone-500" />
                <span>
                  {t(langCode, 'nextLocked')}: {getPrayerLocalizedName('Fajr')} ({timings.Fajr})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Daily Prayers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <h2 className={`text-base font-serif-heading font-bold ${isDark ? 'text-stone-100' : 'text-[#111214]'}`}>
              {t(langCode, 'todays5Prayers')}
            </h2>
          </div>
          <div className={`text-xs font-mono font-semibold ${isDark ? 'text-stone-200' : 'text-[#111214]'}`}>
            {totalCompleted} / 5 {t(langCode, 'completedOf5')}
          </div>
        </div>

        {isLoadingTimings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 animate-fadeIn">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`prayer-card-skeleton-${idx}`}
                className={`p-4 rounded-3xl border space-y-3 ${
                  isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-3.5 w-16 rounded-md ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                  <div className={`h-4 w-12 rounded-full ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                </div>
                <div className={`h-6 w-24 rounded-lg ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                <div className={`h-8 w-20 rounded-xl ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                <div className={`h-9 w-full rounded-xl ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'} mt-2`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {PRAYER_NAMES.map((prayer) => {
            const timeStr = timings[prayer] || '--:--';
            const record = todayRecords[prayer];
            const arabicName = PRAYER_ARABIC_NAMES[prayer];
            const localizedPrayer = getPrayerLocalizedName(prayer);
            const hasArrived = isPrayerTimeArrived(timeStr, currentTime);
            const isCurrent = activePrayerItem.name === prayer && hasArrived;

            let statusBadge = (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-white/5 text-stone-400 border-white/10' : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}>
                {t(langCode, 'statusPending')}
              </span>
            );

            if (!hasArrived) {
              statusBadge = (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isDark ? 'bg-stone-800/80 text-stone-400 border-white/10' : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}>
                  <Lock className="w-3 h-3" />
                  <span>{t(langCode, 'statusLocked')}</span>
                </span>
              );
            } else if (record) {
              if (record.status === 'on_time') {
                statusBadge = (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }`}>
                    {t(langCode, 'statusOnTime')}
                  </span>
                );
              } else if (record.status === 'late') {
                statusBadge = (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-800 border-sky-300'
                  }`}>
                    {t(langCode, 'statusLate')}
                  </span>
                );
              } else if (record.status === 'did_not_pray') {
                statusBadge = (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-700 border-purple-300'
                  }`}>
                    {t(langCode, 'statusDidNotPray')}
                  </span>
                );
              } else if (record.status === 'missed') {
                statusBadge = (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isDark ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {t(langCode, 'statusMissed')}
                  </span>
                );
              }
            } else {
              statusBadge = (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold animate-pulse ${
                  isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-800 border-sky-300'
                }`}>
                  {t(langCode, 'statusTimeArrived')}
                </span>
              );
            }

            return (
              <div
                key={prayer}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  !hasArrived
                    ? isDark ? 'bg-[#14161A]/60 border-white/[0.06] opacity-75' : 'bg-[#F3F3F1] border-black/[0.06] opacity-85'
                    : isCurrent
                    ? isDark
                      ? 'bg-[#1B1D23] border-white/40 shadow-sm'
                      : 'bg-[#111214]/[0.04] border-[#111214]/40 shadow-sm'
                    : isDark
                    ? 'bg-[#14161A] border-white/[0.08] hover:border-white/20'
                    : 'bg-white border-black/[0.08] hover:border-black/20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-mono font-semibold uppercase ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {localizedPrayer}
                    </span>
                    {statusBadge}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className={`text-lg font-bold font-serif-heading ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {localizedPrayer}
                    </h3>
                    {!isArabic && (
                      <span className={`text-base font-arabic ${isDark ? 'text-stone-200' : 'text-[#111214]'}`} dir="rtl">
                        {arabicName}
                      </span>
                    )}
                  </div>

                  <div className={`text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                    {timeStr}
                  </div>
                </div>

                {!hasArrived ? (
                  <button
                    type="button"
                    disabled
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-not-allowed flex items-center justify-center gap-1.5 ${
                      isDark ? 'bg-white/[0.03] text-stone-500 border-white/5' : 'bg-[#F3F3F1] text-[#6B6F76] border-black/[0.06]'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      {t(langCode, 'statusLocked')} ({timeStr})
                    </span>
                  </button>
                ) : record ? (
                  <button
                    type="button"
                    onClick={() => handleOpenCheck(prayer)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] ${
                      isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 border-white/10' : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214] border-black/[0.08]'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>
                      {t(langCode, 'prayerLogged')} ({t(langCode, 'retry')})
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenCheck(prayer)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                      isDark ? 'bg-white hover:bg-stone-200 text-[#111214]' : 'bg-[#111214] hover:bg-[#27292D] text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isArabic ? `هل صليت ${arabicName}؟` : `Check ${localizedPrayer}`}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* Educational Banner & Rules Explanation */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isDark ? 'bg-[#14161A] border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.25)]' : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-serif-heading font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'كيف يعمل التحقق من الصلاة في 4 خطوات' : 'How the 4-Step Prayer Verification Operates'}
              </h3>
              <p className={`text-xs font-sans ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic ? 'محاسبة إسلامية أصيلة بدون حفظ سحابي' : 'Authentic Islamic accountability with zero cloud synchronization'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFaqOpen(true)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'text-white hover:bg-white/[0.1] bg-white/[0.06] border-white/15'
                : 'text-[#111214] hover:bg-black/[0.06] bg-[#F3F3F1] border-black/[0.08]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isArabic ? 'الأسئلة الشائعة والأحكام' : 'Oath FAQ & Rulings'}</span>
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
          <div className={`p-3.5 rounded-2xl border space-y-1 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'}`}>
            <strong className={`block ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? 'الخطوة 1: متاح في وقته' : 'STEP 1: Unlocked on Time'}
            </strong>
            <p>
              {isArabic
                ? 'يفتح كل فرض عند حلول وقته الفعلي. تُسأل بصدق هل صليت في الوقت أم قضاء أم لم تصل.'
                : 'Each prayer unlocks at its exact time. You are asked directly whether you prayed (On time or Late/Qada) or not.'}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'}`}>
            <strong className={`block ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
              {isArabic ? 'الخطوة 2: وقفة وتأمل' : 'STEP 2: Mindful Reflection'}
            </strong>
            <p>
              {isArabic
                ? 'وقفة تأمل واستشعار عظمة الله والصدق. زر "أقر وأفهم" مؤمن لمدة 20 ثانية للتفكر.'
                : 'Reflect on truthfulness and Islamic accountability. "I Understand" is locked for 20 seconds of contemplation.'}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'}`}>
            <strong className={`block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {isArabic ? 'الخطوة 3: الإقرار والشهادة' : 'STEP 3: Confirmation'}
            </strong>
            <p>
              {isArabic
                ? 'إقرار بصدق بالصيغة الشرعية أو اختيار "لم أصل" بدون أي حرج أو تصنع.'
                : 'Declare confirmation with Arabic testimony, or choose "I Did Not Pray" with zero guilt.'}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'}`}>
            <strong className={`block ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
              {isArabic ? 'الخطوة 4: حفظ السجل' : 'STEP 4: Record Saved'}
            </strong>
            <p>
              {isArabic
                ? 'تقبل الله منا ومنكم إن أديتها، وإن لم تؤدها فالله غفور رحيم. يحفظ محلياً في جهازك فقط.'
                : 'If completed: "May Allah accept it". If not: "Allah is Most Merciful". Saved exclusively to your browser\'s IndexedDB.'}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Records & Testing Tools */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl border ${
        isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-white/[0.06] text-white' : 'bg-[#F3F3F1] text-[#111214]'
          }`}>
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? 'سجلات الصلوات المحلية' : 'Local IndexedDB Records'}
            </h4>
            <p className={`text-xs font-sans ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? `${historyRecords.length} صلاة مسجلة محلياً على هذا الجهاز`
                : `${historyRecords.length} total historical prayers logged on this device`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className={`py-2.5 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 border-white/10'
                : 'bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214] border-black/[0.08]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>
              {isArabic
                ? showHistoryModal
                  ? 'إخفاء السجل'
                  : 'عرض السجل الكامل'
                : showHistoryModal
                ? 'Hide Log'
                : 'View Full History'}
            </span>
          </button>
        </div>
      </div>

      {/* History Drawer/View */}
      {showHistoryModal && (
        <div className={`p-5 rounded-3xl border shadow-sm space-y-3 animate-fadeIn ${
          isDark ? 'bg-[#14161A] border-white/[0.08]' : 'bg-white border-black/[0.08]'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-white/10' : 'border-black/[0.08]'}`}>
            <h4 className={`text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
              {isArabic ? 'سجلات الصلوات (تخزين محلي آمن)' : 'IndexedDB Prayer Records (No Cloud Sync)'}
            </h4>
            <span className={`text-[11px] font-mono ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic ? 'المخزن: prayer_records' : 'Store: prayer_records'}
            </span>
          </div>

          {historyRecords.length === 0 ? (
            <p className={`text-xs py-4 text-center ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
              {isArabic
                ? 'لا توجد سجلات بعد. أتمم التحقق من أول صلاة لحفظها هنا.'
                : 'No historical records found yet. Complete a prayer check above to record your first entry.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {historyRecords.map((rec) => (
                <div
                  key={rec.prayerId}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold font-serif-heading text-sm ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                      {getPrayerLocalizedName(rec.prayerName)}
                    </span>
                    <span className={`font-mono text-[11px] ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                      {rec.date} ({rec.scheduledTime || (isArabic ? 'مقررة' : 'Scheduled')})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        rec.status === 'on_time'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                          : rec.status === 'late'
                          ? isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-50 text-sky-800'
                          : rec.status === 'did_not_pray'
                          ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'
                          : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {rec.status === 'on_time'
                        ? t(langCode, 'statusOnTime')
                        : rec.status === 'late'
                        ? t(langCode, 'statusLate')
                        : rec.status === 'did_not_pray'
                        ? t(langCode, 'statusDidNotPray')
                        : t(langCode, 'statusMissed')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Full-Screen Prayer Check Oath Modal */}
      {activeCheckPrayer && (
        <PrayerCheckModal
          isOpen={Boolean(activeCheckPrayer)}
          onClose={() => setActiveCheckPrayer(null)}
          prayerName={activeCheckPrayer.name}
          scheduledTimeStr={activeCheckPrayer.timeStr}
          prayerDate={new Date()}
          onComplete={handleOathComplete}
          isDark={isDark}
          language={language}
        />
      )}

      {/* FAQ Modal */}
      <OathFaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        isDark={isDark}
        language={language}
      />
    </div>
  );
};
