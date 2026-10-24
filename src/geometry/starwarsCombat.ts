import * as THREE from 'three';
import { EnemyShipType } from '../types';

export interface CombatShip {
  id: string;
  type: EnemyShipType;
  name: string;
  group: THREE.Group;
  hitBox: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPos: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  rollAngle: number;
  pitchAngle: number;
  flightTimer: number;
  flightMode: 'orbit' | 'swoop' | 'strafe' | 'figure8';
  boundingRadius: number;
  shieldMesh?: THREE.Mesh;
  shieldFlash: number;
  isDead: boolean;
  deathTimer: number;
  respawnTimer: number;
  // Imperial Core Strike & Two-Sided Combat Properties
  shootCooldown: number;
  missileCooldown: number;
  isTargetingPlayer: boolean;
  targetLockTimer: number;
  isLockingOnCore: boolean;
  lockOnElapsed: number;
  lockOnDuration: number;
  isElite: boolean;
  attackCooldown: number;
  projectileSpeed: number;
  damageValue: number;
  targetingBehavior: 'swoop_lock' | 'strafe_snipe' | 'heavy_barrage' | 'sensor_probe';
}

export interface EnemyMissile {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  speed: number;
  turnRate: number;
  life: number;
  maxLife: number;
  damage: number;
  isHeavy: boolean;
  sourceShipId: string;
  sourceShipName: string;
  color: THREE.Color;
  trail: THREE.Vector3[];
  boundingRadius: number;
}

export interface EnemyBlasterBolt {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  damage: number;
  isCoreStrike?: boolean;
  isHeavy?: boolean;
  isFireBolt?: boolean;      // Incendiary fire blaster bolt with flame trail
  isFireBall?: boolean;      // Heavy thermal fireball missile
  sourceShipId?: string;
  sourceShipName?: string;
}

export interface ProtonTorpedo {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  targetShipId?: string;
  targetPos: THREE.Vector3;
  speed: number;
  life: number;
  trail: THREE.Vector3[];
}

/**
 * Spawns an incoming physical homing missile launched by an enemy starfighter
 */
export function createEnemyMissile(
  origin: THREE.Vector3,
  targetPos: THREE.Vector3,
  shipId: string,
  shipName: string,
  isHeavy: boolean = false
): EnemyMissile {
  const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();
  const speed = isHeavy ? 6.5 : 8.2;
  return {
    id: Date.now() + Math.random(),
    pos: origin.clone(),
    vel: dir.clone().multiplyScalar(speed),
    speed,
    turnRate: isHeavy ? 1.8 : 2.5,
    life: 7.0,
    maxLife: 7.0,
    damage: isHeavy ? 36 : 24,
    isHeavy,
    sourceShipId: shipId,
    sourceShipName: shipName,
    color: isHeavy ? new THREE.Color('#ff0055') : new THREE.Color('#ff5500'),
    trail: [origin.clone()],
    boundingRadius: 0.95,
  };
}

export interface ExplosionParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Vector3;
  scale: number;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

/**
 * Creates holographic 3D wireframe models for Star Wars enemy target ships
 */
