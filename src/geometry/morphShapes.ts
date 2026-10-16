import * as THREE from 'three';
import { ColorTheme, MorphShapeId, MorphShapeInfo } from '../types';

export const MORPH_SHAPES_LIST: MorphShapeInfo[] = [
  // Core Neural
  {
    id: 'brain',
    name: '3D Neural Brain',
    subtitle: 'Anatomical Human Cortex',
    description: 'Golden-yellow temporal rim & base, electric cyan & magenta/purple convolutions, diamond-white crests',
    category: 'neural',
  },
  {
    id: 'dna',
    name: 'DNA Double Helix',
    subtitle: 'Genetic Spiral Lattice',
    description: 'Intertwined spiraling nucleotides with golden bridge rungs, violet strands, and glowing white telomeres',
    category: 'neural',
  },
  {
    id: 'heart',
    name: 'Bio-Cardiac Mesh',
    subtitle: 'Quantum Pulsing Heart',
    description: 'Cardioid anatomical ventricles with incandescent golden apex, cyan-magenta myocardium, and vascular arches',
    category: 'neural',
  },
  {
    id: 'skull',
    name: 'Cranial Cyber-Mesh',
    subtitle: 'Futuristic Cranial Topology',
    description: 'Anatomical holographic skull with golden mandible base, cyan-violet cranium vaults, and glowing orbits',
    category: 'neural',
  },

  // Star Wars Fleet & Icons
  {
    id: 'xwing',
    name: 'T-65 X-Wing Starfighter',
    subtitle: 'Incom Starfighter Corps',
    description: 'Attack position S-foils with wingtip turbolasers, cockpit canopy, and golden sublight thrust exhausts',
    category: 'starwars',
  },
  {
    id: 'falcon',
    name: 'Millennium Falcon',
    subtitle: 'YT-1300 Corellian Freighter',
    description: 'Saucer hull with forward freight mandibles, offset starboard cockpit, sensor dish, and glowing engine arc',
    category: 'starwars',
  },
  {
    id: 'tiefighter',
    name: 'Imperial TIE Interceptor',
    subtitle: 'Sienar Fleet Systems',
    description: 'Spherical command cockpit, dual wing pylons, and dagger hexagonal solar collector array wings',
    category: 'starwars',
  },
  {
    id: 'deathstar',
    name: 'Death Star Superweapon',
    subtitle: 'Orbital Battle Station',
    description: 'Equatorial trench groove, concave parabolic superlaser dish, and converging tributary green laser beams',
    category: 'starwars',
  },
  {
    id: 'stardestroyer',
    name: 'Imperial Star Destroyer',
    subtitle: 'Kuat Drive Yards Dreadnought',
    description: 'Arrowhead wedge dagger warship, dorsal command bridge tower with twin shield domes, and triple golden ion thrusters',
    category: 'starwars',
  },
  {
    id: 'atat',
    name: 'AT-AT Imperial Walker',
    subtitle: 'All Terrain Armored Transport',
    description: 'Towering armored carriage, articulated chin turbolasers, command cockpit, and quad hydraulic stomping legs',
    category: 'starwars',
  },
  {
    id: 'vader',
    name: 'Darth Vader Mask',
    subtitle: 'Sith Lord Cranial Armor',
    description: 'Iconic triangular respirator breath mask, flared blast skirt, brow ridge, and diamond-white eye visors',
    category: 'starwars',
  },
  {
    id: 'lightsaber',
    name: 'Crossed Lightsabers',
    subtitle: 'Jedi vs Sith Plasma Clash',
    description: 'Intersecting chrome hilts with crackling cyan and magenta plasma energy blades clashing at center',
    category: 'starwars',
  },

  // Cosmic & Quantum
  {
    id: 'galaxy',
    name: 'Spiral Galaxy',
    subtitle: 'Cosmic Nebula Disk',
    description: 'Logarithmic spiral arms swirling outwards from an intense golden supermassive core into violet space',
    category: 'cosmic',
  },
  {
    id: 'torus',
    name: 'Hyper-Dimensional Torus',
    subtitle: 'Quantum Energy Vortex',
    description: 'Continuously circulating toroidal ring with radiant golden inner event horizon and cyber cyan outer hull',
    category: 'cosmic',
  },
  {
    id: 'sphere',
    name: 'Celestial Dyson Sphere',
    subtitle: 'Planetary Biosphere Cage',
    description: 'Geodesic holographic sphere with golden southern core, cyan-purple orbital rings, and diamond polar caps',
    category: 'cosmic',
  },
];

