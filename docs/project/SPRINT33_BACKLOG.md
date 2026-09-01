# Sprint 33 — Survival Playability Gap / Frozen Review

**Authorization:** Human/CTO decision, 2026-09-01  
**Architecture at authorization:** v1.182  
**Current architecture:** v1.183
**Status:** FROZEN — Human/CTO accepted 2026-09-01 at v1.183; `WO-S33-001` Code Complete = YES; Product Verified = YES; Sprint 34 discovery is recorded separately

## Product goal

Measure and close the single largest remaining user-visible problem preventing
the generated Survival loop from feeling like a coherent playable mini-game.
Sprint 33 starts from normal player experience. It does not preselect weapons,
projectiles, waves, timers, upgrades, or scaling.

## Verified baseline to preserve

- exact natural-language generation into active Survival `world-1`;
- top-down Player X/Y movement and Enemy target-directed pursuit;
- separate Enemy contact danger and explicit Player `Space` offense;
- Runtime-authoritative Health, defeat/removal, XP/Level, and replacement;
- replacement Enemy composition and visual binding;
- active-session continuity and truthful Observatory projection;
- no attack-time provider/image-generation request.

These are evidence and constraints, not systems to rebuild.

## Product Gap Discovery result

The real play session and source audit are recorded in
[`SPRINT33_PRODUCT_GAP_DISCOVERY.md`](SPRINT33_PRODUCT_GAP_DISCOVERY.md).
The selected bottleneck was:

> **PRODUCT_GAP — generic gameplay outcome feedback/readability.** Explicit
> attack input and authoritative outcomes work, but the normal Game canvas is
> silent on hit, damage, defeat, and replacement. Every attack requires an
> Inspector or Observatory read to confirm what happened.

`WO-S33-001` resolved that bounded presentation gap. Replacement pacing and
progression meaning are real secondary observations; timers, waves,
projectiles, scaling, and genre-specific combat systems remain deferred.

## WO-S33-001 — Generic Runtime Gameplay Outcome Feedback

**Status:** DONE — Code Complete = YES; Product Verified = YES
**Priority:** P0 / Sprint 33 primary WO  
**Architecture before:** v1.182  
**Architecture after:** v1.183 — bounded Runtime-outcome-to-Game presentation
projection
**Dependencies:** Sprint 32 FROZEN at v1.182; Sprint 33 discovery DONE; the
existing Runtime event collector, Gameplay Rule results, WorldStore mutation,
Runtime visualization loop, and Game Viewport are available. No unresolved
architecture or provider decision is required for the minimum slice.  
**Human decision gate:** Human/CTO separately authorized execution on
2026-09-01. The bounded WO is complete and Sprint 33 is now frozen at v1.183;
Sprint 34 Product Gap Discovery is recorded separately.

### Historical measured bottleneck

The production path emits and commits the correct attack facts and mutations,
but the Game surface does not communicate them. In the real session, the
Player/Enemy sprites overlapped with no visible change after a valid Space
attack. The Player could verify Enemy Health `100 → 75 → 50 → 25` and defeat
only by selecting the Enemy in Inspector or reading the Observatory Event
Stream. The same surface also lacked a defeat/replacement cue. This occurs on
every attack and blocks understanding of the core loop more often than Level 2
or replacement pacing observations.

### Smallest intended capability

Project the existing committed Runtime gameplay outcome into one minimal,
generic Game Viewport feedback cue:

1. derive the cue only from authoritative `ENTITY_ATTACK_REQUESTED`, committed
   Gameplay Rule results, Health mutation, and entity add/remove facts;
2. make a successful hit and a defeat/removal distinguishable in the normal
   Game surface without requiring Inspector or Observatory;
3. ensure a no-target/no-op input and Enemy-contact danger do not create a
   false Player-attack success cue; and
4. keep any presentation lifetime local to the existing render/UI loop, with no
   Runtime timer, cooldown, scheduler, or gameplay state authority.

The exact visual/text treatment should reuse the current Studio language and
the smallest existing Game Viewport surface. It must be a feedback projection,
not a new combat HUD or an attack-animation system.

### Allowed scope