export function createEnemyShipMesh(type: EnemyShipType): { group: THREE.Group; hitBox: THREE.Mesh; shieldMesh: THREE.Mesh } {
  const group = new THREE.Group();

  // Signature Star Wars Imperial Colors:
  // Sleek cyan-white hull wireframes, glowing red/amber cockpit viewports & engine ion glows
  const hullMaterial = new THREE.MeshBasicMaterial({
    color: 0x93c5fd, // Light steel blue / cyan glow
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  const solarPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6, // Electric imperial blue
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  });

  const accentMaterial = new THREE.MeshBasicMaterial({
    color: 0xef4444, // Imperial red sensor / laser tips
    wireframe: false,
    transparent: true,
    opacity: 0.9,
  });

  const engineMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Twin ion engine bright cyan glow
    wireframe: false,
    transparent: true,
    opacity: 0.95,
  });

  // Invisible enlarged hit box for crisp, reliable clicking/raycasting
  const hitBoxGeometry = new THREE.SphereGeometry(1.2, 8, 8);
  const hitBoxMaterial = new THREE.MeshBasicMaterial({
    visible: false, // Only for raycaster
  });
  const hitBox = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
  hitBox.name = 'combatHitBox';
  group.add(hitBox);

  // Holographic shield bubble (flashes when hit)
  const shieldGeom = new THREE.IcosahedronGeometry(1.05, 1);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
  });
  const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
  group.add(shieldMesh);

  if (type === 'tie_interceptor') {
    // 1. Central Spherical Cockpit Pod
    const cockpitGeom = new THREE.IcosahedronGeometry(0.38, 2);
    const cockpit = new THREE.Mesh(cockpitGeom, hullMaterial);
    group.add(cockpit);

    // Front octagonal viewport window
    const viewportGeom = new THREE.CircleGeometry(0.2, 8);
    const viewportMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
    const viewport = new THREE.Mesh(viewportGeom, viewportMat);
    viewport.position.set(0, 0, 0.38);
    group.add(viewport);

    // Wing pylons
    const pylonGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
    const pylon = new THREE.Mesh(pylonGeom, hullMaterial);
    pylon.rotation.z = Math.PI / 2;
    group.add(pylon);

    // 4 Dagger-shaped Interceptor Solar Wings (pointed forward claws)
    const daggerShapes = [
      { x: 0.72, y: 0.28, rotZ: 0.22 },
      { x: 0.72, y: -0.28, rotZ: -0.22 },
      { x: -0.72, y: 0.28, rotZ: -0.22 },
      { x: -0.72, y: -0.28, rotZ: 0.22 },
    ];

    daggerShapes.forEach((cfg) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(cfg.x, cfg.y, 0);

      // Pointed arrow blade panel
      const bladeGeom = new THREE.ConeGeometry(0.24, 1.35, 4);
      bladeGeom.rotateX(Math.PI / 2);
      const blade = new THREE.Mesh(bladeGeom, solarPanelMaterial);
      blade.scale.set(0.25, 1.0, 1.0);
      wingGroup.add(blade);

      // Red laser tip
      const tipGeom = new THREE.ConeGeometry(0.04, 0.2, 4);
      tipGeom.rotateX(Math.PI / 2);
      const tip = new THREE.Mesh(tipGeom, accentMaterial);
      tip.position.set(0, 0, 0.7);
      wingGroup.add(tip);

      wingGroup.rotation.z = cfg.rotZ;
      group.add(wingGroup);
    });

    // Twin Ion Engine Thrusters (rear)
    [-0.1, 0.1].forEach((xOff) => {
      const engineGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.12, 6);
      engineGeom.rotateX(Math.PI / 2);
      const eng = new THREE.Mesh(engineGeom, engineMaterial);
      eng.position.set(xOff, 0, -0.38);
      group.add(eng);
    });
  } else if (type === 'tie_fighter') {
    // 1. Central Spherical Cockpit
    const cockpitGeom = new THREE.IcosahedronGeometry(0.38, 2);
    const cockpit = new THREE.Mesh(cockpitGeom, hullMaterial);
    group.add(cockpit);

    // Viewport
    const viewportGeom = new THREE.CircleGeometry(0.18, 8);
    const viewport = new THREE.Mesh(viewportGeom, new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true }));
    viewport.position.set(0, 0, 0.38);
    group.add(viewport);

    // Pylons
    const pylonGeom = new THREE.CylinderGeometry(0.07, 0.07, 1.25, 6);
    pylonGeom.rotateZ(Math.PI / 2);
    const pylon = new THREE.Mesh(pylonGeom, hullMaterial);
    group.add(pylon);

    // Twin Flat Hexagonal Solar Array Panels
    [-0.68, 0.68].forEach((xOff) => {
      const hexGeom = new THREE.CircleGeometry(0.72, 6);
      hexGeom.rotateY(Math.PI / 2);
      const hexPanel = new THREE.Mesh(hexGeom, solarPanelMaterial);
      hexPanel.position.set(xOff, 0, 0);
      group.add(hexPanel);

      // Central hub bracket
      const hubGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6);
      hubGeom.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeom, hullMaterial);
      hub.position.set(xOff, 0, 0);
      group.add(hub);
    });

    // Engine
    const engGeom = new THREE.SphereGeometry(0.07, 6, 6);
    const eng = new THREE.Mesh(engGeom, engineMaterial);
    eng.position.set(0, 0, -0.38);
    group.add(eng);
  } else if (type === 'tie_advanced') {
    // Darth Vader's TIE Advanced x1 (Bent Solar Panels)
    const cockpitGeom = new THREE.IcosahedronGeometry(0.4, 2);
    const cockpit = new THREE.Mesh(cockpitGeom, hullMaterial);
    group.add(cockpit);

    // Elongated rear fuselage
    const rearGeom = new THREE.CylinderGeometry(0.24, 0.18, 0.5, 6);
    rearGeom.rotateX(Math.PI / 2);
    const rear = new THREE.Mesh(rearGeom, hullMaterial);
    rear.position.set(0, 0, -0.28);
    group.add(rear);

    // Bent angled solar wings
    [-0.65, 0.65].forEach((xSide) => {
      const wingSideGroup = new THREE.Group();
      wingSideGroup.position.set(xSide, 0, 0);

      // Top bent wing
      const topGeom = new THREE.BoxGeometry(0.15, 0.45, 1.1);
      const topWing = new THREE.Mesh(topGeom, solarPanelMaterial);
      topWing.position.set(xSide > 0 ? -0.1 : 0.1, 0.32, 0);
      topWing.rotation.z = xSide > 0 ? -0.45 : 0.45;
      wingSideGroup.add(topWing);

      // Bottom bent wing
      const btmGeom = new THREE.BoxGeometry(0.15, 0.45, 1.1);
      const btmWing = new THREE.Mesh(btmGeom, solarPanelMaterial);
      btmWing.position.set(xSide > 0 ? -0.1 : 0.1, -0.32, 0);
      btmWing.rotation.z = xSide > 0 ? 0.45 : -0.45;
      wingSideGroup.add(btmWing);

      group.add(wingSideGroup);
    });

    // Twin Heavy ion engines
    [-0.12, 0.12].forEach((xOff) => {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15, 6), engineMaterial);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(xOff, 0, -0.52);
      group.add(eng);
    });
  } else {
    // Imperial Viper Probe Droid
    const domeGeom = new THREE.SphereGeometry(0.35, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const dome = new THREE.Mesh(domeGeom, hullMaterial);
    group.add(dome);

    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.28, 0.45, 8);
    const body = new THREE.Mesh(bodyGeom, hullMaterial);
    body.position.set(0, -0.25, 0);
    group.add(body);

    // Multi-optic red sensor eyes
    [
      { x: 0.15, y: -0.12, z: 0.32, r: 0.06 },
      { x: -0.16, y: -0.1, z: 0.3, r: 0.05 },
      { x: 0.0, y: -0.28, z: 0.3, r: 0.07 },
      { x: 0.25, y: -0.22, z: 0.18, r: 0.04 },
    ].forEach((opt) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(opt.r, 6, 6), accentMaterial);
      eye.position.set(opt.x, opt.y, opt.z);
      group.add(eye);
    });

    // Antenna spikes
    const antGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4);
    const ant1 = new THREE.Mesh(antGeom, hullMaterial);
    ant1.position.set(-0.12, 0.42, 0);
    group.add(ant1);

    const ant2 = new THREE.Mesh(antGeom, hullMaterial);
    ant2.position.set(0.12, 0.35, 0.1);
    ant2.scale.set(1, 0.7, 1);
    group.add(ant2);

    // Articulated sensor tentacles/arms
    [-0.15, 0, 0.15].forEach((xOff, idx) => {
      const armGeom = new THREE.CylinderGeometry(0.02, 0.01, 0.55, 4);
      const arm = new THREE.Mesh(armGeom, solarPanelMaterial);
      arm.position.set(xOff, -0.65, (idx - 1) * 0.08);
      arm.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(arm);
    });
  }

  // Tag group for easy reference
  group.userData = { type, hitBox, shieldMesh };

  return { group, hitBox, shieldMesh };
}

