import { describe, it, expect } from 'vitest';
import { FactionManager } from '../src/factions/factions';
import { MissionTerminal } from '../src/missions/mission_terminal';
import { CharacterSheet } from '../src/rpg/character';

describe('Mission Terminal and Faction Standing Acceptance', () => {
  it('50 consecutively generated missions are all completable and none reference an unreachable location', () => {
    const factions = new FactionManager();
    const char = new CharacterSheet();
    const terminal = new MissionTerminal(factions, char);

    for (let i = 0; i < 50; i++) {
      const difficulty = (i % 5) + 1; // 1 to 5
      const mission = terminal.generateContract(difficulty);

      // Verify location validity and reachability
      expect(mission.location).toBeDefined();
      expect(mission.location.isReachable).toBe(true);
      expect(Math.abs(mission.location.position.x)).toBeLessThanOrEqual(180);
      expect(Math.abs(mission.location.position.z)).toBeLessThanOrEqual(180);

      // Verify difficulty scaling
      expect(mission.creditReward).toBe(150 * difficulty);
      expect(mission.expReward).toBeGreaterThanOrEqual(150);

      terminal.acceptContract(mission);

      // Complete mission according to type
      if (mission.type === 'kill') {
        expect(mission.targetEnemyType).toBeDefined();
        for (let k = 0; k < (mission.killCountRequired || 1); k++) {
          terminal.notifyEnemyKilled(mission.targetEnemyType!);
        }
      } else if (mission.type === 'retrieve') {
        expect(mission.retrievalItemName).toBeDefined();
        terminal.notifyItemRetrieved(mission.retrievalItemName!);
      } else {
        expect(mission.escortNpcName).toBeDefined();
        terminal.notifyEscortArrived(mission.escortNpcName!);
      }

      expect(mission.completed).toBe(true);
    }

    expect(terminal.completedMissionsCount).toBe(50);
  });

  it('shifts faction standing independently, updates guard hostility live, and persists across save/load', () => {
    const factions = new FactionManager();
    const char = new CharacterSheet();
    const terminal = new MissionTerminal(factions, char);

    // Initial state: clans are hostile (-30 < -25), corp is neutral (0)
    expect(factions.isHostile('clans')).toBe(true);
    expect(factions.isHostile('corporation')).toBe(false);
    expect(factions.getVendorTier('clans')).toBe('restricted');
    expect(factions.getVendorTier('corporation')).toBe('standard');

    // Run Clan contracts to improve clan standing and sour corporate standing
    for (let i = 0; i < 4; i++) {
      const clanMission = terminal.generateContract(3, 'clans');
      terminal.acceptContract(clanMission);
      terminal.completeMission(clanMission);
    }

    // Clan standing must have significantly increased (passed out of hostile territory)
    expect(factions.standings.clans).toBeGreaterThan(0);
    expect(factions.isHostile('clans')).toBe(false); // Live hostility update
    expect(factions.getVendorTier('clans')).not.toBe('restricted');

    // Corporate standing dropped due to helping clans
    expect(factions.standings.corporation).toBeLessThan(0);

    // Test persistence across save/load
    const serialized = factions.serialize();
    expect(serialized).toContain('"clans"');

    const loadedFactions = new FactionManager({ corporation: 0, clans: 0 });
    const success = loadedFactions.deserialize(serialized);

    expect(success).toBe(true);
    expect(loadedFactions.standings.clans).toBe(factions.standings.clans);
    expect(loadedFactions.standings.corporation).toBe(factions.standings.corporation);
    expect(loadedFactions.isHostile('clans')).toBe(factions.isHostile('clans'));
  });
});
