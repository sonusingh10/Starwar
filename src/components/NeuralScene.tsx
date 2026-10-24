import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { BrainNode, ClickMode, ColorThemeId, EnemyShipType, Shockwave, SimulationConfig } from '../types';
import { generateBrainNodes, COLOR_THEMES } from '../geometry/brainGenerator';
import { calculateShapeTargets } from '../geometry/morphShapes';
import { createHollowTriangleGeometry, createTetrahedronFrameGeometry } from '../geometry/triangleGeometry';
import { neuralAudio } from '../audio/neuralAudio';
import {
  createEnemySquadron,
  createExplosionDebris,
  createProtonTorpedoVolley,
  createReactorPickup,
  createCoreHitSparks,
  createFireSparks,
  calculateEnemyAggression,
  EnemyAggressionLevel,
  ActivePickup,
  CombatShip,
  EnemyBlasterBolt,
  ProtonTorpedo,
  EnemyMissile,
  createEnemyMissile,
  ExplosionParticle,
} from '../geometry/starwarsCombat';

interface NeuralSceneProps {
  config: SimulationConfig;
  powerTier?: 1 | 2 | 3 | 4;
  wave?: number;
  combo?: number;
  destroyedCount?: number;
  playerShield?: number;
  isGameOver?: boolean;
  onStatsUpdate?: (stats: { count: number; fps: number; activeShockwaves: number }) => void;
  onBrainClickTriggered?: (mode: ClickMode) => void;
  onShipDestroyed?: (info: {
    points: number;
    screenX: number;
    screenY: number;
    shipName: string;
    isKill: boolean;
    isElite?: boolean;
  }) => void;
  onShipLocked?: (shipName: string | null) => void;
  onPlayerShieldDamaged?: (damage: number, screenX: number, screenY: number) => void;
  onCoreDamage?: (damage: number, isHeavy: boolean, screenX: number, screenY: number, sourceShipName: string) => void;
  onCoreLockOnUpdate?: (lockInfo: {
    shipId: string;
    shipName: string;
    enemyType: EnemyShipType;
    timeLeft: number;
    totalTime: number;
    screenX: number;
    screenY: number;
  } | null) => void;
  onDeflectionSuccess?: (points: number, screenX: number, screenY: number, isCoreStrike: boolean) => void;
  onPickupCollected?: (screenX: number, screenY: number) => void;
  onAggressionChange?: (level: EnemyAggressionLevel) => void;
  onThermalBurnTriggered?: (duration: number) => void;
  onMissileWarningUpdate?: (
    warning: {
      missileId: number;
      distance: number;
      screenX: number;
      screenY: number;
      sourceShipName: string;
      isHeavy: boolean;
    } | null,
    count: number
  ) => void;
  onMissileIntercepted?: (screenX: number, screenY: number, isHeavy: boolean) => void;
  triggerActionRef?: React.MutableRefObject<
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
  >;
}

// Module-level pre-allocated variables for zero-GC animation loop
const _vec3 = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();
const _flashColor = new THREE.Color('#ffffff');
const _goldFlash = new THREE.Color('#ffea00');
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

interface LaserBolt {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: THREE.Color;
}