/**
 * Spawns an initial wave of enemy starships with distinct attack AI, speeds, and damage
 */
export function createEnemySquadron(count: number = 4, wave: number = 1): CombatShip[] {
  // As waves advance, spawn stronger squadrons with more elite TIE Advanced fighters
  let pool: EnemyShipType[] = ['tie_interceptor', 'tie_fighter', 'probe_droid', 'tie_advanced'];
  if (wave >= 3) {
    pool = ['tie_advanced', 'tie_interceptor', 'tie_advanced', 'tie_fighter', 'probe_droid'];
  } else if (wave >= 2) {
    pool = ['tie_interceptor', 'tie_fighter', 'tie_advanced', 'tie_interceptor', 'probe_droid'];
  }

  const names = {
    tie_interceptor: 'TIE Interceptor [Alpha]',
    tie_fighter: 'Imperial TIE Fighter [Vanguard]',
    tie_advanced: 'TIE Advanced x1 [Black Squadron Elite]',
    probe_droid: 'Imperial Viper Probe Droid',
  };

  const ships: CombatShip[] = [];
  // Attack frequency scales as wave advances (faster cooldowns)
  const wavePaceFactor = Math.max(0.65, 1.0 - (wave - 1) * 0.1);

  for (let i = 0; i < count; i++) {
    const type = pool[i % pool.length];
    const { group, hitBox, shieldMesh } = createEnemyShipMesh(type);

    // Initial 3D spawn positions in orbit around the scene
    const angle = (i / count) * Math.PI * 2;
    const distance = 4.2 + Math.random() * 2.2;
    const height = (Math.random() - 0.5) * 3.0;

    const posX = Math.cos(angle) * distance;
    const posY = height;
    const posZ = Math.sin(angle) * distance;

    group.position.set(posX, posY, posZ);

    const flightModes: ('orbit' | 'swoop' | 'strafe' | 'figure8')[] = ['orbit', 'swoop', 'figure8', 'strafe'];

    // Progressive Wave Difficulty Scaling:
    // Game gets noticeably harder with each successive sector (faster speeds, higher projectile velocity, thermal fire attacks!)
    const progressivePace = Math.max(0.32, 1.0 - (wave - 1) * 0.14);
    const progressiveSpeedMult = 1.0 + (wave - 1) * 0.22;
    const progressiveProjSpeedMult = 1.0 + (wave - 1) * 0.16;

    // Distinct attack AI per enemy type
    let attackCooldown = 3.2 * progressivePace;
    let projectileSpeed = 26.0 * progressiveProjSpeedMult;
    let damageValue = 14 + (wave - 1) * 2; // Harder core damage on higher waves
    let isElite = false;
    let targetingBehavior: 'swoop_lock' | 'strafe_snipe' | 'heavy_barrage' | 'sensor_probe' = 'swoop_lock';
    let baseSpeed = 2.0 * progressiveSpeedMult;

    if (type === 'tie_interceptor') {
      // Fast, agile interceptor
      attackCooldown = (2.2 + Math.random() * 1.2) * progressivePace;
      projectileSpeed = 32.0 * progressiveProjSpeedMult;
      damageValue = 14 + (wave - 1) * 2;
      targetingBehavior = 'strafe_snipe';
      baseSpeed = (2.5 + Math.random() * 0.8) * progressiveSpeedMult;
    } else if (type === 'tie_fighter') {
      // Standard imperial fighter with thermal fire cannons
      attackCooldown = (3.0 + Math.random() * 1.5) * progressivePace;
      projectileSpeed = 26.0 * progressiveProjSpeedMult;
      damageValue = 14 + (wave - 1) * 2;
      targetingBehavior = 'swoop_lock';
      baseSpeed = (2.0 + Math.random() * 0.6) * progressiveSpeedMult;
    } else if (type === 'tie_advanced') {
      // Heavy elite fighter (Vader style) - Devastating heavy thermal fireball attacks!
      attackCooldown = (3.8 + Math.random() * 1.4) * progressivePace;
      projectileSpeed = 34.0 * progressiveProjSpeedMult;
      damageValue = 24 + (wave - 1) * 3; // Extreme damage on higher waves
      isElite = true;
      targetingBehavior = 'heavy_barrage';
      baseSpeed = (2.3 + Math.random() * 0.6) * progressiveSpeedMult;
    } else if (type === 'probe_droid') {
      // Reconnaissance scout
      attackCooldown = (2.6 + Math.random() * 1.2) * progressivePace;
      projectileSpeed = 30.0 * progressiveProjSpeedMult;
      damageValue = 12 + (wave - 1) * 2;
      targetingBehavior = 'sensor_probe';
      baseSpeed = (1.6 + Math.random() * 0.5) * progressiveSpeedMult;
    }

    // Stagger initial firing cooldown so player isn't overwhelmed immediately
    const initialCooldown = 2.5 + i * 1.2 + Math.random() * 2.0;

    ships.push({
      id: `ship_${Date.now()}_${i}_${Math.random()}`,
      type,
      name: names[type],
      group,
      hitBox,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      targetPos: new THREE.Vector3(0, 0, 0),
      health: 1, // 1 direct blaster hit to destroy for fast arcade response
      maxHealth: 1,
      speed: baseSpeed,
      rollAngle: 0,
      pitchAngle: 0,
      flightTimer: i * 2.5,
      flightMode: flightModes[i % flightModes.length],
      boundingRadius: 1.1,
      shieldMesh,
      shieldFlash: 0,
      isDead: false,
      deathTimer: 0,
      respawnTimer: 0,
      shootCooldown: initialCooldown,
      missileCooldown: 4.5 + i * 2.2 + Math.random() * 3.5,
      isTargetingPlayer: false,
      targetLockTimer: 0,
      isLockingOnCore: false,
      lockOnElapsed: 0,
      lockOnDuration: 3.0, // 3-second lock-on countdown before firing
      isElite,
      attackCooldown,
      projectileSpeed,
      damageValue,
      targetingBehavior,
    });
  }

  return ships;
}

