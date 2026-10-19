import * as THREE from 'three';
import { BrainNode, ColorTheme, ColorThemeId } from '../types';

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  layer7x: {
    id: 'layer7x',
    name: '7LayerX Tactical',
    description: 'Dark charcoal, subdued teal & emerald depths with signature lime highlights',
    baseColor: '#283231',
    midColor: '#10b981',
    highColor: '#d2f27c',
    coreColor: '#eef2ef',
    ambientColor: '#151c1d',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neural Cyberpunk',
    description: 'Gold base, electric cyan & magenta gyri, diamond highlights (as in reference)',
    baseColor: '#ffb703',     // Golden yellow
    midColor: '#06d6a0',      // Cyan/Teal
    highColor: '#a855f7',     // Purple/Magenta
    coreColor: '#ffffff',     // Diamond white
    ambientColor: '#fb8500',
  },
  solarGold: {
    id: 'solarGold',
    name: 'Solar Synapse',
    description: 'Golden incandescent amber, sunfire flare, pure white cores',
    baseColor: '#d97706',
    midColor: '#f59e0b',
    highColor: '#fde047',
    coreColor: '#ffffff',
    ambientColor: '#b45309',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Astral Amethyst',
    description: 'Deep cosmic violet, electric lavender, neon magenta',
    baseColor: '#7c3aed',
    midColor: '#c084fc',
    highColor: '#f43f5e',
    coreColor: '#ffffff',
    ambientColor: '#4c1d95',
  },
  matrix: {
    id: 'matrix',
    name: 'Bio-Matrix',
    description: 'Synaptic emerald, neon lime, phosphorescent cyan',
    baseColor: '#10b981',
    midColor: '#06b6d4',
    highColor: '#84cc16',
    coreColor: '#ffffff',
    ambientColor: '#047857',
  },
  iceQuantum: {
    id: 'iceQuantum',
    name: 'Quantum Cryo',
    description: 'Glacial cyan, sapphire blue, cryogenic white',
    baseColor: '#0284c7',
    midColor: '#38bdf8',
    highColor: '#a5f3fc',
    coreColor: '#ffffff',
    ambientColor: '#0369a1',
  },
};

/**
 * Generate anatomical 3D brain cloud points with gyri folds,
 * hemispheric fissure, lobes, and realistic normal vectors.
 */
