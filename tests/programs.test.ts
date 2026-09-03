import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CharacterSheet } from '../src/rpg/character';
import { ProgramSystem, ProgramId, PROGRAM_DEFS } from '../src/combat/programs';
import { PlayerController } from '../src/player/controller';
import { PhysicsWorld } from '../src/physics/collider';
import { Enemy } from '../src/combat/enemy';

describe('Programmable-Matter Abilities Acceptance', () => {
  it('casts all six programs, respects notum costs and cooldowns', () => {
    const char = new CharacterSheet();
    const system = new ProgramSystem(char);

    const programs: ProgramId[] = ['nuke', 'heal', 'shield', 'blink', 'slow', 'buff'];
    system.notumRegenRate = 0; // Freeze regen for precise cost deduction check

    for (const prog of programs) {
      char.notumEnergy = 100; // Refill energy
      system.equipProgram(0, prog);

      const castRes = system.startCast(0);
      expect(castRes.started).toBe(true);

      const def = PROGRAM_DEFS[prog];
      if (castRes.instant) {
        system.executeProgram(prog);
      } else {
        // Advance time through cast time
        system.update(def.castTime + 0.05);
      }

      // Energy must have been deducted
      expect(char.notumEnergy).toBeLessThanOrEqual(100 - def.notumCost + 2); // allowance for tiny regen
      // Cooldown must be active
      expect(system.cooldowns[prog]).toBeGreaterThan(0);

      // Immediate recast must fail due to active cooldown
      const recast = system.startCast(0);
      expect(recast.started).toBe(false);
      expect(recast.message).toContain('cooldown');

      // Clear cooldown for next program test
      system.cooldowns[prog] = 0;
    }
  });

  it('swaps programs between the 4 slots without state corruption', () => {
    const char = new CharacterSheet();
    const system = new ProgramSystem(char);

    // Initial slots: nuke, heal, shield, blink
    expect(system.equippedSlots).toEqual(['nuke', 'heal', 'shield', 'blink']);

    // Cast nuke in slot 0 to trigger a 4-second cooldown
    char.notumEnergy = 100;
    system.startCast(0);
    system.update(0.6);
    expect(system.cooldowns.nuke).toBeGreaterThan(3.0);

    // Swap slot 0 to 'slow' and put 'nuke' in slot 3
    system.equipProgram(0, 'slow');
    system.equipProgram(3, 'nuke');

    expect(system.equippedSlots[0]).toBe('slow');
    expect(system.equippedSlots[3]).toBe('nuke');

    // Nuke's cooldown is still tracked properly on slot 3!
    const castSlot3 = system.startCast(3);
    expect(castSlot3.started).toBe(false);
    expect(castSlot3.message).toContain('cooldown');

    // Slot 0 (now slow) can cast immediately because slow was off cooldown!
    const castSlot0 = system.startCast(0);
    expect(castSlot0.started).toBe(true);

    // Unequip slot 1 cleanly
    system.unequipProgram(1);
    expect(system.equippedSlots[1]).toBeNull();
    const castEmpty = system.startCast(1);
    expect(castEmpty.started).toBe(false);
    expect(castEmpty.message).toContain('empty');
  });

  it('applies HoT, shield damage absorption, and blink displacement', () => {
    const char = new CharacterSheet();
    const system = new ProgramSystem(char);
    const physics = new PhysicsWorld();
    const player = new PlayerController(physics, new THREE.Vector3(0, 2, 0));

    // 1. Heal Over Time
    char.health = 40;
    system.executeProgram('heal');
    expect(system.hotTicksRemaining).toBe(5);
    // Advance 3 seconds
    system.update(3.1);
    expect(char.health).toBeGreaterThanOrEqual(70);

    // 2. Shield absorption
    system.executeProgram('shield');
    expect(system.activeShield).toBe(60);
    const remainingDmg = system.absorbDamageWithShield(45);
    expect(remainingDmg).toBe(0); // 45 damage fully absorbed
    expect(system.activeShield).toBe(15); // 60 - 45 = 15 remaining

    // 3. Blink displacement
    const initialPos = player.position.clone();
    player.pitch = 0;
    player.yaw = 0; // facing negative Z
    system.executeProgram('blink', player);
    // Player should have moved roughly 10m forward in Z
    expect(player.position.distanceTo(initialPos)).toBeGreaterThan(8.0);
  });
});
