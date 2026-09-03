import * as THREE from 'three';

export class TargetDummy {
  public position: THREE.Vector3;
  public mesh: THREE.Group;
  public radius: number = 0.5;
  public height: number = 1.8;

  public maxHealth: number = 10000;
  public currentHealth: number = 10000;

  // DPS Tracking
  public totalDamageTaken: number = 0;
  public firstHitTime: number = -1;
  public lastHitTime: number = -1;
  public hitCount: number = 0;
  public lastDamage: number = 0;

  constructor(pos: THREE.Vector3) {
    this.position = pos.clone();
    this.mesh = new THREE.Group();
    this.mesh.position.copy(pos);

    // Visual Mesh: base, torso, bullseye target
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.8 });
    const targetMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.4 });
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 16), baseMat);
    base.position.y = 0.15;
    this.mesh.add(base);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), baseMat);
    post.position.y = 0.9;
    this.mesh.add(post);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), targetMat);
    torso.position.y = 1.2;
    this.mesh.add(torso);

    const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 16), coreMat);
    bullseye.rotation.x = Math.PI / 2;
    bullseye.position.y = 1.2;
    this.mesh.add(bullseye);
  }

  public getBounds(out?: THREE.Box3): THREE.Box3 {
    const b = out || new THREE.Box3();
    b.min.set(this.position.x - this.radius, this.position.y, this.position.z - this.radius);
    b.max.set(this.position.x + this.radius, this.position.y + this.height, this.position.z + this.radius);
    return b;
  }

  public raycastHit(ray: THREE.Ray): { hit: boolean; distance: number; point: THREE.Vector3 } {
    const box = this.getBounds();
    const hitPoint = new THREE.Vector3();
    const hit = ray.intersectBox(box, hitPoint);
    if (hit) {
      return { hit: true, distance: ray.origin.distanceTo(hitPoint), point: hitPoint };
    }
    return { hit: false, distance: Infinity, point: hitPoint };
  }

  public takeDamage(amount: number, currentTimeSec: number): void {
    if (amount <= 0) return;

    // Reset window if idle > 3.0s
    if (this.lastHitTime >= 0 && currentTimeSec - this.lastHitTime > 3.0) {
      this.resetDPS();
    }

    if (this.firstHitTime < 0) {
      this.firstHitTime = currentTimeSec;
    }

    this.lastHitTime = currentTimeSec;
    this.totalDamageTaken += amount;
    this.hitCount++;
    this.lastDamage = amount;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  public getDPS(): number {
    if (this.firstHitTime < 0 || this.lastHitTime < 0) return 0;
    const elapsed = this.lastHitTime - this.firstHitTime;
    if (elapsed <= 0.001) {
      return this.totalDamageTaken;
    }
    return this.totalDamageTaken / elapsed;
  }

  public resetDPS(): void {
    this.totalDamageTaken = 0;
    this.firstHitTime = -1;
    this.lastHitTime = -1;
    this.hitCount = 0;
    this.currentHealth = this.maxHealth;
  }
}
