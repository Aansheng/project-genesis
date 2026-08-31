# Sprint 32 — Survival Playability Gap

**Authorization:** Human/CTO decision, 2026-08-31  
**Architecture at authorization:** v1.181  
**Current architecture:** v1.181  
**Status:** AUTHORIZED — Product Gap Discovery DONE; exactly one primary WO
READY; execution not started

## Product goal

Make the first Survival combat interaction understandable and intentionally
playable while preserving the already verified sustained Runtime loop:

`Player intent → trusted Runtime gameplay → Enemy defeat/replacement → active
session → truthful Observatory`

Sprint 32 begins with one measured product blocker. It is not authorization for
a broad Survival feature roadmap.

## Verified baseline to preserve

The current real product already provides:

- natural-language generation into a Survival semantic world;
- top-down spatial composition and Player X/Y movement;
- target-directed Enemy pursuit and contact pressure;
- Player contact offense, Enemy Health, defeat/removal, XP, and Level;
- Runtime-only replacement Enemy spawning with reused composition/visuals;
- an ongoing active session and truthful Observatory inspection.

These capabilities are evidence and constraints, not work to rebuild.

## Product Gap Discovery result

The fresh real play session and source audit are recorded in
[`SPRINT32_PRODUCT_GAP_DISCOVERY.md`](SPRINT32_PRODUCT_GAP_DISCOVERY.md).
The selected bottleneck is:

> Verified movement, pursuit, Health, `DAMAGE_ENTITY`, defeat, XP/Level,
> replacement spawning, and active-session continuity exist; Sprint 32 still
> requires a user-understandable intentional Player offense. The current
> contact-only offense is the smallest blocker because the first observed
> Enemy damage happens without an explicit attack action, the same overlap
> damages the Player, and no visible attack affordance or repeatable combat
> rhythm is provided.

The discovery result is **PRODUCT_GAP — highest priority**. Replacement
placement/pacing, progression meaning, and presentation remain secondary
observations and do not receive separate work orders in this horizon.

## WO-S32-001 — Generic Player-Directed Short-Range Offense

**Status:** READY — generated after Product Gap Discovery; not executed in this
step  
**Priority:** P0 / Sprint 32 primary WO  
**Architecture before:** v1.181  
**Expected architecture after:** v1.182 (bounded generic input → Runtime
offense capability only)  
**Dependencies:** Sprint 31 FROZEN at v1.181; Sprint 32 Product Gap Discovery
DONE; existing `DAMAGE_ENTITY`, Runtime Position, collision, input, and
Gameplay Rule paths available  
**Human decision gate:** Satisfied for this bounded direction by the explicit
Sprint 32 authorization; execution is intentionally deferred until after this
discovery report

### Measured bottleneck

The current Survival rule `survival-contact-offense` applies the existing
`DAMAGE_ENTITY` action when an `ENTITY_CONTACT_STARTED` fact is observed. The
same overlap also enables `survival-enemy-contact` to damage the Player. The
real Game surface exposes only `Arrow Keys — Move`, so a normal user cannot
discover or intentionally initiate offense. The initial and replacement
Enemies can occupy the Player's current position, making defeat look
accidental and making repeated independent contacts an awkward prerequisite.

### Smallest intended capability

Add one generic Player-directed short-range attack interaction:

1. Reuse the existing `Space` input in the top-down composition and expose the
   minimal `Space — Attack` control hint. Platformer `Space — Jump` behavior
   remains unchanged.
2. On one accepted key edge, select the nearest current Runtime Enemy within a
   bounded short range (the implementation must choose and test one explicit
   finite bound, with deterministic ID tie-breaking).
3. Emit a provider-neutral Runtime attack request/fact and let the existing
   Gameplay Rule / trusted `DAMAGE_ENTITY` path apply one bounded damage unit
   to that selected target.
4. Gate or replace the Survival Player→Enemy contact offense so Enemy damage is
   not still presented as the primary accidental attack path. Enemy contact
   damage to the Player remains a separate danger rule.
5. Provide only the minimal user-visible outcome needed to understand that the
   explicit attack was accepted (control hint plus the existing authoritative
   health/defeat result or an equally small generic cue). No animation system
   is implied.

The final implementation must preserve the semantic intent → validated RuleSet
→ Runtime fact/action boundary. A provider or AI model may describe the
mechanic, but it may not make live per-frame combat decisions.

### Allowed scope

- one generic input/event seam for an explicit Player attack request;
- deterministic nearest-target and finite short-range evaluation using current
  Runtime Position/Health/collision data;
- reuse or narrowly extend the existing generic Gameplay Rule event vocabulary,
  matcher, condition handling, and trusted `DAMAGE_ENTITY` action as required;
- reuse `Space` only in a top-down offense composition while preserving
  Platformer jump semantics;
- the smallest control hint and attack outcome cue required by Product
  Verification;
