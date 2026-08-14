# ADR-0199: Mario Playable Slice Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S9-011  
**Architecture Version:** v1.85 → v1.86

---

## Context

The architecture now supports the complete pipeline:

```
GameIntent
SemanticWorldGenerator
SemanticGameDslBuilder
RuntimeProjection
RuntimeExecutionLoop
PlayerControllerSystem
MovementSystem
PixiRenderer
RuntimeVisualizationLoop
KeyboardInputProvider
GameBootstrap
```

However, no actual playable demo exists. The system can generate game worlds semantically, project them to runtime worlds, and run them interactively, but there is no predefined configuration that ties everything together into a single playable experience.

### Problems

1. **No playable vertical slice** — the full pipeline has never been tested end-to-end with a real game world
2. **No predefined Mario world** — there is no factory that produces a Mario-style world with player, ground, and goal
3. **No one-call bootstrap** — starting a game requires manually wiring multiple components; there is no single `start(container)` entry point for a demo
4. **No runtime integration test** — the pipeline from semantic world to interactive player movement has no integration coverage

### Scope Boundaries

- No gravity
- No collision
- No camera
- No assets
- No animation
- No physics
- No networking
- No save system
- No AI generation yet
- No LLM integration
- Rectangles and circles only

---

## Decision

### 1. Create `MarioWorldFactory`

```typescript
export interface MarioWorldFactory {
  create(): GameWorldModel
}
```

Produces a predefined Mario-style `GameWorldModel`:

| Entity | Category | Name | ID |
|--------|----------|------|----|
| Player | player | Mario | player |
| Ground | terrain | Ground | ground |
| Goal | item | Flag | goal |

The world type is always `'platformer'`. The output is always frozen.

### 2. Create `DefaultMarioWorldFactory`

A pure, stateless, deterministic factory that returns a frozen `GameWorldModel` with exactly 3 entities: player (Mario), ground (Ground), and goal (Flag). No construction parameters, no configuration, no state.

### 3. Create `MarioGameBootstrap`

```typescript
export interface MarioGameBootstrap {
  start(container: HTMLElement): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean
}
```

A one-call playable Mario demo entry point that wires the full pipeline:

```
MarioWorldFactory
    ↓
SemanticGameDslBuilder
    ↓
GameDsl (Platformer World, 3 entities)
    ↓
RuntimeProjection
    ↓
World (player + terrain + item entities)
    ↓
KeyboardInputProvider
    ↓
DefaultGameBootstrap
    ↓
start(container) → game is playable
```

### 4. Location

| File | Action |
|------|--------|
| `packages/ai/src/game-world/MarioWorldFactory.ts` | New — factory interface + implementation |
| `packages/ai/src/game-world/index.ts` | Updated — MarioWorldFactory exports |
| `packages/ai/src/index.ts` | Updated — barrel exports |
| `packages/ai/src/__tests__/MarioWorldFactory.test.ts` | New — 33 tests |
| `packages/renderer/src/bootstrap/MarioGameBootstrap.ts` | New — bootstrap interface + implementation |
| `packages/renderer/src/bootstrap/index.ts` | Updated — MarioGameBootstrap exports |
| `packages/renderer/src/index.ts` | Updated — barrel exports |
| `packages/renderer/src/bootstrap/__tests__/MarioGameBootstrap.test.ts` | New — 23 tests |
| `packages/renderer/package.json` | Updated — added @genesis/ai dependency |
| `packages/renderer/vitest.config.ts` | Updated — added @genesis/ai resolve alias |
| `docs/adr/ADR-0199-mario-playable-slice-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.86, WO-S9-011 |
| `docs/project/CHANGELOG.md` | Updated — v1.86, WO-S9-011 |

### 5. Test Strategy

**MarioWorldFactory.test.ts** — 33 tests across 7 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 3 | instance creation, method existence, return type |
| World type | 2 | platformer, determinism |
| Entity count | 4 | exactly 3, player, ground, goal |
| Entity properties | 9 | IDs, names, order |
| Immutability | 5 | frozen model, frozen entities, frozen fields |
| Determinism | 5 | identical output, across factories, order, properties |
| Serialization | 3 | JSON round-trip, IDs, names |
| Stateless | 2 | no constructor params, independent creates |

**MarioGameBootstrap.test.ts** — 23 tests across 8 sections:

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 4 | instance creation, interface, not running, stateless |
| Pipeline creation | 3 | world model, entity types, frozen output |
| Start | 2 | running state |
| Stop | 3 | stop running, stop idle, state |
| Double start | 2 | no-op, no throw |
| Double stop | 2 | no-op, no throw |
| Start-stop-restart | 1 | full cycle |
| isRunning | 3 | false/true/false lifecycle |
| Keyboard input | 3 | keydown, keyup, cleanup |

---

## Consequences

### Positive

1. **First playable vertical slice** — the Mario bootstrapper verifies the full pipeline end-to-end
2. **One-call demo** — `new DefaultMarioGameBootstrap().start(container)` starts a playable Mario demo
3. **No breaking changes** — all new code is additive; no existing code is modified
4. **Testable pipeline** — mock renderer injection enables testing without WebGL/Canvas
5. **Predefined world** — `DefaultMarioWorldFactory` provides a deterministic, frozen Mario world

### Negative

1. **Minimal world** — only 3 entities with no gameplay mechanics (no jumping, no enemies, no scoring)
2. **Fixed entities** — the Mario world is hardcoded; no configuration or customization
3. **Renderer package dependency** — `MarioGameBootstrap` lives in `@genesis/renderer` which now depends on `@genesis/ai`

### Neutral

1. **Extensible** — additional entity types and game mechanics can be added as follow-on WOs
2. **Demo-ready** — the bootstrapper can be used directly in the web app for a playable demo
3. **Architecture alignment** — the pipeline follows the existing architecture: Semantic → DSL → Runtime → Bootstrap → Renderer

---

## Verification

- TypeScript: 0 errors (ai, renderer, shared)
- ESLint: 0 errors
- MarioWorldFactory tests: 33/33 passed
- MarioGameBootstrap tests: 23/23 passed
- All AI tests: 9071/9071 passed (141 files)
- All Renderer tests: 333/333 passed (16 files)
- No Runtime changes
- No DSL changes
- No Planner changes
- No PromptBuilder changes
- No breaking changes to any Public API
- Architecture version v1.85 to v1.86

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/MarioWorldFactory.ts` | New — factory |
| `packages/ai/src/game-world/index.ts` | Updated — barrel exports |
| `packages/ai/src/index.ts` | Updated — barrel exports |
| `packages/ai/src/__tests__/MarioWorldFactory.test.ts` | New — 33 tests |
| `packages/renderer/src/bootstrap/MarioGameBootstrap.ts` | New — bootstrap |
| `packages/renderer/src/bootstrap/index.ts` | Updated — barrel exports |
| `packages/renderer/src/index.ts` | Updated — barrel exports |
| `packages/renderer/src/bootstrap/__tests__/MarioGameBootstrap.test.ts` | New — 23 tests |
| `packages/renderer/package.json` | Updated — @genesis/ai dep |
| `packages/renderer/vitest.config.ts` | Updated — @genesis/ai alias |
| `docs/adr/ADR-0199-mario-playable-slice-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.86 |
| `docs/project/CHANGELOG.md` | Updated — v1.86 |