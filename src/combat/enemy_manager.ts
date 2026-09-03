import * as THREE from 'three';
import { Enemy, EnemyType } from './enemy';
import { Terrain } from '../world/terrain';
import { PhysicsWorld } from '../physics/collider';
import { PlayerController } from '../player/controller';

export class EnemyManager {
  public enemies: Enemy[] = [];
  public group: THREE.Group = new THREE.Group();

  constructor(
    private scene: THREE.Scene,
    private terrain: Terrain,
    private physics: PhysicsWorld
  ) {
    this.scene.add(this.group);
    this.spawnInitialEncounters();
  }

  public spawnEnemy(type: EnemyType, x: number, z: number, level: number = 1): Enemy {
    const y = this.terrain.getHeight(x, z);
    const enemy = new Enemy(type, new THREE.Vector3(x, y, z), level);
    this.enemies.push(enemy);
    this.group.add(enemy.mesh);
    return enemy;
  }

  private spawnInitialEncounters() {
    // 1. Clan patrols in the southern canyon
    this.spawnEnemy('rusher', -70, 50, 1);
    this.spawnEnemy('rusher', -60, 65, 1);
    this.spawnEnemy('skirmisher', -85, 80, 2);

    // 2. Corporate patrols near the Outpost perimeter
    this.spawnEnemy('skirmisher', 20, -45, 2);
    this.spawnEnemy('heavy', -20, -50, 3);

    // 3. Extraction facility guards and drones
    this.spawnEnemy('heavy', 80, 35, 3);
    this.spawnEnemy('drone', 90, 60, 2);
    this.spawnEnemy('drone', -30, 20, 1);

    // 4. Hostile Syndicate forces inside Sector 5 Corrupted Data Vault (-72, 4.0, -70)
    this.spawnEnemy('heavy', -70, -70, 3);
    this.spawnEnemy('skirmisher', -74, -72, 2);
    this.spawnEnemy('rusher', -74, -68, 2);
    this.spawnEnemy('drone', -68, -69, 2);
  }

  public raycastHit(ray: THREE.Ray): { hit: boolean; enemy?: Enemy; distance: number; point: THREE.Vector3 } {
    let closestDist = Infinity;
    let hitEnemy: Enemy | undefined;
    let hitPoint = new THREE.Vector3();
    const tempPoint = new THREE.Vector3();

    for (const e of this.enemies) {
      if (!e.isAlive()) continue;
      const box = new THREE.Box3();
      const r = 0.8;
      box.min.set(e.position.x - r, e.position.y, e.position.z - r);
      box.max.set(e.position.x + r, e.position.y + 2.2, e.position.z + r);

      const hit = ray.intersectBox(box, tempPoint);
      if (hit) {
        const dist = ray.origin.distanceTo(tempPoint);
        if (dist < closestDist) {
          closestDist = dist;
          hitEnemy = e;
          hitPoint.copy(tempPoint);
        }
      }
    }

    if (hitEnemy) {
      return { hit: true, enemy: hitEnemy, distance: closestDist, point: hitPoint };
    }
    return { hit: false, distance: Infinity, point: hitPoint };
  }

  public update(
    dt: number,
    player: PlayerController,
    onPlayerDamaged?: (dmg: number, enemy: Enemy) => void,
    onEnemyKilled?: (enemy: Enemy) => void
  ) {
    const playerPos = player.position;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.isAlive()) {
        if (onEnemyKilled) onEnemyKilled(e);
        this.group.remove(e.mesh);
        this.enemies.splice(i, 1);
        continue;
      }

      e.updateAI(dt, playerPos, this.terrain, this.physics, this.enemies);

      // Attack player check
      if (e.state === 'engage') {
        const distToPlayer = e.position.distanceTo(playerPos);
        if (distToPlayer <= e.config.attackRange && e.attackTimer <= 0) {
          e.attackTimer = e.config.attackCooldown;
          if (onPlayerDamaged) {
            onPlayerDamaged(e.damage, e);
          }
        }
      }
    }
  }
}
