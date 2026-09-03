import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../src/physics/collider';
import { CyberCity } from '../src/world/cyber_city';
import { PlayerController } from '../src/player/controller';
import { Game } from '../src/game';

describe('Sector 5: Cyber City Social Hub & Buildings Acceptance', () => {
  it('generates 4 distinct cyberpunk buildings with registered structures and colliders', () => {
    const physics = new PhysicsWorld();
    const city = new CyberCity(physics);

    expect(city.structures.length).toBe(4);
    const names = city.structures.map((s) => s.name);
    expect(names).toContain('The Glitch Cantina');
    expect(names).toContain('Chrome & Flesh Clinic');
    expect(names).toContain('Sub-Net Black Market');
    expect(names).toContain('Corrupted Data Vault');

    // Plazas, ramps, walls, furniture, and interior props register colliders
    expect(physics.getColliders().length).toBeGreaterThan(25);
  });

  it('allows player to walk through doorway into The Glitch Cantina without clipping', () => {
    const physics = new PhysicsWorld();
    const city = new CyberCity(physics);
    const cantina = city.structures.find((s) => s.name === 'The Glitch Cantina')!;

    // Spawn player just outside the East doorway (cantina center x = -108, east doorway at x = -101)
    const player = new PlayerController(physics, new THREE.Vector3(-99.0, cantina.center.y, -70));
    player.yaw = Math.PI / 2; // facing -X (toward cantina doorway)

    // Walk forward for 40 ticks
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

    // Player should now be inside The Glitch Cantina (x inside [-115, -101])
    expect(player.position.x).toBeLessThan(cantina.center.x + 6.8); // within the east wall threshold
    expect(player.position.x).toBeGreaterThan(cantina.center.x - 7.0);
  });

  it('allows player to walk through doorway into Corrupted Data Vault [Hostile Building] without clipping', () => {
    const physics = new PhysicsWorld();
    const city = new CyberCity(physics);
    const vault = city.structures.find((s) => s.name === 'Corrupted Data Vault')!;

    // Spawn player in the plaza outside the West doorway (vault center x = -72, west doorway at x = -80)
    const player = new PlayerController(physics, new THREE.Vector3(-82.0, vault.center.y, -70));
    player.yaw = -Math.PI / 2; // facing +X (toward vault doorway)

    // Walk forward for 40 ticks
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

    // Player should now be inside the Corrupted Data Vault (x inside [-80, -64])
    expect(player.position.x).toBeGreaterThan(vault.center.x - 7.5);
    expect(player.position.x).toBeLessThan(vault.center.x + 8.0);
  });

  it('spawns hostile syndicate enemies inside the Corrupted Data Vault that engage in combat', () => {
    const game = new Game();
    // Verify enemies spawned in the vault bounds: x in [-80, -64], z in [-77, -63]
    const vaultEnemies = game.enemies.enemies.filter((e) => {
      return e.position.x >= -80 && e.position.x <= -64 && e.position.z >= -77 && e.position.z <= -63;
    });

    expect(vaultEnemies.length).toBeGreaterThanOrEqual(3);
    const hasHeavy = vaultEnemies.some((e) => e.config.type === 'heavy');
    const hasSkirmisher = vaultEnemies.some((e) => e.config.type === 'skirmisher');
    expect(hasHeavy).toBe(true);
    expect(hasSkirmisher).toBe(true);

    // Test attacking a vault enemy
    const target = vaultEnemies[0];
    const initialHealth = target.health;
    target.takeDamage(35);
    expect(target.health).toBeLessThan(initialHealth);
    expect(target.state).toBe('engage');
  });

  it('provides working social and functional interactive kiosks in each building', () => {
    const game = new Game();
    expect(game.cyberCity.kiosks.length).toBe(4);

    // 1. Test Cantina Bartender Synthetica kiosk
    game.character.notumEnergy = 10;
    game.player.position.set(-109.8, 4.0, -70); // near cantina bar
    game.checkKiosks();
    expect(game.activeKiosk).not.toBeNull();
    expect(game.activeKiosk?.id).toBe('cantina_bar');
    const cantinaMsg = game.interactWithActiveKiosk();
    expect(cantinaMsg).toContain('Energy fully restored');
    expect(game.character.notumEnergy).toBe(game.character.maxNotumEnergy);

    // 2. Test Clinic Ripperdoc kiosk
    game.character.health = 25;
    game.player.position.set(-87.5, 4.0, -88); // near clinic doc
    game.checkKiosks();
    expect(game.activeKiosk?.id).toBe('clinic_doc');
    const clinicMsg = game.interactWithActiveKiosk();
    expect(clinicMsg).toContain('Health restored');
    expect(game.character.health).toBe(game.character.maxHealth);

    // 3. Test Black Market Terminal kiosk
    const initialExp = game.character.experience;
    game.player.position.set(-90, 4.0, -51); // near market terminal
    game.checkKiosks();
    expect(game.activeKiosk?.id).toBe('black_market');
    const marketMsg = game.interactWithActiveKiosk();
    expect(marketMsg).toContain('Syndicate Network');
    expect(game.character.experience).toBe(initialExp + 100);

    // 4. Test Data Vault Core override kiosk (awards 300 EXP, triggering level up)
    const initialLevel = game.character.level;
    game.player.position.set(-68.5, 4.0, -70); // near data core
    game.checkKiosks();
    expect(game.activeKiosk?.id).toBe('data_vault_core');
    const coreMsg = game.interactWithActiveKiosk();
    expect(coreMsg).toContain('Corrupted Data Core decrypted');
    expect(game.character.level).toBeGreaterThan(initialLevel);
  });
});
