import React, { useEffect, useState } from 'react';
import { Crosshair, Shield, Zap, Flame, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';
import { CombatStats, FloatingPointNotice } from '../types';

interface CombatHudProps {
  combatStats: CombatStats;
  floatingNotices: FloatingPointNotice[];
  lockedShipName: string | null;
  combatMode: boolean;
  autoAimBlaster: boolean;
  onToggleCombatMode: () => void;
  onToggleAutoAim: () => void;
  onResetScore: () => void;
}

export const CombatHud: React.FC<CombatHudProps> = ({
  combatStats,
  floatingNotices,
  lockedShipName,
  combatMode,
  autoAimBlaster,
  onToggleCombatMode,
  onToggleAutoAim,
  onResetScore,
}) => {
  const [pulseScore, setPulseScore] = useState(false);

  // Pulse score badge whenever score changes
  useEffect(() => {
    if (combatStats.score > 0) {
      setPulseScore(true);
      const timer = setTimeout(() => setPulseScore(false), 450);
      return () => clearTimeout(timer);
    }
  }, [combatStats.score]);

  return (
    <>
      {/* 1. Floating Hit "+1" Score Text Popups right at exact 3D hit position */}
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
            <div
              className="text-2xl sm:text-3xl font-black tracking-wider drop-shadow-[0_0_16px_rgba(255,234,0,0.8)]"
              style={{ color: notice.color }}
            >
              {notice.text}
            </div>
            {notice.comboText && (
              <div className="text-xs font-bold text-amber-300 tracking-widest uppercase bg-amber-950/80 border border-amber-500/50 rounded-full px-2 py-0.5 mt-0.5 shadow-lg">
                {notice.comboText}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. Top Right Arcade Combat Status & Scoreboard */}
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

            {/* Sub-stats: Ships Destroyed & Status */}
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-200/80 pt-1.5 border-t border-cyan-950">
              <span className="text-gray-400">TARGETS DOWN:</span>
              <span className="font-bold text-amber-400">{combatStats.destroyedCount} SHIPS</span>
            </div>

            {/* Target Lock Readout */}
            {lockedShipName ? (
              <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LOCKED: {lockedShipName}</span>
              </div>
            ) : (
              <div className="mt-2 text-[10px] font-mono text-cyan-400/60 flex items-center justify-end gap-1.5">
                <span>CLICK ANY SHIP TO DESTROY</span>
              </div>
            )}
          </div>

          {/* Quick Dogfight Actions Bar */}
          <div className="flex items-center gap-1.5 bg-[#0a0a12]/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-1 text-xs">
            <button
              onClick={onToggleAutoAim}
              className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1 ${
                autoAimBlaster
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              title="Automatically lead and fire turbolaser blasters toward nearby enemy ships on click"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>AUTO-AIM {autoAimBlaster ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onResetScore}
              className="px-2 py-1 rounded text-[10px] font-mono text-gray-400 hover:text-amber-300 bg-white/5 hover:bg-amber-500/10 transition-all flex items-center gap-1"
              title="Reset combat kills and score"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
