import { AttributeName, AttributeSet, createBaseAttributes, createEmptyAttributes, ATTRIBUTE_LABELS } from './attributes';
import { EquipSlot, GearItem, ImplantItem, InventoryItem } from './items';

export class CharacterSheet {
  public level: number = 1;
  public maxLevel: number = 15;
  public experience: number = 0;
  public skillPoints: number = 0;

  public baseAttributes: AttributeSet = createBaseAttributes(10);
  public spentPoints: AttributeSet = createEmptyAttributes();

  public equippedGear: Partial<Record<'head' | 'chest' | 'legs', GearItem>> = {};
  public equippedImplants: Partial<Record<'implant1' | 'implant2' | 'implant3', ImplantItem>> = {};
  public inventory: InventoryItem[] = [];

  // Vitals
  public health: number = 100;
  public notumEnergy: number = 80;

  constructor() {
    this.updateVitals(true);
  }

  public expForNextLevel(lvl: number = this.level): number {
    return lvl * 120;
  }

  public addExperience(amount: number): { leveledUp: boolean; newLevel: number } {
    this.experience += amount;
    let leveledUp = false;

    while (this.level < this.maxLevel && this.experience >= this.expForNextLevel()) {
      this.experience -= this.expForNextLevel();
      this.level++;
      this.skillPoints += 5; // 5 skill points per level
      leveledUp = true;
    }

    if (this.level >= this.maxLevel) {
      this.experience = 0;
    }

    if (leveledUp) {
      this.updateVitals(true);
    }
    return { leveledUp, newLevel: this.level };
  }

  public investSkillPoint(attr: AttributeName): boolean {
    if (this.skillPoints <= 0) return false;
    this.skillPoints--;
    this.spentPoints[attr]++;
    this.updateVitals();
    return true;
  }

  // Calculate current effective attributes
  public getEffectiveAttributes(
    customGear?: Partial<Record<'head' | 'chest' | 'legs', GearItem>>,
    customImplants?: Partial<Record<'implant1' | 'implant2' | 'implant3', ImplantItem>>
  ): AttributeSet {
    const res = createEmptyAttributes();
    const gear = customGear || this.equippedGear;
    const implants = customImplants || this.equippedImplants;

    // 1. Base + Spent
    for (const key of Object.keys(this.baseAttributes) as AttributeName[]) {
      res[key] = this.baseAttributes[key] + this.spentPoints[key];
    }

    // 2. Gear bonuses
    for (const item of Object.values(gear)) {
      if (item && item.bonuses) {
        for (const [k, val] of Object.entries(item.bonuses)) {
          if (val) res[k as AttributeName] += val;
        }
      }
    }

    // 3. Implant bonuses
    for (const item of Object.values(implants)) {
      if (item && item.bonuses) {
        for (const [k, val] of Object.entries(item.bonuses)) {
          if (val) res[k as AttributeName] += val;
        }
      }
    }

    return res;
  }

  public getMaxHealth(): number {
    const eff = this.getEffectiveAttributes();
    return Math.round(80 + eff.stamina * 4 + eff.bioMetrology * 2);
  }

  public getMaxNotum(): number {
    const eff = this.getEffectiveAttributes();
    return Math.round(60 + eff.psychic * 3 + eff.intelligence * 2);
  }

  public updateVitals(refill: boolean = false) {
    const maxHp = this.getMaxHealth();
    const maxNotum = this.getMaxNotum();
    if (refill) {
      this.health = maxHp;
      this.notumEnergy = maxNotum;
    } else {
      this.health = Math.min(this.health, maxHp);
      this.notumEnergy = Math.min(this.notumEnergy, maxNotum);
    }
  }

  public checkRequirements(item: InventoryItem, effectiveAttrs: AttributeSet): { met: boolean; missing: string[] } {
    if (!item.requirements) return { met: true, missing: [] };
    const missing: string[] = [];

    for (const [attr, reqVal] of Object.entries(item.requirements)) {
      const current = effectiveAttrs[attr as AttributeName] || 0;
      if (current < (reqVal || 0)) {
        const label = ATTRIBUTE_LABELS[attr as AttributeName] || attr;
        missing.push(`${label} requires ${reqVal}, current is ${current}`);
      }
    }

    return { met: missing.length === 0, missing };
  }

