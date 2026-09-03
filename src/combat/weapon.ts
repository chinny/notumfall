import * as THREE from 'three';

export type WeaponType = 'pistol' | 'rifle' | 'beam';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // shots per sec or charge time
  magSize: number;
  reloadTime: number; // seconds
  burstCount?: number;
  burstDelay?: number;
  chargeTime?: number;
  recoilPitch: number;
  recoilYaw: number;
  range: number;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    id: 'pistol',
    name: 'A-14 Nomad Pistol',
    damage: 35,
    fireRate: 3.0, // 0.333s refire
    magSize: 12,
    reloadTime: 1.5,
    recoilPitch: 0.025,
    recoilYaw: 0.005,
    range: 80
  },
  rifle: {
    id: 'rifle',
    name: 'Corp AR-12 Burst Rifle',
    damage: 20,
    fireRate: 1.6, // burst cooldown
    magSize: 24,
    burstCount: 3,
    burstDelay: 0.08,
    reloadTime: 2.0,
    recoilPitch: 0.015,
    recoilYaw: 0.008,
    range: 120
  },
  beam: {
    id: 'beam',
    name: 'Notum Heavy Lance',
    damage: 130,
    fireRate: 1.0,
    magSize: 5,
    chargeTime: 0.8,
    reloadTime: 2.4,
    recoilPitch: 0.05,
    recoilYaw: 0.01,
    range: 160
  }
};

export interface HitscanHit {
  hit: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  target?: any;
  damage: number;
}

export class Weapon {
  public config: WeaponConfig;
  public ammoInClip: number;
  public ammoReserve: number;

  public isReloading: boolean = false;
  public reloadProgress: number = 0;
  public fireCooldown: number = 0;

  // Burst firing state
  public burstRemaining: number = 0;
  public burstTimer: number = 0;

  // Charge-up state (beam)
  public chargeProgress: number = 0;
  public isCharging: boolean = false;

  constructor(type: WeaponType, initialReserve?: number) {
    this.config = WEAPON_CONFIGS[type];
    this.ammoInClip = this.config.magSize;
    this.ammoReserve = initialReserve !== undefined ? initialReserve : this.config.magSize * 4;
  }

  public canFire(): boolean {
    if (this.isReloading) return false;
    if (this.ammoInClip <= 0) return false;
    if (this.fireCooldown > 1e-4) return false;
    if (this.burstRemaining > 0) return false;
    return true;
  }

  public startFire(): { fired: boolean; charging?: boolean } {
    if (!this.canFire()) return { fired: false };

    if (this.config.id === 'beam') {
      this.isCharging = true;
      return { fired: false, charging: true };
    }

    if (this.config.id === 'rifle') {
      this.burstRemaining = this.config.burstCount || 3;
      this.burstTimer = 0;
      return { fired: true };
    }

    // Semi-auto pistol single shot
    this.ammoInClip--;
    this.fireCooldown = 1.0 / this.config.fireRate;
    return { fired: true };
  }

  public releaseFire(): { fired: boolean; damage: number } {
    if (this.config.id === 'beam' && this.isCharging) {
      this.isCharging = false;
      if (this.chargeProgress >= (this.config.chargeTime || 0.8)) {
        this.ammoInClip--;
        this.chargeProgress = 0;
        this.fireCooldown = 0.4;
        return { fired: true, damage: this.config.damage };
      }
      this.chargeProgress = 0;
    }
    return { fired: false, damage: 0 };
  }

  public reload(): boolean {
    if (this.isReloading) return false;
    if (this.ammoInClip === this.config.magSize) return false;
    if (this.ammoReserve <= 0) return false;

    this.isReloading = true;
    this.reloadProgress = 0;
    this.isCharging = false;
    this.chargeProgress = 0;
    this.burstRemaining = 0;
    return true;
  }

  public update(dt: number, onBurstShot?: () => void): { singleShotFired: boolean; beamShotFired: boolean } {
    let singleShotFired = false;
    let beamShotFired = false;

    // Reload timer
    if (this.isReloading) {
      this.reloadProgress += dt;
      if (this.reloadProgress >= this.config.reloadTime) {
        const needed = this.config.magSize - this.ammoInClip;
        const available = Math.min(needed, this.ammoReserve);
        this.ammoInClip += available;
        this.ammoReserve -= available;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Charge handling for beam
    if (this.isCharging && !this.isReloading && this.ammoInClip > 0) {
      this.chargeProgress += dt;
      if (this.chargeProgress >= (this.config.chargeTime || 0.8)) {
        // Auto-discharge at full charge
        const res = this.releaseFire();
        if (res.fired) {
          beamShotFired = true;
        }
      }
    }

    // Burst rifle handling
    if (this.burstRemaining > 0 && !this.isReloading) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        if (this.ammoInClip > 0) {
          this.ammoInClip--;
          singleShotFired = true;
          this.burstRemaining--;
          this.burstTimer = this.config.burstDelay || 0.08;
          if (onBurstShot) onBurstShot();
          if (this.burstRemaining === 0) {
            this.fireCooldown = 1.0 / this.config.fireRate;
          }
        } else {
          this.burstRemaining = 0;
        }
      }
    }

    return { singleShotFired, beamShotFired };
  }
}