/**
 * Spawns an apocalyptic volley of homing Proton Torpedoes for the Hyper Counter-Strike
 */
export function createProtonTorpedoVolley(
  origin: THREE.Vector3,
  targets: CombatShip[]
): ProtonTorpedo[] {
  const activeTargets = targets.filter((s) => !s.isDead);
  // Balanced tactical ordnance: fires 2 targeted homing torpedoes (prevents automatic full-wave instant win)
  const count = Math.min(2, Math.max(1, activeTargets.length));
  const torpedoes: ProtonTorpedo[] = [];

  for (let i = 0; i < count; i++) {
    const target = activeTargets[i % Math.max(1, activeTargets.length)];
    const angle = (i / count) * Math.PI * 2;
    // Initial outward spread arc before homing onto target
    const spread = new THREE.Vector3(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0.5);

    torpedoes.push({
      id: Date.now() + i * 100 + Math.random(),
      pos: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 0)),
      vel: spread.clone().multiplyScalar(4.0),
      targetShipId: target?.id,
      targetPos: target ? target.position.clone() : new THREE.Vector3(0, 0, 0),
      speed: 12.0 + Math.random() * 4.0,
      life: 2.2,
      trail: [],
    });
  }

  return torpedoes;
}

/**
 * Spawns explosion debris particles when an enemy starship is destroyed
 */
