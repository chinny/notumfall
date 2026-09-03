import * as THREE from 'three';
import { Capsule, clamp, closestPointOnAABB } from '../core/math';

export interface BoxCollider {
  type: 'box';
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface TriangleCollider {
  type: 'triangle';
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  normal: THREE.Vector3;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export type Collider = BoxCollider | TriangleCollider;

export interface CollisionResult {
  collided: boolean;
  normal: THREE.Vector3;
  depth: number;
}

export class PhysicsWorld {
  private colliders: Collider[] = [];
  public maxSlopeCos: number = Math.cos(THREE.MathUtils.degToRad(45)); // ~0.7071
  public stepHeight: number = 0.4;
  public heightfield?: (x: number, z: number) => { height: number; normal: THREE.Vector3 };

  addBox(min: THREE.Vector3, max: THREE.Vector3): BoxCollider {
    const box: BoxCollider = {
      type: 'box',
      min: min.clone(),
      max: max.clone()
    };
    this.colliders.push(box);
    return box;
  }

  addTriangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): TriangleCollider {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();
    const min = new THREE.Vector3(
      Math.min(a.x, b.x, c.x),
      Math.min(a.y, b.y, c.y),
      Math.min(a.z, b.z, c.z)
    );
    const max = new THREE.Vector3(
      Math.max(a.x, b.x, c.x),
      Math.max(a.y, b.y, c.y),
      Math.max(a.z, b.z, c.z)
    );
    const tri: TriangleCollider = { type: 'triangle', a, b, c, normal, min, max };
    this.colliders.push(tri);
    return tri;
  }

  clear() {
    this.colliders = [];
  }

  getColliders(): readonly Collider[] {
    return this.colliders;
  }

  // Segment vs AABB closest points
  private testSegmentBox(
    start: THREE.Vector3,
    end: THREE.Vector3,
    box: BoxCollider
  ): { distSq: number; pSeg: THREE.Vector3; pBox: THREE.Vector3 } {
    const d = new THREE.Vector3().subVectors(end, start);
    const lenSq = d.lengthSq();
    const tCandidates: number[] = [0, 1];

    if (lenSq > 1e-8) {
      const checkAxis = (s: number, dir: number, bound: number) => {
        if (Math.abs(dir) > 1e-6) {
          const t = (bound - s) / dir;
          if (t >= 0 && t <= 1) tCandidates.push(t);
        }
      };
      checkAxis(start.x, d.x, box.min.x);
      checkAxis(start.x, d.x, box.max.x);
      checkAxis(start.y, d.y, box.min.y);
      checkAxis(start.y, d.y, box.max.y);
      checkAxis(start.z, d.z, box.min.z);
      checkAxis(start.z, d.z, box.max.z);
    }

    let minDistSq = Infinity;
    let bestPSeg = start.clone();
    let bestPBox = box.min.clone();
    const tempP = new THREE.Vector3();
    const tempBox = new THREE.Vector3();

    for (const t of tCandidates) {
      tempP.copy(start).addScaledVector(d, t);
      closestPointOnAABB(tempP, box.min, box.max, tempBox);
      const distSq = tempP.distanceToSquared(tempBox);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        bestPSeg.copy(tempP);
        bestPBox.copy(tempBox);
      }
    }

    return { distSq: minDistSq, pSeg: bestPSeg, pBox: bestPBox };
  }

