import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Enemy, EnemyType } from '../src/combat/enemy';
import { Terrain } from '../src/world/terrain';
import { PhysicsWorld } from '../src/physics/collider';

describe('Enemies and Combat Encounters Acceptance', () => {
  it('scales stats properly with level across all 4 enemy types', () => {
    const types: EnemyType[] = ['rusher', 'skirmisher', 'heavy', 'drone'];

    for (const type of types) {
      const e1 = new Enemy(type, new THREE.Vector3(0, 0, 0), 1);
      const e5 = new Enemy(type, new THREE.Vector3(0, 0, 0), 5);

      expect(e5.maxHealth).toBeGreaterThan(e1.maxHealth);
      expect(e5.damage).toBeGreaterThan(e1.damage);
      if (type === 'heavy') {
        expect(e5.maxShield).toBeGreaterThan(e1.maxShield);
      }
    }
  });

  it('retreats at low health (<25%) and alerts nearby allies', () => {
    const physics = new PhysicsWorld();
    const terrain = new Terrain();
    const playerPos = new THREE.Vector3(0, 0, 0);

    const leader = new Enemy('rusher', new THREE.Vector3(10, 0, 10), 1);
    const ally = new Enemy('skirmisher', new THREE.Vector3(15, 0, 10), 1);
    const distant = new Enemy('heavy', new THREE.Vector3(90, 0, 90), 1);

    const all = [leader, ally, distant];

    // Trigger alert / engage on leader
    leader.takeDamage(10);
    leader.updateAI(0.1, playerPos, terrain, physics, all);

    expect(leader.state).toBe('engage');
    expect(ally.state).toBe('engage'); // Ally within 30m alerted
    expect(distant.state).toBe('patrol'); // Distant not alerted

    // Drop leader health below 25%
    leader.health = Math.floor(leader.maxHealth * 0.2);
    leader.updateAI(0.1, playerPos, terrain, physics, all);
    expect(leader.state).toBe('retreat');
  });

  it('all four navigate to player from anywhere on map without getting stuck for > 3s', () => {
    const physics = new PhysicsWorld();
    const terrain = new Terrain();
    const playerPos = new THREE.Vector3(0, 0, 0);

    const spawnPoints = [
      { type: 'rusher' as EnemyType, pos: new THREE.Vector3(60, 0, 60) },
      { type: 'skirmisher' as EnemyType, pos: new THREE.Vector3(-70, 0, 50) },
      { type: 'heavy' as EnemyType, pos: new THREE.Vector3(50, 0, -60) },
      { type: 'drone' as EnemyType, pos: new THREE.Vector3(-60, 0, -60) }
    ];

    const enemies = spawnPoints.map((s) => {
      const e = new Enemy(s.type, s.pos, 2);
      e.state = 'engage';
      return e;
    });

    const maxStuckDuration = new Map<Enemy, number>();
    enemies.forEach((e) => maxStuckDuration.set(e, 0));

    // Simulate navigation toward player for 30 seconds
    const dt = 0.05;
    const totalTicks = 30 / dt;

    for (let t = 0; t < totalTicks; t++) {
      for (const e of enemies) {
        e.updateAI(dt, playerPos, terrain, physics, enemies);
        const currentStuck = e.stuckTimer;
        const maxStuck = Math.max(maxStuckDuration.get(e) || 0, currentStuck);
        maxStuckDuration.set(e, maxStuck);

        // Stuck time must never exceed 3 seconds
        expect(currentStuck).toBeLessThan(3.0);
      }
    }

    // Confirm each enemy moved significantly closer to the player
    for (const e of enemies) {
      const finalDist = e.position.distanceTo(playerPos);
      expect(finalDist).toBeLessThan(25.0);
    }
  });
});