  // Equipping an item (gear or implant)
  public equip(item: InventoryItem, slot?: EquipSlot): { success: boolean; message: string } {
    const targetSlot = slot || item.slot;
    if (!targetSlot) {
      return { success: false, message: 'Item cannot be equipped: no valid slot.' };
    }

    const currentAttrs = this.getEffectiveAttributes();
    // 1. Player must meet the item's requirements with CURRENT attributes
    const checkItem = this.checkRequirements(item, currentAttrs);
    if (!checkItem.met) {
      return {
        success: false,
        message: `Cannot equip ${item.name}: ${checkItem.missing.join(', ')}`
      };
    }

    // 2. Simulate future state if we equip this item
    const futureGear = { ...this.equippedGear };
    const futureImplants = { ...this.equippedImplants };

    if (targetSlot === 'head' || targetSlot === 'chest' || targetSlot === 'legs') {
      futureGear[targetSlot] = item as GearItem;
    } else {
      futureImplants[targetSlot] = item as ImplantItem;
    }

    const futureAttrs = this.getEffectiveAttributes(futureGear, futureImplants);

    // 3. Verify ALL other currently equipped items still meet their requirements under futureAttrs!
    for (const [s, eqItem] of Object.entries(futureGear)) {
      if (eqItem) {
        const res = this.checkRequirements(eqItem, futureAttrs);
        if (!res.met) {
          return {
            success: false,
            message: `Equip rejected: would drop stats below requirement for equipped ${eqItem.name} (${res.missing.join(', ')})`
          };
        }
      }
    }

    for (const [s, eqItem] of Object.entries(futureImplants)) {
      if (eqItem) {
        const res = this.checkRequirements(eqItem, futureAttrs);
        if (!res.met) {
          return {
            success: false,
            message: `Equip rejected: would drop stats below requirement for equipped ${eqItem.name} (${res.missing.join(', ')})`
          };
        }
      }
    }

    // All checks pass: apply equip
    const invIdx = this.inventory.indexOf(item);
    if (invIdx >= 0) this.inventory.splice(invIdx, 1);

    if (targetSlot === 'head' || targetSlot === 'chest' || targetSlot === 'legs') {
      const old = this.equippedGear[targetSlot];
      if (old) this.inventory.push(old);
      this.equippedGear[targetSlot] = item as GearItem;
    } else {
      const old = this.equippedImplants[targetSlot];
      if (old) this.inventory.push(old);
      this.equippedImplants[targetSlot] = item as ImplantItem;
    }

    this.updateVitals();
    return { success: true, message: `Equipped ${item.name}.` };
  }

  // Unequipping an item
  public unequip(slot: EquipSlot): { success: boolean; message: string } {
    let itemToUnequip: InventoryItem | undefined;
    const futureGear = { ...this.equippedGear };
    const futureImplants = { ...this.equippedImplants };

    if (slot === 'head' || slot === 'chest' || slot === 'legs') {
      itemToUnequip = futureGear[slot];
      delete futureGear[slot];
    } else {
      itemToUnequip = futureImplants[slot];
      delete futureImplants[slot];
    }

    if (!itemToUnequip) {
      return { success: false, message: 'Slot is already empty.' };
    }

    // Check if removing this item causes other equipped items to fail their requirements
    const futureAttrs = this.getEffectiveAttributes(futureGear, futureImplants);

    for (const eqItem of Object.values(futureGear)) {
      if (eqItem) {
        const res = this.checkRequirements(eqItem, futureAttrs);
        if (!res.met) {
          return {
            success: false,
            message: `Cannot unequip ${itemToUnequip.name}: would drop stats below requirement for ${eqItem.name} (${res.missing.join(', ')})`
          };
        }
      }
    }

    for (const eqItem of Object.values(futureImplants)) {
      if (eqItem) {
        const res = this.checkRequirements(eqItem, futureAttrs);
        if (!res.met) {
          return {
            success: false,
            message: `Cannot unequip ${itemToUnequip.name}: would drop stats below requirement for ${eqItem.name} (${res.missing.join(', ')})`
          };
        }
      }
    }

    // Apply unequip
    if (slot === 'head' || slot === 'chest' || slot === 'legs') {
      delete this.equippedGear[slot];
    } else {
      delete this.equippedImplants[slot];
    }

    this.inventory.push(itemToUnequip);
    this.updateVitals();
    return { success: true, message: `Unequipped ${itemToUnequip.name}.` };
  }
}
