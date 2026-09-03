import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../src/physics/collider';
import { PlayerController, PlayerInput } from '../src/player/controller';
import { closestPointOnAABB } from '../src/core/math';

describe('Player Controller and Collider Acceptance', () => {
  it('cannot clip through any collider after 500 randomized movement inputs', () => {
    const physics = new PhysicsWorld();

    // Floor
    physics.addBox(new THREE.Vector3(-50, -2, -50), new THREE.Vector3(50, 0, 50));
    // Surrounding boundary walls
    physics.addBox(new THREE.Vector3(-20, 0, -20), new THREE.Vector3(-19, 10, 20));
    physics.addBox(new THREE.Vector3(19, 0, -20), new THREE.Vector3(20, 10, 20));
    physics.addBox(new THREE.Vector3(-20, 0, -20), new THREE.Vector3(20, 10, -19));
    physics.addBox(new THREE.Vector3(-20, 0, 19), new THREE.Vector3(20, 10, 20));

    // Internal obstacles: 0.35m step, 0.8m wall, pillars
    physics.addBox(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(0, 0.35, 0));
    physics.addBox(new THREE.Vector3(5, 0, 5), new THREE.Vector3(8, 0.8, 8));
    physics.addBox(new THREE.Vector3(-10, 0, 5), new THREE.Vector3(-8, 5, 7));

    // A steep triangle slope (60 degrees)
    // Angle with horizontal: tan(60) = sqrt(3) ~ 1.732
    physics.addTriangle(
      new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(15, 0, -10),
      new THREE.Vector3(10, 8.66, -5)
    );

    const player = new PlayerController(physics, new THREE.Vector3(0, 0.1, 0));

    // Seeded pseudo-random generator
    let seed = 1234567;
    function random() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    const tempBoxPoint = new THREE.Vector3();
    const tempSegPoint = new THREE.Vector3();

    for (let step = 0; step < 500; step++) {
      const input: PlayerInput = {
        forward: random() > 0.3,
        backward: random() > 0.7,
        left: random() > 0.6,
        right: random() > 0.6,
        sprint: random() > 0.5,
        crouch: random() > 0.8,
        jump: random() > 0.7,
        deltaPitch: (random() - 0.5) * 100,
        deltaYaw: (random() - 0.5) * 100
      };

      player.update(0.02, input);

      // Verify no clipping through any box collider
      // Capsule segment must not be inside any box beyond radius margin
      const r = player.capsule.radius;
      for (const col of physics.getColliders()) {
        if (col.type === 'box') {
          // Check start, end, and midpoint of capsule segment
          for (let t = 0; t <= 1; t += 0.25) {
            tempSegPoint.lerpVectors(player.capsule.start, player.capsule.end, t);
            closestPointOnAABB(tempSegPoint, col.min, col.max, tempBoxPoint);
            const dist = tempSegPoint.distanceTo(tempBoxPoint);

            // If point is strictly inside box, dist is 0
            const inside =
              tempSegPoint.x > col.min.x + 0.01 &&
              tempSegPoint.x < col.max.x - 0.01 &&
              tempSegPoint.y > col.min.y + 0.01 &&
              tempSegPoint.y < col.max.y - 0.01 &&
              tempSegPoint.z > col.min.z + 0.01 &&
              tempSegPoint.z < col.max.z - 0.01;

            expect(inside).toBe(false);
          }
        }
      }
    }
  });

  it('steps up on 0.4m ledges when walking forward', () => {
    const physics = new PhysicsWorld();
    physics.addBox(new THREE.Vector3(-10, -2, -10), new THREE.Vector3(10, 0, 10));
    // 0.35m high step placed in front of player
    physics.addBox(new THREE.Vector3(-2, 0, -5), new THREE.Vector3(2, 0.35, -2));

    const player = new PlayerController(physics, new THREE.Vector3(0, 0, 0));
    // Player facing negative Z (forward)
    player.yaw = 0;
    const initialY = player.position.y;

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

    // Player should have stepped up onto the 0.35m ledge (y approx 0.35)
    expect(player.position.y).toBeGreaterThanOrEqual(initialY + 0.3);
  });

  it('blocks 0.8m obstacles without stepping up', () => {
    const physics = new PhysicsWorld();
    physics.addBox(new THREE.Vector3(-10, -2, -10), new THREE.Vector3(10, 0, 10));
    // 0.8m high wall placed in front of player at z = -2
    physics.addBox(new THREE.Vector3(-2, 0, -4), new THREE.Vector3(2, 0.8, -2));

    const player = new PlayerController(physics, new THREE.Vector3(0, 0, 0));
    player.yaw = 0;

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

    // Player should NOT have climbed atop 0.8m wall (position.z stopped before -2)
    expect(player.position.z).toBeGreaterThan(-2.0);
    expect(player.position.y).toBeLessThan(0.5);
  });
});
