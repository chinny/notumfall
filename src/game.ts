import * as THREE from 'three';
import { PhysicsWorld } from './physics/collider';
import { PlayerController, PlayerInput } from './player/controller';
import { Terrain } from './world/terrain';
import { DesertEnvironment } from './world/skybox';
import { WorldStructures } from './world/structures';
import { WorldProps } from './world/props';
import { CyberCity } from './world/cyber_city';
import { InteractiveKiosk } from './world/cyber_interiors';
import { WeaponManager } from './combat/weapon_manager';
import { EnemyManager } from './combat/enemy_manager';
import { CharacterSheet } from './rpg/character';
import { INITIAL_ITEMS } from './rpg/items';
import { ProgramSystem } from './combat/programs';
import { FactionManager } from './factions/factions';
import { MissionTerminal } from './missions/mission_terminal';
import { AudioSynthesizer } from './audio/synth';
import { UIManager } from './ui/ui_manager';
import { SaveSystem } from './core/save_system';

export class Game {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer?: THREE.WebGLRenderer;
  public physics: PhysicsWorld;
  public terrain: Terrain;
  public environment?: DesertEnvironment;
  public structures: WorldStructures;
  public cyberCity: CyberCity;
  public props: WorldProps;
  public player: PlayerController;

  // Social & Kiosk interaction
  public activeKioskPrompt: string | null = null;
  public activeKiosk: InteractiveKiosk | null = null;

  // RPG & Combat Systems
  public character: CharacterSheet;
  public factions: FactionManager;
  public missions: MissionTerminal;
  public programs: ProgramSystem;
  public weapons: WeaponManager;
  public enemies: EnemyManager;
  public audio: AudioSynthesizer;
  public ui?: UIManager;

