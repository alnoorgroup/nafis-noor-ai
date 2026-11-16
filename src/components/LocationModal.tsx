import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Search,
  Check,
  X,
  Sparkles,
  Settings2,
  Globe2,
  Sliders,
  Info
} from 'lucide-react';
import { UserStats, CalculationMethodKey, AsrMadhabKey } from '../types';
import { POPULAR_CITIES, CALCULATION_METHODS_META, CITY_ARABIC_NAMES, findCityByName } from '../data/citiesData';
import { calculatePrayerTimes } from '../utils/prayerTimes';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onUpdateStats,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'location-settings-modal');

  const isArabic = (userStats.language || '').toLowerCase().startsWith('ar') || 
    (typeof window !== 'undefined' && localStorage.getItem('noor_app_language') === 'ar');

  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'city' | 'method'>('city');

  if (!isOpen) return null;

  const currentMethod: CalculationMethodKey = userStats.prayerCalculationMethod || 'UmmAlQura';
  const currentMadhab: AsrMadhabKey = userStats.asrJuristicMethod || 'Shafi';

  // Filter cities by search query (English and Arabic names)
  const filteredCities = POPULAR_CITIES.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const arMeta = CITY_ARABIC_NAMES[c.name];
    const arName = arMeta?.nameAr || '';
    const arCountry = arMeta?.countryAr || '';

    return (
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      `${c.name}, ${c.country}`.toLowerCase().includes(q) ||
      arName.includes(q) ||
      arCountry.includes(q) ||
      `${arName} ${arCountry}`.includes(q)
    );
  });

  const handleSelectCity = (city: typeof POPULAR_CITIES[0]) => {
    onUpdateStats({
      userLocation: city.name,
      userCountry: city.country,
      userLatitude: city.latitude,
      userLongitude: city.longitude,
      prayerCalculationMethod: city.defaultMethod,
    });
    setGeoError(null);
  };

  const handleDetectGPS = () => {
    setIsDetectingLocation(true);
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setGeoError(
        isArabic
          ? 'خاصية تحديد الموقع الجغرافي غير مدعومة في هذا المتصفح. يُرجى اختيار المدينة يدوياً من القائمة.'
          : 'Geolocation is not supported in this browser. Please pick a city from the list.'
      );
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        let detectedCityName = isArabic ? 'موقع تم رصده' : 'Detected Location';
        try {
          // Find closest city in our list as friendly name if nearby
          let closest = POPULAR_CITIES[0];
          let minDist = Infinity;
          for (const c of POPULAR_CITIES) {
            const dist = Math.hypot(c.latitude - lat, c.longitude - lng);
            if (dist < minDist) {
              minDist = dist;
              closest = c;
            }
          }
          if (minDist < 1.0) {
            detectedCityName = closest.name;
          } else {
            detectedCityName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
          }
        } catch {
          detectedCityName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        }

        onUpdateStats({
          userLocation: detectedCityName,
          userLatitude: lat,
          userLongitude: lng,
        });
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoError(
          isArabic
            ? 'تم رفض إذن تحديد الموقع أو أنه غير متاح حالياً. يُرجى اختيار مدينتك يدوياً أدناه.'
            : 'Location permission denied or unavailable. Please select your city manually below.'
        );
        setIsDetectingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Preview prayer times under current settings
  const preview = calculatePrayerTimes({
    latitude: userStats.userLatitude,
    longitude: userStats.userLongitude,
    locationName: userStats.userLocation,
    calculationMethod: currentMethod,
    asrMadhab: currentMadhab,
  });

  const activeMethodMeta = CALCULATION_METHODS_META.find((m) => m.key === currentMethod);
  const activeMethodDisplayName = isArabic && activeMethodMeta ? activeMethodMeta.nameAr : preview.methodName;
  const activeCityMeta = CITY_ARABIC_NAMES[userStats.userLocation || ''];
  const activeLocationDisplayName = isArabic && activeCityMeta ? activeCityMeta.nameAr : (preview.locationName || userStats.userLocation || 'مكة المكرمة');

  return (
    <div
      id="location-settings-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(14px,env(safe-area-inset-bottom))] bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="location-settings-modal-content"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`w-full max-w-md rounded-3xl p-4 sm:p-6 border transition-all duration-200 relative max-h-[min(92dvh,720px)] flex flex-col ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6] shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
            : 'bg-white border-black/[0.08] text-[#111214] shadow-[0_12px_40px_rgba(0,0,0,0.12)]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.1] text-white'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-cinzel text-sm font-bold tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'الموقع وطريقة الحساب' : 'LOCATION & CALCULATION'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? 'جدول مواقيت الصلاة الفلكية الدقيقة' : 'Accurate astronomical Salah schedule'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-400 hover:text-white hover:bg-white/[0.08]'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#6B6F76] hover:text-[#111214] hover:bg-black/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: City Selector vs Calculation Method */}
        <div className={`flex items-center gap-1.5 p-1 rounded-2xl border mb-3.5 ${
          isDark ? 'bg-[#0B0C0E] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
        }`}>
          <button
            onClick={() => setActiveTab('city')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'city'
                ? isDark
                  ? 'bg-white text-[#111214] font-bold shadow-sm'
                  : 'bg-[#111214] text-white font-bold shadow-sm'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-[#5A5D63] hover:text-[#111214]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'اختيار المدينة' : 'Select City'}</span>
          </button>
          <button
            onClick={() => setActiveTab('method')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'method'
                ? isDark
                  ? 'bg-white text-[#111214] font-bold shadow-sm'
                  : 'bg-[#111214] text-white font-bold shadow-sm'
                : isDark
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-[#5A5D63] hover:text-[#111214]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isArabic ? 'طريقة الحساب ومذهب العصر' : 'Method & Asr'}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CITY & GPS DETECT */}
        {/* ========================================================================= */}
        {activeTab === 'city' && (
          <div className="space-y-3">
            {/* GPS Auto-Detect Button */}
            <button
              id="gps-auto-detect-btn"
              onClick={handleDetectGPS}
              disabled={isDetectingLocation}
              className={`w-full py-2.5 px-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm group cursor-pointer ${
                isDark
                  ? 'border-white/[0.14] bg-[#1B1D23] hover:bg-white/[0.08] text-white'
                  : 'border-black/[0.1] bg-[#F3F3F1] hover:bg-black/[0.06] text-[#111214]'
              }`}
            >
              <Compass className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`} />
              <span>
                {isDetectingLocation
                  ? (isArabic ? 'جاري تحديد إحداثيات الموقع (GPS)...' : 'Determining GPS Coordinates...')
                  : (isArabic ? 'استخدام موقع الجهاز الحالي (GPS)' : 'Use Current Device Location (GPS)')}
              </span>
            </button>

            {geoError && (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{geoError}</span>
              </div>
            )}

            {/* City Search Bar */}
            <div className="relative">
              <Search className={`w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 ${isArabic ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={isArabic ? 'ابحث عن المدينة (مثل: مكة، القاهرة، الرياض، دبي)...' : 'Search city (e.g. London, New York, Cairo, Dubai)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 rounded-2xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#0B0C0E] border-white/[0.1] text-[#F3F4F6] focus:border-white/30 placeholder:text-stone-500'
                    : 'bg-[#FCFCFA] border-black/[0.1] text-[#111214] focus:border-black/30 placeholder:text-[#6B6F76]'
                } ${isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              />
            </div>

            {/* City List */}
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-1 pr-0.5">
              {filteredCities.map((city) => {
                const isSelected = userStats.userLocation === city.name;
                const arMeta = CITY_ARABIC_NAMES[city.name];
                const displayName = isArabic && arMeta ? arMeta.nameAr : city.name;
                const displayCountry = isArabic && arMeta ? arMeta.countryAr : city.country;

                return (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => handleSelectCity(city)}
                    className={`w-full p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${isArabic ? 'text-right' : 'text-left'} ${
                      isSelected
                        ? isDark
                          ? 'bg-white/[0.1] border-white/30 text-white font-semibold'
                          : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] font-semibold'
                        : isDark
                        ? 'bg-[#1B1D23]/70 border-white/[0.06] text-stone-300 hover:border-white/[0.15] hover:bg-[#1B1D23]'
                        : 'bg-[#FCFCFA] border-black/[0.08] text-[#3F4248] hover:border-black/[0.18] hover:bg-[#F3F3F1]'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold flex items-center gap-1.5 ${
                        isSelected
                          ? isDark ? 'text-white' : 'text-[#111214]'
                          : isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                      }`}>
                        <span>{displayName}</span>
                        <span className={`text-[10px] font-normal ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>({displayCountry})</span>
                      </div>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                        {city.latitude.toFixed(2)}° N, {city.longitude.toFixed(2)}° E
                      </div>
                    </div>

                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white text-[#111214]' : 'bg-[#111214] text-white'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredCities.length === 0 && (
                <div className={`text-center py-6 text-xs ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                  {isArabic
                    ? `لا توجد مدن تطابق "${searchQuery}". يمكنك تفعيل التحديد التلقائي أو اختيار أقرب مدينة كبرى.`
                    : `No cities matching "${searchQuery}". You can use GPS auto-detect or enter nearby major city.`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CALCULATION METHOD & ASR JURISTIC SCHOOL */}
        {/* ========================================================================= */}
        {activeTab === 'method' && (
          <div className="space-y-3.5">
            {/* Calculation Method */}
            <div>
              <label className={`text-[11px] font-semibold block mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {isArabic ? 'الهيئة المعتمدة لحساب المواقيت:' : 'Calculation Authority / Standard:'}
              </label>
              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
                {CALCULATION_METHODS_META.map((method) => {
                  const isSelected = currentMethod === method.key;
                  return (
                    <button
                      key={method.key}
                      onClick={() => onUpdateStats({ prayerCalculationMethod: method.key })}
                      className={`w-full p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${isArabic ? 'text-right' : 'text-left'} ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.1] border-white/30 text-white font-semibold'
                            : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] font-semibold'
                          : isDark
                          ? 'bg-[#1B1D23]/70 border-white/[0.06] text-stone-300 hover:border-white/[0.16]'
                          : 'bg-[#FCFCFA] border-black/[0.08] text-[#3F4248] hover:border-black/[0.18] hover:bg-[#F3F3F1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${
                          isSelected
                            ? isDark ? 'text-white' : 'text-[#111214]'
                            : isDark ? 'text-[#F3F4F6]' : 'text-[#111214]'
                        }`}>{isArabic ? method.nameAr : method.name}</span>
                        {isSelected && <Check className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />}
                      </div>
                      <p className={`text-[10px] mt-0.5 font-light leading-tight ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                        {isArabic ? method.descriptionAr : method.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asr Juristic School */}
            <div className={`pt-2 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <label className={`text-[11px] font-semibold block mb-1.5 ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {isArabic ? 'المذهب الفقهي لحساب وقت العصر:' : "'Asr Jurisprudence (Madhab):"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStats({ asrJuristicMethod: 'Shafi' })}
                  className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                    currentMadhab === 'Shafi'
                      ? isDark
                        ? 'bg-white/[0.1] border-white/30 text-white font-semibold'
                        : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] font-semibold'
                      : isDark
                      ? 'bg-[#1B1D23]/70 border-white/[0.06] text-stone-400'
                      : 'bg-[#FCFCFA] border-black/[0.08] text-[#3F4248] hover:bg-[#F3F3F1]'
                  }`}
                >
                  <div className={`font-semibold ${
                    currentMadhab === 'Shafi'
                      ? isDark ? 'text-white' : 'text-[#111214]'
                      : isDark ? 'text-stone-200' : 'text-[#111214]'
                  }`}>
                    {isArabic ? 'الجمهور (الشافعي والمالكي والحنبلي)' : "Standard / Shafi'i"}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'ظل الشيء مثله' : "Maliki, Hanbali, Shafi'i"}
                  </div>
                </button>

                <button
                  onClick={() => onUpdateStats({ asrJuristicMethod: 'Hanafi' })}
                  className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                    currentMadhab === 'Hanafi'
                      ? isDark
                        ? 'bg-white/[0.1] border-white/30 text-white font-semibold'
                        : 'bg-[#111214]/[0.06] border-[#111214]/40 text-[#111214] font-semibold'
                      : isDark
                      ? 'bg-[#1B1D23]/70 border-white/[0.06] text-stone-400'
                      : 'bg-[#FCFCFA] border-black/[0.08] text-[#3F4248] hover:bg-[#F3F3F1]'
                  }`}
                >
                  <div className={`font-semibold ${
                    currentMadhab === 'Hanafi'
                      ? isDark ? 'text-white' : 'text-[#111214]'
                      : isDark ? 'text-stone-200' : 'text-[#111214]'
                  }`}>
                    {isArabic ? 'المذهب الحنفي' : 'Hanafi'}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                    {isArabic ? 'ظل الشيء مثليه' : 'Shadow = 2x object'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Calculation Preview Footer */}
        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="truncate pr-2">
            <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{isArabic ? 'المحدد: ' : 'Active: '}</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{activeLocationDisplayName}</span>
            <span className={`text-[10px] block truncate ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>{activeMethodDisplayName}</span>
          </div>

          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white hover:bg-stone-200 text-[#111214]'
                : 'bg-[#111214] hover:bg-[#27292D] text-white'
            }`}
          >
            {isArabic ? 'تطبيق المواقيت' : 'Apply Times'}
          </button>
        </div>
      </div>
    </div>
  );
};
