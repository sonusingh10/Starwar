import React, { useEffect, useState } from 'react';
import {
  Crosshair,
  Shield,
  Zap,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  AlertTriangle,
  Radio,
  ChevronRight,
  ShieldAlert,
  Activity,
  Skull,
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
  onNextWave,
  onDismissVictory,
  onRestartWave,
  onRestartMission,
}) => {
  const [pulseScore, setPulseScore] = useState(false);
  const [pulseShield, setPulseShield] = useState(false);
  const [pulseCore, setPulseCore] = useState(false);
  const [pulsePower, setPulsePower] = useState(false);

  // Pulse score badge whenever score changes
  useEffect(() => {
    if (combatStats.score > 0) {
      setPulseScore(true);
      const timer = setTimeout(() => setPulseScore(false), 450);
      return () => clearTimeout(timer);
    }
  }, [combatStats.score]);

  // Pulse shield gauge whenever player takes damage or heals
  useEffect(() => {
    setPulseShield(true);
    const timer = setTimeout(() => setPulseShield(false), 380);
    return () => clearTimeout(timer);
  }, [combatStats.playerShield]);

  // Pulse core gauge whenever core energy changes
  useEffect(() => {
    setPulseCore(true);
    const timer = setTimeout(() => setPulseCore(false), 380);
    return () => clearTimeout(timer);
  }, [combatStats.coreEnergy]);

  // Pulse power gauge whenever power updates
  useEffect(() => {
    if (combatStats.blasterPower >= 100) {
      setPulsePower(true);
    }
  }, [combatStats.blasterPower]);

  const shieldPercent = Math.max(0, Math.min(100, combatStats.playerShield ?? 100));
  const isCriticalShield = shieldPercent < 30;

  const corePercent = Math.max(0, Math.min(100, combatStats.coreEnergy ?? 100));
  const isCriticalCore = corePercent <= 30 && corePercent > 0;

  const powerPercent = Math.max(0, Math.min(100, combatStats.blasterPower ?? 0));
  const isPowerReady = powerPercent >= 100;

  const currentTier = combatStats.powerTier || 1;
  const tierName =
    currentTier === 1
      ? 'TWIN CANNONS'
      : currentTier === 2
      ? 'DUAL TURBOLASERS'
      : currentTier === 3
      ? 'QUAD ION CANNONS'
      : 'HYPER OVERDRIVE';

  return (
    <>
      {/* =========================================================================
          1. Dynamic Screen Projection: Glowing "+1" & COMBO popups at exact 3D hits
         ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {floatingNotices.map((notice) => (
          <div
            key={notice.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none animate-float-fade"
            style={{
              left: `${notice.x}px`,
              top: `${notice.y}px`,
            }}
          >
            {/* Ambient Radial Energy Ring */}
            <div
              className="absolute -inset-4 rounded-full opacity-60 blur-md pointer-events-none animate-ping"
              style={{
                backgroundColor: notice.color,
                animationDuration: '1.1s',
                animationIterationCount: 1,
              }}
            />

            {/* Glowing +1 Number */}
            <div
              className="text-3xl sm:text-4xl font-black tracking-wider drop-shadow-[0_0_20px_currentColor] filter"
              style={{
                color: notice.color,
                textShadow: `0 0 12px ${notice.color}, 0 0 24px ${notice.color}, 0 0 36px #ffffff`,
              }}
            >
              {notice.text}
            </div>

            {/* Sub-label (e.g. ship name, deflected, core restored) */}
            {notice.subText && (
              <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-200/90 bg-black/75 px-1.5 py-0.5 rounded border border-cyan-500/30 -mt-1 shadow-sm">
                {notice.subText}
              </span>
            )}

            {/* Dynamic Glowing COMBO Badge: COMBO x2!, COMBO x3! 🔥 */}
            {notice.comboText && (
              <div
                className="text-xs sm:text-sm font-black tracking-widest uppercase rounded-full px-2.5 py-0.5 mt-1 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center gap-1 border animate-bounce"
                style={{
                  backgroundColor:
                    notice.comboText.includes('x4') || notice.comboText.includes('x5')
                      ? '#450a0a'
                      : notice.comboText.includes('x3')
                      ? '#451a03'
                      : '#1e1b4b',
                  borderColor:
                    notice.comboText.includes('x4') || notice.comboText.includes('x5')
                      ? '#ef4444'
                      : notice.comboText.includes('x3')
                      ? '#f59e0b'
                      : '#38bdf8',
                  color:
                    notice.comboText.includes('x4') || notice.comboText.includes('x5')
                      ? '#f87171'
                      : notice.comboText.includes('x3')
                      ? '#fde047'
                      : '#93c5fd',
                }}
              >
                <span>{notice.comboText}</span>
              </div>
            )}
          </div>
        ))}

        {/* Hexagonal Deflector Shield Impact Ripples on screen */}
        {shieldImpacts.map((impact) => (
          <div
            key={impact.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${impact.x}px`, top: `${impact.y}px` }}
          >
            <div className="relative w-40 h-40 flex items-center justify-center animate-ping opacity-75">
              <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 drop-shadow-[0_0_20px_#38bdf8]">
                <polygon
                  points="50,5 90,25 90,75 50,95 10,75 10,25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <polygon
                  points="50,18 80,33 80,67 50,82 20,67 20,33"
                  fill="rgba(56,189,248,0.2)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        ))}

        {/* Core Reactor Impact Flash Overlay & Electrical Sparks Distortion */}
        {coreImpactFlash && (
          <div className="pointer-events-none fixed inset-0 z-50 bg-red-600/35 mix-blend-color-dodge flex items-center justify-center animate-ping">
            <div className="w-full h-full border-[14px] border-red-500 shadow-[inset_0_0_120px_rgba(239,68,68,0.8)]" />
          </div>
        )}

        {/* Dynamic 3D Tracking Reticle for 3-Second Core Reactor Lock-On */}
        {combatMode && combatStats.activeLockOn && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 select-none transition-all duration-75"
            style={{
              left: `${combatStats.activeLockOn.screenX}px`,
              top: `${combatStats.activeLockOn.screenY}px`,
            }}
          >
            {/* Outer Pulsing Threat Ring */}
            <div className="absolute -inset-8 rounded-full border-2 border-red-500/80 animate-ping opacity-70" />

            {/* Rotating Cyber Reticle */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-500 drop-shadow-[0_0_20px_#ef4444]">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="18 10" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="12 6" />
                <line x1="50" y1="4" x2="50" y2="20" stroke="currentColor" strokeWidth="2.5" />
                <line x1="50" y1="80" x2="50" y2="96" stroke="currentColor" strokeWidth="2.5" />
                <line x1="4" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2.5" />
                <line x1="80" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Center Pulsing Lock Point */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_#ff0033] animate-ping" />

            {/* 3-Second Lock Countdown Badge */}
            <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 bg-red-950/95 border-2 border-red-500/90 rounded-lg px-3 py-1 flex items-center gap-1.5 shadow-[0_0_25px_rgba(239,68,68,0.85)] whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span className="text-xs font-black font-mono text-red-200">
                LOCK {combatStats.activeLockOn.timeLeft.toFixed(1)}s
              </span>
              <span className="text-[10px] font-mono text-amber-300 uppercase px-1 rounded bg-red-900/60 border border-red-500/40">
                {combatStats.activeLockOn.enemyType === 'tie_advanced' ? 'HEAVY STRIKE 💥' : 'CORE STRIKE ⚠️'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. Top Threat Banner: Core Lock-On Alert
         ========================================================================= */}
      {combatMode && combatStats.activeLockOn && (
        <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-red-950/90 backdrop-blur-md border-2 border-red-500 rounded-full px-5 py-2 shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-spin-slow" />
          <span className="text-xs sm:text-sm font-black font-mono tracking-wider text-red-200 uppercase">
            ⚠️ CORE REACTOR LOCK DETECTED [{combatStats.activeLockOn.timeLeft.toFixed(1)}s] — DEFLECT OR DESTROY!
          </span>
        </div>
      )}

      {/* =========================================================================
          3. Critical Cockpit Hazard Alarms & Flickering at <= 30% Core Energy
         ========================================================================= */}
      {combatMode && isCriticalCore && !combatStats.isGameOver && (
        <div className="pointer-events-none fixed inset-0 z-20 border-[8px] sm:border-[12px] border-red-600/50 shadow-[inset_0_0_100px_rgba(220,38,38,0.6)] animate-pulse flex flex-col items-center justify-start pt-28">
          {/* Subtle cockpit scanline / emergency hazard strobe */}
          <div className="absolute inset-0 bg-red-900/10 mix-blend-color-dodge pointer-events-none animate-pulse" />
          <div className="bg-red-950/90 backdrop-blur-md border border-red-500 rounded-xl px-4 py-2 flex items-center gap-2 text-red-300 font-mono text-xs sm:text-sm tracking-widest font-black uppercase shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-bounce">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>⚠️ WARNING: CORE REACTOR INTEGRITY CRITICAL ({Math.round(corePercent)}%) ⚠️</span>
          </div>
        </div>
      )}

      {/* Deflector Shields Low Alert (Independent system) */}
      {combatMode && isCriticalShield && !isCriticalCore && !combatStats.isGameOver && (
        <div className="pointer-events-none fixed inset-0 z-20 border-[6px] sm:border-[10px] border-cyan-500/30 shadow-[inset_0_0_80px_rgba(6,182,212,0.3)] animate-pulse flex items-center justify-center">
          <div className="bg-cyan-950/80 backdrop-blur-md border border-cyan-500/60 rounded-xl px-4 py-2 flex items-center gap-2 text-cyan-300 font-mono text-xs sm:text-sm tracking-widest font-black uppercase shadow-[0_0_30px_rgba(6,182,212,0.6)]">
            <ShieldAlert className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            <span>DEFLECTOR SHIELDS LOW ({Math.round(shieldPercent)}%)</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. Top Center: Sector Battle Wave Progress & Win Tracker
         ========================================================================= */}
      {combatMode && (
        <div className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          <div className="bg-[#0b0c16]/90 backdrop-blur-md border border-cyan-500/40 rounded-full px-4 py-1.5 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SECTOR WAVE {combatStats.wave || 1}</span>
            </div>

            <div className="w-px h-3.5 bg-cyan-800/60" />

            {/* Wave Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400">HOSTILES DOWN:</span>
              <div className="w-24 sm:w-36 h-2 bg-gray-900 rounded-full overflow-hidden border border-cyan-500/30 relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((combatStats.waveKills || 0) / (combatStats.waveTarget || 6)) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-black text-amber-300">
                {combatStats.waveKills || 0}/{combatStats.waveTarget || 6}
              </span>
            </div>

            {/* Total Sector Wins Counter */}
            {(combatStats.totalWins || 0) > 0 && (
              <>
                <div className="w-px h-3.5 bg-cyan-800/60" />
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span>{combatStats.totalWins} WINS</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          5. Bottom Center Cockpit Console: Core Reactor + Shields + Blaster Power
         ========================================================================= */}
      {combatMode && (
        <div className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-full max-w-xl px-4">
          {/* Hyper Counter-Strike Torpedo Volley Trigger Button */}
          {isPowerReady && !combatStats.isGameOver && (
            <button
              onClick={onUnleashHyperStrike}
              className="w-full py-2.5 px-4 rounded-xl font-black font-mono text-sm tracking-wider uppercase text-white bg-gradient-to-r from-red-600 via-amber-500 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 shadow-[0_0_35px_rgba(244,63,94,0.8)] border border-amber-300/60 transition-all transform hover:scale-[1.02] active:scale-[0.98] animate-bounce flex items-center justify-center gap-2 cursor-pointer"
              title="Launch homing Proton Torpedoes to annihilate all active enemy starships!"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-200" />
              <span>⚡ UNLEASH HYPER COUNTER-STRIKE (SPACE)</span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </button>
          )}

          {/* Ergonomic Cockpit Console: Deflector Shields | Core Reactor | Blaster Power */}
          <div
            className={`w-full bg-[#0c0d18]/95 backdrop-blur-md border rounded-2xl p-2.5 shadow-[0_0_30px_rgba(6,182,212,0.18)] grid grid-cols-3 gap-2.5 transition-all duration-300 ${
              isCriticalCore
                ? 'border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.5)] animate-pulse'
                : 'border-cyan-500/35'
            }`}
          >
            {/* 1. Deflector Shield Gauge (Independent) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-cyan-300 font-bold truncate">
                  <Shield
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCriticalShield ? 'text-red-400 animate-spin-slow' : 'text-cyan-400'
                    }`}
                  />
                  <span>SHIELDS</span>
                </span>
                <span
                  className={`font-black font-mono transition-transform duration-200 ${
                    pulseShield ? 'scale-110' : ''
                  } ${
                    shieldPercent > 50
                      ? 'text-emerald-400'
                      : shieldPercent > 25
                      ? 'text-amber-400'
                      : 'text-red-400 animate-pulse'
                  }`}
                >
                  {Math.round(shieldPercent)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    shieldPercent > 50
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_#10b981]'
                      : shieldPercent > 25
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_#ef4444] animate-pulse'
                  }`}
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>

            {/* 2. Core Reactor Energy Meter (Central Imperial Core Strike Target) */}
            <div className="flex flex-col gap-1 px-1 border-x border-cyan-900/60">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-red-300 font-bold truncate">
                  <Activity
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCriticalCore
                        ? 'text-red-400 animate-bounce'
                        : 'text-amber-400'
                    }`}
                  />
                  <span>CORE REACTOR</span>
                </span>
                <span
                  className={`font-black font-mono transition-transform duration-200 ${
                    pulseCore ? 'scale-110' : ''
                  } ${
                    corePercent > 50
                      ? 'text-emerald-400'
                      : corePercent > 30
                      ? 'text-amber-400'
                      : 'text-red-400 animate-pulse'
                  }`}
                >
                  {Math.round(corePercent)}%
                </span>
              </div>
              <div
                className={`w-full h-2.5 bg-gray-950 rounded-full overflow-hidden p-0.5 border transition-all ${
                  isCriticalCore
                    ? 'border-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'
                    : 'border-red-500/40'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    corePercent > 50
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_10px_#10b981]'
                      : corePercent > 30
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-400 shadow-[0_0_15px_#ef4444] animate-pulse'
                  }`}
                  style={{ width: `${corePercent}%` }}
                />
              </div>
            </div>

            {/* 3. Blaster Power Gauge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-amber-300 font-bold truncate">
                  <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>BLASTER POWER</span>
                </span>
                <span
                  className={`font-black font-mono transition-transform duration-200 ${
                    isPowerReady ? 'text-fuchsia-400 animate-pulse scale-105' : 'text-cyan-300'
                  }`}
                >
                  {isPowerReady ? 'MAX ⚡' : `${Math.round(powerPercent)}%`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-amber-500/30 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPowerReady
                      ? 'bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 shadow-[0_0_14px_#d946ef] animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 shadow-[0_0_8px_#38bdf8]'
                  }`}
                  style={{ width: `${powerPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. Top Right Arcade Combat Status & Scoreboard
         ========================================================================= */}
      {combatMode && (
        <div className="pointer-events-auto fixed top-4 right-4 z-30 flex flex-col items-end gap-2 max-w-xs">
          {/* Main Combat Header Card */}
          <div className="bg-[#0c0d16]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.15)] text-right">
            <div className="flex items-center justify-between gap-3 border-b border-cyan-900/50 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-cyan-400">
                <Crosshair className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span>STAR WARS TARGETING</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                COMBAT ACTIVE
              </span>
            </div>

            {/* Score and Kill counters */}
            <div className="flex items-baseline justify-end gap-4 my-1">
              {/* Combo Streak */}
              {combatStats.combo > 1 && (
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>COMBO x{combatStats.combo}</span>
                </div>
              )}

              {/* Total Points */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider">SCORE</span>
                <div
                  className={`text-3xl font-black font-mono tracking-tight transition-transform duration-300 ${
                    pulseScore ? 'scale-125 text-amber-300 drop-shadow-[0_0_12px_#fde047]' : 'text-white'
                  }`}
                >
                  +{combatStats.score}
                </div>
              </div>
            </div>

            {/* Sub-stats: Ships Destroyed & Cannon Tier */}
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-200/80 pt-1.5 border-t border-cyan-950">
              <span className="text-gray-400">CANNONS:</span>
              <span className="font-bold text-amber-400">{tierName}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-200/80 pt-1">
              <span className="text-gray-400">TARGETS DOWN:</span>
              <span className="font-bold text-emerald-400">{combatStats.destroyedCount} SHIPS</span>
            </div>

            {/* Target Lock Readout */}
            {lockedShipName ? (
              <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LOCKED: {lockedShipName}</span>
              </div>
            ) : (
              <div className="mt-2 text-[10px] font-mono text-cyan-400/60 flex items-center justify-end gap-1.5">
                <span>CLICK HOSTILE SHIP OR DEFLECT BOLTS</span>
              </div>
            )}
          </div>

          {/* Quick Dogfight Actions Bar */}
          <div className="flex items-center gap-1.5 bg-[#0a0a12]/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-1 text-xs">
            <button
              onClick={onToggleAutoAim}
              className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                autoAimBlaster
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              title="Automatically lead and fire blasters toward nearby enemy ships on click"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>AUTO-AIM {autoAimBlaster ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onResetScore}
              className="px-2 py-1 rounded text-[10px] font-mono text-gray-400 hover:text-amber-300 bg-white/5 hover:bg-amber-500/10 transition-all flex items-center gap-1 cursor-pointer"
              title="Reset combat kills and score"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. Dramatic Game Over Modal: "MISSION FAILED — CORE DESTROYED"
         ========================================================================= */}
      {combatStats.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#25090e] via-[#14060a] to-[#080305] border-2 border-red-500/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(239,68,68,0.55)] text-center overflow-hidden">
            {/* Ambient Catastrophic Breach Glow */}
            <div className="absolute -top-24 -left-24 w-56 h-56 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-orange-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Skull / Breach Hazard Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-rose-900 text-white shadow-[0_0_35px_#ef4444] mb-3 border-2 border-red-400/80 animate-pulse">
              <Skull className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-400 to-orange-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
              MISSION FAILED
            </h1>
            <h2 className="text-sm sm:text-base font-black font-mono tracking-widest text-red-400 mt-1 uppercase">
              CORE REACTOR DESTROYED
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-1 max-w-sm mx-auto">
              Cockpit reactor containment breached by Imperial plasma strikes. Starfighter destroyed.
            </p>

            {/* Final Combat Statistics Grid */}
            <div className="grid grid-cols-2 gap-2.5 my-6 text-left">
              <div className="bg-white/5 border border-red-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">FINAL SCORE</span>
                <div className="text-2xl font-black font-mono text-amber-300">+{combatStats.score}</div>
              </div>

              <div className="bg-white/5 border border-red-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">WAVE REACHED</span>
                <div className="text-2xl font-black font-mono text-cyan-300">SECTOR {combatStats.wave || 1}</div>
              </div>

              <div className="bg-white/5 border border-red-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">TARGETS DESTROYED</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {combatStats.destroyedCount} SHIPS
                </div>
                <div className="text-[10px] font-mono text-amber-400/80 mt-0.5">
                  ({combatStats.eliteKills || 0} Elite TIE Advanced)
                </div>
              </div>

              <div className="bg-white/5 border border-red-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">DEFLECTIONS & COMBO</span>
                <div className="text-xl font-black font-mono text-rose-400">
                  {combatStats.deflections || 0} DEFLECTS
                </div>
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                  Max Streak: {combatStats.maxCombo || 1}x 🔥
                </div>
              </div>
            </div>

            {/* Action Buttons: Restart Wave & Restart Mission */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <button
                onClick={onRestartWave}
                className="w-full py-3 px-5 rounded-xl font-black font-mono text-sm tracking-wider uppercase text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-[0_0_30px_rgba(239,68,68,0.7)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-rose-400/50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESTART WAVE {combatStats.wave || 1}</span>
              </button>

              <button
                onClick={onRestartMission}
                className="w-full sm:w-auto py-3 px-5 rounded-xl font-mono text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer whitespace-nowrap"
              >
                RESTART MISSION (WAVE 1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. Epic Victory Celebration Modal ("if they hit more they will win")
         ========================================================================= */}
      {combatStats.isVictorious && !combatStats.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#121424] to-[#080911] border-2 border-amber-400/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(251,191,36,0.35)] text-center overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Victory Trophy Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-[0_0_25px_#fbbf24] mb-3 animate-bounce">
              <Trophy className="w-8 h-8 fill-black" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-md">
              SECTOR LIBERATED!
            </h2>
            <p className="text-xs sm:text-sm font-mono text-cyan-300/80 mt-1 uppercase tracking-widest">
              Rebel Starfighter Dogfight Victory 🏆
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-2.5 my-5 text-left">
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-2.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">SCORE EARNED</span>
                <div className="text-xl font-black font-mono text-amber-300">+{combatStats.score}</div>
              </div>
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-2.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">MAX COMBO</span>
                <div className="text-xl font-black font-mono text-rose-400">{combatStats.maxCombo || 1}x 🔥</div>
              </div>
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-2.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">CORE INTEGRITY</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {Math.round(combatStats.coreEnergy || 100)}%
                </div>
              </div>
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-2.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">TOTAL SECTOR WINS</span>
                <div className="text-xl font-black font-mono text-cyan-300">
                  {(combatStats.totalWins || 0) + 1}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2">
              <button
                onClick={onNextWave}
                className="w-full py-2.5 px-4 rounded-xl font-black font-mono text-sm tracking-wider uppercase text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>NEXT SECTOR WAVE</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onDismissVictory}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-mono text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer"
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