export function createExplosionDebris(position: THREE.Vector3): ExplosionParticle[] {
  const particles: ExplosionParticle[] = [];
  const count = 36;

  // Star Wars fiery plasma colors: gold, electric orange, bright cyan, diamond white, imperial scarlet
  const colors = [
    new THREE.Color('#ffbe0b'),
    new THREE.Color('#fb5607'),
    new THREE.Color('#ff0055'),
    new THREE.Color('#38bdf8'),
    new THREE.Color('#00f0ff'),
    new THREE.Color('#ffffff'),
  ];

  for (let i = 0; i < count; i++) {
    // Spherical random outward blast
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 4.2 + Math.random() * 7.5;

    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    particles.push({
      pos: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)),
      vel,
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16),
      scale: 0.14 + Math.random() * 0.28,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      maxLife: 0.9 + Math.random() * 0.7,
    });
  }

  return particles;
}

export interface ActivePickup {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
}

/**
 * Spawns an energetic Core Reactor Energy Cell (+15% Core Energy restore pickup)
 */
export function createReactorPickup(position: THREE.Vector3): ActivePickup {
  return {
    id: Date.now() + Math.random(),
    pos: position.clone(),
    vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5 + 0.2, (Math.random() - 0.5) * 0.5),
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    rotSpeed: new THREE.Vector3(1.8, 2.8, 1.2),
    life: 12.0,
    maxLife: 12.0,
  };
}

