# Sprint 14 Review — World Evolution

## Freeze Status

Sprint 14 is frozen. Architecture remains v1.146.

- Code Complete: YES
- Product Verified: YES
- FROZEN: YES

## Goal and Completed Work

Sprint 14 proved that one playable world can evolve through multiple natural-language
commands without rebuilding its Runtime, renderer, camera, or game loop.

- WO-S14-001: current-world intent, validated `WorldSemanticDelta`, and operation history.
- WO-S14-002: authoritative immutable semantic mutation.
- WO-S14-003: targeted Runtime add/remove/replace with live-state preservation.
- WO-S14-004: deterministic visual delta and canonical asset-impact planning.
- WO-S14-005: targeted generation, manifest/store rebinding, and incremental Pixi sync.
- WO-S14-006: continuous multi-turn browser verification, cancellation-truth fix, and freeze.

## Frozen Production Chain

`Genesis Studio → current semantic snapshot → WorldEvolutionIntent → validated WorldSemanticDelta → DefaultSemanticWorldDeltaApplier → DefaultRuntimeWorldEvolutionSynchronizer → DefaultVisualEvolutionPlanner → VisualAssetEvolutionExecutor → existing scheduler/image gateway → targeted AssetManifest + AssetStore update → existing Pixi renderer → Observatory`

World evolution does not rerun `CreateWorldPipeline`, bootstrap Runtime systems, reset the
camera, recreate Pixi, clear the AssetStore globally, or rebuild the complete manifest.

## Continuous Browser Evidence

One SPA session retained `world-1` throughout this sequence:

| Operation | Semantic revision | Runtime revision | Visual revision | Canonical generation | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Create farm with three cows | 0 | 0 | 0 | 4 actual initial jobs | Playable fallback-first world; initial background reached ready |
| Cow ×3 → Sheep | 1 | 1 | 1 | 1 | One Sheep artifact rebound to cow-1/2/3; renderer applied 3 |
| Remove `cow-1` | 2 | 2 | 2 | 0 | Runtime 4→3; one binding removed; shared Sheep resource retained by cow-2/3 |
| Add Merchant | 3 | 3 | 3 | 1 | `merchant-1` added and one Merchant artifact applied |
| World → Night | 4 | 4 | 4 | 1 background | Runtime no impact; one background artifact applied |

The initial generation set contained Background, Terrain, Player, and Cow canonical jobs.
Starting Sheep evolution superseded unfinished Terrain/Player/Cow jobs; they now converge
immediately to `cancelled` instead of remaining falsely queued/generating.

Player evidence in the same session:

- baseline `(80, 400)`;
- moved during visual work through x=86 and x=116;
- after Sheep ready, reached x=125 and repeatedly jumped/re-landed;
- after Night ready, reached `(158, 400)` and jumped through
  `400 → 381 → 315 → 308 → 357 → 400`.

No world ID, player ID, camera/world replacement revision, or Runtime entity identity was
reset by evolution. The final Runtime contains `player`, `cow-2`, `cow-3`, and
`merchant-1`. Overview reports v1.146, 4 Runtime entities, 7 visual operations, and 6
current manifest entries. Browser console errors and warnings were empty.

## Layer Convergence

- Semantic World: two Sheep bindings remain, Merchant exists, `timeOfDay=night`, cow-1 is absent.
- Runtime: the same structural entity set is live; player position/velocity remain active.
- VisualDesignSpecification / AssetSpecification: Sheep, Merchant, and night background
  context are current; cow-1 has no dead binding.
- AssetManifest / AssetStore: Sheep and Merchant generated resources plus the replaced
  background resolve without global invalidation; unrelated bindings survive.
- Renderer: targeted Sheep (3), Merchant (1), and Background applications completed; the
  removed entity has no ghost sprite and the player/camera/game loop were not recreated.

## Observatory Evidence

History, Diff, Timeline, and Trace each contain four ordered, independent operations.
Trace revisions advance 1→4 and report canonical counts 1/0/1/1. Remove-only Timeline has
15 real stages and no generation stage. Event Stream contains correlated domain lifecycle
events without Runtime tick noise. Generation Trace shows real Codex CLI artifacts and
renderer outcomes; cancelled superseded create-world jobs are explicit. Runtime and World
Graph show only the final four entities. No provider secret, Authorization value, raw JSONL,
hidden reasoning, or local secret path is exposed.

## Verification

- Shared: 200 tests passed.
- Assets: 14 tests passed.
- Runtime: 665 tests passed.
- Renderer: 482 tests passed.
- AI: 9,380 tests passed.
- AI Server: 38 tests passed (requires local port permission).
- Web: 3,516 tests passed, including the new superseded-operation regression.
- TypeScript: all 7 packages passed.
- ESLint: 0 errors; existing repository warnings remain.
- Web production build: passed; existing chunk-size advisory remains.

## Known Limitations and Deferred Work

Generated artifact URIs remain session-owned. Reuse after browser reload, server restart,
or project reopen is not guaranteed. Durable asset persistence, transparency extraction,
reference-guided/image-to-image generation, coordinated prompt/style planning, animation,
sprite sheets, tilesets/autotiling, movement/behavior mutation, undo/redo, persistent
evolution history, collaboration, and complete gameplay-mechanics generation remain
deferred and do not block this freeze.

## Recommended Sprint 15 Direction

Gameplay Mechanics Foundation: introduce the smallest authoritative representation and
Runtime path for triggers, conditions, actions, gameplay events, collectibles, damage,
spawn rules, goals, and win/lose behavior. Generation Context Foundation should remain a
separate follow-up and is not part of the Sprint 14 freeze.
