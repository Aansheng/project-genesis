# Sprint 35 Product Gap Discovery — Progression Meaning

Discovery date: 2026-09-01  
Architecture: v1.184  
Status: **DONE — exactly one READY WO generated; WO-S35-001 not executed; Sprint 36 not entered**  
Authority: Human/CTO decision froze Sprint 34 and authorized Sprint 35 Progression Meaning Discovery

## Discovery boundary

Human/CTO froze Sprint 34 at v1.184 with `WO-S34-001` Code Complete = YES,
Product Verified = YES, and the fresh post-WO Gap Analysis = PASS. Sprint 35
was authorized only to discover the smallest truthful capability that gives a
committed Level transition one mechanically observable consequence.

This record is discovery only. It does not implement a progression feature,
change the architecture version, add a new Runtime authority, or enter Sprint
36. Exactly one work order is produced below and remains `READY`.

## Current progression authority path

The accepted Survival path is:

`ENTITY_ATTACK_REQUESTED → GameplayRuleExecutor DAMAGE_ENTITY →
ENTITY_REMOVED → survival-enemy-defeat REMOVE_ENTITY + experience +1 →
survival-level-up-at-experience-threshold → level +1 → committed Runtime
progression projection → Observatory`

The next replacement boundary is still Runtime-only:

`ENTITY_REMOVED → SPAWN_ENTITY → current Runtime Player fair-start placement →
WorldMutator.addEntity → Runtime WorldStore → Renderer`

XP and Level are stored in the immutable keyed numeric state owned by the
Runtime gameplay progression store (`packages/runtime/src/gameplay/
RuntimeGameplayProgressionState.ts`). The Web Studio creates/reuses the
application-session store and passes it into `DefaultRuntimeExecutionLoop`
through `GameViewportPanel`; the execution loop commits the state after
trusted Gameplay Rule actions. Observatory receives a projection of that
committed state and is not an authority.

When Level changes, the current committed outcome is a
`NUMERIC_STATE_UPDATED` Gameplay Rule result for `level`. There is no separate
Level gameplay event, capability mutation, or component update. The existing
Survival level-up rule only changes the numeric key from `1` to `2` when
`experience >= 1` and `level < 2`.

## Repository audit

| # | Question | Current source truth | Discovery result |
| --- | --- | --- | --- |
| 1 | Where are XP and Level authoritative? | `RuntimeGameplayProgressionState` plus the app-session `DefaultRuntimeGameplayProgressionStateStore`, passed into the Runtime execution loop. | Runtime-owned immutable keyed numeric state; Observatory is projection-only. |
| 2 | What happens when Level changes? | `CHANGE_NUMERIC_STATE` commits `NUMERIC_STATE_UPDATED` with `state: level`, previous value, new value, and delta. | Numeric outcome only; no gameplay capability is changed. |
| 3 | Can rules condition on XP/Level/numeric state? | `GameplayRule` supports `NUMBER_COMPARE` over `gameState`; the executor resolves it from `context.progressionState.values`. | **YES.** The existing level-up rule already uses `experience >= 1` and `level < 2`. |
| 4 | Can existing rules modify a current gameplay parameter? | `DAMAGE_ENTITY.amount` and `APPLY_VELOCITY` values are fixed action data; `CHANGE_NUMERIC_STATE` changes only a keyed numeric state. | **NO generic progression-to-capability binding exists.** Current rules mutate Health, World entities, velocity, session state, or numeric progression, not a live capability parameter. |
| 5 | Where does Player movement speed originate? | `apps/web/src/components/studio/runtimeMotionProfile.ts` passes literal `3` to `DefaultPlayerControllerSystem`; the Runtime system stores it as constructor configuration. | Web composition/configuration value, not a Runtime component or progression value. |
| 6 | Where does Space attack damage originate? | `packages/ai/src/gameplay/GameplayRuleBuilder.ts` emits `DAMAGE_ENTITY` with `amount: 25` for the deterministic Survival offense rule. | Gameplay RuleSet constant, consumed by the generic Runtime action executor. |
| 7 | Where does attack range `48` originate? | `packages/runtime/src/systems/DefaultPlayerAttackRequestSystem.ts` defines `DEFAULT_PLAYER_ATTACK_RANGE = 48`; Studio uses the default constructor option. | Generic Runtime system configuration/default, not a component or RuleSet value. |
| 8 | Where does Player/max Health originate? | `RuntimeEntityComposition` adds `createDefaultHealthComponentForType`; `packages/shared/src/components/HealthComponent.ts` supplies `100 / 100`. | Runtime Health component state with fixed composition defaults; no max-health progression action exists. |
| 9 | How are these values classified? | Movement speed = Web composition/runtime constructor config; damage = Gameplay RuleSet action constant; range = Runtime system default/config; Health = Runtime component with shared composition default; XP/Level = Runtime progression state. | They do not share one existing live modifier surface. |
| 10 | Can an existing generic primitive make a Level threshold change one value? | `NUMBER_COMPARE(gameState.level)` can gate a rule, and `DAMAGE_ENTITY` can apply a fixed amount. | **YES at the RuleSet composition seam, not as a single mutable stat.** Mutually exclusive progression-conditioned action variants can use existing Runtime primitives; an action amount cannot currently reference or derive from Level directly. |
| 11 | What is the first missing capability? | No generic RuleSet composition binds a committed numeric progression snapshot to mutually exclusive capability action variants. | **Progression-conditioned gameplay capability selection** is the first missing primitive. It should be declarative, bounded, deterministic, and reusable over existing generic mechanics. |

