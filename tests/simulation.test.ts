import { describe, it, expect } from 'vitest';
import { Game } from '../src/game';

describe('60-Second Synthetic Input & Performance Acceptance', () => {
  it('drives game with synthetic input for 60 seconds: no crash, frame times under 33ms sustained', () => {
    const game = new Game();

    let seed = 987654321;
    function rand() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const durationSeconds = 60;
    const dt = 0.016; // 60 FPS target
    const totalSteps = Math.round(durationSeconds / dt); // 3750 steps

    let sustainedLagFrames = 0;
    let maxFrameTimeMs = 0;

    for (let step = 0; step < totalSteps; step++) {
      const t0 = performance.now();

      // Synthetic inputs
      game.currentInput.forward = rand() > 0.4;
      game.currentInput.backward = rand() > 0.8;
      game.currentInput.left = rand() > 0.6;
      game.currentInput.right = rand() > 0.6;
      game.currentInput.sprint = rand() > 0.7;
      game.currentInput.crouch = rand() > 0.9;
      game.currentInput.jump = rand() > 0.85;
      game.currentInput.deltaYaw = (rand() - 0.5) * 15;
      game.currentInput.deltaPitch = (rand() - 0.5) * 10;

      // Random combat actions: fire weapon, cast programs, switch weapons
      if (rand() > 0.92) {
        const nowSec = step * dt;
        game.weapons.fire(game.player, nowSec, (hit) => {
          const res = game.enemies.raycastHit(hit.ray);
          if (res.hit && res.enemy) {
            res.enemy.takeDamage(hit.damage);
          }
        });
      }

      if (rand() > 0.96) {
        game.weapons.reload();
      }

      if (rand() > 0.95) {
        const slot = Math.floor(rand() * 4);
        const res = game.programs.startCast(slot);
        if (res.started && res.instant) {
          const id = game.programs.equippedSlots[slot];
          if (id) game.programs.executeProgram(id, game.player, game.enemies.enemies);
        }
      }

      // Update game
      game.update(dt);

      const frameMs = performance.now() - t0;
      if (frameMs > maxFrameTimeMs) maxFrameTimeMs = frameMs;

      // Check sustained lag (> 33.3ms for consecutive frames)
      if (frameMs > 33.3) {
        sustainedLagFrames++;
      } else {
        sustainedLagFrames = Math.max(0, sustainedLagFrames - 1);
      }

      // Must never have > 10 consecutive lag frames
      expect(sustainedLagFrames).toBeLessThan(10);
    }

    // Assert player stayed within world bounds
    expect(Math.abs(game.player.position.x)).toBeLessThan(200);
    expect(Math.abs(game.player.position.z)).toBeLessThan(200);
    expect(game.player.position.y).toBeGreaterThan(-15);
  });
});
