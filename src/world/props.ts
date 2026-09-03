import * as THREE from 'three';
import { PhysicsWorld } from '../physics/collider';
import { Terrain } from './terrain';

export class WorldProps {
  public group: THREE.Group = new THREE.Group();

  constructor(private physics: PhysicsWorld, private terrain: Terrain) {
    this.spawnMiningPipelines();
    this.spawnWarningPylons();
    this.spawnDrillTowers();
    this.spawnRockFormations();
  }

  // 1. Industrial Mining Pipelines
  private spawnMiningPipelines() {
    let pipeMap: THREE.Texture | null = null;
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        pipeMap = new THREE.TextureLoader().load('/textures/pipeline.jpg');
        pipeMap.wrapS = THREE.RepeatWrapping;
        pipeMap.wrapT = THREE.RepeatWrapping;
        pipeMap.repeat.set(1, 4);
      } catch (e) {}
    }
    const pipeMat = new THREE.MeshStandardMaterial({ map: pipeMap, color: 0xffffff, roughness: 0.6, metalness: 0.8 });
    const pylonMat = new THREE.MeshStandardMaterial({ map: pipeMap, color: 0xff6600, roughness: 0.5, metalness: 0.4 });

    // Pipeline running from (10, -50) toward (70, 30)
    const count = 7;
    const start = new THREE.Vector3(10, 0, -45);
    const end = new THREE.Vector3(70, 0, 35);

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(start.x, end.x, t);
      const z = THREE.MathUtils.lerp(start.z, end.z, t);
      const groundY = this.terrain.getHeight(x, z);

      // Support pylon
      const pylonH = 3.0;
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.8, pylonH, 0.8), pylonMat);
      pylon.position.set(x, groundY + pylonH / 2, z);
      this.group.add(pylon);
      this.physics.addBox(
        new THREE.Vector3(x - 0.4, groundY, z - 0.4),
        new THREE.Vector3(x + 0.4, groundY + pylonH, z + 0.4)
      );

      // Horizontal Pipe section
      if (i < count) {
        const nextT = (i + 1) / count;
        const nx = THREE.MathUtils.lerp(start.x, end.x, nextT);
        const nz = THREE.MathUtils.lerp(start.z, end.z, nextT);
        const pipeLen = Math.hypot(nx - x, nz - z);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, pipeLen, 8), pipeMat);
        pipe.position.set((x + nx) / 2, groundY + pylonH - 0.2, (z + nz) / 2);
        pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx - x, 0, nz - z).normalize());
        this.group.add(pipe);
      }
    }
  }

  // 2. Corporate Holographic Boundary Pylons
  private spawnWarningPylons() {
    let pylonMap: THREE.Texture | null = null;
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        pylonMap = new THREE.TextureLoader().load('/textures/pylon.jpg');
        pylonMap.wrapS = THREE.RepeatWrapping;
        pylonMap.wrapT = THREE.RepeatWrapping;
        pylonMap.repeat.set(1, 2);
      } catch (e) {}
    }
    const pylonMat = new THREE.MeshStandardMaterial({ map: pylonMap, color: 0xffffff, roughness: 0.7, metalness: 0.3 });
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7, wireframe: true });

    const pylonPositions = [
      new THREE.Vector3(25, 0, -25),
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(45, 0, 0),
      new THREE.Vector3(-50, 0, 40)
    ];

    pylonPositions.forEach((pos) => {
      const gy = this.terrain.getHeight(pos.x, pos.z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8), pylonMat);
      post.position.set(pos.x, gy + 1.75, pos.z);
      this.group.add(post);
      this.physics.addBox(
        new THREE.Vector3(pos.x - 0.35, gy, pos.z - 0.35),
        new THREE.Vector3(pos.x + 0.35, gy + 3.5, pos.z + 0.35)
      );

      // Holographic beacon ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 16), holoMat);
      ring.position.set(pos.x, gy + 3.2, pos.z);
      ring.rotation.x = Math.PI / 2;
      this.group.add(ring);
    });
  }

  // 3. Mining Drill Towers
  private spawnDrillTowers() {
    let drillMap: THREE.Texture | null = null;
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        drillMap = new THREE.TextureLoader().load('/textures/drill.jpg');
        drillMap.wrapS = THREE.RepeatWrapping;
        drillMap.wrapT = THREE.RepeatWrapping;
        drillMap.repeat.set(2, 3);
      } catch (e) {}
    }
    const towerMat = new THREE.MeshStandardMaterial({ map: drillMap, color: 0xcccccc, roughness: 0.8, metalness: 0.5 });
    const drillMat = new THREE.MeshStandardMaterial({ map: drillMap, color: 0xff8833, roughness: 0.4, metalness: 0.6 });

    const towerLocations = [
      new THREE.Vector3(50, 0, -80),
      new THREE.Vector3(-60, 0, -30)
    ];

    towerLocations.forEach((loc) => {
      const gy = this.terrain.getHeight(loc.x, loc.z);
      // Heavy base
      const base = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), towerMat);
      base.position.set(loc.x, gy + 0.75, loc.z);
      this.group.add(base);
      this.physics.addBox(
        new THREE.Vector3(loc.x - 2, gy, loc.z - 2),
        new THREE.Vector3(loc.x + 2, gy + 1.5, loc.z + 2)
      );

      // Drill rig lattice
      const lattice = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 8, 4), drillMat);
      lattice.position.set(loc.x, gy + 5.5, loc.z);
      this.group.add(lattice);
      this.physics.addBox(
        new THREE.Vector3(loc.x - 1, gy + 1.5, loc.z - 1),
        new THREE.Vector3(loc.x + 1, gy + 9.5, loc.z + 1)
      );
    });
  }

  // 4. Natural Desert Boulders
  private spawnRockFormations() {
    let rockMap: THREE.Texture | null = null;
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        rockMap = new THREE.TextureLoader().load('/textures/rock.jpg');
        rockMap.wrapS = THREE.RepeatWrapping;
        rockMap.wrapT = THREE.RepeatWrapping;
        rockMap.repeat.set(1.5, 1.5);
      } catch (e) {}
    }
    const rockMat = new THREE.MeshStandardMaterial({ map: rockMap, color: 0xddbbaa, roughness: 0.95 });
    const clusters = [
      { x: -30, z: 20, size: 2.5 },
      { x: 20, z: 50, size: 3.2 },
      { x: -40, z: 80, size: 4.0 },
      { x: 60, z: -20, size: 2.8 }
    ];

    clusters.forEach((c) => {
      const gy = this.terrain.getHeight(c.x, c.z);
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(c.size, 1), rockMat);
      boulder.position.set(c.x, gy + c.size * 0.7, c.z);
      boulder.scale.set(1.1, 0.8, 1.3);
      this.group.add(boulder);
      this.physics.addBox(
        new THREE.Vector3(c.x - c.size * 0.9, gy, c.z - c.size * 1.1),
        new THREE.Vector3(c.x + c.size * 0.9, gy + c.size * 1.4, c.z + c.size * 1.1)
      );
    });
  }
}
