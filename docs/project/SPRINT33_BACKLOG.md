# Sprint 33 — Survival Playability Gap Discovery

**Authorization:** Human/CTO decision, 2026-09-01  
**Architecture at authorization:** v1.182  
**Current architecture:** v1.182  
**Status:** ACTIVE — discovery complete; exactly one `READY` WO; no implementation executed

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
The selected bottleneck is:

> **PRODUCT_GAP — generic gameplay outcome feedback/readability.** Explicit
> attack input and authoritative outcomes work, but the normal Game canvas is
> silent on hit, damage, defeat, and replacement. Every attack requires an
> Inspector or Observatory read to confirm what happened.

Replacement pacing and progression meaning are real secondary observations;
timers, waves, projectiles, scaling, and genre-specific combat systems remain
deferred.

## WO-S33-001 — Generic Runtime Gameplay Outcome Feedback

**Status:** READY — not executed in this continuation  
**Priority:** P0 / Sprint 33 primary WO  
**Architecture before:** v1.182  
**Expected architecture after:** v1.183, only if the WO is authorized and
implemented; a bounded Runtime-outcome-to-Game presentation projection  
**Dependencies:** Sprint 32 FROZEN at v1.182; Sprint 33 discovery DONE; the
existing Runtime event collector, Gameplay Rule results, WorldStore mutation,
Runtime visualization loop, and Game Viewport are available. No unresolved
architecture or provider decision is required for the minimum slice.  
**Human decision gate:** Discovery is authorized, but execution is intentionally
deferred by the current decision; `READY` does not mean executed.

### Measured bottleneck

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
  active session, Observatory event/rule facts, and `v1.182` baseline remain
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
only `READY`; it does not mark the WO complete.
