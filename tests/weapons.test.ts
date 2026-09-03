import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Weapon } from '../src/combat/weapon';
import { TargetDummy } from '../src/combat/target_dummy';

describe('Gunplay and Weapon DPS Acceptance', () => {
  it('semi-auto pistol fires, reloads, damages dummy, and reports correct DPS', () => {
    const pistol = new Weapon('pistol', 60);
    const dummy = new TargetDummy(new THREE.Vector3(0, 0, -10));

    expect(pistol.ammoInClip).toBe(12);
    expect(pistol.ammoReserve).toBe(60);

    let time = 0.0;
    // Fire 6 shots at maximum fire rate (1/3 sec interval = ~0.333s)
    for (let i = 0; i < 6; i++) {
      const res = pistol.startFire();
      expect(res.fired).toBe(true);
      dummy.takeDamage(pistol.config.damage, time);

      // Advance time through cooldown
      const interval = 1.0 / pistol.config.fireRate; // 0.333s
      for (let t = 0; t < 10; t++) {
        time += interval / 10;
        pistol.update(interval / 10);
      }
    }

    expect(pistol.ammoInClip).toBe(6);
    expect(dummy.totalDamageTaken).toBe(6 * 35); // 210
    expect(dummy.hitCount).toBe(6);

    // DPS over the 5 elapsed fire intervals between 6 shots: 210 / 1.666s = ~126 DPS
    const dps = dummy.getDPS();
    expect(dps).toBeGreaterThan(115);
    expect(dps).toBeLessThan(135);

    // Test reload
    expect(pistol.reload()).toBe(true);
    expect(pistol.isReloading).toBe(true);

    // Advance reload time
    pistol.update(pistol.config.reloadTime);
    expect(pistol.isReloading).toBe(false);
    expect(pistol.ammoInClip).toBe(12);
    expect(pistol.ammoReserve).toBe(54); // 60 - 6 consumed
  });

  it('burst rifle fires 3-round bursts, damages dummy, and reloads', () => {
    const rifle = new Weapon('rifle', 120);
    const dummy = new TargetDummy(new THREE.Vector3(0, 0, -10));

    let time = 0.0;
    const startRes = rifle.startFire();
    expect(startRes.fired).toBe(true);
    expect(rifle.burstRemaining).toBe(3);

    let shotsFiredInBurst = 0;
    // Step through the burst duration (3 shots separated by 0.08s)
    for (let i = 0; i < 30; i++) {
      const dt = 0.01;
      time += dt;
      const step = rifle.update(dt, () => {
        shotsFiredInBurst++;
        dummy.takeDamage(rifle.config.damage, time);
      });
    }

    expect(shotsFiredInBurst).toBe(3);
    expect(dummy.totalDamageTaken).toBe(3 * 20); // 60
    expect(rifle.ammoInClip).toBe(21);

    // Drain clip and test reload
    rifle.ammoInClip = 0;
    rifle.reload();
    expect(rifle.isReloading).toBe(true);
    rifle.update(rifle.config.reloadTime);
    expect(rifle.ammoInClip).toBe(24);
    expect(rifle.ammoReserve).toBe(120 - 24);
  });

  it('charge-up beam charges for 0.8s, discharges 130 damage, and calculates DPS', () => {
    const beam = new Weapon('beam', 20);
    const dummy = new TargetDummy(new THREE.Vector3(0, 0, -15));

    let time = 0.0;

    // Start charging
    const startRes = beam.startFire();
    expect(startRes.charging).toBe(true);

    // Halfway charge release should cancel without firing
    for (let i = 0; i < 4; i++) {
      time += 0.1;
      beam.update(0.1);
    }
    const earlyRelease = beam.releaseFire();
    expect(earlyRelease.fired).toBe(false);
    expect(beam.ammoInClip).toBe(5);

    // Full charge
    beam.startFire();
    for (let i = 0; i < 9; i++) {
      time += 0.1;
      const step = beam.update(0.1);
      if (step.beamShotFired) {
        dummy.takeDamage(beam.config.damage, time);
      }
    }

    expect(beam.ammoInClip).toBe(4);
    expect(dummy.totalDamageTaken).toBe(130);

    // Reload
    beam.reload();
    beam.update(beam.config.reloadTime);
    expect(beam.ammoInClip).toBe(5);
    expect(beam.ammoReserve).toBe(19);
  });
});
