import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  AlertTriangle,
  Zap,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Crosshair,
  Sparkles,
  Info,
} from 'lucide-react';
import { CombatStats } from '../types';
import { neuralAudio } from '../audio/neuralAudio';

interface TacticalDroidGuideProps {
  combatStats: CombatStats;
  combatMode: boolean;
}

const ROTATING_TIPS = [
  {
    prefix: '*BEEP-BOOP*',
    tag: '[PRIMARY WEAPONS]',
    text: 'Click enemy starships to fire blasters. Toggle AUTO-AIM (top right) to lead shots automatically!',
    tone: 'tip' as const,
  },
  {
    prefix: '*CHIRP-WHISTLE*',
    tag: '[DEFLECT PROTOCOL]',
    text: 'When red plasma bolts fly toward cockpit, CLICK them mid-air to deflect and recharge +3% Core!',
    tone: 'chatter' as const,
  },
  {
    prefix: '*BEEP-BLIP*',
    tag: '[COCKPIT SWEEP]',
    text: 'Click & drag mouse across screen to pan cockpit 360° and spot flanking Imperial starfighters.',
    tone: 'tip' as const,
  },
  {
    prefix: '*WHIRR-CLICK*',
    tag: '[CORE REPAIRS]',
    text: 'Destroyed ships drop floating green Core Cells. Click or drift close to harvest +15% Core Energy!',
    tone: 'chatter' as const,
  },
  {
    prefix: '*BEEP-ALERT*',
    tag: '[ELITE FIGHTERS]',
    text: 'TIE Advanced ships fire heavy 22% core strikes. Destroying them grants +8% Core repair!',
    tone: 'warning' as const,
  },
];

