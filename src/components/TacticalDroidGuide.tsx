import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  AlertTriangle,
  Zap,
  Shield,
  HelpCircle,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Crosshair,
  Sparkles,
  GripHorizontal,
  Sliders,
  RotateCcw,
  Radio,
} from 'lucide-react';
import { CombatStats } from '../types';
import { neuralAudio } from '../audio/neuralAudio';

interface TacticalDroidGuideProps {
  combatStats: CombatStats;
  combatMode: boolean;
}

const ROTATING_TIPS = [
  {
    prefix: '*CHIRP*',
    tag: 'TURBOLASERS',
    text: 'Click enemy starships to fire blasters. Toggle AUTO-AIM (in targeting window) to lead shots automatically.',
    tone: 'tip' as const,
  },
  {
    prefix: '*BLIP-WHISTLE*',
    tag: 'ORDNANCE DISCIPLINE',
    text: 'Proton Torpedo volley requires 100% Overdrive and consumes 1 Torpedo ammo (2 max). Build 5x combos or defeat Elite TIEs to restock!',
    tone: 'tip' as const,
  },
  {
    prefix: '*BEEP-CHIRP*',
    tag: 'SUPERWEAPON',
    text: 'Death Star orbital superlaser capacitor charges as you destroy hostiles. When 100% primed, press [D] to fire the superlaser!',
    tone: 'happy' as const,
  },
  {
    prefix: '*CLICK*',
    tag: 'HUD CUSTOMIZATION',
    text: 'Click & drag the grip on Droid R4-T9 or the Targeting Window to reposition them anywhere across your cockpit view!',
    tone: 'chatter' as const,
  },
  {
    prefix: '*DEFLECT-ALERT*',
    tag: 'DEFLECTION',
    text: 'When red plasma bolts fly toward cockpit, click them mid-air to deflect and recharge +3% Core & +10% Superlaser!',
    tone: 'chatter' as const,
  },
  {
    prefix: '*WHIRR*',
    tag: 'CORE REPAIRS',
    text: 'Destroyed ships drop green Core Cells. Click them immediately to harvest an emergency +15% Core Energy restore.',
    tone: 'tip' as const,
  },
  {
    prefix: '*ALERT*',
    tag: 'ELITE FIGHTERS',
    text: 'TIE Advanced ships fire heavy 22% core strikes. Destroying them grants +8% Core repair, +30% Superlaser charge, and +1 Torpedo!',
    tone: 'warning' as const,
  },
];

