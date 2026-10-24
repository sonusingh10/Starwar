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
  PlayerPowerType,
  ShieldImpactNotice,
  SimulationConfig,
} from './types';
import { MORPH_SHAPES_LIST } from './geometry/morphShapes';
import { neuralAudio } from './audio/neuralAudio';

export default function App() {
  const defaultPilot = typeof window !== 'undefined'
    ? localStorage.getItem('space_tour_pilot_name') || 'Commander Sonu'
    : 'Commander Sonu';

  const [config, setConfig] = useState<SimulationConfig>({
    clickMode: 'shockwave',
    brainwave: 'alpha',
    theme: 'layer7x', // 7LayerX Tactical visual identity
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
    pilotName: defaultPilot,
    activePlayerPower: 'flame',
    sFoilsOpen: true,
    combatMode: true,           // Star Wars Dogfight Combat Active by default!
    enemySquadronSize: 4,
    autoAimBlaster: true,       // Auto-aim on click to easily destroy ships
    brainwavesEnabled: true,    // Neural brainwave oscillations enabled by default
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
    pilotName: defaultPilot,
    missionTimeRemaining: 120, // 120s extended mission chronometer
    missionTotalTime: 120,
    difficultyLevel: 1,
    activePlayerPower: 'flame',
    powersUnlocked: ['flame', 'warp', 'torpedo'],
    thermalBurnActive: false,
    thermalBurnRemaining: 0,
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
    // Proton Torpedo Ordnance Balance (No unlimited spam / prevents automatic win)
    torpedoAmmo: 2,
    maxTorpedoAmmo: 2,
    torpedoCooldown: 0,
    // Death Star Superweapon System
    deathStarCharge: 0,
    deathStarCharged: false,
    deathStarCharging: false,
    deathStarStrikesUsed: 0,
    activeLockOn: null,
  });

  const [floatingNotices, setFloatingNotices] = useState<FloatingPointNotice[]>([]);
  const [shieldImpacts, setShieldImpacts] = useState<ShieldImpactNotice[]>([]);
  const [coreImpactFlash, setCoreImpactFlash] = useState<boolean>(false);
  const [lockedShipName, setLockedShipName] = useState<string | null>(null);
  const [isPilotModalOpen, setIsPilotModalOpen] = useState<boolean>(false);

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
          | 'deathstar_superweapon'
          | 'restart_wave'
          | 'restart_mission'
          | 'breach_explosion'
          | 'power_flame'
          | 'power_emp'
          | 'power_reflector'
          | 'power_warp'
          | 'power_torpedo'
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
            isElite || nextCombo >= 3
              ? '#d2f27c'
              : nextCombo >= 2
              ? '#a3e635'
              : '#eef2ef',
          createdAt: now,
        };

        setFloatingNotices((list) => [...list.slice(-7), newNotice]);

        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);

        // Death Star Superweapon orbital capacitor charge (+15% normal, +30% elite kill)
        const superGain = isElite ? 30 : 15;
        const nextDeathStarCharge = Math.min(100, (prev.deathStarCharge ?? 0) + superGain);
        const nextDeathStarCharged = nextDeathStarCharge >= 100;

        // Balanced Proton Torpedo Ordnance restock: +1 Torpedo on 5x/8x combo streak or Elite kill (capped at maxTorpedoAmmo)
        let earnedTorpedo = false;
        let nextAmmo = prev.torpedoAmmo ?? 2;
        if ((isElite || nextCombo === 5 || nextCombo === 8) && nextAmmo < (prev.maxTorpedoAmmo ?? 2)) {
          nextAmmo += 1;
          earnedTorpedo = true;
        }

        if (earnedTorpedo) {
          neuralAudio.playPickupCollect();
          const ammoNoticeId = Date.now() + Math.random() + 1;
          const ammoNotice: FloatingPointNotice = {
            id: ammoNoticeId,
            x: screenX,
            y: screenY - 32,
            text: '+1 TORPEDO RESTOCKED! 🚀',
            subText: `ORDNANCE: ${nextAmmo}/${prev.maxTorpedoAmmo ?? 2}`,
            color: '#d2f27c',
            createdAt: now,
          };
          setFloatingNotices((list) => [...list.slice(-7), ammoNotice]);
          setTimeout(() => {
            setFloatingNotices((list) => list.filter((n) => n.id !== ammoNoticeId));
          }, 1400);
        }

        if (nextDeathStarCharged && !prev.deathStarCharged) {
          neuralAudio.playPointScore(4);
          const superNoticeId = Date.now() + Math.random() + 2;
          const superNotice: FloatingPointNotice = {
            id: superNoticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.35,
            text: 'SUPERWEAPON PRIMED! 🟢',
            subText: 'PRESS [D] OR CLICK FIRE SUPERLASER',
            color: '#10b981',
            createdAt: now,
          };
          setFloatingNotices((list) => [...list.slice(-7), superNotice]);
          setTimeout(() => {
            setFloatingNotices((list) => list.filter((n) => n.id !== superNoticeId));
          }, 1600);
        }

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
          torpedoAmmo: nextAmmo,
          deathStarCharge: nextDeathStarCharge,
          deathStarCharged: nextDeathStarCharged,
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
          color: '#d2f27c',
          createdAt: now,
        };
        setFloatingNotices((list) => [...list.slice(-7), notice]);
        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);

        // Deflections also grant +10% orbital capacitor charge to Death Star superweapon
        const nextDeathStarCharge = Math.min(100, (prev.deathStarCharge ?? 0) + 10);
        const nextDeathStarCharged = nextDeathStarCharge >= 100;

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
          deathStarCharge: nextDeathStarCharge,
          deathStarCharged: nextDeathStarCharged,
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

  // Balanced Hyper Counter-Strike Torpedo Volley (Space)
  // Protected against infinite spam so player does not automatically win
  const handleUnleashHyperStrike = useCallback(() => {
    let canFire = false;
    let firedRemainingAmmo = 0;

    setCombatStats((prev) => {
      if (prev.isGameOver) return prev;

      const currentAmmo = prev.torpedoAmmo ?? 2;
      const cooldown = prev.torpedoCooldown ?? 0;
      const isPowerFull = (prev.blasterPower ?? 0) >= 100;

      // 1. Check Ordnance Ammunition
      if (currentAmmo <= 0) {
        neuralAudio.playAlarmWarning();
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.45,
            text: 'ORDNANCE EMPTY (0/2)',
            subText: 'BUILD 5x COMBO OR DEFEAT ELITE TIE TO RELOAD ⚠️',
            color: '#f87171',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1400);
        return prev;
      }

      // 2. Check Reload Cooldown
      if (cooldown > 0) {
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.45,
            text: 'TORPEDO TUBES COOLING',
            subText: `${cooldown.toFixed(1)}s RELOAD REMAINING`,
            color: '#98a5a2',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);
        return prev;
      }

      // 3. Check Overdrive Power (100% required)
      if (!isPowerFull) {
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.45,
            text: 'OVERDRIVE REQUIRED (100%)',
            subText: `${Math.round(prev.blasterPower ?? 0)}% CHARGED`,
            color: '#98a5a2',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => {
          setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
        }, 1200);
        return prev;
      }

      // All requirements met: fire volley and deduct 1 ammo with 12s tactical cooldown
      canFire = true;
      firedRemainingAmmo = currentAmmo - 1;
      return {
        ...prev,
        torpedoAmmo: firedRemainingAmmo,
        torpedoCooldown: 12.0, // 12 second tactical reload cooldown
        blasterPower: 0,
        powerTier: 1,
        score: prev.score + 50,
      };
    });

    if (canFire) {
      triggerActionRef.current?.('hypertorpedo');
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.45,
          text: '+50 PROTON TORPEDO VOLLEY!',
          comboText: 'MAX OVERDRIVE 🔥',
          subText: `ORDNANCE: ${firedRemainingAmmo}/2 (12s RELOAD)`,
          color: '#d2f27c',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => {
        setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
      }, 1500);
    }
  }, []);

  // Death Star Orbital Superlaser Superweapon Strike
  const handleFireDeathStarSuperweapon = useCallback(() => {
    let fired = false;
    setCombatStats((prev) => {
      if (prev.isGameOver || (prev.deathStarCharge ?? 0) < 100) return prev;
      fired = true;
      return {
        ...prev,
        deathStarCharge: 0,
        deathStarCharged: false,
        deathStarStrikesUsed: (prev.deathStarStrikesUsed || 0) + 1,
        score: prev.score + 150,
      };
    });

    if (fired) {
      triggerActionRef.current?.('deathstar_superweapon');
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          text: '+150 SUPERLASER STRIKE!',
          comboText: 'DEATH STAR SUPERWEAPON 🟢',
          subText: 'ORBITAL CAPACITOR DISCHARGED',
          color: '#10b981',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => {
        setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
      }, 1800);
    }
  }, []);

  // Instant Fire Special Armaments Callback (Warp, Saber, Superlaser, Scatter)
  const handleInstantFire = useCallback((type: 'warp' | 'saber' | 'superlaser' | 'scatter') => {
    if (type === 'warp') {
      triggerActionRef.current?.('hyperspace');
      neuralAudio.playHyperspace();
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          text: 'HYPERSPACE WARP SURGE!',
          comboText: 'WARP DASH 🚀',
          subText: 'LIGHTSPEED SHOCKWAVE DISCHARGED',
          color: '#38bdf8',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1200);
    } else if (type === 'saber') {
      triggerActionRef.current?.('saberclash');
      neuralAudio.playSaberClash();
      // Saber deflection restores +6% shield and +3% core
      setCombatStats((prev) => ({
        ...prev,
        playerShield: Math.min(100, (prev.playerShield ?? 100) + 6),
        coreEnergy: Math.min(100, (prev.coreEnergy ?? 100) + 3),
        deflections: prev.deflections + 1,
      }));
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          text: 'LIGHTSABER CLASH DEFLECTION!',
          comboText: 'DEFLECTION BLADE ⚔️',
          subText: '+6% SHIELD RECHARGE // SHOCK DEFLECT',
          color: '#f43f5e',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1200);
    } else if (type === 'superlaser') {
      triggerActionRef.current?.('superlaser');
      neuralAudio.playSuperlaser();
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          text: 'SUPERLASER MEGA BEAM FIRED!',
          comboText: 'DEATH STAR EMERALD BLAST 🟢',
          subText: 'CONVERGING AXIAL OBLITERATION',
          color: '#10b981',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1400);
    } else if (type === 'scatter') {
      triggerActionRef.current?.('scatter');
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          text: 'QUANTUM SCATTER SHOCKWAVE!',
          comboText: 'RADIAL KINETIC DISPLACEMENT 💥',
          subText: 'INSTANT REASSEMBLY CHARGED',
          color: '#c084fc',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1200);
    }
  }, []);

  // Brainwaves Dynamic Neural Frequency Toggle
  const handleToggleBrainwaves = useCallback(() => {
    setConfig((prev) => {
      const nextVal = !prev.brainwavesEnabled;
      const noticeId = Date.now() + Math.random();
      setFloatingNotices((list) => [
        ...list,
        {
          id: noticeId,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.28,
          text: nextVal ? 'BRAINWAVES: ON' : 'BRAINWAVES: OFF',
          subText: nextVal
            ? 'NEURAL RESONANCE & ALPHA/BETA/GAMMA PULSES ACTIVE'
            : 'NEURAL OSCILLATIONS PAUSED / STABILIZED',
          color: nextVal ? '#d2f27c' : '#98a5a2',
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1400);
      return { ...prev, brainwavesEnabled: nextVal };
    });
  }, []);

  // Dynamic Enemy AI Aggression Level change handler
  const handleAggressionChange = useCallback((level: 'NORMAL' | 'ELEVATED' | 'OVERCHARGED') => {
    setCombatStats((prev) => {
      if (prev.enemyAggressionLevel === level) return prev;
      return {
        ...prev,
        enemyAggressionLevel: level,
      };
    });
  }, []);

  // Cooldown countdown timer for Proton Torpedo reload
  useEffect(() => {
    const timer = setInterval(() => {
      setCombatStats((prev) => {
        if ((prev.torpedoCooldown ?? 0) > 0) {
          return {
            ...prev,
            torpedoCooldown: Math.max(0, (prev.torpedoCooldown ?? 0) - 0.2),
          };
        }
        return prev;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Extended Mission Chronometer & Thermal Burn Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCombatStats((prev) => {
        if (!config.combatMode || prev.isGameOver || prev.isVictorious) return prev;

        // Decrement mission chronometer
        const nextTime = Math.max(0, (prev.missionTimeRemaining ?? 120) - 1);
        if (nextTime === 0 && (prev.missionTimeRemaining ?? 120) > 0) {
          neuralAudio.playAlarmWarning();
        }

        // Decrement cockpit thermal burn
        let burnActive = prev.thermalBurnActive ?? false;
        let burnRemaining = prev.thermalBurnRemaining ?? 0;
        if (burnActive) {
          burnRemaining = Math.max(0, burnRemaining - 1);
          if (burnRemaining <= 0) {
            burnActive = false;
          }
        }

        return {
          ...prev,
          missionTimeRemaining: nextTime,
          thermalBurnActive: burnActive,
          thermalBurnRemaining: burnRemaining,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.combatMode]);

  // Tactical Power Activation Handlers
  const handleTriggerPower = useCallback(
    (power: PlayerPowerType) => {
      if (power === 'flame') {
        triggerActionRef.current?.('power_flame' as any);
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.36,
            text: 'THERMAL FLAME CANNONS! 🔥',
            comboText: 'INCENDIARY INFERNO BARRAGE',
            subText: 'QUAD BLAZING PLASMA STREAMS',
            color: '#ff6d00',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1400);
      } else if (power === 'emp') {
        triggerActionRef.current?.('power_emp' as any);
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.36,
            text: 'ION EMP PULSE DETONATED! ⚡',
            comboText: 'ENEMY WEAPONS FROZEN (4.0s)',
            subText: 'ALL HOSTILE FIRE SUPPRESSED',
            color: '#00f0ff',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1500);
      } else if (power === 'reflector') {
        triggerActionRef.current?.('power_reflector' as any);
        const noticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: noticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.36,
            text: 'PLASMA MIRROR DEFLECTOR! 🛡️',
            comboText: 'REFLECTING ENEMY BOLTS (3.5s)',
            subText: 'ENEMY FIRE WILL BOUNCE BACK',
            color: '#38bdf8',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== noticeId)), 1500);
      } else if (power === 'warp') {
        handleInstantFire('warp');
      } else if (power === 'torpedo') {
        handleUnleashHyperStrike();
      } else if (power === 'superlaser') {
        handleInstantFire('superlaser');
      }
    },
    [handleInstantFire, handleUnleashHyperStrike]
  );

  const handleSelectPower = useCallback((power: PlayerPowerType) => {
    setCombatStats((prev) => ({ ...prev, activePlayerPower: power }));
    setConfig((prev) => ({ ...prev, activePlayerPower: power }));
  }, []);

  const handleThermalBurnTriggered = useCallback((duration: number) => {
    setCombatStats((prev) => ({
      ...prev,
      thermalBurnActive: true,
      thermalBurnRemaining: duration,
    }));
  }, []);

  const handleEditPilotName = useCallback(() => {
    setIsPilotModalOpen(true);
  }, []);

  // Advance to Next Sector Wave with Escalating Difficulty & New Powers
  const handleNextWave = useCallback(() => {
    triggerActionRef.current?.('hyperspace');
    setCombatStats((prev) => {
      const nextWave = prev.wave + 1;
      const nextPowers = [...(prev.powersUnlocked || ['flame', 'warp', 'torpedo'])];
      let newPowerUnlockedTitle: string | null = null;

      if (nextWave >= 2 && !nextPowers.includes('emp')) {
        nextPowers.push('emp');
        newPowerUnlockedTitle = 'ION EMP PULSE UNLOCKED! ⚡';
      }
      if (nextWave >= 3 && !nextPowers.includes('reflector')) {
        nextPowers.push('reflector');
        newPowerUnlockedTitle = 'PLASMA MIRROR DEFLECTOR UNLOCKED! 🛡️';
      }
      if (nextWave >= 4 && !nextPowers.includes('superlaser')) {
        nextPowers.push('superlaser');
        newPowerUnlockedTitle = 'DEATH STAR SUPERLASER UNLOCKED! 🟢';
      }

      if (newPowerUnlockedTitle) {
        neuralAudio.playPowerUnlocked();
        const pNoticeId = Date.now() + Math.random();
        setFloatingNotices((list) => [
          ...list,
          {
            id: pNoticeId,
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.38,
            text: newPowerUnlockedTitle,
            comboText: 'TACTICAL POWER ARSENAL EXPANDED',
            subText: 'USE HOTKEYS [1-6] OR POWER DOCK',
            color: '#d2f27c',
            createdAt: Date.now(),
          },
        ]);
        setTimeout(() => setFloatingNotices((list) => list.filter((n) => n.id !== pNoticeId)), 2500);
      }

      return {
        ...prev,
        wave: nextWave,
        waveTarget: prev.waveTarget + 4,
        waveKills: 0,
        isVictorious: false,
        totalWins: (prev.totalWins || 0) + 1,
        missionTimeRemaining: 120, // Reset extended mission timer for each sector
        missionTotalTime: 120,
        difficultyLevel: (prev.difficultyLevel || 1) + 1,
        powersUnlocked: nextPowers,
        thermalBurnActive: false,
        thermalBurnRemaining: 0,
        playerShield: 100,
        coreEnergy: Math.min(100, (prev.coreEnergy || 100) + 25), // Wave clear reward
        blasterPower: 25,
        powerTier: 1,
        torpedoAmmo: prev.maxTorpedoAmmo || 2, // Full torpedo ammo replenish
        torpedoCooldown: 0,
        deathStarCharge: Math.min(100, (prev.deathStarCharge || 0) + 25), // Wave clear superweapon reward
        activeLockOn: null,
        incomingThreatWarning: false,
      };
    });
  }, []);

  // Restart Wave (Reset current wave after game over)
  const handleRestartWave = useCallback(() => {
    triggerActionRef.current?.('restart_wave');
    setCombatStats((prev) => ({
      ...prev,
      coreEnergy: 100,
      playerShield: 100,
      missionTimeRemaining: 120,
      thermalBurnActive: false,
      thermalBurnRemaining: 0,
      isGameOver: false,
      waveKills: 0,
      isVictorious: false,
      activeLockOn: null,
      incomingThreatWarning: false,
      blasterPower: 0,
      powerTier: 1,
      torpedoAmmo: 2,
      torpedoCooldown: 0,
      deathStarCharge: 0,
      deathStarCharged: false,
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
      pilotName: defaultPilot,
      missionTimeRemaining: 120,
      missionTotalTime: 120,
      difficultyLevel: 1,
      activePlayerPower: 'flame',
      powersUnlocked: ['flame', 'warp', 'torpedo'],
      thermalBurnActive: false,
      thermalBurnRemaining: 0,
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
      torpedoAmmo: 2,
      maxTorpedoAmmo: 2,
      torpedoCooldown: 0,
      deathStarCharge: 0,
      deathStarCharged: false,
      deathStarCharging: false,
      deathStarStrikesUsed: 0,
      activeLockOn: null,
    });
  }, [defaultPilot]);

  // Keyboard shortcut listener:
  // [Digit1-6]: Select & Trigger Tactical Powers (Flame, EMP, Reflector, Warp, Torpedo, Superlaser)
  // [Space]: Fire Proton Torpedo Volley when Overdrive & Ammo are ready
  // [KeyD]: Fire Death Star Superweapon (or Instant Superlaser)
  // [KeyW]: Instant Hyperspace Warp
  // [KeyC]: Instant Lightsaber Clash Deflection
  // [KeyX]: Instant Superlaser
  // [KeyR]: Instant Quantum Scatter
  // [KeyB]: Toggle Brainwaves ON / OFF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!config.combatMode || combatStats.isGameOver) return;

      // Spacebar for Proton Torpedo Volley
      if (e.code === 'Space') {
        e.preventDefault();
        handleUnleashHyperStrike();
      }

      // [1-6] Tactical Powers
      if (e.code === 'Digit1') {
        e.preventDefault();
        handleTriggerPower('flame');
      }
      if (e.code === 'Digit2') {
        e.preventDefault();
        if (combatStats.powersUnlocked?.includes('emp')) {
          handleTriggerPower('emp');
        }
      }
      if (e.code === 'Digit3') {
        e.preventDefault();
        if (combatStats.powersUnlocked?.includes('reflector')) {
          handleTriggerPower('reflector');
        }
      }
      if (e.code === 'Digit4') {
        e.preventDefault();
        handleTriggerPower('warp');
      }
      if (e.code === 'Digit5') {
        e.preventDefault();
        handleTriggerPower('torpedo');
      }
      if (e.code === 'Digit6') {
        e.preventDefault();
        if (combatStats.powersUnlocked?.includes('superlaser')) {
          handleTriggerPower('superlaser');
        }
      }

      // KeyD for Death Star Superlaser
      if (e.code === 'KeyD') {
        e.preventDefault();
        if ((combatStats.deathStarCharge ?? 0) >= 100) {
          handleFireDeathStarSuperweapon();
        } else {
          handleInstantFire('superlaser');
        }
      }

      // KeyW for Instant Warp Dash
      if (e.code === 'KeyW') {
        e.preventDefault();
        handleInstantFire('warp');
      }

      // KeyC for Instant Lightsaber Clash Deflection
      if (e.code === 'KeyC') {
        e.preventDefault();
        handleInstantFire('saber');
      }

      // KeyX for Instant Superlaser
      if (e.code === 'KeyX') {
        e.preventDefault();
        handleInstantFire('superlaser');
      }

      // KeyR for Instant Scatter
      if (e.code === 'KeyR') {
        e.preventDefault();
        handleInstantFire('scatter');
      }

      // KeyB for Toggle Brainwaves
      if (e.code === 'KeyB') {
        e.preventDefault();
        handleToggleBrainwaves();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    combatStats.deathStarCharge,
    combatStats.isGameOver,
    combatStats.powersUnlocked,
    config.combatMode,
    handleUnleashHyperStrike,
    handleFireDeathStarSuperweapon,
    handleInstantFire,
    handleTriggerPower,
    handleToggleBrainwaves,
  ]);

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
    <main className="relative w-screen h-screen overflow-hidden bg-[#080b0c] text-[#eef2ef] font-sans antialiased">
      {/* 7LayerX subtle low-contrast green and teal ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/[0.04] blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-emerald-500/[0.035] blur-[140px]" />
        <div className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[#d2f27c]/[0.015] blur-[160px]" />
      </div>
      {/* Three.js 3D Viewport with Two-Way Star Wars Target Combat & Core Strike AI */}
      <NeuralScene
        config={config}
        powerTier={combatStats.powerTier}
        wave={combatStats.wave}
        combo={combatStats.combo}
        destroyedCount={combatStats.destroyedCount}
        playerShield={combatStats.playerShield}
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
        onAggressionChange={handleAggressionChange}
        onThermalBurnTriggered={handleThermalBurnTriggered}
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
        brainwavesEnabled={config.brainwavesEnabled}
        onToggleBrainwaves={handleToggleBrainwaves}
        onInstantFire={handleInstantFire}
        onTriggerPower={handleTriggerPower}
        onSelectPower={handleSelectPower}
        onEditPilotName={handleEditPilotName}
        onToggleCombatMode={() => handleUpdateConfig({ combatMode: !config.combatMode })}
        onToggleAutoAim={() => handleUpdateConfig({ autoAimBlaster: !config.autoAimBlaster })}
        onUnleashHyperStrike={handleUnleashHyperStrike}
        onFireDeathStarSuperweapon={handleFireDeathStarSuperweapon}
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
        isPilotModalOpen={isPilotModalOpen}
        onTogglePilotModal={setIsPilotModalOpen}
      />
    </main>
  );
}