- a pure or narrowly scoped Runtime-result → Game presentation mapping;
- one small, deterministic hit/defeat outcome cue using existing entity IDs,
  target category, committed damage result, and current Health/removal facts;
- minimal Web/Renderer state needed to display and clear that cue through the
  existing Game Viewport lifecycle;
- localized labels only if the chosen cue needs them;
- focused Shared/Runtime/Renderer/Web tests, with capability/control-plane
  documentation updates and real Studio Product Verification.

### Forbidden scope

- `SurvivorWeaponSystem`, `SurvivorCombatEngine`, `SurvivorRuntime`, or any
  genre-specific feedback manager;
- new damage, targeting, Health, defeat, replacement, XP, Level, or session
  authority;
- projectiles, projectile physics/lifetime, weapons, inventory, cooldowns,
  auto-fire, timers, waves, spawn directors, or difficulty scaling;
- upgrades, skill trees, progression redesign, health rebalance, lives,
  persistence, telemetry, or route-state infrastructure;
- a new combat HUD, broad visual redesign, sprite-sheet/attack animation
  framework, new image-generation request, or per-attack AI/provider call;
- changing the 48-unit target semantics, replacement placement, Platformer
  `Space` jump behavior, or Observatory truth;
- Sprint 34 or unrelated cleanup.

### Implementation boundary and real flow

The intended bounded flow is:

`Space edge → existing Runtime event/rule/World mutation → observer result
mapping → existing Game Viewport/Renderer presentation cue`

Runtime remains the only gameplay authority. The feedback must not infer a hit
from sprite overlap, mutate Health, select targets, or invent a defeat. If an
existing observer seam is sufficient, no new event vocabulary is needed.

### Acceptance criteria

- The exact request `生成一个幸存者游戏` still produces active Survival
  `world-1` with the existing composition and no attack-time provider/image
  operation.
- During normal Game play, a valid nearby Space attack produces one visibly
  distinguishable success cue tied to the actual target/outcome within the
  existing render/update path; a held key does not duplicate the cue.
- The cue reflects the committed result: damage is not shown when no rule
  committed, and Enemy defeat/removal is distinguishable from a non-lethal hit.
- An out-of-range/no-target Space edge creates no positive hit or defeat cue.
- Enemy contact danger is not mislabeled as Player attack success.
- The same Runtime WorldStore, Health, XP/Level, replacement composition,
  active session, Observatory event/rule facts, and the v1.182 gameplay
  semantics baseline remain
  truthful; the cue is projection-only.
- Platformer movement/jump, visual binding, and current diagnostics remain
  unchanged.

### Automated verification

- pure mapping tests for committed hit, lethal removal, replacement, no-op,
  contact danger, stale/unrelated facts, and exactly-once input outcomes;
- Runtime/Renderer integration proving feedback consumes existing results and
  does not mutate World or create a second authority;
- Web production-path tests proving the cue is reachable from Game Viewport,
  clears without a gameplay timer, and does not leak across route/world
  replacement;
- regression coverage for current Survival offense/replacement/Observatory
  truth and Platformer `Space` jump;
- affected package tests, TypeScript, package ESLint, Web build, and
  `git diff --check`.

### Product Verification plan

In a fresh real Studio session, submit `生成一个幸存者游戏` and play normally
through movement, an evasion attempt under pursuit, several explicit attacks,
one Enemy defeat, a replacement, and at least one attack after the replacement.
Evaluate the Game
surface before opening Inspector/Observatory:

- can the Player tell that a hit occurred;
- can the Player distinguish a non-lethal hit from defeat/replacement;
- is there no false cue for no-target input or contact danger;
- does the cue remain correct across the same-session route traversal;
- are provider/image operation counts unchanged and browser diagnostics empty?

Inspector, Event Stream, and Runtime Stats may then be used as truth
correlation, never as a substitute for Game-surface feedback. If the session
shows a different largest blocker, stop and report it; do not expand this WO.

### Observability expectations