export const NeuralScene: React.FC<NeuralSceneProps> = ({
  config,
  powerTier = 1,
  wave = 1,
  combo = 0,
  destroyedCount = 0,
  playerShield = 100,
  isGameOver = false,
  onStatsUpdate,
  onBrainClickTriggered,
  onShipDestroyed,
  onShipLocked,
  onPlayerShieldDamaged,
  onCoreDamage,
  onCoreLockOnUpdate,
  onDeflectionSuccess,
  onPickupCollected,
  onAggressionChange,
  onThermalBurnTriggered,
  onMissileWarningUpdate,
  onMissileIntercepted,
  triggerActionRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const powerTierRef = useRef<1 | 2 | 3 | 4>(powerTier);
  powerTierRef.current = powerTier;
  const waveRef = useRef<number>(wave);
  waveRef.current = wave;
  const comboRef = useRef<number>(combo);
  comboRef.current = combo;
  const destroyedCountRef = useRef<number>(destroyedCount);
  destroyedCountRef.current = destroyedCount;
  const playerShieldRef = useRef<number>(playerShield);
  playerShieldRef.current = playerShield;
  const isGameOverRef = useRef<boolean>(isGameOver);
  isGameOverRef.current = isGameOver;
  const lastAggressionRef = useRef<EnemyAggressionLevel>('NORMAL');

  // Mutable animation state references
  const nodesRef = useRef<BrainNode[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const isScatteredRef = useRef<boolean>(false);
  const isSplitRef = useRef<boolean>(false);
  const splitProgressRef = useRef<number>(0);
  const scatterProgressRef = useRef<number>(0);
  const mouseWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isPointerDownRef = useRef<boolean>(false);
  const pointerDownCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const bloomFlareRef = useRef<number>(0);
  const prevShapeRef = useRef<string>(config.currentShape);
  const hyperspaceProgressRef = useRef<number>(0);
  const laserBoltsRef = useRef<LaserBolt[]>([]);
  const enemyBoltsRef = useRef<EnemyBlasterBolt[]>([]);
  const protonTorpedoesRef = useRef<ProtonTorpedo[]>([]);
  const enemyMissilesRef = useRef<EnemyMissile[]>([]);
  const lastMissileWarningSoundRef = useRef<number>(0);
  const cameraShakeRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const combatSquadronRef = useRef<CombatShip[]>([]);
  const activeDebrisRef = useRef<ExplosionParticle[]>([]);
  const activePickupsRef = useRef<ActivePickup[]>([]);
  const activeLockShipIdRef = useRef<string | null>(null);
  const lastLockBeepSecondRef = useRef<number>(-1);
  const empDisabledTimerRef = useRef<number>(0);
  const reflectorActiveTimerRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080b0c'); // 7LayerX near-black
    scene.fog = new THREE.FogExp2('#080b0c', 0.038);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Initial camera position matching the 3/4 profile in the reference screenshots
    camera.position.set(2.8, 1.2, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // FXAAShader handles anti-aliasing in post-processing
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Post-Processing Pipeline (Unreal Bloom & FXAA)
    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      configRef.current.bloomIntensity,
      configRef.current.bloomRadius,
      configRef.current.bloomThreshold
    );
    bloomPass.enabled = configRef.current.bloomEnabled;
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    const initialPr = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (width * initialPr),
      1 / (height * initialPr)
    );
    composer.addPass(fxaaPass);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0, 0);

    // 3. Lighting Rig (Warm golden key + Cool cyan/purple hemisphere)
    const ambientLight = new THREE.AmbientLight('#2a2a40', 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#c084fc', '#06d6a0', 1.4);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#ffb703', 2.2);
    keyLight.position.set(4, 5, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 1.8);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // 4. Generate Brain Nodes & Instanced Mesh
    const nodes = generateBrainNodes(configRef.current.particleDensity, configRef.current.theme);
    nodesRef.current = nodes;

    // Hollow triangle geometry
    const triangleGeometry = createHollowTriangleGeometry(0.13, 0.32);
    const triangleMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.16,
      metalness: 0.88,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#16182c'),
      emissiveIntensity: 0.45,
      vertexColors: false,
    });

    const instancedMesh = new THREE.InstancedMesh(triangleGeometry, triangleMaterial, nodes.length);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false; // Nodes disperse dynamically

    // Accent floating wireframe tetrahedrons for perimeter crystals
    const accentCount = 120;
    const tetraGeom = createTetrahedronFrameGeometry(0.18);
    const tetraMat = new THREE.LineBasicMaterial({
      color: '#ffd166',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const tetraSegments = new THREE.LineSegments(tetraGeom, tetraMat);

    // Group for brain model
    const brainGroup = new THREE.Group();
    brainGroup.add(instancedMesh);
    scene.add(brainGroup);

    // Subtle background cosmic star/neural dust
    const dustCount = 800;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const dustPalette = [new THREE.Color('#ffb703'), new THREE.Color('#38bdf8'), new THREE.Color('#c084fc')];

    for (let i = 0; i < dustCount; i++) {
      const r = 4.5 + Math.random() * 8.0;
      const t = Math.random() * Math.PI * 2;
      const p = (Math.random() - 0.5) * Math.PI;
      dustPositions[i * 3] = r * Math.cos(p) * Math.cos(t);
      dustPositions[i * 3 + 1] = r * Math.sin(p);
      dustPositions[i * 3 + 2] = r * Math.cos(p) * Math.sin(t);

      const col = dustPalette[Math.floor(Math.random() * dustPalette.length)];
      dustColors[i * 3] = col.r;
      dustColors[i * 3 + 1] = col.g;
      dustColors[i * 3 + 2] = col.b;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // Synaptic connections between nearby cortex points
    const maxLines = 600;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    lineSegments.frustumCulled = false;
    brainGroup.add(lineSegments);

    // Star Wars Turbolaser Blaster Bolt Geometry
    const maxBolts = 32;
    const boltPositions = new Float32Array(maxBolts * 6);
    const boltColors = new Float32Array(maxBolts * 6);
    const boltGeometry = new THREE.BufferGeometry();
    boltGeometry.setAttribute('position', new THREE.BufferAttribute(boltPositions, 3).setUsage(THREE.DynamicDrawUsage));
    boltGeometry.setAttribute('color', new THREE.BufferAttribute(boltColors, 3).setUsage(THREE.DynamicDrawUsage));
    const boltMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const boltLines = new THREE.LineSegments(boltGeometry, boltMaterial);
    boltLines.frustumCulled = false;
    scene.add(boltLines);

    // Enemy Imperial Blaster Bolts (Vivid Star Wars emerald green & imperial scarlet bolts shooting toward core)
    const maxEnemyBolts = 64;
    const enemyBoltPositions = new Float32Array(maxEnemyBolts * 12);
    const enemyBoltColors = new Float32Array(maxEnemyBolts * 12);
    const enemyBoltGeometry = new THREE.BufferGeometry();
    enemyBoltGeometry.setAttribute('position', new THREE.BufferAttribute(enemyBoltPositions, 3).setUsage(THREE.DynamicDrawUsage));
    enemyBoltGeometry.setAttribute('color', new THREE.BufferAttribute(enemyBoltColors, 3).setUsage(THREE.DynamicDrawUsage));
    const enemyBoltMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const enemyBoltLines = new THREE.LineSegments(enemyBoltGeometry, enemyBoltMaterial);
    enemyBoltLines.frustumCulled = false;
    scene.add(enemyBoltLines);

    // Proton Torpedo Lines (Hyper Counter-Strike)
    const maxTorpedoes = 16;
    const torpedoPositions = new Float32Array(maxTorpedoes * 6);
    const torpedoColors = new Float32Array(maxTorpedoes * 6);
    const torpedoGeometry = new THREE.BufferGeometry();
    torpedoGeometry.setAttribute('position', new THREE.BufferAttribute(torpedoPositions, 3).setUsage(THREE.DynamicDrawUsage));
    torpedoGeometry.setAttribute('color', new THREE.BufferAttribute(torpedoColors, 3).setUsage(THREE.DynamicDrawUsage));
    const torpedoMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const torpedoLines = new THREE.LineSegments(torpedoGeometry, torpedoMaterial);
    torpedoLines.frustumCulled = false;
    scene.add(torpedoLines);

    // Star Wars Enemy Target Squadron (TIE Interceptors, TIE Fighters, Droids)
    const combatGroup = new THREE.Group();
    combatGroup.name = 'combatSquadron';
    scene.add(combatGroup);

    const squadron = createEnemySquadron(configRef.current.enemySquadronSize || 4, waveRef.current);
    combatSquadronRef.current = squadron;
    squadron.forEach((ship) => {
      combatGroup.add(ship.group);
    });

    // Star Wars Starship Explosion Debris Instanced Mesh
    const maxDebris = 150;
    const debrisGeom = new THREE.TetrahedronGeometry(0.18, 0);
    const debrisMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const debrisInstMesh = new THREE.InstancedMesh(debrisGeom, debrisMat, maxDebris);
    debrisInstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    debrisInstMesh.frustumCulled = false;
    scene.add(debrisInstMesh);

    // Initial zero scale for debris instances
    for (let d = 0; d < maxDebris; d++) {
      _scale.set(0, 0, 0);
      _mat4.compose(_pos, _quat, _scale);
      debrisInstMesh.setMatrixAt(d, _mat4);
    }
    debrisInstMesh.instanceMatrix.needsUpdate = true;

    // Core Reactor Cells Pickup Instanced Mesh (+15% Core Energy Restore)
    const maxPickups = 10;
    const pickupGeom = new THREE.OctahedronGeometry(0.32, 0);
    const pickupMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Glowing emerald green
      wireframe: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const pickupInstMesh = new THREE.InstancedMesh(pickupGeom, pickupMat, maxPickups);
    pickupInstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pickupInstMesh.frustumCulled = false;
    scene.add(pickupInstMesh);

    for (let p = 0; p < maxPickups; p++) {
      _scale.set(0, 0, 0);
      _mat4.compose(_pos, _quat, _scale);
      pickupInstMesh.setMatrixAt(p, _mat4);
    }
    pickupInstMesh.instanceMatrix.needsUpdate = true;

    // Enemy Concussion Missile Line Segments & Rocket Exhaust Trails
    const maxMissiles = 16;
    const missilePositions = new Float32Array(maxMissiles * 24);
    const missileColors = new Float32Array(maxMissiles * 24);
    const missileGeometry = new THREE.BufferGeometry();
    missileGeometry.setAttribute('position', new THREE.BufferAttribute(missilePositions, 3).setUsage(THREE.DynamicDrawUsage));
    missileGeometry.setAttribute('color', new THREE.BufferAttribute(missileColors, 3).setUsage(THREE.DynamicDrawUsage));
    const missileMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const missileLines = new THREE.LineSegments(missileGeometry, missileMaterial);
    missileLines.frustumCulled = false;
    scene.add(missileLines);

    // Enemy Missile Physical Warhead 3D Mesh
    const missileGeom = new THREE.ConeGeometry(0.18, 0.55, 6);
    missileGeom.rotateX(Math.PI / 2);
    const missileMat = new THREE.MeshBasicMaterial({
      color: 0xff3d00,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const missileInstMesh = new THREE.InstancedMesh(missileGeom, missileMat, maxMissiles);
    missileInstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    missileInstMesh.frustumCulled = false;
    scene.add(missileInstMesh);

    for (let m = 0; m < maxMissiles; m++) {
      _scale.set(0, 0, 0);
      _mat4.compose(_pos, _quat, _scale);
      missileInstMesh.setMatrixAt(m, _mat4);
    }
    missileInstMesh.instanceMatrix.needsUpdate = true;

    // Initial populate instances
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      _pos.set(node.x, node.y, node.z);
      _scale.set(node.scale, node.scale, node.scale);
      _euler.set(node.rotX, node.rotY, node.rotZ);
      _quat.setFromEuler(_euler);
      _mat4.compose(_pos, _quat, _scale);
      instancedMesh.setMatrixAt(i, _mat4);

      _color.setRGB(node.colorR, node.colorG, node.colorB);
      instancedMesh.setColorAt(i, _color);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 5. Dynamic Trigger Functions
    const triggerShockwave = (epicenter?: { x: number; y: number; z: number }) => {
      const center = epicenter || {
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.2,
        z: (Math.random() - 0.5) * 1.8,
      };

      const wave: Shockwave = {
        id: Date.now() + Math.random(),
        epicenter: center,
        startTime: performance.now(),
        speed: 4.8,
        strength: 0.65,
        radius: 0.0,
        maxRadius: 3.5,
        duration: 1200,
      };
      shockwavesRef.current.push(wave);
      bloomFlareRef.current = Math.min(2.2, bloomFlareRef.current + 0.85);
      neuralAudio.playShockwave();
    };

    const triggerScatterToggle = () => {
      isScatteredRef.current = !isScatteredRef.current;
      bloomFlareRef.current = Math.min(2.0, bloomFlareRef.current + 0.6);
      if (isScatteredRef.current) {
        neuralAudio.playScatter();
      } else {
        neuralAudio.playReassemble();
      }
    };

    const triggerSplitToggle = () => {
      isSplitRef.current = !isSplitRef.current;
      bloomFlareRef.current = Math.min(2.0, bloomFlareRef.current + 0.5);
      neuralAudio.playPulse();
    };

    const triggerPulse = () => {
      // Frontal to occipital neural electric pulse wave
      const wave: Shockwave = {
        id: Date.now(),
        epicenter: { x: 0, y: 0.5, z: 1.6 }, // Frontal lobe pole
        startTime: performance.now(),
        speed: 5.5,
        strength: 0.85,
        radius: 0.0,
        maxRadius: 4.2,
        duration: 1400,
      };
      shockwavesRef.current.push(wave);
      bloomFlareRef.current = Math.min(2.4, bloomFlareRef.current + 1.1);
      neuralAudio.playPulse();
    };

    const triggerHyperspace = () => {
      hyperspaceProgressRef.current = 1.0;
      bloomFlareRef.current = 2.8;
      neuralAudio.playHyperspace();
      // Warp speed breaks tracking lock on all incoming missiles!
      if (enemyMissilesRef.current.length > 0) {
        enemyMissilesRef.current.forEach((m) => {
          m.vel.multiplyScalar(0.4);
          m.turnRate = 0; // Lost guidance lock
        });
      }
    };

    const triggerBlasterBoltAt = (targetPoint: THREE.Vector3) => {
      neuralAudio.playBlasterFire();
      bloomFlareRef.current = Math.min(2.5, bloomFlareRef.current + 0.65);
      const isGreen =
        configRef.current.currentShape === 'xwing' ||
        configRef.current.currentShape === 'deathstar';

      const currentTier = powerTierRef.current || 1;
      let boltCol = isGreen ? new THREE.Color('#22c55e') : new THREE.Color('#ef4444');
      let offsets = [-0.75, 0.75];
      let speed = 54.0;

      if (currentTier === 2) {
        // Dual Turbolasers: electric amber/green with boosted velocity
        boltCol = isGreen ? new THREE.Color('#4ade80') : new THREE.Color('#ffbe0b');
        offsets = [-0.9, 0.9];
        speed = 66.0;
      } else if (currentTier >= 3) {
        // Quad Ion Cannons: 4 simultaneous high-energy cyan/blue plasma bolts
        boltCol = new THREE.Color('#00f0ff');
        offsets = [-1.2, -0.42, 0.42, 1.2];
        speed = 74.0;
      }

      const camPos = camera.position;
      const forward = new THREE.Vector3().subVectors(targetPoint, camPos).normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      offsets.forEach((side) => {
        const origin = camPos
          .clone()
          .add(forward.clone().multiplyScalar(0.7))
          .add(right.clone().multiplyScalar(side));
        const dir = new THREE.Vector3().subVectors(targetPoint, origin).normalize();

        laserBoltsRef.current.push({
          x: origin.x,
          y: origin.y,
          z: origin.z,
          vx: dir.x * speed,
          vy: dir.y * speed,
          vz: dir.z * speed,
          life: 1.0,
          color: boltCol,
        });
      });
    };

    const triggerHyperProtonTorpedoes = () => {
      neuralAudio.playSuperCounterStrike();
      bloomFlareRef.current = 3.6;
      const activeShips = combatSquadronRef.current.filter((s) => !s.isDead && s.group.visible);
      const volley = createProtonTorpedoVolley(camera.position, activeShips);
      protonTorpedoesRef.current.push(...volley);

      const forward = camera.getWorldDirection(new THREE.Vector3());
      const center = camera.position.clone().add(forward.multiplyScalar(3.2));
      triggerShockwave({ x: center.x, y: center.y, z: center.z });
    };

    const triggerBlaster = (targetPoint?: { x: number; y: number; z: number }) => {
      if (targetPoint) {
        const targetVec = new THREE.Vector3(targetPoint.x, targetPoint.y, targetPoint.z);
        triggerBlasterBoltAt(targetVec);
        triggerShockwave(targetPoint);
      } else {
        const forward = camera.getWorldDirection(new THREE.Vector3());
        const targetVec = camera.position.clone().add(forward.multiplyScalar(12));
        triggerBlasterBoltAt(targetVec);
      }
    };

    const triggerForce = (centerPoint?: { x: number; y: number; z: number }) => {
      neuralAudio.playForcePush();
      bloomFlareRef.current = Math.min(2.8, bloomFlareRef.current + 1.3);
      const epicenter = centerPoint || { x: 0, y: 0, z: 0 };
      const wave: Shockwave = {
        id: Date.now() + Math.random(),
        epicenter,
        startTime: performance.now(),
        speed: 6.2,
        strength: 1.25,
        radius: 0.0,
        maxRadius: 5.0,
        duration: 1600,
      };
      shockwavesRef.current.push(wave);

      // Impart telekinetic rotational spin on nodes
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - epicenter.x;
        const dy = n.y - epicenter.y;
        const dz = n.z - epicenter.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 3.2) {
          const force = (1 - d / 3.2) * 2.8;
          n.vx += (dy * 0.8 + (Math.random() - 0.5)) * force;
          n.vy += (-dx * 0.8 + 0.5) * force;
          n.vz += (Math.random() - 0.5) * force;
          n.rotSpeed += force * 1.5;
        }
      }
    };

    const triggerSaberClash = () => {
      neuralAudio.playSaberClash();
      bloomFlareRef.current = 2.6;
      const wave: Shockwave = {
        id: Date.now(),
        epicenter: { x: 0, y: 0, z: 0 },
        startTime: performance.now(),
        speed: 8.0,
        strength: 0.95,
        radius: 0.0,
        maxRadius: 3.8,
        duration: 1100,
      };
      shockwavesRef.current.push(wave);
    };

    const triggerDeathStarSuperweapon = () => {
      neuralAudio.playSuperlaser();
      bloomFlareRef.current = 4.5;
      cameraShakeRef.current.set(
        (Math.random() - 0.5) * 2.2,
        (Math.random() - 0.5) * 2.2,
        (Math.random() - 0.5) * 1.5
      );

      // Colossal emerald shockwave radiating from the Death Star focal point
      const focal = new THREE.Vector3(0.65, 0.65, 2.1);
      const wave: Shockwave = {
        id: Date.now(),
        epicenter: { x: focal.x, y: focal.y, z: focal.z },
        startTime: performance.now(),
        speed: 14.0,
        strength: 2.5,
        radius: 0.0,
        maxRadius: 10.0,
        duration: 2200,
      };
      shockwavesRef.current.push(wave);

      // Fire 8 tributary converging green beams into laserBoltsRef
      const emeraldCol = new THREE.Color('#d2f27c');
      const whiteCoreCol = new THREE.Color('#eef2ef');
      for (let beam = 0; beam < 8; beam++) {
        const angle = (beam * Math.PI) / 4;
        const rimX = 0.55 + 0.5 * Math.cos(angle);
        const rimY = 0.55 + 0.5 * Math.sin(angle);
        const rimZ = 1.15;
        const dir = new THREE.Vector3().subVectors(focal, new THREE.Vector3(rimX, rimY, rimZ)).normalize();

        laserBoltsRef.current.push({
          x: rimX,
          y: rimY,
          z: rimZ,
          vx: dir.x * 28.0,
          vy: dir.y * 28.0,
          vz: dir.z * 28.0,
          life: 1.2,
          color: emeraldCol,
        });
      }

      // Main superlaser blast stream bursting forward from focal point across sector
      for (let burst = 0; burst < 14; burst++) {
        const spreadX = (Math.random() - 0.5) * 0.16;
        const spreadY = (Math.random() - 0.5) * 0.16;
        laserBoltsRef.current.push({
          x: focal.x + spreadX,
          y: focal.y + spreadY,
          z: focal.z,
          vx: spreadX * 12,
          vy: spreadY * 12,
          vz: 48.0 + Math.random() * 8.0,
          life: 1.8,
          color: burst % 2 === 0 ? emeraldCol : whiteCoreCol,
        });
      }

      // Obliterate active enemy starships in the blast zone
      const activeShips = combatSquadronRef.current.filter((s) => !s.isDead && s.group.visible);
      const targets = activeShips.slice(0, 2);
      targets.forEach((ship) => {
        ship.isDead = true;
        ship.group.visible = false;
        ship.respawnTimer = 4.0;
        const debris = createExplosionDebris(ship.position);
        activeDebrisRef.current.push(...debris);

        const proj = ship.position.clone().project(camera);
        const screenW = renderer.domElement.clientWidth || window.innerWidth;
        const screenH = renderer.domElement.clientHeight || window.innerHeight;
        onShipDestroyed?.({
          points: 150,
          screenX: ((proj.x + 1) * 0.5) * screenW,
          screenY: ((-proj.y + 1) * 0.5) * screenH,
          shipName: `${ship.name} [SUPERLASER]`,
          isKill: true,
          isElite: ship.isElite,
        });
      });
    };

    const triggerResetWave = (targetWave: number) => {
      // Clear all incoming projectiles, torpedoes, pickups & locks
      enemyBoltsRef.current = [];
      protonTorpedoesRef.current = [];
      laserBoltsRef.current = [];
      enemyMissilesRef.current = [];
      activePickupsRef.current = [];
      activeLockShipIdRef.current = null;
      lastLockBeepSecondRef.current = -1;
      onCoreLockOnUpdate?.(null);
      onMissileWarningUpdate?.(null, 0);

      // Re-spawn fresh squadron scaled for the target wave
      combatSquadronRef.current.forEach((ship) => {
        combatGroup.remove(ship.group);
      });
      const freshSquadron = createEnemySquadron(configRef.current.enemySquadronSize || 4, targetWave);
      combatSquadronRef.current = freshSquadron;
      freshSquadron.forEach((ship) => {
        combatGroup.add(ship.group);
      });
    };

    const triggerBreachExplosion = () => {
      neuralAudio.playReactorBreach();
      bloomFlareRef.current = 4.0;
      cameraShakeRef.current.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8
      );

      // Massive explosion debris right in front of cockpit camera
      const camPos = camera.position.clone();
      const breachPos = camPos.clone().add(new THREE.Vector3(0, 0, -1.2));
      const debris = createExplosionDebris(breachPos);
      activeDebrisRef.current.push(...debris);

      const wave: Shockwave = {
        id: Date.now(),
        epicenter: { x: 0, y: 0, z: 0 },
        startTime: performance.now(),
        speed: 12.0,
        strength: 2.2,
        radius: 0.0,
        maxRadius: 8.0,
        duration: 2200,
      };
      shockwavesRef.current.push(wave);
    };

    const triggerThermalFlameCannons = () => {
      neuralAudio.playFireBlaster();
      bloomFlareRef.current = Math.min(3.4, bloomFlareRef.current + 1.2);
      const camPos = camera.position;
      const forward = camera.getWorldDirection(new THREE.Vector3());
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      // Launch quad incendiary flame streams with blazing embers
      const flameOffsets = [-0.95, -0.35, 0.35, 0.95];
      flameOffsets.forEach((side, idx) => {
        const origin = camPos.clone().add(forward.clone().multiplyScalar(0.8)).add(right.clone().multiplyScalar(side));
        const dir = forward.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, 0)).normalize();
        laserBoltsRef.current.push({
          x: origin.x,
          y: origin.y,
          z: origin.z,
          vx: dir.x * 72.0,
          vy: dir.y * 72.0,
          vz: dir.z * 72.0,
          life: 1.4,
          color: idx % 2 === 0 ? new THREE.Color('#ff3d00') : new THREE.Color('#ff9100'),
        });
      });

      // Spawn burning flame burst ahead of cockpit
      const flameAhead = camPos.clone().add(forward.multiplyScalar(2.2));
      const fireSparks = createFireSparks(flameAhead, true);
      activeDebrisRef.current.push(...fireSparks);
    };

    const triggerEmpDisruptor = () => {
      neuralAudio.playEmpDisruptor();
      bloomFlareRef.current = 3.6;
      empDisabledTimerRef.current = 4.0; // Stuns enemy weapons for 4 full seconds!
      // Flash all enemy starships with EMP ion disruption
      combatSquadronRef.current.forEach((ship) => {
        ship.shieldFlash = 2.8;
      });
      // Detonate all active enemy missiles in flight with EMP blast!
      if (enemyMissilesRef.current.length > 0) {
        enemyMissilesRef.current.forEach((m) => {
          neuralAudio.playMissileInterception();
          const debris = createExplosionDebris(m.pos);
          const sparks = createFireSparks(m.pos, false);
          activeDebrisRef.current.push(...debris, ...sparks);
        });
        enemyMissilesRef.current = [];
        onMissileWarningUpdate?.(null, 0);
      }
      // Radial EMP shockwave
      triggerShockwave({ x: 0, y: 0, z: 0 });
    };

    const triggerPlasmaReflector = () => {
      neuralAudio.playPlasmaReflector();
      bloomFlareRef.current = 3.4;
      reflectorActiveTimerRef.current = 3.5; // Reflects enemy bolts for 3.5 seconds!
      // Protective deflector shield flash
      cameraShakeRef.current.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2
      );
    };

    // Expose trigger action to parent HUD
    if (triggerActionRef) {
      triggerActionRef.current = (action) => {
        if (action === 'shockwave') triggerShockwave();
        else if (action === 'scatter') triggerScatterToggle();
        else if (action === 'split') triggerSplitToggle();
        else if (action === 'pulse') triggerPulse();
        else if (action === 'hyperspace' || action === 'power_warp') triggerHyperspace();
        else if (action === 'blaster') triggerBlaster();
        else if (action === 'force') triggerForce();
        else if (action === 'saberclash') triggerSaberClash();
        else if (action === 'superlaser' || action === 'deathstar_superweapon') triggerDeathStarSuperweapon();
        else if (action === 'hypertorpedo' || action === 'power_torpedo') triggerHyperProtonTorpedoes();
        else if (action === 'restart_wave') triggerResetWave(waveRef.current);
        else if (action === 'restart_mission') triggerResetWave(1);
        else if (action === 'breach_explosion') triggerBreachExplosion();
        else if (action === 'power_flame') triggerThermalFlameCannons();
        else if (action === 'power_emp') triggerEmpDisruptor();
        else if (action === 'power_reflector') triggerPlasmaReflector();
      };
    }

    // 6. User Click & Interaction Handling
    const handlePointerDown = (e: MouseEvent) => {
      isPointerDownRef.current = true;
      pointerDownCoordRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - pointerDownCoordRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownCoordRef.current.y);
      isPointerDownRef.current = false;

      // Only treat as click if pointer didn't drag to orbit
      if (dx < 6 && dy < 6) {
        // Combat input is disabled during reactor failure / game over state
        if (isGameOverRef.current) return;

        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, camera);

        // 0. Check if player clicked a floating Core Reactor Pickup Canister (+15% restore)
        if (configRef.current.combatMode && activePickupsRef.current.length > 0) {
          let closestPickupIdx = -1;
          let closestDist = 2.4;
          for (let p = 0; p < activePickupsRef.current.length; p++) {
            const pickup = activePickupsRef.current[p];
            const closest = new THREE.Vector3();
            _raycaster.ray.closestPointToPoint(pickup.pos, closest);
            const d = closest.distanceTo(pickup.pos);
            if (d < closestDist) {
              closestDist = d;
              closestPickupIdx = p;
            }
          }

          if (closestPickupIdx !== -1) {
            const p = activePickupsRef.current[closestPickupIdx];
            activePickupsRef.current.splice(closestPickupIdx, 1);
            neuralAudio.playPickupCollect();
            const proj = p.pos.clone().project(camera);
            const screenW = renderer.domElement.clientWidth || window.innerWidth;
            const screenH = renderer.domElement.clientHeight || window.innerHeight;
            const sX = ((proj.x + 1) * 0.5) * screenW;
            const sY = ((-proj.y + 1) * 0.5) * screenH;
            onPickupCollected?.(sX, sY);
            return;
          }
        }

        // 1. Raycast Check for Star Wars Enemy Target Ships!
        let hitShip: CombatShip | null = null;
        let hitPoint: THREE.Vector3 | null = null;

        if (configRef.current.combatMode) {
          const hitBoxes = combatSquadronRef.current
            .filter((s) => !s.isDead && s.group.visible)
            .map((s) => s.hitBox);

          const shipIntersects = _raycaster.intersectObjects(hitBoxes, true);

          if (shipIntersects.length > 0) {
            const hitObj = shipIntersects[0].object;
            hitPoint = shipIntersects[0].point;
            hitShip = combatSquadronRef.current.find((s) => s.hitBox === hitObj) || null;
          } else if (configRef.current.autoAimBlaster) {
            // Proximity auto-targeting for nearest enemy ship in view
            let closestDist = 2.4;
            for (const ship of combatSquadronRef.current) {
              if (ship.isDead || !ship.group.visible) continue;
              const closest = new THREE.Vector3();
              _raycaster.ray.closestPointToPoint(ship.position, closest);
              const d = closest.distanceTo(ship.position);
              if (d < closestDist) {
                closestDist = d;
                hitShip = ship;
                hitPoint = ship.position.clone();
              }
            }
          }
        }

        // If an enemy ship was hit, execute destruction sequence & award points!
        if (hitShip) {
          triggerBlasterBoltAt(hitPoint || hitShip.position);

          // Authentic procedural audio effects
          neuralAudio.playShipHit();
          neuralAudio.playShipExplosion();
          neuralAudio.playPointScore();

          // If this ship was locking onto the Core Reactor, break the lock!
          if (hitShip.id === activeLockShipIdRef.current) {
            activeLockShipIdRef.current = null;
            lastLockBeepSecondRef.current = -1;
            onCoreLockOnUpdate?.(null);
          }

          // Destroy ship and initiate respawn timer
          hitShip.isDead = true;
          hitShip.isLockingOnCore = false;
          hitShip.group.visible = false;
          hitShip.respawnTimer = 2.2 + Math.random() * 1.5;

          // Spawn high-energy explosion debris
          const debris = createExplosionDebris(hitShip.position);
          activeDebrisRef.current.push(...debris);

          // Spawn Core Reactor Pickup Cell (guaranteed on elite TIE Advanced kill, 35% on standard)
          if (hitShip.isElite || Math.random() < 0.35) {
            const pickup = createReactorPickup(hitShip.position);
            activePickupsRef.current.push(pickup);
          }

          // Bloom fireball flash
          bloomFlareRef.current = Math.min(3.2, bloomFlareRef.current + 1.8);

          // Project 3D position to 2D screen coordinates for "+1" score popup
          const proj = hitShip.position.clone().project(camera);
          const screenW = renderer.domElement.clientWidth || window.innerWidth;
          const screenH = renderer.domElement.clientHeight || window.innerHeight;
          const sX = ((proj.x + 1) * 0.5) * screenW;
          const sY = ((-proj.y + 1) * 0.5) * screenH;

          onShipDestroyed?.({
            points: 1,
            screenX: sX,
            screenY: sY,
            shipName: hitShip.name,
            isKill: true,
            isElite: hitShip.isElite,
          });

          return;
        }

        // Check if player clicked an incoming enemy missile to intercept and detonate it mid-air!
        if (configRef.current.combatMode && enemyMissilesRef.current.length > 0) {
          let closestMissileIdx = -1;
          let closestMissileDist = 2.4;
          for (let m = 0; m < enemyMissilesRef.current.length; m++) {
            const missile = enemyMissilesRef.current[m];
            const closest = new THREE.Vector3();
            _raycaster.ray.closestPointToPoint(missile.pos, closest);
            const d = closest.distanceTo(missile.pos);
            if (d < closestMissileDist) {
              closestMissileDist = d;
              closestMissileIdx = m;
            }
          }

          if (closestMissileIdx !== -1) {
            const m = enemyMissilesRef.current[closestMissileIdx];
            enemyMissilesRef.current.splice(closestMissileIdx, 1);
            triggerBlasterBoltAt(m.pos);
            neuralAudio.playMissileInterception();
            const debris = createExplosionDebris(m.pos);
            const fireSparks = createFireSparks(m.pos, true);
            activeDebrisRef.current.push(...debris, ...fireSparks);

            const proj = m.pos.clone().project(camera);
            const screenW = renderer.domElement.clientWidth || window.innerWidth;
            const screenH = renderer.domElement.clientHeight || window.innerHeight;
            const sX = ((proj.x + 1) * 0.5) * screenW;
            const sY = ((-proj.y + 1) * 0.5) * screenH;

            onMissileIntercepted?.(sX, sY, m.isHeavy);
            return;
          }
        }

        // Check if player clicked an incoming enemy blaster bolt to deflect it mid-air!
        if (configRef.current.combatMode && enemyBoltsRef.current.length > 0) {
          let closestBoltIdx = -1;
          let closestBoltDist = 2.0;
          for (let i = 0; i < enemyBoltsRef.current.length; i++) {
            const b = enemyBoltsRef.current[i];
            const closest = new THREE.Vector3();
            _raycaster.ray.closestPointToPoint(b.pos, closest);
            const d = closest.distanceTo(b.pos);
            if (d < closestBoltDist) {
              closestBoltDist = d;
              closestBoltIdx = i;
            }
          }

          if (closestBoltIdx !== -1) {
            const defBolt = enemyBoltsRef.current[closestBoltIdx];
            triggerBlasterBoltAt(defBolt.pos);
            neuralAudio.playShieldDeflect();

            const isCoreStrike = !!defBolt.isCoreStrike;
            if (isCoreStrike) {
              neuralAudio.playPointScore(3);
            } else {
              neuralAudio.playPointScore(2);
            }

            defBolt.life = 0; // destroyed

            const proj = defBolt.pos.clone().project(camera);
            const screenW = renderer.domElement.clientWidth || window.innerWidth;
            const screenH = renderer.domElement.clientHeight || window.innerHeight;
            const sX = ((proj.x + 1) * 0.5) * screenW;
            const sY = ((-proj.y + 1) * 0.5) * screenH;

            onDeflectionSuccess?.(isCoreStrike ? 2 : 1, sX, sY, isCoreStrike);
            return;
          }
        }

        // If missed in combat mode or blaster mode, fire warning shots into space
        if (configRef.current.combatMode || configRef.current.clickMode === 'blaster') {
          const spaceTarget = camera.position
            .clone()
            .add(_raycaster.ray.direction.clone().multiplyScalar(16));
          triggerBlasterBoltAt(spaceTarget);
        }

        // 2. Raycast against the instanced mesh bounding sphere
        const intersects = _raycaster.intersectObject(instancedMesh, false);
        let clickPoint: THREE.Vector3 | null = null;

        if (intersects.length > 0) {
          clickPoint = intersects[0].point;
        } else {
          // If clicked near the brain, find the closest ray projection
          const ray = _raycaster.ray;
          const target = new THREE.Vector3();
          ray.closestPointToPoint(new THREE.Vector3(0, 0, 0), target);
          if (target.length() < 2.5) {
            clickPoint = target;
          }
        }

        const currentMode = configRef.current.clickMode;
        onBrainClickTriggered?.(currentMode);

        // If Star Wars ship active, fire blaster on click!
        if (['xwing', 'falcon', 'tiefighter', 'deathstar'].includes(configRef.current.currentShape)) {
          triggerBlaster();
        }

        if (currentMode === 'shockwave') {
          triggerShockwave(clickPoint ? { x: clickPoint.x, y: clickPoint.y, z: clickPoint.z } : undefined);
        } else if (currentMode === 'scatter') {
          triggerScatterToggle();
        } else if (currentMode === 'split') {
          triggerSplitToggle();
        } else if (currentMode === 'pulse') {
          triggerPulse();
        } else if (currentMode === 'vortex') {
          triggerShockwave(clickPoint ? { x: clickPoint.x, y: clickPoint.y, z: clickPoint.z } : undefined);
        } else if (currentMode === 'blaster') {
          triggerBlaster(clickPoint ? { x: clickPoint.x, y: clickPoint.y, z: clickPoint.z } : undefined);
        } else if (currentMode === 'force') {
          triggerForce(clickPoint ? { x: clickPoint.x, y: clickPoint.y, z: clickPoint.z } : undefined);
        } else if (currentMode === 'hyperspace') {
          triggerHyperspace();
        } else if (currentMode === 'saberclash') {
          triggerSaberClash();
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);

      // Check lock-on on enemy ships
      if (configRef.current.combatMode) {
        const hitBoxes = combatSquadronRef.current
          .filter((s) => !s.isDead && s.group.visible)
          .map((s) => s.hitBox);
        const hovers = _raycaster.intersectObjects(hitBoxes, true);
        if (hovers.length > 0) {
          const hitObj = hovers[0].object;
          const s = combatSquadronRef.current.find((x) => x.hitBox === hitObj);
          onShipLocked?.(s ? s.name : null);
          renderer.domElement.style.cursor = 'crosshair';
        } else {
          onShipLocked?.(null);
          renderer.domElement.style.cursor = 'grab';
        }
      }

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const planePoint = new THREE.Vector3();
      _raycaster.ray.intersectPlane(plane, planePoint);
      mouseWorldPosRef.current.copy(planePoint);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mousemove', handlePointerMove);

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
      const pr = renderer.getPixelRatio();
      fxaaPass.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr));
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation & Physics Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = lastTime;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Decrement tactical power timers
      if (empDisabledTimerRef.current > 0) {
        empDisabledTimerRef.current = Math.max(0, empDisabledTimerRef.current - delta);
      }
      if (reflectorActiveTimerRef.current > 0) {
        reflectorActiveTimerRef.current = Math.max(0, reflectorActiveTimerRef.current - delta);
      }

      // FPS tracking
      frameCount++;
      if (now - lastFpsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        onStatsUpdate?.({
          count: nodesRef.current.length,
          fps,
          activeShockwaves: shockwavesRef.current.length,
        });
        frameCount = 0;
        lastFpsTime = now;
      }

      controls.update();

      // Dynamic Bloom Post-Processing Parameters with Shockwave Flare
      bloomFlareRef.current = THREE.MathUtils.damp(bloomFlareRef.current, 0, 4.0, delta);
      const targetBloomStrength = (configRef.current.bloomEnabled ? configRef.current.bloomIntensity : 0) + bloomFlareRef.current;
      bloomPass.strength = THREE.MathUtils.damp(bloomPass.strength, targetBloomStrength, 10.0, delta);
      bloomPass.radius = configRef.current.bloomRadius;
      bloomPass.threshold = configRef.current.bloomThreshold;
      bloomPass.enabled = configRef.current.bloomEnabled;

      // Star Wars Hyperspace Jump Progress Damping
      const warpProgress = hyperspaceProgressRef.current;
      hyperspaceProgressRef.current = THREE.MathUtils.damp(hyperspaceProgressRef.current, 0, 1.8, delta);

      // Brainwave frequency calculation
      const bw = configRef.current.brainwave;
      let waveFreq = 10; // Alpha default
      if (bw === 'gamma') waveFreq = 40;
      else if (bw === 'beta') waveFreq = 20;
      else if (bw === 'alpha') waveFreq = 10;
      else if (bw === 'theta') waveFreq = 6;

      const isBrainwavesOn = configRef.current.brainwavesEnabled !== false;
      const brainwavePulse = isBrainwavesOn ? Math.sin(elapsedTime * (waveFreq * 0.4)) * 0.035 : 0;

      // Auto rotation
      if (configRef.current.autoRotate) {
        brainGroup.rotation.y += delta * 0.25 * configRef.current.rotationSpeed;
      }

      // Update Split Interpolation
      const targetSplit = isSplitRef.current ? 1.0 : 0.0;
      splitProgressRef.current = THREE.MathUtils.damp(splitProgressRef.current, targetSplit, 4.0, delta);

      // Update Scatter Interpolation
      const targetScatter = isScatteredRef.current ? 1.0 : 0.0;
      scatterProgressRef.current = THREE.MathUtils.damp(scatterProgressRef.current, targetScatter, 3.5, delta);

      // Clean up finished shockwaves
      const activeWaves = shockwavesRef.current.filter((w) => now - w.startTime < w.duration);
      shockwavesRef.current = activeWaves;

      // Expand shockwaves
      for (let w = 0; w < activeWaves.length; w++) {
        const wave = activeWaves[w];
        const age = (now - wave.startTime) / 1000;
        wave.radius = age * wave.speed;
      }

      // Physics update per node
      const currentNodes = nodesRef.current;
      const userTriangleScale = configRef.current.triangleScale;
      const splitAmount = splitProgressRef.current * 0.95;
      const scatterAmount = scatterProgressRef.current;
      const mouseWorld = mouseWorldPosRef.current;
      const isVortexActive = configRef.current.clickMode === 'vortex' && isPointerDownRef.current;

      let lineVertexIdx = 0;

      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];

        // 1. Base Target with Hemispheric Split
        let targetX = node.baseX;
        let targetY = node.baseY;
        let targetZ = node.baseZ;

        if (splitAmount > 0.001) {
          const splitOffset = (node.hemisphere === 'right' ? 1 : -1) * splitAmount;
          targetX += splitOffset;
        }

        // 2. Quantum Scatter Displacement
        if (scatterAmount > 0.001) {
          targetX += node.scatterOffsetX * scatterAmount;
          targetY += node.scatterOffsetY * scatterAmount;
          targetZ += node.scatterOffsetZ * scatterAmount;
        }

        // 3. Brainwave Resonant Pulsing (breathing along surface normal)
        const breathe = brainwavePulse * (1 + Math.sin(node.baseY * 3 + elapsedTime * 2) * 0.5);
        targetX += node.normalX * breathe;
        targetY += node.normalY * breathe;
        targetZ += node.normalZ * breathe;

        // 4. Shockwave Ripple Dynamics
        let shockwaveDisp = 0;
        let shockwaveFlash = 0;

        for (let w = 0; w < activeWaves.length; w++) {
          const wave = activeWaves[w];
          const dx = node.x - wave.epicenter.x;
          const dy = node.y - wave.epicenter.y;
          const dz = node.z - wave.epicenter.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const waveFrontDist = Math.abs(dist - wave.radius);
          if (waveFrontDist < 0.8) {
            const waveFalloff = Math.exp(-waveFrontDist * 3.5);
            const waveDecay = Math.max(0, 1 - wave.radius / wave.maxRadius);
            const impulse = Math.sin((wave.radius - dist) * 8.0) * wave.strength * waveFalloff * waveDecay;
            shockwaveDisp += impulse;
            shockwaveFlash += waveFalloff * waveDecay * 1.5;
          }
        }

        // 5. Vortex Attractor (pulls towards cursor in dynamic vortex mode)
        if (isVortexActive) {
          const vdx = mouseWorld.x - node.x;
          const vdy = mouseWorld.y - node.y;
          const vdz = -node.z;
          const vdist = Math.sqrt(vdx * vdx + vdy * vdy + vdz * vdz);
          if (vdist < 2.5) {
            const force = (1 - vdist / 2.5) * 0.45;
            // swirl perpendicular vector
            targetX += (vdx * 0.3 - vdy * 0.7) * force;
            targetY += (vdy * 0.3 + vdx * 0.7) * force;
          }
        }

        // Apply normal displacement from shockwave
        targetX += node.normalX * shockwaveDisp;
        targetY += node.normalY * shockwaveDisp;
        targetZ += node.normalZ * shockwaveDisp;

        // Star Wars Hyperspace forward burst
        if (warpProgress > 0.01) {
          targetZ += Math.pow(warpProgress, 1.3) * 2.4;
          shockwaveFlash += warpProgress * 2.2;
        }

        // Star Wars Hologram Scanline Wave
        if (configRef.current.hologramScanlines) {
          const scan = Math.sin(node.baseY * 16.0 - elapsedTime * 8.0);
          targetY += scan * 0.015;
          if (scan > 0.72) {
            shockwaveFlash += 0.35;
          }
        }

        // Spring Kinematics: Smooth damped interpolation towards target
        const springK = 14.0;
        const damping = 0.82;

        const ax = (targetX - node.x) * springK;
        const ay = (targetY - node.y) * springK;
        const az = (targetZ - node.z) * springK;

        node.vx = (node.vx + ax * delta) * damping;
        node.vy = (node.vy + ay * delta) * damping;
        node.vz = (node.vz + az * delta) * damping;

        node.x += node.vx * delta;
        node.y += node.vy * delta;
        node.z += node.vz * delta;

        // Dynamic Rotation: rotate on its axis, faster when disturbed
        const speedBoost = 1 + Math.abs(shockwaveDisp) * 12 + scatterAmount * 4;
        node.rotX += delta * node.rotSpeed * speedBoost;
        node.rotY += delta * node.rotSpeed * 0.8 * speedBoost;

        // Dynamic Scale: expand during shockwaves/pulses
        const currentScale = node.baseScale * userTriangleScale * (1 + Math.abs(shockwaveDisp) * 1.8 + shockwaveFlash * 0.5);

        // Update Instanced Matrix
        _pos.set(node.x, node.y, node.z);
        _scale.set(currentScale, currentScale, currentScale);
        _euler.set(node.rotX, node.rotY, node.rotZ);
        _quat.setFromEuler(_euler);
        _mat4.compose(_pos, _quat, _scale);
        instancedMesh.setMatrixAt(i, _mat4);

        // Dynamic Color: flash glowing white/gold when energized by shockwave
        _color.setRGB(node.colorR, node.colorG, node.colorB);
        if (shockwaveFlash > 0.05) {
          const flashAmt = Math.min(1.0, shockwaveFlash);
          _color.lerp(shockwaveFlash > 0.8 ? _flashColor : _goldFlash, flashAmt);
          // Boost color into HDR values (>1.0) for high-intensity glow emission
          const glowMult = 1.0 + shockwaveFlash * 2.2;
          _color.r *= glowMult;
          _color.g *= glowMult;
          _color.b *= glowMult;
        }
        instancedMesh.setColorAt(i, _color);

        // Synaptic line segments between selected neighboring nodes with high-intensity light emission
        if (configRef.current.showSynapticLines && i % 7 === 0 && lineVertexIdx < maxLines * 6 - 6) {
          const nextNode = currentNodes[(i + 13) % currentNodes.length];
          const distSq = (node.x - nextNode.x) ** 2 + (node.y - nextNode.y) ** 2 + (node.z - nextNode.z) ** 2;
          if (distSq < 0.4) {
            linePositions[lineVertexIdx] = node.x;
            linePositions[lineVertexIdx + 1] = node.y;
            linePositions[lineVertexIdx + 2] = node.z;

            linePositions[lineVertexIdx + 3] = nextNode.x;
            linePositions[lineVertexIdx + 4] = nextNode.y;
            linePositions[lineVertexIdx + 5] = nextNode.z;

            // High-intensity light emission for synaptic laser lines
            const lCol = shockwaveFlash > 0.15 ? _goldFlash : _color;
            const emissionMult = shockwaveFlash > 0.15 ? 2.8 : 1.7;
            const lr = lCol.r * emissionMult;
            const lg = lCol.g * emissionMult;
            const lb = lCol.b * emissionMult;

            lineColors[lineVertexIdx] = lr;
            lineColors[lineVertexIdx + 1] = lg;
            lineColors[lineVertexIdx + 2] = lb;

            lineColors[lineVertexIdx + 3] = lr;
            lineColors[lineVertexIdx + 4] = lg;
            lineColors[lineVertexIdx + 5] = lb;

            lineVertexIdx += 6;
          }
        }
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      // Update synaptic line buffers
      if (configRef.current.showSynapticLines) {
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineVertexIdx / 3);
      } else {
        lineGeometry.setDrawRange(0, 0);
      }

      // Slow drift of cosmic dust + Star Wars Hyperspace starfield warp
      if (warpProgress > 0.005) {
        const warpSpeed = warpProgress * 85.0 * delta;
        for (let d = 0; d < dustCount; d++) {
          dustPositions[d * 3 + 2] += warpSpeed * (1.0 + Math.abs(dustPositions[d * 3]) * 0.45);
          if (dustPositions[d * 3 + 2] > 12.0) {
            dustPositions[d * 3 + 2] = -16.0;
          }
        }
        dustGeometry.attributes.position.needsUpdate = true;
      } else {
        dustPoints.rotation.y = elapsedTime * 0.02;
      }

      // Update Star Wars Enemy Target Ships (TIE Interceptors, TIE Fighters, Droids)
      if (configRef.current.combatMode) {
        combatGroup.visible = true;
        const squadron = combatSquadronRef.current;
        for (let s = 0; s < squadron.length; s++) {
          const ship = squadron[s];
          if (ship.isDead) {
            ship.respawnTimer -= delta;
            if (ship.respawnTimer <= 0) {
              ship.isDead = false;
              ship.health = ship.maxHealth;
              ship.group.visible = true;
              const angle = Math.random() * Math.PI * 2;
              const dist = 3.8 + Math.random() * 2.5;
              ship.position.set(
                Math.cos(angle) * dist,
                (Math.random() - 0.5) * 2.8,
                Math.sin(angle) * dist
              );
              ship.group.position.copy(ship.position);
              ship.flightTimer = Math.random() * 10;
              neuralAudio.playHyperspace();
            }
            continue;
          }

          // Flight path algorithm
          ship.flightTimer += delta * ship.speed * 0.45;
          const t = ship.flightTimer;
          const r = 4.2;

          let nx = ship.position.x;
          let ny = ship.position.y;
          let nz = ship.position.z;

          if (ship.flightMode === 'orbit') {
            nx = Math.cos(t) * r;
            nz = Math.sin(t) * r;
            ny = Math.sin(t * 1.4) * 1.2;
          } else if (ship.flightMode === 'figure8') {
            nx = Math.sin(t) * (r + 0.6);
            nz = Math.sin(t * 2) * (r * 0.65);
            ny = Math.cos(t * 1.1) * 1.4;
          } else if (ship.flightMode === 'swoop') {
            nx = Math.cos(t * 0.8) * (r + Math.sin(t * 2) * 1.1);
            nz = Math.sin(t * 0.8) * (r + Math.cos(t * 2) * 1.1);
            ny = Math.sin(t * 2.2) * 1.6;
          } else {
            nx = Math.cos(t * 1.1) * r;
            nz = Math.sin(t * 0.9) * r;
            ny = Math.cos(t * 0.8) * 1.8;
          }

          const vx = nx - ship.position.x;
          const vy = ny - ship.position.y;
          const vz = nz - ship.position.z;
          ship.velocity.set(vx, vy, vz);

          ship.position.set(nx, ny, nz);
          ship.group.position.copy(ship.position);

          if (ship.velocity.lengthSq() > 0.00001) {
            const lookTarget = ship.position.clone().add(ship.velocity);
            ship.group.lookAt(lookTarget);
            ship.group.rotateZ(vx * 2.2); // Banking roll
          }

          // Subtle idle hover bobbing
          ship.group.position.y += Math.sin(elapsedTime * 4 + s) * 0.03;

          // Dynamic Enemy Attack AI Power & Aggression Scaling
          // If user destroys ships fast or maintains high combo, enemy AI escalates!
          const curAggression = calculateEnemyAggression(comboRef.current, destroyedCountRef.current, waveRef.current);
          if (curAggression !== lastAggressionRef.current) {
            lastAggressionRef.current = curAggression;
            onAggressionChange?.(curAggression);
          }

          const speedMult = curAggression === 'OVERCHARGED' ? 1.45 : curAggression === 'ELEVATED' ? 1.25 : 1.0;
          const cooldownMult = curAggression === 'OVERCHARGED' ? 0.45 : curAggression === 'ELEVATED' ? 0.68 : 1.0;
          const dynamicLockDuration = curAggression === 'OVERCHARGED' ? 1.5 : curAggression === 'ELEVATED' ? 2.1 : 2.8;
          const dynamicProjSpeed = curAggression === 'OVERCHARGED' ? 1.45 : curAggression === 'ELEVATED' ? 1.22 : 1.0;
          const coreDamageBonus = curAggression === 'OVERCHARGED' ? 8 : curAggression === 'ELEVATED' ? 4 : 0;
          const maxSimultaneousLocks = curAggression === 'OVERCHARGED' ? 2 : 1;

          // Two-Sided Dogfight & Imperial Core Strike AI
          if (!isGameOverRef.current) {
            // If EMP pulse is active, enemy firing and weapons systems are completely stunned!
            const isEmpActive = empDisabledTimerRef.current > 0;
            if (!isEmpActive) {
              ship.shootCooldown -= delta;
            }

            // Check if this ship is currently performing a Core Lock-On
            if (ship.isLockingOnCore && !isEmpActive) {
              ship.lockOnElapsed += delta;
              const timeLeft = Math.max(0, ship.lockOnDuration - ship.lockOnElapsed);

              // 2D screen projection for visible HUD targeting reticle & countdown tracking
              const proj = ship.position.clone().project(camera);
              const screenW = renderer.domElement.clientWidth || window.innerWidth;
              const screenH = renderer.domElement.clientHeight || window.innerHeight;
              const sX = ((proj.x + 1) * 0.5) * screenW;
              const sY = ((-proj.y + 1) * 0.5) * screenH;

              // Audible warning beeps at threshold seconds
              const curSec = Math.ceil(timeLeft);
              if (curSec !== lastLockBeepSecondRef.current && curSec >= 1 && curSec <= 3) {
                lastLockBeepSecondRef.current = curSec;
                neuralAudio.playLockOnBeep(curSec);
              }

              onCoreLockOnUpdate?.({
                shipId: ship.id,
                shipName: ship.name,
                enemyType: ship.type,
                timeLeft: Math.round(timeLeft * 10) / 10,
                totalTime: ship.lockOnDuration,
                screenX: sX,
                screenY: sY,
              });

              // Lock-on completed -> FIRE CHARGED RED PLASMA / INCENDIARY FIRE BOLT AT COCKPIT CORE!
              if (ship.lockOnElapsed >= ship.lockOnDuration) {
                ship.isLockingOnCore = false;
                activeLockShipIdRef.current = null;
                lastLockBeepSecondRef.current = -1;
                onCoreLockOnUpdate?.(null);

                const isFireStormSector = waveRef.current >= 2 || ship.isElite || curAggression !== 'NORMAL';
                const isHeavy = !!ship.isElite;
                const isFireBall = isFireStormSector && (isHeavy || waveRef.current >= 3);

                if (isFireStormSector) {
                  neuralAudio.playFireBlaster();
                } else {
                  neuralAudio.playCoreStrikeFired();
                }

                // Direct trajectory toward the player's cockpit center
                const camPos = camera.position;
                const aimDir = new THREE.Vector3().subVectors(camPos, ship.position).normalize();
                const speed = (ship.projectileSpeed || 28.0) * dynamicProjSpeed * (isFireBall ? 1.15 : 1.0);
                const damage = (ship.damageValue || 14) + coreDamageBonus + (isFireStormSector ? 5 : 0); // Enhanced fire damage
                const boltColor = isFireBall
                  ? new THREE.Color('#ff3d00')
                  : isFireStormSector
                  ? new THREE.Color('#ff6d00')
                  : isHeavy
                  ? new THREE.Color('#ff0033')
                  : new THREE.Color('#ff1744');

                enemyBoltsRef.current.push({
                  id: Date.now() + Math.random(),
                  pos: ship.position.clone(),
                  vel: aimDir.multiplyScalar(speed),
                  color: boltColor,
                  life: 2.4,
                  maxLife: 2.4,
                  damage,
                  isCoreStrike: true,
                  isHeavy,
                  isFireBolt: isFireStormSector,
                  isFireBall,
                  sourceShipId: ship.id,
                  sourceShipName: ship.name,
                });

                // In ELEVATED/OVERCHARGED, spawn a secondary flanking fire bolt!
                if (curAggression !== 'NORMAL') {
                  const perp = new THREE.Vector3().crossVectors(aimDir, new THREE.Vector3(0, 1, 0)).normalize();
                  [-0.35, 0.35].forEach((offset) => {
                    const spawnOffset = ship.position.clone().add(perp.clone().multiplyScalar(offset));
                    const subDir = new THREE.Vector3().subVectors(camPos, spawnOffset).normalize();
                    enemyBoltsRef.current.push({
                      id: Date.now() + Math.random(),
                      pos: spawnOffset,
                      vel: subDir.multiplyScalar(speed * 0.95),
                      color: isFireStormSector ? new THREE.Color('#ff9100') : new THREE.Color('#ff5252'),
                      life: 2.2,
                      maxLife: 2.2,
                      damage: Math.round(damage * 0.6),
                      isCoreStrike: true,
                      isHeavy: false,
                      isFireBolt: isFireStormSector,
                      sourceShipId: ship.id,
                      sourceShipName: `${ship.name} (Flank Fire)`,
                    });
                  });
                }

                ship.shootCooldown = ((ship.attackCooldown || 3.0) * cooldownMult) + Math.random() * 1.5;
              }
            } else if (ship.shootCooldown <= 0 && !isEmpActive) {
              const camPos = camera.position;
              const distToCam = ship.position.distanceTo(camPos);
              if (distToCam < 18.0) {
                // If core lock-on capacity is available, initiate target lock with dynamic duration!
                if (!activeLockShipIdRef.current) {
                  ship.isLockingOnCore = true;
                  ship.lockOnElapsed = 0;
                  ship.lockOnDuration = dynamicLockDuration;
                  activeLockShipIdRef.current = ship.id;
                  lastLockBeepSecondRef.current = Math.ceil(dynamicLockDuration);
                  neuralAudio.playLockOnBeep(3);
                } else {
                  // Other enemies fire incendiary fire bolts or plasma potshots
                  const isFireStormSector = waveRef.current >= 2 || ship.isElite || curAggression !== 'NORMAL';
                  const isFireBall = isFireStormSector && (ship.isElite || waveRef.current >= 3) && Math.random() < 0.35;

                  if (isFireStormSector) {
                    neuralAudio.playFireBlaster();
                  } else {
                    neuralAudio.playEnemyBlasterFire();
                  }

                  const isTie = ship.type.startsWith('tie');
                  const boltColor = isFireBall
                    ? new THREE.Color('#ff3d00')
                    : isFireStormSector
                    ? new THREE.Color('#ff7b00')
                    : isTie
                    ? new THREE.Color('#00e676')
                    : new THREE.Color('#38bdf8');

                  const dir = new THREE.Vector3().subVectors(camPos, ship.position).normalize();
                  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
                  const areShieldsDown = (playerShieldRef.current ?? 100) <= 0;

                  [-0.28, 0.28].forEach((offset) => {
                    const spawnPos = ship.position.clone().add(right.clone().multiplyScalar(offset));
                    const aimDir = new THREE.Vector3()
                      .subVectors(camPos, spawnPos)
                      .add(new THREE.Vector3((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.22, 0))
                      .normalize();
                    const speed = (26.0 + Math.random() * 4.0) * dynamicProjSpeed * (isFireBall ? 1.1 : 1.0);

                    enemyBoltsRef.current.push({
                      id: Date.now() + Math.random(),
                      pos: spawnPos,
                      vel: aimDir.multiplyScalar(speed),
                      color: areShieldsDown ? new THREE.Color('#ff3d00') : boltColor,
                      life: 2.0,
                      maxLife: 2.0,
                      damage: areShieldsDown ? 11 : isFireStormSector ? 10 : 8,
                      isCoreStrike: areShieldsDown, // Breaches core directly if shields are 0%!
                      isFireBolt: isFireStormSector,
                      isFireBall,
                      sourceShipId: ship.id,
                      sourceShipName: ship.name,
                    });
                  });

                  ship.shootCooldown = (2.2 * cooldownMult) + Math.random() * 1.8;
                }
              } else {
                ship.shootCooldown = 0.8;
              }
            }
          } else {
            // Stop enemy firing during game over
            if (activeLockShipIdRef.current) {
              activeLockShipIdRef.current = null;
              onCoreLockOnUpdate?.(null);
            }
          }
        }
      } else {
        combatGroup.visible = false;
      }

      // Update Star Wars Explosion Debris Particles
      const activeDebris = activeDebrisRef.current.filter((d) => d.life > 0.02);
      activeDebrisRef.current = activeDebris;

      for (let d = 0; d < maxDebris; d++) {
        if (d < activeDebris.length) {
          const p = activeDebris[d];
          p.pos.x += p.vel.x * delta;
          p.pos.y += p.vel.y * delta;
          p.pos.z += p.vel.z * delta;
          p.vel.multiplyScalar(0.95);

          p.rot.x += p.rotSpeed.x * delta;
          p.rot.y += p.rotSpeed.y * delta;
          p.rot.z += p.rotSpeed.z * delta;

          p.life -= delta / p.maxLife;

          const s = Math.max(0, p.scale * p.life);
          _pos.copy(p.pos);
          _euler.copy(p.rot);
          _quat.setFromEuler(_euler);
          _scale.set(s, s, s);
          _mat4.compose(_pos, _quat, _scale);
          debrisInstMesh.setMatrixAt(d, _mat4);

          _color.copy(p.color);
          const emission = 1.0 + p.life * 3.2; // Intense bloom flash
          _color.r *= emission;
          _color.g *= emission;
          _color.b *= emission;
          debrisInstMesh.setColorAt(d, _color);
        } else {
          _scale.set(0, 0, 0);
          _mat4.compose(_pos, _quat, _scale);
          debrisInstMesh.setMatrixAt(d, _mat4);
        }
      }
      debrisInstMesh.instanceMatrix.needsUpdate = true;
      if (debrisInstMesh.instanceColor) debrisInstMesh.instanceColor.needsUpdate = true;

      // Update Star Wars Turbolaser Blaster Bolts (Player Shots)
      let boltVertexIdx = 0;
      const activeBolts = laserBoltsRef.current.filter((b) => b.life > 0.02);
      laserBoltsRef.current = activeBolts;

      for (let b = 0; b < activeBolts.length; b++) {
        const bolt = activeBolts[b];
        bolt.x += bolt.vx * delta;
        bolt.y += bolt.vy * delta;
        bolt.z += bolt.vz * delta;
        bolt.life -= delta * 2.2;

        const streakLen = 0.04;
        boltPositions[boltVertexIdx] = bolt.x;
        boltPositions[boltVertexIdx + 1] = bolt.y;
        boltPositions[boltVertexIdx + 2] = bolt.z;

        boltPositions[boltVertexIdx + 3] = bolt.x - bolt.vx * streakLen;
        boltPositions[boltVertexIdx + 4] = bolt.y - bolt.vy * streakLen;
        boltPositions[boltVertexIdx + 5] = bolt.z - bolt.vz * streakLen;

        const emission = bolt.life * 4.5;
        boltColors[boltVertexIdx] = bolt.color.r * emission;
        boltColors[boltVertexIdx + 1] = bolt.color.g * emission;
        boltColors[boltVertexIdx + 2] = bolt.color.b * emission;

        boltColors[boltVertexIdx + 3] = bolt.color.r * emission;
        boltColors[boltVertexIdx + 4] = bolt.color.g * emission;
        boltColors[boltVertexIdx + 5] = bolt.color.b * emission;

        boltVertexIdx += 6;
      }
      boltGeometry.attributes.position.needsUpdate = true;
      boltGeometry.attributes.color.needsUpdate = true;
      boltGeometry.setDrawRange(0, boltVertexIdx / 3);

      // Update Incoming Enemy Blaster Bolts Speeding Toward Player Camera
      let eBoltVertexIdx = 0;
      const activeEBolts = enemyBoltsRef.current.filter((b) => b.life > 0.02);
      enemyBoltsRef.current = activeEBolts;

      for (let eb = 0; eb < activeEBolts.length; eb++) {
        const ebolt = activeEBolts[eb];
        ebolt.pos.addScaledVector(ebolt.vel, delta);
        ebolt.life -= delta;

        // Check if incoming bolt strikes player deflector shields or cockpit Core Reactor
        const distToCam = ebolt.pos.distanceTo(camera.position);

        // Check active Plasma Mirror Deflector power (reflects enemy bolts back at enemies!)
        if (reflectorActiveTimerRef.current > 0 && ebolt.sourceShipId !== 'player' && distToCam < 2.5) {
          ebolt.vel.multiplyScalar(-1.5);
          ebolt.color = new THREE.Color('#00f0ff');
          ebolt.sourceShipId = 'player';
          ebolt.isCoreStrike = false;
          ebolt.life = 2.4;
          neuralAudio.playPlasmaReflector();
          const proj = ebolt.pos.clone().project(camera);
          const screenW = renderer.domElement.clientWidth || window.innerWidth;
          const screenH = renderer.domElement.clientHeight || window.innerHeight;
          onDeflectionSuccess?.(75, ((proj.x + 1) * 0.5) * screenW, ((-proj.y + 1) * 0.5) * screenH, true);
          continue;
        }

        // Check if reflected bolt strikes an enemy starship
        if (ebolt.sourceShipId === 'player') {
          let hitEnemy = false;
          for (let s = 0; s < combatSquadronRef.current.length; s++) {
            const enemy = combatSquadronRef.current[s];
            if (!enemy.isDead && enemy.group.visible) {
              if (ebolt.pos.distanceTo(enemy.position) < enemy.boundingRadius * 1.5) {
                enemy.isDead = true;
                enemy.group.visible = false;
                enemy.respawnTimer = 4.0;
                const debris = createExplosionDebris(enemy.position);
                activeDebrisRef.current.push(...debris);
                const proj = enemy.position.clone().project(camera);
                const screenW = renderer.domElement.clientWidth || window.innerWidth;
                const screenH = renderer.domElement.clientHeight || window.innerHeight;
                onShipDestroyed?.({
                  points: 125,
                  screenX: ((proj.x + 1) * 0.5) * screenW,
                  screenY: ((-proj.y + 1) * 0.5) * screenH,
                  shipName: `${enemy.name} [DEFLECTOR]`,
                  isKill: true,
                  isElite: enemy.isElite,
                });
                hitEnemy = true;
                break;
              }
            }
          }
          if (hitEnemy) {
            ebolt.life = 0;
            continue;
          }
        }

        if (distToCam < 1.15) {
          const proj = ebolt.pos.clone().project(camera);
          const screenW = renderer.domElement.clientWidth || window.innerWidth;
          const screenH = renderer.domElement.clientHeight || window.innerHeight;
          const sX = ((proj.x + 1) * 0.5) * screenW;
          const sY = ((-proj.y + 1) * 0.5) * screenH;
          const areShieldsDown = (playerShieldRef.current ?? 100) <= 0;

          // Check Incendiary Fire & Thermal Burn impact
          if (ebolt.isFireBolt || ebolt.isFireBall) {
            neuralAudio.playThermalBurnImpact();
            const flameSparks = createFireSparks(ebolt.pos, !!ebolt.isFireBall);
            activeDebrisRef.current.push(...flameSparks);
            onThermalBurnTriggered?.(4.0);
          }

          if (ebolt.isCoreStrike || areShieldsDown) {
            // DIRECT COCKPIT CORE REACTOR IMPACT!
            if (!isGameOverRef.current) {
              onCoreDamage?.(
                ebolt.damage,
                !!ebolt.isHeavy,
                sX,
                sY,
                ebolt.sourceShipName || 'Imperial Core Strike'
              );
              neuralAudio.playCoreDamage(ebolt.isHeavy);
              bloomFlareRef.current = Math.min(4.5, bloomFlareRef.current + 3.2);

              // Spawn intense electrical/plasma sparks right at core impact coordinate
              const sparks = createCoreHitSparks(ebolt.pos, !!ebolt.isHeavy);
              activeDebrisRef.current.push(...sparks);

              // Violent cockpit camera shake recoil
              cameraShakeRef.current.set(
                (Math.random() - 0.5) * (ebolt.isHeavy ? 1.6 : 1.1),
                (Math.random() - 0.5) * (ebolt.isHeavy ? 1.6 : 1.1),
                (Math.random() - 0.5) * 0.75
              );
            }
          } else {
            // Deflector shield hit
            neuralAudio.playShieldDeflect();
            onPlayerShieldDamaged?.(ebolt.damage, sX, sY);

            // Moderate shield ripple camera shake
            cameraShakeRef.current.set(
              (Math.random() - 0.5) * 0.45,
              (Math.random() - 0.5) * 0.45,
              (Math.random() - 0.5) * 0.25
            );
          }

          ebolt.life = 0;
          continue;
        }

        // Segment 1: Elongated, high-visibility Star Wars blaster bolt streak
        const streakLen = ebolt.isCoreStrike ? 0.12 : 0.075;
        enemyBoltPositions[eBoltVertexIdx] = ebolt.pos.x;
        enemyBoltPositions[eBoltVertexIdx + 1] = ebolt.pos.y;
        enemyBoltPositions[eBoltVertexIdx + 2] = ebolt.pos.z;

        enemyBoltPositions[eBoltVertexIdx + 3] = ebolt.pos.x - ebolt.vel.x * streakLen;
        enemyBoltPositions[eBoltVertexIdx + 4] = ebolt.pos.y - ebolt.vel.y * streakLen;
        enemyBoltPositions[eBoltVertexIdx + 5] = ebolt.pos.z - ebolt.vel.z * streakLen;

        const emission = (ebolt.life / ebolt.maxLife) * (ebolt.isCoreStrike ? 8.2 : 5.8);
        enemyBoltColors[eBoltVertexIdx] = ebolt.color.r * emission;
        enemyBoltColors[eBoltVertexIdx + 1] = ebolt.color.g * emission;
        enemyBoltColors[eBoltVertexIdx + 2] = ebolt.color.b * emission;

        enemyBoltColors[eBoltVertexIdx + 3] = ebolt.color.r * emission * 0.6;
        enemyBoltColors[eBoltVertexIdx + 4] = ebolt.color.g * emission * 0.6;
        enemyBoltColors[eBoltVertexIdx + 5] = ebolt.color.b * emission * 0.6;

        // Segment 2: Cross-tracer head for volumetric diamond glow
        const vlen = Math.hypot(ebolt.vel.x, ebolt.vel.y, ebolt.vel.z) || 1;
        const px = (-ebolt.vel.y / vlen) * 0.085;
        const py = (ebolt.vel.x / vlen) * 0.085;

        enemyBoltPositions[eBoltVertexIdx + 6] = ebolt.pos.x - px;
        enemyBoltPositions[eBoltVertexIdx + 7] = ebolt.pos.y - py;
        enemyBoltPositions[eBoltVertexIdx + 8] = ebolt.pos.z;

        enemyBoltPositions[eBoltVertexIdx + 9] = ebolt.pos.x + px;
        enemyBoltPositions[eBoltVertexIdx + 10] = ebolt.pos.y + py;
        enemyBoltPositions[eBoltVertexIdx + 11] = ebolt.pos.z;

        // Diamond white/bright core at projectile head
        enemyBoltColors[eBoltVertexIdx + 6] = 2.5 * emission;
        enemyBoltColors[eBoltVertexIdx + 7] = 2.5 * emission;
        enemyBoltColors[eBoltVertexIdx + 8] = 2.5 * emission;

        enemyBoltColors[eBoltVertexIdx + 9] = ebolt.color.r * emission;
        enemyBoltColors[eBoltVertexIdx + 10] = ebolt.color.g * emission;
        enemyBoltColors[eBoltVertexIdx + 11] = ebolt.color.b * emission;

        eBoltVertexIdx += 12;
      }
      enemyBoltGeometry.attributes.position.needsUpdate = true;
      enemyBoltGeometry.attributes.color.needsUpdate = true;
      enemyBoltGeometry.setDrawRange(0, eBoltVertexIdx / 3);

      // Update Proton Torpedoes (Hyper Counter-Strike Homing Volley)
      let torpVertexIdx = 0;
      const activeTorps = protonTorpedoesRef.current.filter((t) => t.life > 0.02);
      protonTorpedoesRef.current = activeTorps;

      for (let t = 0; t < activeTorps.length; t++) {
        const torp = activeTorps[t];
        torp.life -= delta;

        // Target active enemy ship
        const targetShip = combatSquadronRef.current.find((s) => s.id === torp.targetShipId && !s.isDead);
        const targetPos = targetShip ? targetShip.position : torp.targetPos;

        const toTarget = new THREE.Vector3().subVectors(targetPos, torp.pos);
        const dist = toTarget.length();

        if (dist < 0.85 || (targetShip && targetShip.isDead)) {
          // Torpedo detonation!
          neuralAudio.playShipExplosion();
          neuralAudio.playPointScore(4);

          if (targetShip && !targetShip.isDead) {
            targetShip.isDead = true;
            targetShip.group.visible = false;
            targetShip.respawnTimer = 3.2;

            const debris = createExplosionDebris(targetShip.position);
            activeDebrisRef.current.push(...debris);

            const proj = targetShip.position.clone().project(camera);
            const screenW = renderer.domElement.clientWidth || window.innerWidth;
            const screenH = renderer.domElement.clientHeight || window.innerHeight;
            const sX = ((proj.x + 1) * 0.5) * screenW;
            const sY = ((-proj.y + 1) * 0.5) * screenH;

            onShipDestroyed?.({
              points: 2,
              screenX: sX,
              screenY: sY,
              shipName: `${targetShip.name} [PROTON BLAST]`,
              isKill: true,
            });
          }

          bloomFlareRef.current = Math.min(3.8, bloomFlareRef.current + 2.0);
          torp.life = 0;
          continue;
        }

        toTarget.normalize();
        torp.vel.lerp(toTarget.multiplyScalar(torp.speed), 0.14);
        torp.pos.addScaledVector(torp.vel, delta);

        torpedoPositions[torpVertexIdx] = torp.pos.x;
        torpedoPositions[torpVertexIdx + 1] = torp.pos.y;
        torpedoPositions[torpVertexIdx + 2] = torp.pos.z;

        torpedoPositions[torpVertexIdx + 3] = torp.pos.x - torp.vel.x * 0.06;
        torpedoPositions[torpVertexIdx + 4] = torp.pos.y - torp.vel.y * 0.06;
        torpedoPositions[torpVertexIdx + 5] = torp.pos.z - torp.vel.z * 0.06;

        torpedoColors[torpVertexIdx] = 2.0;
        torpedoColors[torpVertexIdx + 1] = 4.0;
        torpedoColors[torpVertexIdx + 2] = 5.0;

        torpedoColors[torpVertexIdx + 3] = 1.0;
        torpedoColors[torpVertexIdx + 4] = 2.5;
        torpedoColors[torpVertexIdx + 5] = 5.0;

        torpVertexIdx += 6;
      }
      torpedoGeometry.attributes.position.needsUpdate = true;
      torpedoGeometry.attributes.color.needsUpdate = true;
      torpedoGeometry.setDrawRange(0, torpVertexIdx / 3);

      // Update Core Reactor Energy Cell Pickups (+15% Core Energy Restore)
      const activePickups = activePickupsRef.current.filter((p) => p.life > 0.05);
      activePickupsRef.current = activePickups;

      for (let p = 0; p < maxPickups; p++) {
        if (p < activePickups.length) {
          const pickup = activePickups[p];
          pickup.pos.addScaledVector(pickup.vel, delta);
          pickup.vel.multiplyScalar(0.985); // Gentle space friction
          pickup.rot.x += pickup.rotSpeed.x * delta;
          pickup.rot.y += pickup.rotSpeed.y * delta;
          pickup.life -= delta;

          // Proximity auto-pickup if it drifts close to player's cockpit
          const dist = pickup.pos.distanceTo(camera.position);
          if (dist < 1.1) {
            pickup.life = 0;
            neuralAudio.playPickupCollect();
            const proj = pickup.pos.clone().project(camera);
            const screenW = renderer.domElement.clientWidth || window.innerWidth;
            const screenH = renderer.domElement.clientHeight || window.innerHeight;
            const sX = ((proj.x + 1) * 0.5) * screenW;
            const sY = ((-proj.y + 1) * 0.5) * screenH;
            onPickupCollected?.(sX, sY);
            continue;
          }

          const s = Math.min(1.0, pickup.life / 0.5) * 0.95;
          _pos.copy(pickup.pos);
          _euler.copy(pickup.rot);
          _quat.setFromEuler(_euler);
          _scale.set(s, s, s);
          _mat4.compose(_pos, _quat, _scale);
          pickupInstMesh.setMatrixAt(p, _mat4);
        } else {
          _scale.set(0, 0, 0);
          _mat4.compose(_pos, _quat, _scale);
          pickupInstMesh.setMatrixAt(p, _mat4);
        }
      }
      pickupInstMesh.instanceMatrix.needsUpdate = true;

      // Camera Shake Dampening
      if (cameraShakeRef.current.lengthSq() > 0.0001) {
        camera.position.add(cameraShakeRef.current);
        cameraShakeRef.current.multiplyScalar(0.82);
      }

      // Post-Processing Bloom Render
      if (configRef.current.bloomEnabled) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mousemove', handlePointerMove);

      controls.dispose();
      triangleGeometry.dispose();
      triangleMaterial.dispose();
      tetraGeom.dispose();
      tetraMat.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      boltGeometry.dispose();
      boltMaterial.dispose();
      enemyBoltGeometry.dispose();
      enemyBoltMaterial.dispose();
      torpedoGeometry.dispose();
      torpedoMaterial.dispose();
      debrisGeom.dispose();
      debrisMat.dispose();
      debrisInstMesh.dispose();
      composer.dispose();
      renderer.dispose();
      neuralAudio.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Dynamically morph 3D shape and update signature color palette
  useEffect(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    const theme = COLOR_THEMES[config.theme] || COLOR_THEMES.cyberpunk;
    const isNewShape = config.currentShape !== prevShapeRef.current;

    const targets = calculateShapeTargets(config.currentShape, nodes.length, theme);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const target = targets[i];

      node.baseX = target.x;
      node.baseY = target.y;
      node.baseZ = target.z;
      node.normalX = target.nx;
      node.normalY = target.ny;
      node.normalZ = target.nz;
      node.colorR = target.r;
      node.colorG = target.g;
      node.colorB = target.b;

      // Swirling kinetic dispersion when transforming to a new shape
      if (isNewShape) {
        const theta = Math.random() * Math.PI * 2;
        const speed = 1.3 + Math.random() * 1.8;
        node.vx += Math.cos(theta) * speed;
        node.vy += (Math.random() - 0.5) * speed;
        node.vz += Math.sin(theta) * speed;
      }
    }

    if (isNewShape) {
      prevShapeRef.current = config.currentShape;
      neuralAudio.playMorphSound();
      bloomFlareRef.current = Math.min(2.5, bloomFlareRef.current + 1.2);
    }
  }, [config.currentShape, config.theme]);

  // Audio mute sync
  useEffect(() => {
    neuralAudio.setMuted(!config.soundEnabled);
  }, [config.soundEnabled]);

  // Brainwave audio drone update
  useEffect(() => {
    if (!config.soundEnabled) return;
    let freq = 10;
    if (config.brainwave === 'gamma') freq = 40;
    else if (config.brainwave === 'beta') freq = 20;
    else if (config.brainwave === 'alpha') freq = 10;
    else if (config.brainwave === 'theta') freq = 6;
    neuralAudio.updateBrainwaveDrone(freq);
  }, [config.brainwave, config.soundEnabled]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      tabIndex={0}
    />
  );
};