## Real Survival product evidence

A fresh visible Genesis Studio session submitted the exact request
`生成一个幸存者游戏`. It produced active `world-1` with six Runtime entities,
the `Runtime active` state, and the existing `Arrow Keys — 移动` / `Space —
攻击` affordances. The current Runtime Inspector confirmed the existing
Enemy `Health 100 / 100`, Player-relative Runtime positions, target-directed
movement at `1.5`, and no new capability state.

The accepted same-v1.184 multi-cycle Studio run, with no code changes between
that verification and this discovery, reached the committed progression
transition `XP 0 → 1`, `Level 1 → 2`, continued with a replacement Enemy, and
showed no changed attack, range, movement, or Health behavior afterward. The
fresh session reproduced the unchanged baseline and browser diagnostics were
empty; a repeated synthetic-key retry was not counted as a new Level 2 proof
when the browser did not reliably deliver every edge through the animation
loop. The source path and accepted real product evidence therefore agree on
the measured gap:

> **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE.**

This gap is now the highest-priority remaining product blocker after Sprint 34
resolved replacement fair-start pressure. It is observable through the
existing committed Level result and the unchanged next attack, without
requiring a new HUD or upgrade-selection UI.

## Candidate evaluation

The candidates were not preselected as the implementation. They were audited
against immediate perceptibility, usefulness, fit with the current Survival
loop, reuse of generic primitives, and architecture delta.

| Candidate | Current authority | Product value | Generic reuse / delta | Decision |
| --- | --- | --- | --- | --- |
| Attack damage | Existing `DAMAGE_ENTITY` action amount `25` in the Survival RuleSet. | High: a Level 2 value of `50` would make the existing `100`-Health Enemy take two hits instead of four, using the same visible hit/defeat feedback. | High reuse of `NUMBER_COMPARE` + `DAMAGE_ENTITY`; small declarative RuleSet composition delta. | **Selected.** |
| Attack range | Runtime `PlayerAttackRequestSystem` constructor/default `48`. | Potentially high, but only clearly felt when a target is just outside the current boundary. | Requires a Runtime system/configuration capability seam or a new range state; larger verification surface. | Not selected. |
| Movement speed | Web composition literal `3` passed to the generic Player controller. | Useful for evasion, but the effect also changes pursuit/fair-start balance and collision timing. | No live component; requires dynamic controller composition and broader balance regression. | Not selected. |
| Max/current Health | Runtime Health component default `100 / 100`. | Useful but changes failure/contact semantics and may be less immediately attributable to Level. | No generic max/current Health capability action; safe lethal/respawn semantics would enlarge the slice. | Not selected. |

Attack damage is the smallest meaningful proof because it changes an existing
mechanic that the Player already intentionally invokes, is visible in the
existing Health and outcome path, and can be composed with the current generic
condition/action primitives. This does not authorize a general damage stat or
an RPG modifier framework.

