# Sprint 34 Product Gap Discovery — Survival Playability

**Discovery date:** 2026-09-01  
**Authority:** Human/CTO froze Sprint 33 at v1.183 and authorized Sprint 34
Product Gap Discovery  
**Status:** DONE — exactly one measured blocker selected; exactly one READY WO
generated; no implementation performed
**Architecture:** v1.183 before and after discovery

## Boundary and method

Sprint 34 began with real product play, without a preselected feature. A fresh
Genesis Studio session submitted exactly `生成一个幸存者游戏`. The generated
fallback session reached active `world-1` with six entities. The session was
played through movement/attempted evasion, Enemy pursuit, explicit Space
attacks, hit and defeat, XP/Level, Runtime-only replacement, replacement
combat, and two complete defeat/replacement cycles.

This record evaluates player-visible product behavior. Runtime Inspector and
Observatory were used to correlate authoritative facts after play, not as a
substitute for normal Game-surface behavior. The fallback/provider diagnostic
metadata observed in this local session did not prevent generation or play and
is not selected as the Sprint 34 blocker; no attack-time provider or image
operation occurred.

## Real play evidence

| Area | Observation | Result |
| --- | --- | --- |
| A. Progression meaning | The first Enemy defeat advanced XP from `0` to `1` and Level from `1` to `2`. The second defeat advanced XP to `2` while Level remained `2`; no Level-dependent action, risk/reward change, or Game-surface consequence appeared. | Secondary: **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**. Record only; no skill-tree implementation. |
| B. Replacement pacing/fairness | Each lethal defeat preserved the active session and six-entity composition, then created a Runtime-only Enemy. The replacement resumed target pursuit quickly and was observed co-located with the Player after brief movement. | **Selected blocker.** The current start policy has no deterministic player-relative minimum-distance/non-overlap guarantee. |
| C. Combat feel | The existing `48` range and nearest valid target behavior were predictable. Four committed hits of `25` defeated each Enemy. The loop is repetitive, but projectile behavior is not the smallest generic missing capability. | Secondary combat observation; no projectile WO. |
| D. Outcome readability | The accepted Sprint 33 Product Verification remains PASS: visible committed hit (`-25`/ring), defeat ring/X, replacement cue, post-replacement hit, and no-target behavior. | Solved; preserve. |
| E. Player survival fairness | Arrow movement works and the Enemy is slower, while contact damage is edge-triggered rather than continuous. Brief manual separation did not remain stable before pursuit re-established contact. | Reinforces the pacing/fairness blocker; no separate death-system WO. |

## Candidate ranking

| Rank | Candidate | Visibility/frequency/impact | Decision |
| --- | --- | --- | --- |
| 1 | **RUNTIME REPLACEMENT PRESSURE LACKS FAIR PACING** | Appears on the normal Game surface, recurs after every defeat, directly shapes agency and short-session rhythm, and has a small generic boundary on an existing Runtime path. | **SELECTED** |
| 2 | **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE** | Real and persistent after XP `2`, but primarily visible through Observatory and only the first threshold changes Level. | Secondary; no implementation. |
| 3 | Combat repetition / projectile absence | The 48-unit attack is discoverable and deterministic; projectiles would be a larger feature than the measured pacing fix. | Deferred; no projectile WO. |
| — | Sprint 33 outcome readability | Already solved and accepted across hit, defeat, replacement, post-replacement hit, and no-target cases. | PASS; preserve. |

## Source audit and root cause

The real implementation path is:

`ENTITY_REMOVED (health <= 0) → GameplayRuleExecutor SPAWN_ENTITY → semantic
Enemy composition → findSafeRuntimeEntityPosition →
DefaultTargetDirectedMovementSystem → EntityContactSystem`

Relevant source evidence:

- `packages/ai/src/gameplay/GameplayRuleBuilder.ts` defines the Survival
  defeat/replacement composition, including `ENTITY_REMOVED` with authoritative
  Health zero leading to `SPAWN_ENTITY`, and the one-time XP/Level threshold.
- `packages/runtime/src/gameplay/GameplayRuleExecution.ts` resolves the
  existing semantic template, creates a unique Runtime ID, binds the current
  Player as target, and uses the existing safe-position helper.
- `packages/runtime/src/composition/RuntimeEntityComposition.ts` implements
  `findSafeRuntimeEntityPosition` as deterministic category-based placement;
  it does not enforce a Player-relative minimum distance/non-overlap boundary.
- `packages/runtime/src/systems/DefaultTargetDirectedMovementSystem.ts` starts
  normal target-directed pursuit at the existing finite speed as soon as the
  replacement has been composed.
- `packages/runtime/src/systems/EntityContactSystem.ts` emits de-duplicated
  contact-start facts; it does not own damage, replacement pacing, or a timer.
- `apps/web/src/components/studio/runtimeMotionProfile.ts` wires the generic
  Survival movement, target-directed movement, velocity, attack, and contact
  systems; no separate pacing authority exists.

The missing capability is therefore a bounded fair-start policy at the
existing generic `SPAWN_ENTITY` boundary. It is not a missing WaveManager,
timer, projectile, or genre-specific combat engine.

## Selected work order

Exactly one work order is READY:

`WO-S34-001 — Generic Runtime Replacement Fair-Start Policy`

The minimum reusable capability is deterministic player-relative replacement
placement that guarantees a non-overlapping fair start before ordinary pursuit,
using existing Runtime Position/collision facts. It must preserve Enemy
composition, target binding, contact semantics, attack range/damage, XP/Level,
Sprint 33 outcome feedback, Observatory truth, and Platformer behavior.

The future execution boundary explicitly excludes WaveManager, wave/timer
frameworks, cooldowns, projectiles, weapons, damage rebalance, progression
redesign, provider/image calls, new gameplay authority, a second WO, and Sprint
35.

## Discovery gates

| Gate | Result |
| --- | --- |
| Exact natural-language request exercised | PASS — `生成一个幸存者游戏` |
| Multiple normal-play cycles completed | PASS — two defeat/replacement cycles |
| A–E product questions evaluated | PASS |
| One blocker ranked by visibility, frequency, impact, and smallest generic boundary | PASS |
| Existing Runtime/Renderer/Observatory authority preserved | PASS |
| Sprint 33 outcome feedback regression | PASS by accepted Sprint 33 Product Verification |
| Product code or architecture modified during discovery | NO |
| Exactly one READY WO generated | PASS — `WO-S34-001` |
| Sprint 35 entered | NO |

## Stop condition

Sprint 34 Product Gap Discovery is complete at v1.183. Stop here. Do not
execute `WO-S34-001`, generate another work order, or enter Sprint 35 until a
new Human/CTO authorization is given.

