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
 * Spawns an initial wave of enemy starships
 */
export function createEnemySquadron(count: number = 4): CombatShip[] {
  const types: EnemyShipType[] = ['tie_interceptor', 'tie_fighter', 'tie_advanced', 'probe_droid'];
  const names = {
    tie_interceptor: 'TIE Interceptor [Alpha]',
    tie_fighter: 'Imperial TIE Fighter [Vanguard]',
    tie_advanced: 'TIE Advanced x1 [Black Squadron]',
    probe_droid: 'Imperial Viper Probe Droid',
  };

  const ships: CombatShip[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
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

    ships.push({
      id: `ship_${Date.now()}_${i}_${Math.random()}`,
      type,
      name: names[type],
      group,
      hitBox,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      targetPos: new THREE.Vector3(0, 0, 0),
      health: 1, // 1 direct blaster hit to destroy for fast, responsive arcade fun!
      maxHealth: 1,
      speed: 1.8 + Math.random() * 1.4,
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
    });
  }

  return ships;
}

/**
 * Spawns explosion debris particles when an enemy starship is destroyed
 */
export function createExplosionDebris(position: THREE.Vector3): ExplosionParticle[] {
  const particles: ExplosionParticle[] = [];
  const count = 32;

  // Star Wars fiery plasma colors: gold, electric orange, bright cyan, diamond white
  const colors = [
    new THREE.Color('#ffbe0b'),
    new THREE.Color('#fb5607'),
    new THREE.Color('#ff006e'),
    new THREE.Color('#38bdf8'),
    new THREE.Color('#ffffff'),
  ];

  for (let i = 0; i < count; i++) {
    // Spherical random outward blast
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 3.5 + Math.random() * 6.0;

    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    particles.push({
      pos: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)),
      vel,
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12),
      scale: 0.12 + Math.random() * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      maxLife: 0.8 + Math.random() * 0.6,
    });
  }

  return particles;
}
