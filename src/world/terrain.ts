import * as THREE from 'three';

export class Terrain {
  public mesh: THREE.Mesh;
  public readonly size: number = 400;
  public readonly segments: number = 120;

  constructor() {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    const sandColor = new THREE.Color(0xd8b18a);
    const rockColor = new THREE.Color(0x8a7055);
    const veinColor = new THREE.Color(0x3aa598); // Notum cyan mineral trace
    const deepRock = new THREE.Color(0x56473b);

    const tempColor = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = this.getHeight(x, z);
      positions.setY(i, y);

      // Vertex color blending based on height, slope, and mineral pockets
      const norm = this.getNormal(x, z);
      const slope = 1.0 - norm.y; // 0 is flat, 1 is vertical cliff

      if (slope > 0.4) {
        tempColor.copy(rockColor).lerp(deepRock, (slope - 0.4) * 1.5);
      } else {
        tempColor.copy(sandColor);
        // Add subtle notum vein variations
        const veinNoise = Math.sin(x * 0.1) * Math.cos(z * 0.1);
        if (veinNoise > 0.75) {
          tempColor.lerp(veinColor, (veinNoise - 0.75) * 2.0);
        }
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
  }

  public getHeight(x: number, z: number): number {
    // Boundary cliffs outside 160m
    const distFromCenter = Math.max(Math.abs(x), Math.abs(z));
    let edgeCliff = 0;
    if (distFromCenter > 160) {
      const t = (distFromCenter - 160) / 35;
      edgeCliff = Math.min(30, t * t * 25);
    }

    // Corporate Outpost plateau near (0, -60), radius 35m
    const distToCorp = Math.hypot(x - 0, z - (-60));
    let corpPlateauWeight = 0;
    if (distToCorp < 40) {
      corpPlateauWeight = 1.0 - Math.min(1.0, distToCorp / 40);
      corpPlateauWeight = corpPlateauWeight * corpPlateauWeight * (3 - 2 * corpPlateauWeight);
    }

    // Clan Canyon depression near (-80, 70), radius 40m
    const distToClan = Math.hypot(x - (-80), z - 70);
    let clanCanyonDepth = 0;
    if (distToClan < 45) {
      const t = 1.0 - Math.min(1.0, distToClan / 45);
      clanCanyonDepth = -4.5 * t * t;
    }

    // Processing Facility terrace near (85, 45)
    const distToProc = Math.hypot(x - 85, z - 45);
    let procTerraceWeight = 0;
    if (distToProc < 35) {
      const t = 1.0 - Math.min(1.0, distToProc / 35);
      procTerraceWeight = t * t;
    }

    // Dunes and terrain swells
    const d1 = Math.sin(x * 0.02 + z * 0.015) * 3.0;
    const d2 = Math.cos(x * 0.04 - z * 0.035) * 1.5;
    const d3 = Math.sin(x * 0.08 + z * 0.06) * 0.6;
    const dunes = d1 + d2 + d3;

    // Blend: flatten areas around structures
    const naturalHeight = dunes + clanCanyonDepth;
    const corpBase = 3.0;
    const procBase = 1.5;

    let finalH = naturalHeight;
    finalH = THREE.MathUtils.lerp(finalH, corpBase, corpPlateauWeight * 0.95);
    finalH = THREE.MathUtils.lerp(finalH, procBase, procTerraceWeight * 0.9);
    finalH += edgeCliff;

    return finalH;
  }

  public getNormal(x: number, z: number, out?: THREE.Vector3): THREE.Vector3 {
    const target = out || new THREE.Vector3();
    const eps = 0.5;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);

    target.set(hL - hR, 2 * eps, hD - hU).normalize();
    return target;
  }
}
