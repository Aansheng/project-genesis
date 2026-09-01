# Sprint 34 — Survival Playability Gap Discovery

**Authorization:** Human/CTO decision, 2026-09-01  
**Architecture at authorization:** v1.183  
**Current architecture:** v1.184
**Status:** ACTIVE — `WO-S34-001` DONE; `SPRINT34_FREEZE_REVIEW` READY for Human/CTO review; do not enter Sprint 35

## Product goal

Measure the generated Survival game as a normal player would experience it and
identify the single largest remaining blocker to a coherent, fair, readable
short session. Sprint 34 does not preselect a weapon, projectile, wave,
progression, or combat feature.

The discovery was completed from the exact request `生成一个幸存者游戏`.
It covered movement and attempted evasion, Enemy pursuit, explicit Space
attacks, hits, defeat, XP/Level, Runtime replacement, replacement combat, and
continued play through multiple cycles.

## Frozen baseline to preserve

- Sprint 33 is FROZEN at v1.183.
- Runtime remains the sole gameplay authority.
- The committed Runtime outcome projection remains visible on the normal Game
  surface: hit, defeat, replacement, and no-target behavior are already
  Product Verified.
- The generic top-down attack remains a one-edge, nearest valid Enemy within
  range `48` action with `25` damage per committed hit.
- Enemy defeat, XP/Level, Runtime-only replacement, active-session continuity,
  Observatory truth, and Platformer `Space — 跳跃` remain unchanged.

## Discovery result

The single selected blocker is:

> **RUNTIME REPLACEMENT PRESSURE LACKS FAIR PACING**

Fresh play completed two defeat/replacement cycles. XP advanced `0 → 1 → 2`,
Level advanced `1 → 2` once and remained at Level 2. Each replacement resumed
target pursuit quickly and was observed co-located with the Player after brief
movement. The existing replacement start policy does not guarantee a
player-relative minimum distance or non-overlap window.

The secondary progression observation is:

> **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**

It is recorded for later prioritization only. This Sprint 34 boundary does not
authorize a skill tree, upgrade system, or progression redesign.

## Exactly one READY work order generated at the discovery boundary

### WO-S34-001 — Generic Runtime Replacement Fair-Start Policy

**Status:** DONE — Code Complete = YES; Product Verified = YES
**Architecture before:** v1.183  
**Architecture after:** v1.184

#### Root cause

The existing committed path is:

`ENTITY_REMOVED (health <= 0) → GameplayRuleExecutor SPAWN_ENTITY → semantic
Enemy composition → findSafeRuntimeEntityPosition → target-directed movement →
ENTITY_CONTACT_STARTED`

`findSafeRuntimeEntityPosition` is deterministic and category-based, but it
does not enforce a minimum-distance/non-overlap relationship to the current
Player. The composed Enemy then resumes existing target-directed pursuit. The
missing capability is a bounded, reusable spawn-start fairness policy, not a
wave framework or a second Survival authority.

#### Smallest reusable capability

Extend the existing generic Runtime replacement spawn path with a deterministic
player-relative fair-start placement policy. A lethal replacement must begin
outside the configured Player overlap/fair-start boundary using existing
Runtime Position and collision geometry, then continue through the current
Enemy composition, target binding, movement, contact, defeat, progression, and
feedback paths.

#### Acceptance boundary for a separately authorized execution

1. In a real generated Survival session, every lethal replacement starts
   non-overlapping with the active Player and provides a bounded readable
   approach window under the existing movement and pursuit speeds.
2. Replacement remains Runtime-only, deterministic, target-bound, and
   compositionally identical; active `world-1`, entity continuity, XP/Level,
   defeat, and outcome feedback remain truthful.
3. Existing attack range `48`, damage `25`, contact-start semantics, accepted
   Sprint 33 feedback, Observatory projection, and Platformer `Space` jump are
   unchanged.
4. Focused Runtime/Web tests plus real multi-cycle Studio Product Verification
   prove the policy and preserve browser diagnostics.

#### Explicit non-goals

- no WaveManager, wave scheduler, timer, cooldown, or periodic-spawn system;
- no projectile, weapon, auto-fire, combat manager, damage rebalance, or
  Survival-specific Runtime system;
- no skill tree, upgrade state, later-level consequence, or progression
  redesign;
- no new gameplay authority, provider/image call, broad pacing framework,
  HUD redesign, or unrelated cleanup;
- no second work order and no Sprint 35 entry.

#### Implementation and verification result

`findRuntimeEntityPositionWithMinimumSeparation` now resolves protected
Runtime entity IDs, applies the default 96-unit minimum center distance,
rejects occupied/non-finite/overlapping Runtime AABB candidates, and searches
deterministically within a bounded candidate set. Survival Enemy replacement
`SPAWN_ENTITY` uses the current Runtime Player; missing protected state or no
fair candidate fails closed. Initial enemies, non-Survival creation,
target-directed pursuit, contact, attack/damage, progression, feedback, and
Platformer remain unchanged.

Runtime 711/711, Renderer 510/510, and Web 3574/3574 passed. Runtime/Web
TypeScript, ESLint (zero errors; existing Web warnings only), and Web build
passed. Real Studio verified two Survival defeat/replacement cycles, a
non-overlapping replacement approach window, continued replacement combat,
and Platformer `创建 MarioWorld` with seven entities and `Space — 跳跃`.
Browser error logs were empty. Fresh Sprint 34 post-WO Gap Analysis is PASS.

## Stop condition

`WO-S34-001` is complete at v1.184. The fresh post-WO Gap Analysis is PASS and
the selected next control-plane item is `SPRINT34_FREEZE_REVIEW`, pending
Human/CTO review. Do not silently freeze Sprint 34, generate another WO, or
enter Sprint 35.
