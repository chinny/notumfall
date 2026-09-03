import * as THREE from 'three';
import { PhysicsWorld } from '../physics/collider';

export interface StructureDef {
  name: string;
  center: THREE.Vector3;
  bounds: THREE.Box3;
}

export class WorldStructures {
  public group: THREE.Group = new THREE.Group();
  public structures: StructureDef[] = [];

  constructor(private physics: PhysicsWorld) {
    this.buildCorporateOutpost();
    this.buildClanEncampment();
    this.buildAbandonedFacility();
  }

  // 1. Corporate Outpost (Brutalist White & Orange Bunker)
  private buildCorporateOutpost() {
    const outpost = new THREE.Group();
    const cx = 0, cy = 3.2, cz = -60;
    outpost.position.set(cx, cy, cz);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.8, metalness: 0.1 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.5, metalness: 0.2 });
    const darkFloorMat = new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.9 });
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6, wireframe: true });

    // Foundation & Floor: 16m x 12m
    const floorGeo = new THREE.BoxGeometry(16, 0.4, 12);
    const floor = new THREE.Mesh(floorGeo, darkFloorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    outpost.add(floor);
    this.physics.addBox(new THREE.Vector3(cx - 8, cy - 0.2, cz - 6), new THREE.Vector3(cx + 8, cy + 0.2, cz + 6));

    // Ceiling: 16m x 12m at height 4.5m
    const ceilGeo = new THREE.BoxGeometry(16, 0.4, 12);
    const ceiling = new THREE.Mesh(ceilGeo, whiteMat);
    ceiling.position.set(0, 4.5, 0);
    outpost.add(ceiling);
    this.physics.addBox(new THREE.Vector3(cx - 8, cy + 4.3, cz - 6), new THREE.Vector3(cx + 8, cy + 4.7, cz + 6));

    // North Wall (Back): 16m x 4.5m x 0.6m
    const backWallGeo = new THREE.BoxGeometry(16, 4.5, 0.6);
    const backWall = new THREE.Mesh(backWallGeo, whiteMat);
    backWall.position.set(0, 2.25, -6);
    outpost.add(backWall);
    this.physics.addBox(new THREE.Vector3(cx - 8, cy, cz - 6.3), new THREE.Vector3(cx + 8, cy + 4.5, cz - 5.7));

    // Orange Stripe on Back Wall
    const stripeGeo = new THREE.BoxGeometry(16.02, 0.8, 0.62);
    const stripe = new THREE.Mesh(stripeGeo, orangeMat);
    stripe.position.set(0, 3.2, -6);
    outpost.add(stripe);

    // East Wall: 0.6m x 4.5m x 12m
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.5, 12), whiteMat);
    eastWall.position.set(8, 2.25, 0);
    outpost.add(eastWall);
    this.physics.addBox(new THREE.Vector3(cx + 7.7, cy, cz - 6), new THREE.Vector3(cx + 8.3, cy + 4.5, cz + 6));

    // West Wall: 0.6m x 4.5m x 12m
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.5, 12), whiteMat);
    westWall.position.set(-8, 2.25, 0);
    outpost.add(westWall);
    this.physics.addBox(new THREE.Vector3(cx - 8.3, cy, cz - 6), new THREE.Vector3(cx - 7.7, cy + 4.5, cz + 6));

    // South Wall (Front with 4m central doorway): Left part 6m, Right part 6m
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 0.6), whiteMat);
    frontWallLeft.position.set(-5, 2.25, 6);
    outpost.add(frontWallLeft);
    this.physics.addBox(new THREE.Vector3(cx - 8, cy, cz + 5.7), new THREE.Vector3(cx - 2, cy + 4.5, cz + 6.3));

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 0.6), whiteMat);
    frontWallRight.position.set(5, 2.25, 6);
    outpost.add(frontWallRight);
    this.physics.addBox(new THREE.Vector3(cx + 2, cy, cz + 5.7), new THREE.Vector3(cx + 8, cy + 4.5, cz + 6.3));

    // Doorway Lintel over 4m opening
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.6), orangeMat);
    lintel.position.set(0, 3.75, 6);
    outpost.add(lintel);
    this.physics.addBox(new THREE.Vector3(cx - 2, cy + 3.0, cz + 5.7), new THREE.Vector3(cx + 2, cy + 4.5, cz + 6.3));

    // Central Mission Kiosk Terminal
    const terminalPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.2, 8), orangeMat);
    terminalPedestal.position.set(0, 0.6, 0);
    outpost.add(terminalPedestal);
    this.physics.addBox(new THREE.Vector3(cx - 0.8, cy, cz - 0.8), new THREE.Vector3(cx + 0.8, cy + 1.2, cz + 0.8));

    // Holographic Display hovering above terminal
    const holoScreen = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.1), holoMat);
    holoScreen.position.set(0, 1.7, 0);
    outpost.add(holoScreen);

    // Interior lights
    const interiorLight = new THREE.PointLight(0xffeedd, 1.5, 14);
    interiorLight.position.set(0, 3.8, 0);
    outpost.add(interiorLight);

    this.group.add(outpost);
    this.structures.push({
      name: 'Corporate Outpost',
      center: new THREE.Vector3(cx, cy, cz),
      bounds: new THREE.Box3(new THREE.Vector3(cx - 8, cy, cz - 6), new THREE.Vector3(cx + 8, cy + 5, cz + 6))
    });
  }

  // 2. Clan Canyon Encampment (Scavenged Metal & Shade Enclave)
  private buildClanEncampment() {
    const encampment = new THREE.Group();
    const cx = -80, cy = -2.0, cz = 70;
    encampment.position.set(cx, cy, cz);

    const scrapMat = new THREE.MeshStandardMaterial({ color: 0x5a524b, roughness: 0.95, metalness: 0.6 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x8a4524, roughness: 0.9, metalness: 0.4 });
    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 1.0 });

    // Raised scrap floor: 14m x 14m
    const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), scrapMat);
    floor.position.set(0, 0, 0);
    encampment.add(floor);
    this.physics.addBox(new THREE.Vector3(cx - 7, cy - 0.2, cz - 7), new THREE.Vector3(cx + 7, cy + 0.2, cz + 7));

    // Heavy support beams
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), rustMat);
    p1.position.set(-6, 2, -6);
    encampment.add(p1);
    this.physics.addBox(new THREE.Vector3(cx - 6.3, cy, cz - 6.3), new THREE.Vector3(cx - 5.7, cy + 4, cz - 5.7));

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), rustMat);
    p2.position.set(6, 2, -6);
    encampment.add(p2);
    this.physics.addBox(new THREE.Vector3(cx + 5.7, cy, cz - 6.3), new THREE.Vector3(cx + 6.3, cy + 4, cz - 5.7));

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), rustMat);
    p3.position.set(-6, 2, 6);
    encampment.add(p3);
    this.physics.addBox(new THREE.Vector3(cx - 6.3, cy, cz + 5.7), new THREE.Vector3(cx - 5.7, cy + 4, cz + 6.3));

    const p4 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), rustMat);
    p4.position.set(6, 2, 6);
    encampment.add(p4);
    this.physics.addBox(new THREE.Vector3(cx + 5.7, cy, cz + 5.7), new THREE.Vector3(cx + 6.3, cy + 4, cz + 6.3));

    // Scavenged angled roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 0.25, 15), tarpMat);
    roof.position.set(0, 4.1, 0);
    roof.rotation.x = 0.08;
    encampment.add(roof);
    this.physics.addBox(new THREE.Vector3(cx - 7.5, cy + 3.9, cz - 7.5), new THREE.Vector3(cx + 7.5, cy + 4.3, cz + 7.5));

    // Scrap barricades on 3 sides with entry from North
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 0.5), scrapMat);
    southWall.position.set(0, 1.25, 6.7);
    encampment.add(southWall);
    this.physics.addBox(new THREE.Vector3(cx - 7, cy, cz + 6.4), new THREE.Vector3(cx + 7, cy + 2.5, cz + 7.0));

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 14), scrapMat);
    westWall.position.set(-6.7, 1.25, 0);
    encampment.add(westWall);
    this.physics.addBox(new THREE.Vector3(cx - 7.0, cy, cz - 7), new THREE.Vector3(cx - 6.4, cy + 2.5, cz + 7));

    // Clan Workstation / Smuggler Crate
    const crate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.5), rustMat);
    crate.position.set(3, 0.6, 2);
    encampment.add(crate);
    this.physics.addBox(new THREE.Vector3(cx + 1.7, cy, cz + 1.2), new THREE.Vector3(cx + 4.3, cy + 1.2, cz + 2.8));

    // Clan warm lantern
    const clanLight = new THREE.PointLight(0xff7722, 1.8, 16);
    clanLight.position.set(0, 3.0, 0);
    encampment.add(clanLight);

    this.group.add(encampment);
    this.structures.push({
      name: 'Clan Canyon Encampment',
      center: new THREE.Vector3(cx, cy, cz),
      bounds: new THREE.Box3(new THREE.Vector3(cx - 7, cy, cz - 7), new THREE.Vector3(cx + 7, cy + 4.5, cz + 7))
    });
  }

  // 3. Abandoned Notum Extraction Facility
  private buildAbandonedFacility() {
    const facility = new THREE.Group();
    const cx = 85, cy = 1.8, cz = 45;
    facility.position.set(cx, cy, cz);

    const industrialMat = new THREE.MeshStandardMaterial({ color: 0x363d44, roughness: 0.75, metalness: 0.7 });
    const vatGlassMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75
    });

    // Main hall floor: 18m x 14m
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 14), industrialMat);
    floor.position.set(0, 0, 0);
    facility.add(floor);
    this.physics.addBox(new THREE.Vector3(cx - 9, cy - 0.2, cz - 7), new THREE.Vector3(cx + 9, cy + 0.2, cz + 7));

    // Ceiling at 6m
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 14), industrialMat);
    ceiling.position.set(0, 6, 0);
    facility.add(ceiling);
    this.physics.addBox(new THREE.Vector3(cx - 9, cy + 5.8, cz - 7), new THREE.Vector3(cx + 9, cy + 6.2, cz + 7));

    // Outer walls with entryway on West
    // East wall: 14m x 6m
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 14), industrialMat);
    eastWall.position.set(9, 3, 0);
    facility.add(eastWall);
    this.physics.addBox(new THREE.Vector3(cx + 8.7, cy, cz - 7), new THREE.Vector3(cx + 9.3, cy + 6, cz + 7));

    // North wall: 18m x 6m
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 0.6), industrialMat);
    northWall.position.set(0, 3, -7);
    facility.add(northWall);
    this.physics.addBox(new THREE.Vector3(cx - 9, cy, cz - 7.3), new THREE.Vector3(cx + 9, cy + 6, cz - 6.7));

    // South wall: 18m x 6m
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 0.6), industrialMat);
    southWall.position.set(0, 3, 7);
    facility.add(southWall);
    this.physics.addBox(new THREE.Vector3(cx - 9, cy, cz + 6.7), new THREE.Vector3(cx + 9, cy + 6, cz + 7.3));

    // West entrance: 4m door in center, two 5m walls
    const westL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 5), industrialMat);
    westL.position.set(-9, 3, -4.5);
    facility.add(westL);
    this.physics.addBox(new THREE.Vector3(cx - 9.3, cy, cz - 7), new THREE.Vector3(cx - 8.7, cy + 6, cz - 2));

    const westR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 5), industrialMat);
    westR.position.set(-9, 3, 4.5);
    facility.add(westR);
    this.physics.addBox(new THREE.Vector3(cx - 9.3, cy, cz + 2), new THREE.Vector3(cx - 8.7, cy + 6, cz + 7));

    // Central Notum Extraction Vat
    const vat = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.8, 16), vatGlassMat);
    vat.position.set(0, 1.9, 0);
    facility.add(vat);
    this.physics.addBox(new THREE.Vector3(cx - 2.2, cy, cz - 2.2), new THREE.Vector3(cx + 2.2, cy + 3.8, cz + 2.2));

    // Cyan glowing notum core
    const notumCore = new THREE.PointLight(0x00ffff, 2.5, 18);
    notumCore.position.set(0, 2.0, 0);
    facility.add(notumCore);

    // Elevated Catwalk: 14m x 2.5m at height 2.2m
    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 2.5), industrialMat);
    catwalk.position.set(0, 2.2, -4.5);
    facility.add(catwalk);
    this.physics.addBox(new THREE.Vector3(cx - 7, cy + 2.1, cz - 5.75), new THREE.Vector3(cx + 7, cy + 2.35, cz - 3.25));

    // Step-up Stairs to Catwalk (step increments of 0.35m)
    for (let step = 0; step < 6; step++) {
      const stepH = 0.35;
      const stepY = step * stepH;
      const stepZ = -3.25 + step * 0.4;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, stepH, 0.4), industrialMat);
      stepMesh.position.set(-6, stepY + stepH / 2, stepZ);
      facility.add(stepMesh);
      this.physics.addBox(
        new THREE.Vector3(cx - 7, cy, cz + stepZ - 0.2),
        new THREE.Vector3(cx - 5, cy + stepY + stepH, cz + stepZ + 0.2)
      );
    }

    this.group.add(facility);
    this.structures.push({
      name: 'Abandoned Processing Facility',
      center: new THREE.Vector3(cx, cy, cz),
      bounds: new THREE.Box3(new THREE.Vector3(cx - 9, cy, cz - 7), new THREE.Vector3(cx + 9, cy + 6.5, cz + 7))
    });
  }
}
