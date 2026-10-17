import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NeuralScene } from './components/NeuralScene';
import { ControlOverlay } from './components/ControlOverlay';
import { CombatHud } from './components/CombatHud';
import { TacticalDroidGuide } from './components/TacticalDroidGuide';
import {
  ClickMode,
  CombatStats,
  EnemyShipType,
  FloatingPointNotice,
  ShieldImpactNotice,
  SimulationConfig,
} from './types';
import { MORPH_SHAPES_LIST } from './geometry/morphShapes';
import { neuralAudio } from './audio/neuralAudio';

export default function App() {
  const [config, setConfig] = useState<SimulationConfig>({
    clickMode: 'shockwave',
    brainwave: 'alpha',
    theme: 'cyberpunk', // Matches user's uploaded images
    currentShape: 'brain', // Default: 3D Anatomical Neural Mesh
    autoMorph: false,
    autoMorphInterval: 8,
    particleDensity: 4200,
    triangleScale: 1.05,
    rotationSpeed: 0.8,
    autoRotate: true,
    wireframeOnly: true,
    soundEnabled: true,
    showSynapticLines: true,
    splitDistance: 0,
    scatterAmount: 0,
    bloomEnabled: true,
    bloomIntensity: 1.6,
    bloomRadius: 0.55,
    bloomThreshold: 0.18,
    hologramScanlines: false,
    hyperspaceWarp: false,
    hologramProjector: true,
    starwarsTour: false,
    sFoilsOpen: true,
    combatMode: true,           // Star Wars Dogfight Combat Active by default!
    enemySquadronSize: 4,
    autoAimBlaster: true,       // Auto-aim on click to easily destroy ships
  });

  const [stats, setStats] = useState({
    count: 4200,
    fps: 60,
    activeShockwaves: 0,
  });

  const [lastTriggeredMode, setLastTriggeredMode] = useState<ClickMode | null>(null);

  // Star Wars Combat Arcade State (Two-Sided Dogfight, Imperial Core Strike, Shields & Victory)
  const [combatStats, setCombatStats] = useState<CombatStats>({
    score: 0,
    destroyedCount: 0,
    combo: 0,
    maxCombo: 0,
    lastHitTime: 0,
    accuracy: 100,
    shotsFired: 0,
    shotsHit: 0,
    playerShield: 100,
    blasterPower: 0,
    powerTier: 1,
    wave: 1,
    waveTarget: 6,
    waveKills: 0,
    isVictorious: false,
    totalWins: 0,
    incomingThreatWarning: false,
    // Imperial Core Strike System
    coreEnergy: 100,
    isGameOver: false,
    eliteKills: 0,
    deflections: 0,
    activeLockOn: null,
  });

  const [floatingNotices, setFloatingNotices] = useState<FloatingPointNotice[]>([]);
  const [shieldImpacts, setShieldImpacts] = useState<ShieldImpactNotice[]>([]);
  const [coreImpactFlash, setCoreImpactFlash] = useState<boolean>(false);
  const [lockedShipName, setLockedShipName] = useState<string | null>(null);

  const triggerActionRef = useRef<
    | ((
        action:
          | 'shockwave'
          | 'scatter'
          | 'split'
          | 'pulse'
          | 'hyperspace'
          | 'blaster'
          | 'force'
          | 'saberclash'
          | 'superlaser'
          | 'hypertorpedo'
          | 'restart_wave'
          | 'restart_mission'
          | 'breach_explosion'
      ) => void)
    | null
  >(null);

  // Ship Destroyed / Hit callback with dynamic screen projection
  const handleShipDestroyed = useCallback(
    ({
      points,
      screenX,
      screenY,
      shipName,
      isKill,
      isElite,
    }: {
      points: number;
      screenX: number;
      screenY: number;
      shipName: string;
      isKill: boolean;
      isElite?: boolean;
    }) => {
      const now = Date.now();
      setCombatStats((prev) => {
        if (prev.isGameOver) return prev; // Prevent modifications during game over

        const isCombo = now - prev.lastHitTime < 2800;
        const nextCombo = isCombo ? prev.combo + 1 : 1;
        const nextScore = prev.score + points;

        // Power to hit back increases with every hit!
        const powerGain = nextCombo > 2 ? 22 : nextCombo > 1 ? 18 : 14;
        const nextPower = Math.min(100, prev.blasterPower + powerGain);

        // Power tier progression: 1: Twin, 2: Dual Turbolaser, 3: Quad Ion, 4: Max Overdrive
        const nextTier: 1 | 2 | 3 | 4 =
          nextPower >= 100 ? 4 : nextPower >= 66 ? 3 : nextPower >= 33 ? 2 : 1;

        // Shields Siphon: hitting enemy ships restores +10% shields
        const nextShield = Math.min(100, (prev.playerShield ?? 100) + (isKill ? 10 : 5));

        // Elite kill restores 8% core energy!
        const coreGain = isElite ? 8 : 0;
        const nextCore = Math.min(100, (prev.coreEnergy ?? 100) + coreGain);

        // Wave kill tracking
        const nextWaveKills = prev.waveKills + (isKill ? 1 : 0);
        const didWin = nextWaveKills >= prev.waveTarget && !prev.isVictorious;

        if (didWin) {
          neuralAudio.playVictoryFanfare();
        }

        // Combo badge text
        let comboTag: string | undefined = undefined;
        if (nextCombo >= 5) comboTag = `SUPER COMBO x${nextCombo}! 💥`;
        else if (nextCombo >= 3) comboTag = `COMBO x${nextCombo}! 🔥`;
        else if (nextCombo >= 2) comboTag = `COMBO x2! 🔥`;

        const noticeId = Date.now() + Math.random();
        const newNotice: FloatingPointNotice = {
          id: noticeId,
          x: screenX,
          y: screenY,
          text: `+${points}`,
          comboText: comboTag,
          subText: isElite ? '+8% CORE REPAIR! ⚡' : shipName.includes('DEFLECTED') ? 'DEFLECTED! 🛡️' : undefined,
          color:
            isElite
              ? '#fbbf24'
              : nextCombo >= 4
              ? '#ff0055'
              : nextCombo >= 3
              ? '#fb5607'
              : nextCombo >= 2
              ? '#ffbe0b'
              : '#38bdf8',
          createdAt: now,
        };

        setFloatingNotices((list) => [...list.slice(-7), newNotice]);

        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);

        return {
          ...prev,
          score: nextScore,
          destroyedCount: prev.destroyedCount + (isKill ? 1 : 0),
          eliteKills: prev.eliteKills + (isElite ? 1 : 0),
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
          lastHitTime: now,
          shotsHit: prev.shotsHit + 1,
          shotsFired: prev.shotsFired + 1,
          playerShield: nextShield,
          coreEnergy: nextCore,
          blasterPower: nextPower,
          powerTier: nextTier,
          waveKills: nextWaveKills,
          isVictorious: didWin ? true : prev.isVictorious,
        };
      });
    },
    []
  );

  // Player Shield Damaged Callback (Enemy starship fire strikes user's deflector shield)
  const handlePlayerShieldDamaged = useCallback(
    (damage: number, screenX: number, screenY: number) => {
      // Spawn Hexagonal Deflector Shield Ripple
      const impactId = Date.now() + Math.random();
      const newImpact: ShieldImpactNotice = {
        id: impactId,
        x: screenX,
        y: screenY,
        damage,
        angle: Math.random() * 360,
        createdAt: Date.now(),
      };
      setShieldImpacts((prev) => [...prev.slice(-4), newImpact]);
      setTimeout(() => {
        setShieldImpacts((prev) => prev.filter((i) => i.id !== impactId));
      }, 700);

      setCombatStats((prev) => {
        if (prev.isGameOver) return prev;
        const curShield = prev.playerShield ?? 100;
        let nextShield = curShield - damage;

        if (nextShield <= 0) {
          // Emergency Hyperspace Reboot
          neuralAudio.playAlarmWarning();
          nextShield = 100; // Reset shield to full after emergency reboot
        } else if (nextShield < 30) {
          neuralAudio.playAlarmWarning();
        }

        // Taking hits also grants revenge power (+12% power to hit back!)
        const nextPower = Math.min(100, (prev.blasterPower ?? 0) + 12);
        const nextTier: 1 | 2 | 3 | 4 =
          nextPower >= 100 ? 4 : nextPower >= 66 ? 3 : nextPower >= 33 ? 2 : 1;

        return {
          ...prev,
          playerShield: nextShield,
          blasterPower: nextPower,
          powerTier: nextTier,
        };
      });
    },
    []
  );

  // Imperial Core Strike Damage Callback
  // Normal core hits drain 12%, heavy attacks drain 22%
  const handleCoreDamage = useCallback(
    (damage: number, isHeavy: boolean, screenX: number, screenY: number, sourceShipName: string) => {
      setCoreImpactFlash(true);
      setTimeout(() => setCoreImpactFlash(false), 550);

      const noticeId = Date.now() + Math.random();
      const drainNotice: FloatingPointNotice = {
        id: noticeId,
        x: screenX || window.innerWidth / 2,
        y: screenY || window.innerHeight / 2,
        text: isHeavy ? '-22% CORE' : '-12% CORE',
        subText: isHeavy ? 'HEAVY CORE BREACH! 💥' : 'CORE HIT! ⚠️',
        color: '#ef4444',
        createdAt: Date.now(),
      };
      setFloatingNotices((list) => [...list.slice(-7), drainNotice]);
      setTimeout(() => {
        setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
      }, 1400);

      setCombatStats((prev) => {
        // Prevent damage after game over state has been triggered
        if (prev.isGameOver) return prev;

        const curCore = prev.coreEnergy ?? 100;
        const nextCore = Math.max(0, Math.min(100, curCore - damage));

        // When core energy reaches 0%, trigger the game-over state exactly once
        const isFailure = nextCore <= 0;
        if (isFailure && !prev.isGameOver) {
          triggerActionRef.current?.('breach_explosion');
        } else if (nextCore <= 30 && nextCore > 0) {
          neuralAudio.playAlarmWarning();
        }

        // Taking core damage also charges desperate revenge power (+18%)
        const nextPower = Math.min(100, (prev.blasterPower ?? 0) + 18);
        const nextTier: 1 | 2 | 3 | 4 =
          nextPower >= 100 ? 4 : nextPower >= 66 ? 3 : nextPower >= 33 ? 2 : 1;

        return {
          ...prev,
          coreEnergy: nextCore,
          isGameOver: isFailure ? true : prev.isGameOver,
          blasterPower: nextPower,
          powerTier: nextTier,
          activeLockOn: isFailure ? null : prev.activeLockOn,
        };
      });
    },
    []
  );

  // Perfect Deflection Callback (clicking incoming bolts mid-air)
  // Perfect deflections restore +3% core energy, awards points, cancels damage!
  const handleDeflectionSuccess = useCallback(
    (points: number, screenX: number, screenY: number, isCoreStrike: boolean) => {
      const now = Date.now();
      setCombatStats((prev) => {
        if (prev.isGameOver) return prev;

        const isCombo = now - prev.lastHitTime < 2800;
        const nextCombo = isCombo ? prev.combo + 1 : 1;
        const nextScore = prev.score + points;

        // Perfect deflection restores +3% core energy!
        const nextCore = isCoreStrike
          ? Math.min(100, (prev.coreEnergy ?? 100) + 3)
          : (prev.coreEnergy ?? 100);

        const nextPower = Math.min(100, prev.blasterPower + 20);
        const nextTier: 1 | 2 | 3 | 4 =
          nextPower >= 100 ? 4 : nextPower >= 66 ? 3 : nextPower >= 33 ? 2 : 1;

        const noticeId = Date.now() + Math.random();
        const notice: FloatingPointNotice = {
          id: noticeId,
          x: screenX,
          y: screenY,
          text: `+${points}`,
          comboText: isCoreStrike ? 'PERFECT DEFLECT! 🛡️' : 'DEFLECTED! 🛡️',
          subText: isCoreStrike ? '+3% CORE ENERGY! ⚡' : undefined,
          color: isCoreStrike ? '#38bdf8' : '#22c55e',
          createdAt: now,
        };
        setFloatingNotices((list) => [...list.slice(-7), notice]);
        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);

        return {
          ...prev,
          score: nextScore,
          deflections: prev.deflections + (isCoreStrike ? 1 : 0),
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
          lastHitTime: now,
          shotsHit: prev.shotsHit + 1,
          shotsFired: prev.shotsFired + 1,
          coreEnergy: nextCore,
          blasterPower: nextPower,
          powerTier: nextTier,
        };
      });
    },
    []
  );

  // Core Reactor Cell Pickup Collected (+15% Core Energy restore!)
  const handlePickupCollected = useCallback((screenX: number, screenY: number) => {
    const noticeId = Date.now() + Math.random();
    setFloatingNotices((list) => [
      ...list,
      {
        id: noticeId,
        x: screenX,
        y: screenY,
        text: '+15% CORE',
        comboText: 'REACTOR CELL! 🔋',
        color: '#10b981',
        createdAt: Date.now(),
      },
    ]);
    setTimeout(() => {
      setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
    }, 1400);

    setCombatStats((prev) => ({
      ...prev,
      coreEnergy: Math.min(100, (prev.coreEnergy ?? 100) + 15),
    }));
  }, []);

  // Update Lock-On state for 3D tracking reticle & 3-second countdown
  const handleCoreLockOnUpdate = useCallback(
    (
      lockInfo: {
        shipId: string;
        shipName: string;
        enemyType: EnemyShipType;
        timeLeft: number;
        totalTime: number;
        screenX: number;
        screenY: number;
      } | null
    ) => {
      setCombatStats((prev) => ({
        ...prev,
        activeLockOn: lockInfo,
        incomingThreatWarning: !!lockInfo,
      }));
    },
    []
  );

  // Hyper Counter-Strike Torpedo Volley
  const handleUnleashHyperStrike = useCallback(() => {
    triggerActionRef.current?.('hypertorpedo');

    // Reset power meter
    setCombatStats((prev) => ({
      ...prev,
      blasterPower: 0,
      powerTier: 1,
      score: prev.score + 50,
    }));

    // Floating Notice for Hyper Strike
    const noticeId = Date.now() + Math.random();
    setFloatingNotices((list) => [
      ...list,
      {
        id: noticeId,
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.45,
        text: '+50 PROTON STRIKE!',
        comboText: 'MAX OVERDRIVE 🔥',
        color: '#ff0055',
        createdAt: Date.now(),
      },
    ]);
    setTimeout(() => {
      setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
    }, 1500);
  }, []);

  // Advance to Next Sector Wave
  const handleNextWave = useCallback(() => {
    triggerActionRef.current?.('hyperspace');
    setCombatStats((prev) => ({
      ...prev,
      wave: prev.wave + 1,
      waveTarget: prev.waveTarget + 4,
      waveKills: 0,
      isVictorious: false,
      totalWins: (prev.totalWins || 0) + 1,
      playerShield: 100,
      coreEnergy: Math.min(100, (prev.coreEnergy || 100) + 25), // Wave clear reward
      blasterPower: 25,
      powerTier: 1,
      activeLockOn: null,
      incomingThreatWarning: false,
    }));
  }, []);

  // Restart Wave (Reset current wave after game over)
  const handleRestartWave = useCallback(() => {
    triggerActionRef.current?.('restart_wave');
    setCombatStats((prev) => ({
      ...prev,
      coreEnergy: 100,
      playerShield: 100,
      isGameOver: false,
      waveKills: 0,
      isVictorious: false,
      activeLockOn: null,
      incomingThreatWarning: false,
      blasterPower: 0,
      powerTier: 1,
    }));
  }, []);

  // Restart Mission (Reset back to Wave 1 with full clean reset)
  const handleRestartMission = useCallback(() => {
    triggerActionRef.current?.('restart_mission');
    setCombatStats({
      score: 0,
      destroyedCount: 0,
      combo: 0,
      maxCombo: 0,
      lastHitTime: 0,
      accuracy: 100,
      shotsFired: 0,
      shotsHit: 0,
      playerShield: 100,
      blasterPower: 0,
      powerTier: 1,
      wave: 1,
      waveTarget: 6,
      waveKills: 0,
      isVictorious: false,
      totalWins: 0,
      incomingThreatWarning: false,
      coreEnergy: 100,
      isGameOver: false,
      eliteKills: 0,
      deflections: 0,
      activeLockOn: null,
    });
  }, []);

  // Keyboard shortcut: [Space] to fire Hyper Counter-Strike when power is ready
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        combatStats.blasterPower >= 100 &&
        config.combatMode &&
        !combatStats.isGameOver
      ) {
        e.preventDefault();
        handleUnleashHyperStrike();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combatStats.blasterPower, combatStats.isGameOver, config.combatMode, handleUnleashHyperStrike]);

  const handleUpdateConfig = (updates: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleTriggerAction = (
    action:
      | 'shockwave'
      | 'scatter'
      | 'split'
      | 'pulse'
      | 'hyperspace'
      | 'blaster'
      | 'force'
      | 'saberclash'
      | 'superlaser'
      | 'hypertorpedo'
  ) => {
    triggerActionRef.current?.(action);
  };

  const handleNextShape = () => {
    const list = config.starwarsTour
      ? MORPH_SHAPES_LIST.filter((s) => s.category === 'starwars')
      : MORPH_SHAPES_LIST;
    const currentIndex = list.findIndex((s) => s.id === config.currentShape);
    const nextIndex = (currentIndex + 1) % list.length;
    handleUpdateConfig({ currentShape: list[nextIndex].id });
    if (config.starwarsTour) {
      triggerActionRef.current?.('hyperspace');
    }
  };

  // Automatic Shape Morphing / Star Wars Fleet Tour Timer
  useEffect(() => {
    if (!config.autoMorph && !config.starwarsTour) return;

    const timer = setInterval(() => {
      setConfig((prev) => {
        const list = prev.starwarsTour
          ? MORPH_SHAPES_LIST.filter((s) => s.category === 'starwars')
          : MORPH_SHAPES_LIST;
        const currentIndex = list.findIndex((s) => s.id === prev.currentShape);
        const nextIndex = (currentIndex + 1) % list.length;
        if (prev.starwarsTour) {
          triggerActionRef.current?.('hyperspace');
        }
        return {
          ...prev,
          currentShape: list[nextIndex].id,
        };
      });
    }, config.autoMorphInterval * 1000);

    return () => clearInterval(timer);
  }, [config.autoMorph, config.starwarsTour, config.autoMorphInterval]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030307]">
      {/* Three.js 3D Viewport with Two-Way Star Wars Target Combat & Core Strike AI */}
      <NeuralScene
        config={config}
        powerTier={combatStats.powerTier}
        wave={combatStats.wave}
        isGameOver={combatStats.isGameOver}
        onStatsUpdate={setStats}
        onBrainClickTriggered={setLastTriggeredMode}
        onShipDestroyed={handleShipDestroyed}
        onShipLocked={setLockedShipName}
        onPlayerShieldDamaged={handlePlayerShieldDamaged}
        onCoreDamage={handleCoreDamage}
        onCoreLockOnUpdate={handleCoreLockOnUpdate}
        onDeflectionSuccess={handleDeflectionSuccess}
        onPickupCollected={handlePickupCollected}
        triggerActionRef={triggerActionRef}
      />

      {/* Star Wars Arcade Combat HUD, Core Reactor Meter & Mission Failed Overlays */}
      <CombatHud
        combatStats={combatStats}
        floatingNotices={floatingNotices}
        shieldImpacts={shieldImpacts}
        coreImpactFlash={coreImpactFlash}
        lockedShipName={lockedShipName}
        combatMode={config.combatMode}
        autoAimBlaster={config.autoAimBlaster}
        onToggleCombatMode={() => handleUpdateConfig({ combatMode: !config.combatMode })}
        onToggleAutoAim={() => handleUpdateConfig({ autoAimBlaster: !config.autoAimBlaster })}
        onUnleashHyperStrike={handleUnleashHyperStrike}
        onNextWave={handleNextWave}
        onDismissVictory={() => setCombatStats((prev) => ({ ...prev, isVictorious: false }))}
        onRestartWave={handleRestartWave}
        onRestartMission={handleRestartMission}
        onResetScore={() =>
          setCombatStats((prev) => ({
            ...prev,
            score: 0,
            destroyedCount: 0,
            combo: 0,
            maxCombo: 0,
            lastHitTime: 0,
            accuracy: 100,
            shotsFired: 0,
            shotsHit: 0,
            playerShield: 100,
            coreEnergy: 100,
            isGameOver: false,
            blasterPower: 0,
            powerTier: 1,
            wave: 1,
            waveKills: 0,
            isVictorious: false,
            eliteKills: 0,
            deflections: 0,
            activeLockOn: null,
            incomingThreatWarning: false,
          }))
        }
      />

      {/* Astromech Tactical Droid Robotic Guidance & Co-Pilot Instructions */}
      <TacticalDroidGuide
        combatStats={combatStats}
        combatMode={config.combatMode}
      />

      {/* Ergonomic Collapsible HUD Overlay */}
      <ControlOverlay
        config={config}
        onChangeConfig={handleUpdateConfig}
        stats={stats}
        onTriggerAction={handleTriggerAction}
        onNextShape={handleNextShape}
        lastTriggeredMode={lastTriggeredMode}
      />
    </main>
  );
}
