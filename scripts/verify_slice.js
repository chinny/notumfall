import puppeteer from 'puppeteer';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('1. Starting Vite Dev Server...');
  const server = await createServer({
    server: { port: 3000 }
  });
  await server.listen();
  console.log('Vite server running on http://localhost:3000');

  const artifactDir = '/home/jchin/.gemini/antigravity/brain/5dcd9201-b4e4-41aa-b243-510ee806ab35';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  const localScreenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(localScreenshotsDir)) {
    fs.mkdirSync(localScreenshotsDir, { recursive: true });
  }

  console.log('2. Launching Headless Chromium (1920x1080)...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/home/jchin/.cache/puppeteer/chrome/linux-152.0.7977.54/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--no-zygote',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleLogs = [];
  const uncaughtErrors = [];

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    uncaughtErrors.push(err.toString());
    console.error(`[UNCAUGHT PAGE ERROR] ${err.toString()}`);
  });

  console.log('3. Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Dismiss start overlay to enter game
  await page.evaluate(() => {
    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.click();
  });

  // Wait 1.5 seconds for initial rendering
  await new Promise((r) => setTimeout(r, 1500));

  async function saveScreenshot(filename) {
    const localPath = path.join(localScreenshotsDir, filename);
    const artifactPath = path.join(artifactDir, filename);
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`Saved screenshot: ${localPath} and ${artifactPath}`);
  }

  // Screenshot 1: Spawn Point
  console.log('Capturing Screenshot 1: Spawn Point...');
  await saveScreenshot('screenshot_spawn_point.png');

  // Screenshot 2: Corporate Outpost Interior
  console.log('Capturing Screenshot 2: Corporate Outpost Interior...');
  await page.evaluate(() => {
    const g = window.gameInstance;
    if (g) {
      g.player.position.set(0, 3.4, -55.5);
      g.player.yaw = 0; // Look north directly into outpost at holographic kiosk
      g.player.pitch = -0.08;
      g.update(0.016);
      g.render();
    }
  });
  await new Promise((r) => setTimeout(r, 500));
  await saveScreenshot('screenshot_interior.png');

  // Screenshot 3: Active Combat Encounter
  console.log('Capturing Screenshot 3: Active Combat Encounter...');
  await page.evaluate(() => {
    const g = window.gameInstance;
    if (g) {
      // Spawn an aggressive heavy and rusher in combat right ahead
      const e1 = g.enemies.spawnEnemy('heavy', -5, -45, 3);
      const e2 = g.enemies.spawnEnemy('skirmisher', 3, -47, 2);
      e1.state = 'engage';
      e2.state = 'engage';

      g.player.position.set(0, 2.0, -38);
      g.player.yaw = 0; // Facing negative Z (towards enemies)
      g.player.pitch = -0.04;

      // Fire weapon at the heavy
      g.weapons.fire(g.player, performance.now() / 1000);
      g.update(0.016);
      g.render();
    }
  });
  await new Promise((r) => setTimeout(r, 300));
  await saveScreenshot('screenshot_combat.png');

  // Screenshot 4: Inventory Screen
  console.log('Capturing Screenshot 4: Inventory Screen...');
  await page.evaluate(() => {
    const g = window.gameInstance;
    if (g && g.ui) {
      g.ui.openPanel('inv');
    }
  });
  await new Promise((r) => setTimeout(r, 500));
  await saveScreenshot('screenshot_inventory.png');

  console.log('Verification summary:');
  console.log(`Console message count: ${consoleLogs.length}`);
  console.log(`Uncaught errors count: ${uncaughtErrors.length}`);

  await browser.close();
  await server.close();

  if (uncaughtErrors.length > 0) {
    console.error('FAILED: Uncaught errors detected in browser console!');
    process.exit(1);
  } else {
    console.log('PASSED: Zero uncaught errors and zero unhandled rejections!');
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
