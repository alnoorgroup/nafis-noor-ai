import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Compass,
  MapPin,
  Locate,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  calculateTrueQibla,
  calculateDistanceToKaaba,
  getCompassHeadingName,
  resolveCoordinates,
  normalizeAngle,
  getShortestAngleDiff,
  playAlignmentChime,
  triggerAlignmentHaptic,
  KAABA_COORDINATES,
} from '../utils/qiblaService';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface QiblaCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: string;
  isDark?: boolean;
}

/**
 * Normalizes angular interpolation with shortest circular path
 */
function smoothAngle(current: number, target: number, factor: number = 0.35): number {
  let diff = (target - current + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return normalizeAngle(current + diff * factor);
}

export const QiblaCompassModal: React.FC<QiblaCompassModalProps> = ({
  isOpen,
  onClose,
  userLocation = 'Makkah',
  isDark = true,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'qibla-compass-modal');

  // Geographical coordinates and astronomical bearing
  const [coords, setCoords] = useState(() => resolveCoordinates(userLocation));
  const [qiblaBearing, setQiblaBearing] = useState<number>(() =>
    calculateTrueQibla(coords.lat, coords.lng)
  );
  const [distance, setDistance] = useState(() =>
    calculateDistanceToKaaba(coords.lat, coords.lng)
  );

  // Compass heading state
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean | null>(null);
  const [sensorPermissionNeeded, setSensorPermissionNeeded] = useState<boolean>(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Inversion correction: some Android manufacturers report alpha in reverse
  const [isInverted, setIsInverted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('noor_qibla_inverted') === 'true';
    } catch {
      return false;
    }
  });

  // Display mode: 'phone_target' (Target at 12 o'clock, turn until needle points up) vs 'north_up' (Traditional fixed card)
  const [viewMode, setViewMode] = useState<'phone_target' | 'north_up'>('phone_target');

  // Audio & haptic lock guards
  const hasChimedRef = useRef<boolean>(false);
  const targetHeadingRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Update bearing whenever coordinates change
  useEffect(() => {
    const bearing = calculateTrueQibla(coords.lat, coords.lng);
    setQiblaBearing(bearing);
    setDistance(calculateDistanceToKaaba(coords.lat, coords.lng));
  }, [coords]);

  const toggleInverted = () => {
    setIsInverted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('noor_qibla_inverted', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // GPS Pinpoint Locator
  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          displayName: `GPS (${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°)`,
          isGPS: true,
        });
      },
      () => {
        setIsLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Request iOS permission if required
  const requestOrientationPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const response = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (response === 'granted') {
          setSensorPermissionNeeded(false);
          setHasSensor(true);
        } else {
          setSensorPermissionNeeded(false);
          setHasSensor(false);
        }
      } catch {
        setHasSensor(false);
      }
    }
  };

  // Device orientation sensor listener
  useEffect(() => {
    if (!isOpen) return;

    let sensorDetected = false;

    // Check if iOS requires user gesture permission
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      setSensorPermissionNeeded(true);
    }

    let lastSensorTime = 0;
    const handleOrientation = (e: any) => {
      // Throttle sensor readings to max 30 times a second (~33ms)
      const now = performance.now();
      if (now - lastSensorTime < 33) return;
      lastSensorTime = now;

      let detectedHeading: number | null = null;

      // 1. iOS Safari provides webkitCompassHeading (0 = North, increases clockwise to 360)
      if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading) && e.webkitCompassHeading >= 0) {
        detectedHeading = e.webkitCompassHeading;
      }
      // 2. Android deviceorientationabsolute or deviceorientation event
      else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        // Standard Android: 360 - alpha gives clockwise degrees from North
        detectedHeading = normalizeAngle(360 - e.alpha);
      }

      if (detectedHeading !== null && !isNaN(detectedHeading)) {
        if (!sensorDetected) {
          sensorDetected = true;
          setHasSensor(true);
          setSensorPermissionNeeded(false);
        }

        // Apply user inversion setting if device sensor is reversed
        const finalHeading = isInverted
          ? normalizeAngle(360 - detectedHeading)
          : normalizeAngle(detectedHeading);

        targetHeadingRef.current = finalHeading;
      }
    };

    // Smooth 30fps animation loop for compass needle movement (halves CPU/GPU usage on iOS)
    let isRunning = true;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 30; // 30fps throttle for battery life

    const updateLoop = (timestamp: number) => {
      if (!isRunning) return;
      if (timestamp - lastFrameTime >= frameInterval) {
        lastFrameTime = timestamp;
        setHeading((prev) => {
          const diff = Math.abs(getShortestAngleDiff(targetHeadingRef.current, prev));
          if (diff < 0.15) return prev;
          return smoothAngle(prev, targetHeadingRef.current, 0.35);
        });
      }
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };
    animFrameRef.current = requestAnimationFrame(updateLoop);

    // Register event listeners
    const win = window as any;
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in win) {
      win.addEventListener('deviceorientation', handleOrientation, true);
    }

    // Timeout check: if no sensor events after 1.5 seconds, set hasSensor = false for manual controls
    const timer = setTimeout(() => {
      if (!sensorDetected && !sensorPermissionNeeded) {
        setHasSensor(false);
      }
    }, 1500);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(timer);
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      }
      win.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen, sensorPermissionNeeded, isInverted]);

  // Relative angle to Qibla: how much user needs to turn from current heading
  // Positive angleDiff = Kaaba is to your RIGHT (turn clockwise)
  // Negative angleDiff = Kaaba is to your LEFT (turn counter-clockwise)
  const angleDiff = getShortestAngleDiff(qiblaBearing, heading);
  const absDiff = Math.abs(angleDiff);
  const isAligned = absDiff <= 4.0; // Within 4 degrees of True Kaaba alignment

  // Trigger chime & haptic on lock-on
  useEffect(() => {
    if (isAligned && !hasChimedRef.current) {
      hasChimedRef.current = true;
      if (soundEnabled) {
        playAlignmentChime();
      }
      triggerAlignmentHaptic();
    } else if (!isAligned) {
      hasChimedRef.current = false;
    }
  }, [isAligned, soundEnabled]);

  const isArabic = typeof window !== 'undefined'
    ? (localStorage.getItem('noor_app_language') || 'ar') === 'ar'
    : true;

  if (!isOpen) return null;

  const currentHeadingInfo = getCompassHeadingName(heading);
  const qiblaHeadingInfo = getCompassHeadingName(qiblaBearing);

  // In Phone-Centric mode:
  // - Dial rotates by -heading so North points to real-world North
  // - Needle points to angleDiff = (qiblaBearing - heading)
  // - When facing Kaaba, needle and Kaaba marker align straight UP at 12 o'clock!
  // In North-Up mode:
  // - Dial is stationary (North at top)
  // - Needle points directly at qiblaBearing
  const dialRotation = viewMode === 'phone_target' ? -heading : 0;
  const needleRotation = viewMode === 'phone_target' ? angleDiff : qiblaBearing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 pt-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'بوصلة القبلة الفلكية' : 'True Qibla Compass'}
    >
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`w-full max-w-lg rounded-3xl border shadow-[0_12px_40px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col max-h-[min(92dvh,740px)] transition-all duration-200 ${
          isDark
            ? 'bg-[#14161A] border-white/[0.08] text-[#F3F4F6]'
            : 'bg-white border-black/[0.08] text-[#111214]'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs ${
              isDark ? 'bg-[#1B1D23] border-white/[0.1]' : 'bg-[#F3F3F1] border-black/[0.08]'
            }`}>
              <Compass className={`w-5 h-5 animate-spin-slow ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`text-base font-cinzel font-bold tracking-wider ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  {isArabic ? 'بوصلة القبلة الفلكية' : 'TRUE QIBLA COMPASS'}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {isArabic ? 'فلكي دقيق' : 'Astronomical'}
                </span>
              </div>
              <p className={`text-[11px] font-arabic ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`} dir="rtl">
                بوصلة القبلة الدقيقة نحو الكعبة المشرفة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Audio Chime */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]'
                  : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
              }`}
              title={soundEnabled ? (isArabic ? 'كتم رنين المحاذاة' : 'Mute Alignment Chime') : (isArabic ? 'تفعيل رنين المحاذاة' : 'Enable Alignment Chime')}
              aria-label="Toggle chime sound"
            >
              {soundEnabled ? (
                <Volume2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-400 hover:text-white hover:bg-white/[0.08]'
                  : 'text-[#5A5D63] hover:text-[#111214] hover:bg-black/[0.05]'
              }`}
              title={isArabic ? 'إغلاق البوصلة' : 'Close Qibla Compass'}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Compass Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Location & GPS Status Bar */}
          <div
            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.08] text-stone-300'
                : 'bg-[#F3F3F1] border-black/[0.08] text-[#111214]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
              <div className="truncate">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>{isArabic ? 'من: ' : 'From: '}</span>
                <span className="truncate">{coords.displayName}</span>
              </div>
            </div>

            <button
              onClick={handleDetectGPS}
              disabled={isLocatingGPS}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/[0.15]'
                  : 'bg-white hover:bg-black/[0.04] text-[#111214] border-black/[0.12] shadow-2xs'
              }`}
              title={isArabic ? 'تحديد إحداثيات GPS بدقة' : 'Detect precise GPS coordinates'}
            >
              <Locate className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>
                {isLocatingGPS
                  ? (isArabic ? 'جاري التحديد...' : 'Locating...')
                  : (isArabic ? 'تحديد دقيق (GPS)' : 'Use Precise GPS')}
              </span>
            </button>
          </div>

          {/* iOS Sensor Permission Banner (if needed) */}
          {sensorPermissionNeeded && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              isDark
                ? 'bg-[#1B1D23] border-white/[0.14] text-[#F3F4F6]'
                : 'bg-[#F3F3F1] border-black/[0.12] text-[#111214]'
            }`}>
              <div className="flex items-center gap-2">
                <Smartphone className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>{isArabic ? 'انقر لتفعيل حساس الحركة والبوصلة' : 'Tap to enable motion & compass sensor'}</span>
              </div>
              <button
                onClick={requestOrientationPermission}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-sm cursor-pointer ${
                  isDark ? 'bg-white text-[#111214] hover:bg-stone-200' : 'bg-[#111214] text-white hover:bg-[#27292D]'
                }`}
              >
                {isArabic ? 'تفعيل البوصلة' : 'Enable Compass'}
              </button>
            </div>
          )}

          {/* MAIN COMPASS DIAL & VISUALIZATION */}
          <div className="relative flex flex-col items-center justify-center py-2">
            {/* Ambient Alignment Glow Halo */}
            <div
              className={`absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full transition-opacity duration-200 pointer-events-none ${
                isAligned
                  ? 'bg-gradient-to-tr from-emerald-500/20 via-emerald-400/15 to-emerald-400/15 shadow-[0_2px_8px_rgba(52,211,153,0.3)] scale-105'
                  : 'bg-transparent'
              }`}
            />

            {/* Compass Container */}
            <div
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 shadow-[0_2px_12px_rgba(0,0,0,0.35)] flex items-center justify-center overflow-hidden transition-all duration-200 ${
                isAligned
                  ? 'border-emerald-400 shadow-[0_2px_12px_rgba(52,211,153,0.4)] bg-[#0B0C0E]'
                  : isDark
                  ? 'border-white/[0.18] bg-[#0B0C0E]'
                  : 'border-black/[0.2] bg-[#111214] text-stone-100'
              }`}
            >
              {/* UNIFIED MATHEMATICALLY EXACT SVG COMPASS */}
              <svg viewBox="0 0 300 300" className="w-full h-full select-none pointer-events-none">
                <defs>
                  {/* Monochrome Needle Gradient */}
                  <linearGradient id="qiblaMonoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#E5E7EB" />
                    <stop offset="100%" stopColor="#9CA3AF" />
                  </linearGradient>

                  {/* Luminous Emerald Glow for Alignment */}
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A7F3D0" />
                    <stop offset="50%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* 1. ROTATING COMPASS DIAL (Rotates so North points to True North) */}
                <g transform={`rotate(${dialRotation} 150 150)`} style={{ willChange: 'transform' }}>
                  {/* Outer Concentric Border Circles */}
                  <circle cx="150" cy="150" r="144" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.22" />
                  <circle cx="150" cy="150" r="136" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.35" />
                  <circle cx="150" cy="150" r="110" fill="none" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="3 3" />
                  <circle cx="150" cy="150" r="75" fill="none" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.16" />

                  {/* 360 Degree Tick Marks (every 5° and 15°) */}
                  {Array.from({ length: 72 }).map((_, i) => {
                    const deg = i * 5;
                    const isMajor = deg % 30 === 0;
                    const isMedium = deg % 15 === 0;
                    const length = isMajor ? 12 : isMedium ? 8 : 4;
                    const stroke = isMajor ? '#FFFFFF' : isMedium ? '#D1D5DB' : '#6B7280';
                    const opacity = isMajor ? '0.9' : isMedium ? '0.55' : '0.35';

                    return (
                      <line
                        key={deg}
                        x1="150"
                        y1="14"
                        x2="150"
                        y2={14 + length}
                        stroke={stroke}
                        strokeWidth={isMajor ? 2 : 1}
                        strokeOpacity={opacity}
                        transform={`rotate(${deg} 150 150)`}
                      />
                    );
                  })}

                  {/* Degree Numbers at 30° Intervals */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    if (deg === 0 || deg === 90 || deg === 180 || deg === 270) return null;
                    return (
                      <text
                        key={`deg-${deg}`}
                        x="150"
                        y="34"
                        fill="#D1D5DB"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                        opacity="0.7"
                        transform={`rotate(${deg} 150 150)`}
                      >
                        {deg}°
                      </text>
                    );
                  })}

                  {/* Cardinal Points with Arabic and English */}
                  {/* NORTH (N / ش) */}
                  <g transform="rotate(0 150 150)">
                    <text x="150" y="38" fill="#EF4444" fontSize="14" fontWeight="bold" fontFamily="Cinzel, serif" textAnchor="middle">
                      N
                    </text>
                    <text x="150" y="49" fill="#EF4444" fontSize="8" fontFamily="Amiri, serif" textAnchor="middle" opacity="0.85">
                      شمال
                    </text>
                  </g>

                  {/* EAST (E / ق) */}
                  <g transform="rotate(90 150 150)">
                    <text x="150" y="38" fill="#F3F4F6" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif" textAnchor="middle">
                      E
                    </text>
                    <text x="150" y="49" fill="#D1D5DB" fontSize="8" fontFamily="Amiri, serif" textAnchor="middle" opacity="0.85">
                      شرق
                    </text>
                  </g>

                  {/* SOUTH (S / ج) */}
                  <g transform="rotate(180 150 150)">
                    <text x="150" y="38" fill="#F3F4F6" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif" textAnchor="middle">
                      S
                    </text>
                    <text x="150" y="49" fill="#D1D5DB" fontSize="8" fontFamily="Amiri, serif" textAnchor="middle" opacity="0.85">
                      جنوب
                    </text>
                  </g>

                  {/* WEST (W / غ) */}
                  <g transform="rotate(270 150 150)">
                    <text x="150" y="38" fill="#F3F4F6" fontSize="13" fontWeight="bold" fontFamily="Cinzel, serif" textAnchor="middle">
                      W
                    </text>
                    <text x="150" y="49" fill="#D1D5DB" fontSize="8" fontFamily="Amiri, serif" textAnchor="middle" opacity="0.85">
                      غرب
                    </text>
                  </g>

                  {/* Qibla Angle Ray on Dial */}
                  <line
                    x1="150"
                    y1="150"
                    x2="150"
                    y2="20"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    transform={`rotate(${qiblaBearing} 150 150)`}
                    opacity="0.75"
                  />

                  {/* THE HOLY KAABA BEACON ON THE COMPASS RIM */}
                  <g transform={`rotate(${qiblaBearing} 150 150)`}>
                    {/* Glowing beacon circle */}
                    <circle cx="150" cy="22" r="14" fill="#FFFFFF" fillOpacity={isAligned ? '0.35' : '0.16'} />
                    <circle cx="150" cy="22" r="10" fill="#0B0C0E" stroke={isAligned ? '#34D399' : '#FFFFFF'} strokeWidth="1.5" />

                    {/* Kaaba Cube Icon */}
                    <rect x="143" y="15" width="14" height="14" rx="2" fill="#090B0E" stroke={isAligned ? '#34D399' : '#FFFFFF'} strokeWidth="1" />
                    {/* Kiswah Band */}
                    <line x1="143" y1="18.5" x2="157" y2="18.5" stroke="#E5E7EB" strokeWidth="1.8" />
                    {/* Door of Kaaba */}
                    <rect x="145" y="21" width="3" height="6" rx="0.5" fill="#E5E7EB" />
                  </g>
                </g>

                {/* 2. THE DYNAMIC QIBLA POINTER NEEDLE (Pivots smoothly from center 150, 150) */}
                <g transform={`rotate(${needleRotation} 150 150)`} style={{ willChange: 'transform' }}>
                  {/* Pointed Head of Needle (Points directly to Holy Kaaba) */}
                  <polygon
                    points="150,32 142,75 158,75"
                    fill={isAligned ? 'url(#emeraldGrad)' : 'url(#qiblaMonoGrad)'}
                    filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.55))"
                  />
                  <line
                    x1="150"
                    y1="75"
                    x2="150"
                    y2="150"
                    stroke={isAligned ? '#34D399' : '#FFFFFF'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Rear Tail of Needle */}
                  <line
                    x1="150"
                    y1="150"
                    x2="150"
                    y2="225"
                    stroke="#64748B"
                    strokeWidth="2.5"
                    strokeOpacity="0.7"
                    strokeLinecap="round"
                  />
                  <polygon
                    points="150,240 144,225 156,225"
                    fill="#64748B"
                    opacity="0.7"
                  />
                </g>

                {/* 3. CENTER ASTROLABE JEWEL PIVOT */}
                <circle cx="150" cy="150" r="14" fill="#0B0C0E" stroke="#FFFFFF" strokeWidth="2" />
                <circle
                  cx="150"
                  cy="150"
                  r="6"
                  fill={isAligned ? '#34D399' : '#FFFFFF'}
                  className={isAligned ? 'animate-ping' : ''}
                />
                <circle cx="150" cy="150" r="3" fill="#FFFFFF" />

                {/* 4. FIXED TOP FORWARD RETICLE (Points to 12 o'clock, represents where user's phone is facing) */}
                <polygon
                  points="150,11 144,2 156,2"
                  fill={isAligned ? '#34D399' : '#EF4444'}
                  filter="drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))"
                />
              </svg>
            </div>
          </div>

          {/* DYNAMIC GUIDANCE & ALIGNMENT STATUS */}
          <div
            className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
              isAligned
                ? isDark
                  ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-[#0B0C0E] border-emerald-500/50 shadow-xs'
                  : 'bg-gradient-to-b from-emerald-50 via-emerald-50/70 to-white border-emerald-400 shadow-xs'
                : isDark
                ? 'bg-[#1B1D23] border-white/[0.08] shadow-sm'
                : 'bg-[#F3F3F1] border-black/[0.08] shadow-xs'
            }`}
          >
            {isAligned ? (
              <div className="space-y-1 animate-fadeIn">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-cinzel ${
                  isDark
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  <span>{isArabic ? 'مواجه للكعبة المشرفة' : 'ALIGNED WITH KAABA'}</span>
                </div>
                <div className={`text-base font-bold font-arabic pt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`} dir="rtl">
                  مواجه للقبلة المشرفة مباشرة · تقبل الله
                </div>
                <p className={`text-xs font-light ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                  {isArabic
                    ? 'أنت الآن مواجه للكعبة المشرفة بدقة تامة. استعد للصلاة.'
                    : 'You are accurately facing the Holy Kaaba. Ready for Salah.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className={`text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Navigation className={`w-3.5 h-3.5 rotate-45 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                  <span>
                    {angleDiff > 0
                      ? (isArabic ? `اتجه ${Math.round(absDiff)}° لليمين ↷` : `Turn ${Math.round(absDiff)}° to your right ↷`)
                      : (isArabic ? `اتجه ${Math.round(absDiff)}° لليسار ↶` : `Turn ${Math.round(absDiff)}° to your left ↶`)}
                  </span>
                </div>
                <p className={`text-xs font-light ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                  {isArabic
                    ? 'قم بتدوير هاتفك حتى يشير السهم إلى المؤشر العلوي مباشرة.'
                    : 'Rotate your phone until the needle points straight up to the red reticle.'}
                </p>
              </div>
            )}
          </div>

          {/* COMPASS CONTROLS & CALIBRATION BAR */}
          <div className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border text-xs ${
            isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
          }`}>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'phone_target' ? 'north_up' : 'phone_target')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors text-[11px] cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-stone-200 hover:text-white'
                    : 'bg-white hover:bg-black/[0.04] text-[#111214] border border-black/[0.08]'
                }`}
                title={isArabic ? 'تبديل نمط عرض البوصلة' : 'Switch compass view style'}
              >
                <Eye className={`w-3 h-3 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
                <span>
                  {viewMode === 'phone_target'
                    ? (isArabic ? 'توجيه الهاتف' : 'Phone Target')
                    : (isArabic ? 'الشمال للأعلى' : 'North Up')}
                </span>
              </button>

              {/* Sensor Inversion Toggle (Fixes phones with reversed sensors) */}
              <button
                type="button"
                onClick={toggleInverted}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors text-[11px] cursor-pointer ${
                  isInverted
                    ? isDark
                      ? 'bg-white text-[#111214] font-semibold'
                      : 'bg-[#111214] text-white font-semibold'
                    : isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-stone-400'
                    : 'bg-white hover:bg-black/[0.04] text-[#5A5D63] border border-black/[0.08]'
                }`}
                title={isArabic ? 'عكس اتجاه الدوران إذا كان حساس جهازك يدور بالعكس' : 'Flip rotation direction if your device sensor moves backwards'}
              >
                <RefreshCw className="w-3 h-3" />
                <span>
                  {isInverted
                    ? (isArabic ? 'دوران معكوس' : 'Inverted')
                    : (isArabic ? 'دوران عادي' : 'Normal Rotation')}
                </span>
              </button>
            </div>

            {/* Quick Calibration Tips Button */}
            <button
              type="button"
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`text-[11px] hover:underline cursor-pointer font-medium ${isDark ? 'text-white' : 'text-[#111214]'}`}
            >
              {isCalibrating
                ? (isArabic ? 'إخفاء الدليل' : 'Hide Info')
                : (isArabic ? 'دليل الحساس' : 'Sensor Guide')}
            </button>
          </div>

          {/* DATA METRICS GRID */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Current Heading */}
            <div
              className={`p-3 rounded-2xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08] shadow-2xs'
              }`}
            >
              <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? 'الاتجاه الحالي' : 'Current Heading'}
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {Math.round(heading)}°
              </div>
              <div className={`text-[10px] truncate ${isDark ? 'text-stone-300' : 'text-[#3F4248]'}`}>
                {isArabic ? currentHeadingInfo.arabic : `${currentHeadingInfo.code} · ${currentHeadingInfo.arabic}`}
              </div>
            </div>

            {/* Qibla Direction */}
            <div
              className={`p-3 rounded-2xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.16]' : 'bg-[#F3F3F1] border-black/[0.12] shadow-2xs'
              }`}
            >
              <div className={`text-[10px] uppercase tracking-wider font-mono font-bold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {isArabic ? 'زاوية القبلة' : 'Qibla Bearing'}
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {qiblaBearing.toFixed(1)}°
              </div>
              <div className={`text-[10px] truncate ${isDark ? 'text-stone-300' : 'text-[#5A5D63]'}`}>
                {isArabic ? qiblaHeadingInfo.arabic : `${qiblaHeadingInfo.code} · ${qiblaHeadingInfo.arabic}`}
              </div>
            </div>

            {/* Distance to Kaaba */}
            <div
              className={`p-3 rounded-2xl border ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08] shadow-2xs'
              }`}
            >
              <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? 'المسافة إلى الكعبة' : 'Kaaba Distance'}
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                {distance.km.toLocaleString()} <span className="text-[10px]">{isArabic ? 'كم' : 'km'}</span>
              </div>
              <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-[#6B6F76]'}`}>
                {isArabic ? `${distance.miles.toLocaleString()} ميل` : `${distance.miles.toLocaleString()} mi`}
              </div>
            </div>
          </div>

          {/* DESKTOP / MANUAL ROTATION SLIDER (WHEN NO SENSOR OR ON LAPTOP) */}
          {(hasSensor === false || typeof window === 'undefined') && (
            <div
              className={`p-3.5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                  <Sliders className="w-3.5 h-3.5" />
                  {isArabic ? 'ضبط الاتجاه يدوياً' : 'Manual Heading Adjustment'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    targetHeadingRef.current = qiblaBearing;
                    setHeading(qiblaBearing);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-white text-[#111214] hover:bg-stone-200'
                      : 'bg-[#111214] text-white hover:bg-[#27292D]'
                  }`}
                >
                  {isArabic ? 'محاذاة للقبلة' : 'Snap to Qibla'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={Math.round(heading)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  targetHeadingRef.current = val;
                  setHeading(val);
                }}
                className={`w-full cursor-pointer ${isDark ? 'accent-white' : 'accent-[#111214]'}`}
                aria-label="Compass heading rotation slider"
              />
              <p className={`text-[11px] font-light leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                {isArabic
                  ? 'اسحب المؤشر لتدوير زاوية البوصلة، أو انقر "محاذاة للقبلة" لمعاينة الوضع الصحيح.'
                  : 'Drag to rotate the compass facing angle. Tap "Snap to Qibla" to see the direct alignment position.'}
              </p>
            </div>
          )}

          {/* CALIBRATION GUIDE & SUNNAH WISDOM ACCORDION */}
          {isCalibrating && (
            <div
              className={`p-3.5 rounded-2xl border space-y-2 text-xs animate-fadeIn ${
                isDark ? 'bg-[#1B1D23] border-white/[0.08]' : 'bg-[#FCFCFA] border-black/[0.08]'
              }`}
            >
              <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-white' : 'text-[#111214]'}`}>
                <ShieldCheck className="w-4 h-4" />
                <span>{isArabic ? 'معايرة الحساس ودقة الاتجاه' : 'Sensor Calibration & Accuracy'}</span>
              </div>
              <div className={`text-[11px] space-y-1.5 leading-relaxed ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
                <p>
                  {isArabic
                    ? '• حركة الرقم ٨: إذا كان اتجاه البوصلة غير دقيق، حرّك هاتفك في الهواء على شكل رقم ٨ لمعايرة الحساس المغناطيسي.'
                    : '• Figure-8 Calibration: If compass direction seems incorrect, wave your phone in a figure-8 motion in the air to calibrate the magnetic sensor.'}
                </p>
                <p>
                  {isArabic
                    ? '• اتجاه معكوس؟ انقر على زر "دوران عادي / معكوس" أعلاه، فبعض أجهزة أندرويد تقرأ الزاوية بعكس عقارب الساعة.'
                    : '• Reversed Direction? Tap the "Normal / Inverted" button above. Certain Android devices report sensor angles counter-clockwise.'}
                </p>
                <p>
                  {isArabic
                    ? '• التداخل الكهرومغناطيسي: ابتعد عن الأجهزة الإلكترونية والأجسام المعدنية والشواحن اللاسلكية وأغطية الهاتف المغناطيسية.'
                    : '• Magnetic Interference: Keep away from metal laptops, magnets, wireless chargers, and thick phone cases with metal plates.'}
                </p>
                <p className={`italic pt-1 border-t font-arabic ${isDark ? 'text-stone-300 border-white/[0.08]' : 'text-[#111214] border-black/[0.08]'}`} dir="rtl">
                  {isArabic
                    ? '﴿فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ﴾ [البقرة: ١٤٤]'
                    : '"Turn your face toward al-Masjid al-Haram. And wherever you [believers] are, turn your faces toward it [in prayer]." (Surah Al-Baqarah 2:144)'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0B0C0E]/80 border-white/[0.08]' : 'bg-[#F3F3F1] border-black/[0.08]'
        }`}>
          <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-stone-400' : 'text-[#5A5D63]'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#111214]'}`} />
            <span>{isArabic ? 'المسجد الحرام، مكة المكرمة' : 'Al-Masjid Al-Haram, Makkah'}</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white text-[#111214] hover:bg-stone-200'
                : 'bg-[#111214] text-white hover:bg-[#27292D]'
            }`}
          >
            {isArabic ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
