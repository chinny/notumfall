import * as THREE from 'three';
import { CharacterSheet } from '../rpg/character';
import { PlayerController } from '../player/controller';
import { Enemy } from './enemy';

export type ProgramId = 'nuke' | 'heal' | 'shield' | 'blink' | 'slow' | 'buff';

export interface ProgramDef {
  id: ProgramId;
  name: string;
  castTime: number; // seconds (0 for instant)
  notumCost: number;
  cooldown: number; // seconds
  description: string;
}

export const PROGRAM_DEFS: Record<ProgramId, ProgramDef> = {
  nuke: {
    id: 'nuke',
    name: 'Resonance Rupture',
    castTime: 0.5,
    notumCost: 25,
    cooldown: 4.0,
    description: 'Fires high-frequency programmable matter charge dealing 95 damage.'
  },
  heal: {
    id: 'heal',
    name: 'Cellular Reconstruction',
    castTime: 0.2,
    notumCost: 20,
    cooldown: 6.0,
    description: 'Nanites reconstruct flesh, healing 15 HP/sec for 5 seconds.'
  },
  shield: {
    id: 'shield',
    name: 'Matter Barrier',
    castTime: 0.1,
    notumCost: 30,
    cooldown: 10.0,
    description: 'Solidifies air molecules into a 60-point damage barrier for 8s.'
  },
  blink: {
    id: 'blink',
    name: 'Quantum Slipstream',
    castTime: 0.0,
    notumCost: 20,
    cooldown: 5.0,
    description: 'Instant phase-shift 10m forward in the look direction.'
  },
  slow: {
    id: 'slow',
    name: 'Entropic Field',
    castTime: 0.4,
    notumCost: 20,
    cooldown: 7.0,
    description: 'Generates viscous matter field, slowing nearby enemies by 50% for 6s.'
  },
  buff: {
    id: 'buff',
    name: 'Neural Overclock',
    castTime: 0.3,
    notumCost: 25,
    cooldown: 12.0,
    description: 'Boosts attributes by +8 and movement speed by +30% for 10s.'
  }
};

export class ProgramSystem {
  // 4 equipped slots
  public equippedSlots: (ProgramId | null)[] = ['nuke', 'heal', 'shield', 'blink'];
  // Cooldowns tracked per program ID
  public cooldowns: Record<ProgramId, number> = {
    nuke: 0,
    heal: 0,
    shield: 0,
    blink: 0,
    slow: 0,
    buff: 0
  };

  // Casting state
  public castingProgram: ProgramId | null = null;
  public castProgress: number = 0;

  // Active status effects
  public activeShield: number = 0;
  public shieldDuration: number = 0;

  public hotTimer: number = 0;
  public hotTicksRemaining: number = 0;

  public buffDuration: number = 0;

  public notumRegenRate: number = 10.0; // 10 Notum/sec

  constructor(public character: CharacterSheet) {}

