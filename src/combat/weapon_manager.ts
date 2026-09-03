import * as THREE from 'three';
import { Weapon, WeaponType, WEAPON_CONFIGS } from './weapon';
import { TargetDummy } from './target_dummy';
import { PlayerController } from '../player/controller';

export interface Tracer {
  mesh: THREE.Line;
  lifetime: number;
  maxLifetime: number;
}

export class WeaponManager {
  public weapons: Record<WeaponType, Weapon>;
  public activeType: WeaponType = 'rifle';
  public targetDummies: TargetDummy[] = [];
  public tracers: Tracer[] = [];
  public group: THREE.Group = new THREE.Group();

  // Weapon viewmodel mesh
  public viewmodel: THREE.Group = new THREE.Group();
  private viewmodelMesh: THREE.Mesh;
  private tracerMaterial: THREE.LineBasicMaterial;

  constructor(private scene: THREE.Scene, private camera: THREE.Camera) {
    this.weapons = {
      pistol: new Weapon('pistol', 80),
      rifle: new Weapon('rifle', 160),
      beam: new Weapon('beam', 25)
    };

    this.tracerMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, linewidth: 2 });
    scene.add(this.group);

    // Procedural weapon viewmodel attached to camera
    const gunGeo = new THREE.BoxGeometry(0.12, 0.16, 0.45);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.5, metalness: 0.8 });
    this.viewmodelMesh = new THREE.Mesh(gunGeo, gunMat);
    this.viewmodelMesh.position.set(0.24, -0.22, -0.45);
    this.viewmodel.add(this.viewmodelMesh);
    this.camera.add(this.viewmodel);

    // Spawn 2 target dummies in the world for firing practice
    const dummy1 = new TargetDummy(new THREE.Vector3(5, 0, -15));
    const dummy2 = new TargetDummy(new THREE.Vector3(-10, 0, -25));
    this.targetDummies.push(dummy1, dummy2);
    this.scene.add(dummy1.mesh);
    this.scene.add(dummy2.mesh);
  }

  public get activeWeapon(): Weapon {
    return this.weapons[this.activeType];
  }

  public switchWeapon(type: WeaponType) {
    if (this.activeType === type) return;
    this.activeType = type;
    this.updateHUD();
  }

  public fire(player: PlayerController, currentTimeSec: number, onHitEnemy?: (hit: any) => void) {
    const weapon = this.activeWeapon;
    const res = weapon.startFire();
    if (res.fired) {
      this.executeHitscan(player, weapon.config.damage, currentTimeSec, onHitEnemy);
      player.pitch += weapon.config.recoilPitch;
      player.yaw += (Math.random() - 0.5) * weapon.config.recoilYaw;
    }
  }

  public releaseFire(player: PlayerController, currentTimeSec: number, onHitEnemy?: (hit: any) => void) {
    const weapon = this.activeWeapon;
    const res = weapon.releaseFire();
    if (res.fired) {
      this.executeHitscan(player, res.damage, currentTimeSec, onHitEnemy);
      player.pitch += weapon.config.recoilPitch;
    }
  }

  public reload() {
    this.activeWeapon.reload();
  }

  private executeHitscan(
    player: PlayerController,
    damage: number,
    currentTimeSec: number,
    onHitEnemy?: (hit: any) => void
  ) {
    const rayOrigin = new THREE.Vector3();
    this.camera.getWorldPosition(rayOrigin);
    const rayDir = new THREE.Vector3();
    this.camera.getWorldDirection(rayDir);
    const ray = new THREE.Ray(rayOrigin, rayDir);

    let closestDist = this.activeWeapon.config.range;
    let hitPoint = rayOrigin.clone().addScaledVector(rayDir, closestDist);
    let hitDummy: TargetDummy | null = null;

    // Check dummies
    for (const dummy of this.targetDummies) {
      const res = dummy.raycastHit(ray);
      if (res.hit && res.distance < closestDist) {
        closestDist = res.distance;
        hitPoint = res.point;
        hitDummy = dummy;
      }
    }

    if (hitDummy) {
      hitDummy.takeDamage(damage, currentTimeSec);
    }

    if (onHitEnemy) {
      onHitEnemy({ ray, closestDist, damage, currentTimeSec });
    }

    // Spawn tracer line
    this.spawnTracer(rayOrigin.clone().add(new THREE.Vector3(0.2, -0.15, -0.3).applyQuaternion(this.camera.quaternion)), hitPoint);
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const geom = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geom, this.tracerMaterial.clone());
    this.group.add(line);
    this.tracers.push({ mesh: line, lifetime: 0, maxLifetime: 0.08 });
  }

  public update(dt: number, currentTimeSec: number, player: PlayerController, onHitEnemy?: (hit: any) => void) {
    const weapon = this.activeWeapon;
    const step = weapon.update(dt, () => {
      // Called on burst shots
      this.executeHitscan(player, weapon.config.damage, currentTimeSec, onHitEnemy);
      player.pitch += weapon.config.recoilPitch;
    });

    if (step.beamShotFired) {
      this.executeHitscan(player, weapon.config.damage, currentTimeSec, onHitEnemy);
      player.pitch += weapon.config.recoilPitch;
    }

    // Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.lifetime += dt;
      if (t.lifetime >= t.maxLifetime) {
        this.group.remove(t.mesh);
        t.mesh.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }

    // Viewmodel subtle bobbing and recoil recovery
    if (this.viewmodelMesh) {
      const isSprinting = player.isSprinting;
      const speed = isSprinting ? 12 : 6;
      const bobX = Math.cos(currentTimeSec * speed) * 0.008;
      const bobY = Math.sin(currentTimeSec * speed * 2) * 0.006;
      this.viewmodelMesh.position.x = 0.24 + bobX;
      this.viewmodelMesh.position.y = -0.22 + bobY;
    }

    this.updateHUD();
  }

  public updateHUD() {
    if (typeof document === 'undefined') return;
    const weapon = this.activeWeapon;
    const nameEl = document.getElementById('weapon-name');
    const clipEl = document.getElementById('ammo-clip');
    const reserveEl = document.getElementById('ammo-reserve');

    if (nameEl) {
      let state = weapon.isReloading ? ' [RELOADING]' : weapon.isCharging ? ` [CHARGING ${(weapon.chargeProgress * 100).toFixed(0)}%]` : '';
      nameEl.textContent = `${weapon.config.name}${state}`;
    }
    if (clipEl) clipEl.textContent = `${weapon.ammoInClip}`;
    if (reserveEl) reserveEl.textContent = `${weapon.ammoReserve}`;
  }
}