Keep `ENTITY_ATTACK_REQUESTED`, Gameplay Rule results, Health/World mutation,
renderer outcome, and Observatory projection distinct. The cue may expose the
committed target/outcome, but it must not synthesize target, damage, cooldown,
progression, or replacement state. A missing or unavailable source fact must
produce no positive cue.

### Completion-report requirements

The eventual completion report must include architecture before → after,
files created/modified, actual call chain, tests and TypeScript/ESLint/build
results, constraints honored, known gaps, exact manual Product Verification
steps/results, Code Complete, and Product Verified. This discovery step reports
only `READY`; the execution result is recorded below.

## WO-S33-001 Execution and Product Verification

Human/CTO authorized execution of this exact WO on 2026-09-01. The bounded
implementation advances architecture from v1.182 to v1.183:

`committed Runtime GameplayRule result → pure outcome projector → existing
Runtime visualization loop → dedicated Pixi feedback layer`

The projector emits only committed `HEALTH_UPDATED` hit outcomes,
authoritative lethal `ENTITY_REMOVED` defeat outcomes using the last
authoritative pre-removal Position, and committed `ENTITY_ADDED` replacement
outcomes. Failed, uncommitted, attack-request-only, ordinary-removal, and
contact-only facts emit no Player-attack cue. Feedback is transient renderer
presentation time; it does not add Runtime timers, gameplay state, target
selection, damage authority, asset identity, or provider/image operations.
The Web viewport owns the presentation layer lifecycle and clears it when the
Runtime world identity changes. Platformer controls and Observatory projection
remain on their existing paths.

Files created:

- `packages/renderer/src/model/GameplayOutcomeFeedback.ts`
- `packages/renderer/src/runtime/RuntimeGameplayOutcomeFeedback.ts`
- `packages/renderer/src/runtime/__tests__/RuntimeGameplayOutcomeFeedback.test.ts`
- `packages/renderer/src/view/__tests__/GameplayOutcomeFeedbackRendering.test.ts`
- `apps/web/src/__tests__/SurvivalOutcomeFeedbackReachability.test.ts`
- `docs/adr/ADR-0293-generic-runtime-gameplay-outcome-feedback.md`

Files modified:

- Renderer model/runtime/public exports and `PixiEntityRenderer`
- `packages/renderer/src/runtime/DefaultRuntimeVisualizationLoop.ts`
- `apps/web/src/components/studio/GameViewportPanel.vue`
- `apps/web/src/projectMetadata.ts`
- Sprint 33 control-plane, project-state, capability, changelog, and roadmap
  documentation

Automated verification completed on the final implementation:

- Runtime: 708/708 tests; TypeScript passes.
- Renderer: 510/510 tests; TypeScript passes; ESLint passes with existing
  warnings only and zero errors.
- Web: 3573/3573 tests; TypeScript passes; ESLint passes with existing
  warnings only and zero errors; Vite production build passes.
- `git diff --check` passes.

Real Studio Product Verification used a fresh exact Survival request
`生成一个幸存者游戏`. The Game surface visibly showed a `-25` hit cue and
target ring, a distinct amber defeat ring/X, a replacement cue, and the same
generic hit cue after the replacement. Runtime Inspector/Event Stream
correlation confirmed committed Health, removal, add, XP/Level, and active
session truth. Full Observatory retained `world-1`, `v1.183 / Sprint 33`, and
the live event stream; Platformer `创建 MarioWorld` retained seven entities
and `Space — 跳跃`; final browser error/warning diagnostics were empty.
The out-of-range/no-target case is covered by the production-path regression
at distance 49 (no feedback); pursuit made a sustained manual separation
window unstable, so that observation is recorded rather than overstated.

Fresh post-WO Sprint 33 Gap Analysis: **PASS**. The selected original blocker
is resolved and the success question is YES. Progression meaning, replacement
pacing, and evasion readability remain secondary candidates rather than Sprint
33 WOs. Human/CTO then froze Sprint 33 at v1.183 and authorized Sprint 34
Product Gap Discovery; see `SPRINT34_PRODUCT_GAP_DISCOVERY.md`.

Code Complete: **YES**
Product Verified: **YES**
Next gate: **Sprint 33 FROZEN; Sprint 34 Product Gap Discovery complete**