  // Segment vs Triangle
  private testSegmentTriangle(
    start: THREE.Vector3,
    end: THREE.Vector3,
    tri: TriangleCollider
  ): { distSq: number; pSeg: THREE.Vector3; pTri: THREE.Vector3 } {
    // Sample along segment for robust closest point
    const steps = 4;
    let minDistSq = Infinity;
    let bestPSeg = start.clone();
    let bestPTri = tri.a.clone();
    const tempP = new THREE.Vector3();
    const tempTri = new THREE.Vector3();

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      tempP.lerpVectors(start, end, t);
      this.closestPointOnTriangle(tempP, tri.a, tri.b, tri.c, tempTri);
      const distSq = tempP.distanceToSquared(tempTri);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        bestPSeg.copy(tempP);
        bestPTri.copy(tempTri);
      }
    }
    return { distSq: minDistSq, pSeg: bestPSeg, pTri: bestPTri };
  }

  private closestPointOnTriangle(
    p: THREE.Vector3,
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    out: THREE.Vector3
  ): THREE.Vector3 {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const ap = new THREE.Vector3().subVectors(p, a);
    const d1 = ab.dot(ap);
    const d2 = ac.dot(ap);
    if (d1 <= 0 && d2 <= 0) return out.copy(a);

    const bp = new THREE.Vector3().subVectors(p, b);
    const d3 = ab.dot(bp);
    const d4 = ac.dot(bp);
    if (d3 >= 0 && d4 <= d3) return out.copy(b);

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      return out.copy(a).addScaledVector(ab, v);
    }

    const cp = new THREE.Vector3().subVectors(p, c);
    const d5 = ab.dot(cp);
    const d6 = ac.dot(cp);
    if (d6 >= 0 && d5 <= d6) return out.copy(c);

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      return out.copy(a).addScaledVector(ac, w);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
      const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      return out.copy(b).addScaledVector(new THREE.Vector3().subVectors(c, b), w);
    }

    const denom = 1.0 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;
    return out.copy(a).addScaledVector(ab, v).addScaledVector(ac, w);
  }

  // Capsule collision check & resolve
  resolveCapsule(
    capsule: Capsule,
    velocity: THREE.Vector3,
    canStepUp: boolean = true
  ): { grounded: boolean; stepped: boolean } {
    let grounded = false;
    let stepped = false;
    const footY = capsule.start.y - capsule.radius;

    // Up to 4 iterations for solid corner resolution
    for (let iter = 0; iter < 4; iter++) {
      let collidedAny = false;

      if (this.heightfield) {
        const hData = this.heightfield(capsule.start.x, capsule.start.z);
        const floorY = hData.height + capsule.radius;
        if (capsule.start.y < floorY) {
          const diff = floorY - capsule.start.y;
          if (hData.normal.y >= this.maxSlopeCos) {
            capsule.start.y = floorY;
            capsule.end.y += diff;
            grounded = true;
            if (velocity.y < 0) velocity.y = 0;
          } else {
            const horizNorm = new THREE.Vector3(hData.normal.x, 0, hData.normal.z).normalize();
            if (horizNorm.lengthSq() > 0.1) {
              capsule.start.addScaledVector(horizNorm, diff);
              capsule.end.addScaledVector(horizNorm, diff);
              const vDotN = velocity.dot(horizNorm);
              if (vDotN < 0) velocity.addScaledVector(horizNorm, -vDotN);
            } else {
              capsule.start.y = floorY;
              capsule.end.y += diff;
            }
          }
        }
      }

      for (const col of this.colliders) {
        // Quick broadphase bounding check
        const capMinY = capsule.start.y - capsule.radius;
        const capMaxY = capsule.end.y + capsule.radius;
        const capMinX = Math.min(capsule.start.x, capsule.end.x) - capsule.radius;
        const capMaxX = Math.max(capsule.start.x, capsule.end.x) + capsule.radius;
        const capMinZ = Math.min(capsule.start.z, capsule.end.z) - capsule.radius;
        const capMaxZ = Math.max(capsule.start.z, capsule.end.z) + capsule.radius;

        if (
          capMaxX < col.min.x || capMinX > col.max.x ||
          capMaxY < col.min.y || capMinY > col.max.y ||
          capMaxZ < col.min.z || capMinZ > col.max.z
        ) {
          continue;
        }

        let distSq = Infinity;
        let pSeg = new THREE.Vector3();
        let pCol = new THREE.Vector3();

        if (col.type === 'box') {
          const res = this.testSegmentBox(capsule.start, capsule.end, col);
          distSq = res.distSq;
          pSeg = res.pSeg;
          pCol = res.pBox;
        } else {
          const res = this.testSegmentTriangle(capsule.start, capsule.end, col);
          distSq = res.distSq;
          pSeg = res.pSeg;
          pCol = res.pTri;
        }

        const r = capsule.radius;
        if (distSq < r * r) {
          collidedAny = true;
          const dist = Math.sqrt(distSq);
          const normal = new THREE.Vector3();

          if (dist > 1e-6) {
            normal.subVectors(pSeg, pCol).normalize();
          } else {
            // Inside collider, push up or out
            normal.set(0, 1, 0);
          }

          const penetration = r - dist;

          // Step-up check:
          // If obstacle is horizontal obstruction and top is within stepHeight
          if (canStepUp && Math.abs(normal.y) < 0.3) {
            const obstacleTop = col.max.y;
            const heightDiff = obstacleTop - footY;
            if (heightDiff > 0.01 && heightDiff <= this.stepHeight + 0.05) {
              // Try stepping up
              capsule.start.y += heightDiff;
              capsule.end.y += heightDiff;
              stepped = true;
              grounded = true;
              velocity.y = 0;
              continue;
            }
          }

          // Check slope
          const isFloor = normal.y >= this.maxSlopeCos;
          const isSteepSlope = normal.y > 0 && normal.y < this.maxSlopeCos;

          if (isFloor) {
            grounded = true;
            if (velocity.y < 0) velocity.y = 0;
            // Push out
            capsule.start.addScaledVector(normal, penetration);
            capsule.end.addScaledVector(normal, penetration);
          } else if (isSteepSlope) {
            // Slope > 45 deg: treat as wall, zero upward velocity along slope, no sliding
            const wallNormal = new THREE.Vector3(normal.x, 0, normal.z).normalize();
            if (wallNormal.lengthSq() > 0.1) {
              capsule.start.addScaledVector(wallNormal, penetration);
              capsule.end.addScaledVector(wallNormal, penetration);
              const vDotN = velocity.dot(wallNormal);
              if (vDotN < 0) {
                velocity.addScaledVector(wallNormal, -vDotN);
              }
            } else {
              capsule.start.y += penetration;
              capsule.end.y += penetration;
            }
          } else {
            // Wall or ceiling
            capsule.start.addScaledVector(normal, penetration);
            capsule.end.addScaledVector(normal, penetration);

            // Deflect velocity along normal
            const vDotN = velocity.dot(normal);
            if (vDotN < 0) {
              velocity.addScaledVector(normal, -vDotN);
            }
          }
        }
      }

      if (!collidedAny) break;
    }

    return { grounded, stepped };
  }
}
