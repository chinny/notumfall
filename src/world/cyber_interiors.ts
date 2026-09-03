import * as THREE from 'three';
import { PhysicsWorld } from '../physics/collider';

export interface InteractiveKiosk {
  id: string;
  name: string;
  buildingName: string;
  position: THREE.Vector3;
  interactionRadius: number;
  prompt: string;
  action: (game: any) => string;
}

export class CyberInteriors {
  public group: THREE.Group = new THREE.Group();
  public kiosks: InteractiveKiosk[] = [];

  constructor(
    private physics: PhysicsWorld,
    private interiorMat: THREE.Material,
    private hazardMat: THREE.Material
  ) {
    this.buildCantinaInterior();
    this.buildClinicInterior();
    this.buildBlackMarketInterior();
    this.buildDataVaultInterior();
  }

  // 1. The Glitch Cantina (Social Hub & Lounge)
  private buildCantinaInterior() {
    const cx = -108, cy = 4.0, cz = -70;
    const loungeMat = new THREE.MeshStandardMaterial({ color: 0x1f1a2e, roughness: 0.6, metalness: 0.5 });
    const barCounterMat = new THREE.MeshStandardMaterial({ color: 0x0f1118, roughness: 0.3, metalness: 0.8 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonPink = new THREE.MeshBasicMaterial({ color: 0xff007f });

    // Bar Counter: 6m x 1.1m x 1.2m at (-110.5, 4.0, -70)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 7.0), barCounterMat);
    bar.position.set(cx - 2.5, cy + 0.55, cz);
    this.group.add(bar);
    this.physics.addBox(new THREE.Vector3(cx - 3.1, cy, cz - 3.5), new THREE.Vector3(cx - 1.9, cy + 1.1, cz + 3.5));

    // Glowing Neon Accent along counter
    const barNeon = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 7.05), neonCyan);
    barNeon.position.set(cx - 2.5, cy + 1.05, cz);
    this.group.add(barNeon);

    // Bar Stools (3 stools)
    for (let i = -2; i <= 2; i += 2) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.75, 8), barCounterMat);
      stool.position.set(cx - 1.2, cy + 0.375, cz + i);
      this.group.add(stool);
      this.physics.addBox(new THREE.Vector3(cx - 1.5, cy, cz + i - 0.35), new THREE.Vector3(cx - 0.9, cy + 0.8, cz + i + 0.35));
    }

    // Holographic Drink Dispenser Terminal
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), loungeMat);
    terminal.position.set(cx - 4.2, cy + 0.8, cz);
    this.group.add(terminal);
    this.physics.addBox(new THREE.Vector3(cx - 4.6, cy, cz - 0.4), new THREE.Vector3(cx - 3.8, cy + 1.6, cz + 0.4));

    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), neonPink);
    holoScreen.position.set(cx - 3.75, cy + 1.2, cz);
    holoScreen.rotation.y = Math.PI / 2;
    this.group.add(holoScreen);

    // Cantina Ambient Lights
    const cantinaLight1 = new THREE.PointLight(0xff00aa, 3.8, 22);
    cantinaLight1.position.set(cx, cy + 3.8, cz - 3);
    this.group.add(cantinaLight1);

    const cantinaLight2 = new THREE.PointLight(0x00f0ff, 3.5, 22);
    cantinaLight2.position.set(cx, cy + 3.8, cz + 3);
    this.group.add(cantinaLight2);

    const cantinaFill = new THREE.PointLight(0x7733bb, 2.5, 20);
    cantinaFill.position.set(cx, cy + 2.5, cz);
    this.group.add(cantinaFill);

    this.kiosks.push({
      id: 'cantina_bar',
      name: 'Synthetica Bartender AI',
      buildingName: 'The Glitch Cantina',
      position: new THREE.Vector3(cx - 1.8, cy + 1.0, cz),
      interactionRadius: 3.2,
      prompt: '[E] TALK TO SYNTHETICA',
      action: (game) => {
        game.character.notumEnergy = game.character.maxNotumEnergy;
        game.audio.playClick();
        return 'Synthetica pours a glass of Liquid Notum. Energy fully restored!';
      }
    });
  }

  // 2. Chrome & Flesh Cyber-Clinic (Med & Cybernetics Lab)
  private buildClinicInterior() {
    const cx = -90, cy = 4.0, cz = -88;
    const medWhiteMat = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.3, metalness: 0.4 });
    const medSteelMat = new THREE.MeshStandardMaterial({ color: 0x485868, roughness: 0.5, metalness: 0.8 });
    const holoCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });

    // Surgical Examination Pod / Bed: 1.2m x 0.8m x 2.4m
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.6), medSteelMat);
    bed.position.set(cx, cy + 0.375, cz - 2.5);
    this.group.add(bed);
    this.physics.addBox(new THREE.Vector3(cx - 0.7, cy, cz - 3.8), new THREE.Vector3(cx + 0.7, cy + 0.8, cz - 1.2));

    // Holographic Medical Telemetry Arch over bed
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 16, Math.PI), holoCyan);
    arch.position.set(cx, cy + 1.2, cz - 2.5);
    this.group.add(arch);

    // Ripperdoc Station Desk: 2.8m x 1.0m x 1.0m
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.0, 1.0), medWhiteMat);
    desk.position.set(cx + 3.0, cy + 0.5, cz);
    this.group.add(desk);
    this.physics.addBox(new THREE.Vector3(cx + 1.6, cy, cz - 0.5), new THREE.Vector3(cx + 4.4, cy + 1.0, cz + 0.5));

    // Sterile Overhead Spotlights
    const clinicLight = new THREE.PointLight(0x88ffff, 3.8, 22);
    clinicLight.position.set(cx, cy + 3.8, cz);
    this.group.add(clinicLight);

    this.kiosks.push({
      id: 'clinic_doc',
      name: 'Dr. Vane // Cyber-Chirurgeon',
      buildingName: 'Chrome & Flesh Clinic',
      position: new THREE.Vector3(cx + 2.5, cy + 1.0, cz),
      interactionRadius: 3.0,
      prompt: '[E] RECEIVE NANITE TREATMENT',
      action: (game) => {
        game.character.health = game.character.maxHealth;
        game.audio.playLevelUp();
        return 'Nanite surge injected! Health restored to 100%.';
      }
    });
  }

  // 3. Sub-Net Black Market (Trade & Bounties)
  private buildBlackMarketInterior() {
    const cx = -90, cy = 4.0, cz = -52;
    const darkRackMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.7, metalness: 0.7 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8, metalness: 0.3 });
    const greenLedMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
    const amberLedMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Towering Server Stacks (North-West corner)
    for (let i = 0; i < 2; i++) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 1.0), darkRackMat);
      rack.position.set(cx - 3.5 + i * 1.5, cy + 1.9, cz - 3.8);
      this.group.add(rack);
      this.physics.addBox(
        new THREE.Vector3(cx - 4.1 + i * 1.5, cy, cz - 4.3),
        new THREE.Vector3(cx - 2.9 + i * 1.5, cy + 3.8, cz - 3.3)
      );

      // Blinking status strips on server racks
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.05), i === 0 ? greenLedMat : amberLedMat);
      strip.position.set(cx - 3.5 + i * 1.5, cy + 2.5, cz - 3.25);
      this.group.add(strip);
    }

    // Contraband Military Crates
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), crateMat);
    crate1.position.set(cx + 3.2, cy + 0.6, cz + 2.8);
    this.group.add(crate1);
    this.physics.addBox(new THREE.Vector3(cx + 2.4, cy, cz + 2.1), new THREE.Vector3(cx + 4.0, cy + 1.2, cz + 3.5));

    // Broker Kiosk Pedestal
    const kioskPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8), darkRackMat);
    kioskPedestal.position.set(cx, cy + 0.6, cz);
    this.group.add(kioskPedestal);
    this.physics.addBox(new THREE.Vector3(cx - 0.7, cy, cz - 0.7), new THREE.Vector3(cx + 0.7, cy + 1.2, cz + 0.7));

    // Holographic Skull / Syndicate Sigil
    const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), amberLedMat);
    sigil.position.set(cx, cy + 1.8, cz);
    this.group.add(sigil);

    const marketLight = new THREE.PointLight(0xffaa22, 3.5, 22);
    marketLight.position.set(cx, cy + 3.5, cz);
    this.group.add(marketLight);

    this.kiosks.push({
      id: 'black_market',
      name: 'Sub-Net Data Terminal',
      buildingName: 'Sub-Net Black Market',
      position: new THREE.Vector3(cx, cy + 1.0, cz + 1.0),
      interactionRadius: 3.0,
      prompt: '[E] ACCESS SYNDICATE NETWORK',
      action: (game) => {
        game.character.addExperience(100);
        game.audio.playReload();
        return 'Syndicate Network accessed! Encrypted bounty data retrieved (+100 EXP).';
      }
    });
  }

  // 4. Corrupted Data Vault (Hostile Syndicate Building)
  private buildDataVaultInterior() {
    const cx = -72, cy = 4.0, cz = -70;
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x202428, roughness: 0.6, metalness: 0.8 });
    const warningYellow = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Defensive Barrier / Cover Obstacle 1: 3.5m x 1.3m x 0.6m
    const cover1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.3, 0.6), steelMat);
    cover1.position.set(cx - 2.5, cy + 0.65, cz - 2.0);
    this.group.add(cover1);
    this.physics.addBox(new THREE.Vector3(cx - 4.25, cy, cz - 2.3), new THREE.Vector3(cx - 0.75, cy + 1.3, cz - 1.7));

    // Defensive Barrier 2: 3.5m x 1.3m x 0.6m
    const cover2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.3, 0.6), steelMat);
    cover2.position.set(cx - 2.5, cy + 0.65, cz + 2.0);
    this.group.add(cover2);
    this.physics.addBox(new THREE.Vector3(cx - 4.25, cy, cz + 1.7), new THREE.Vector3(cx - 0.75, cy + 1.3, cz + 2.3));

    // Central Data Core Chamber (Back of the room at cx + 4.5)
    const coreChamber = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 3.2, 12), steelMat);
    coreChamber.position.set(cx + 4.5, cy + 1.6, cz);
    this.group.add(coreChamber);
    this.physics.addBox(new THREE.Vector3(cx + 2.9, cy, cz - 1.6), new THREE.Vector3(cx + 6.1, cy + 3.2, cz + 1.6));

    // Red Pulsing Core Light
    const coreLight = new THREE.PointLight(0xff0022, 4.5, 25);
    coreLight.position.set(cx + 4.5, cy + 2.0, cz);
    this.group.add(coreLight);

    // Hazard Stripes Beacon on core
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), warningYellow);
    beacon.position.set(cx + 3.2, cy + 1.5, cz);
    this.group.add(beacon);

    // Red Emergency Beacon Lights
    const redLight = new THREE.PointLight(0xff2200, 3.8, 22);
    redLight.position.set(cx, cy + 4.0, cz);
    this.group.add(redLight);

    let vaultHacked = false;
    this.kiosks.push({
      id: 'data_vault_core',
      name: 'Corrupted Syndicate Data Core',
      buildingName: 'Corrupted Data Vault',
      position: new THREE.Vector3(cx + 3.5, cy + 1.0, cz),
      interactionRadius: 2.8,
      prompt: '[E] OVERRIDE CORRUPTED DATA CORE',
      action: (game) => {
        if (vaultHacked) {
          return 'Data Core already extracted and decrypted.';
        }
        vaultHacked = true;
        game.character.addExperience(300);
        game.factions.modifyStanding('clans', 15);
        game.factions.modifyStanding('corporation', -10);
        game.audio.playLevelUp();
        return 'SUCCESS: Corrupted Data Core decrypted! (+300 EXP, +15 Clan Standing).';
      }
    });
  }
}
