import { CharacterSheet } from '../rpg/character';
import { ATTRIBUTE_LABELS, AttributeName } from '../rpg/attributes';
import { ProgramSystem, PROGRAM_DEFS, ProgramId } from '../combat/programs';
import { MissionTerminal } from '../missions/mission_terminal';
import { FactionManager } from '../factions/factions';
import { AudioSynthesizer } from '../audio/synth';
import { EquipSlot, InventoryItem } from '../rpg/items';

export class UIManager {
  public activeTab: 'char' | 'inv' | 'prog' | 'missions' = 'char';
  private modal: HTMLElement | null = null;
  private modalContent: HTMLElement | null = null;

  constructor(
    private character: CharacterSheet,
    private programs: ProgramSystem,
    private missions: MissionTerminal,
    private factions: FactionManager,
    private audio: AudioSynthesizer
  ) {
    this.modal = document.getElementById('system-menu');
    this.modalContent = document.getElementById('menu-content');
    this.bindTabButtons();
  }

  private bindTabButtons() {
    const tabs = [
      { id: 'tab-char', tab: 'char' as const },
      { id: 'tab-inv', tab: 'inv' as const },
      { id: 'tab-prog', tab: 'prog' as const },
      { id: 'tab-missions', tab: 'missions' as const }
    ];

    tabs.forEach(({ id, tab }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.switchTab(tab);
          this.audio.playClick();
        });
      }
    });
  }

  public switchTab(tab: 'char' | 'inv' | 'prog' | 'missions') {
    this.activeTab = tab;
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');
    this.renderActivePanel();
  }

  public openPanel(tab: 'char' | 'inv' | 'prog' | 'missions') {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.switchTab(tab);
    }
  }

  public closePanel() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  public isPanelOpen(): boolean {
    return this.modal ? this.modal.style.display === 'flex' : false;
  }

  public renderActivePanel() {
    if (!this.modalContent) return;

    if (this.activeTab === 'char') {
      this.renderCharacterPanel();
    } else if (this.activeTab === 'inv') {
      this.renderInventoryPanel();
    } else if (this.activeTab === 'prog') {
      this.renderProgramsPanel();
    } else {
      this.renderMissionsPanel();
    }
  }

  // 1. Character Sheet Panel
  private renderCharacterPanel() {
    if (!this.modalContent) return;
    const eff = this.character.getEffectiveAttributes();

    let html = `
      <div style="flex: 1; padding: 10px;">
        <h2 style="color: #00f0ff; margin-bottom: 12px;">OPERATIVE PROFILE // LEVEL ${this.character.level}</h2>
        <div style="margin-bottom: 14px; font-size: 13px; color: #88c0d0;">
          EXP: ${this.character.experience} / ${this.character.expForNextLevel()} &nbsp;|&nbsp;
          AVAILABLE SKILL POINTS: <span style="color: #ffaa33; font-weight: bold;">${this.character.skillPoints}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
    `;

    for (const [key, label] of Object.entries(ATTRIBUTE_LABELS) as [AttributeName, string][]) {
      const base = this.character.baseAttributes[key] + this.character.spentPoints[key];
      const total = eff[key];
      const bonus = total - base;
      const bonusText = bonus > 0 ? ` (+${bonus})` : '';

      html += `
        <div style="background: rgba(0, 30, 40, 0.5); padding: 10px; border: 1px solid rgba(0, 240, 255, 0.2); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; color: #e0f2f1;">${label}</div>
            <div style="font-size: 11px; color: #88c0d0;">Base: ${base}${bonusText} &rarr; <span style="color: #00f0ff; font-weight: bold;">${total}</span></div>
          </div>
          ${this.character.skillPoints > 0 ? `<button class="sp-btn" data-attr="${key}" style="background: #00f0ff; color: #000; border: none; padding: 4px 10px; font-weight: bold; cursor: pointer;">+</button>` : ''}
        </div>
      `;
    }

    html += `
        </div>
        <div style="margin-top: 18px; padding: 12px; background: rgba(0, 20, 30, 0.6); border: 1px solid rgba(255, 170, 51, 0.3);">
          <div style="color: #ffaa33; font-weight: bold; margin-bottom: 6px;">FACTION ALIGNMENT</div>
          <div>Omni-Mineral Corp Standing: <span style="color: ${this.factions.standings.corporation < -25 ? '#ff4444' : '#00f0ff'}">${this.factions.standings.corporation} (${this.factions.getVendorTier('corporation').toUpperCase()})</span></div>
          <div>Free Miners Clan Standing: <span style="color: ${this.factions.standings.clans < -25 ? '#ff4444' : '#00f0ff'}">${this.factions.standings.clans} (${this.factions.getVendorTier('clans').toUpperCase()})</span></div>
        </div>
      </div>
    `;

    this.modalContent.innerHTML = html;

    // Bind SP buttons
    this.modalContent.querySelectorAll('.sp-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const attr = (e.currentTarget as HTMLElement).getAttribute('data-attr') as AttributeName;
        if (this.character.investSkillPoint(attr)) {
          this.audio.playLevelUp();
          this.renderCharacterPanel();
        }
      });
    });
  }

  // 2. Inventory & Equipment Panel
  private renderInventoryPanel() {
    if (!this.modalContent) return;

    let html = `
      <div style="flex: 1; display: flex; gap: 20px;">
        <!-- Equipped Gear & Implants -->
        <div style="flex: 1; border-right: 1px solid rgba(0, 240, 255, 0.2); padding-right: 16px;">
          <h3 style="color: #00f0ff; margin-bottom: 12px;">EQUIPPED GEAR</h3>
    `;

    const gearSlots: ('head' | 'chest' | 'legs')[] = ['head', 'chest', 'legs'];
    gearSlots.forEach((slot) => {
      const item = this.character.equippedGear[slot];
      html += `
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(0, 30, 40, 0.5); border: 1px solid rgba(0, 240, 255, 0.3);">
          <div style="color: #ffaa33; font-size: 11px; text-transform: uppercase;">${slot}</div>
          <div style="font-weight: bold;">${item ? item.name : '<span style="color: #667788;">[Empty]</span>'}</div>
          ${item ? `<button class="unequip-btn" data-slot="${slot}" style="margin-top: 4px; background: #ff4444; color: #fff; border: none; padding: 2px 8px; font-size: 11px; cursor: pointer;">UNEQUIP</button>` : ''}
        </div>
      `;
    });

    html += `<h3 style="color: #00f0ff; margin: 16px 0 12px 0;">CYBERNETIC IMPLANTS</h3>`;
    const implantSlots: ('implant1' | 'implant2' | 'implant3')[] = ['implant1', 'implant2', 'implant3'];
    implantSlots.forEach((slot, idx) => {
      const item = this.character.equippedImplants[slot];
      html += `
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(0, 30, 40, 0.5); border: 1px solid rgba(0, 240, 255, 0.3);">
          <div style="color: #00f0ff; font-size: 11px; text-transform: uppercase;">SLOT ${idx + 1}</div>
          <div style="font-weight: bold;">${item ? item.name : '<span style="color: #667788;">[Empty]</span>'}</div>
          ${item ? `<button class="unequip-btn" data-slot="${slot}" style="margin-top: 4px; background: #ff4444; color: #fff; border: none; padding: 2px 8px; font-size: 11px; cursor: pointer;">UNEQUIP</button>` : ''}
        </div>
      `;
    });

    html += `
        </div>
        <!-- Inventory List -->
        <div style="flex: 1.5;">
          <h3 style="color: #00f0ff; margin-bottom: 12px;">BACKPACK STORAGE</h3>
          <div id="inv-feedback" style="color: #ff4444; font-size: 12px; margin-bottom: 8px; min-height: 18px;"></div>
    `;

    if (this.character.inventory.length === 0) {
      html += `<div style="color: #667788;">Inventory is empty.</div>`;
    } else {
      this.character.inventory.forEach((item, idx) => {
        html += `
          <div style="margin-bottom: 10px; padding: 10px; background: rgba(0, 30, 40, 0.5); border: 1px solid rgba(0, 240, 255, 0.3); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; color: #e0f2f1;">${item.name}</div>
              <div style="font-size: 11px; color: #88c0d0;">${item.description}</div>
            </div>
            ${item.slot ? `<button class="equip-btn" data-idx="${idx}" style="background: #00f0ff; color: #000; border: none; padding: 5px 12px; font-weight: bold; cursor: pointer;">EQUIP</button>` : ''}
          </div>
        `;
      });
    }

    html += `</div></div>`;
    this.modalContent.innerHTML = html;

    // Bind equip/unequip events
    this.modalContent.querySelectorAll('.equip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
        const item = this.character.inventory[idx];
        if (item) {
          const res = this.character.equip(item);
          const fb = document.getElementById('inv-feedback');
          if (res.success) {
            this.audio.playClick();
            this.renderInventoryPanel();
          } else {
            this.audio.playError();
            if (fb) fb.textContent = res.message;
          }
        }
      });
    });

    this.modalContent.querySelectorAll('.unequip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const slot = (e.currentTarget as HTMLElement).getAttribute('data-slot') as EquipSlot;
        const res = this.character.unequip(slot);
        const fb = document.getElementById('inv-feedback');
        if (res.success) {
          this.audio.playClick();
          this.renderInventoryPanel();
        } else {
          this.audio.playError();
          if (fb) fb.textContent = res.message;
        }
      });
    });
  }

  // 3. Programs Panel
  private renderProgramsPanel() {
    if (!this.modalContent) return;

    let html = `
      <div style="flex: 1;">
        <h3 style="color: #00f0ff; margin-bottom: 12px;">PROGRAMMABLE-MATTER MATRIX</h3>
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
    `;

    this.programs.equippedSlots.forEach((progId, idx) => {
      const def = progId ? PROGRAM_DEFS[progId] : null;
      html += `
        <div style="flex: 1; padding: 12px; background: rgba(0, 40, 50, 0.5); border: 1px solid #00f0ff;">
          <div style="color: #ffaa33; font-size: 11px;">HOTKEY [${idx + 1}]</div>
          <div style="font-weight: bold; margin: 4px 0;">${def ? def.name : '[EMPTY]'}</div>
          ${def ? `<div style="font-size: 11px; color: #88c0d0;">Cost: ${def.notumCost} | CD: ${def.cooldown}s</div>` : ''}
          ${def ? `<button class="prog-unequip-btn" data-slot="${idx}" style="margin-top: 6px; background: #ff4444; color: #fff; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer;">CLEAR</button>` : ''}
        </div>
      `;
    });

    html += `</div><h3 style="color: #00f0ff; margin-bottom: 12px;">AVAILABLE PROGRAM MODULES</h3><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">`;

    for (const [id, def] of Object.entries(PROGRAM_DEFS) as [ProgramId, any][]) {
      html += `
        <div style="padding: 12px; background: rgba(0, 30, 40, 0.5); border: 1px solid rgba(0, 240, 255, 0.3);">
          <div style="font-weight: bold; color: #00f0ff;">${def.name}</div>
          <div style="font-size: 12px; margin: 4px 0; color: #e0f2f1;">${def.description}</div>
          <div style="font-size: 11px; color: #ffaa33; margin-bottom: 8px;">Cost: ${def.notumCost} Notum &nbsp;|&nbsp; Cooldown: ${def.cooldown}s &nbsp;|&nbsp; Cast: ${def.castTime}s</div>
          <div style="display: flex; gap: 6px;">
            <button class="assign-btn" data-prog="${id}" data-slot="0" style="flex: 1; background: #00f0ff; color: #000; border: none; padding: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">SLOT 1</button>
            <button class="assign-btn" data-prog="${id}" data-slot="1" style="flex: 1; background: #00f0ff; color: #000; border: none; padding: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">SLOT 2</button>
            <button class="assign-btn" data-prog="${id}" data-slot="2" style="flex: 1; background: #00f0ff; color: #000; border: none; padding: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">SLOT 3</button>
            <button class="assign-btn" data-prog="${id}" data-slot="3" style="flex: 1; background: #00f0ff; color: #000; border: none; padding: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">SLOT 4</button>
          </div>
        </div>
      `;
    }

    html += `</div></div>`;
    this.modalContent.innerHTML = html;

    this.modalContent.querySelectorAll('.assign-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const prog = (e.currentTarget as HTMLElement).getAttribute('data-prog') as ProgramId;
        const slot = parseInt((e.currentTarget as HTMLElement).getAttribute('data-slot') || '0', 10);
        this.programs.equipProgram(slot, prog);
        this.audio.playClick();
        this.renderProgramsPanel();
      });
    });

    this.modalContent.querySelectorAll('.prog-unequip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt((e.currentTarget as HTMLElement).getAttribute('data-slot') || '0', 10);
        this.programs.unequipProgram(slot);
        this.audio.playClick();
        this.renderProgramsPanel();
      });
    });
  }

  // 4. Mission Log & Kiosk Terminal Panel
  private renderMissionsPanel() {
    if (!this.modalContent) return;

    let html = `
      <div style="flex: 1; display: flex; gap: 20px;">
        <div style="flex: 1.2;">
          <h3 style="color: #00f0ff; margin-bottom: 12px;">ACTIVE CONTRACTS (${this.missions.activeMissions.length})</h3>
    `;

    if (this.missions.activeMissions.length === 0) {
      html += `<div style="color: #667788;">No active contracts. Request new work from the terminal.</div>`;
    } else {
      this.missions.activeMissions.forEach((m) => {
        html += `
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(0, 30, 40, 0.5); border: 1px solid #00f0ff;">
            <div style="font-weight: bold; color: #ffaa33;">${m.title}</div>
            <div style="font-size: 12px; margin: 4px 0;">${m.description}</div>
            <div style="font-size: 11px; color: #88c0d0;">Location: ${m.location.name}</div>
            <div style="font-size: 11px; color: #00f0ff; margin-top: 4px;">Reward: ${m.creditReward} Credits | +${m.expReward} EXP</div>
          </div>
        `;
      });
    }

    html += `
        </div>
        <div style="flex: 1; background: rgba(0, 20, 30, 0.6); padding: 14px; border: 1px solid rgba(0, 240, 255, 0.3);">
          <h3 style="color: #ffaa33; margin-bottom: 10px;">DISPATCH KIOSK</h3>
          <div style="font-size: 12px; margin-bottom: 12px;">Select contract difficulty rating:</div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <button class="diff-btn" data-diff="1" style="flex: 1; padding: 6px; background: #00f0ff; color: #000; font-weight: bold; border: none; cursor: pointer;">TIER 1</button>
            <button class="diff-btn" data-diff="2" style="flex: 1; padding: 6px; background: #00f0ff; color: #000; font-weight: bold; border: none; cursor: pointer;">TIER 2</button>
            <button class="diff-btn" data-diff="3" style="flex: 1; padding: 6px; background: #00f0ff; color: #000; font-weight: bold; border: none; cursor: pointer;">TIER 3</button>
            <button class="diff-btn" data-diff="4" style="flex: 1; padding: 6px; background: #00f0ff; color: #000; font-weight: bold; border: none; cursor: pointer;">TIER 4</button>
            <button class="diff-btn" data-diff="5" style="flex: 1; padding: 6px; background: #00f0ff; color: #000; font-weight: bold; border: none; cursor: pointer;">TIER 5</button>
          </div>
          <div style="font-size: 11px; color: #88c0d0; line-height: 1.6;">
            Contracts are vetted for operational feasibility within Sector 4 mining claims. High-tier operations mandate confrontation with shielded heavy enforcers.
          </div>
        </div>
      </div>
    `;

    this.modalContent.innerHTML = html;

    this.modalContent.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const diff = parseInt((e.currentTarget as HTMLElement).getAttribute('data-diff') || '1', 10);
        const m = this.missions.generateContract(diff);
        this.missions.acceptContract(m);
        this.audio.playClick();
        this.renderMissionsPanel();
      });
    });
  }

  // Update diegetic in-game HUD
  public updateHUD() {
    // 1. Health Bar
    const hpFill = document.getElementById('hp-fill');
    const hpText = document.getElementById('hp-text');
    const maxHp = this.character.getMaxHealth();
    if (hpFill) hpFill.style.width = `${Math.max(0, (this.character.health / maxHp) * 100)}%`;
    if (hpText) hpText.textContent = `${Math.round(this.character.health)}/${maxHp}`;

    // 2. Notum Bar
    const notumFill = document.getElementById('notum-fill');
    const notumText = document.getElementById('notum-text');
    const maxNotum = this.character.getMaxNotum();
    if (notumFill) notumFill.style.width = `${Math.max(0, (this.character.notumEnergy / maxNotum) * 100)}%`;
    if (notumText) notumText.textContent = `${Math.round(this.character.notumEnergy)}/${maxNotum}`;

    // 3. Program Hotbar Slots
    this.programs.equippedSlots.forEach((progId, idx) => {
      const slotEl = document.getElementById(`slot-${idx + 1}`);
      if (slotEl) {
        const nameEl = slotEl.querySelector('.slot-name');
        const cdEl = slotEl.querySelector('.slot-cd');
        if (nameEl) nameEl.textContent = progId ? progId.toUpperCase() : '---';
        if (cdEl) {
          const cd = progId ? this.programs.cooldowns[progId] : 0;
          cdEl.textContent = cd > 0.1 ? `${cd.toFixed(1)}s` : '';
        }
      }
    });

    // 4. Alerts
    const alertsEl = document.getElementById('hud-alerts');
    if (alertsEl) {
      const corpTier = this.factions.getVendorTier('corporation').toUpperCase();
      const clanTier = this.factions.getVendorTier('clans').toUpperCase();
      alertsEl.textContent = `CORP: ${corpTier} // CLANS: ${clanTier}`;
    }
  }
}
