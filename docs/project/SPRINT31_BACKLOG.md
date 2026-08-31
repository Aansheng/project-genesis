# Sprint 31 — Observatory Truth Consistency

**Authorization:** Human/CTO decision, 2026-08-31
**Architecture at authorization:** v1.180
**Current architecture:** v1.181
**Status:** FROZEN — WO-S31-001 and WO-S31-002 DONE; Code Complete = YES;
Product Verified = YES; Human/CTO accepted freeze at v1.181 on 2026-08-31

## Product goal

The Full Observatory must project the current authoritative Genesis state
across Studio navigation and ongoing gameplay. It must not show stale metadata,
default progression, or a fabricated current state.

The invariant is:

`Runtime/current product state → current Web projection → Observatory`

Runtime remains the authority. Observatory is a projection and must not own a
second XP state, reconstruct a default session on route mount, or reconnect the
Sprint 25 legacy metadata bridge. If current truth is unavailable, the surface
must say loading/unavailable rather than display a fabricated `0 / 1` or stale
build metadata.

## Freeze boundary inherited from Sprint 30

Sprint 30 is FROZEN at v1.180. Its bounded thesis remains complete:

`Enemy Health 0 → ENTITY_REMOVED → GameplayRuleExecutor → SPAWN_ENTITY →
WorldMutator.addEntity() → Runtime WorldStore → binding-only Enemy visual →
Renderer/Pixi`

Sprint 31 preserves Runtime-only spawning, Survival progression, Prompt Truth
and asset behavior, Platformer compatibility, and Studio ↔ Observatory
continuity. It does not reopen or expand the Sprint 30 gameplay scope.

## Initial Sprint 31 Gap Analysis

The fresh audit after the Human/CTO decision traced the current production path
through `GameViewportPanel`, `gameStore`, Runtime, `ObservatoryRuntimeBinding`,
`observatoryDataStore`, and the current Observatory views. The two measured
defects have independent first divergence points:

| Candidate | Repository evidence | Classification | Sprint blocking value |
| --- | --- | --- | --- |
| Defect A — progression remount reset | `GameViewportPanel` constructed `DefaultRuntimeExecutionLoop` without an injected progression store. The loop therefore created a new `DefaultRuntimeGameplayProgressionStateStore` on every Game mount. Its baseline observer overwrote the retained Observatory projection with `experience=0, level=1`, while the Runtime WorldStore and entity history remained. | ARCHITECTURE_GAP / PRODUCT_GAP | Highest: breaks current gameplay progression truth across the required route sequence. |
| Defect B — stale metadata | `apps/web/src/projectMetadata.ts` is the current centralized source, but contains `architectureVersion: 'v1.177'` and `currentSprint: 'Sprint 27'`. Current Observatory store/header/overview consumers read it. Sprint 25 `DefaultObservatoryMetadataBridge`, mapper, and `loadRealObservatory()` are FROZEN_LEGACY and have no current production caller. | QUALITY_GAP / PRODUCT_GAP | Independent second blocker: the Full Observatory header/overview is not current. |

The roots are independent. Progression was ranked first because the active
gameplay state itself was being projected incorrectly; metadata is the next
bounded item. Exactly one primary WO was selected for execution.

## WO-S31-001 — Runtime Progression Projection Across SPA Navigation

**Status:** DONE — Code Complete = YES; Product Verified = YES
**Architecture before:** v1.180
**Architecture after:** v1.181
**Dependency:** Sprint 30 FROZEN at v1.180; Sprint 31 authorized
**Measured bottleneck:** Runtime progression authority, the current
`observatoryDataStore` projection, and route continuity already existed, but a
fresh Web route mount created a fresh Runtime progression store and published
the baseline over current gameplay. The smallest fix was to reuse the existing
Runtime store across the existing app-session composition boundary.

### Allowed scope

- Keep one existing `DefaultRuntimeGameplayProgressionStateStore` in the
  existing Web `gameStore` app-session composition.