export function generateBrainNodes(count: number = 4200, themeId: ColorThemeId = 'cyberpunk'): BrainNode[] {
  const nodes: BrainNode[] = [];
  const theme = COLOR_THEMES[themeId] || COLOR_THEMES.cyberpunk;

  const baseCol = new THREE.Color(theme.baseColor);
  const midCol = new THREE.Color(theme.midColor);
  const highCol = new THREE.Color(theme.highColor);
  const coreCol = new THREE.Color(theme.coreColor);
  const ambientCol = new THREE.Color(theme.ambientColor);

  // Fibonacci sphere sampling with anatomical deformation
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

  for (let i = 0; i < count; i++) {
    // Determine if this is an outer cortex node, interior neural tract, or floating accent particle
    const isFloating = i > count * 0.94; // ~6% are floating cosmic triangles around perimeter
    const isInterior = !isFloating && i < count * 0.22; // ~22% are inner subcortical tracts

    // Spherical coordinates with Fibonacci spiral distribution
    const yNorm = 1 - (i / (count - 1)) * 2; // from 1 down to -1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = 2 * Math.PI * i / phi;

    let x0 = Math.cos(theta) * radiusAtY;
    let y0 = yNorm;
    let z0 = Math.sin(theta) * radiusAtY;

    // Determine hemisphere: left (x < 0) or right (x > 0)
    // Add small random jitter for organic distribution
    x0 += (Math.random() - 0.5) * 0.08;
    y0 += (Math.random() - 0.5) * 0.08;
    z0 += (Math.random() - 0.5) * 0.08;

    const hemisphere: 'left' | 'right' = x0 >= 0 ? 'right' : 'left';
    const sideSign = x0 >= 0 ? 1 : -1;

    // Anatomical Brain Scaling:
    // Brain is roughly an ellipsoid: wider in back, tapered in front, flattened at base
    let sx = 1.35; // lateral width
    let sy = 1.15; // height
    let sz = 1.65; // anterior-posterior length

    let bx = x0 * sx;
    let by = y0 * sy;
    let bz = z0 * sz;

    // 1. Longitudinal Fissure (deep valley separating left and right hemispheres)
    const cleftDist = Math.abs(x0);
    const cleftDip = Math.exp(-cleftDist * cleftDist / 0.035) * 0.38;
    if (by > -0.4) {
      by -= cleftDip * 0.6;
      bx = sideSign * (Math.abs(bx) + 0.08 * (1 - Math.exp(-cleftDist * 4)));
    }

    // 2. Temporal Lobes (bulges laterally and downward in the middle)
    const temporalFactor = Math.exp(-Math.pow(bz - 0.1, 2) / 0.4) * Math.exp(-Math.pow(by + 0.2, 2) / 0.35);
    bx += sideSign * temporalFactor * 0.28;
    by -= temporalFactor * 0.12;

    // 3. Cerebellum (postero-inferior bulge at the back bottom)
    const cerebellumFactor = Math.exp(-Math.pow(bz + 0.8, 2) / 0.3) * Math.exp(-Math.pow(by + 0.6, 2) / 0.25);
    bx += sideSign * cerebellumFactor * 0.15;
    by -= cerebellumFactor * 0.18;
    bz -= cerebellumFactor * 0.15;

    // 4. Gyri and Sulci (convoluted brain surface folds using multi-octave harmonic noise)
    const foldFreq = 7.5;
    const gyrus1 = Math.sin(bx * foldFreq) * Math.cos(by * foldFreq) * Math.sin(bz * foldFreq);
    const gyrus2 = Math.cos(bx * foldFreq * 1.8 + 1.2) * Math.sin(bz * foldFreq * 1.8);
    const foldAmplitude = isInterior ? 0.03 : 0.09;
    const foldDisplacement = (gyrus1 * 0.6 + gyrus2 * 0.4) * foldAmplitude;

    // 5. Interior vs Cortex depth
    let depthScale = 1.0;
    if (isInterior) {
      depthScale = 0.45 + Math.random() * 0.45;
    } else if (isFloating) {
      depthScale = 1.08 + Math.random() * 0.35;
    } else {
      depthScale = 0.92 + Math.random() * 0.16;
    }

    let finalX = (bx + foldDisplacement * Math.sign(bx)) * depthScale;
    let finalY = (by + foldDisplacement) * depthScale;
    let finalZ = (bz + foldDisplacement) * depthScale;

    // Brainstem taper at base
    if (finalY < -0.85 && Math.abs(finalX) < 0.4 && Math.abs(finalZ + 0.2) < 0.4) {
      finalX *= 0.6;
      finalZ = finalZ * 0.6 - 0.1;
    }

    // Determine anatomical lobe for coloring & pulses
    let lobe: BrainNode['lobe'] = 'parietal';
    if (finalY < -0.65 && finalZ < -0.3) {
      lobe = 'cerebellum';
    } else if (finalY < -0.75) {
      lobe = 'stem';
    } else if (finalY < -0.15 && Math.abs(finalX) > 0.85) {
      lobe = 'temporal';
    } else if (finalZ > 0.5) {
      lobe = 'frontal';
    } else if (finalZ < -0.6) {
      lobe = 'occipital';
    }

    // Normal vector pointing outward from brain center
    const centerNorm = new THREE.Vector3(finalX, finalY + 0.1, finalZ);
    centerNorm.normalize();

    // Color computation matching screenshot:
    // - Bottom / Temporal rim & stem: intense Golden Yellow / Amber
    // - Lateral mid-cortex: Cyan & Mint
    // - Superior / Frontal / Parietal: Violet & Magenta
    // - Surface peaks / Highlights: Pure white
    const c = new THREE.Color();
    const heightFactor = (finalY + 1.2) / 2.3; // 0 (bottom) to 1 (top)
    const isBaseRim = finalY < -0.35 || lobe === 'temporal' || lobe === 'cerebellum' || lobe === 'stem';
    const foldPeak = (foldDisplacement + foldAmplitude) / (foldAmplitude * 2);

    if (isBaseRim) {
      // Golden yellow / amber rim
      const goldMix = Math.random();
      if (goldMix < 0.65) {
        c.copy(baseCol); // Vibrant yellow/gold
      } else if (goldMix < 0.85) {
        c.copy(ambientCol); // Warm amber
      } else {
        c.copy(coreCol); // White sparkle
      }
    } else {
      // Mid & upper gyri: mix of cyan, purple, and white highlights
      const mixVal = Math.sin(finalZ * 2.5 + finalX * 3.0) * 0.5 + 0.5;
      if (foldPeak > 0.72) {
        // High ridge highlight -> White/pale platinum
        c.copy(coreCol).lerp(midCol, 0.2);
      } else if (mixVal > 0.55) {
        // Purple / magenta
        c.copy(highCol).lerp(coreCol, Math.random() * 0.35);
      } else {
        // Electric cyan / teal
        c.copy(midCol).lerp(highCol, Math.random() * 0.3);
      }

      // Add occasional gold spark in the upper folds for richness (as seen in screenshots)
      if (Math.random() < 0.12) {
        c.copy(baseCol);
      }
    }

    // Scale variation: floating accent particles are larger, core particles tighter
    let baseScale = 0.08 + Math.random() * 0.08;
    if (isFloating) {
      baseScale = 0.14 + Math.random() * 0.18; // Large floating accent triangles
    } else if (isBaseRim) {
      baseScale = 0.07 + Math.random() * 0.06;
    }

    // Scatter direction for quantum explosion
    const scatterDir = new THREE.Vector3(
      finalX + (Math.random() - 0.5) * 1.5,
      finalY + (Math.random() - 0.5) * 1.5,
      finalZ + (Math.random() - 0.5) * 1.5
    ).normalize();
    const scatterDist = 2.5 + Math.random() * 4.0;

    nodes.push({
      index: i,
      baseX: finalX,
      baseY: finalY,
      baseZ: finalZ,
      x: finalX,
      y: finalY,
      z: finalZ,
      vx: 0,
      vy: 0,
      vz: 0,
      hemisphere,
      lobe,
      normalX: centerNorm.x,
      normalY: centerNorm.y,
      normalZ: centerNorm.z,
      scale: baseScale,
      baseScale,
      colorR: c.r,
      colorG: c.g,
      colorB: c.b,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      rotSpeed: 0.4 + Math.random() * 1.2,
      scatterOffsetX: scatterDir.x * scatterDist,
      scatterOffsetY: scatterDir.y * scatterDist,
      scatterOffsetZ: scatterDir.z * scatterDist,
      charge: 0,
    });
  }

  return nodes;
}
