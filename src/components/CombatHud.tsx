import React, { useEffect, useState, useRef } from 'react';
import {
  Crosshair,
  Shield,
  Zap,
  Flame,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Radio,
  ChevronRight,
  ShieldAlert,
  Activity,
  Skull,
  GripHorizontal,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CombatStats, FloatingPointNotice, ShieldImpactNotice } from '../types';

interface CombatHudProps {
  combatStats: CombatStats;
  floatingNotices: FloatingPointNotice[];
  shieldImpacts?: ShieldImpactNotice[];
  coreImpactFlash?: boolean;
  lockedShipName: string | null;
  combatMode: boolean;
  autoAimBlaster: boolean;
  onToggleCombatMode: () => void;
  onToggleAutoAim: () => void;
  onResetScore: () => void;
  onUnleashHyperStrike?: () => void;
  onFireDeathStarSuperweapon?: () => void;
  onNextWave?: () => void;
  onDismissVictory?: () => void;
  onRestartWave?: () => void;
  onRestartMission?: () => void;
}

export const CombatHud: React.FC<CombatHudProps> = ({
  combatStats,
  floatingNotices,
  shieldImpacts = [],
  coreImpactFlash = false,
  lockedShipName,
  combatMode,
  autoAimBlaster,
  onToggleCombatMode,
  onToggleAutoAim,
  onResetScore,
  onUnleashHyperStrike,
  onFireDeathStarSuperweapon,
  onNextWave,
  onDismissVictory,
  onRestartWave,
  onRestartMission,
}) => {
  const [pulseScore, setPulseScore] = useState(false);
  const [pulseShield, setPulseShield] = useState(false);
  const [pulseCore, setPulseCore] = useState(false);

  // Draggable & Adjustable state for Targeting Window
  const [targetingPos, setTargetingPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('targeting_window_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isDraggingTargeting, setIsDraggingTargeting] = useState<boolean>(false);
  const [showTargetingAdjustMenu, setShowTargetingAdjustMenu] = useState<boolean>(false);
  const [isTargetingCompact, setIsTargetingCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('targeting_compact') === 'true';
    } catch {}
    return false;
  });

  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Subtle metric pulse when values change
  useEffect(() => {
    if (combatStats.score > 0) {
      setPulseScore(true);
      const timer = setTimeout(() => setPulseScore(false), 300);
      return () => clearTimeout(timer);
    }
  }, [combatStats.score]);

  useEffect(() => {
    setPulseShield(true);
    const timer = setTimeout(() => setPulseShield(false), 250);
    return () => clearTimeout(timer);
  }, [combatStats.playerShield]);

  useEffect(() => {
    setPulseCore(true);
    const timer = setTimeout(() => setPulseCore(false), 250);
    return () => clearTimeout(timer);
  }, [combatStats.coreEnergy]);

  // Handle Dragging for Targeting Window
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = targetingPos?.x ?? Math.max(16, window.innerWidth - 270);
    const currentY = targetingPos?.y ?? 12;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };
    setIsDraggingTargeting(true);
  };

  useEffect(() => {
    if (!isDraggingTargeting) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      const targetWidth = 250;
      const newX = Math.max(8, Math.min(window.innerWidth - targetWidth - 8, dragRef.current.initialX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - 120, dragRef.current.initialY + deltaY));

      setTargetingPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDraggingTargeting(false);
      dragRef.current = null;
      if (targetingPos) {
        try {
          localStorage.setItem('targeting_window_pos', JSON.stringify(targetingPos));
        } catch {}
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDraggingTargeting, targetingPos]);

  const handleSetTargetingPreset = (preset: 'tr' | 'tl' | 'br' | 'bl' | 'reset') => {
    if (preset === 'reset') {
      setTargetingPos(null);
      try {
        localStorage.removeItem('targeting_window_pos');
      } catch {}
      setShowTargetingAdjustMenu(false);
      return;
    }

    const targetWidth = 250;
    let newX = window.innerWidth - targetWidth - 16;
    let newY = 12;

    if (preset === 'tl') {
      newX = 16;
      newY = 12;
    } else if (preset === 'br') {
      newX = window.innerWidth - targetWidth - 16;
      newY = Math.max(12, window.innerHeight - 340);
    } else if (preset === 'bl') {
      newX = 16;
      newY = Math.max(12, window.innerHeight - 340);
    }

    const nextPos = { x: newX, y: newY };
    setTargetingPos(nextPos);
    try {
      localStorage.setItem('targeting_window_pos', JSON.stringify(nextPos));
    } catch {}
    setShowTargetingAdjustMenu(false);
  };

  const handleToggleCompact = () => {
    const nextVal = !isTargetingCompact;
    setIsTargetingCompact(nextVal);
    try {
      localStorage.setItem('targeting_compact', String(nextVal));
    } catch {}
  };

  const shieldPercent = Math.max(0, Math.min(100, combatStats.playerShield ?? 100));
  const isCriticalShield = shieldPercent < 30;

  const corePercent = Math.max(0, Math.min(100, combatStats.coreEnergy ?? 100));
  const isCriticalCore = corePercent <= 30 && corePercent > 0;

  const powerPercent = Math.max(0, Math.min(100, combatStats.blasterPower ?? 0));
  const isPowerReady = powerPercent >= 100;

  // Proton Torpedo Ordnance status
  const torpedoAmmo = combatStats.torpedoAmmo ?? 2;
  const maxTorpedoAmmo = combatStats.maxTorpedoAmmo ?? 2;
  const torpedoCooldown = combatStats.torpedoCooldown ?? 0;
  const hasTorpedoAmmo = torpedoAmmo > 0;
  const isTorpedoCooling = torpedoCooldown > 0;

  // Death Star Superweapon status
  const deathStarCharge = Math.max(0, Math.min(100, combatStats.deathStarCharge ?? 0));
  const isDeathStarReady = deathStarCharge >= 100;

  const currentTier = combatStats.powerTier || 1;
  const tierName =
    currentTier === 1
      ? 'TWIN CANNONS'
      : currentTier === 2
      ? 'DUAL TURBOLASERS'
      : currentTier === 3
      ? 'QUAD ION CANNONS'
      : 'HYPER OVERDRIVE';

  const targetingStyle: React.CSSProperties = targetingPos
    ? {
        position: 'fixed',
        left: `${targetingPos.x}px`,
        top: `${targetingPos.y}px`,
        zIndex: 35,
        width: '250px',
      }
    : {
        width: '250px',
      };

  return (
    <>
      {/* Dynamic Screen Projections: Precision Hit Numbers & Status Badges */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
        {floatingNotices.map((notice) => (
          <div
            key={notice.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none animate-float-fade"
            style={{
              left: `${notice.x}px`,
              top: `${notice.y}px`,
            }}
          >
            {/* Soft Ambient aura */}
            <div
              className="absolute -inset-2 rounded-full opacity-40 blur-sm pointer-events-none"
              style={{ backgroundColor: notice.color }}
            />

            {/* Technical +Points readout */}
            <div
              className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#eef2ef]"
              style={{
                color: notice.color,
                textShadow: `0 0 10px ${notice.color}80`,
              }}
            >
              {notice.text}
            </div>

            {/* Sub-label */}
            {notice.subText && (
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#98a5a2] bg-[#101516]/90 px-1.5 py-0.5 rounded border border-[#283231] mt-0.5 shadow-sm">
                {notice.subText}
              </span>
            )}

            {/* Quiet Technical Combo Badge */}
            {notice.comboText && (
              <div className="text-[10px] sm:text-xs font-mono font-semibold tracking-wider uppercase rounded px-2 py-0.5 mt-1 bg-[#101516]/95 border border-[#283231] text-[#d2f27c] shadow-sm flex items-center gap-1">
                <span>{notice.comboText}</span>
              </div>
            )}
          </div>
        ))}

        {/* Technical Deflector Shield Impact Ripple */}
        {shieldImpacts.map((impact) => (
          <div
            key={impact.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${impact.x}px`, top: `${impact.y}px` }}
          >
            <div className="relative w-32 h-32 flex items-center justify-center opacity-60">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#2dd4bf]">
                <polygon
                  points="50,6 92,26 92,74 50,94 8,74 8,26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>
          </div>
        ))}

        {/* Core Impact Red Vignette Flash */}
        {coreImpactFlash && (
          <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] pointer-events-none transition-opacity duration-300" />
        )}

        {/* 3D Core Lock-On Countdown Reticle over Targeting Hostile */}
        {combatMode && combatStats.activeLockOn && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center select-none"
            style={{
              left: `${combatStats.activeLockOn.screenX}px`,
              top: `${combatStats.activeLockOn.screenY}px`,
            }}
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-red-500/70 border-dashed animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border-2 border-red-500 animate-pulse" />
              <Crosshair className="w-8 h-8 text-red-500" />
            </div>

            <div className="mt-1 flex items-center gap-1.5 bg-[#101516]/95 border border-red-500/80 rounded px-2 py-0.5 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold text-[#eef2ef]">
                LOCK {combatStats.activeLockOn.timeLeft.toFixed(1)}s
              </span>
              <span className="text-[9px] font-mono text-[#98a5a2] uppercase px-1 rounded bg-[#151c1d] border border-[#283231]">
                {combatStats.activeLockOn.enemyType === 'tie_advanced' ? 'HEAVY STRIKE' : 'CORE STRIKE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Threat Banner: Core Lock-On Alert */}
      {combatMode && combatStats.activeLockOn && (
        <aside aria-label="Core reactor threat alert" className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#101516]/95 backdrop-blur-md border border-red-500/60 rounded-lg px-4 py-1.5 shadow-xl">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-mono font-semibold tracking-wider text-[#eef2ef] uppercase">
            CORE REACTOR LOCK [{combatStats.activeLockOn.timeLeft.toFixed(1)}s] — DEFLECT OR DESTROY TARGET
          </span>
        </aside>
      )}

      {/* Critical Cockpit Hazard Alarms at <= 30% Core Energy */}
      {combatMode && isCriticalCore && !combatStats.isGameOver && (
        <div className="pointer-events-none fixed inset-0 z-20 border-[4px] sm:border-[6px] border-red-500/40 shadow-[inset_0_0_60px_rgba(239,68,68,0.3)] flex flex-col items-center justify-start pt-24" aria-live="assertive">
          <div className="bg-[#101516]/95 backdrop-blur-md border border-red-500/70 rounded-lg px-3.5 py-1.5 flex items-center gap-2 text-[#f87171] font-mono text-xs tracking-wider font-semibold uppercase shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>WARNING: CORE REACTOR INTEGRITY AT {Math.round(corePercent)}%</span>
          </div>
        </div>
      )}

      {/* Deflector Shields Low Alert */}
      {combatMode && isCriticalShield && !isCriticalCore && !combatStats.isGameOver && (
        <div className="pointer-events-none fixed inset-0 z-20 border-[3px] border-teal-500/25 shadow-[inset_0_0_40px_rgba(20,184,166,0.15)] flex items-center justify-center" aria-live="polite">
          <div className="bg-[#101516]/95 backdrop-blur-md border border-[#283231] rounded-lg px-3.5 py-1.5 flex items-center gap-2 text-[#98a5a2] font-mono text-xs tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>DEFLECTOR SHIELDS LOW ({Math.round(shieldPercent)}%)</span>
          </div>
        </div>
      )}

      {/* Top Center: Sector Battle Wave Progress & Win Tracker */}
      {combatMode && (
        <div className="pointer-events-auto fixed top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          <div className="bg-[#101516]/95 backdrop-blur-md border border-[#283231] rounded-lg px-3.5 py-1.5 shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#98a5a2]">
              <Radio className="w-3.5 h-3.5 text-[#d2f27c]" />
              <span className="text-[#eef2ef] font-semibold">SECTOR {combatStats.wave || 1}</span>
            </div>

            <div className="w-px h-3 bg-[#283231]" />

            {/* Wave Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#98a5a2]">TARGETS:</span>
              <div className="w-24 sm:w-32 h-1.5 bg-[#151c1d] rounded-full overflow-hidden border border-[#283231] relative">
                <div
                  className="h-full bg-[#d2f27c] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((combatStats.waveKills || 0) / (combatStats.waveTarget || 6)) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-semibold text-[#eef2ef]">
                {combatStats.waveKills || 0}/{combatStats.waveTarget || 6}
              </span>
            </div>

            {/* Total Sector Wins Counter */}
            {(combatStats.totalWins || 0) > 0 && (
              <>
                <div className="w-px h-3 bg-[#283231]" />
                <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#d2f27c]">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{combatStats.totalWins} WINS</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Center Cockpit Console: Core Reactor + Shields + Overdrive + Balanced Torpedo Volley */}
      {combatMode && (
        <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-full max-w-lg px-3">
          {/* Balanced Hyper Counter-Strike Torpedo Volley Trigger Controls */}
          {!combatStats.isGameOver && (
            <div className="w-full flex flex-col gap-1">
              {isPowerReady && hasTorpedoAmmo && !isTorpedoCooling ? (
                <button
                  onClick={onUnleashHyperStrike}
                  className="w-full py-2.5 px-4 rounded-lg font-sans font-semibold text-xs tracking-wider uppercase text-[#080b0c] bg-[#d2f27c] hover:bg-[#bde660] shadow-md border border-[#d2f27c] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                  title="Launch homing Proton Torpedoes to strike hostile targets! (Hotkey: SPACE)"
                >
                  <Zap className="w-4 h-4 fill-current text-[#080b0c]" />
                  <span>UNLEASH PROTON TORPEDO VOLLEY (SPACE) [{torpedoAmmo}/{maxTorpedoAmmo}]</span>
                </button>
              ) : isPowerReady && !hasTorpedoAmmo ? (
                <div className="w-full py-2 px-3 rounded-lg font-mono text-[11px] uppercase tracking-wider text-[#98a5a2] bg-[#151c1d]/90 border border-amber-500/40 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ORDNANCE EMPTY (0/{maxTorpedoAmmo})</span>
                  </span>
                  <span className="text-[9px] text-[#98a5a2]">BUILD 5x COMBO OR ELITE KILL TO RESTOCK</span>
                </div>
              ) : isPowerReady && isTorpedoCooling ? (
                <div className="w-full py-2 px-3 rounded-lg font-mono text-[11px] uppercase tracking-wider text-[#98a5a2] bg-[#151c1d]/90 border border-[#283231] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#d2f27c]">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>TORPEDO RELOADING: {torpedoCooldown.toFixed(1)}s</span>
                  </span>
                  <span className="text-[9px] text-[#98a5a2]">ORDNANCE: {torpedoAmmo}/{maxTorpedoAmmo}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* 7LayerX Dark Charcoal Cockpit Console */}
          <div
            className={`w-full bg-[#101516]/95 backdrop-blur-md border rounded-xl p-3 shadow-xl grid grid-cols-3 gap-3 transition-colors ${
              isCriticalCore ? 'border-red-500/70 shadow-red-950/20' : 'border-[#283231]'
            }`}
          >
            {/* 1. Deflector Shield Gauge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#98a5a2] truncate">
                  <Shield className="w-3 h-3 text-[#2dd4bf] shrink-0" />
                  <span>SHIELDS</span>
                </span>
                <span
                  className={`font-semibold font-mono ${
                    pulseShield ? 'scale-105' : ''
                  } ${isCriticalShield ? 'text-[#f87171]' : 'text-[#eef2ef]'}`}
                >
                  {Math.round(shieldPercent)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#151c1d] rounded-full overflow-hidden border border-[#283231]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCriticalShield ? 'bg-[#ef4444]' : 'bg-[#2dd4bf]'
                  }`}
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>

            {/* 2. Core Reactor Energy Meter */}
            <div className="flex flex-col gap-1 px-1.5 border-x border-[#283231]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#98a5a2] truncate">
                  <Activity
                    className={`w-3 h-3 shrink-0 ${isCriticalCore ? 'text-[#f87171]' : 'text-[#d2f27c]'}`}
                  />
                  <span>CORE REACTOR</span>
                </span>
                <span
                  className={`font-semibold font-mono ${
                    pulseCore ? 'scale-105' : ''
                  } ${isCriticalCore ? 'text-[#f87171] animate-pulse' : 'text-[#eef2ef]'}`}
                >
                  {Math.round(corePercent)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#151c1d] rounded-full overflow-hidden border border-[#283231]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCriticalCore ? 'bg-[#ef4444]' : 'bg-[#d2f27c]'
                  }`}
                  style={{ width: `${corePercent}%` }}
                />
              </div>
            </div>

            {/* 3. Blaster Overdrive & Torpedo Ordnance Gauge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#98a5a2] truncate">
                  <Zap className="w-3 h-3 text-[#d2f27c] shrink-0" />
                  <span>OVERDRIVE</span>
                </span>
                <span
                  className={`font-semibold font-mono ${
                    isPowerReady ? 'text-[#d2f27c]' : 'text-[#eef2ef]'
                  }`}
                >
                  {isPowerReady ? 'READY' : `${Math.round(powerPercent)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#151c1d] rounded-full overflow-hidden border border-[#283231]">
                <div
                  className="h-full rounded-full bg-[#d2f27c] transition-all duration-300"
                  style={{ width: `${powerPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draggable & Adjustable Targeting Window / Telemetry Card */}
      {combatMode && (
        <aside
          aria-label="Tactical targeting and telemetry"
          style={targetingStyle}
          className={`pointer-events-auto select-none flex flex-col items-end gap-2 ${
            !targetingPos ? 'fixed top-3 right-3 sm:right-4 z-30' : ''
          } ${isDraggingTargeting ? 'opacity-95 shadow-2xl scale-[1.01]' : 'transition-shadow'}`}
        >
          {/* Main Telemetry & Targeting Card */}
          <div
            className={`w-full bg-[#101516]/95 backdrop-blur-md border rounded-xl p-3 shadow-xl transition-colors duration-200 ${
              isDraggingTargeting ? 'border-[#d2f27c]/70 ring-1 ring-[#d2f27c]/40' : 'border-[#283231]'
            }`}
          >
            {/* Draggable Header Bar with Dedicated Grip */}
            <div className="flex items-center justify-between gap-2 border-b border-[#283231] pb-2 mb-2 bg-[#151c1d]/60 -mx-3 -mt-3 p-2.5 rounded-t-xl">
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-[#eef2ef] cursor-grab active:cursor-grabbing hover:text-[#d2f27c] transition-colors select-none"
                title="Drag to reposition Targeting Window anywhere on screen"
              >
                <GripHorizontal className="w-3.5 h-3.5 text-[#98a5a2] hover:text-[#d2f27c] shrink-0" />
                <Crosshair className="w-3.5 h-3.5 text-[#d2f27c]" />
                <span className="font-mono text-xs">TARGETING</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Adjust Layout Presets Button */}
                <button
                  onClick={() => setShowTargetingAdjustMenu(!showTargetingAdjustMenu)}
                  className={`p-1 rounded transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c] ${
                    showTargetingAdjustMenu
                      ? 'text-[#d2f27c] bg-[#101516] border border-[#283231]'
                      : 'text-[#98a5a2] hover:text-[#eef2ef] hover:bg-[#151c1d]'
                  }`}
                  title="Adjust Targeting Window Placement"
                  aria-label="Adjust Targeting Window Placement"
                >
                  <Sliders className="w-3 h-3" />
                </button>

                {/* Compact / Expanded Toggle */}
                <button
                  onClick={handleToggleCompact}
                  className="p-1 rounded text-[#98a5a2] hover:text-[#eef2ef] hover:bg-[#151c1d] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                  title={isTargetingCompact ? 'Expand Telemetry' : 'Compact View'}
                  aria-label={isTargetingCompact ? 'Expand Telemetry' : 'Compact View'}
                >
                  {isTargetingCompact ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Quick Adjustment Menu Drawer */}
            {showTargetingAdjustMenu && (
              <div className="p-2 mb-2 bg-[#151c1d] border border-[#283231] rounded-lg text-[10px] font-mono space-y-2 text-left">
                <div className="flex items-center justify-between text-[#98a5a2]">
                  <span className="uppercase tracking-wider">WINDOW DOCK:</span>
                  <span className="text-[9px] text-[#d2f27c]">DRAG OR PRESET</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => handleSetTargetingPreset('tr')}
                    className="px-1 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] text-center cursor-pointer"
                  >
                    TOP-R
                  </button>
                  <button
                    onClick={() => handleSetTargetingPreset('tl')}
                    className="px-1 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] text-center cursor-pointer"
                  >
                    TOP-L
                  </button>
                  <button
                    onClick={() => handleSetTargetingPreset('br')}
                    className="px-1 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] text-center cursor-pointer"
                  >
                    BOT-R
                  </button>
                  <button
                    onClick={() => handleSetTargetingPreset('bl')}
                    className="px-1 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] text-center cursor-pointer"
                  >
                    BOT-L
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#283231]/60">
                  <button
                    onClick={handleToggleCompact}
                    className="text-[#98a5a2] hover:text-[#eef2ef] cursor-pointer"
                  >
                    {isTargetingCompact ? 'MODE: COMPACT' : 'MODE: FULL'}
                  </button>
                  <button
                    onClick={() => handleSetTargetingPreset('reset')}
                    className="text-[#98a5a2] hover:text-[#d2f27c] cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>RESET</span>
                  </button>
                </div>
              </div>
            )}

            {/* Score and Kill counters */}
            <div className="flex items-baseline justify-end gap-3 my-1">
              {combatStats.combo > 1 && (
                <div className="flex items-center gap-1 text-[#d2f27c] text-xs font-mono font-semibold">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>{combatStats.combo}x</span>
                </div>
              )}

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#98a5a2]">SCORE</span>
                <div
                  className={`text-2xl font-bold font-mono tracking-tight text-[#eef2ef] transition-transform duration-200 ${
                    pulseScore ? 'scale-110 text-[#d2f27c]' : ''
                  }`}
                >
                  +{combatStats.score}
                </div>
              </div>
            </div>

            {/* Full Telemetry Sub-metrics (visible when not compact) */}
            {!isTargetingCompact && (
              <>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#98a5a2] pt-1.5 border-t border-[#283231]">
                  <span>CANNONS:</span>
                  <span className="font-semibold text-[#eef2ef]">{tierName}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#98a5a2] pt-1">
                  <span>TARGETS DOWN:</span>
                  <span className="font-semibold text-[#d2f27c]">{combatStats.destroyedCount}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#98a5a2] pt-1">
                  <span>TORPEDO AMMO:</span>
                  <span className={`font-semibold font-mono ${hasTorpedoAmmo ? 'text-[#d2f27c]' : 'text-red-400'}`}>
                    {torpedoAmmo}/{maxTorpedoAmmo}
                  </span>
                </div>

                {/* Death Star Superweapon Tactical Module */}
                <div className="mt-2 pt-2 border-t border-[#283231] text-left">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="flex items-center gap-1 text-[#98a5a2]">
                      <Radio className="w-3 h-3 text-[#10b981]" />
                      <span>SUPERWEAPON:</span>
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        isDeathStarReady ? 'text-[#10b981] animate-pulse' : 'text-[#98a5a2]'
                      }`}
                    >
                      {isDeathStarReady ? 'PRIMED (100%)' : `${Math.round(deathStarCharge)}%`}
                    </span>
                  </div>

                  {/* Superweapon Capacitor Progress Bar */}
                  <div className="w-full h-1.5 bg-[#151c1d] rounded-full overflow-hidden border border-[#283231] mb-1.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-[#10b981] transition-all duration-300"
                      style={{ width: `${deathStarCharge}%` }}
                    />
                  </div>

                  {/* Fire Superweapon Action Button */}
                  {isDeathStarReady && !combatStats.isGameOver ? (
                    <button
                      onClick={onFireDeathStarSuperweapon}
                      className="w-full py-1.5 px-2 rounded font-sans font-bold text-[10px] tracking-wider uppercase text-[#080b0c] bg-[#10b981] hover:bg-[#34d399] border border-[#10b981] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer animate-pulse transition-transform hover:scale-[1.02]"
                      title="Trigger 8 converging tributary beams and colossal sector blast! (Hotkey: D)"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>FIRE SUPERLASER [D]</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[9px] font-mono text-[#98a5a2]">
                      <span>ORBITAL CAPACITOR</span>
                      <span>+15% PER KILL</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Target Lock Readout */}
            {lockedShipName ? (
              <div className="mt-2 text-[9px] font-mono text-[#d2f27c] flex items-center justify-end gap-1.5 bg-[#151c1d] border border-[#283231] rounded px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d2f27c]" />
                <span className="truncate">LOCKED: {lockedShipName}</span>
              </div>
            ) : (
              <div className="mt-2 text-[9px] font-mono text-[#98a5a2] flex items-center justify-end">
                <span>CLICK HOSTILE OR BOLT</span>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-1.5 bg-[#101516]/90 backdrop-blur-md border border-[#283231] rounded-lg p-1 text-xs">
            <button
              onClick={onToggleAutoAim}
              className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c] ${
                autoAimBlaster
                  ? 'bg-[#d2f27c]/15 text-[#d2f27c] border border-[#d2f27c]/40'
                  : 'bg-[#151c1d] text-[#98a5a2] hover:text-[#eef2ef] border border-[#283231]'
              }`}
              title="Toggle automatic blaster lead assistant"
            >
              <Zap className="w-3 h-3 text-[#d2f27c]" />
              <span>AUTO-AIM {autoAimBlaster ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onResetScore}
              className="px-2 py-1 rounded text-[10px] font-mono text-[#98a5a2] hover:text-[#eef2ef] bg-[#151c1d] hover:bg-[#151c1d]/80 border border-[#283231] transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              title="Reset combat session score"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mission Failed Modal */}
      {combatStats.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b0c]/85 backdrop-blur-md pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="mission-failed-title">
          <div className="relative w-full max-w-lg bg-[#101516] border border-[#283231] rounded-xl p-6 sm:p-7 shadow-2xl text-center">
            {/* Warning Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-950/40 text-[#f87171] border border-red-500/40 mb-3">
              <Skull className="w-6 h-6" />
            </div>

            <h2 id="mission-failed-title" className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#eef2ef]">
              MISSION FAILED
            </h2>
            <div className="text-xs font-mono font-semibold tracking-wider text-[#f87171] mt-0.5 uppercase">
              CORE REACTOR DESTROYED
            </div>
            <p className="text-xs text-[#98a5a2] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Cockpit reactor containment breached by Imperial plasma strikes. Starfighter systems offline.
            </p>

            {/* Final Combat Statistics Grid */}
            <div className="grid grid-cols-2 gap-2 my-5 text-left">
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase tracking-wider">FINAL SCORE</span>
                <div className="text-xl font-bold font-mono text-[#eef2ef]">+{combatStats.score}</div>
              </div>

              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase tracking-wider">SECTOR REACHED</span>
                <div className="text-xl font-bold font-mono text-[#eef2ef]">SECTOR {combatStats.wave || 1}</div>
              </div>

              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase tracking-wider">TARGETS DOWN</span>
                <div className="text-lg font-bold font-mono text-[#d2f27c]">
                  {combatStats.destroyedCount} SHIPS
                </div>
                <div className="text-[10px] font-mono text-[#98a5a2] mt-0.5">
                  ({combatStats.eliteKills || 0} Elite)
                </div>
              </div>

              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase tracking-wider">DEFLECTIONS</span>
                <div className="text-lg font-bold font-mono text-[#d2f27c]">
                  {combatStats.deflections || 0}
                </div>
                <div className="text-[10px] font-mono text-[#98a5a2] mt-0.5">
                  Max Streak: {combatStats.maxCombo || 1}x
                </div>
              </div>
            </div>

            {/* Action Buttons: Primary Lime + Outlined Dark Button */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2">
              <button
                onClick={onRestartWave}
                className="w-full py-2.5 px-4 rounded-lg font-sans font-semibold text-xs tracking-wider uppercase text-[#080b0c] bg-[#d2f27c] hover:bg-[#bde660] border border-[#d2f27c] shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTART WAVE {combatStats.wave || 1}</span>
              </button>

              <button
                onClick={onRestartMission}
                className="w-full sm:w-auto py-2.5 px-4 rounded-lg font-mono text-xs text-[#98a5a2] hover:text-[#eef2ef] bg-[#151c1d] hover:bg-[#151c1d]/80 border border-[#283231] transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                RESET MISSION (WAVE 1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sector Clearance Celebration Modal */}
      {combatStats.isVictorious && !combatStats.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b0c]/85 backdrop-blur-md pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="sector-cleared-title">
          <div className="relative w-full max-w-md bg-[#101516] border border-[#283231] rounded-xl p-6 shadow-2xl text-center">
            {/* Victory Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#d2f27c]/15 border border-[#d2f27c]/40 text-[#d2f27c] mb-3">
              <Trophy className="w-6 h-6" />
            </div>

            <h2 id="sector-cleared-title" className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#eef2ef]">
              SECTOR SECURED
            </h2>
            <p className="text-xs font-mono text-[#98a5a2] mt-0.5 uppercase tracking-wider">
              Hostile starfighters neutralized
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-2 my-5 text-left">
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase">SCORE</span>
                <div className="text-lg font-bold font-mono text-[#eef2ef]">+{combatStats.score}</div>
              </div>
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase">MAX COMBO</span>
                <div className="text-lg font-bold font-mono text-[#d2f27c]">{combatStats.maxCombo || 1}x</div>
              </div>
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase">CORE INTEGRITY</span>
                <div className="text-lg font-bold font-mono text-[#d2f27c]">
                  {Math.round(combatStats.coreEnergy || 100)}%
                </div>
              </div>
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-[#98a5a2] uppercase">SECTOR WINS</span>
                <div className="text-lg font-bold font-mono text-[#eef2ef]">
                  {(combatStats.totalWins || 0) + 1}
                </div>
              </div>
            </div>

            {/* Action Buttons: Primary Lime + Outlined Dark Button */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <button
                onClick={onNextWave}
                className="w-full py-2.5 px-4 rounded-lg font-sans font-semibold text-xs tracking-wider uppercase text-[#080b0c] bg-[#d2f27c] hover:bg-[#bde660] border border-[#d2f27c] shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                <span>NEXT SECTOR WAVE</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onDismissVictory}
                className="w-full sm:w-auto py-2.5 px-4 rounded-lg font-mono text-xs text-[#98a5a2] hover:text-[#eef2ef] bg-[#151c1d] hover:bg-[#151c1d]/80 border border-[#283231] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
