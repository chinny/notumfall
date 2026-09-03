import * as THREE from 'three';

export interface Capsule {
  start: THREE.Vector3; // center of bottom sphere
  end: THREE.Vector3;   // center of top sphere
  radius: number;
}

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
  isTrigger?: boolean;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Distance squared between a point and a line segment
export function closestPointOnSegment(
  p: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  const ab = new THREE.Vector3().subVectors(b, a);
  const t = clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / (ab.lengthSq() || 1), 0, 1);
  return out.copy(a).addScaledVector(ab, t);
}

// Closest point on AABB to point
export function closestPointOnAABB(
  point: THREE.Vector3,
  min: THREE.Vector3,
  max: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  out.x = clamp(point.x, min.x, max.x);
  out.y = clamp(point.y, min.y, max.y);
  out.z = clamp(point.z, min.z, max.z);
  return out;
}