export const TacticalDroidGuide: React.FC<TacticalDroidGuideProps> = ({
  combatStats,
  combatMode,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showManual, setShowManual] = useState<boolean>(false);
  const [showAdjustMenu, setShowAdjustMenu] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const lastStateRef = useRef<string>('');

  // Draggable positioning state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('r4t9_guide_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  // Width mode state: 'compact' (240px), 'normal' (290px), 'wide' (340px)
  const [widthMode, setWidthMode] = useState<'compact' | 'normal' | 'wide'>(() => {
    try {
      const saved = localStorage.getItem('r4t9_guide_width');
      if (saved === 'compact' || saved === 'normal' || saved === 'wide') return saved;
    } catch {}
    return 'normal';
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);

  // Width in pixels based on mode
  const currentWidth = widthMode === 'compact' ? 240 : widthMode === 'wide' ? 340 : 290;

  // Cycle through default tactical instructions periodically
  useEffect(() => {
    if (!combatMode || combatStats.activeLockOn || combatStats.isGameOver) return;

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
      if (!soundMuted && Math.random() > 0.45) {
        neuralAudio.playDroidChirp('tip');
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [combatMode, combatStats.activeLockOn, combatStats.isGameOver, soundMuted]);

  // Dynamic context-aware state evaluation
  let activeMessage = {
    prefix: ROTATING_TIPS[tipIndex].prefix,
    tag: ROTATING_TIPS[tipIndex].tag,
    text: ROTATING_TIPS[tipIndex].text,
    status: 'ONLINE',
    statusColor: 'text-[#d2f27c]',
    borderColor: 'border-[#283231]',
    mood: 'tip' as 'chatter' | 'warning' | 'happy' | 'tip',
  };

  const corePercent = Math.round(combatStats.coreEnergy ?? 100);
  const shieldPercent = Math.round(combatStats.playerShield ?? 100);
  const isPowerFull = (combatStats.blasterPower ?? 0) >= 100;
  const hasTorpedoAmmo = (combatStats.torpedoAmmo ?? 0) > 0;
  const isTorpedoCooling = (combatStats.torpedoCooldown ?? 0) > 0;
  const isDeathStarReady = (combatStats.deathStarCharge ?? 0) >= 100;

  if (combatStats.activeLockOn) {
    activeMessage = {
      prefix: '*URGENT*',
      tag: 'CORE LOCK DETECTED',
      text: `Hostile locked on Core (${combatStats.activeLockOn.timeLeft.toFixed(1)}s). Intercept incoming red bolt or neutralize hostile immediately.`,
      status: 'THREAT LOCK',
      statusColor: 'text-[#f87171]',
      borderColor: 'border-red-500/60',
      mood: 'warning',
    };
  } else if (corePercent <= 30 && corePercent > 0) {
    activeMessage = {
      prefix: '*CRITICAL*',
      tag: 'CORE DANGER',
      text: `Reactor at ${corePercent}%. Neutralize hostiles to harvest green Core Cells (+15%) or deflect strikes (+3%).`,
      status: 'EMERGENCY',
      statusColor: 'text-[#f87171]',
      borderColor: 'border-red-500/50',
      mood: 'warning',
    };
  } else if (isDeathStarReady && !combatStats.isGameOver) {
    activeMessage = {
      prefix: '*PRIMED*',
      tag: 'DEATH STAR SUPERWEAPON',
      text: 'Orbital superlaser capacitor at 100%! Press [D] or click FIRE SUPERLASER in Targeting Window to annihilate sector hostiles.',
      status: 'SUPERWEAPON',
      statusColor: 'text-[#d2f27c]',
      borderColor: 'border-[#d2f27c]',
      mood: 'happy',
    };
  } else if (isPowerFull && hasTorpedoAmmo && !isTorpedoCooling && !combatStats.isGameOver) {
    activeMessage = {
      prefix: '*READY*',
      tag: 'TORPEDO VOLLEY READY',
      text: `Proton Torpedoes primed (${combatStats.torpedoAmmo}/${combatStats.maxTorpedoAmmo || 2}). Press [SPACE] to launch tactical homing strike!`,
      status: 'OVERDRIVE',
      statusColor: 'text-[#d2f27c]',
      borderColor: 'border-[#d2f27c]/60',
      mood: 'happy',
    };
  } else if (isPowerFull && !hasTorpedoAmmo && !combatStats.isGameOver) {
    activeMessage = {
      prefix: '*RESTOCK NEEDED*',
      tag: 'ORDNANCE EMPTY (0/2)',
      text: 'Overdrive full, but Torpedo tubes empty! Build a 5x combo streak or destroy an Elite TIE Advanced to reload.',
      status: 'ORDNANCE EMPTY',
      statusColor: 'text-[#f87171]',
      borderColor: 'border-amber-500/50',
      mood: 'tip',
    };
  } else if (combatStats.combo >= 3) {
    activeMessage = {
      prefix: '*STREAK*',
      tag: `COMBO x${combatStats.combo}`,
      text: `Multiplier active. Blaster capacitor charging (+${combatStats.combo * 4}%). Reach 5x combo for bonus torpedo ammo!`,
      status: 'SURGE',
      statusColor: 'text-[#d2f27c]',
      borderColor: 'border-[#283231]',
      mood: 'happy',
    };
  } else if (shieldPercent < 30) {
    activeMessage = {
      prefix: '*ALERT*',
      tag: 'SHIELDS LOW',
      text: `Deflector shields at ${shieldPercent}%. Destroy hostiles to siphon +10% deflector shield energy.`,
      status: 'SHIELD LOW',
      statusColor: 'text-[#98a5a2]',
      borderColor: 'border-[#283231]',
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

  // Dragging handlers (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only drag from handle or header
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = position?.x ?? (window.innerWidth < 640 ? 12 : 16);
    const currentY = position?.y ?? 96;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      const newX = Math.max(8, Math.min(window.innerWidth - currentWidth - 8, dragRef.current.initialX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - 100, dragRef.current.initialY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      if (position) {
        try {
          localStorage.setItem('r4t9_guide_pos', JSON.stringify(position));
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
  }, [isDragging, position, currentWidth]);

  const handleSetPreset = (preset: 'tl' | 'bl' | 'tr' | 'br' | 'reset') => {
    if (preset === 'reset') {
      setPosition(null);
      try {
        localStorage.removeItem('r4t9_guide_pos');
      } catch {}
      setShowAdjustMenu(false);
      return;
    }

    let newX = 16;
    let newY = 96;
    if (preset === 'bl') {
      newX = 16;
      newY = Math.max(96, window.innerHeight - 280);
    } else if (preset === 'tr') {
      newX = Math.max(16, window.innerWidth - currentWidth - 260);
      newY = 96;
    } else if (preset === 'br') {
      newX = Math.max(16, window.innerWidth - currentWidth - 16);
      newY = Math.max(96, window.innerHeight - 280);
    }

    const nextPos = { x: newX, y: newY };
    setPosition(nextPos);
    try {
      localStorage.setItem('r4t9_guide_pos', JSON.stringify(nextPos));
    } catch {}
    setShowAdjustMenu(false);
  };

  const handleWidthChange = (mode: 'compact' | 'normal' | 'wide') => {
    setWidthMode(mode);
    try {
      localStorage.setItem('r4t9_guide_width', mode);
    } catch {}
  };

  if (!combatMode) return null;

  const stylePosition: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${currentWidth}px`,
        zIndex: 35,
      }
    : {
        width: `${currentWidth}px`,
      };

  return (
    <>
      {/* Draggable & Adjustable Astromech Droid Widget */}
      <aside
        ref={asideRef}
        aria-label="Tactical droid co-pilot telemetry"
        style={stylePosition}
        className={`pointer-events-auto select-none ${
          !position ? 'fixed top-24 left-3 sm:left-4 z-30' : ''
        } ${isDragging ? 'opacity-95 shadow-2xl scale-[1.01]' : 'transition-shadow'}`}
      >
        <div
          className={`bg-[#101516]/95 backdrop-blur-md border rounded-xl shadow-xl transition-colors duration-200 overflow-hidden ${
            isDragging ? 'border-[#d2f27c]/70 ring-1 ring-[#d2f27c]/40' : activeMessage.borderColor
          }`}
        >
          {/* Header Bar with Dedicated Drag Grip */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#283231] bg-[#151c1d]">
            {/* Drag Handle & Droid Identifier */}
            <div
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-[#d2f27c] transition-colors py-0.5 pr-2 select-none"
              title="Drag and adjust Droid R4-T9 anywhere on screen"
            >
              <GripHorizontal className="w-3.5 h-3.5 text-[#98a5a2] hover:text-[#d2f27c] shrink-0" />
              {/* Droid Eye Sensor */}
              <div className="relative w-3.5 h-3.5 rounded-full bg-[#101516] border border-[#283231] flex items-center justify-center shrink-0">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeMessage.status === 'THREAT LOCK' || activeMessage.status === 'EMERGENCY'
                      ? 'bg-red-400 animate-pulse'
                      : activeMessage.status === 'OVERDRIVE' || activeMessage.status === 'SUPERWEAPON'
                      ? 'bg-[#d2f27c]'
                      : 'bg-[#10b981]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#eef2ef] truncate">
                  DROID R4-T9
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-wider ${activeMessage.statusColor}`}>
                  · {activeMessage.status}
                </span>
              </div>
            </div>

            {/* Droid Widget Action Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Adjust / Layout Presets Menu */}
              <button
                onClick={() => setShowAdjustMenu(!showAdjustMenu)}
                className={`p-1 rounded transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c] ${
                  showAdjustMenu
                    ? 'text-[#d2f27c] bg-[#101516] border border-[#283231]'
                    : 'text-[#98a5a2] hover:text-[#eef2ef] hover:bg-[#151c1d]'
                }`}
                title="Adjust Droid Position & Size"
                aria-label="Adjust Droid Position & Size"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className="p-1 rounded text-[#98a5a2] hover:text-[#eef2ef] hover:bg-[#151c1d] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                title={soundMuted ? 'Unmute Droid Telemetry' : 'Mute Droid Telemetry'}
                aria-label={soundMuted ? 'Unmute Droid Telemetry' : 'Mute Droid Telemetry'}
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowManual(true)}
                className="p-1 rounded text-[#98a5a2] hover:text-[#d2f27c] hover:bg-[#151c1d] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                title="Open Tactical Flight Manual"
                aria-label="Open Tactical Flight Manual"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-[#98a5a2] hover:text-[#eef2ef] hover:bg-[#151c1d] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                title={isMinimized ? 'Expand Droid Telemetry' : 'Minimize Droid Telemetry'}
                aria-label={isMinimized ? 'Expand Droid Telemetry' : 'Minimize Droid Telemetry'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Adjustment Menu Drawer */}
          {showAdjustMenu && (
            <div className="p-2.5 bg-[#151c1d] border-b border-[#283231] text-[10px] font-mono space-y-2">
              <div className="flex items-center justify-between text-[#98a5a2]">
                <span className="uppercase tracking-wider">HUD PLACEMENT:</span>
                <span className="text-[9px] text-[#d2f27c]">DRAG GRIP OR TAP PRESET</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => handleSetPreset('tl')}
                  className="px-1.5 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] hover:border-[#d2f27c]/40 text-center cursor-pointer transition-colors"
                >
                  TOP-L
                </button>
                <button
                  onClick={() => handleSetPreset('tr')}
                  className="px-1.5 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] hover:border-[#d2f27c]/40 text-center cursor-pointer transition-colors"
                >
                  TOP-R
                </button>
                <button
                  onClick={() => handleSetPreset('bl')}
                  className="px-1.5 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] hover:border-[#d2f27c]/40 text-center cursor-pointer transition-colors"
                >
                  BOT-L
                </button>
                <button
                  onClick={() => handleSetPreset('br')}
                  className="px-1.5 py-1 rounded bg-[#101516] border border-[#283231] text-[#98a5a2] hover:text-[#d2f27c] hover:border-[#d2f27c]/40 text-center cursor-pointer transition-colors"
                >
                  BOT-R
                </button>
              </div>

              {/* Width / Scale Adjustment */}
              <div className="flex items-center justify-between pt-1 border-t border-[#283231]/60">
                <span className="text-[#98a5a2]">WIDTH:</span>
                <div className="flex items-center gap-1">
                  {(['compact', 'normal', 'wide'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleWidthChange(mode)}
                      className={`px-1.5 py-0.5 rounded capitalize cursor-pointer transition-colors ${
                        widthMode === mode
                          ? 'bg-[#d2f27c] text-[#080b0c] font-semibold'
                          : 'bg-[#101516] text-[#98a5a2] hover:text-[#eef2ef] border border-[#283231]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset to Default */}
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => handleSetPreset('reset')}
                  className="flex items-center gap-1 text-[9px] text-[#98a5a2] hover:text-[#eef2ef] cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>RESET DOCK</span>
                </button>
              </div>
            </div>
          )}

          {/* Expanded Droid Instruction Body */}
          {!isMinimized ? (
            <div className="p-3 flex flex-col gap-2">
              {/* Category Kicker */}
              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#98a5a2]">
                <span className="text-[#d2f27c] font-semibold">{activeMessage.tag}</span>
                <span>{activeMessage.prefix}</span>
              </div>

              {/* Robotic Telemetry Message */}
              <div className="text-left font-sans text-xs leading-relaxed text-[#eef2ef] select-text">
                {activeMessage.text}
              </div>

              {/* Footer Quick Links & Torpedo Ammo / Superweapon status */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#283231] text-[10px] font-mono">
                <button
                  onClick={() => {
                    setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
                    neuralAudio.playDroidChirp('chatter');
                  }}
                  className="text-[#98a5a2] hover:text-[#d2f27c] flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                >
                  <Bot className="w-3 h-3 text-[#d2f27c]" />
                  <span>NEXT SITREP &gt;</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#98a5a2]">
                    ORDNANCE: <span className={hasTorpedoAmmo ? 'text-[#d2f27c]' : 'text-red-400'}>{combatStats.torpedoAmmo ?? 2}/2</span>
                  </span>
                  <button
                    onClick={() => setShowManual(true)}
                    className="text-[#d2f27c] hover:underline cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
                  >
                    MANUAL
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Minimized view
            <div
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1.5 bg-[#101516] flex items-center justify-between text-[10px] font-mono text-[#98a5a2] hover:text-[#eef2ef] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d2f27c] shrink-0" />
                <span className="truncate">{activeMessage.tag}</span>
              </div>
              <span className="text-[9px] ml-2 shrink-0">[EXPAND]</span>
            </div>
          )}
        </div>
      </aside>

      {/* Tactical Flight Manual Modal */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b0c]/85 backdrop-blur-md pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="manual-title">
          <div className="relative w-full max-w-lg bg-[#101516] border border-[#283231] rounded-xl p-5 sm:p-6 shadow-2xl text-left overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#283231] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#151c1d] border border-[#283231] text-[#d2f27c]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="manual-title" className="text-base font-sans font-bold tracking-tight text-[#eef2ef]">
                    TACTICAL FLIGHT MANUAL
                  </h3>
                  <p className="text-xs font-mono text-[#98a5a2]">
                    R4-T9 Combat Telemetry Protocol
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManual(false)}
                className="px-2.5 py-1 rounded-lg font-mono text-xs text-[#98a5a2] hover:text-[#eef2ef] bg-[#151c1d] border border-[#283231] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                ESC
              </button>
            </div>

            {/* Instruction Grid */}
            <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1 text-xs text-[#98a5a2]">
              {/* 1. Shooting & Auto-Aim */}
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3 flex gap-3">
                <div className="p-1.5 rounded bg-[#101516] border border-[#283231] text-[#d2f27c] shrink-0 h-fit">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#eef2ef] text-xs mb-0.5">1. FIRING &amp; AUTO-AIM</h4>
                  <p className="leading-relaxed">
                    Click enemy starfighters to fire twin turbolaser blasters. Keep AUTO-AIM enabled in the Targeting Window to lead shots into hostile flight paths.
                  </p>
                </div>
              </div>

              {/* 2. Drag & Adjust HUD */}
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3 flex gap-3">
                <div className="p-1.5 rounded bg-[#101516] border border-[#283231] text-[#d2f27c] shrink-0 h-fit">
                  <GripHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#eef2ef] text-xs mb-0.5">2. DRAG &amp; ADJUST COCKPIT HUD</h4>
                  <p className="leading-relaxed">
                    Click and drag the header handle of <span className="text-[#eef2ef] font-semibold">Droid R4-T9</span> or the <span className="text-[#eef2ef] font-semibold">Targeting Window</span> to position them anywhere on your screen. Use the sliders button for instant layout presets.
                  </p>
                </div>
              </div>

              {/* 3. Proton Torpedo Volley Balance */}
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3 flex gap-3">
                <div className="p-1.5 rounded bg-[#101516] border border-[#283231] text-[#d2f27c] shrink-0 h-fit">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#d2f27c] text-xs mb-0.5">3. PROTON TORPEDO VOLLEY (SPACE)</h4>
                  <p className="leading-relaxed">
                    Press <span className="text-[#d2f27c] font-semibold">[SPACEBAR]</span> to launch a 2-torpedo homing volley. Firing requires <span className="text-[#eef2ef] font-semibold">100% Overdrive</span> and consumes <span className="text-[#eef2ef] font-semibold">1 Torpedo Ammo</span> (capacity: 2) with a <span className="text-[#eef2ef] font-semibold">12-second tactical reload cooldown</span> to prevent continuous spam. Restock ammo by landing 5x combos or destroying Elite TIE Advanced!
                  </p>
                </div>
              </div>

              {/* 4. Death Star Superweapon */}
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3 flex gap-3">
                <div className="p-1.5 rounded bg-[#101516] border border-[#283231] text-[#10b981] shrink-0 h-fit">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#10b981] text-xs mb-0.5">4. DEATH STAR SUPERWEAPON</h4>
                  <p className="leading-relaxed">
                    The orbital superlaser capacitor charges as you destroy hostiles (+15% normal, +30% elite, +10% deflect). When charged to <span className="text-[#10b981] font-semibold">100%</span>, press <span className="text-[#10b981] font-semibold">[D]</span> or click <span className="text-[#10b981] font-semibold">FIRE SUPERLASER</span> to trigger 8 converging beams and a colossal sector blast!
                  </p>
                </div>
              </div>

              {/* 5. Core Strike & Deflection */}
              <div className="bg-[#151c1d] border border-[#283231] rounded-lg p-3 flex gap-3">
                <div className="p-1.5 rounded bg-[#101516] border border-[#283231] text-[#f87171] shrink-0 h-fit">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#f87171] text-xs mb-0.5">5. CORE STRIKE &amp; DEFLECTION</h4>
                  <p className="leading-relaxed">
                    When hostiles lock on and fire red plasma bolts toward your cockpit, <span className="text-[#eef2ef] font-semibold">CLICK THE BOLT MID-AIR</span> to deflect it, canceling damage and restoring <span className="text-[#d2f27c] font-semibold">+3% Core Energy</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#283231] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#98a5a2]">
                ALLIANCE PROTOCOL // REVISION 7X
              </span>
              <button
                onClick={() => setShowManual(false)}
                className="py-1.5 px-3.5 rounded-lg font-sans font-semibold text-xs uppercase bg-[#d2f27c] text-[#080b0c] hover:bg-[#bde660] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#d2f27c]"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
