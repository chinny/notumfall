import * as THREE from 'three';
import { FactionId, FactionManager } from '../factions/factions';
import { EnemyType } from '../combat/enemy';
import { CharacterSheet } from '../rpg/character';

export type MissionType = 'kill' | 'retrieve' | 'escort';

export interface MissionLocation {
  id: string;
  name: string;
  position: THREE.Vector3;
  isReachable: boolean;
}

export const VALID_MAP_LOCATIONS: MissionLocation[] = [
  { id: 'outpost', name: 'Corporate Outpost Perimeter', position: new THREE.Vector3(0, 3, -40), isReachable: true },
  { id: 'canyon', name: 'Clan Canyon Depths', position: new THREE.Vector3(-80, -2, 70), isReachable: true },
  { id: 'facility', name: 'Extraction Facility Interior', position: new THREE.Vector3(85, 2, 45), isReachable: true },
  { id: 'north_claim', name: 'North Mining Drill Rig', position: new THREE.Vector3(50, 4, -80), isReachable: true },
  { id: 'dune_basin', name: 'South-East Sand Dunes', position: new THREE.Vector3(60, 2, 60), isReachable: true },
  { id: 'west_ridge', name: 'West Ridge Checkpoint', position: new THREE.Vector3(-50, 5, 0), isReachable: true }
];

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  faction: FactionId;
  difficulty: number; // 1 to 5
  description: string;
  location: MissionLocation;

  // Objectives
  targetEnemyType?: EnemyType;
  killCountRequired?: number;
  killCountCurrent?: number;
  retrievalItemName?: string;
  retrieved?: boolean;
  escortNpcName?: string;
  escorted?: boolean;

  // Rewards
  creditReward: number;
  expReward: number;
  factionStandingReward: number;

  completed: boolean;
}

export class MissionTerminal {
  public activeMissions: Mission[] = [];
  public completedMissionsCount: number = 0;
  private missionCounter: number = 0;

  constructor(
    public factionManager: FactionManager,
    public character: CharacterSheet
  ) {}

  public generateContract(difficulty: number = 1, preferredFaction?: FactionId): Mission {
    difficulty = Math.max(1, Math.min(5, Math.round(difficulty)));
    this.missionCounter++;

    const types: MissionType[] = ['kill', 'retrieve', 'escort'];
    const type = types[(this.missionCounter) % types.length];

    const factions: FactionId[] = ['corporation', 'clans'];
    const faction = preferredFaction || factions[this.missionCounter % factions.length];

    // Pick location from strictly verified reachable locations
    const location = VALID_MAP_LOCATIONS[(this.missionCounter) % VALID_MAP_LOCATIONS.length];

    // Scaling formulas
    const creditReward = 150 * difficulty;
    const expReward = 100 * difficulty + 50;
    const standingReward = 10 + difficulty * 2;

    const mission: Mission = {
      id: `contract-${Date.now()}-${this.missionCounter}`,
      title: '',
      type,
      faction,
      difficulty,
      description: '',
      location,
      creditReward,
      expReward,
      factionStandingReward: standingReward,
      completed: false
    };

    if (type === 'kill') {
      const enemyTypes: EnemyType[] = ['rusher', 'skirmisher', 'heavy', 'drone'];
      const targetEnemy = enemyTypes[difficulty % enemyTypes.length];
      const count = 2 + difficulty * 2;
      mission.targetEnemyType = targetEnemy;
      mission.killCountRequired = count;
      mission.killCountCurrent = 0;
      mission.title = `Sanction Order: Neutralize ${count} ${targetEnemy.toUpperCase()}S`;
      mission.description = `Hostile forces spotted near ${location.name}. Terminate with extreme prejudice.`;
    } else if (type === 'retrieve') {
      const items = ['Notum Battery Core', 'Data Slate Alpha', 'Sealed Survey Canister', 'Sub-Orbital Transponder'];
      const itemName = items[difficulty % items.length];
      mission.retrievalItemName = itemName;
      mission.retrieved = false;
      mission.title = `Recovery Operation: ${itemName}`;
      mission.description = `Secure the ${itemName} dropped at ${location.name} before scavengers plunder it.`;
    } else {
      const npcs = ['Technician Vance', 'Courier Jax', 'Dr. Aris Thorne', 'Surveyor Lin'];
      const npcName = npcs[difficulty % npcs.length];
      mission.escortNpcName = npcName;
      mission.escorted = false;
      mission.title = `VIP Extraction: Escort ${npcName}`;
      mission.description = `Safely guide ${npcName} through hostile terrain to ${location.name}.`;
    }

    return mission;
  }

  public acceptContract(mission: Mission) {
    this.activeMissions.push(mission);
  }

  public notifyEnemyKilled(enemyType: EnemyType) {
    for (const m of this.activeMissions) {
      if (!m.completed && m.type === 'kill' && m.targetEnemyType === enemyType) {
        m.killCountCurrent = (m.killCountCurrent || 0) + 1;
        if (m.killCountCurrent >= (m.killCountRequired || 1)) {
          this.completeMission(m);
        }
      }
    }
  }

  public notifyItemRetrieved(itemName: string) {
    for (const m of this.activeMissions) {
      if (!m.completed && m.type === 'retrieve' && m.retrievalItemName === itemName) {
        m.retrieved = true;
        this.completeMission(m);
      }
    }
  }

  public notifyEscortArrived(npcName: string) {
    for (const m of this.activeMissions) {
      if (!m.completed && m.type === 'escort' && m.escortNpcName === npcName) {
        m.escorted = true;
        this.completeMission(m);
      }
    }
  }

  public completeMission(mission: Mission): { completed: boolean; rewardSummary: string } {
    if (mission.completed) return { completed: false, rewardSummary: 'Already completed' };

    mission.completed = true;
    this.completedMissionsCount++;

    // Reward player EXP
    this.character.addExperience(mission.expReward);

    // Shift faction standing
    this.factionManager.modifyStanding(mission.faction, mission.factionStandingReward);
    const opposingFaction: FactionId = mission.faction === 'corporation' ? 'clans' : 'corporation';
    this.factionManager.modifyStanding(opposingFaction, -Math.round(mission.factionStandingReward * 0.7));

    const idx = this.activeMissions.indexOf(mission);
    if (idx >= 0) this.activeMissions.splice(idx, 1);

    const summary = `Mission Complete! +${mission.expReward} EXP, +${mission.creditReward} Credits, +${mission.factionStandingReward} ${mission.faction.toUpperCase()} Standing.`;
    return { completed: true, rewardSummary: summary };
  }
}
