# Antigravity Build Prompt — Notumfall

Paste everything below the line into Antigravity as a single prompt.

---

## Role

You are building a playable vertical slice of a first-person sci-fi action-RPG
called **Notumfall**. Work autonomously. Do not ask me questions mid-build —
make a defensible choice, write it down in `DECISIONS.md`, and keep going.

## Scope guardrail (read this first)

This is **one zone, one hour of play** — not an MMO, not an open world, not
multiplayer. Single-player, offline, one continuous outdoor map roughly 400m x
400m with three interior structures. If you find yourself building account
systems, netcode, chat, or a second zone, stop and re-read this section.

## Stack

- TypeScript + Three.js, bundled with Vite. No game engine.
- Rendering: WebGL2, forward+ lighting, one directional sun and baked-feel
  ambient. Target 60fps on integrated graphics at 1080p.
- Physics: a minimal custom capsule-vs-mesh collider. Do not pull in a full
  physics engine.
- State: plain TypeScript, no framework. Save/load to `localStorage`.
- All art is generated or procedural: noise-based terrain textures, SDF/shader
  materials, primitive-composed props. **Do not download or embed any external
  art, audio, font, or model asset you did not generate.** No placeholder assets
  from asset stores.
- Audio: Web Audio API, synthesized. Ambient wind pad, weapon transients, UI
  clicks.

## Setting

A parched mining world under corporate occupation, roughly 27,000 years from
now. The planet is the only known source of a mineral that makes programmable
matter possible — which is why two factions are killing each other over dust.

- **The corporation** holds the walled city, the spaceport, and the mining
  claims. Brutalist white-and-orange architecture, holographic signage,
  bureaucratic menace. They are not cartoon villains; they run the only
  hospital.
- **The clans** are descendants of indentured mine workers. Scavenged armor,
  patched vehicles, encampments in the canyon shade. They are not noble
  rebels; they extort travelers.
- **Neutrals** are everyone caught between, which is most people.

Tone: sun-bleached, retro-futuristic, bureaucratic dystopia. Wide empty desert
punctuated by hard-edged machinery. Cyan and amber UI on dark glass. The world
should feel *administered*, not wild.

## Core systems (each needs a passing acceptance test)

### 1. First-person controller
WASD, mouse look, sprint, crouch, jump, step-up on 0.4m ledges. No sliding on
slopes above 45°. **Accept when:** the player cannot clip through any collider
after 500 randomized movement inputs.

### 2. Gunplay
Three weapons: a semi-auto pistol, a burst rifle, a charge-up beam. Hitscan with
tracer VFX. Recoil pattern, reload, ammo pools per weapon type. **Accept when:**
each weapon fires, reloads, damages a target dummy, and reports correct DPS in a
headless test.

### 3. Programmable-matter abilities (the RPG layer)
Six castable programs replacing traditional magic. Each has a cast time, a
resource cost from a regenerating pool, and a cooldown. Suggested set: a damage
nuke, a heal-over-time, a damage shield, a movement blink, an enemy slow, a
temporary stat buff. Programs are *items* the player equips into four slots, not
a fixed class kit. **Accept when:** all six cast, respect cooldowns, and can be
swapped in the inventory UI without state corruption.

### 4. Character progression
- Eight numeric attributes. Level 1–15 in the slice.
- Skill points on level-up, spent freely.
- Gear with attribute requirements — the player must meet them to equip.
- **Implants**: three slots, each granting attributes, and each with its *own*
  attribute requirement. This creates deliberate stat-stacking puzzles where the
  right equip order matters. Preserve that; it is the point.
- **Accept when:** an equip that would drop the player below another item's
  requirement is rejected with a clear message, never silently unequipping.

### 5. Enemies and combat encounters
Four enemy types: a melee rusher, a ranged skirmisher, a shielded heavy, a
flying drone. Simple state-machine AI — patrol, alert, engage, retreat at low
health, call nearby allies. Level-scaled stats. **Accept when:** all four
navigate to the player from anywhere on the map without getting stuck for more
than 3 seconds.

### 6. Mission terminal
A kiosk in the city generates procedural contracts: kill N of X, retrieve item
from location, escort an NPC. Rewards scale with a difficulty slider the player
sets. **Accept when:** 50 consecutively generated missions are all completable
and none reference an unreachable location.

### 7. Faction standing
Actions shift standing with corporation and clans independently. Standing gates
vendor inventory and whether faction guards shoot on sight. **Accept when:**
standing changes persist across save/load and guard hostility updates live.

### 8. UI
Diegetic-feeling HUD: health, resource pool, ammo, active program cooldowns,
compass. Full-screen inventory, character sheet, mission log. Keyboard
navigable. **Accept when:** every panel opens, closes, and renders correctly at
1280x720, 1920x1080, and 2560x1440.

## Milestones

Complete in order. Commit at each one with a descriptive message.

1. Vite + Three.js scaffold, empty terrain, working FPS controller
2. Collision, props, the three interiors, day-lit skybox
3. Weapons and target dummies
4. Enemies and AI
5. Character sheet, attributes, gear, implants
6. Programmable-matter abilities
7. Mission terminal and faction standing
8. Audio, VFX polish, save/load
9. Balance pass and difficulty tuning

## Verification protocol — run this after every milestone

1. `npm run build` must exit 0 with zero TypeScript errors.
2. `npm run test` must pass. Write the tests; do not skip this.
3. Launch the dev server and open it in the browser tool.
4. Read the browser console. **Zero uncaught errors and zero unhandled promise
   rejections.** Warnings are acceptable; log them in `KNOWN_ISSUES.md`.
5. Take screenshots at 1920x1080 of: the spawn point, one interior, an active
   combat encounter, the inventory screen. Look at them. If geometry is
   z-fighting, textures are stretched, UI overlaps, or the scene is black —
   that is a bug, fix it.
6. Drive the game with synthetic input for 60 seconds: move, fire, cast, open
   panels. Confirm no crash and no frame time above 33ms sustained.
7. Append a one-paragraph status entry to `PROGRESS.md`.

## Looping instruction

Repeat the following cycle until every milestone is complete and every
acceptance test above passes:

> Pick the earliest incomplete milestone. Implement the smallest coherent
> increment toward it. Run the full verification protocol. If anything fails,
> fix it and re-verify before moving on. If a milestone is complete, mark it and
> continue to the next.

Do not stop to report progress or ask whether to proceed. Stop only when all
nine milestones pass verification, or when you have hit the same failure three
times in a row — in that case, write the diagnosis to `BLOCKED.md` and stop.

## Constraints

- Never disable a failing test to make the suite pass.
- Never commit with a failing build.
- Keep any single source file under 400 lines; split by system.
- Write `DECISIONS.md` as you go: every non-obvious choice, one line each.
- Do not use any real-world trademarked names, characters, or settings.
