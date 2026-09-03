# NOTUMFALL

> *A single-player, first-person sci-fi action-RPG set on a parched mining world under corporate occupation, roughly 27,000 years in the future.*

---

## Overview

**Notumfall** is a complete, playable vertical slice of a first-person action-RPG. Set in the sun-bleached expanse of Sector 4 ("Parched Vale"), the game blends kinetic gunplay, programmable-matter abilities, deep RPG attribute puzzles, and dynamic faction politics between the bureaucratic **Omni-Mineral Corporation** and the insurgent **Free Miners Clan**.

Built entirely from scratch with **TypeScript**, **Three.js**, and **Vite** — without external game engines, asset packs, or third-party physics libraries.

---

## Core Gameplay Features

### 1. First-Person Combat & Gunplay
- **A-14 Nomad Pistol**: Kinetic semi-automatic sidearm (35 dmg, 3.0 rps).
- **Corp AR-12 Burst Rifle**: Corporate-issued 3-round burst rifle (20 dmg/bullet, 60 dmg/burst, 0.08s burst interval).
- **Notum Heavy Lance**: Experimental heavy beam weapon featuring a 0.8s charge-up cycle and 130 dmg discharge.
- **Weapon Mechanics**: Procedural viewmodel bobbing, recoil impulse pitch/yaw kick, reload animations, reserve ammo pools, and glowing hitscan tracer lines.
- **Target Dummies**: Practice yard dummies with continuous combat DPS tracking and automatic 3s idle reset.

### 2. Programmable-Matter Abilities
Harness the anomalous mineral *Notum* through six equippable programs powered by a regenerating energy pool:
- **Resonance Rupture** (`slot 1`): Heavy direct kinetic nuke dealing 95 damage.
- **Cellular Reconstruction** (`slot 2`): Nanite healing over time restoring 15 HP/sec for 5 seconds.
- **Matter Barrier** (`slot 3`): Hard-light energy shield absorbing 60 incoming damage for 8 seconds.
- **Quantum Slipstream** (`slot 4`): Phase-shift teleporting the player 10 meters forward.
- **Entropic Field**: Area-of-effect suppression field reducing enemy movement speed by 50% for 6 seconds.
- **Neural Overclock**: Synaptic stim buff granting +8 to all attributes and +30% movement speed for 10 seconds.
- **Hotbar Swapping**: 4-slot matrix allowing flexible program re-equipping without cooldown or state loss.

### 3. RPG Progression & Stat-Stacking Implant Puzzles
- **Eight Numeric Attributes**: Strength (`STR`), Agility (`AGI`), Stamina (`STA`), Intelligence (`INT`), Sense (`SNS`), Psychic (`PSY`), Matter Programming (`MPR`), and Bio-Metrology (`BIO`).
- **Character Leveling**: Levels 1–15 with 5 Skill Points awarded per level to allocate freely.
- **Gear & Implants**: Head, Chest, and Legs armor slots alongside 3 Cybernetic Implant slots.
- **Stat-Stacking Puzzle**: High-tier gear requires attribute minimums that can only be reached by equipping prerequisite implants. A strict dependency validator prevents unequipping or swapping any item that would drop effective attributes below another equipped item's requirements.

### 4. Enemies & Reactive State-Machine AI
- **Clan Dust Runner**: Aggressive melee rusher that charges head-on with hit-and-run attacks.
- **Corp Shock Trooper**: Tactical ranged skirmisher that maintains optimal distance and strafes while firing.
- **Corp Aegis Enforcer**: Heavy front-line soldier equipped with a glowing cyan energy barrier absorbing 70% of incoming damage.
- **Surveyor Attack Drone**: Agile aerial drone hovering 5m above the desert terrain.
- **AI Behaviors**: Full state machine implementing patrol routes, alert warnings, active combat engagement, retreat at $<25\%$ HP, and calling nearby allies within 30 meters.
- **Navigation Watchdog**: Built-in unsticking steering watchdog ensuring zero enemies remain stalled for $>3$ seconds across the 400m map.

### 5. Mission Terminal & Faction Standing
- **Dispatch Terminal**: Generates procedural contracts across 5 difficulty tiers:
  - *Elimination*: Neutralize hostile patrols or rogue drone squadrons.
  - *Retrieval*: Recover encrypted data caches or contraband mineral crates.
  - *VIP Escort*: Secure corporate liaisons or clan defectors across hazardous terrain.
- **Verified Waypoints**: All contract objectives draw from 100% reachable waypoints within the map boundaries.
- **Dynamic Faction Reputation**: Reputation scales from $-100$ to $+100$ for Omni-Mineral Corp and Free Miners Clan.
- **Consequences**: Faction standings gate vendor shop tiers (`restricted`, `standard`, `elite`) and trigger live guard hostility when standing drops below $-25$.

