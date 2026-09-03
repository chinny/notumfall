import * as THREE from 'three';
import { PhysicsWorld } from '../physics/collider';
import { Terrain } from '../world/terrain';

export type EnemyType = 'rusher' | 'skirmisher' | 'heavy' | 'drone';
export type AIState = 'patrol' | 'alert' | 'engage' | 'retreat';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  baseHealth: number;
  baseDamage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  hoverHeight?: number;
  hasShield?: boolean;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  rusher: {
    type: 'rusher',
    name: 'Clan Dust Runner',
    baseHealth: 70,
    baseDamage: 22,
    speed: 7.2,
    attackRange: 2.2,
    attackCooldown: 1.0
  },
  skirmisher: {
    type: 'skirmisher',
    name: 'Corp Shock Trooper',
    baseHealth: 90,
    baseDamage: 14,
    speed: 4.8,
    attackRange: 20.0,
    attackCooldown: 1.8
  },
  heavy: {
    type: 'heavy',
    name: 'Corp Aegis Enforcer',
    baseHealth: 200,
    baseDamage: 35,
    speed: 3.2,
    attackRange: 3.5,
    attackCooldown: 2.2,
    hasShield: true
  },
  drone: {
    type: 'drone',
    name: 'Surveyor Attack Drone',
    baseHealth: 60,
    baseDamage: 12,
    speed: 6.0,
    attackRange: 16.0,
    attackCooldown: 1.2,
    hoverHeight: 5.0
  }
};

export class Enemy {
  public config: EnemyConfig;
  public level: number;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public state: AIState = 'patrol';

  public health: number;
  public maxHealth: number;
  public shield: number = 0;
  public maxShield: number = 0;
  public damage: number;

  public patrolAnchor: THREE.Vector3;
  public attackTimer: number = 0;
  public mesh: THREE.Group;

  // Stuck prevention
  public stuckTimer: number = 0;
  public lastPos: THREE.Vector3;
  public unstickDir: THREE.Vector3 = new THREE.Vector3();

  constructor(
    type: EnemyType,
    spawnPos: THREE.Vector3,
    level: number = 1
  ) {
    this.config = ENEMY_CONFIGS[type];
    this.level = Math.max(1, level);
    this.position = spawnPos.clone();
    this.lastPos = spawnPos.clone();
    this.patrolAnchor = spawnPos.clone();

    // Scale stats with level
    const levelMult = 1 + (this.level - 1) * 0.15;
    this.maxHealth = Math.round(this.config.baseHealth * levelMult);
    this.health = this.maxHealth;
    this.damage = Math.round(this.config.baseDamage * (1 + (this.level - 1) * 0.12));

    if (this.config.hasShield) {
      this.maxShield = Math.round(100 * levelMult);
      this.shield = this.maxShield;
    }

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
  }

  private createMesh(): THREE.Group {
    const grp = new THREE.Group();
    const type = this.config.type;

    if (type === 'rusher') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xc86432, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), mat);
      body.rotation.x = Math.PI;
      body.position.y = 0.8;
      grp.add(body);
    } else if (type === 'skirmisher') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x336699, roughness: 0.6, metalness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.5), mat);
      body.position.y = 0.9;
      grp.add(body);
    } else if (type === 'heavy') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5, metalness: 0.6 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.0), mat);
      body.position.y = 1.1;
      grp.add(body);
      // Frontal shield mesh
      const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.45 });
      const shieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), shieldMat);
      shieldMesh.position.set(0, 1.1, -0.6);
      grp.add(shieldMesh);
    } else {
      // Flying drone
      const mat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), mat);
      grp.add(body);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
      eye.position.set(0, 0, -0.5);
      grp.add(eye);
    }

    return grp;
  }

  public hasAlertedAllies: boolean = false;

  public takeDamage(amount: number): void {
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount * 0.7);
      this.shield -= absorbed;
      amount -= absorbed;
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health > 0) {
      this.state = 'engage';
      this.hasAlertedAllies = false;
    }
  }

  public alertAllies(allies: Enemy[]) {
    for (const ally of allies) {
      if (ally !== this && ally.isAlive() && ally.position.distanceTo(this.position) < 30) {
        ally.state = 'engage';
      }
    }
  }

  public isAlive(): boolean {
    return this.health > 0;
  }

  public updateAI(
    dt: number,
    playerPos: THREE.Vector3,
    terrain: Terrain,
    physics: PhysicsWorld,
    allies: Enemy[]
  ) {
    if (!this.isAlive()) return;

    const distToPlayer = this.position.distanceTo(playerPos);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    // State Transitions
    if (this.health < this.maxHealth * 0.25 && distToPlayer < 25) {
      this.state = 'retreat';
    } else if (this.state === 'engage' || distToPlayer < 35 || this.state === 'alert') {
      this.state = 'engage';
      if (!this.hasAlertedAllies) {
        this.hasAlertedAllies = true;
        this.alertAllies(allies);
      }
    } else if (distToPlayer > 250) {
      this.state = 'patrol';
      this.hasAlertedAllies = false;
    }

    // Steering & Navigation
    let moveDir = new THREE.Vector3();

    if (this.state === 'engage') {
      if (this.config.type === 'skirmisher' && distToPlayer < 12) {
        // Skirmisher maintains distance and circles
        const away = new THREE.Vector3().subVectors(this.position, playerPos).normalize();
        const side = new THREE.Vector3(-away.z, 0, away.x);
        moveDir.addScaledVector(away, 0.6).addScaledVector(side, 0.8).normalize();
      } else {
        // Approach player
        moveDir.subVectors(playerPos, this.position).normalize();
      }
    } else if (this.state === 'retreat') {
      moveDir.subVectors(this.position, playerPos).normalize();
    } else {
      // Patrol near anchor
      const distToAnchor = this.position.distanceTo(this.patrolAnchor);
      if (distToAnchor > 12) {
        moveDir.subVectors(this.patrolAnchor, this.position).normalize();
      }
    }

    // Unsticking watchdog: if speed requested but movement stalled
    const distMoved = this.position.distanceTo(this.lastPos);
    if (moveDir.lengthSq() > 0.01 && distMoved < this.config.speed * dt * 0.25) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.4) {
        if (this.unstickDir.lengthSq() < 0.1) {
          // Choose perpendicular evade vector
          this.unstickDir.set(-moveDir.z, 0, moveDir.x).normalize();
        }
        moveDir.addScaledVector(this.unstickDir, 2.0).normalize();
      }
    } else {
      this.stuckTimer = 0;
      this.unstickDir.set(0, 0, 0);
    }
    this.lastPos.copy(this.position);

    // Apply movement
    const currentSpeed = this.config.speed;
    const isDrone = this.config.type === 'drone';

    if (isDrone) {
      // Drone flies smoothly over terrain
      const targetY = terrain.getHeight(this.position.x, this.position.z) + (this.config.hoverHeight || 5.0);
      this.position.x += moveDir.x * currentSpeed * dt;
      this.position.z += moveDir.z * currentSpeed * dt;
      this.position.y += (targetY - this.position.y) * Math.min(1, 3.0 * dt);
    } else {
      // Ground enemies move and snap/step on terrain
      this.position.x += moveDir.x * currentSpeed * dt;
      this.position.z += moveDir.z * currentSpeed * dt;
      const groundY = terrain.getHeight(this.position.x, this.position.z);
      this.position.y = groundY;
    }

    // Orient mesh towards look target
    if (moveDir.lengthSq() > 0.01) {
      const angle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = angle;
    }
    this.mesh.position.copy(this.position);
  }
}
