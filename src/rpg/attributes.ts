export type AttributeName =
  | 'strength'
  | 'agility'
  | 'stamina'
  | 'intelligence'
  | 'sense'
  | 'psychic'
  | 'matterProgramming'
  | 'bioMetrology';

export const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  strength: 'Strength (STR)',
  agility: 'Agility (AGI)',
  stamina: 'Stamina (STA)',
  intelligence: 'Intelligence (INT)',
  sense: 'Sense (SNS)',
  psychic: 'Psychic (PSY)',
  matterProgramming: 'Matter Programming (MPR)',
  bioMetrology: 'Bio-Metrology (BIO)'
};

export type AttributeSet = Record<AttributeName, number>;

export function createEmptyAttributes(): AttributeSet {
  return {
    strength: 0,
    agility: 0,
    stamina: 0,
    intelligence: 0,
    sense: 0,
    psychic: 0,
    matterProgramming: 0,
    bioMetrology: 0
  };
}

export function createBaseAttributes(baseVal: number = 10): AttributeSet {
  return {
    strength: baseVal,
    agility: baseVal,
    stamina: baseVal,
    intelligence: baseVal,
    sense: baseVal,
    psychic: baseVal,
    matterProgramming: baseVal,
    bioMetrology: baseVal
  };
}