### 6. World Design & Three Interiors
- **Sector 4 (400m x 400m Continuous Map)**: Procedural dune elevation with analytical normals, mesa plateau, canyon depression, perimeter containment cliffs, and mineral deposits.
- **Corporate Outpost (Sector 1)**: Brutalist white-and-orange concrete bunker with central holographic dispatch terminal and security lighting.
- **Clan Canyon Encampment (Sector 2)**: Scrap-metal enclave nestled in the canyon depression with shade canopies, scavenged catwalks, and rebel vendors.
- **Abandoned Extraction Facility (Sector 3)**: Industrial complex housing a glowing Notum vat, elevated catwalks, and heavy refining machinery.
- **Procedural Props**: Mining pipelines, sensor warning pylons with holographic rings, drilling rigs, and sandstone boulders.

### 7. Audio, UI & Persistence
- **Web Audio API Synthesizer**: Procedural soundscapes with zero audio files — LFO-modulated ambient wind pad, weapon transients, reload clicks, and UI feedback tones.
- **Diegetic Glass HUD**: Minimal cyan/amber heads-up display with dynamic compass heading, health/notum status bars, weapon telemetry, and sector banners.
- **Full-Screen Terminal Modal**: Keyboard-accessible interface featuring Character Sheet, Inventory, Program Matrix, and Mission Terminal tabs.
- **State Persistence**: Complete serialization of player coordinates, RPG attributes, gear, inventory, faction standings, active missions, and hotbars to `localStorage`.

---

## Controls

| Key | Action |
| :--- | :--- |
| **W, A, S, D** | Move Forward / Left / Backward / Right |
| **Mouse Look** | Pitch and Yaw Camera Rotation |
| **Shift (Hold)** | Sprint (8.5 m/s) |
| **Ctrl (Hold)** | Crouch (1.1m camera height, 2.5 m/s) |
| **Space** | Jump |
| **Left Click** | Fire Active Weapon |
| **R** | Reload Weapon |
| **1, 2, 3, 4** | Cast Programmable-Matter Abilities |
| **C** | Open / Close Character Sheet |
| **I** | Open / Close Inventory & Cybernetic Implants |
| **P** | Open / Close Programs Hotbar Manager |
| **M** | Open / Close Mission Terminal & Faction Rep |
| **Escape** | Close All Open Panels / Exit Pointer Lock |

---

## Tech Stack & Architecture

- **Runtime**: TypeScript 5+
- **Rendering Engine**: Three.js (WebGL2, forward+ lighting, directional sun light, shadow maps, ambient hemisphere light)
- **Physics**: Custom minimal swept-capsule vs polygon mesh / heightfield collider ([`PhysicsWorld`](file:///home/jchin/repos/notumfall/src/physics/collider.ts)). Zero external physics dependencies.
- **Build Tool**: Vite 8+
- **Test Framework**: Vitest with Happy-DOM
- **Code Standards**: Strict modularity — every source file is strictly under 400 lines.

```
notumfall/
├── src/
│   ├── audio/         # Web Audio API procedural synthesizer
│   ├── combat/        # Weapons, target dummies, enemy AI, programmable matter
│   ├── core/          # Vector math, coordinate primitives, localStorage save system
│   ├── factions/      # Corporation and Clan standings, vendor gating
│   ├── missions/      # Procedural mission generation, contracts, objectives
│   ├── physics/       # Swept-capsule collider, heightfield and box mesh resolution
│   ├── player/        # First-person controller, camera, movement physics
│   ├── rpg/           # 8-attribute system, leveling, implants, gear requirements
│   ├── ui/            # HUD, responsive fullscreen modal panels
│   ├── world/         # Procedural terrain, skybox, structures, and props
│   ├── game.ts        # Main game coordinator and loop
│   └── main.ts        # Entrypoint, input handling, and event routing
├── tests/             # Comprehensive Vitest acceptance test suites
├── public/textures/   # Bespoke textures generated for terrain, objects, and structures
├── scripts/           # Headless browser verification and screenshot capture
├── DECISIONS.md       # Architectural decision records
├── PROGRESS.md        # Milestone completion log
└── KNOWN_ISSUES.md    # Documented non-blocking warnings
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/jchin/notumfall.git
cd notumfall
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. Click anywhere on the splash screen to engage pointer lock and initialize the audio synthesizer.

### Production Build
```bash
npm run build
```
Compiles TypeScript and produces an optimized production bundle in `dist/`.

### Running Tests
```bash
npm run test
```
Executes all 23 acceptance tests across 9 suites verifying controller physics, weapon DPS, enemy AI, implant puzzles, program abilities, missions, UI scaling, and 60-second synthetic simulation.

### Automated Browser Verification
```bash
node scripts/verify_slice.js
```
Runs a headless Chromium session, audits the browser console for zero uncaught errors, and captures 1920x1080 gameplay screenshots of the spawn point, interior, combat encounter, and inventory screen.

---

## License
MIT