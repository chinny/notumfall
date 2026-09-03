import { AttributeName, AttributeSet, createEmptyAttributes } from './attributes';

export type ItemType = 'gear' | 'implant' | 'program' | 'consumable';
export type EquipSlot = 'head' | 'chest' | 'legs' | 'implant1' | 'implant2' | 'implant3';

export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  requirements?: Partial<AttributeSet>;
  bonuses?: Partial<AttributeSet>;
  slot?: EquipSlot;
  value?: number;
}

export interface GearItem extends BaseItem {
  type: 'gear';
  slot: 'head' | 'chest' | 'legs';
  armor: number;
}

export interface ImplantItem extends BaseItem {
  type: 'implant';
  slot: 'implant1' | 'implant2' | 'implant3';
}

export interface ProgramItem extends BaseItem {
  type: 'program';
  programId: string;
}

export type InventoryItem = GearItem | ImplantItem | ProgramItem | BaseItem;

export const INITIAL_ITEMS: InventoryItem[] = [
  // Implants for stat-stacking puzzles
  {
    id: 'imp-bio-coupler',
    name: 'Neural Bio-Coupler MK I',
    type: 'implant',
    slot: 'implant1',
    description: 'Bridges organic nerve fibers with programmable matter.',
    requirements: { bioMetrology: 12 },
    bonuses: { bioMetrology: 8, intelligence: 10 }
  },
  {
    id: 'imp-synaptic-weave',
    name: 'Synaptic Logic Weave',
    type: 'implant',
    slot: 'implant2',
    description: 'High-density computational crystalline lattice.',
    requirements: { intelligence: 18 },
    bonuses: { strength: 12, matterProgramming: 10 }
  },
  {
    id: 'imp-myomer-actuator',
    name: 'Myomer Boost Actuator',
    type: 'implant',
    slot: 'implant3',
    description: 'Synthetic muscle fibers generating crushing kinetic power.',
    requirements: { strength: 20 },
    bonuses: { strength: 15, stamina: 10 }
  },

  // Gear
  {
    id: 'gear-corp-vest',
    name: 'Corp Ballistic Carapace',
    type: 'gear',
    slot: 'chest',
    armor: 25,
    description: 'Reinforced ceramic plates worn by corporate enforcers.',
    requirements: { strength: 15, stamina: 12 },
    bonuses: { stamina: 8 }
  },
  {
    id: 'gear-clan-leggings',
    name: 'Clan Scavver Greaves',
    type: 'gear',
    slot: 'legs',
    armor: 14,
    description: 'Lightweight dune runner leggings with knee dampeners.',
    requirements: { agility: 14 },
    bonuses: { agility: 6 }
  },
  {
    id: 'gear-visor',
    name: 'Notum Analysis Visor',
    type: 'gear',
    slot: 'head',
    armor: 8,
    description: 'Heads-up tactical visor calibrated for mineral radiation.',
    requirements: { sense: 14 },
    bonuses: { sense: 6, intelligence: 4 }
  }
];
