export type ClickMode =
  | 'shockwave'
  | 'scatter'
  | 'split'
  | 'vortex'
  | 'pulse'
  | 'blaster'
  | 'force'
  | 'hyperspace'
  | 'saberclash';

export type BrainwaveFrequency = 'gamma' | 'beta' | 'alpha' | 'theta';

export type ColorThemeId = 'cyberpunk' | 'solarGold' | 'amethyst' | 'matrix' | 'iceQuantum';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  baseColor: string;      // Lower rim / temporal & stem
  midColor: string;       // Mid gyri / lateral
  highColor: string;      // Upper parietal & frontal
  coreColor: string;      // Deep white / highlight
  ambientColor: string;
}

export type MorphShapeId =
  | 'brain'
  | 'dna'
  | 'heart'
  | 'galaxy'
  | 'torus'
  | 'sphere'
  | 'skull'
  | 'xwing'
  | 'falcon'
  | 'tiefighter'
  | 'deathstar'
  | 'stardestroyer'
  | 'atat'
  | 'vader'
  | 'lightsaber';

export interface MorphShapeInfo {
  id: MorphShapeId;
  name: string;
  subtitle: string;
  description: string;
  category: 'starwars' | 'neural' | 'cosmic';
}

export interface SimulationConfig {
  clickMode: ClickMode;
  brainwave: BrainwaveFrequency;
  theme: ColorThemeId;
  currentShape: MorphShapeId;
  autoMorph: boolean;
  autoMorphInterval: number;     // seconds, e.g. 8
  particleDensity: number;       // e.g. 3500 - 5500
  triangleScale: number;         // 0.8 to 2.0
  rotationSpeed: number;         // 0 to 2.0
  autoRotate: boolean;
  wireframeOnly: boolean;
  soundEnabled: boolean;
  showSynapticLines: boolean;
  splitDistance: number;         // 0 to 1
  scatterAmount: number;         // 0 to 1
  bloomEnabled: boolean;
  bloomIntensity: number;        // 0 to 3.0
  bloomRadius: number;           // 0.1 to 1.5
  bloomThreshold: number;        // 0.0 to 1.0
  hologramScanlines: boolean;
  hyperspaceWarp: boolean;
  hologramProjector: boolean;
  starwarsTour: boolean;
  sFoilsOpen: boolean;
  combatMode: boolean;           // Star Wars Dogfight / Enemy Ship Target Mode
  enemySquadronSize: number;     // Number of active enemy ships (e.g. 3-6)
  autoAimBlaster: boolean;       // Auto-aim blaster fire at nearest enemy on click
}

export type EnemyShipType = 'tie_interceptor' | 'tie_fighter' | 'probe_droid' | 'tie_advanced';

export interface CombatStats {
  score: number;
  destroyedCount: number;
  combo: number;
  maxCombo: number;
  lastHitTime: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  // Two-Sided Dogfight & Power System
  playerShield: number;          // 0 to 100%
  blasterPower: number;          // 0 to 100% power gauge to hit back
  powerTier: 1 | 2 | 3 | 4;      // 1: Twin Blaster, 2: Dual Turbolaser, 3: Quad Ion, 4: Hyper Proton Strike
  wave: number;                  // Current combat sector wave (1, 2, 3...)
  waveTarget: number;            // Kills required to win current wave (e.g. 6, 10, 15)
  waveKills: number;             // Kills in current wave
  isVictorious: boolean;         // Trigger victory celebration when wave cleared
  totalWins: number;             // Total sectors won
  incomingThreatWarning: boolean;// Active when enemy is locked onto cockpit
}

export interface FloatingPointNotice {
  id: number;
  x: number;
  y: number;
  text: string;
  comboText?: string;
  subText?: string;
  color: string;
  createdAt: number;
  isSpecial?: boolean;
}

export interface ShieldImpactNotice {
  id: number;
  x: number;
  y: number;
  damage: number;
  angle: number;
  createdAt: number;
}

export interface Shockwave {
  id: number;
  epicenter: { x: number; y: number; z: number };
  startTime: number;
  speed: number;
  strength: number;
  radius: number;
  maxRadius: number;
  duration: number;
}

export interface BrainNode {
  index: number;
  // Base anatomical position (resting state)
  baseX: number;
  baseY: number;
  baseZ: number;
  
  // Current dynamic position
  x: number;
  y: number;
  z: number;
  
  // Dynamic velocities for physics/springs
  vx: number;
  vy: number;
  vz: number;
  
  // Anatomical attributes
  hemisphere: 'left' | 'right';
  lobe: 'frontal' | 'parietal' | 'occipital' | 'temporal' | 'cerebellum' | 'stem';
  normalX: number;
  normalY: number;
  normalZ: number;
  
  // Visual properties
  scale: number;
  baseScale: number;
  colorR: number;
  colorG: number;
  colorB: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeed: number;
  
  // Scatter target offset
  scatterOffsetX: number;
  scatterOffsetY: number;
  scatterOffsetZ: number;
  
  // Pulse charge (0 to 1)
  charge: number;
}
