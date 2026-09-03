# Architectural & Design Decisions

- Use Vite + TypeScript + Three.js for standalone zero-dependency WebGL2 rendering and fast HMR.
- Custom swept-capsule vs polygon mesh collider to guarantee zero clipping without external physics engines.
- Heightmap terrain with procedural multi-octave simplex/perlin noise and analytical derivatives for normal mapping.
- Slopes above 45 degrees are treated as impassable barriers that block forward ascent rather than inducing slippery physics sliding.
- Step-up on <= 0.4m ledges is resolved by checking obstacle top height against foot elevation and verifying vertical clearance.
- Three distinct interior structures: Corporate Outpost (brutalist bunker), Clan Encampment (canyon enclave), and Abandoned Processing Facility.
- Primitive-composed procedural props (pipelines, drill rigs, warning pylons, boulders) automatically register solid bounding colliders in PhysicsWorld.
- Weapon DPS tracking calculates damage over elapsed fire intervals and auto-resets after 3 seconds of dummy inactivity.
- Enemy state machine alerts all allies within 30m upon entering combat engagement.
- Unstick watchdog applies perpendicular evasion impulses when forward movement stalls for > 0.4s to guarantee navigation without getting stuck for > 3s.
- Character stat-stacking puzzle simulates future attribute state and strictly rejects any unequip or swap that would break dependent item requirements.
- Programmable-matter ability cooldowns are tracked per program definition rather than per slot to maintain cooldown state across hotbar reassignments.
- Procedural mission terminal draws targets exclusively from 100% verified reachable waypoints within the 400m x 400m zone.
- Faction standing shifts independently between Corporation and Clans, dynamically updating guard hostility when crossing the -25 threshold.
- Procedural audio uses bandpass-filtered pink noise modulated by a 0.15Hz LFO for ambient desert wind.
- Save system serializes complete player state, RPG attributes, gear, faction standings, active missions, and programs to localStorage.
- Modular code architecture keeps every single source file strictly below 400 lines.
