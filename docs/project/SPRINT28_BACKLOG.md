# Sprint 28 — Survival Gameplay Pressure

**Authorization:** Human/CTO decision, 2026-08-28
**Architecture at authorization:** v1.177
**Status:** IMPLEMENTATION COMPLETE — Code Complete = YES; Product Verified = PENDING

## Product thesis

After Sprint 27, a generated Survival world must not only read as top-down; it
must create a deterministic, immediately observable pressure loop:

`Enemy → approaches current Player → contact threatens Player → Player avoids`

The minimum target is Player X/Y free movement, enemies that close distance,
contact damage to Player, avoidance by moving the Player, and coherent use of
the existing Game Over / failed state and same-session Respawn path.

This authorization does not include player kill, weapons, attacks, projectiles,
spawn systems, waves, timers, XP, skills, or automatic entry into Sprint 29.

## Real production chain inspected

The source-backed chain is:

`StudioCommandBar → gameStore → IntentRouter / CreateWorldPipeline → Semantic
World → Game DSL → Runtime projection → Runtime system registry /
DefaultRuntimeExecutionLoop → Gameplay event collector /
EntityContactSystem → post-system GameplayRuleExecutor → Runtime World,
Health, and session state → RuntimeRendererAdapter / Pixi → Observatory`

The configured Studio browser path uses the provider-backed generation and
gameplay fallbacks in `apps/web/src/stores/gameStore.ts`; the deterministic
Survival gameplay fallback is therefore part of the production-reachable path.

## Initial Gap Analysis — 2026-08-28

This is a source-grounded capability audit before implementation. It does not
claim that enemy pursuit has already been manually verified in Studio.

| Question | Finding | Evidence / consequence |
| --- | --- | --- |
| 1. Are Survival enemies stationary? | **Yes.** | The initial Survival enemy receives semantic, Position, Health, and collision-bounds components, but no Velocity; no registered system updates its Position toward Player. |
| 2. Which Runtime components currently exist? | **Generic components exist:** semantic, Position, Velocity, collision bounds, Health, and arbitrary data-only Runtime components. | `packages/shared` owns the component contracts; `DefaultRuntimeProjection` projects DSL components without adding behavior. |
| 3. Do Position / Velocity / collision / Health / semantic target info exist? | **Position, Velocity, collision bounds, Health, and semantic identity exist as generic capabilities. A target reference does not exist on the initial Survival enemy.** | Health and collision are already projected for Player/Enemy. Velocity is available but absent from the initial Enemy. The gameplay specification mentions deferred `enemy-chase` but does not supply a Runtime target component. |
| 4. Does generic target-directed movement exist? | **No.** | No Runtime system reads a target Position and computes a direction or distance-reducing movement. |
| 5. Can the current MovementSystem or another Runtime system express it? | **No.** | `DefaultMovementSystem` applies fixed `deltaX/deltaY`; `DefaultVerticalMotionSystem` integrates only Player entities; the real Survival registry has PlayerController, VerticalMotion, EntityContact, and gameplay execution, but no pursuit system. |
| 6. Is Enemy → Player contact damage production-reachable in Survival? | **Yes, on the deterministic/default gameplay path.** | Enemy/Player collision bounds reach `EntityContactSystem`, which emits `ENTITY_CONTACT_STARTED`; the Survival `survival-enemy-contact` rule reaches trusted `DAMAGE_ENTITY` and Player Health/session state. The trigger is contact-start, not a repeated tick while overlap remains. |
| 7. Can damage / Health / failed / Respawn be reused unchanged? | **Yes for this bounded slice.** | Generic Health, `DAMAGE_ENTITY`, failure transition, and same-session Respawn are Runtime-owned and already product-verified. The WO must verify Survival reachability, not replace these foundations. |
| 8. Do conversationally added enemies receive the same gameplay composition? | **Not yet.** | Same-world `再加五只怪` and exact +5 continuity are verified, but the evolution synchronizer currently gives added entities semantic, Position, and collision components without the initial Enemy's Health/Velocity composition, and no pursuit behavior is registered for either set. |
| 9. What is the first smallest blocker for Enemy → approaches Player → contact threatens Player? | **Missing generic Runtime target-directed movement / pursuit execution.** | Contact damage and recovery already have a production path; without a registered system that moves every eligible Enemy toward the current Player and updates after Player movement, the pressure loop cannot begin. |

## Selected bounded work order

### WO-S28-001 — Generic Runtime Target-Directed Enemy Pursuit

**Status:** IMPLEMENTED — Code Complete = YES; Product Verified = PENDING human
recheck of the repaired incremental visual binding
**Architecture before:** v1.177
**Architecture after:** v1.178 — generic target-directed Runtime composition
implemented; Product Verification remains pending the final human recheck

**Measured bottleneck:** Survival has stationary generated enemies. Generic
Position, Velocity, collision, Health, contact, damage, failure, and Respawn
capabilities exist, but no registered Runtime capability resolves a current
Player target, computes direct target-directed motion, and integrates that
motion for eligible Enemy entities. Conversationally added enemies also need
to inherit the same bounded behavior through the existing targeted evolution
seam.

**Allowed scope:**

- one generic Runtime target-directed movement capability, with an injected or
  otherwise explicit target-selection contract;