export type EnemyAggressionLevel = 'NORMAL' | 'ELEVATED' | 'OVERCHARGED';

/**
 * Dynamically computes Enemy Attack AI power based on player pace, combo, and wave.
 * If user destroys ships fast or maintains high combos, enemy AI upgrades to ELEVATED or OVERCHARGED!
 */
export function calculateEnemyAggression(combo: number, destroyedCount: number, wave: number): EnemyAggressionLevel {
  if (combo >= 6 || (destroyedCount >= 14 && wave >= 2) || wave >= 4) {
    return 'OVERCHARGED';
  }
  if (combo >= 3 || destroyedCount >= 5 || wave >= 2) {
    return 'ELEVATED';
  }
  return 'NORMAL';
}

/**
 * Spawns high-energy plasma sparks and electrical arc particles when an enemy bullet hits the player core!
 */
export function createCoreHitSparks(position: THREE.Vector3, isHeavy: boolean): ExplosionParticle[] {
  const particles: ExplosionParticle[] = [];
  const count = isHeavy ? 28 : 18;
  const colors = isHeavy
    ? [new THREE.Color('#ff0033'), new THREE.Color('#ff5500'), new THREE.Color('#ffffff'), new THREE.Color('#ffd166')]
    : [new THREE.Color('#ff3838'), new THREE.Color('#ff9900'), new THREE.Color('#38bdf8'), new THREE.Color('#ffffff')];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = (isHeavy ? 6.5 : 4.2) + Math.random() * 5.0;

    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    particles.push({
      pos: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3)),
      vel,
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0),
      scale: isHeavy ? 0.22 + Math.random() * 0.2 : 0.14 + Math.random() * 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      maxLife: 0.6 + Math.random() * 0.5,
    });
  }

  return particles;
}

/**
 * Spawns intense burning fire sparks, ember particles, and flame bursts
 */
export function createFireSparks(position: THREE.Vector3, isLarge: boolean = false): ExplosionParticle[] {
  const particles: ExplosionParticle[] = [];
  const count = isLarge ? 32 : 18;
  const flameColors = [
    new THREE.Color('#ff3d00'), // Blazing red-orange
    new THREE.Color('#ff6d00'), // Fiery orange
    new THREE.Color('#ff9100'), // Amber flame
    new THREE.Color('#ffd600'), // Yellow-white flame core
    new THREE.Color('#ffffff'), // Incandescent white
  ];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = (isLarge ? 5.8 : 3.6) + Math.random() * 4.5;

    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed + 1.2, // Thermal buoyancy rise
      Math.cos(phi) * speed
    );

    particles.push({
      pos: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)),
      vel,
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 22, 0),
      scale: isLarge ? 0.24 + Math.random() * 0.24 : 0.16 + Math.random() * 0.16,
      color: flameColors[Math.floor(Math.random() * flameColors.length)],
      life: 1.0,
      maxLife: 0.55 + Math.random() * 0.45,
    });
  }

  return particles;
}


