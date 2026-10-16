import * as THREE from 'three';

/**
 * Creates a planar hollow equilateral triangle geometry with crisp borders,
 * matching the holographic triangles in the user's reference images.
 */
export function createHollowTriangleGeometry(radius: number = 0.12, borderRatio: number = 0.28): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  
  const rOuter = radius;
  const rInner = radius * (1 - borderRatio);

  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // Outer 3 vertices (equilateral triangle pointing up)
  const o0 = [0, rOuter, 0];
  const o1 = [-rOuter * cos30, -rOuter * sin30, 0];
  const o2 = [rOuter * cos30, -rOuter * sin30, 0];

  // Inner 3 vertices
  const i0 = [0, rInner, 0];
  const i1 = [-rInner * cos30, -rInner * sin30, 0];
  const i2 = [rInner * cos30, -rInner * sin30, 0];

  // 3 trapezoidal border strips: (o0, o1, i1, i0), (o1, o2, i2, i1), (o2, o0, i0, i2)
  // Each trapezoid has 2 triangles (6 vertices)
  const positions: number[] = [
    // Strip 1: o0 -> o1
    ...o0, ...o1, ...i1,
    ...o0, ...i1, ...i0,

    // Strip 2: o1 -> o2
    ...o1, ...o2, ...i2,
    ...o1, ...i2, ...i1,

    // Strip 3: o2 -> o0
    ...o2, ...o0, ...i0,
    ...o2, ...i0, ...i2,

    // Back-facing copy for crisp two-sided rendering with opposing normals
    ...o0, ...i1, ...o1,
    ...o0, ...i0, ...i1,

    ...o1, ...i2, ...o2,
    ...o1, ...i1, ...i2,

    ...o2, ...i0, ...o0,
    ...o2, ...i2, ...i0,
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates a wireframe 3D hollow tetrahedron for floating accent crystals
 */
export function createTetrahedronFrameGeometry(radius: number = 0.2): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const a = radius;
  // Tetrahedron vertices
  const v0 = [a, a, a];
  const v1 = [-a, -a, a];
  const v2 = [-a, a, -a];
  const v3 = [a, -a, -a];

  // Wireframe edges as line segments or thin triangular faces
  const edges = [
    ...v0, ...v1,
    ...v1, ...v2,
    ...v2, ...v0,
    ...v0, ...v3,
    ...v1, ...v3,
    ...v2, ...v3,
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
  return geom;
}