export const TacticalDroidGuide: React.FC<TacticalDroidGuideProps> = ({
  combatStats,
  combatMode,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showManual, setShowManual] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const lastStateRef = useRef<string>('');

  // Cycle through default tactical instructions periodically
  useEffect(() => {
    if (!combatMode || combatStats.activeLockOn || combatStats.isGameOver) return;

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
      if (!soundMuted && Math.random() > 0.4) {
        neuralAudio.playDroidChirp('tip');
      }
    }, 8500);

    return () => clearInterval(interval);
  }, [combatMode, combatStats.activeLockOn, combatStats.isGameOver, soundMuted]);

  // Dynamic context-aware state evaluation
  let activeMessage = {
    prefix: ROTATING_TIPS[tipIndex].prefix,
    tag: ROTATING_TIPS[tipIndex].tag,
    text: ROTATING_TIPS[tipIndex].text,
    status: 'ONLINE',
    statusColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-[#0c0e18]/90',
    mood: 'tip' as 'chatter' | 'warning' | 'happy' | 'tip',
  };

  const corePercent = Math.round(combatStats.coreEnergy ?? 100);
  const shieldPercent = Math.round(combatStats.playerShield ?? 100);
  const isPowerFull = (combatStats.blasterPower ?? 0) >= 100;

  if (combatStats.activeLockOn) {
    activeMessage = {
      prefix: '*BEEP-WHRRR-SCREECH!*',
      tag: '[CORE LOCK DETECTED]',
      text: `Hostile locked on our Core! (${combatStats.activeLockOn.timeLeft.toFixed(1)}s). CLICK incoming red bolt to deflect or destroy hostile!`,
      status: 'THREAT LOCK',
      statusColor: 'text-red-400 animate-pulse',
      borderColor: 'border-red-500/80',
      bgColor: 'bg-red-950/90',
      mood: 'warning',
    };
  } else if (corePercent <= 30 && corePercent > 0) {
    activeMessage = {
      prefix: '*SAD-WHISTLE-BEEP!*',
      tag: '[CORE CRITICAL]',
      text: `Reactor at ${corePercent}%! Destroy hostiles to spawn green Core Cells (+15%) and deflect bolts (+3%)!`,
      status: 'EMERGENCY',
      statusColor: 'text-red-400 animate-pulse',
      borderColor: 'border-red-500/60',
      bgColor: 'bg-red-950/80',
      mood: 'warning',
    };
  } else if (isPowerFull && !combatStats.isGameOver) {
    activeMessage = {
      prefix: '*EXCITED-CHIRP-TRRILL!*',
      tag: '[OVERDRIVE READY]',
      text: 'Proton Torpedoes primed! Press [SPACEBAR] or click UNLEASH to eliminate hostile squadron!',
      status: 'HYPER READY',
      statusColor: 'text-fuchsia-400 animate-pulse',
      borderColor: 'border-fuchsia-500/60',
      bgColor: 'bg-purple-950/80',
      mood: 'happy',
    };
  } else if (combatStats.combo >= 3) {
    activeMessage = {
      prefix: '*CHIRP-CHIRP!*',
      tag: `[COMBO x${combatStats.combo}]`,
      text: `Streak multiplier active! Blaster capacitor charging at maximum efficiency (+${combatStats.combo * 5}% power).`,
      status: 'SURGE ENGAGED',
      statusColor: 'text-amber-400',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-950/80',
      mood: 'happy',
    };
  } else if (shieldPercent < 30) {
    activeMessage = {
      prefix: '*ALERT-BLIP*',
      tag: '[SHIELDS LOW]',
      text: `Deflector shields at ${shieldPercent}%. Destroy hostiles to siphon +10% deflector shield energy!`,
      status: 'SHIELD ALERT',
      statusColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      bgColor: 'bg-cyan-950/80',
      mood: 'tip',
    };
  }

  // Play audio on state transition
  useEffect(() => {
    if (activeMessage.tag !== lastStateRef.current) {
      lastStateRef.current = activeMessage.tag;
      if (!soundMuted && combatMode) {
        neuralAudio.playDroidChirp(activeMessage.mood);
      }
    }
  }, [activeMessage.tag, activeMessage.mood, soundMuted, combatMode]);

  if (!combatMode) return null;

  return (
    <>
      {/* Docked Astromech Droid Widget (Left Side) */}
      <aside aria-label="Tactical droid co-pilot guidance" className="pointer-events-auto fixed top-32 left-3 sm:left-4 z-30 max-w-[280px] sm:max-w-[320px]">
        <div
          className={`backdrop-blur-md border rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.18)] transition-all duration-300 overflow-hidden ${activeMessage.borderColor} ${activeMessage.bgColor}`}
        >
          {/* Header Bar: Astromech ID & Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              {/* Droid Eye Sensor with Animated Scanline */}
              <div className="relative w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/80 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_8px_#38bdf8]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeMessage.status === 'THREAT LOCK' || activeMessage.status === 'EMERGENCY'
                      ? 'bg-red-500 animate-ping'
                      : activeMessage.status === 'HYPER READY'
                      ? 'bg-fuchsia-400 animate-pulse'
                      : 'bg-cyan-400 animate-pulse'
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-mono font-black tracking-wider text-cyan-200">
                  DROID R4-T9
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-tight ${activeMessage.statusColor}`}>
                  {activeMessage.status}
                </span>
              </div>
            </div>

            {/* Droid Widget Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
                title={soundMuted ? 'Unmute Droid Audio' : 'Mute Droid Audio'}
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowManual(true)}
                className="p-1 rounded text-gray-400 hover:text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
                title="Open Tactical Flight Manual"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title={isMinimized ? 'Expand Droid Guide' : 'Minimize Droid Guide'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expanded Droid Instruction Body */}
          {!isMinimized ? (
            <div className="p-3 flex flex-col gap-2">
              {/* Audio Waveform Visualizer simulation */}
              <div className="flex items-center gap-1 h-3 px-1 bg-black/50 rounded border border-white/5">
                <div className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <div className="w-1 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <div className="w-1 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                <div className="w-1 h-2 bg-cyan-300 rounded-full animate-ping" />
                <span className="text-[8px] font-mono text-cyan-400/80 ml-auto tracking-widest">
                  SYS_VOCAL // {activeMessage.tag}
                </span>
              </div>

              {/* Robotic Telemetry Message */}
              <div className="text-left font-mono text-xs leading-relaxed text-gray-200">
                <span className="font-bold text-amber-300 mr-1.5">{activeMessage.prefix}</span>
                <span>{activeMessage.text}</span>
              </div>

              {/* Sitrep Quick Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono">
                <button
                  onClick={() => {
                    setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
                    neuralAudio.playDroidChirp('chatter');
                  }}
                  className="text-cyan-400 hover:text-cyan-200 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span>NEXT SITREP &gt;&gt;</span>
                </button>

                <button
                  onClick={() => setShowManual(true)}
                  className="text-amber-400/90 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  [HOW TO PLAY]
                </button>
              </div>
            </div>
          ) : (
            // Minimized Pill view
            <div
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1.5 bg-black/60 flex items-center justify-between text-[10px] font-mono text-cyan-300 hover:bg-black/80 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                <span className="truncate">{activeMessage.tag}</span>
              </div>
              <span className="text-gray-400 text-[9px] ml-2 shrink-0">[EXPAND]</span>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          Tactical Flight Manual Modal ("HOW TO PLAY" Quick Card)
         ========================================================================= */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-lg bg-[#0e101c] border-2 border-cyan-500/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.35)] text-left overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono tracking-wider text-cyan-200">
                    ASTROMECH FLIGHT MANUAL
                  </h3>
                  <p className="text-xs font-mono text-cyan-400/70">
                    Tactical Systems & Combat Operations Protocol
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManual(false)}
                className="px-2.5 py-1 rounded-lg font-mono text-xs text-gray-400 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Instruction Grid */}
            <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1 text-xs font-mono text-gray-300">
              {/* 1. Shooting & Auto-Aim */}
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-3 flex gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 h-fit">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm mb-0.5">1. FIRING &amp; AUTO-AIM</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Click enemy starfighters to fire twin turbolaser blasters. Keep AUTO-AIM enabled (top right) to automatically lead shots into hostile flight paths.
                  </p>
                </div>
              </div>

              {/* 2. Core Strike Defense & Deflection */}
              <div className="bg-white/5 border border-red-500/30 rounded-xl p-3 flex gap-3">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-300 shrink-0 h-fit">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-400 text-sm mb-0.5">2. CORE STRIKE &amp; DEFLECTION</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Hostiles periodically acquire a 3-second Core Lock. When red plasma bolts fly toward your cockpit, <span className="text-amber-300 font-bold">CLICK THE BOLT IN MID-AIR</span> to deflect it, canceling damage and restoring <span className="text-emerald-300 font-bold">+3% Core Energy</span>!
                  </p>
                </div>
              </div>

              {/* 3. Core Energy vs Shields */}
              <div className="bg-white/5 border border-amber-500/30 rounded-xl p-3 flex gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 h-fit">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-300 text-sm mb-0.5">3. CORE REACTOR INTEGRITY</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Standard laser fire is absorbed by Deflector Shields. Core strikes drain <span className="text-red-400">12% to 22%</span> Core Energy. If Core reaches <span className="text-rose-400 font-bold">0%</span>, the mission fails!
                  </p>
                </div>
              </div>

              {/* 4. Power Tiers & Proton Torpedoes */}
              <div className="bg-white/5 border border-purple-500/30 rounded-xl p-3 flex gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 h-fit">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-300 text-sm mb-0.5">4. HYPER OVERDRIVE</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Landing hits charges your Blaster Power. At 100%, press <span className="text-amber-300 font-bold">[SPACEBAR]</span> to launch a barrage of homing Proton Torpedoes that vaporize the hostile squadron!
                  </p>
                </div>
              </div>

              {/* 5. Sector Waves */}
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-3 flex gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0 h-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-0.5">5. SECTOR LIBERATION</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Defeat the required target quota (e.g. 6, 10, 14 hostiles) to clear the sector, earn victory medals, and advance to deeper Imperial territory.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-cyan-900/60 flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400/70">
                ASTRO-UNIT R4-T9 // REBEL ALLIANCE PROTOCOL
              </span>
              <button
                onClick={() => setShowManual(false)}
                className="py-1.5 px-4 rounded-xl font-bold font-mono text-xs uppercase bg-cyan-500 text-black hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                ACKNOWLEDGED, DROID!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