- Mark that stateful Runtime object raw so Pinia does not unwrap its private
  state into an incompatible or duplicate reactive projection.
- Pass the same store into each `DefaultRuntimeExecutionLoop` created by
  `GameViewportPanel`.
- Add focused production-path regression coverage for Game → Observatory →
  Game remounts.
- Update the ADR and truthful project/control-plane projections.

### Forbidden scope

No Observatory-owned XP state, persistence, refresh recovery, localStorage,
IndexedDB, server session, telemetry, event-sourcing, route-state framework,
new global state system, `ObservatoryManager`, `MetadataManager`,
`PersistenceManager`, legacy PromptBuilder/metadata reconnection, gameplay
rule changes, wave/spawn systems, or UI redesign.

### Implementation boundary

The existing Runtime class remains the only progression authority. The Web
composition owns the lifetime of the already-defined Runtime store for the
current SPA app session and injects it into remounted execution loops. Binding
still resets progression when the Runtime world/session changes and retains it
for the same world/session. `ObservatoryRuntimeBinding` and
`observatoryDataStore` remain projection-only.

### Acceptance and evidence

- A generated Survival world reaches XP > 0 and the existing Level 2
  threshold.
- Full Observatory shows the same `world-1`, active gameplay, and progression
  after the first defeat.
- Returning to Game preserves the same world/session and allows continued
  gameplay.
- Re-entering Full Observatory after the second defeat shows `2 / 2`, not
  `0 / 1`.
- Runtime-only replacement and existing visual binding behavior remain intact;
  no generation call is introduced by navigation.
- Production route reachability is covered by Web tests and the real Studio
  path; Platformer and existing Observatory tests remain green.
- Completion report includes architecture transition, files, real call chain,
  checks, constraints, gaps, manual PV, Code Complete, and Product Verified.

### Implementation and verification result

`apps/web/src/stores/gameStore.ts` now holds one raw
`DefaultRuntimeGameplayProgressionStateStore` and exposes it through the
existing game store. `apps/web/src/components/studio/GameViewportPanel.vue`
passes that store into each new execution loop. The focused SPA regression
captures both remounted loops and proves that each reports the committed
`experience=2, level=2` state.

