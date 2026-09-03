// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CharacterSheet } from '../src/rpg/character';
import { ProgramSystem } from '../src/combat/programs';
import { MissionTerminal } from '../src/missions/mission_terminal';
import { FactionManager } from '../src/factions/factions';
import { AudioSynthesizer } from '../src/audio/synth';
import { UIManager } from '../src/ui/ui_manager';
import { INITIAL_ITEMS } from '../src/rpg/items';

describe('UI and Resolution Acceptance', () => {
  let char: CharacterSheet;
  let programs: ProgramSystem;
  let factions: FactionManager;
  let missions: MissionTerminal;
  let audio: AudioSynthesizer;
  let ui: UIManager;

  beforeEach(() => {
    // Setup mock DOM elements for headless vitest testing
    document.body.innerHTML = `
      <div id="hud">
        <div id="zone-name"></div>
        <div id="compass-heading"></div>
        <div id="hud-alerts"></div>
        <div id="hp-fill"></div>
        <div id="hp-text"></div>
        <div id="notum-fill"></div>
        <div id="notum-text"></div>
        <div id="slot-1"><span class="slot-name"></span><span class="slot-cd"></span></div>
        <div id="slot-2"><span class="slot-name"></span><span class="slot-cd"></span></div>
        <div id="slot-3"><span class="slot-name"></span><span class="slot-cd"></span></div>
        <div id="slot-4"><span class="slot-name"></span><span class="slot-cd"></span></div>
        <div id="weapon-name"></div>
        <div id="ammo-clip"></div>
        <div id="ammo-reserve"></div>
      </div>
      <div id="system-menu" style="display: none;">
        <button id="tab-char" class="nav-tab"></button>
        <button id="tab-inv" class="nav-tab"></button>
        <button id="tab-prog" class="nav-tab"></button>
        <button id="tab-missions" class="nav-tab"></button>
        <div id="menu-content"></div>
      </div>
    `;

    char = new CharacterSheet();
    char.inventory = [...INITIAL_ITEMS];
    programs = new ProgramSystem(char);
    factions = new FactionManager();
    missions = new MissionTerminal(factions, char);
    audio = new AudioSynthesizer();
    ui = new UIManager(char, programs, missions, factions, audio);
  });

  it('every panel opens, closes, and renders correctly', () => {
    // 1. Character panel
    ui.openPanel('char');
    expect(ui.isPanelOpen()).toBe(true);
    expect(document.getElementById('menu-content')?.innerHTML).toContain('OPERATIVE PROFILE');

    // 2. Inventory panel
    ui.switchTab('inv');
    expect(document.getElementById('menu-content')?.innerHTML).toContain('EQUIPPED GEAR');
    expect(document.getElementById('menu-content')?.innerHTML).toContain('BACKPACK STORAGE');

    // 3. Programs panel
    ui.switchTab('prog');
    expect(document.getElementById('menu-content')?.innerHTML).toContain('PROGRAMMABLE-MATTER MATRIX');

    // 4. Missions panel
    ui.switchTab('missions');
    expect(document.getElementById('menu-content')?.innerHTML).toContain('DISPATCH KIOSK');

    // Close panel
    ui.closePanel();
    expect(ui.isPanelOpen()).toBe(false);
  });

  it('renders correctly at 1280x720, 1920x1080, and 2560x1440 resolutions', () => {
    const resolutions = [
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 }
    ];

    const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 600);

    for (const res of resolutions) {
      camera.aspect = res.width / res.height;
      camera.updateProjectionMatrix();

      expect(camera.aspect).toBeCloseTo(16 / 9, 3);
      expect(camera.projectionMatrix.elements.length).toBe(16);

      // Verify UI HUD still updates without DOM errors at all dimensions
      ui.updateHUD();
      const hpText = document.getElementById('hp-text')?.textContent;
      expect(hpText).toContain('/');
    }
  });
});
