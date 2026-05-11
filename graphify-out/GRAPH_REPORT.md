# Graph Report - D:\Ravi\Project\SundaraVira  (2026-04-27)

## Corpus Check
- 31 files · ~18,391 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 226 nodes · 390 edges · 22 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `StageScene` - 37 edges
2. `Hud` - 27 edges
3. `PrototypeScene` - 25 edges
4. `GyroInput` - 17 edges
5. `PlayerActor` - 16 edges
6. `AudioManager` - 11 edges
7. `ContributeForm` - 8 edges
8. `BhaktiInput` - 7 edges
9. `EnemyManager` - 5 edges
10. `BackgroundLayer` - 5 edges

## Toxic Hotspots (high risk + high activity)
1. `StageScene` - Risk Score: 80% (CLASS)

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"

Cohesion: 0.08
Nodes (2): GyroInput, PlayerActor

### Community 1 - "Community 1"

Cohesion: 0.13
Nodes (2): BackgroundLayer, StageScene

### Community 2 - "Community 2"

Cohesion: 0.12
Nodes (6): ENDGAME_TIPS, PrototypeScene, SIZE_SHIFT_WINDOW_MS, STAGE_ONE_TARGET_FRAGMENTS, STAGE_TWO_TARGET_FRAGMENTS, TARGET_FRAGMENTS

### Community 3 - "Community 3"

Cohesion: 0.12
Nodes (1): Hud

### Community 4 - "Community 4"

Cohesion: 0.1
Nodes (4): AudioManager, EnemyManager, GameOverScene, VictoryScene

### Community 5 - "Community 5"

Cohesion: 0.12
Nodes (5): StageLoader, StageObjectiveSystem, ENDGAME_TIPS, isTransitionDebugEnabled(), SIZE_SHIFT_WINDOW_MS

### Community 6 - "Community 6"

Cohesion: 0.18
Nodes (1): ContributeForm

### Community 7 - "Community 7"

Cohesion: 0.36
Nodes (1): BhaktiInput

### Community 8 - "Community 8"

Cohesion: 0.4
Nodes (1): BootScene

### Community 9 - "Community 9"

Cohesion: 0.5
Nodes (1): MenuScene

### Community 10 - "Community 10"

Cohesion: 0.5
Nodes (3): data, fakeData, game

### Community 11 - "Community 11"

Cohesion: 0.5
Nodes (3): marker, stage, transitionState

### Community 12 - "Community 12"

Cohesion: 0.67
Nodes (2): input, result

### Community 13 - "Community 13"

Cohesion: 0.67
Nodes (2): result, system

### Community 14 - "Community 14"

Cohesion: 1.0
Nodes (1): config

### Community 15 - "Community 15"

Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"

Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"

Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"

Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"

Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"

Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"

Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **18 isolated node(s):** `config`, `STAGE_ONE_TARGET_FRAGMENTS`, `STAGE_TWO_TARGET_FRAGMENTS`, `ENDGAME_TIPS`, `SIZE_SHIFT_WINDOW_MS` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (2 nodes): `main.ts`, `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `playwright.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `vitest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `main.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `gameConfig.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `stageRegistry.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `setup.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.