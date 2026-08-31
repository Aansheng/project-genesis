# Sprint 30 — Sustained Survival Loop

**Authorization:** Human/CTO decision, 2026-08-28  
**Architecture at authorization:** v1.179  
**Status:** ACTIVE — initial Gap Analysis complete; WO-S30-001 Code Complete =
YES; Product Verified = PENDING MANUAL

## Product goal

Prove one bounded Runtime-authoritative replenishment cycle:

`Enemy pressure → Enemy defeat/removal → replacement Enemy pressure → gameplay
continues`

This is not authorization for waves, periodic spawning, difficulty scaling,
encounter orchestration, or a Survival-specific spawn engine.

## Production-path Gap Analysis

The inspected chain is:

`Gameplay Specification → Gameplay RuleSet → Runtime event collector →
GameplayRuleExecutor → WorldMutator → Runtime WorldStore → Renderer adapter /
Pixi → Observatory`

| Question | Repository truth |
| --- | --- |
| 1. Can Gameplay Rules add/create Runtime entities? | **At authorization: typed but not executable.** `SPAWN_ENTITY` was in the shared rule vocabulary and validator, but `DefaultGameplayActionExecutor` returned `action_not_executable`; WO-S30-001 now closes this bounded execution gap. |
| 2. Does a trusted action equivalent to `ADD_ENTITY` exist? | **At lower layers only.** Legacy `CreateEntity` and immutable `WorldMutator.addEntity()` exist; neither is wired to trusted Gameplay Rule execution. |
| 3. Can WorldMutator add during an active session? | **YES.** It immutably appends an Entity; the active visualization loop commits the returned World to `RuntimeWorldStore`. |
| 4. Can composition produce a new Enemy without rebuilding the world? | **YES after the missing action execution is supplied.** Rule execution already commits mutations into the current active snapshot without semantic regeneration. |
| 5. Is a generic create action already present? | **At authorization: YES in contract, NO in execution.** `SPAWN_ENTITY` was validated and reconciled but catalogued deferred and rejected at Runtime; it is now supported for the bounded trusted path. |
| 6. Can a new Enemy receive required composition? | **Existing composition can be reused.** `RuntimeWorldEvolutionSynchronizer` already builds semantic, Position, Health, collision bounds, and Survival target-directed movement. Category-based contact rules cover pressure/offense. Renderer can display any positioned Enemy; generated-art reuse needs a binding-only Runtime projection. |
| 7. Is there a generic WHEN trigger? | **YES.** Committed ID-set mutations emit `ENTITY_REMOVED`; it is a supported Gameplay trigger. |
| 8. Are ticks/timing available? | **Ticks YES, timer rule semantics NO.** The execution loop/event collector own monotonic ticks, but no timer condition is exposed. Timing is unnecessary for the first bounded cycle. |
| 9. Can rules express entity count? | **NO.** No entity-count numeric reference exists. It is unnecessary when one Enemy removal replenishes one Enemy. |
| 10. First smallest blocker? | **Trusted generic `SPAWN_ENTITY` execution with reusable Runtime composition and binding-only visual identity.** The removal trigger already exists, so no timer/count/wave primitive is needed. |

## Authority finding

Runtime combat removal already changes only the active Runtime World while the
persistent Semantic World remains the design authority. Therefore a
rule-created replacement is an ephemeral gameplay entity in the existing
authority model; it must not invoke AI World Evolution or silently mutate the
Semantic World. This is repository evidence, not a newly invented persistence
policy.

## Selected work order

### WO-S30-001 — Generic Rule-Driven Runtime Entity Creation

**Status:** READY FOR PRODUCT VERIFICATION — Code Complete = YES; Product
Verified = PENDING MANUAL  
**Architecture before:** v1.179  
**Expected architecture after:** v1.180

**Measured bottleneck at authorization:** supported removal events, typed spawn intent,
WorldMutator addition, active WorldStore commits, pursuit/contact systems, and
Renderer projection already existed. `SPAWN_ENTITY` could not execute or
compose a fully capable entity, and runtime-only additions did not yet receive
a binding-only canonical visual resource; this is the gap closed below.

**Allowed scope:**

- promote only the generic `SPAWN_ENTITY` primitive and Survival Enemy
  replenishment mechanic proven by this slice;
- reuse one generic Runtime entity composition helper for both semantic World
  Evolution additions and rule-driven ephemeral additions;
- deterministically select a safe free Runtime position and unique identity;
- trigger one Enemy replacement from a committed Enemy `ENTITY_REMOVED` fact;
- make mutation-event category matching work from authoritative removal facts;
- bind an equivalent runtime-only entity to the existing canonical Enemy visual
  resource without an image-generation request;
- focused production reachability and Platformer non-regression coverage;
- ADR and truthful control-plane updates.

**Forbidden scope:** Wave/Spawn/Encounter/Difficulty managers, periodic timers,
schedulers, entity-count expressions, prefab/factory frameworks, procedural
placement, AI calls per spawn, Semantic World mutation for ephemeral gameplay,
new visual generation, boss/loot/upgrade systems, or Platformer spawning.

**Acceptance:**

- generated Survival composes one supported Enemy-removal replenishment rule;
- defeating an Enemy removes it and a later authoritative removal fact adds one
  replacement without rebuilding the world/session;
- the replacement has Position, Health, collision, target-directed pursuit,
  contact pressure, and contact-offense compatibility;
- the replacement can damage Player and can itself be damaged/defeated;
- the replacement reuses an existing resolved Enemy visual through binding
  only, with no provider/image-generation call;
- Runtime session remains active and Platformer composes no spawn rule;
- production-chain tests and real Studio verification pass with clean
  diagnostics.

## WO-S30-001 Execution and Verification

The trusted `SPAWN_ENTITY` action now resolves an existing semantic Enemy
template, selects a deterministic unique Runtime identity and safe position,
reuses the shared Runtime composition helper, and commits the replacement with
`WorldMutator.addEntity()` in the current active snapshot. The committed
Gameplay removal carries `health=0` into the next `ENTITY_REMOVED` fact, so a
Semantic World Evolution removal with its prior positive Health does not
trigger replenishment. The replacement receives Position, Health, collision
bounds, target-directed pursuit, and the existing category-based pressure and
offense rules. Web reuses the canonical resolved Enemy visual through a
binding-only manifest projection without an image-generation request.

Automated production reachability passes the real generated Survival RuleSet,
four contact defeats, the zero-Health removal boundary, one replacement, full
replacement composition, replacement contact pressure, and active-session
continuity. Full package tests, TypeScript, package ESLint, Web build, and
diff hygiene pass. Code Complete = YES.

Real provider-backed Studio verification is still required. The in-app browser
session was reaped after a model switch and fresh local navigation was denied
by security review; therefore Product Verified remains PENDING MANUAL and
`SPRINT30_FREEZE_REVIEW` is not selected.

## Deferred non-blockers

Entity-count conditions, periodic timing, multiple waves, scaling, countdown
UI, encounter direction, prefab systems, and persistent Semantic recording of
ephemeral gameplay entities are outside this bounded proof.
