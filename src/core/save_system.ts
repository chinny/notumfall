import { CharacterSheet } from '../rpg/character';
import { FactionManager } from '../factions/factions';
import { MissionTerminal } from '../missions/mission_terminal';
import { ProgramSystem } from '../combat/programs';
import { PlayerController } from '../player/controller';

export interface GameSaveData {
  version: number;
  timestamp: number;
  player: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
  };
  character: {
    level: number;
    experience: number;
    skillPoints: number;
    spentPoints: any;
    equippedGear: any;
    equippedImplants: any;
    inventory: any[];
    health: number;
    notumEnergy: number;
  };
  factions: {
    corporation: number;
    clans: number;
  };
  missions: {
    activeMissions: any[];
    completedCount: number;
  };
  programs: {
    equippedSlots: (string | null)[];
  };
}

export class SaveSystem {
  public static readonly STORAGE_KEY = 'notumfall_savegame_v1';

  public static createSave(
    player: PlayerController,
    character: CharacterSheet,
    factions: FactionManager,
    terminal: MissionTerminal,
    programs: ProgramSystem
  ): GameSaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.yaw,
        pitch: player.pitch
      },
      character: {
        level: character.level,
        experience: character.experience,
        skillPoints: character.skillPoints,
        spentPoints: { ...character.spentPoints },
        equippedGear: { ...character.equippedGear },
        equippedImplants: { ...character.equippedImplants },
        inventory: [...character.inventory],
        health: character.health,
        notumEnergy: character.notumEnergy
      },
      factions: {
        corporation: factions.standings.corporation,
        clans: factions.standings.clans
      },
      missions: {
        activeMissions: [...terminal.activeMissions],
        completedCount: terminal.completedMissionsCount
      },
      programs: {
        equippedSlots: [...programs.equippedSlots]
      }
    };
  }

  public static applySave(
    data: GameSaveData,
    player: PlayerController,
    character: CharacterSheet,
    factions: FactionManager,
    terminal: MissionTerminal,
    programs: ProgramSystem
  ): boolean {
    try {
      // 1. Player
      player.position.set(data.player.x, data.player.y, data.player.z);
      player.yaw = data.player.yaw;
      player.pitch = data.player.pitch;
      player.updateCapsule();

      // 2. Character
      character.level = data.character.level;
      character.experience = data.character.experience;
      character.skillPoints = data.character.skillPoints;
      character.spentPoints = { ...data.character.spentPoints };
      character.equippedGear = { ...data.character.equippedGear };
      character.equippedImplants = { ...data.character.equippedImplants };
      character.inventory = [...data.character.inventory];
      character.health = data.character.health;
      character.notumEnergy = data.character.notumEnergy;

      // 3. Factions
      factions.standings.corporation = data.factions.corporation;
      factions.standings.clans = data.factions.clans;

      // 4. Missions
      terminal.activeMissions = [...data.missions.activeMissions];
      terminal.completedMissionsCount = data.missions.completedCount;

      // 5. Programs
      programs.equippedSlots = [...data.programs.equippedSlots] as any;

      return true;
    } catch (e) {
      return false;
    }
  }

  public static saveToLocalStorage(
    player: PlayerController,
    character: CharacterSheet,
    factions: FactionManager,
    terminal: MissionTerminal,
    programs: ProgramSystem
  ): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const data = this.createSave(player, character, factions, terminal, programs);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  public static loadFromLocalStorage(
    player: PlayerController,
    character: CharacterSheet,
    factions: FactionManager,
    terminal: MissionTerminal,
    programs: ProgramSystem
  ): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return this.applySave(data, player, character, factions, terminal, programs);
    } catch (e) {
      return false;
    }
  }
}
