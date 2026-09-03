import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../src/physics/collider';
import { Terrain } from '../src/world/terrain';
import { WorldStructures } from '../src/world/structures';
import { WorldProps } from '../src/world/props';
import { PlayerController } from '../src/player/controller';

describe('World, Structures, and Props Acceptance', () => {
  it('generates 3 interior structures with valid bounds and colliders', () => {
    const physics = new PhysicsWorld();
    const structures = new WorldStructures(physics);

    expect(structures.structures.length).toBe(3);
    const names = structures.structures.map((s) => s.name);
    expect(names).toContain('Corporate Outpost');
    expect(names).toContain('Clan Canyon Encampment');
    expect(names).toContain('Abandoned Processing Facility');

    // Physics world must have colliders registered
    expect(physics.getColliders().length).toBeGreaterThan(15);
  });

  it('allows player to walk into Corporate Outpost doorway without clipping', () => {
    const physics = new PhysicsWorld();
    const structures = new WorldStructures(physics);
    const corp = structures.structures.find((s) => s.name === 'Corporate Outpost')!;

    // Spawn player just outside the south doorway (z = -60 + 8)
    const player = new PlayerController(physics, new THREE.Vector3(0, corp.center.y, corp.center.z + 8));
    player.yaw = 0; // facing -Z (toward interior)

    // Walk forward through doorway for 40 ticks
    for (let i = 0; i < 40; i++) {
      player.update(0.02, {
        forward: true,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        crouch: false,
        jump: false,
        deltaPitch: 0,
        deltaYaw: 0
      });
    }

    // Player should now be inside the structure (z near -60)
    expect(player.position.z).toBeLessThan(corp.center.z + 6);
    expect(player.position.z).toBeGreaterThan(corp.center.z - 6);
  });

  it('generates procedural props with colliders in physics world', () => {
    const physics = new PhysicsWorld();
    const terrain = new Terrain();
    const initialColliderCount = physics.getColliders().length;
    const props = new WorldProps(physics, terrain);

    expect(physics.getColliders().length).toBeGreaterThan(initialColliderCount);
    expect(props.group.children.length).toBeGreaterThan(10);
  });
});
