# Sundara Vira Prototype

Browser-playable action prototype inspired by Sundarakanda.

## Language versions
- Telugu + Hindi: `README.te-hi.md`

## What is implemented
- Static-JS Phaser scene flow with Boot, Menu, Stage, and Victory scenes.
- Side-scrolling action slice with movement, jump, hazards, and collectibles.
- Bhakti system with chant input (typed and microphone when browser supports it).
- Size transformation (`Q` small, `E` large).
- Bhakti Blast (`F`) to clear nearby enemies.
- Two-stage progression driven by JSON stage data.
- Dharma-influenced mission completion flow.

## Run locally (no npm required)
1. Start a simple static server from the project root:
   python -m http.server 5500
2. Open http://localhost:5500 in your browser.

## Run locally with Vite (optional)
1. Install dependencies:
   npm install
2. Start dev server:
   npm run dev
3. Open the URL shown by Vite (typically `http://localhost:5173`).

## Build for deployment
- Build: `npm run build`
- Preview production build: `npm run preview`

## Automated tests
Run core gameplay logic checks without launching the webpage:

1. Install dependencies:
   npm install
2. Run tests once:
   npm test
3. Run tests in watch mode:
   npm run test:watch

Current automated coverage includes:
- Chant recognition rules (`BhaktiInput`)
- Stage goal/progression rules (`StageObjectiveSystem`)
- Stage registry/data lookup (`StageLoader`)

## Browser smoke tests (Playwright)
Run end-to-end checks in a real browser with an auto-started local dev server:

1. Install dependencies:
   npm install
2. Install Playwright browser binaries (first time only):
   npx playwright install
3. Run e2e smoke tests:
   npm run test:e2e

Current e2e coverage includes:
- Menu boot and Stage scene startup
- Stage 1 objective completion path transitioning into Stage 2

## Deploy options
- Static hosting friendly: GitHub Pages, Netlify, or Vercel.
- PWA support can be added in next step with Vite plugin.

## Controls
- Move: `A/D` or left/right arrows
- Jump: `W` or up arrow
- Size shift: `Q` (small), `E` (large)
- Bhakti Blast: `F`
- Chant input: type in HUD and press Enter, or use mic button
- On-screen controls: visible in gameplay (left cluster for move/jump, right cluster for size/attack/blast)

## Repository structure
- `Gameplot.md` - gameplay design document
- `index.html` - browser entry point
- `package.json` - scripts and dependencies
- `vite.config.ts` - dev/build config
- `src/main.js` - game bootstrap (static JS entry)
- `assets/data/stages/*.json` - stage layout and progression data
- `src/config/gameConfig.js` - centralized Phaser game config
- `src/data/stageRegistry.js` - stage ordering for progression
- `src/scenes/BootScene.js` - preload and startup scene
- `src/scenes/MenuScene.js` - start menu scene
- `src/scenes/StageScene.js` - primary gameplay scene
- `src/scenes/VictoryScene.js` - final completion scene
- `src/systems/BhaktiInput.js` - chant evaluation logic
- `src/systems/StageLoader.js` - stage data access helper
- `src/ui/Hud.js` - browser overlay UI and speech input
- `src/style.css` - visual style and HUD layout

## Next milestones
1. Replace placeholder shapes with art and animation spritesheets.
2. Add chapter/scene flow (Prologue, Ocean Trial, Lanka).
3. Add save/checkpoint and expanded Dharma branching.
4. Add automated Playwright smoke tests for browser compatibility.