export interface ShapeTarget {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Calculates target 3D positions, normals, and colors for any selected 3D morph shape.
 * Always maintains the user's signature color palette:
 * - Intense golden-yellow base/rim
 * - Electric cyan & magenta/purple body
 * - Diamond-white highlights
 */
export function calculateShapeTargets(
  shapeId: MorphShapeId,
  count: number,
  theme: ColorTheme
): ShapeTarget[] {
  const targets: ShapeTarget[] = [];

  const baseCol = new THREE.Color(theme.baseColor);       // Golden-yellow
  const midCol = new THREE.Color(theme.midColor);         // Electric cyan / teal
  const highCol = new THREE.Color(theme.highColor);       // Magenta / purple
  const coreCol = new THREE.Color(theme.coreColor);       // Diamond white
  const ambientCol = new THREE.Color(theme.ambientColor); // Warm amber

  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio for spherical distribution

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    let nx = 0;
    let ny = 1;
    let nz = 0;
    const c = new THREE.Color();

    const t = i / (count - 1); // Normalized 0 to 1
    const isAccent = i > count * 0.94; // floating perimeter particles

    switch (shapeId) {
      case 'brain': {
        // Anatomical Brain (identical to baseline generator)
        const yNorm = 1 - t * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
        const theta = 2 * Math.PI * i / phi;

        let x0 = Math.cos(theta) * radiusAtY + (Math.random() - 0.5) * 0.08;
        let y0 = yNorm + (Math.random() - 0.5) * 0.08;
        let z0 = Math.sin(theta) * radiusAtY + (Math.random() - 0.5) * 0.08;

        const sideSign = x0 >= 0 ? 1 : -1;
        let bx = x0 * 1.35;
        let by = y0 * 1.15;
        let bz = z0 * 1.65;

        // Longitudinal fissure
        const cleftDist = Math.abs(x0);
        const cleftDip = Math.exp(-cleftDist * cleftDist / 0.035) * 0.38;
        if (by > -0.4) {
          by -= cleftDip * 0.6;
          bx = sideSign * (Math.abs(bx) + 0.08 * (1 - Math.exp(-cleftDist * 4)));
        }

        // Temporal bulges
        const temporalFactor = Math.exp(-Math.pow(bz - 0.1, 2) / 0.4) * Math.exp(-Math.pow(by + 0.2, 2) / 0.35);
        bx += sideSign * temporalFactor * 0.28;
        by -= temporalFactor * 0.12;

        // Cerebellum
        const cerebellumFactor = Math.exp(-Math.pow(bz + 0.8, 2) / 0.3) * Math.exp(-Math.pow(by + 0.6, 2) / 0.25);
        bx += sideSign * cerebellumFactor * 0.15;
        by -= cerebellumFactor * 0.18;
        bz -= cerebellumFactor * 0.15;

        // Gyri and Sulci folds
        const foldFreq = 7.5;
        const gyrus = Math.sin(bx * foldFreq) * Math.cos(by * foldFreq) * Math.sin(bz * foldFreq) * 0.07;

        let depth = isAccent ? 1.18 + Math.random() * 0.3 : 0.94 + Math.random() * 0.14;
        x = (bx + gyrus * Math.sign(bx)) * depth;
        y = (by + gyrus) * depth;
        z = (bz + gyrus) * depth;

        if (y < -0.85 && Math.abs(x) < 0.4 && Math.abs(z + 0.2) < 0.4) {
          x *= 0.6;
          z = z * 0.6 - 0.1;
        }

        const norm = new THREE.Vector3(x, y + 0.1, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;

        // Color aesthetic: intense golden-yellow bottom rim, cyan/magenta gyri, diamond white highlights
        const isBaseRim = y < -0.35 || (y < -0.15 && Math.abs(x) > 0.85);
        if (isBaseRim) {
          const goldMix = Math.random();
          if (goldMix < 0.65) c.copy(baseCol);
          else if (goldMix < 0.85) c.copy(ambientCol);
          else c.copy(coreCol);
        } else {
          const mixVal = Math.sin(z * 2.5 + x * 3.0) * 0.5 + 0.5;
          if (Math.abs(gyrus) > 0.05) {
            c.copy(coreCol).lerp(midCol, 0.2);
          } else if (mixVal > 0.55) {
            c.copy(highCol).lerp(coreCol, Math.random() * 0.35);
          } else {
            c.copy(midCol).lerp(highCol, Math.random() * 0.3);
          }
          if (Math.random() < 0.12) c.copy(baseCol);
        }
        break;
      }

      case 'dna': {
        // Double Helix with spiral backbone and horizontal nucleotide rungs
        const turns = 4.2;
        const height = 3.6;
        const radius = 1.05;
        const isRung = i % 5 === 0;

        const theta = (t * turns * Math.PI * 2);
        const strandSign = (i % 2 === 0) ? 1 : -1;
        const strandAngle = theta + (strandSign === 1 ? 0 : Math.PI);

        if (isRung) {
          // Horizontal base-pair cross-rung bridging between strand 1 and strand 2
          const bridgeProgress = (Math.random() * 2 - 1) * 0.9;
          x = radius * Math.cos(theta) * bridgeProgress;
          y = (t - 0.5) * height;
          z = radius * Math.sin(theta) * bridgeProgress;
          c.copy(baseCol).lerp(coreCol, Math.random() * 0.5); // Golden bridge rung
        } else {
          // Helical spiral backbone
          const jitter = (Math.random() - 0.5) * 0.12;
          x = (radius + jitter) * Math.cos(strandAngle);
          y = (t - 0.5) * height + (Math.random() - 0.5) * 0.08;
          z = (radius + jitter) * Math.sin(strandAngle);

          // Lower section has golden glow, mid has cyan and purple, top has white highlights
          if (y < -0.7) {
            c.copy(baseCol).lerp(ambientCol, Math.random() * 0.4);
          } else if (strandSign === 1) {
            c.copy(midCol).lerp(coreCol, Math.random() * 0.3);
          } else {
            c.copy(highCol).lerp(coreCol, Math.random() * 0.35);
          }
        }

        const norm = new THREE.Vector3(x, 0, z).normalize();
        nx = norm.x;
        ny = (Math.random() - 0.5) * 0.2;
        nz = norm.z;
        break;
      }

      case 'heart': {
        // 3D Cardioid Anatomical Heart
        const u = (t * Math.PI * 2) - Math.PI;
        const v = Math.PI * (Math.sin(i * 1.3) * 0.5 + 0.5) - Math.PI / 2;

        // Cardioid 3D equations
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);

        let hx = 16 * Math.pow(sinU, 3);
        let hy = 13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
        let hz = Math.sin(v) * (Math.abs(sinU) * 8 + 2);

        const heartScale = 0.11;
        x = hx * heartScale + (Math.random() - 0.5) * 0.1;
        y = (hy * heartScale * 1.1) + 0.2 + (Math.random() - 0.5) * 0.1;
        z = hz * heartScale * 0.7 + (Math.random() - 0.5) * 0.1;

        const norm = new THREE.Vector3(x, y - 0.1, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;

        // Lower pointed apex glows intense golden-yellow, ventricular body is magenta/cyan, aorta arch is diamond white
        if (y < -0.45) {
          c.copy(baseCol).lerp(ambientCol, Math.random() * 0.4);
        } else if (y > 0.8) {
          c.copy(coreCol).lerp(highCol, 0.2); // White aortic arch
        } else if (x > 0) {
          c.copy(highCol).lerp(coreCol, Math.random() * 0.3);
        } else {
          c.copy(midCol).lerp(coreCol, Math.random() * 0.25);
        }
        break;
      }

      case 'torus': {
        // Hyperspace Torus Vortex Ring
        const majorR = 1.6;
        const minorR = 0.65;
        const u = (i * 0.18) % (Math.PI * 2);
        const v = (t * Math.PI * 2 * 6) % (Math.PI * 2);

        const jitter = (Math.random() - 0.5) * 0.1;
        x = (majorR + (minorR + jitter) * Math.cos(v)) * Math.cos(u);
        y = (minorR + jitter) * Math.sin(v) * 0.9;
        z = (majorR + (minorR + jitter) * Math.cos(v)) * Math.sin(u);

        const ringCenter = new THREE.Vector3(majorR * Math.cos(u), 0, majorR * Math.sin(u));
        const norm = new THREE.Vector3(x, y, z).sub(ringCenter).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;

        // Inner rim glows golden-yellow, outer crown alternates cyan and purple, diamond white highlights
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < majorR - 0.15) {
          c.copy(baseCol).lerp(ambientCol, Math.random() * 0.3); // Golden inner ring
        } else if (y > 0.3) {
          c.copy(coreCol).lerp(midCol, 0.3);
        } else if (Math.sin(u * 2) > 0) {
          c.copy(midCol).lerp(coreCol, 0.2);
        } else {
          c.copy(highCol).lerp(coreCol, 0.25);
        }
        break;
      }

      case 'sphere': {
        // Celestial Dyson Sphere with Orbital Rings
        const isOrbitRing = i % 8 === 0;
        if (isOrbitRing) {
          // Equator / celestial ring
          const ringTheta = Math.random() * Math.PI * 2;
          const ringR = 2.1 + (Math.random() - 0.5) * 0.35;
          const tilt = 0.45;
          x = ringR * Math.cos(ringTheta);
          y = ringR * Math.sin(ringTheta) * Math.sin(tilt);
          z = ringR * Math.sin(ringTheta) * Math.cos(tilt);
          c.copy(baseCol).lerp(coreCol, Math.random() * 0.4); // Golden orbit ring
        } else {
          // Fibonacci sphere surface with latitude wave modulation
          const yNorm = 1 - t * 2;
          const rAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
          const theta = 2 * Math.PI * i / phi;
          const sphereR = 1.65 + Math.sin(yNorm * 12 + theta * 3) * 0.05;

          x = sphereR * Math.cos(theta) * rAtY;
          y = sphereR * yNorm;
          z = sphereR * Math.sin(theta) * rAtY;

          // South pole glows golden-yellow, equator is cyan/purple, north pole is white
          if (y < -0.7) {
            c.copy(baseCol).lerp(ambientCol, Math.random() * 0.35);
          } else if (y > 1.1) {
            c.copy(coreCol).lerp(midCol, 0.2);
          } else if (Math.sin(theta * 3) > 0) {
            c.copy(midCol).lerp(coreCol, 0.2);
          } else {
            c.copy(highCol).lerp(coreCol, 0.2);
          }
        }

        const norm = new THREE.Vector3(x, y, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'galaxy': {
        // Spiral Galaxy with 4 Logarithmic Arms & Bulging Core
        const isCore = i < count * 0.22;
        if (isCore) {
          // Bulging central supermassive core
          const r = Math.pow(Math.random(), 2) * 0.75;
          const theta = Math.random() * Math.PI * 2;
          const phiCore = (Math.random() - 0.5) * Math.PI;
          x = r * Math.cos(phiCore) * Math.cos(theta);
          y = r * Math.sin(phiCore) * 0.6;
          z = r * Math.cos(phiCore) * Math.sin(theta);

          c.copy(baseCol).lerp(coreCol, Math.random() * 0.6); // Incandescent golden core
        } else {
          // 4 logarithmic spiral arms
          const armIndex = i % 4;
          const armAngleOffset = (armIndex * Math.PI) / 2;
          const radius = 0.6 + Math.pow(t, 0.7) * 2.2;
          const spiralAngle = radius * 3.2 + armAngleOffset;
          const spread = 0.28 * (radius / 2.5);

          x = radius * Math.cos(spiralAngle) + (Math.random() - 0.5) * spread;
          y = ((Math.random() - 0.5) * 0.25) * Math.exp(-radius * 0.4);
          z = radius * Math.sin(spiralAngle) + (Math.random() - 0.5) * spread;

          // Arms transition from gold near core to cyan, magenta, and bright white star clusters
          if (radius < 1.1) {
            c.copy(baseCol).lerp(midCol, Math.random() * 0.4);
          } else if (armIndex % 2 === 0) {
            c.copy(midCol).lerp(coreCol, Math.random() * 0.35);
          } else {
            c.copy(highCol).lerp(coreCol, Math.random() * 0.4);
          }
        }

        const norm = new THREE.Vector3(x, y + 0.3, z).normalize();
        nx = norm.x;
        ny = 0.8;
        nz = norm.z;
        break;
      }

      case 'skull': {
        // Holographic Cyber-Skull Cranial Topology
        const yNorm = 1 - t * 2;
        const theta = 2 * Math.PI * i / phi;
        const sideSign = Math.cos(theta) >= 0 ? 1 : -1;

        let sx = Math.cos(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
        let sy = yNorm;
        let sz = Math.sin(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));

        let kx = sx * 1.25;
        let ky = sy * 1.35;
        let kz = sz * 1.45;

        // Flatten back and sides, taper front jaw
        if (ky < -0.2) {
          // Mandible / jaw taper
          kx *= 0.65;
          kz = kz * 0.8 + 0.35;
        }

        // Eye socket indents (orbits)
        const eyeX = Math.abs(kx) - 0.45;
        const eyeY = ky - 0.08;
        const eyeDist = Math.sqrt(eyeX * eyeX + eyeY * eyeY);
        if (eyeDist < 0.32 && kz > 0.4) {
          kz -= (0.32 - eyeDist) * 1.4;
        }

        // Nasal cavity indent
        if (Math.abs(kx) < 0.18 && ky > -0.25 && ky < -0.05 && kz > 0.6) {
          kz -= 0.3;
        }

        x = kx + (Math.random() - 0.5) * 0.08;
        y = ky + (Math.random() - 0.5) * 0.08;
        z = kz + (Math.random() - 0.5) * 0.08;

        const norm = new THREE.Vector3(x, y, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;

        // Jaw / teeth base glows intense golden-yellow, cranium is cyan-violet, eye orbits flash diamond white
        if (y < -0.35) {
          c.copy(baseCol).lerp(ambientCol, Math.random() * 0.4);
        } else if (eyeDist < 0.35 && kz > 0.2) {
          c.copy(coreCol).lerp(midCol, 0.15); // Diamond white eye orbits
        } else if (Math.sin(x * 4 + z * 2) > 0) {
          c.copy(midCol).lerp(coreCol, 0.2);
        } else {
          c.copy(highCol).lerp(coreCol, 0.25);
        }
        break;
      }

      case 'xwing': {
        // T-65 X-Wing Starfighter in Attack Position
        if (i < count * 0.28) {
          // Fuselage nose cone, cockpit canopy, and fuselage spine
          const fusZ = (t / 0.28) * 3.6 - 1.2; // -1.2 (rear) to +2.4 (nose)
          const taper = Math.max(0.08, 1 - (fusZ + 1.2) / 3.6);
          const fusAngle = Math.random() * Math.PI * 2;
          const fusR = (0.28 * taper) + (Math.random() - 0.5) * 0.05;

          x = fusR * Math.cos(fusAngle);
          y = fusR * Math.sin(fusAngle) * 0.8;
          z = fusZ;

          // Canopy bulge
          if (fusZ > 0.1 && fusZ < 0.8) {
            y += 0.14 * Math.sin((fusZ - 0.1) / 0.7 * Math.PI);
            c.copy(coreCol).lerp(midCol, 0.2); // White cockpit glass
          } else if (fusZ > 1.8) {
            c.copy(highCol).lerp(coreCol, 0.3); // Nose tip
          } else {
            c.copy(midCol).lerp(highCol, 0.2);
          }
        } else if (i < count * 0.68) {
          // 4 Split S-foil Attack Wings in 'X' Formation
          const wingIdx = i % 4; // 0: Top-R, 1: Top-L, 2: Bot-R, 3: Bot-L
          const signX = wingIdx % 2 === 0 ? 1 : -1;
          const signY = wingIdx < 2 ? 1 : -1;
          const wingSpan = 0.35 + Math.random() * 2.0; // 0.35 to 2.35 span
          const wingChord = (Math.random() - 0.5) * 0.8 - 0.35; // z position

          x = signX * wingSpan;
          y = signY * (0.25 + wingSpan * 0.32); // Dihedral attack angle
          z = wingChord;

          // Wings alternate cyan and purple with white leading edge
          if (Math.abs(x) > 2.1) {
            c.copy(baseCol); // Wingtip launcher base
          } else if (wingIdx < 2) {
            c.copy(midCol).lerp(coreCol, Math.random() * 0.3);
          } else {
            c.copy(highCol).lerp(coreCol, Math.random() * 0.3);
          }
        } else if (i < count * 0.84) {
          // 4 Wingtip Laser Cannon Barrels extending forward
          const cannonIdx = i % 4;
          const signX = cannonIdx % 2 === 0 ? 1 : -1;
          const signY = cannonIdx < 2 ? 1 : -1;
          const cannonZ = -0.4 + Math.random() * 2.4; // -0.4 to +2.0

          x = signX * 2.35 + (Math.random() - 0.5) * 0.06;
          y = signY * (0.25 + 2.35 * 0.32) + (Math.random() - 0.5) * 0.06;
          z = cannonZ;

          if (cannonZ > 1.6) {
            c.copy(coreCol); // Radiant muzzle tip
          } else {
            c.copy(midCol).lerp(baseCol, 0.3);
          }
        } else {
          // 4 Cylindrical Sublight Ion Engine Exhaust Nozzles
          const engIdx = i % 4;
          const signX = engIdx % 2 === 0 ? 1 : -1;
          const signY = engIdx < 2 ? 1 : -1;
          const engAngle = Math.random() * Math.PI * 2;
          const engR = 0.16 + Math.random() * 0.06;

          x = signX * 0.55 + engR * Math.cos(engAngle);
          y = signY * 0.28 + engR * Math.sin(engAngle);
          z = -1.1 - Math.random() * 0.45;

          c.copy(baseCol).lerp(ambientCol, Math.random() * 0.3); // Incandescent golden thruster exhaust
        }

        const norm = new THREE.Vector3(x, y, z - 0.2).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'falcon': {
        // Millennium Falcon (YT-1300 Corellian Freighter)
        if (i < count * 0.48) {
          // Circular Saucer Hull
          const hullR = Math.sqrt(Math.random()) * 1.65;
          const hullAngle = Math.random() * Math.PI * 2;
          x = hullR * Math.cos(hullAngle);
          y = (Math.random() - 0.5) * 0.32 * Math.cos((hullR / 1.65) * (Math.PI / 2));
          z = hullR * Math.sin(hullAngle) * 0.95;

          // Turret bubbles at center
          if (hullR < 0.35) {
            y += Math.sign(y || 1) * 0.2;
            c.copy(coreCol).lerp(midCol, 0.2);
          } else if (Math.sin(hullAngle * 4) > 0) {
            c.copy(midCol).lerp(highCol, 0.3);
          } else {
            c.copy(highCol).lerp(midCol, 0.2);
          }
        } else if (i < count * 0.72) {
          // Forward Cargo Mandibles with central freight notch
          const isRightMandible = (i % 2 === 0);
          const mandX = isRightMandible ? (0.4 + Math.random() * 0.55) : (-0.4 - Math.random() * 0.55);
          const mandZ = 0.95 + Math.random() * 1.45; // extends forward to +2.4
          const mandY = (Math.random() - 0.5) * 0.26;

          x = mandX;
          y = mandY;
          z = mandZ;

          if (mandZ > 2.1) {
            c.copy(coreCol).lerp(baseCol, 0.4); // Mandible tip headlights
          } else {
            c.copy(midCol).lerp(coreCol, 0.2);
          }
        } else if (i < count * 0.85) {
          // Starboard Cockpit Pod & Access Corridor
          const podZ = 0.5 + Math.random() * 0.85;
          const podAngle = Math.random() * Math.PI * 2;
          const podR = 0.18 + Math.random() * 0.05;

          x = 1.45 + podR * Math.cos(podAngle);
          y = podR * Math.sin(podAngle) * 0.8;
          z = podZ;

          if (podZ > 1.1) {
            c.copy(coreCol); // Conical cockpit glass
          } else {
            c.copy(highCol).lerp(midCol, 0.3);
          }
        } else {
          // Rear Sublight Engine Exhaust Arc & Radar Dish
          if (i % 6 === 0) {
            // Rectangular/Round sensor dish on dorsal port
            const dishAngle = Math.random() * Math.PI * 2;
            x = -0.65 + 0.25 * Math.cos(dishAngle);
            y = 0.35 + (Math.random() - 0.5) * 0.08;
            z = 0.35 + 0.25 * Math.sin(dishAngle);
            c.copy(coreCol);
          } else {
            // Glowing blue/golden sublight engine slit at rear
            const arcTheta = (Math.random() - 0.5) * Math.PI * 0.65;
            x = 1.55 * Math.sin(arcTheta);
            y = (Math.random() - 0.5) * 0.12;
            z = -1.5 - Math.random() * 0.25;

            c.copy(baseCol).lerp(ambientCol, Math.random() * 0.35); // Golden engine glow
          }
        }

        const norm = new THREE.Vector3(x, y + 0.1, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'tiefighter': {
        // Imperial TIE Interceptor / Fighter
        if (i < count * 0.26) {
          // Central Eyeball Cockpit Pod (Sphere)
          const podTheta = Math.random() * Math.PI * 2;
          const podPhi = (Math.random() - 0.5) * Math.PI;
          const podR = 0.65 + (Math.random() - 0.5) * 0.05;

          x = podR * Math.cos(podPhi) * Math.cos(podTheta);
          y = podR * Math.sin(podPhi);
          z = podR * Math.cos(podPhi) * Math.sin(podTheta);

          // Transparisteel front viewport
          if (z > 0.45 && Math.abs(x) < 0.35 && Math.abs(y) < 0.35) {
            c.copy(coreCol).lerp(midCol, 0.2); // White octagonal window
          } else if (z < -0.45) {
            c.copy(baseCol); // Golden ion drive emitter
          } else {
            c.copy(highCol).lerp(midCol, 0.25);
          }
        } else if (i < count * 0.38) {
          // Horizontal Wing Pylons connecting sphere to solar wings
          const pylonSide = (i % 2 === 0) ? 1 : -1;
          const pylonDist = 0.65 + Math.random() * 1.15; // 0.65 to 1.8

          x = pylonSide * pylonDist;
          y = (Math.random() - 0.5) * 0.16;
          z = (Math.random() - 0.5) * 0.16;

          c.copy(midCol).lerp(coreCol, 0.2);
        } else {
          // Dagger Hexagonal Solar Array Wings (Left & Right)
          const wingSide = (i % 2 === 0) ? 1 : -1;
          const isWingBorder = (i % 5 === 0);

          // Interceptor dagger profile: pointed forward and backward
          const wingH = (Math.random() - 0.5) * 3.8; // -1.9 to +1.9
          const maxZAtH = (1 - Math.abs(wingH) / 2.2) * 2.2;
          const wingZ = (Math.random() - 0.5) * maxZAtH * 2;

          x = wingSide * 1.8 + (Math.random() - 0.5) * 0.08;
          y = wingH;
          z = wingZ;

          if (isWingBorder || Math.abs(wingH) > 1.6) {
            c.copy(coreCol).lerp(midCol, 0.3); // Structural solar border
          } else if (wingSide === 1) {
            c.copy(midCol).lerp(highCol, 0.3); // Solar panel cells
          } else {
            c.copy(highCol).lerp(midCol, 0.3);
          }

          // Laser cannon tips at wing points
          if (wingZ > 1.4 && Math.abs(wingH) > 0.9) {
            c.copy(baseCol);
          }
        }

        const norm = new THREE.Vector3(x, y, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'deathstar': {
        // DS-1 Orbital Battle Station (Death Star)
        const isSuperlaser = i >= count * 0.68 && i < count * 0.86;
        const isBeams = i >= count * 0.86;

        if (isBeams) {
          // 8 Converging Tributary Superlaser Beams focusing to a point
          const beamIdx = i % 8;
          const beamAngle = (beamIdx * Math.PI) / 4;
          const beamProgress = Math.random(); // 0 (rim) to 1 (focal point)
          const dishRimX = 0.55 + 0.5 * Math.cos(beamAngle);
          const dishRimY = 0.55 + 0.5 * Math.sin(beamAngle);
          const dishRimZ = 1.15;
          const focalX = 0.65;
          const focalY = 0.65;
          const focalZ = 2.1;

          x = THREE.MathUtils.lerp(dishRimX, focalX, beamProgress);
          y = THREE.MathUtils.lerp(dishRimY, focalY, beamProgress);
          z = THREE.MathUtils.lerp(dishRimZ, focalZ, beamProgress);

          if (beamProgress > 0.85) {
            c.copy(coreCol); // Blinding white focal convergence
          } else {
            c.copy(midCol).lerp(baseCol, 0.2); // Intense emerald/cyan superlaser
          }
        } else if (isSuperlaser) {
          // Concave Parabolic Superlaser Dish (Northern hemisphere)
          const dishR = Math.sqrt(Math.random()) * 0.52;
          const dishAngle = Math.random() * Math.PI * 2;
          const dishCenter = new THREE.Vector3(0.55, 0.55, 1.15);

          x = dishCenter.x + dishR * Math.cos(dishAngle);
          y = dishCenter.y + dishR * Math.sin(dishAngle);
          // Parabolic depression dipping inward
          const dishDepth = Math.pow(1 - (dishR / 0.52), 2) * 0.22;
          z = dishCenter.z - dishDepth;

          c.copy(midCol).lerp(coreCol, 0.35); // Superlaser bowl
        } else {
          // Main Battle Station Sphere with Equatorial Super-Trench
          const yNorm = 1 - t * 2;
          const theta = 2 * Math.PI * i / phi;
          let sphereR = 1.7;

          // Equatorial Trench indent
          if (Math.abs(yNorm) < 0.08) {
            sphereR -= 0.22; // Deep equatorial trench groove
          }

          x = sphereR * Math.cos(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
          y = sphereR * yNorm;
          z = sphereR * Math.sin(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));

          if (Math.abs(yNorm) < 0.08) {
            c.copy(baseCol).lerp(ambientCol, 0.3); // Golden trench lights
          } else if (yNorm < -0.4) {
            c.copy(baseCol).lerp(highCol, 0.3); // South hemisphere
          } else {
            c.copy(highCol).lerp(midCol, Math.random() * 0.4);
          }
        }

        const norm = new THREE.Vector3(x, y, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'vader': {
        // Darth Vader Imperial Cranial Armor / Mask
        const yNorm = 1 - t * 2;
        const theta = 2 * Math.PI * i / phi;

        if (yNorm > 0.05) {
          // Hemispherical Helmet Dome & Flared Skirt
          const domeR = 1.35;
          let kx = domeR * Math.cos(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
          let ky = yNorm * 1.25;
          let kz = domeR * Math.sin(theta) * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));

          // Flare skirt outward at the back and sides
          if (kz < 0.1) {
            const flare = Math.pow(1 - yNorm, 2) * 0.65;
            kx *= (1 + flare * 0.4);
            kz -= flare * 0.5;
            ky -= flare * 0.3;
          }

          x = kx;
          y = ky;
          z = kz;

          c.copy(highCol).lerp(coreCol, Math.random() * 0.25);
        } else if (i % 3 === 0) {
          // Triangular Respirator Breath Mask
          const maskH = (yNorm + 0.6) / 0.65; // 0 (bottom) to 1 (bridge)
          const maskWidth = (1 - maskH) * 0.55;
          const maskZ = 0.55 + Math.random() * 0.35;

          x = (Math.random() * 2 - 1) * maskWidth;
          y = yNorm * 1.1;
          z = maskZ;

          if (yNorm < -0.45) {
            c.copy(baseCol); // Atmospheric intake tusks
          } else {
            c.copy(coreCol).lerp(midCol, 0.25);
          }
        } else {
          // Brow Ridge, Cheek Tubes & Angular Eye Visors
          const side = Math.cos(theta) >= 0 ? 1 : -1;
          const eyeDist = Math.sqrt(Math.pow(Math.abs(Math.cos(theta) * 0.8) - 0.38, 2) + Math.pow(yNorm - 0.05, 2));

          x = side * (0.35 + Math.random() * 0.4);
          y = yNorm * 1.1;
          z = 0.55 + Math.random() * 0.3;

          if (eyeDist < 0.3) {
            c.copy(coreCol); // White specular eye reflection
          } else if (yNorm < -0.3) {
            c.copy(baseCol).lerp(ambientCol, 0.3);
          } else {
            c.copy(midCol).lerp(highCol, 0.3);
          }
        }

        const norm = new THREE.Vector3(x, y, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'lightsaber': {
        // Crossed Plasma Lightsabers (Jedi Cyan vs Sith Magenta)
        const isSaber1 = i % 2 === 0;
        const angle = isSaber1 ? (Math.PI / 4) : (-Math.PI / 4); // +45 deg vs -45 deg
        const length = (Math.random() - 0.35) * 4.2; // -1.5 (hilt) to +2.7 (tip)

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        if (length < 0) {
          // Cylindrical Chrome Mechanical Hilt
          const hiltR = 0.12 + Math.random() * 0.06;
          const hiltAngle = Math.random() * Math.PI * 2;
          const hiltX = length * cosA + hiltR * Math.cos(hiltAngle) * sinA;
          const hiltY = length * sinA - hiltR * Math.cos(hiltAngle) * cosA;
          const hiltZ = hiltR * Math.sin(hiltAngle);

          x = hiltX;
          y = hiltY;
          z = hiltZ;

          c.copy(baseCol).lerp(ambientCol, 0.35); // Golden brass hilt emitter & pommel
        } else {
          // Radiant Crackling Plasma Energy Blade
          const bladeR = 0.06 + Math.random() * 0.08 * (1 + (length / 2.7) * 0.5);
          const bladeAngle = Math.random() * Math.PI * 2;
          const bladeX = length * cosA + bladeR * Math.cos(bladeAngle) * sinA;
          const bladeY = length * sinA - bladeR * Math.cos(bladeAngle) * cosA;
          const bladeZ = bladeR * Math.sin(bladeAngle);

          x = bladeX;
          y = bladeY;
          z = bladeZ;

          // Blade 1 is Cyan, Blade 2 is Magenta/Purple, intersection is blinding white
          const distFromClash = Math.abs(length);
          if (distFromClash < 0.25) {
            c.copy(coreCol); // Blinding white clash point
          } else if (isSaber1) {
            c.copy(midCol).lerp(coreCol, 0.4); // Electric cyan plasma
          } else {
            c.copy(highCol).lerp(coreCol, 0.35); // Sith magenta blade
          }
        }

        const norm = new THREE.Vector3(x, y, z + 0.1).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'stardestroyer': {
        // Imperial I-Class Star Destroyer (Kuat Drive Yards)
        if (i < count * 0.54) {
          // Main Triangular Wedge Arrowhead Hull
          const zProgress = Math.random(); // 0 (stern) to 1 (bow tip)
          const sternZ = -1.8;
          const bowZ = 2.4;
          const fusZ = THREE.MathUtils.lerp(sternZ, bowZ, Math.pow(zProgress, 0.9));
          const tZ = (fusZ - sternZ) / (bowZ - sternZ); // 0 at stern, 1 at bow
          const halfWidth = 1.95 * (1 - tZ);
          const fusX = (Math.random() * 2 - 1) * halfWidth;
          const isUpper = Math.random() > 0.5;
          const slope = isUpper ? 1 : -1;
          const fusY = slope * (0.24 * (1 - tZ * 0.65) + (Math.random() - 0.5) * 0.05);

          x = fusX;
          y = fusY;
          z = fusZ;

          // Ventral reactor dome / hangar bay
          if (!isUpper && fusZ > -0.7 && fusZ < 0.3 && Math.abs(fusX) < 0.45) {
            y -= 0.16;
            c.copy(baseCol).lerp(ambientCol, 0.3); // Golden ventral hangar lights
          } else if (Math.abs(fusX) > halfWidth * 0.92) {
            c.copy(coreCol).lerp(midCol, 0.3); // Perimeter rim trench
          } else if (isUpper) {
            c.copy(midCol).lerp(highCol, Math.random() * 0.35);
          } else {
            c.copy(highCol).lerp(midCol, Math.random() * 0.3);
          }
        } else if (i < count * 0.76) {
          // Dorsal Stepped Bridge Superstructure & Command Tower
          const bridgeZ = -1.25 + Math.random() * 0.85; // -1.25 to -0.4
          const isShieldGlobe = (i % 7 === 0);

          if (isShieldGlobe) {
            // Twin Deflector Shield Generator Spheres
            const side = (i % 2 === 0) ? 1 : -1;
            const globeAngle = Math.random() * Math.PI * 2;
            const globePhi = (Math.random() - 0.5) * Math.PI;
            const globeR = 0.13;
            x = side * 0.45 + globeR * Math.cos(globePhi) * Math.cos(globeAngle);
            y = 1.05 + globeR * Math.sin(globePhi);
            z = -0.55 + globeR * Math.cos(globePhi) * Math.sin(globeAngle);
            c.copy(coreCol); // Radiant diamond-white shield globes
          } else {
            // Stepped terraces rising to bridge
            const terraceH = 0.3 + Math.random() * 0.6;
            const widthAtH = (1 - (terraceH - 0.3) / 0.6) * 0.65;
            x = (Math.random() * 2 - 1) * widthAtH;
            y = terraceH;
            z = bridgeZ;

            if (y > 0.82 && Math.abs(x) < 0.3) {
              c.copy(midCol).lerp(coreCol, 0.3); // Command bridge viewport strip
            } else {
              c.copy(highCol).lerp(midCol, 0.25);
            }
          }
        } else if (i < count * 0.92) {
          // Triple Primary Sublight Ion Thrusters at Transom
          const engineIdx = i % 3; // 0: Center, 1: Port, 2: Starboard
          const engAngle = Math.random() * Math.PI * 2;
          const engR = (engineIdx === 0 ? 0.28 : 0.23) * Math.sqrt(Math.random());

          let engCenterX = 0;
          let engCenterY = 0;
          if (engineIdx === 1) engCenterX = -0.85;
          if (engineIdx === 2) engCenterX = 0.85;

          x = engCenterX + engR * Math.cos(engAngle);
          y = engCenterY + engR * Math.sin(engAngle) * 0.9;
          z = -1.82 - Math.random() * 0.45;

          c.copy(baseCol).lerp(ambientCol, Math.random() * 0.25); // Incandescent golden thruster plumes
        } else {
          // Dorsal Turbolaser Cannon Batteries & Sensor Spines
          const batterySide = (i % 2 === 0) ? 1 : -1;
          const batteryZ = -0.4 + Math.random() * 0.9;
          x = batterySide * (0.55 + Math.random() * 0.35);
          y = 0.32 + Math.random() * 0.12;
          z = batteryZ;

          c.copy(coreCol).lerp(baseCol, 0.3); // Golden turbolaser muzzles
        }

        const norm = new THREE.Vector3(x, y + 0.1, z - 0.2).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }

      case 'atat': {
        // AT-AT Imperial All-Terrain Armored Transport
        if (i < count * 0.36) {
          // Main Armored Carriage Hull (Box Chassis)
          const hullX = (Math.random() * 2 - 1) * 0.65;
          const hullY = 0.45 + Math.random() * 0.95; // 0.45 to 1.4
          const hullZ = -1.25 + Math.random() * 2.15; // -1.25 to 0.9

          x = hullX;
          y = hullY;
          z = hullZ;

          // Side armor bevels
          if (Math.abs(hullX) > 0.55) {
            c.copy(highCol).lerp(midCol, Math.random() * 0.3);
          } else if (hullY > 1.3) {
            c.copy(midCol).lerp(coreCol, 0.25);
          } else {
            c.copy(highCol).lerp(midCol, 0.2);
          }
        } else if (i < count * 0.52) {
          // Articulated Cockpit Head & Flexible Neck
          const isNeck = (i % 4 === 0);
          if (isNeck) {
            // Flexible cylindrical neck ring
            const neckZ = 0.9 + Math.random() * 0.42;
            const neckAngle = Math.random() * Math.PI * 2;
            const neckR = 0.22;
            x = neckR * Math.cos(neckAngle);
            y = 0.88 + neckR * Math.sin(neckAngle);
            z = neckZ;
            c.copy(midCol);
          } else {
            // Cockpit Head Armor
            const headZ = 1.32 + Math.random() * 0.82; // 1.32 to 2.14
            const headT = (headZ - 1.32) / 0.82;
            const headW = 0.46 * (1 - headT * 0.25);
            const headH = 0.42 * (1 - headT * 0.2);

            x = (Math.random() * 2 - 1) * headW;
            y = 0.88 + (Math.random() * 2 - 1) * headH;
            z = headZ;

            // Front red/white command viewport slit
            if (headZ > 1.95 && Math.abs(x) < 0.32 && Math.abs(y - 0.92) < 0.12) {
              c.copy(coreCol); // Blinding white cockpit viewport
            } else if (headZ > 1.8 && y < 0.7) {
              c.copy(baseCol); // Golden chin heavy blaster cannons
            } else {
              c.copy(midCol).lerp(highCol, 0.3);
            }
          }
        } else {
          // 4 Massive Articulated Hydraulic Walking Legs
          const legIdx = i % 4; // 0: Front-R, 1: Front-L, 2: Rear-R, 3: Rear-L
          const signX = (legIdx % 2 === 0) ? 1 : -1;
          const signZ = (legIdx < 2) ? 1 : -1;
          const legCenterZ = signZ === 1 ? 0.65 : -0.95;
          const legCenterX = signX * 0.68;

          // Leg vertical range from hip (0.45) down to footpad (-1.75)
          const legY = 0.45 - Math.random() * 2.2; // 0.45 down to -1.75

          if (legY < -1.55) {
            // Circular Heavy Stomping Footpad
            const footR = Math.sqrt(Math.random()) * 0.36;
            const footAngle = Math.random() * Math.PI * 2;
            x = legCenterX + footR * Math.cos(footAngle);
            y = -1.72 + (Math.random() - 0.5) * 0.08;
            z = legCenterZ + footR * Math.sin(footAngle);

            c.copy(baseCol).lerp(ambientCol, Math.random() * 0.3); // Golden footpad rim
          } else if (legY > -0.55 && legY < -0.3) {
            // Articulated Knee Knuckle Joint (disc)
            const kneeR = 0.18 + Math.random() * 0.06;
            const kneeAngle = Math.random() * Math.PI * 2;
            x = legCenterX + kneeR * Math.cos(kneeAngle);
            y = legY;
            z = legCenterZ + kneeR * Math.sin(kneeAngle);

            c.copy(coreCol).lerp(midCol, 0.3);
          } else {
            // Leg Shaft Struts
            const strutR = 0.11 + (Math.random() - 0.5) * 0.04;
            const strutAngle = Math.random() * Math.PI * 2;
            x = legCenterX + strutR * Math.cos(strutAngle);
            y = legY;
            z = legCenterZ + strutR * Math.sin(strutAngle);

            if (legY < -1.0) {
              c.copy(baseCol).lerp(midCol, 0.4); // Golden lower shin
            } else {
              c.copy(highCol).lerp(midCol, 0.3);
            }
          }
        }

        const norm = new THREE.Vector3(x, y + 0.5, z).normalize();
        nx = norm.x;
        ny = norm.y;
        nz = norm.z;
        break;
      }
    }

    targets.push({
      x,
      y,
      z,
      nx,
      ny,
      nz,
      r: c.r,
      g: c.g,
      b: c.b,
    });
  }

  return targets;
}