  public equipProgram(slotIndex: number, id: ProgramId): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    // Cancel active cast if changing current casting program
    if (this.castingProgram === this.equippedSlots[slotIndex]) {
      this.cancelCast();
    }
    this.equippedSlots[slotIndex] = id;
    return true;
  }

  public unequipProgram(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    if (this.castingProgram === this.equippedSlots[slotIndex]) {
      this.cancelCast();
    }
    this.equippedSlots[slotIndex] = null;
    return true;
  }

  public startCast(slotIndex: number): { started: boolean; instant?: boolean; message?: string } {
    if (slotIndex < 0 || slotIndex >= 4) return { started: false, message: 'Invalid slot' };
    const id = this.equippedSlots[slotIndex];
    if (!id) return { started: false, message: 'Slot is empty' };

    const def = PROGRAM_DEFS[id];
    if (this.cooldowns[id] > 0.01) {
      return { started: false, message: `${def.name} on cooldown (${this.cooldowns[id].toFixed(1)}s)` };
    }
    if (this.character.notumEnergy < def.notumCost) {
      return { started: false, message: `Insufficient Notum (Need ${def.notumCost})` };
    }

    if (def.castTime <= 0) {
      // Instant cast
      return { started: true, instant: true };
    }

    this.castingProgram = id;
    this.castProgress = 0;
    return { started: true, instant: false };
  }

  public cancelCast() {
    this.castingProgram = null;
    this.castProgress = 0;
  }

  public executeProgram(
    id: ProgramId,
    player?: PlayerController,
    enemies?: Enemy[]
  ): { executed: boolean; effect: string } {
    const def = PROGRAM_DEFS[id];
    if (this.character.notumEnergy < def.notumCost) {
      return { executed: false, effect: 'Not enough Notum' };
    }

    // Deduct cost and set cooldown
    this.character.notumEnergy -= def.notumCost;
    this.cooldowns[id] = def.cooldown;

    let effect = '';

    switch (id) {
      case 'nuke':
        effect = 'Resonance Rupture unleashed 95 kinetic energy!';
        if (enemies && enemies.length > 0) {
          // Hit nearest enemy within 30m
          let nearest: Enemy | null = null;
          let minDist = 30;
          for (const e of enemies) {
            if (e.isAlive() && player) {
              const d = e.position.distanceTo(player.position);
              if (d < minDist) {
                minDist = d;
                nearest = e;
              }
            }
          }
          if (nearest) {
            nearest.takeDamage(95);
          }
        }
        break;

      case 'heal':
        effect = 'Cellular Reconstruction activated: 15 HP/sec for 5s.';
        this.hotTicksRemaining = 5;
        this.hotTimer = 1.0;
        break;

      case 'shield':
        effect = 'Matter Barrier raised: 60 shield for 8s.';
        this.activeShield = 60;
        this.shieldDuration = 8.0;
        break;

      case 'blink':
        effect = 'Quantum Slipstream: blink 10m forward.';
        if (player) {
          const dir = player.getLookDirection();
          const target = player.position.clone().addScaledVector(dir, 10.0);
          player.position.copy(target);
          player.updateCapsule();
          player.physics.resolveCapsule(player.capsule, player.velocity, true);
        }
        break;

      case 'slow':
        effect = 'Entropic Field slowed nearby enemies by 50% for 6s.';
        if (enemies && player) {
          for (const e of enemies) {
            if (e.isAlive() && e.position.distanceTo(player.position) < 25) {
              e.config.speed *= 0.5;
              setTimeout(() => {
                e.config.speed /= 0.5;
              }, 6000);
            }
          }
        }
        break;

      case 'buff':
        effect = 'Neural Overclock: +8 attributes and +30% speed for 10s.';
        this.buffDuration = 10.0;
        break;
    }

    return { executed: true, effect };
  }

  public absorbDamageWithShield(incomingDamage: number): number {
    if (this.activeShield <= 0) return incomingDamage;
    const absorbed = Math.min(this.activeShield, incomingDamage);
    this.activeShield -= absorbed;
    return incomingDamage - absorbed;
  }

  public update(
    dt: number,
    player?: PlayerController,
    enemies?: Enemy[]
  ) {
    // Regenerate notum energy
    const maxNotum = this.character.getMaxNotum();
    this.character.notumEnergy = Math.min(maxNotum, this.character.notumEnergy + this.notumRegenRate * dt);

    // Decrement cooldowns
    for (const key of Object.keys(this.cooldowns) as ProgramId[]) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      }
    }

    // Cast progress
    if (this.castingProgram) {
      const def = PROGRAM_DEFS[this.castingProgram];
      this.castProgress += dt;
      if (this.castProgress >= def.castTime) {
        const id = this.castingProgram;
        this.castingProgram = null;
        this.castProgress = 0;
        this.executeProgram(id, player, enemies);
      }
    }

    // Heal over time ticks
    if (this.hotTicksRemaining > 0) {
      this.hotTimer -= dt;
      while (this.hotTimer <= 0 && this.hotTicksRemaining > 0) {
        this.hotTimer += 1.0;
        this.hotTicksRemaining--;
        const maxHp = this.character.getMaxHealth();
        this.character.health = Math.min(maxHp, this.character.health + 15);
      }
    }

    // Shield duration
    if (this.shieldDuration > 0) {
      this.shieldDuration -= dt;
      if (this.shieldDuration <= 0) {
        this.activeShield = 0;
      }
    }

    // Buff duration
    if (this.buffDuration > 0) {
      this.buffDuration -= dt;
    }
  }
}