  public isRunning: boolean = false;
  public lastTime: number = 0;
  public autoSaveTimer: number = 0;
  public currentInput: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    jump: false,
    deltaPitch: 0,
    deltaYaw: 0
  };

  // Performance telemetry
  public frameTimes: number[] = [];
  public sustainedLagCount: number = 0;

  constructor(public container?: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 600);

    this.physics = new PhysicsWorld();
    this.terrain = new Terrain();
    this.scene.add(this.terrain.mesh);

    this.physics.heightfield = (x, z) => ({
      height: this.terrain.getHeight(x, z),
      normal: this.terrain.getNormal(x, z)
    });

    this.structures = new WorldStructures(this.physics);
    this.scene.add(this.structures.group);

    this.cyberCity = new CyberCity(this.physics);
    this.scene.add(this.cyberCity.group);

    this.props = new WorldProps(this.physics, this.terrain);
    this.scene.add(this.props.group);

    const spawnY = this.terrain.getHeight(0, 0) + 0.2;
    this.player = new PlayerController(this.physics, new THREE.Vector3(0, spawnY, 0));

    // RPG and combat initialization
    this.character = new CharacterSheet();
    this.character.inventory = [...INITIAL_ITEMS];
    this.factions = new FactionManager();
    this.missions = new MissionTerminal(this.factions, this.character);
    this.programs = new ProgramSystem(this.character);
    this.audio = new AudioSynthesizer();

    this.weapons = new WeaponManager(this.scene, this.camera);
    this.enemies = new EnemyManager(this.scene, this.terrain, this.physics);

    // Initial contract
    const firstMission = this.missions.generateContract(1);
    this.missions.acceptContract(firstMission);

    if (container) {
      this.initRenderer(container);
      this.ui = new UIManager(this.character, this.programs, this.missions, this.factions, this.audio);
      SaveSystem.loadFromLocalStorage(this.player, this.character, this.factions, this.missions, this.programs);
    }
  }

  private initRenderer(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.environment = new DesertEnvironment(this.scene);
    this.onResize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  }

  public onResize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  public update(dt: number) {
    const nowSec = performance.now() / 1000;

    // 1. Controller update
    this.player.update(dt, this.currentInput);
    this.currentInput.deltaPitch = 0;
    this.currentInput.deltaYaw = 0;

    // 2. Camera sync
    this.player.getCameraPosition(this.camera.position);
    const lookDir = this.player.getLookDirection();
    this.camera.lookAt(this.camera.position.clone().add(lookDir));

    // 3. Skybox update
    if (this.environment) {
      this.environment.update(this.player.position);
    }

    // 4. Weapons update
    this.weapons.update(dt, nowSec, this.player, (hit) => {
      // Weapon hitscan check against enemies
      const res = this.enemies.raycastHit(hit.ray);
      if (res.hit && res.enemy && res.distance <= hit.closestDist) {
        res.enemy.takeDamage(hit.damage);
      }
    });

    // 5. Enemies update
    this.enemies.update(
      dt,
      this.player,
      (dmg, enemy) => {
        // Player takes damage
        const remaining = this.programs.absorbDamageWithShield(dmg);
        this.character.health = Math.max(0, this.character.health - remaining);
        this.audio.playError();
      },
      (killedEnemy) => {
        // Enemy defeated
        this.character.addExperience(60 * killedEnemy.level);
        this.missions.notifyEnemyKilled(killedEnemy.config.type);
        this.audio.playLevelUp();
      }
    );

    // 6. Programs update
    this.programs.update(dt, this.player, this.enemies.enemies);

    // 7. Auto-save every 30 seconds
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 30.0) {
      this.autoSaveTimer = 0;
      SaveSystem.saveToLocalStorage(this.player, this.character, this.factions, this.missions, this.programs);
    }

    // 8. Kiosk proximity check
    this.checkKiosks();

    // 9. Update HUD
    this.updateHUD();
  }

  public checkKiosks(): void {
    const p = this.player.position;
    this.activeKiosk = null;
    this.activeKioskPrompt = null;

    for (const kiosk of this.cyberCity.kiosks) {
      if (p.distanceTo(kiosk.position) <= kiosk.interactionRadius) {
        this.activeKiosk = kiosk;
        this.activeKioskPrompt = kiosk.prompt;
        break;
      }
    }

    if (typeof document !== 'undefined') {
      const alertEl = document.getElementById('hud-alerts');
      if (alertEl && this.activeKioskPrompt) {
        alertEl.textContent = this.activeKioskPrompt;
        alertEl.style.color = '#00f0ff';
      }
    }
  }

  public interactWithActiveKiosk(): string | null {
    if (this.activeKiosk) {
      const msg = this.activeKiosk.action(this);
      if (typeof document !== 'undefined') {
        const alertEl = document.getElementById('hud-alerts');
        if (alertEl) {
          alertEl.textContent = msg;
          alertEl.style.color = '#ffaa33';
        }
      }
      return msg;
    }
    return null;
  }

  private updateHUD() {
    if (typeof document === 'undefined') return;
    const compassEl = document.getElementById('compass-heading');
    if (compassEl) {
      let deg = THREE.MathUtils.radToDeg(this.player.yaw) % 360;
      if (deg < 0) deg += 360;
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirIndex = Math.round(deg / 45) % 8;
      compassEl.textContent = `${dirs[dirIndex]} ${deg.toFixed(0).padStart(3, '0')}°`;
    }

    const zoneEl = document.getElementById('zone-name');
    if (zoneEl) {
      const p = this.player.position;
      const dCorp = Math.hypot(p.x - 0, p.z - (-60));
      const dClan = Math.hypot(p.x - (-80), p.z - 70);
      const dProc = Math.hypot(p.x - 85, p.z - 45);
      const dCyber = Math.hypot(p.x - (-90), p.z - (-70));
      const dCantina = Math.hypot(p.x - (-108), p.z - (-70));
      const dClinic = Math.hypot(p.x - (-90), p.z - (-88));
      const dMarket = Math.hypot(p.x - (-90), p.z - (-52));
      const dVault = Math.hypot(p.x - (-72), p.z - (-70));

      if (dCantina < 7.5) {
        zoneEl.textContent = 'THE GLITCH CANTINA // SECTOR 5';
      } else if (dClinic < 7.5) {
        zoneEl.textContent = 'CHROME & FLESH CLINIC // SECTOR 5';
      } else if (dMarket < 7.5) {
        zoneEl.textContent = 'SUB-NET BLACK MARKET // SECTOR 5';
      } else if (dVault < 8.5) {
        zoneEl.textContent = 'CORRUPTED DATA VAULT [HOSTILE] // SECTOR 5';
      } else if (dCyber < 35) {
        zoneEl.textContent = 'NEON SPRAWL // SECTOR 5 (SOCIAL HUB)';
      } else if (dCorp < 20) {
        zoneEl.textContent = 'CORPORATE OUTPOST // SECTOR 1';
      } else if (dClan < 22) {
        zoneEl.textContent = 'CLAN CANYON ENCAMPMENT // SECTOR 2';
      } else if (dProc < 24) {
        zoneEl.textContent = 'EXTRACTION FACILITY // SECTOR 3';
      } else {
        zoneEl.textContent = 'SECTOR 4: PARCHED VALE';
      }
    }

    if (this.ui) {
      this.ui.updateHUD();
    }
  }

  public render() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (now: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      const frameMs = dt * 1000;
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length > 300) this.frameTimes.shift();
      if (frameMs > 33.3) {
        this.sustainedLagCount++;
      } else {
        this.sustainedLagCount = Math.max(0, this.sustainedLagCount - 1);
      }

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
  }
}