- focused Shared/AI/Runtime/Web tests, capability-matrix updates, and an ADR
  only if the implementation changes an accepted architecture contract;
- real Studio verification plus Observatory truth regression.

### Forbidden scope

- `SurvivorWeaponSystem`, `SurvivorCombatEngine`, or any genre-specific Runtime;
- live AI/provider combat decisions or per-attack generation calls;
- projectile entities, projectile physics, projectile lifetime, or a projectile
  manager;
- timers, cooldown schedulers, auto-fire, waves, spawn directors, or difficulty
  scaling;
- broad nearest-target/selector frameworks beyond the smallest measured slice;
- attack animation systems, sprite-sheet work, visual redesign, or a new UI
  combat HUD;
- XP/Level redesign, upgrade/skill systems, health rebalance, lives,
  persistence, telemetry, or route-state infrastructure;
- changing Runtime authority, Semantic World identity, replacement spawning,
  Platformer `Space` jump behavior, or Observatory metadata truth;
- Sprint 33 or any unrelated cleanup.

### Real architecture flow

The expected bounded flow is:

`top-down Space key edge → generic Runtime attack request/fact → deterministic
current-position target selection → GameplayRuleMatcher/ConditionEvaluator →
trusted DAMAGE_ENTITY → Runtime WorldStore → Renderer/Studio projection →
Observatory projection`

If the source audit during implementation shows that a new event is not needed,
the implementation must keep the same authority and observable behavior with a
smaller existing seam. It must not introduce a parallel combat authority.

### Acceptance criteria

- The exact request `生成一个幸存者游戏` still produces an active Survival
  `world-1` with the existing world composition and no extra provider/image
  generation call for an attack.
- The Game surface explicitly exposes the chosen attack input; the existing
  Platformer control mapping remains unchanged.
- With an Enemy inside the bounded attack range but not in contact, one attack
  input produces one intentional, deterministic Enemy damage result without
  requiring Player/Enemy overlap.
- With no Enemy in range, the attack produces no damage and no fabricated target
  or world mutation.
- Four bounded attack inputs can defeat the current Enemy through the existing
  Health/removal path, grant the existing XP/Level result, and keep the same
  active `world-1` session with the existing one-for-one Runtime replacement.
- Enemy contact remains an understandable danger interaction; the Survival
  product no longer requires collision damage as the only way for the Player to
  attack.
- The action is visible enough in the real Game surface to distinguish an
  accepted attack from an idle frame; no attack animation is required.
- Full Observatory continues to show current Runtime world/session,
  progression, current `v1.181` metadata until the implementation's deliberate
  version transition, and truthful event/rule outcomes. It must not regain
  default/stale values.
- Platformer, existing movement, replacement composition, asset binding, and
  clean browser diagnostics remain intact.

### Automated verification

- Shared event/input types and capability catalog tests for the smallest new
  primitive, if a new primitive is required.
- Runtime target-selection, key-edge/request emission, range behavior,
  deterministic tie-break, no-target no-op, and trusted damage execution tests.
- AI gameplay specification/rule-builder/validator tests proving semantic
  intent remains data-only and unsupported alternatives stay gated.
- Web production-path regression for top-down Space attack, control hint,
  active-session continuity, and Platformer Space jump non-regression.
- Relevant package test suites, TypeScript checks, package ESLint, Web build,
  and `git diff --check`.

### Product Verification

In a fresh real Studio session, submit `生成一个幸存者游戏` and exercise at
least four independent attack inputs at controlled short range. Record:

- the visible attack affordance and the exact Player input;
- target selection and one-damage-per-input behavior;
- no overlap requirement for the attack and separate Enemy contact danger;
- Enemy defeat, XP/Level, replacement identity/composition, and active-session
  continuity;
- Game → Full Observatory → Game → Full Observatory continuity;
- current metadata, Runtime truth, progression truth, and event/rule facts;
- provider/image-generation operation counts and browser error/warning
  diagnostics.

Do not claim Product Verified from unit tests alone. If the real session reveals
a different first blocker, stop and report it rather than expanding this WO.

### Observability expectations

Keep Runtime facts, rule results, World mutation, renderer outcome, and
Observatory projection distinct. The Observatory must show the real committed
attack/damage/removal facts or an honest empty/unavailable state. It must not
synthesize an attack, target, cooldown, or progression effect.

### Completion-report requirements

The eventual WO completion report must include architecture before → after,
files created/modified, the real call chain, tests and TypeScript/ESLint/build
results, constraints honored, known gaps, exact manual Product Verification
steps/results, Code Complete, and Product Verified. This discovery step reports
only `READY`; it does not mark the WO complete.

## Sprint 32 execution boundary

`WO-S32-001` is the only generated primary WO. It is READY but intentionally
not executed in the same Product Gap Discovery step. Sprint 32 remains the
current Sprint; Sprint 33 is not entered.
