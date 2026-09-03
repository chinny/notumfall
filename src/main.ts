import { Game } from './game';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const game = new Game(container);
  (window as any).gameInstance = game;

  const startOverlay = document.getElementById('start-overlay');
  const systemMenu = document.getElementById('system-menu');

  const keyState: Record<string, boolean> = {};

  function updateInput() {
    game.currentInput.forward = !!(keyState['KeyW'] || keyState['ArrowUp']);
    game.currentInput.backward = !!(keyState['KeyS'] || keyState['ArrowDown']);
    game.currentInput.left = !!(keyState['KeyA'] || keyState['ArrowLeft']);
    game.currentInput.right = !!(keyState['KeyD'] || keyState['ArrowRight']);
    game.currentInput.sprint = !!(keyState['ShiftLeft'] || keyState['ShiftRight']);
    game.currentInput.crouch = !!(keyState['KeyC'] || keyState['ControlLeft']);
    game.currentInput.jump = !!keyState['Space'];
  }

  let isLocked = false;
  if (startOverlay) {
    startOverlay.addEventListener('click', () => {
      document.body.requestPointerLock();
      game.audio.ensureReady();
    });
  }

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === document.body;
    if (isLocked) {
      if (startOverlay) startOverlay.style.display = 'none';
      if (systemMenu) systemMenu.style.display = 'none';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isLocked) {
      game.currentInput.deltaYaw += e.movementX;
      game.currentInput.deltaPitch += e.movementY;
    }
  });

  // Weapon firing on mouse click
  document.addEventListener('mousedown', (e) => {
    if (!isLocked) return;
    if (e.button === 0) {
      const nowSec = performance.now() / 1000;
      game.weapons.fire(game.player, nowSec, (hit) => {
        const res = game.enemies.raycastHit(hit.ray);
        if (res.hit && res.enemy && res.distance <= hit.closestDist) {
          res.enemy.takeDamage(hit.damage);
        }
      });

      // Sound effect
      if (game.weapons.activeType === 'pistol') game.audio.playPistol();
      else if (game.weapons.activeType === 'rifle') game.audio.playRifle();
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (!isLocked) return;
    if (e.button === 0) {
      const nowSec = performance.now() / 1000;
      game.weapons.releaseFire(game.player, nowSec, (hit) => {
        const res = game.enemies.raycastHit(hit.ray);
        if (res.hit && res.enemy && res.distance <= hit.closestDist) {
          res.enemy.takeDamage(hit.damage);
        }
      });
      if (game.weapons.activeType === 'beam') game.audio.playBeam();
    }
  });

  window.addEventListener('keydown', (e) => {
    keyState[e.code] = true;
    updateInput();

    // Weapon reload
    if (e.code === 'KeyR' && isLocked) {
      game.weapons.reload();
      game.audio.playReload();
    }

    // Kiosk interaction or Weapon switching
    if ((e.code === 'KeyE' || e.code === 'KeyF') && game.activeKiosk) {
      game.interactWithActiveKiosk();
    } else if (e.code === 'Digit5' || e.code === 'KeyQ') {
      game.weapons.switchWeapon('pistol');
      game.audio.playClick();
    } else if (e.code === 'Digit6') {
      game.weapons.switchWeapon('rifle');
      game.audio.playClick();
    } else if (e.code === 'Digit7' || e.code === 'KeyE') {
      game.weapons.switchWeapon('beam');
      game.audio.playClick();
    }

    // Cast Programs 1-4
    if (e.code === 'Digit1') castSlot(0);
    if (e.code === 'Digit2') castSlot(1);
    if (e.code === 'Digit3') castSlot(2);
    if (e.code === 'Digit4') castSlot(3);

    // Modal navigation
    if (e.code === 'Tab' || e.code === 'KeyI') {
      e.preventDefault();
      togglePanel('inv');
    }
    if (e.code === 'KeyC') {
      // If menu open, toggle or switch
      if (systemMenu && systemMenu.style.display === 'flex') {
        if (game.ui?.activeTab === 'char') closeMenu();
        else game.ui?.openPanel('char');
      }
    }
    if (e.code === 'KeyP') {
      togglePanel('prog');
    }
    if (e.code === 'KeyM') {
      togglePanel('missions');
    }
    if (e.code === 'Escape') {
      closeMenu();
    }
  });

  window.addEventListener('keyup', (e) => {
    keyState[e.code] = false;
    updateInput();
  });

  function castSlot(slotIdx: number) {
    const res = game.programs.startCast(slotIdx);
    if (res.started) {
      game.audio.playClick();
      if (res.instant) {
        const id = game.programs.equippedSlots[slotIdx];
        if (id) game.programs.executeProgram(id, game.player, game.enemies.enemies);
      }
    } else if (res.message) {
      game.audio.playError();
    }
  }

  function togglePanel(tab: 'char' | 'inv' | 'prog' | 'missions') {
    if (!systemMenu || !game.ui) return;
    const isShowing = systemMenu.style.display === 'flex';
    if (isShowing && game.ui.activeTab === tab) {
      closeMenu();
    } else {
      document.exitPointerLock();
      game.ui.openPanel(tab);
    }
  }

  function closeMenu() {
    if (systemMenu) {
      systemMenu.style.display = 'none';
      if (!isLocked) document.body.requestPointerLock();
    }
  }

  const closeBtn = document.getElementById('btn-close-menu');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  window.addEventListener('resize', () => {
    game.onResize(window.innerWidth, window.innerHeight);
  });

  game.start();
});
