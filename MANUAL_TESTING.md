# Sundara Vira Manual Test Guide

## 1. Test scope
- Menu to gameplay launch
- Core movement and combat
- Bhakti/chant mechanics
- Stage progression and game-over flow
- Touch controls and responsive behavior

## 2. Test environments

Desktop variants:
- Windows + Edge (latest)
- Windows + Chrome (latest)
- Optional: Firefox (latest)

Mobile variants:
- Android + Chrome (latest)
- Android + Edge (latest)
- iPhone + Safari (non-speech behavior)

## 3. Setup

Desktop (no npm):
1. Run: `python -m http.server 5500`
2. Open: `http://localhost:5500`

Desktop (Vite optional):
1. Run: `npm install`
2. Run: `npm run dev`
3. Open Vite URL (usually `http://localhost:5173`)

Mobile (same Wi-Fi):
1. Start server on laptop
2. Find laptop local IP (example: `192.168.x.x`)
3. Open on phone: `http://<laptop-ip>:5500`

## 4. Desktop test cases

### TC-D1: Launch and menu
Steps:
1. Open app URL
2. Verify menu loads with title and Begin button
3. Click Begin
Expected:
- Stage scene loads (no blank screen)
- HUD is visible

### TC-D2: Movement and jump
Steps:
1. Use A/D or arrow keys
2. Use W or Up to jump
Expected:
- Character moves and jumps correctly
- No freeze/stutter

### TC-D3: Combat actions
Steps:
1. Press J for light attack
2. Press K for heavy attack
3. Press F with enough Bhakti
Expected:
- Attack effects appear
- Enemies can be defeated
- Blast consumes Bhakti

### TC-D4: Chant and Bhakti gain
Steps:
1. Type a recognized chant and submit
2. Optional: test mic in Chrome/Edge on localhost/https
Expected:
- Valid chant increases Bhakti
- Invalid chant shows feedback
- Size-shift unlock feedback appears after valid chant

### TC-D5: Size shift
Steps:
1. Use Q and E after unlock
Expected:
- Size mode changes correctly
- HUD message updates

### TC-D6: Stage progression
Steps:
1. Collect required fragments
2. Reach goal beacon with required state
Expected:
- Transition card appears
- Next stage loads successfully

### TC-D7: Game over and retry
Steps:
1. Reduce health to zero
2. Use Try Again and Enter key retry path
Expected:
- Endgame overlay appears
- Retry reloads game

## 5. Mobile test cases

### TC-M1: Touch controls visibility
Steps:
1. Start Stage scene on phone
Expected:
- Left cluster visible (move/jump)
- Right cluster visible (size/attack/blast)
- Buttons are easy to tap

### TC-M2: Touch controls behavior
Steps:
1. Hold left/right buttons for movement
2. Tap jump, attack, heavy, blast, and size buttons
Expected:
- Held movement is continuous
- Action buttons trigger reliably
- No accidental page scrolling

### TC-M3: Layout and readability
Steps:
1. Verify HUD + Bhakti bar + touch controls
2. Test portrait/landscape where applicable
Expected:
- UI remains readable and usable
- Controls do not block critical HUD info

### TC-M4: Speech behavior
Steps:
1. Android Chrome: test mic on localhost/https
2. iOS Safari: test non-speech gameplay path
Expected:
- Android speech works when supported
- iOS remains playable without speech

## 6. Regression quick check
- Begin button never leads to blank screen
- Touch controls appear on Stage load
- Bhakti vertical bar updates correctly
- Stage transition and retry still work

## 7. Defect reporting format
For each issue, include:
- Device + OS + browser version
- Test case ID (example: TC-M2)
- Actual result vs expected result
- Screenshot/video
- Console error (desktop if available)

## 8. Exit criteria
- No critical failures in launch, movement, combat, progression
- Touch controls validated on at least one Android browser and one desktop browser
- No blank-screen regression across tested browsers

---

## Tester checklist (quick pass)

### Desktop
- [ ] Menu loads and Begin starts Stage
- [ ] Movement and jump work
- [ ] J/K attacks work
- [ ] F blast works when Bhakti >= 20
- [ ] Chant input updates Bhakti and feedback
- [ ] Q/E size-shift works after unlock
- [ ] Stage transition works
- [ ] Game-over and retry work

### Mobile
- [ ] Touch controls visible on Stage load
- [ ] Held move buttons work continuously
- [ ] Jump/attack/heavy/blast/size buttons respond
- [ ] HUD remains readable with controls
- [ ] Portrait and landscape are both usable (if supported)
- [ ] Android speech works (if browser/context allows)
- [ ] iOS path remains playable without speech