## Exactly one READY work order

`WO-S35-001 — Generic Progression-Conditioned Gameplay Capability`

The work order is `READY` only. It is not executed in Sprint 35 discovery.
Its proposed proof is one generic RuleSet capability selection:

`committed Level 1 → Survival offense action amount 25`

`committed Level 2 → Survival offense action amount 50`

The implementation should compose mutually exclusive
`NUMBER_COMPARE(gameState.level)` conditions with existing
`DAMAGE_ENTITY` actions, preserve one target-selection/request path, and keep
the condition/action primitive generic. The Runtime must not contain a
`worldType === survival && level === 2` branch inside attack mechanics.

### Acceptance boundary for a later authorized execution

1. Level 1 keeps the existing behavior: one valid Space attack commits
   `damageAmount: 25` and changes Enemy Health `100 → 75`.
2. The first lethal Enemy defeat commits the existing `experience +1` and
   `level 1 → 2` transition, with no duplicate damage from the Level 2 variant
   on that same attack event.
3. At committed Level 2, the next valid Space attack uses the same generic
   target-selection and `DAMAGE_ENTITY` path with `damageAmount: 50`, changing
   Enemy Health `100 → 50`; a second valid attack defeats it through the
   existing removal, XP, fair-start replacement, and feedback path.
4. The result is deterministic, finite, Runtime-authoritative, observable in
   committed Health/outcome data, and requires no UI upgrade choice or random
   reward.
5. Survival contact danger, replacement fair-start, Observatory XP/Level
   truth, hit/defeat/replacement feedback, initial Enemy composition, and
   Platformer `Space — 跳跃` remain unchanged.
6. Tests cover RuleSet composition, condition/action execution, exactly-once
   Level-variant behavior, production Survival reachability, and Platformer
   regression; real Studio play reaches Level 2 and verifies the reduced hit
   count.

### Proposed implementation boundary

- Add one pure, generic progression-conditioned RuleSet composition helper at
  the existing Gameplay Rule builder boundary, reusing `NUMBER_COMPARE` and
  `DAMAGE_ENTITY` rather than adding a stat framework.
- Change only the deterministic Survival composition to select the two
  capability variants for this proof.
- Touch Runtime only if a focused execution test demonstrates an existing
  exactly-once/staged-evaluation gap; do not add a Runtime modifier manager or
  new gameplay authority.
- Expected architecture after later execution: v1.185 (proposed only; not
  applied by this discovery).

## Explicit non-goals

- No implementation of `WO-S35-001` in this discovery.
- No `StatsEngine`, `ModifierManager`, `AttributeSystem`, `BuffSystem`,
  `EffectStack`, `SkillTree`, `UpgradeManager`, or RPG stat framework.
- No attack-range, movement-speed, Health, weapon, projectile, timer, wave,
  cooldown, difficulty-scaling, or world-bounds work.
- No new progression UI, upgrade selection, randomized reward, persistence,
  telemetry, or Observatory redesign.
- No Platformer behavior change, global Level reward, provider/image call, or
  live AI decision.
- No second WO and no Sprint 36 entry.

## Discovery gates and stop condition

| Gate | Result |
| --- | --- |
| Sprint 34 frozen at v1.184 | PASS — Human/CTO accepted; `WO-S34-001` Code Complete/Product Verified = YES |
| Runtime/source audit completed | PASS — authority, outcomes, conditions, action parameters, and value ownership recorded |
| Existing generic primitive identified | PASS — `NUMBER_COMPARE(gameState)` + `DAMAGE_ENTITY`; missing seam is capability selection |
| Candidate effects ranked from product and source evidence | PASS — attack damage selected |
| Exactly one measured blocker selected | PASS — Level progression has no gameplay consequence |
| Exactly one READY WO generated | PASS — `WO-S35-001` only |
| WO execution | NOT PERFORMED by authorization boundary |
| Sprint 36 entry | NOT PERFORMED by authorization boundary |

Sprint 35 discovery is complete. The repository is stopped with Sprint 34
frozen, `WO-S35-001` READY for a separately authorized execution step, and no
additional work order or Sprint 36 transition.
