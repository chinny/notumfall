export type FactionId = 'corporation' | 'clans';

export interface FactionData {
  id: FactionId;
  name: string;
  standing: number; // -100 to +100
}

export class FactionManager {
  public standings: Record<FactionId, number> = {
    corporation: 0,
    clans: -30 // Clans initially suspicious/hostile in canyon
  };

  constructor(initialStandings?: Partial<Record<FactionId, number>>) {
    if (initialStandings) {
      if (initialStandings.corporation !== undefined) this.standings.corporation = initialStandings.corporation;
      if (initialStandings.clans !== undefined) this.standings.clans = initialStandings.clans;
    }
  }

  public modifyStanding(faction: FactionId, delta: number): void {
    this.standings[faction] = Math.max(-100, Math.min(100, this.standings[faction] + delta));
  }

  public isHostile(faction: FactionId): boolean {
    return this.standings[faction] < -25;
  }

  public isFriendly(faction: FactionId): boolean {
    return this.standings[faction] > 25;
  }

  public getVendorTier(faction: FactionId): 'restricted' | 'standard' | 'elite' {
    if (this.standings[faction] < -25) return 'restricted';
    if (this.standings[faction] > 25) return 'elite';
    return 'standard';
  }

  // Save/Load persistence
  public serialize(): string {
    return JSON.stringify(this.standings);
  }

  public deserialize(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && typeof data.corporation === 'number' && typeof data.clans === 'number') {
        this.standings.corporation = data.corporation;
        this.standings.clans = data.clans;
        return true;
      }
    } catch (e) {
      // Ignored parse error
    }
    return false;
  }

  public saveToStorage(storageKey: string = 'notumfall_factions'): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, this.serialize());
      }
    } catch (e) {
      // LocalStorage not available in headless
    }
  }

  public loadFromStorage(storageKey: string = 'notumfall_factions'): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(storageKey);
        if (item) return this.deserialize(item);
      }
    } catch (e) {
      // Ignored
    }
    return false;
  }
}
