# Star Wars: Imperial Core Strike — 3D Space Shooter & Dynamic Neural Engine

An interactive, high-performance 3D space dogfight arcade game and holographic neural mesh simulator built with **React 19**, **Three.js**, **Vite**, **Tailwind CSS**, and the **Web Audio API**.

Engage Imperial starfighter squadrons in full 3D space, defend your starfighter's **Core Reactor** from charged plasma strikes, deflect incoming laser bolts mid-flight, unleash homing **Proton Torpedo Volleys**, and liberate sector waves against TIE Interceptors, TIE Fighters, and Elite TIE Advanced starships.

---

## Table of Contents
1. [Game Overview & Features](#game-overview--features)
2. [How to Play](#how-to-play)
   - [Cockpit Controls](#cockpit-controls)
   - [Combat Mechanics](#combat-mechanics)
   - [The Imperial Core Strike System](#the-imperial-core-strike-system)
   - [Mid-Air Deflections](#mid-air-deflections)
   - [Core Reactor vs Deflector Shields](#core-reactor-vs-deflector-shields)
   - [Blaster Power Tiers & Hyper Strike](#blaster-power-tiers--hyper-strike)
   - [Enemy Starfighter Types](#enemy-starfighter-types)
   - [Astromech Tactical Droid Co-Pilot (In-Game Robotic Guide)](#astromech-tactical-droid-co-pilot-in-game-robotic-guide)
3. [What You Can Do With This Project](#what-you-can-do-with-this-project)
4. [Hosting & Deployment Guide](#hosting--deployment-guide)
   - [Pushing to Your GitHub Repository](#pushing-to-your-github-repository)
   - [Local Development](#local-development)
   - [Deploying to Vercel](#deploying-to-vercel)
   - [Deploying to Netlify](#deploying-to-netlify)
   - [Deploying with Docker & Cloud Run](#deploying-with-docker--cloud-run)
   - [Deploying to GitHub Pages](#deploying-to-github-pages)
5. [Agent & Developer Replication Guide](#agent--developer-replication-guide)
   - [System Architecture & File Tree](#system-architecture--file-tree)
   - [Zero-GC Three.js Rendering Engine](#zero-gc-threejs-rendering-engine)
   - [3D-to-2D Coordinate Projection Pipeline](#3d-to-2d-coordinate-projection-pipeline)
   - [Procedural Web Audio Engine (No External Assets)](#procedural-web-audio-engine-no-external-assets)
   - [Extending the Game (Recipes)](#extending-the-game-recipes)
6. [Configuration & Environment Variables](#configuration--environment-variables)

---

## Game Overview & Features

- **Full 3D Real-Time Space Dogfight**: Fly in cockpit view surrounded by orbiting, swooping, and strafing Imperial squadrons.
- **Imperial Core Strike System**: Enemies actively acquire target locks on your cockpit Core Reactor, displaying a 3D tracking reticle and a **3-second lock-on countdown** before unleashing heavy charged plasma bolts.
- **Mid-Air Projectile Deflection**: Click incoming enemy plasma bolts mid-flight to deflect them, canceling core damage, earning bonus points, and recharging reactor energy.
- **Astromech Tactical Droid (`R4-T9`) Co-Pilot**: An in-game side-docked robotic advisor that chirps, beeps, and gives real-time situational guidance (deflection reminders, lock-on threat alerts, overdrive announcements, and an interactive Tactical Flight Manual).
- **Two-Tier Defense System**: Independent **Deflector Shield** (absorbs standard laser fire) and **Core Reactor** (critical life-support containment).
- **Weapon Power Overdrive**: Accumulate blaster power with every hit and combo to advance from Twin Cannons to Dual Turbolasers, Quad Ion Cannons, and the devastating homing **Proton Torpedo Volley**.
- **Dynamic Screen Projection**: Hit indicators (`+1`), combo multipliers (`COMBO x2!`, `COMBO x3! 🔥`), and shield ripple notifications are mathematically projected from 3D world space into responsive screen coordinates.
- **100% Procedural Web Audio**: Every blaster screech, explosion, shield deflect sizzle, warning siren, and orchestral victory fanfare is synthesized in real time using the browser's Web Audio API — **zero external audio files or MP3 downloads required**.
- **3D Neural Mesh Anatomical Explorer**: Toggle between dogfight mode and an anatomical 3D neural brain mesh with real-time shockwaves, morphing shapes, and holographic scanlines.

---

## How to Play

### Cockpit Controls

| Action | Control | Description |
| :--- | :--- | :--- |
| **Fire Blasters / Attack Ship** | **Left Click (Target)** | Directs turbolaser cannons at the clicked enemy starship or incoming projectile. |
| **Auto-Aim Assist** | **Toggle in HUD / Click** | When enabled, leads blaster fire directly toward the closest hostile starship in view. |
| **Deflect Incoming Bolts** | **Left Click (Incoming Bolt)** | Intercepts incoming plasma bolts mid-flight to deflect them back and recharge energy. |
| **Collect Reactor Cell** | **Left Click (Floating Canister)** | Collects drifting green Core Reactor Cells for an immediate `+15%` core restore. |
| **Hyper Counter-Strike** | **[Spacebar]** or **HUD Button** | Unleashes homing Proton Torpedoes once blaster power reaches 100%. |
| **Orbit Camera / Look Around** | **Click & Drag (Mouse)** | Sweeps the cockpit view to locate flanking or rear Imperial fighters. |
| **Zoom View** | **Mouse Scroll Wheel** | Adjusts camera field of view and depth. |

---

### Combat Mechanics

#### The Imperial Core Strike System
1. **Target Acquisition**: Hostile starships periodically select your cockpit Core Reactor as a primary target. Only one ship executes a Core Lock at any given moment to keep combat fair and skill-based.
2. **3-Second Lock Countdown**: A rotating red targeting reticle locks onto the enemy ship in 3D space, showing a visible countdown: `3.0s` &rarr; `2.0s` &rarr; `1.0s` with warning audio beeps.
3. **Interrupting the Lock**: If you destroy the locking enemy ship before the 3-second timer expires, the lock is broken and the strike is canceled.
4. **Charged Plasma Firing**: When the countdown completes, the ship fires a high-velocity red plasma bolt directly toward your cockpit center.
5. **Direct Impact**:
   - **Normal Core Strike**: Drains `12%` core energy.
   - **Heavy Core Strike** (TIE Advanced): Drains `22%` core energy.
   - Impact triggers violent camera shake, screen impact flashes, and electrical spark audio.

---

#### Mid-Air Deflections
While an incoming bolt is speeding toward your cockpit:
- Click the bolt directly in 3D space.
- A successful hit triggers **"PERFECT DEFLECTION! 🛡️"**.
- Deflecting a core strike **cancels all core damage**, restores **`+3%` Core Energy**, awards bonus points, and increases your combo streak.

---

#### Core Reactor vs Deflector Shields
The game operates two independent protective layers:

```
+-------------------------------------------------------------+
|                     STARFIGHTER DEFENSE                     |
+------------------------------+------------------------------+
|     DEFLECTOR SHIELDS        |         CORE REACTOR         |
|  - Absorbs standard blaster  |  - High-voltage reactor core |
|    fire (-8% per hit)        |  - Targeted by Core Strikes  |
|  - Siphons +10% on ship kills|  - Drains 12% / 22% on hits  |
|  - Reboots automatically     |  - At 0%: MISSION FAILED     |
+------------------------------+------------------------------+
```

- **Core Energy Economy**:
  - `Normal Core Hit`: `-12%`
  - `Heavy Core Attack`: `-22%`
  - `Perfect Deflection`: `+3%`
  - `Elite Kill (TIE Advanced)`: `+8%`
  - `Reactor Cell Pickup`: `+15%`
  - Clamped strictly between `0%` and `100%`.
- **Critical Warning (&le; 30% Core)**:
  - Activates red pulsing hazard borders.
  - Triggers emergency cockpit strobe lights.
  - Heartbeat klaxon audio warning sounds continuously.

---

#### Blaster Power Tiers & Hyper Strike
Hitting enemy ships builds your **Blaster Power** gauge (`0%` &rarr; `100%`). Taking shield or core damage also grants revenge power.

- **Tier 1 (0–32%)**: Twin Blaster Cannons (Standard fire rate).
- **Tier 2 (33–65%)**: Dual Heavy Turbolasers (Higher velocity, longer bolt streaks).
- **Tier 3 (66–99%)**: Quad Ion Cannons (Cyan energy bolts, wider destructive arc).
- **Tier 4 (100% MAX)**: **Hyper Overdrive**.
  - Press **[Spacebar]** or click the flashing HUD button to fire **Proton Torpedoes**.
  - Homing torpedoes seek out and destroy all active enemy starships in the sector with fiery explosion cascades!

---

#### Enemy Starfighter Types

| Ship | Type | Behavior | Bolt Speed | Core Damage | Special |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Imperial TIE Fighter** | Standard Patrol | Sweeping swoop runs | `24.0` | `12%` | Regular escort target |
| **TIE Interceptor** | Agile Interceptor | High-speed strafing attack runs | `30.0` | `12%` | Rapid attack frequency |
| **TIE Advanced x1** | Elite Squadron | Heavy charged plasma barrage | `32.0` | `22% (Heavy)` | Yields `+8%` Core Restore on kill |
| **Viper Probe Droid** | Recon Scout | Orbital sensor lock & sniper bolts | `28.0` | `12%` | Agile reconnaissance drone |

---

#### Reactor Failure & Game Over
When Core Energy reaches `0%`:
1. Enemy firing stops immediately and combat input is locked.
2. A cinematic **Reactor Breach sequence** triggers with a sub-atomic explosion flash and catastrophic audio roar.
3. The **"MISSION FAILED — CORE DESTROYED"** console displays your final score, sector wave, targets destroyed, and deflection count.
4. Choose **Restart Wave** (try the current wave again with full core energy) or **Restart Mission** (start fresh from Wave 1).

---

#### Astromech Tactical Droid Co-Pilot (In-Game Robotic Guide)
Located on the left side of your cockpit screen, **Droid R4-T9** serves as your real-time tactical co-pilot:
- **Audio Telemetry**: Procedurally emits astromech whistles, chirps, and warning screeches as combat conditions evolve.
- **Situational Protocol Tips**:
  - `*BEEP-WHRRR-SCREECH!* [CORE LOCK DETECTED]`: Alerts you when a hostile is targeting your core with remaining seconds.
  - `*CHIRP-WHISTLE* [DEFLECT PROTOCOL]`: Reminds you to click incoming red plasma bolts mid-flight for `+3%` core energy.
  - `*EXCITED-CHIRP-TRRILL!* [OVERDRIVE READY]`: Signals that your Blaster Power is at 100% and ready for Proton Torpedo launch.
  - `*SAD-WHISTLE-BEEP!* [CORE CRITICAL]`: Urgent advisory when Core Reactor drops to &le; 30%.
- **Interactive Controls**:
  - Click `[HOW TO PLAY]` or the help icon to open the complete **Astromech Flight Manual** in-game.
  - Click `NEXT SITREP >>` to cycle through tactical operational tips.
  - Click `[MUTE]` or `[MINIMIZE]` to shrink the droid into a minimal status pill.

---

## What You Can Do With This Project

1. **Space Combat Arcade Game**: Use it as a turnkey web-based 3D sci-fi dogfight shooter with responsive mouse and keyboard controls.
2. **Interactive 3D Portfolio or Landing Page**: The dynamic Three.js neural mesh with particle dynamics, post-processing bloom, and holographic shaders can be customized with your own 3D models or brand colors.
3. **Web Audio Synthesizer Reference**: Learn how to build production-grade, zero-dependency sound effects (lasers, shields, alarms, explosions, fanfares) purely with JavaScript and Web Audio nodes.
4. **Custom 3D Wave Shooter Engine**: Add new ships, bosses (e.g. Star Destroyers), custom weapons, or multiplayer features using the existing modular architecture.

---

## Hosting & Deployment Guide

### Pushing to Your GitHub Repository

To push this project to your own GitHub account:

1. **Create an empty repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (e.g., `starwars-imperial-core-strike`).
   - Do **NOT** initialize with a README, `.gitignore`, or license (the project already has them).

2. **Add your GitHub remote and push**:
   Run the following commands in your project terminal:
   ```bash
   # Add your remote GitHub repository (replace with your repo URL)
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git

   # Ensure your primary branch is named main
   git branch -M main

   # Push your code and set upstream tracking
   git push -u origin main
   ```

3. **Subsequent updates**:
   ```bash
   git add -A
   git commit -m "Update game features"
   git push
   ```

---

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or: bun install / pnpm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run TypeScript check / linting**:
   ```bash
   npm run lint
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```
   The compiled static bundle will be generated in the `dist/` directory.

---

### Deploying to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

---

### Deploying to Netlify

1. Go to [Netlify](https://netlify.com) and select **"Add new site" &rarr; "Import an existing project"**.
2. Connect your GitHub repository.
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy Site**.

---

### Deploying with Docker & Cloud Run

Create a `Dockerfile` in the root directory:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

To build and run locally:
```bash
docker build -t starwars-shooter .
docker run -p 3000:80 starwars-shooter
```

---

### Deploying to GitHub Pages

1. In `vite.config.ts`, set the base path to your repository name:
   ```ts
   export default defineConfig({
     base: '/<your-repo-name>/',
     // ... rest of config
   });
   ```
2. Build and push the `dist` folder to the `gh-pages` branch, or configure GitHub Actions:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

---

## Agent & Developer Replication Guide

If you are an AI agent, automated assistant, or software engineer seeking to understand, replicate, or extend this application, this section breaks down the entire codebase.

### System Architecture & File Tree

```
/
├── index.html                   # HTML entry point, viewport & metadata
├── package.json                 # Dependencies (Three.js, React 19, Tailwind CSS)
├── vite.config.ts               # Vite bundler configuration
├── tsconfig.json                # TypeScript compiler configuration
├── src/
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Top-level state orchestrator & combat lifecycle
│   ├── types.ts                 # Shared TypeScript interfaces & types
│   ├── index.css                # Global Tailwind CSS & custom animations
│   ├── audio/
│   │   └── neuralAudio.ts       # Zero-dependency Web Audio procedural sound engine
│   ├── components/
│   │   ├── NeuralScene.tsx      # Main Three.js WebGL rendering engine & game loop
│   │   ├── CombatHud.tsx        # Heads-Up Display, 3D projections, dials & overlays
│   │   ├── TacticalDroidGuide.tsx # Astromech Droid real-time robotic co-pilot HUD
│   │   └── ControlOverlay.tsx   # Visual settings, theme & shape morphing panel
│   └── geometry/
│       ├── starwarsCombat.ts    # Ship 3D wireframe meshes, AI flight & debris
│       ├── brainGenerator.ts    # Anatomical neural cloud node generator
│       ├── morphShapes.ts       # 3D morph target definitions (X-Wing, Falcon, etc.)
│       └── triangleGeometry.ts  # Hollow triangle instanced geometry helpers
```

---

### Zero-GC Three.js Rendering Engine
Located in `src/components/NeuralScene.tsx`:
- **Module-Level Reusable Structs**: To prevent Garbage Collection (GC) pauses during 60 FPS combat, all mathematical primitives (`THREE.Vector3`, `THREE.Matrix4`, `THREE.Quaternion`, `THREE.Euler`, `THREE.Color`, `THREE.Raycaster`) are instantiated once at module scope:
  ```ts
  const _vec3 = new THREE.Vector3();
  const _pos = new THREE.Vector3();
  const _scale = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _mat4 = new THREE.Matrix4();
  const _raycaster = new THREE.Raycaster();
  ```
- **Dynamic Line Buffers**: Player and enemy laser bolts are rendered via `THREE.LineSegments` backed by flat `Float32Array` attributes using `DynamicDrawUsage`. Instead of allocating new meshes for each shot, buffer slices are updated in place with `setDrawRange()`.
- **Instanced Debris & Pickups**: Ship destruction particles and floating Core Reactor pickups use `THREE.InstancedMesh` with matrix and color updates for high throughput.

---

### 3D-to-2D Coordinate Projection Pipeline
The system maps 3D world vectors into exact 2D pixel coordinates for floating notifications (`+1`, `COMBO x3!`, lock reticles):

```ts
// 1. Project 3D world position through camera into Normalized Device Coordinates [-1, 1]
const proj = worldPosition.clone().project(camera);

// 2. Scale NDC into viewport pixel coordinates
const screenW = renderer.domElement.clientWidth || window.innerWidth;
const screenH = renderer.domElement.clientHeight || window.innerHeight;
const screenX = ((proj.x + 1) * 0.5) * screenW;
const screenY = ((-proj.y + 1) * 0.5) * screenH;
```
This enables HUD elements in `CombatHud.tsx` to follow 3D starships and bolts with pixel accuracy.

---

### Procedural Web Audio Engine (No External Assets)
Located in `src/audio/neuralAudio.ts`:
- **AudioContext Initialization**: Lazily created on first user click to comply with browser autoplay policies.
- **Tone & Envelope Design**:
  - `playEnemyBlasterFire()`: Sawtooth oscillator sweeping exponentially from `1420Hz` down to `180Hz` with a resonant bandpass filter.
  - `playCoreStrikeFired()`: Heavy low-frequency saw sweep (`800Hz` down to `90Hz`) with sub-bass discharge.
  - `playCoreDamage()`: Dual-layer audio: deep sub-bass triangle shudder (`120Hz` down to `30Hz`) layered with white noise burst through a bandpass filter.
  - `playLockOnBeep(seconds)`: Ascending frequency beeps (`880Hz`, `1080Hz`, `1320Hz`) triggered at countdown thresholds.
  - `playShieldDeflect()`: Resonant triangle wave (`440Hz` up to `880Hz` then decaying) with lowpass frequency filter.
  - `playReactorBreach()`: Apocalyptic rising saw siren transitioning into a dual-gain white noise explosion and sub-bass boom.

---

### Extending the Game (Recipes)

#### Adding a New Starship Type
1. In `src/types.ts`, add the key to `EnemyShipType`:
   ```ts
   export type EnemyShipType = 'tie_interceptor' | 'tie_fighter' | 'probe_droid' | 'tie_advanced' | 'star_destroyer';
   ```
2. In `src/geometry/starwarsCombat.ts`:
   - Inside `createEnemyShipMesh(type)`: Add the 3D wireframe geometry and solar panel layout.
   - Inside `createEnemySquadron()`: Set the ship's name, speed, attack cooldown, damage, and targeting behavior.

#### Adjusting Game Balance & Core Energy Drain
Open `src/App.tsx` and adjust the numerical values inside `handleCoreDamage` and `handleDeflectionSuccess`:
- Normal Core Damage: `damage = 12`
- Heavy Core Damage: `damage = 22`
- Deflection Core Restore: `nextCore = prev.coreEnergy + 3`
- Elite Kill Core Restore: `coreGain = 8`
- Pickup Core Restore: `+15`

---

## Configuration & Environment Variables

The project includes an `.env.example` file:
```env
# Optional Gemini AI API key for generative features
GEMINI_API_KEY=""

# The URL where the applet is hosted
APP_URL=""
```

Detailed parameter configuration options can be found in [CONFIGURATION.md](./CONFIGURATION.md).

---

## License

MIT License. Created with Google AI Studio Build. Star Wars lore and ship concepts are property of Lucasfilm / Disney.