- the minimal generic Velocity/Position integration needed for non-Player
  entities participating in that capability;
- Survival composition wiring that enables the generic capability for the
  current Survival world without changing Platformer systems;
- the existing world-evolution composition seam so initial and conversationally
  added enemies receive equivalent pursuit/contact gameplay composition;
- focused Runtime, AI/gameplay, Web composition, evolution, and regression
  tests;
- an ADR/state/changelog update only if the accepted implementation changes
  architecture.

**Implementation boundaries:** Runtime remains authoritative for entity
identity, target selection input, Position, Velocity, collision, Health, and
session state. Pursuit is deterministic direct movement toward the current
Player Position, not an AI/provider frame decision. The capability must be
generic and composition-selected for Survival; it must not become a global
enemy behavior or a genre-specific engine. Existing contact damage,
`DAMAGE_ENTITY`, failed state, and Respawn remain the authority.

**Forbidden scope:**

- `SurvivorEnemyAI`, `SurvivorRuntime`, `EnemyAIManager`, `ChaseManager`, or
  any other Survivor-specific engine/manager;
- BehaviorTree, pathfinding, navmesh, steering, model-in-the-loop behavior,
  or renderer-directed movement;
- player kill, weapons, attacks, projectiles, spawn/wave systems, timers,
  duration, XP, skills, inventory, or progression expansion;
- Platformer composition, `DefaultPlayerController`, Jump, collision, or
  side-view behavior changes;
- a new Renderer architecture, camera architecture, or manual test-only
  entities;
- a second Sprint 28 feature WO.

**Acceptance:**

- On the real Studio command `生成一个幸存者游戏`, the existing production
  path creates multiple enemies; at least one Enemy Position moves toward the
  stationary Player, and the direction updates toward the Player's new
  Position after the Player moves.
- Enemy/Player contact emits the existing Runtime contact fact and the
  existing Survival damage rule decreases authoritative Player Health.
- Lethal contact reaches the existing failed / Game Over presentation and
  Respawn restores the same world/session when practical; no regeneration is
  used as recovery.
- On the same active world/session, `再加五只怪` changes the entity count by
  exactly +5 without rebuild; the new enemies inherit the same pursuit and
  contact-threat composition while the original Player/world state persists.
- Platformer retains its existing side-view composition, controls, Jump,
  collision, and gameplay behavior; the browser console remains clean.
- No Survivor-specific Runtime, Renderer, manager, AI model, or pathfinding is
  introduced.

**Automated verification:** Add targeted Runtime tests for target selection,
direction updates, distance reduction, eligible-entity Velocity/Position
integration, and production registry execution; test Survival composition and
world-evolution inheritance; run existing Platformer regressions; then run
affected package suites, TypeScript checks, ESLint, Web build, and
`git diff --check`.

## WO-S28-001 Execution Record — 2026-08-28

**Implementation result:** The bounded Runtime capability is implemented at
v1.178. Survival composition attaches an explicit target entity ID and finite
speed to eligible Enemy entities. Runtime resolves the target Position,
writes normalized Velocity, and a generic Velocity motion system integrates
Position. The same composition is injected by the semantic-to-DSL path and
the existing same-world evolution synchronizer; Platformer registration is
unchanged.

**Human product observations:** Human/CTO real-product verification confirms
that the generated Survival Enemy automatically approaches the Player and
that the existing contact path decreases Player Health. The observed single
damage application while overlap persists is expected: the existing
`ENTITY_CONTACT_STARTED` contract de-duplicates a continuous overlap. No
attack or continuous-damage mechanic is added by this WO.

**Measured visual gap and repair:** Human/CTO observed that newly added
enemies did not visibly use the first generated Enemy artwork. The repair is
within this WO's existing evolution seam: Survival Enemy additions inherit
the existing Enemy visual identity, and the targeted manifest copies the
already-resolved shared resource to each new entity binding without creating
duplicate generation work. This is asset binding reuse, not a new visual
architecture.

**Verification status:** Automated integration proves exact same-world +5
enemy addition, pursuit/contact composition inheritance, zero duplicate image
generation, and resolved resource reuse. A post-repair real Studio retry of
`再加五只怪` returned an invalid provider candidate twice, while the browser
console remained clean; this provider result is not treated as a product
failure. Product Verified remains PENDING until Human/CTO confirms the
repaired visual binding in a successful real session.

**Product verification steps:** In a clean real Studio session, run the exact
Survival command, inspect actual Runtime Position/Velocity for an Enemy while
the Player is stationary and after Player movement, observe contact damage and
Health decrease, verify failed/Game Over and same-session Respawn, then issue
`再加五只怪` and verify same-world/session identity, exactly +5 entities, and
the same behavior on the additions. Reload or create the existing Platformer
world and repeat the established non-regression checks. Record only observed
Runtime, gameplay, visual, evolution, and console facts; do not infer pursuit
from prompts or semantic intent alone.

**Completion report must include:** architecture version before → after,
created/modified files, real call chain, tests, TypeScript, ESLint, build,
constraints honored, remaining gaps, manual product verification steps, Code
Complete, and Product Verified.

**Next gate after this WO:** `SPRINT28_FREEZE_REVIEW` only if the bounded
thesis and acceptance pass. Sprint 29 is not entered automatically.
