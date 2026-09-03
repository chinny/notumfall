import * as THREE from 'three';
import { PhysicsWorld } from '../physics/collider';
import { StructureDef } from './structures';
import { CyberInteriors, InteractiveKiosk } from './cyber_interiors';

export class CyberCity {
  public group: THREE.Group = new THREE.Group();
  public structures: StructureDef[] = [];
  public interiors: CyberInteriors;

  private asphaltMat: THREE.MeshStandardMaterial;
  private facadeMat: THREE.MeshStandardMaterial;
  private billboardMat: THREE.MeshBasicMaterial;
  private interiorMat: THREE.MeshStandardMaterial;
  private hazardMat: THREE.MeshStandardMaterial;

  constructor(private physics: PhysicsWorld) {
    let asphaltMap: THREE.Texture | null = null;
    let facadeMap: THREE.Texture | null = null;
    let billboardMap: THREE.Texture | null = null;
    let interiorMap: THREE.Texture | null = null;
    let hazardMap: THREE.Texture | null = null;

    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        const loader = new THREE.TextureLoader();
        asphaltMap = loader.load('/textures/cyber_asphalt.jpg');
        asphaltMap.wrapS = THREE.RepeatWrapping;
        asphaltMap.wrapT = THREE.RepeatWrapping;
        asphaltMap.repeat.set(6, 6);

        facadeMap = loader.load('/textures/cyber_facade.jpg');
        facadeMap.wrapS = THREE.RepeatWrapping;
        facadeMap.wrapT = THREE.RepeatWrapping;
        facadeMap.repeat.set(2, 2);

        billboardMap = loader.load('/textures/neon_billboard.jpg');

        interiorMap = loader.load('/textures/cyber_interior.jpg');
        interiorMap.wrapS = THREE.RepeatWrapping;
        interiorMap.wrapT = THREE.RepeatWrapping;
        interiorMap.repeat.set(3, 3);

        hazardMap = loader.load('/textures/syndicate_hazard.jpg');
        hazardMap.wrapS = THREE.RepeatWrapping;
        hazardMap.wrapT = THREE.RepeatWrapping;
        hazardMap.repeat.set(2, 2);
      } catch (e) {}
    }

    this.asphaltMat = new THREE.MeshStandardMaterial({ map: asphaltMap, color: 0xffffff, roughness: 0.5, metalness: 0.3 });
    this.facadeMat = new THREE.MeshStandardMaterial({ map: facadeMap, color: 0xffffff, roughness: 0.6, metalness: 0.4 });
    this.billboardMat = new THREE.MeshBasicMaterial({ map: billboardMap, color: 0xffffff });
    this.interiorMat = new THREE.MeshStandardMaterial({ map: interiorMap, color: 0xffffff, roughness: 0.5, metalness: 0.3 });
    this.hazardMat = new THREE.MeshStandardMaterial({ map: hazardMap, color: 0xffffff, roughness: 0.6, metalness: 0.4 });

    this.buildPlazaDeck();
    this.buildNeonStreetFurniture();
    this.buildBuildings();

    this.interiors = new CyberInteriors(this.physics, this.interiorMat, this.hazardMat);
    this.group.add(this.interiors.group);
  }

  public get kiosks(): InteractiveKiosk[] {
    return this.interiors.kiosks;
  }

  // 1. Central Elevated Plaza Deck & Approach Ramps
  private buildPlazaDeck() {
    const cx = -90, cy = 4.0, cz = -70;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(58, 0.5, 58), this.asphaltMat);
    deck.position.set(cx, cy - 0.25, cz);
    deck.receiveShadow = true;
    this.group.add(deck);
    this.physics.addBox(new THREE.Vector3(cx - 29, cy - 0.5, cz - 29), new THREE.Vector3(cx + 29, cy, cz + 29));

    // Approach Ramp East
    const eastRamp = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 18), this.asphaltMat);
    eastRamp.position.set(cx + 34, cy - 1.2, cz);
    eastRamp.rotation.z = 0.12;
    this.group.add(eastRamp);
    this.physics.addBox(new THREE.Vector3(cx + 28, cy - 2.5, cz - 6), new THREE.Vector3(cx + 42, cy + 0.1, cz + 6));

    // Approach Ramp South
    const southRamp = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 12), this.asphaltMat);
    southRamp.position.set(cx, cy - 1.2, cz + 34);
    southRamp.rotation.x = -0.12;
    this.group.add(southRamp);
    this.physics.addBox(new THREE.Vector3(cx - 9, cy - 2.5, cz + 28), new THREE.Vector3(cx + 9, cy + 0.1, cz + 42));

    // Neon Perimeter Rails
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(56, 0.3, 0.4), railMat);
    railNorth.position.set(cx, cy + 0.5, cz - 28.5);
    this.group.add(railNorth);
    this.physics.addBox(new THREE.Vector3(cx - 28, cy, cz - 28.7), new THREE.Vector3(cx + 28, cy + 1.0, cz - 28.3));

    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 56), railMat);
    railWest.position.set(cx - 28.5, cy + 0.5, cz);
    this.group.add(railWest);
    this.physics.addBox(new THREE.Vector3(cx - 28.7, cy, cz - 28), new THREE.Vector3(cx - 28.3, cy + 1.0, cz + 28));
  }

  // 2. Street Furniture & Holographic Billboards
  private buildNeonStreetFurniture() {
    const cx = -90, cy = 4.0, cz = -70;
    const postMat = new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.4, metalness: 0.9 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonPink = new THREE.MeshBasicMaterial({ color: 0xff0088 });

    const lampCoords = [
      { x: cx - 12, z: cz - 12, color: 0x00f0ff },
      { x: cx + 12, z: cz - 12, color: 0xff00aa },
      { x: cx - 12, z: cz + 12, color: 0xffaa00 },
      { x: cx + 12, z: cz + 12, color: 0x00f0ff }
    ];

    lampCoords.forEach((lp) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 5.0, 8), postMat);
      pole.position.set(lp.x, cy + 2.5, lp.z);
      this.group.add(pole);
      this.physics.addBox(new THREE.Vector3(lp.x - 0.3, cy, lp.z - 0.3), new THREE.Vector3(lp.x + 0.3, cy + 5.0, lp.z + 0.3));

      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), lp.color === 0x00f0ff ? neonCyan : neonPink);
      lantern.position.set(lp.x, cy + 5.0, lp.z);
      this.group.add(lantern);

      const light = new THREE.PointLight(lp.color, 3.2, 20);
      light.position.set(lp.x, cy + 4.8, lp.z);
      this.group.add(light);
    });

    // Rooftop Holographic Billboard overlooking the plaza
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), this.billboardMat);
    billboard.position.set(cx, cy + 10.0, cz - 24);
    this.group.add(billboard);

    const billboardBack = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), this.billboardMat);
    billboardBack.position.set(cx, cy + 10.0, cz - 24.1);
    billboardBack.rotation.y = Math.PI;
    this.group.add(billboardBack);

    // Plaza Center Holographic Spire
    const spire = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 1), neonCyan);
    spire.position.set(cx, cy + 3.0, cz);
    this.group.add(spire);

    const plazaLight = new THREE.PointLight(0x00f0ff, 3.5, 25);
    plazaLight.position.set(cx, cy + 4.0, cz);
    this.group.add(plazaLight);
  }

  // 3. Helper to construct building shell with a 4m central doorway facing the plaza
  private createBuildingShell(
    name: string,
    bx: number,
    by: number,
    bz: number,
    w: number,
    d: number,
    h: number,
    doorWall: 'E' | 'W' | 'N' | 'S',
    wallMat: THREE.Material,
    signColor: number
  ) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), this.interiorMat);
    floor.position.set(bx, by, bz);
    this.group.add(floor);

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), wallMat);
    ceil.position.set(bx, by + h, bz);
    this.group.add(ceil);
    this.physics.addBox(new THREE.Vector3(bx - w / 2, by + h - 0.2, bz - d / 2), new THREE.Vector3(bx + w / 2, by + h + 0.2, bz + d / 2));

    // North Wall
    if (doorWall !== 'N') {
      const wN = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), wallMat);
      wN.position.set(bx, by + h / 2, bz - d / 2);
      this.group.add(wN);
      this.physics.addBox(new THREE.Vector3(bx - w / 2, by, bz - d / 2 - 0.3), new THREE.Vector3(bx + w / 2, by + h, bz - d / 2 + 0.3));
    } else {
      const segW = (w - 4.0) / 2;
      const wNL = new THREE.Mesh(new THREE.BoxGeometry(segW, h, 0.6), wallMat);
      wNL.position.set(bx - w / 2 + segW / 2, by + h / 2, bz - d / 2);
      this.group.add(wNL);
      this.physics.addBox(new THREE.Vector3(bx - w / 2, by, bz - d / 2 - 0.3), new THREE.Vector3(bx - 2.0, by + h, bz - d / 2 + 0.3));

      const wNR = new THREE.Mesh(new THREE.BoxGeometry(segW, h, 0.6), wallMat);
      wNR.position.set(bx + w / 2 - segW / 2, by + h / 2, bz - d / 2);
      this.group.add(wNR);
      this.physics.addBox(new THREE.Vector3(bx + 2.0, by, bz - d / 2 - 0.3), new THREE.Vector3(bx + w / 2, by + h, bz - d / 2 + 0.3));

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.2, 0.6), wallMat);
      lintel.position.set(bx, by + h - 0.6, bz - d / 2);
      this.group.add(lintel);
      this.physics.addBox(new THREE.Vector3(bx - 2.0, by + h - 1.2, bz - d / 2 - 0.3), new THREE.Vector3(bx + 2.0, by + h, bz - d / 2 + 0.3));
    }

    // South Wall
    if (doorWall !== 'S') {
      const wS = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), wallMat);
      wS.position.set(bx, by + h / 2, bz + d / 2);
      this.group.add(wS);
      this.physics.addBox(new THREE.Vector3(bx - w / 2, by, bz + d / 2 - 0.3), new THREE.Vector3(bx + w / 2, by + h, bz + d / 2 + 0.3));
    } else {
      const segW = (w - 4.0) / 2;
      const wSL = new THREE.Mesh(new THREE.BoxGeometry(segW, h, 0.6), wallMat);
      wSL.position.set(bx - w / 2 + segW / 2, by + h / 2, bz + d / 2);
      this.group.add(wSL);
      this.physics.addBox(new THREE.Vector3(bx - w / 2, by, bz + d / 2 - 0.3), new THREE.Vector3(bx - 2.0, by + h, bz + d / 2 + 0.3));

      const wSR = new THREE.Mesh(new THREE.BoxGeometry(segW, h, 0.6), wallMat);
      wSR.position.set(bx + w / 2 - segW / 2, by + h / 2, bz + d / 2);
      this.group.add(wSR);
      this.physics.addBox(new THREE.Vector3(bx + 2.0, by, bz + d / 2 - 0.3), new THREE.Vector3(bx + w / 2, by + h, bz + d / 2 + 0.3));

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.2, 0.6), wallMat);
      lintel.position.set(bx, by + h - 0.6, bz + d / 2);
      this.group.add(lintel);
      this.physics.addBox(new THREE.Vector3(bx - 2.0, by + h - 1.2, bz + d / 2 - 0.3), new THREE.Vector3(bx + 2.0, by + h, bz + d / 2 + 0.3));
    }

    // East Wall
    if (doorWall !== 'E') {
      const wE = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, d), wallMat);
      wE.position.set(bx + w / 2, by + h / 2, bz);
      this.group.add(wE);
      this.physics.addBox(new THREE.Vector3(bx + w / 2 - 0.3, by, bz - d / 2), new THREE.Vector3(bx + w / 2 + 0.3, by + h, bz + d / 2));
    } else {
      const segD = (d - 4.0) / 2;
      const wEL = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, segD), wallMat);
      wEL.position.set(bx + w / 2, by + h / 2, bz - d / 2 + segD / 2);
      this.group.add(wEL);
      this.physics.addBox(new THREE.Vector3(bx + w / 2 - 0.3, by, bz - d / 2), new THREE.Vector3(bx + w / 2 + 0.3, by + h, bz - 2.0));

      const wER = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, segD), wallMat);
      wER.position.set(bx + w / 2, by + h / 2, bz + d / 2 - segD / 2);
      this.group.add(wER);
      this.physics.addBox(new THREE.Vector3(bx + w / 2 - 0.3, by, bz + 2.0), new THREE.Vector3(bx + w / 2 + 0.3, by + h, bz + d / 2));

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 4.0), wallMat);
      lintel.position.set(bx + w / 2, by + h - 0.6, bz);
      this.group.add(lintel);
      this.physics.addBox(new THREE.Vector3(bx + w / 2 - 0.3, by + h - 1.2, bz - 2.0), new THREE.Vector3(bx + w / 2 + 0.3, by + h, bz + 2.0));
    }

    // West Wall
    if (doorWall !== 'W') {
      const wW = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, d), wallMat);
      wW.position.set(bx - w / 2, by + h / 2, bz);
      this.group.add(wW);
      this.physics.addBox(new THREE.Vector3(bx - w / 2 - 0.3, by, bz - d / 2), new THREE.Vector3(bx - w / 2 + 0.3, by + h, bz + d / 2));
    } else {
      const segD = (d - 4.0) / 2;
      const wWL = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, segD), wallMat);
      wWL.position.set(bx - w / 2, by + h / 2, bz - d / 2 + segD / 2);
      this.group.add(wWL);
      this.physics.addBox(new THREE.Vector3(bx - w / 2 - 0.3, by, bz - d / 2), new THREE.Vector3(bx - w / 2 + 0.3, by + h, bz - 2.0));

      const wWR = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, segD), wallMat);
      wWR.position.set(bx - w / 2, by + h / 2, bz + d / 2 - segD / 2);
      this.group.add(wWR);
      this.physics.addBox(new THREE.Vector3(bx - w / 2 - 0.3, by, bz + 2.0), new THREE.Vector3(bx - w / 2 + 0.3, by + h, bz + d / 2));

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 4.0), wallMat);
      lintel.position.set(bx - w / 2, by + h - 0.6, bz);
      this.group.add(lintel);
      this.physics.addBox(new THREE.Vector3(bx - w / 2 - 0.3, by + h - 1.2, bz - 2.0), new THREE.Vector3(bx - w / 2 + 0.3, by + h, bz + 2.0));
    }

    // Overhead Glowing Neon Sign
    const signMat = new THREE.MeshBasicMaterial({ color: signColor });
    const sign = new THREE.Mesh(
      doorWall === 'E' || doorWall === 'W' ? new THREE.BoxGeometry(0.2, 0.5, 3.8) : new THREE.BoxGeometry(3.8, 0.5, 0.2),
      signMat
    );
    const signX = doorWall === 'E' ? bx + w / 2 + 0.35 : doorWall === 'W' ? bx - w / 2 - 0.35 : bx;
    const signZ = doorWall === 'S' ? bz + d / 2 + 0.35 : doorWall === 'N' ? bz - d / 2 - 0.35 : bz;
    sign.position.set(signX, by + 3.4, signZ);
    this.group.add(sign);

    this.structures.push({
      name,
      center: new THREE.Vector3(bx, by, bz),
      bounds: new THREE.Box3(new THREE.Vector3(bx - w / 2, by, bz - d / 2), new THREE.Vector3(bx + w / 2, by + h, bz + d / 2))
    });
  }

  private buildBuildings() {
    // 1. The Glitch Cantina (West, door facing East)
    this.createBuildingShell('The Glitch Cantina', -108, 4.0, -70, 14, 12, 4.5, 'E', this.facadeMat, 0xff00aa);

    // 2. Chrome & Flesh Clinic (North, door facing South)
    this.createBuildingShell('Chrome & Flesh Clinic', -90, 4.0, -88, 12, 14, 4.5, 'S', this.facadeMat, 0x00f0ff);

    // 3. Sub-Net Black Market (South, door facing North)
    this.createBuildingShell('Sub-Net Black Market', -90, 4.0, -52, 12, 14, 4.5, 'N', this.facadeMat, 0xffaa00);

    // 4. Corrupted Data Vault [Hostile Stronghold] (East, door facing West)
    this.createBuildingShell('Corrupted Data Vault', -72, 4.0, -70, 16, 14, 5.0, 'W', this.hazardMat, 0xff1100);
  }
}
