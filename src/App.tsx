import React, { useState, useRef, useEffect } from 'react';
import { NeuralScene } from './components/NeuralScene';
import { ControlOverlay } from './components/ControlOverlay';
import { CombatHud } from './components/CombatHud';
import { ClickMode, CombatStats, FloatingPointNotice, SimulationConfig } from './types';
import { MORPH_SHAPES_LIST } from './geometry/morphShapes';

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

  // Star Wars Combat Arcade State
  const [combatStats, setCombatStats] = useState<CombatStats>({
    score: 0,
    destroyedCount: 0,
    combo: 0,
    maxCombo: 0,
    lastHitTime: 0,
    accuracy: 100,
    shotsFired: 0,
    shotsHit: 0,
  });
  const [floatingNotices, setFloatingNotices] = useState<FloatingPointNotice[]>([]);
  const [lockedShipName, setLockedShipName] = useState<string | null>(null);

  const handleShipDestroyed = ({
    points,
    screenX,
    screenY,
    shipName,
  }: {
    points: number;
    screenX: number;
    screenY: number;
    shipName: string;
    isKill: boolean;
  }) => {
    const now = Date.now();
    setCombatStats((prev) => {
      const isCombo = now - prev.lastHitTime < 2800;
      const nextCombo = isCombo ? prev.combo + 1 : 1;
      const nextScore = prev.score + points;

      const noticeId = Date.now() + Math.random();
      const newNotice: FloatingPointNotice = {
        id: noticeId,
        x: screenX,
        y: screenY,
        text: `+${points}`,
        comboText: nextCombo > 1 ? `COMBO x${nextCombo} 🔥` : undefined,
        color: nextCombo > 2 ? '#ff0055' : nextCombo > 1 ? '#ffbe0b' : '#38bdf8',
        createdAt: now,
      };

      setFloatingNotices((list) => [...list.slice(-7), newNotice]);

      setTimeout(() => {
        setFloatingNotices((list) => list.filter((n) => n.id !== noticeId));
      }, 1200);

      return {
        ...prev,
        score: nextScore,
        destroyedCount: prev.destroyedCount + 1,
        combo: nextCombo,
        maxCombo: Math.max(prev.maxCombo, nextCombo),
        lastHitTime: now,
        shotsHit: prev.shotsHit + 1,
        shotsFired: prev.shotsFired + 1,
      };
    });
  };

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
      ) => void)
    | null
  >(null);

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
      {/* Three.js 3D Viewport with Star Wars Target Ships */}
      <NeuralScene
        config={config}
        onStatsUpdate={setStats}
        onBrainClickTriggered={setLastTriggeredMode}
        onShipDestroyed={handleShipDestroyed}
        onShipLocked={setLockedShipName}
        triggerActionRef={triggerActionRef}
      />

      {/* Star Wars Arcade Combat HUD & Floating +1 Score Indicators */}
      <CombatHud
        combatStats={combatStats}
        floatingNotices={floatingNotices}
        lockedShipName={lockedShipName}
        combatMode={config.combatMode}
        autoAimBlaster={config.autoAimBlaster}
        onToggleCombatMode={() => handleUpdateConfig({ combatMode: !config.combatMode })}
        onToggleAutoAim={() => handleUpdateConfig({ autoAimBlaster: !config.autoAimBlaster })}
        onResetScore={() =>
          setCombatStats({
            score: 0,
            destroyedCount: 0,
            combo: 0,
            maxCombo: 0,
            lastHitTime: 0,
            accuracy: 100,
            shotsFired: 0,
            shotsHit: 0,
          })
        }
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
