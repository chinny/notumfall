import { describe, it, expect } from 'vitest';
import { CharacterSheet } from '../src/rpg/character';
import { ImplantItem, GearItem } from '../src/rpg/items';

describe('Character Progression, Gear, and Implant Acceptance', () => {
  it('manages 8 attributes and levels up freely to level 15', () => {
    const char = new CharacterSheet();
    expect(char.level).toBe(1);
    expect(char.skillPoints).toBe(0);

    // Spend 5 levels of experience
    for (let i = 1; i <= 5; i++) {
      char.addExperience(char.expForNextLevel());
    }

    expect(char.level).toBe(6);
    expect(char.skillPoints).toBe(25); // 5 points per level

    // Freely invest skill points
    expect(char.investSkillPoint('strength')).toBe(true);
    expect(char.investSkillPoint('bioMetrology')).toBe(true);
    expect(char.investSkillPoint('intelligence')).toBe(true);
    expect(char.skillPoints).toBe(22);

    const eff = char.getEffectiveAttributes();
    expect(eff.strength).toBe(11);
    expect(eff.bioMetrology).toBe(11);
    expect(eff.intelligence).toBe(11);
    expect(eff.agility).toBe(10);
  });

  it('enforces gear attribute requirements before allowing equip', () => {
    const char = new CharacterSheet();
    const heavyVest: GearItem = {
      id: 'heavy-vest',
      name: 'Titan Heavy Plate',
      type: 'gear',
      slot: 'chest',
      armor: 50,
      description: 'Heavy plated armor',
      requirements: { strength: 25, stamina: 20 },
      bonuses: { stamina: 10 }
    };

    // Fails initially (STR=10, STA=10)
    const failRes = char.equip(heavyVest);
    expect(failRes.success).toBe(false);
    expect(failRes.message).toContain('Cannot equip');
    expect(char.equippedGear.chest).toBeUndefined();

    // Level up and invest into STR and STA
    char.addExperience(3000);
    while (char.skillPoints > 0) {
      if (char.spentPoints.strength < 15) {
        char.investSkillPoint('strength');
      } else if (char.spentPoints.stamina < 10) {
        char.investSkillPoint('stamina');
      } else {
        break;
      }
    }

    // Now meets requirements (STR >= 25, STA >= 20)
    const passRes = char.equip(heavyVest);
    expect(passRes.success).toBe(true);
    expect(char.equippedGear.chest?.id).toBe('heavy-vest');
  });

  it('preserves stat-stacking implant puzzle: rejects unequip or swap that drops requirements', () => {
    const char = new CharacterSheet();
    // Base INT is 10. Give player 2 SP to reach BIO 12
    char.skillPoints = 2;
    char.investSkillPoint('bioMetrology');
    char.investSkillPoint('bioMetrology');
    expect(char.getEffectiveAttributes().bioMetrology).toBe(12);

    // Implant 1: Requires BIO 12, gives +10 INT, +5 BIO
    const impBioBridge: ImplantItem = {
      id: 'imp-bridge',
      name: 'Bio-Logic Bridge',
      type: 'implant',
      slot: 'implant1',
      description: 'Converts bio signals to logic gates',
      requirements: { bioMetrology: 12 },
      bonuses: { intelligence: 10, bioMetrology: 5 }
    };

    // Implant 2: Requires INT 20, gives +15 STR
    const impCortexMatrix: ImplantItem = {
      id: 'imp-cortex',
      name: 'Overclocked Cortex',
      type: 'implant',
      slot: 'implant2',
      description: 'Neural accelerator',
      requirements: { intelligence: 20 },
      bonuses: { strength: 15 }
    };

    // 1. Attempting to equip Implant 2 first fails (INT is 10, needs 20)
    const earlyFail = char.equip(impCortexMatrix);
    expect(earlyFail.success).toBe(false);
    expect(earlyFail.message).toContain('Cannot equip');
    expect(char.equippedImplants.implant2).toBeUndefined();

    // 2. Equip Implant 1 first (success: player has BIO 12)
    const eq1 = char.equip(impBioBridge);
    expect(eq1.success).toBe(true);
    // With Implant 1 equipped, INT is now 10 + 10 = 20!
    expect(char.getEffectiveAttributes().intelligence).toBe(20);

    // 3. Now equip Implant 2 (success: INT is now 20!)
    const eq2 = char.equip(impCortexMatrix);
    expect(eq2.success).toBe(true);
    expect(char.getEffectiveAttributes().strength).toBe(25); // 10 + 15

    // 4. Attempt to unequip Implant 1:
    // Removing Implant 1 would drop INT back to 10, which violates Implant 2's requirement of 20!
    const unequipFail = char.unequip('implant1');
    expect(unequipFail.success).toBe(false);
    expect(unequipFail.message).toContain('would drop stats below requirement');
    expect(unequipFail.message).toContain('Overclocked Cortex');

    // Verify Implant 1 remains securely equipped (NEVER silently unequipped)
    expect(char.equippedImplants.implant1?.id).toBe('imp-bridge');
    expect(char.equippedImplants.implant2?.id).toBe('imp-cortex');
    expect(char.getEffectiveAttributes().strength).toBe(25);

    // 5. Attempting to overwrite/swap slot 1 with a weak implant that doesn't provide 10 INT is also rejected
    const weakImplant: ImplantItem = {
      id: 'imp-basic',
      name: 'Basic Optic Chip',
      type: 'implant',
      slot: 'implant1',
      description: 'Basic sensor',
      requirements: {},
      bonuses: { sense: 2 }
    };
    const swapFail = char.equip(weakImplant);
    expect(swapFail.success).toBe(false);
    expect(swapFail.message).toContain('Equip rejected');
    expect(char.equippedImplants.implant1?.id).toBe('imp-bridge');
  });
});