Runtime tests passed: 25 files / 705 tests. Web tests passed: 50 files / 3565
tests. Runtime and Web TypeScript checks passed; package Lint passed with the
repository's existing warnings and no errors; Web build passed; `git diff
--check` passed.

Real Studio Product Verification on 2026-08-31 used the exact request
`生成一个幸存者游戏`. The generated Runtime world was `world-1` with four
entities. After the first Enemy defeat, Full Observatory showed `Gameplay:
active`, `经验值: 1`, and `等级: 2`. Returning to Game kept the same four-entity
world and allowed the replacement Enemy to be defeated. Re-entering Full
Observatory showed `Gameplay: active`, `经验值: 2`, and `等级: 2`. Browser
error/warning diagnostics returned `[]`.

## Post-WO Fresh Gap Analysis

**Result:** PASS — both measured Sprint 31 Observatory truth blockers are
closed; Human/CTO subsequently accepted the freeze at v1.181.

The route sequence proves that the current Runtime progression flows through
the existing Web projection into Observatory without reset. The same route now
projects the centralized current application metadata as `v1.181 / Sprint 31`
in both the Full Observatory header and Overview System section. The stale
`v1.177 / Sprint 27` projection is absent from the current surface.

The image queue's partial readiness remains a truthful non-blocking observation
from Sprint 30; the Runtime Stats system/event/FPS fields also remain zero
because their producers are outside this bounded slice. Neither is selected as
a Sprint 31 blocker. No persistence, metadata framework, or legacy
reconnection is needed. `SPRINT31_FREEZE_REVIEW` was selected and is now DONE;
Sprint 32 Product Gap Discovery is separately authorized and recorded in
`SPRINT32_BACKLOG.md`.

## WO-S31-002 — Current Observatory Metadata Source

**Status:** DONE — Code Complete = YES; Product Verified = YES
**Architecture before:** v1.181
**Expected architecture after:** v1.181 (metadata truth correction only)
**Dependency:** WO-S31-001 DONE; post-WO Gap Analysis complete
**Measured bottleneck:** the current Observatory metadata consumers already
share one source, but that source is stale. Trace the source to its repository
truth and update the single current source so the Full Observatory projects the
current architecture/Sprint under the then-current policy.

### Allowed scope

- Trace `PROJECT_METADATA` from `apps/web/src/projectMetadata.ts` through the
  current Observatory store/header/overview consumers and any current context
  consumers.
- Correct the centralized current source and its focused expectations if the
  source audit confirms it is the intended build/product metadata source.
- Add or update production reachability assertions that current metadata is
  visible in the Full Observatory.
- Re-run the Sprint 31 real PV, including progression continuity.

### Forbidden scope

No scattered UI literals, `MetadataManager`, new metadata service, route-state
framework, persistence, telemetry, legacy PromptBuilder/metadata bridge
reconnection, unrelated cleanup, or Sprint 32 work.

### Acceptance and Product Verification

- Full Observatory header and Overview show the current architecture and
  Sprint values from one current source, with no v1.177/Sprint 27 stale
  projection.
- A real generated Survival session reaches XP > 0, traverses Game → Full
  Observatory → Game, continues, and re-enters Observatory with matching
  world/session/progression and current metadata.
- Current data is shown or honestly unavailable; no fabricated defaults are
  introduced.
- Existing Survival, Platformer, Prompt Truth/assets, runtime-only spawning,
  and route continuity behavior remain green.

### Implementation and verification result

The source audit confirmed that the repository has no separate generated
build-info convention for these product labels. The existing
`apps/web/src/projectMetadata.ts` is the current immutable Web application
metadata source consumed by the Observatory header, Overview, and current
generation context. The Observatory store owns only local selection/status UI
state. The source now reports `v1.181` and
`Sprint 31`; no UI literal, metadata service, or FROZEN_LEGACY bridge was
introduced or reconnected.

The production route regression traverses `App → router → ObservatoryPage →
ObservatoryShell → ObservatoryHeader/Overview` and compares the displayed
values with `PROJECT_METADATA`, while guarding against the historical
`v1.177 / Sprint 27` values. The test also returns to Game and re-enters
Observatory with the same world.

Web tests passed: 50 files / 3565 tests. Web TypeScript, package ESLint (0
errors; existing warnings only), Web build, and `git diff --check` passed.

Real Chrome Studio Product Verification on 2026-08-31 used the exact request
`生成一个幸存者游戏`. The active generated session retained `world-1`; two
Enemy defeat/replacement cycles reached Full Observatory Runtime state
`Gameplay: active`, `经验值: 2`, and `等级: 2`. The header and Overview showed
`v1.181 / Sprint 31`. Returning to Game and then re-entering Observatory kept
the same world/session and the same Runtime progression. Browser
error/warning diagnostics returned `[]`.

## Sprint 31 Freeze Outcome

Both current gameplay progression and current architecture/Sprint metadata now
project truthfully through the Full Observatory, with no mock or stale current
authority observed. Human/CTO accepted `SPRINT31_FREEZE_REVIEW` and froze
Sprint 31 at v1.181 on 2026-08-31. Sprint 32 is authorized to begin with
Product Gap Discovery; no Sprint 32 implementation is executed by this
freeze record.

## Explicit non-goals

WaveManager, SpawnManager, timers, difficulty scaling, procedural waves, spawn
director, enemy factory/prefab, persistence expansion, telemetry DB, event
sourcing, route-state framework, new global state, speculative Observatory
managers, legacy metadata reconnection, visual redesign, and unrelated
capability work are outside Sprint 31.
