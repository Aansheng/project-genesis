# Sprint 34 Product Gap Discovery — Survival Playability

**Discovery date:** 2026-09-01  
**Authority:** Human/CTO froze Sprint 33 at v1.183 and authorized Sprint 34
Product Gap Discovery  
**Status:** DONE — discovery selected exactly one WO; post-WO Gap Analysis
PASS; `SPRINT34_FREEZE_REVIEW` ready
**Architecture:** v1.183 at discovery; v1.184 after `WO-S34-001`

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

## Discovery stop condition (at the v1.183 discovery boundary)

Sprint 34 Product Gap Discovery is complete at v1.183. Stop here. Do not
execute `WO-S34-001`, generate another work order, or enter Sprint 35 until a
new Human/CTO authorization is given.

## Post-WO Sprint 34 Gap Analysis — 2026-09-01

Human/CTO subsequently authorized and the engineering execution of
`WO-S34-001 — Generic Runtime Replacement Fair-Start Policy` advanced the
product to v1.184. This fresh pass evaluates the post-WO product and does not
replace the original discovery record above.

| Question | Post-WO evidence | Result |
| --- | --- | --- |
| 1. Is the selected blocker reachable through the real product path? | Fresh Studio Survival generation reached active `world-1`, defeated the initial Enemy, and produced a new `enemy-runtime-*` entity through the existing replacement path. | PASS |
| 2. Does a replacement begin away from the current Player? | Inspector read the current Player at `(80,297)` and the replacement at `(134,297)` after the UI observation round trip; the Runtime policy starts from a configured 96-unit minimum before pursuit. | PASS |
| 3. Is Runtime collision geometry respected? | The replacement retained its Runtime `32×32` collision bounds and the observed post-spawn position was AABB non-overlapping with the Player. | PASS |
| 4. Is the protected entity resolved from current Runtime truth? | Automated production coverage moves the Player to `(400,240)` and validates the second replacement against that current Runtime Position and ID. | PASS |
| 5. Does normal pursuit continue after the fair start? | The replacement accepted the existing target-directed movement and subsequent Space hits; automated coverage confirms one pursuit tick reduces the separation. | PASS |
| 6. Does the replacement loop remain continuous and Runtime-only? | Two defeat/replacement cycles preserved the active session and six-entity Survival composition; no Semantic World rebuild or provider/image call was added. | PASS |
| 7. Are attack, damage, contact, XP, and Level semantics preserved? | Runtime/Web production tests retain range `48`, damage `25`, contact danger, defeat, and XP/Level behavior; fresh Studio replacement combat reached the second replacement. | PASS |
| 8. Is Sprint 33 outcome readability preserved? | Existing committed hit/defeat/replacement/no-target feedback remains covered by the accepted Sprint 33 evidence and current Web regression suite. | PASS |
| 9. Did the change introduce a new boundary or cross-genre regression? | Exact `创建 MarioWorld` retained seven Runtime entities, running Canvas, and `Space — 跳跃`; Renderer suite passed 510/510. | PASS |
| 10. Is there a new immediate P0 blocker requiring another WO? | No new immediate P0 blocker was found within this bounded slice. Level consequence remains secondary; timers, waves, projectiles, and scaling remain deferred. | PASS — no new WO |

### Post-WO verification summary

The real path remained:

`ENTITY_REMOVED → GameplayRuleExecutor → SPAWN_ENTITY → current Runtime Player
resolution → deterministic fair-start Position/AABB selection →
RuntimeEntityComposition → WorldMutator.addEntity → Runtime WorldStore →
Renderer`

The fair-start policy is spatial only: deterministic, bounded, and fail-closed
when the protected Runtime state or a fair candidate is unavailable. Runtime
has no explicit global world-bounds component, so the implementation does not
read Renderer/Pixi viewport dimensions or invent a new bounds authority.

Automated suites passed: Runtime 711/711, Renderer 510/510, and Web 3574/3574.
Runtime/Web TypeScript passed; ESLint had zero errors with existing Web
warnings only; the Web build passed. Browser error logs were empty.

**Fresh post-WO Gap Analysis:** PASS. The selected blocker is resolved within
the authorized slice. Select `SPRINT34_FREEZE_REVIEW` for Human/CTO review;
do not silently freeze Sprint 34, generate another WO, or enter Sprint 35.
