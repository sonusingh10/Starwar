# Configuration & Technical Specifications Guide

This document provides a comprehensive technical reference for all configuration options, game balance parameters, audio node graphs, and rendering settings in the application.

---

## Table of Contents
1. [Simulation & Gameplay Configuration (`SimulationConfig`)](#1-simulation--gameplay-configuration-simulationconfig)
2. [Imperial Core Strike & Combat Balance Parameters](#2-imperial-core-strike--combat-balance-parameters)
3. [Enemy Starfighter AI Profiles](#3-enemy-starfighter-ai-profiles)
4. [Procedural Web Audio Synthesis Specifications](#4-procedural-web-audio-synthesis-specifications)
5. [Three.js Rendering & Post-Processing Pipeline](#5-threejs-rendering--post-processing-pipeline)
6. [3D-to-2D Coordinate Projection Specifications](#6-3d-to-2d-coordinate-projection-specifications)

---

## 1. Simulation & Gameplay Configuration (`SimulationConfig`)

Defined in `src/types.ts` and managed via React state in `src/App.tsx`:

```ts
export interface SimulationConfig {
  clickMode: ClickMode;          // Active mouse interaction mode
  brainwave: BrainwaveState;     // EEG brainwave harmonic ('alpha' | 'beta' | 'theta' | 'gamma' | 'delta')
  theme: ColorThemeId;           // Color palette theme id ('cyberpunk' | 'matrix' | 'hologram' | 'solar' | etc.)
  currentShape: string;          // Active 3D shape target id
  autoMorph: boolean;            // Automatically cycle through shape morphs
  autoMorphInterval: number;     // Shape cycle interval in seconds (default: 8s)
  particleDensity: number;       // Number of instanced nodes (default: 4200)
  triangleScale: number;         // Scale factor for wireframe triangles (default: 1.05)
  rotationSpeed: number;         // Scene rotation velocity (default: 0.8)
  autoRotate: boolean;           // Whether the scene rotates continuously
  wireframeOnly: boolean;        // Wireframe rendering toggle
  soundEnabled: boolean;         // Audio master mute toggle
  showSynapticLines: boolean;    // Neural synaptic connection lines
  splitDistance: number;         // Hemisphere split offset (0.0 to 3.0)
  scatterAmount: number;         // Node dispersion amount (0.0 to 4.0)
  bloomEnabled: boolean;         // UnrealBloomPass post-processing toggle
  bloomIntensity: number;        // Bloom glow intensity (default: 1.6)
  bloomRadius: number;           // Bloom diffusion radius (default: 0.55)
  bloomThreshold: number;        // Luminance threshold for glow (default: 0.18)
  hologramScanlines: boolean;    // Retro CRT hologram scanlines effect
  hyperspaceWarp: boolean;       // Hyperspace star-streak warp speed effect
  hologramProjector: boolean;    // Star Wars base hologram projector cone & emitter
  starwarsTour: boolean;         // Continuous Star Wars fleet tour morph cycle
  sFoilsOpen: boolean;           // S-Foils attack position toggle for X-Wing
  combatMode: boolean;           // Star Wars Dogfight & Target Combat mode
  enemySquadronSize: number;     // Active hostile squadron size (default: 4)
  autoAimBlaster: boolean;       // Proximity auto-targeting assistant on click
}
```

### Key Toggles Explained

- **`combatMode` (`boolean`, default: `true`)**:
  Activates the Star Wars arcade combat loop, spawning Imperial starfighters, enemy blaster fire, Core Reactor lock-on systems, and the combat HUD. When disabled, the application transitions into an anatomical 3D neural mesh explorer.
- **`autoAimBlaster` (`boolean`, default: `true`)**:
  When true, clicking near an enemy ship automatically snaps your blaster cannons to target its hit box, compensating for mouse lead distance.
- **`enemySquadronSize` (`number`, default: `4`)**:
  The count of concurrent Imperial fighters patrolling the sector. Scaled automatically across wave progression.

---

## 2. Imperial Core Strike & Combat Balance Parameters

The Core Strike system balance is strictly calibrated for fair, skill-based gameplay:

| Parameter | Value | Location | Description |
| :--- | :---: | :--- | :--- |
| **Initial Core Energy** | `100%` | `src/App.tsx` | Cockpit Core Reactor starts at full capacity. |
| **Normal Core Hit** | `-12%` | `src/App.tsx:handleCoreDamage` | Damage taken from standard TIE Fighter or Probe Droid core strike. |
| **Heavy Core Hit** | `-22%` | `src/App.tsx:handleCoreDamage` | Damage taken from Elite TIE Advanced core strike. |
| **Perfect Deflection** | `+3%` | `src/App.tsx:handleDeflectionSuccess` | Reward for intercepting an incoming core strike bolt mid-flight. |
| **Elite Kill Reward** | `+8%` | `src/App.tsx:handleShipDestroyed` | Reward for destroying an Elite TIE Advanced x1 starship. |
| **Reactor Pickup Cell** | `+15%` | `src/App.tsx:handlePickupCollected` | Reward for clicking or collecting a drifting Core Reactor canister. |
| **Deflector Shield Absorption** | `8%` | `src/App.tsx:handlePlayerShieldDamaged` | Shields absorb standard non-core blaster fire. |
| **Shield Siphon on Kill** | `+10%` | `src/App.tsx:handleShipDestroyed` | Destroying any enemy ship recharges `+10%` deflector shields. |
| **Critical Core Threshold** | `&le; 30%` | `src/components/CombatHud.tsx` | Activates red pulsing hazard borders and alarms. |
| **Game Over Threshold** | `0%` | `src/App.tsx:handleCoreDamage` | Triggers single-execution reactor breach sequence. |
| **Lock-On Duration** | `3.0s` | `src/geometry/starwarsCombat.ts` | Countdown window before an enemy releases its charged bolt. |
| **Concurrent Locks** | `1` | `src/components/NeuralScene.tsx` | Only 1 enemy locks onto the core at a time to prevent unfair simultaneous hits. |

---

## 3. Enemy Starfighter AI Profiles

Configured in `src/geometry/starwarsCombat.ts`:

### 1. Imperial TIE Fighter (`tie_fighter`)
- **Role**: Standard Imperial patrol starfighter.
- **Attack Cooldown**: `3.6s - 5.4s` (scales down with waves).
- **Targeting Behavior**: `swoop_lock` (sweeping elliptical attack runs).
- **Projectile Velocity**: `24.0` units/sec.
- **Core Damage**: `12%` (Normal).
- **Plasma Bolt Color**: Imperial Crimson (`#ff1e27`).

### 2. TIE Interceptor (`tie_interceptor`)
- **Role**: High-speed, agile interceptor.
- **Attack Cooldown**: `2.6s - 4.0s` (rapid attack rate).
- **Targeting Behavior**: `strafe_snipe` (figure-8 evasive strafing runs).
- **Projectile Velocity**: `30.0` units/sec (fast bolt).
- **Core Damage**: `12%` (Normal).
- **Plasma Bolt Color**: Charged Crimson (`#ff0033`).

### 3. TIE Advanced x1 (`tie_advanced`)
- **Role**: Elite squadron leader (Lord Vader's personal starfighter).
- **Attack Cooldown**: `4.8s - 6.6s` (calculated, heavy barrage).
- **Targeting Behavior**: `heavy_barrage` (command orbit with heavy lock).
- **Projectile Velocity**: `32.0` units/sec.
- **Core Damage**: `22%` (Heavy).
- **Special**: Displays `HEAVY STRIKE 💥` warning; awards `+8%` core restore and guaranteed reactor pickup drop on destruction.

### 4. Viper Probe Droid (`probe_droid`)
- **Role**: Reconnaissance scout.
- **Attack Cooldown**: `3.2s - 4.7s`.
- **Targeting Behavior**: `sensor_probe` (wide orbital tracking).
- **Projectile Velocity**: `28.0` units/sec.
- **Core Damage**: `12%` (Normal).
- **Plasma Bolt Color**: Sensor Scarlet (`#ff2a2a`).

---

## 4. Procedural Web Audio Synthesis Specifications

Located in `src/audio/neuralAudio.ts`, all audio is generated in real-time through Web Audio nodes.

### Sound Effect Schematics

```
1. playLockOnBeep(secondsRemaining: number)
   [Oscillator: Sawtooth] ──> [Gain: 0.22 -> 0.001] ──> Destination
   Pitch scales by time: 3s = 880Hz, 2s = 1080Hz, 1s = 1320Hz. Duration: 0.1s.

2. playCoreStrikeFired()
   [Oscillator: Sawtooth (800Hz -> 90Hz)] 
     ──> [BiquadFilter: Lowpass (3200Hz -> 300Hz)] 
     ──> [Gain: 0.35 -> 0.001] ──> Destination

3. playCoreDamage(isHeavy: boolean)
   Layer A (Sub-bass Shudder):
   [Oscillator: Triangle (160Hz -> 30Hz)] ──> [Gain: 0.35 -> 0.001] ──> Destination
   Layer B (Electrical Spark Discharge):
   [BufferSource: White Noise] 
     ──> [BiquadFilter: Bandpass (2600Hz, Q: 5)] 
     ──> [Gain: 0.25 -> 0.001] ──> Destination

4. playShieldDeflect()
   [Oscillator: Triangle (440Hz -> 880Hz -> 220Hz)] 
     ──> [BiquadFilter: Lowpass (2400Hz -> 600Hz)] 
     ──> [Gain: 0.32 -> 0.001] ──> Destination

5. playPickupCollect()
   Ascending 4-note arpeggio (C5 -> E5 -> G5 -> C6):
   Frequencies: [523.25Hz, 659.25Hz, 783.99Hz, 1046.50Hz]
   Offset: 0.055s interval, Duration: 0.3s per note.
```

---

## 5. Three.js Rendering & Post-Processing Pipeline

Located in `src/components/NeuralScene.tsx`:

### Renderer Configuration
```ts
const renderer = new THREE.WebGLRenderer({
  antialias: false,               // FXAAShader handles anti-aliasing
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
```

### Post-Processing Composer Stack
```ts
const composer = new EffectComposer(renderer);

// 1. Scene Render Pass
composer.addPass(new RenderPass(scene, camera));

// 2. High-Fidelity Unreal Bloom Pass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.6,   // Strength
  0.55,  // Radius
  0.18   // Threshold
);
composer.addPass(bloomPass);

// 3. Fast Approximate Anti-Aliasing (FXAA)
const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);
```

---

## 6. 3D-to-2D Coordinate Projection Specifications

The mathematical projection transforms any 3D coordinate vector in Three.js world space into the 2D CSS pixel coordinate system used by HTML overlay elements:

$$\mathbf{p}_{\text{NDC}} = \mathbf{P}_{\text{proj}} \cdot \mathbf{V}_{\text{view}} \cdot \mathbf{p}_{\text{world}}$$

$$\text{screenX} = \frac{\mathbf{p}_{\text{NDC}}.x + 1}{2} \times \text{viewportWidth}$$

$$\text{screenY} = \frac{-\mathbf{p}_{\text{NDC}}.y + 1}{2} \times \text{viewportHeight}$$

In code (`src/components/NeuralScene.tsx`):
```ts
const proj = targetWorldVector.clone().project(camera);
const screenW = renderer.domElement.clientWidth || window.innerWidth;
const screenH = renderer.domElement.clientHeight || window.innerHeight;
const screenX = ((proj.x + 1) * 0.5) * screenW;
const screenY = ((-proj.y + 1) * 0.5) * screenH;
```

This guarantees zero-latency, sub-pixel visual alignment between Three.js 3D projectiles and the 2D React HUD overlays.
