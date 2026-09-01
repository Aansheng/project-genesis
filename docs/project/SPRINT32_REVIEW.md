# Sprint 32 Freeze Review — Survival Playability Gap

Review date: 2026-09-01  
Architecture: v1.182  
Status: **FROZEN**  
Authority: Human/CTO freeze decision accepted on 2026-09-01

## Decision boundary

Sprint 32 proves the smallest generic slice needed to make Survival offense
intentional and reachable:

`top-down Space edge → Runtime attack request → deterministic target selection
→ trusted DAMAGE_ENTITY → Enemy defeat/progression/replacement`

`WO-S32-001 — Generic Player-Directed Short-Range Offense` is DONE with Code
Complete = YES and Product Verified = YES. The Human/CTO decision freezes
Sprint 32 at v1.182 and authorizes Sprint 33 for a fresh player-experience
discovery only. No Sprint 33 implementation is included in this review.

## Architecture and implementation result

- Architecture before → after: **v1.181 → v1.182**.
- The top-down composition reuses the existing `Space` input and registers the
  generic `PlayerAttackRequestSystem`.
- One accepted input edge selects one positive-Health Enemy within the finite
  48 Runtime-unit Euclidean range, preferring nearest distance and then stable
  entity ID.
- The system emits `ENTITY_ATTACK_REQUESTED` without mutating World state.
  The existing post-system Gameplay Rule phase commits trusted
  `DAMAGE_ENTITY`, defeat/removal, progression, and replacement behavior.
- Survival contact remains Enemy → Player danger; contact is no longer the
  Player's automatic offense path. Platformer retains `Space → Jump`.
- No new Runtime combat authority, provider call, projectile, timer, wave,
  cooldown, progression redesign, or visual system was added.

The implementation and verification touched the existing Shared, Runtime,
Web, Renderer-input, test, capability-matrix, and project/control-plane paths;
the freeze review itself adds this review artifact and updates the repository
projections. No product code is changed by the freeze decision.

## Automated evidence

The completed WO's automated production reachability covers:

- input vocabulary and one-edge request behavior;
- finite range, nearest target, stable-ID tie-breaking, and no-target no-op;
- trusted damage and separation of contact danger from Player offense;
- four attacks → Enemy removal → XP/Level → Runtime replacement;
- targeting a replacement Enemy through the same path;
- top-down control hint and Platformer `Space` jump non-regression;
- active-session and Observatory continuity;
- TypeScript, package ESLint, Web build, and `git diff --check`.

The previous v1.182 verification record reports the affected package suites
passing, with package lint at zero errors and only existing warnings where
applicable. Root Turbo wrappers remain subject to the host's TLS/keychain
limitation; direct affected-package checks are the accepted evidence.

## Real Studio Product Verification

A fresh local Studio session submitted the exact request
`生成一个幸存者游戏`. It produced deterministic-fallback Survival `world-1`
with six entities: Player, Resource, Tree, Stone, Enemy, and Campfire.

The real Game surface showed `Arrow Keys — 移动` and `Space — 攻击`. After the
Enemy reached the Player, contact reduced Player Health from `100` to `99`.
An explicit Space edge then reduced the Enemy from `100` to `75` without
requiring a new collision; subsequent accepted edges produced `50` and `25`,
and the fourth committed attack removed the Enemy. The Event Stream showed
the corresponding `ENTITY_ATTACK_REQUESTED`, committed
`survival-player-offense`, `DAMAGE_ENTITY`, `ENTITY_REMOVED`, level-up, and
`SPAWN_ENTITY` facts.

The replacement `enemy-runtime-17265` remained in the same `world-1` session
with the full Enemy composition and was targetable through the same attack
path. It appeared at the Player's current `(86,300)` position and restored
immediate contact pressure; this is a recorded Sprint 33 candidate, not a
Sprint 32 acceptance failure.

Full Observatory preserved `world-1`, active gameplay, current metadata
`v1.182 / Sprint 32`, and Runtime Stats `经验值: 1 / 等级: 2`. Returning to
Game preserved the session and replacement identity. No attack-time provider
or image-generation activity appeared, and browser error/warning diagnostics
were `[]`.

## Fresh Sprint 32 Gap Analysis

**Result: PASS.** Sprint 32's bounded acceptance is satisfied: explicit
offensive agency is discoverable, intentional damage crosses the Runtime
event/rule boundary, contact danger is separate, replacement remains
reachable, progression remains authoritative, Platformer is unchanged, and
Observatory truth is preserved.

The remaining observations are product candidates for Sprint 33 rather than
additional Sprint 32 work:

1. Game does not visibly acknowledge a hit, damage result, defeat, or
   replacement; the right Inspector or Observatory Event Stream is needed to
   confirm the outcome.
2. Level 1 → 2 is visible in Observatory but has no Game-surface consequence
   observed in this session.
3. One-for-one replacement appears at the Player position and resumes contact
   pressure immediately.

These candidates do not reopen Sprint 32. They are ranked by the Sprint 33
discovery artifact, with exactly one next WO generated.

## Freeze outcome

The Human/CTO decision accepts the following boundary:

- Sprint 32: **FROZEN = YES** at v1.182.
- `WO-S32-001`: **DONE**, Code Complete = YES, Product Verified = YES.
- Fresh Sprint 32 Gap Analysis: **PASS**.
- Sprint 33 — Survival Playability Gap Discovery: **AUTHORIZED**.
- Sprint 33 must begin with normal player-experience measurement; it may
  generate exactly one bounded `READY` WO but must not execute it in this
  continuation.
- Sprint 34 is not entered.

