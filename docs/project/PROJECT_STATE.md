# Project State

> Single source of truth for Project Genesis.
> Intended for both humans and AI assistants.

---

## Current Sprint

**Sprint 6** — Observatory UI (Complete)
**Sprint 7** — DSL Preparation (Complete)
**Sprint 8** — Game DSL (Complete)
**Sprint 9** — Renderer Foundation (Complete)
**Sprint 10** — AI Generation Pipeline (Complete)
**Sprint 11** - Genesis Studio Experience (Baseline Frozen)
**Sprint 12** - AI World Generation (**Frozen**; runtime activation fixed and product verification complete)
**Sprint 13** - Visual & Asset Generation (frozen; WO-S13-013 and post-freeze correctness complete)
**Sprint 14** - World Evolution Foundation (**Frozen**; multi-turn product verification complete)
**Sprint 15** - Capability-Specific Generation Context & Runtime Gameplay Rules (**FROZEN**; Freeze Review passed on 2026-08-24)
**Sprint 16** - Gameplay Evolution & Progression Foundation (**FROZEN — Code Complete = YES; Product Verified = YES; v1.157**)
**Sprint 17** - Mechanically Complete Platformer Generation (**FROZEN — Code Complete = YES; Product Verified = YES; v1.160**)
**Sprint 18** - Visually Coherent Platformer Generation (**FROZEN — Code Complete = YES; Product Verified = YES; v1.164**)
**Sprint 19** - Animated Entity Presentation (**FROZEN — Code Complete = YES; Product Verified = YES; v1.167**)
**Sprint 20** - Playable Platform Geometry (**FROZEN — Code Complete = YES; Product Verified = YES; v1.170**)
**Sprint 21** - Free-form Conversational World Evolution (**FROZEN — Code Complete = YES; Product Verified = YES; v1.171**)
**Sprint 22** - Studio Session Continuity (**FROZEN — Code Complete = YES; Product Verified = YES; v1.171**)
**Sprint 23** - Generation Transparency & Recovery (**FROZEN — Code Complete = YES; Product Verified = YES; v1.172**)
**Sprint 24** - Game Lifecycle Presentation (**WO-S24-001 Code Complete = YES; Product Verified = YES; v1.173**)
**Sprint 25** — Production Reachability & Legacy Disposition Review (**FROZEN — WO-S25-001 audit complete; v1.173**)
**Sprint 26** — Second-Genre Generalization Proof (**bounded proof complete; v1.176**)
**Sprint 27** — Survival Top-Down Spatial Composition (**FROZEN — WO-S27-001 Code Complete = YES; Product Verified = YES; v1.177**)
**Sprint 28** — Survival Gameplay Pressure (**FROZEN — Code Complete = YES; Product Verified = YES; v1.178**)
**Sprint 29** — Generic Offensive Interaction (**FROZEN — WO-S29-001 Code Complete = YES; Product Verified = YES; v1.179**)
**Sprint 30** — Sustained Survival Loop (**FROZEN — WO-S30-001 Code Complete = YES; Product Verified = YES; v1.180**)
**Sprint 31** — Observatory Truth Consistency (**FROZEN — WO-S31-001 and WO-S31-002 Code Complete = YES; Product Verified = YES; v1.181; Human/CTO accepted 2026-08-31**)
**Sprint 32** — Survival Playability Gap (**FROZEN — `WO-S32-001` Code Complete = YES; Product Verified = YES; v1.182; Human/CTO accepted 2026-09-01**)
**Sprint 33** — Survival Playability Gap (**FROZEN — `WO-S33-001` Code Complete = YES; Product Verified = YES; v1.183; Human/CTO accepted 2026-09-01**)
**Sprint 34** — Survival Playability Gap (**FROZEN — `WO-S34-001` Code Complete = YES; Product Verified = YES; v1.184; Human/CTO accepted 2026-09-01**)
**Sprint 35** — Progression Meaning (**FROZEN — `WO-S35-001` Code Complete = YES; Product Verified = YES; v1.185; Human/CTO accepted 2026-09-01**)
**Sprint 36** — Active-World New-World Intent Correctness (**ACTIVE — `WO-S36-001` Code Complete = YES; Product Verified = YES; v1.186; `SPRINT36_FREEZE_REVIEW` READY**)
**Current WO** - `SPRINT36_FREEZE_REVIEW` — READY for Human/CTO freeze review after completed `WO-S36-001`; Sprint 37 not entered

---

## Current Status

| Item | Status |
| ----------------------- | --- |
| Status | Sprint 30 is FROZEN at v1.180, Sprint 31 is FROZEN at v1.181, Sprint 32 is FROZEN at v1.182, Sprint 33 is FROZEN at v1.183, Sprint 34 is FROZEN at v1.184, and Sprint 35 is FROZEN at v1.185 by Human/CTO decisions. Sprint 36 `WO-S36-001` is complete and the fresh post-WO Gap Analysis is PASS; `SPRINT36_FREEZE_REVIEW` is READY and Sprint 37 is not entered. |
| Architecture Version | v1.186; the active-world Intent boundary now classifies generic whole-world creation before the existing active-world Evolution fallback. Runtime remains authoritative for gameplay. Survival offense selects 25 damage below Level 2 and 50 damage at Level 2 or above through mutually exclusive generic Gameplay Rule conditions. |
| Last Completed WO | WO-S36-001 — Generic Active-World New-World Intent Classification; Code Complete = YES; Product Verified = YES; v1.186. |
| Current User-Visible Behavior | Top-down Survival exposes `Arrow Keys — 移动` and `Space — 攻击`. One Space edge selects one nearby valid Enemy within range 48. At Level 1 the committed hit changes Enemy Health `100 → 75` and presents `-25`; after the existing defeat/XP chain commits Level 2, the same attack path changes a fresh Enemy `100 → 50` and presents `-50`, with the second hit defeating it. Lethal removal and fair-start replacement cues remain active, contact danger remains separate, and Observatory projects current world/XP/Level/events/`v1.186 / Sprint 36` truth. With an active world, clear named/whole-world creation such as `创建 MarioWorld`, `创建一个 RPG`, `生成一个幸存者游戏`, and `做一个农场游戏` reaches CreateWorld and replaces the current world; entity-scoped mutations remain same-world Evolution; Platformer remains unchanged with `Space — 跳跃`. |
| Current End-to-End Pipeline | Genesis Studio → StudioCommandBar → Pinia `gameStore` semantic authority + app-session Runtime progression store → IntentRouter → current-world mutation precedence or generic whole-world CreateWorld classification → Semantic World → Game DSL → Runtime projection / generic composition → top-down `Space` edge → `PlayerAttackRequestSystem` current Position/Health target selection → `ENTITY_ATTACK_REQUESTED` → post-system GameplayRuleExecutor → current progression snapshot evaluates mutually exclusive `level < 2` / `level >= 2` offense Rules → trusted `DAMAGE_ENTITY` / defeat / progression → `ENTITY_REMOVED` → `SPAWN_ENTITY` → current Runtime Player resolution → deterministic fair-start Position/AABB selection → `RuntimeEntityComposition` → `WorldMutator.addEntity` → Runtime WorldStore → `ExecutionTickResult.gameplayRuleResults` → `projectRuntimeGameplayOutcomeFeedback` → Runtime visualization loop → Pixi feedback layer, alongside binding-only entity rendering and current Observatory data projection. AI/provider calls remain generation-time only. |
| Current Blocking Issue | No immediate P0 blocker remains after `WO-S36-001`; the current gate is Human/CTO `SPRINT36_FREEZE_REVIEW`. Broader natural-language ambiguity and deterministic target-vocabulary coverage remain bounded follow-up discovery topics. |
| Product Verification | Sprint 30: PASS/FROZEN. WO-S31-001: PASS. WO-S31-002: PASS. WO-S32-001: PASS/FROZEN. WO-S33-001: PASS/FROZEN. WO-S34-001: PASS/FROZEN. WO-S35-001: PASS/FROZEN. WO-S36-001: PASS — AI 9439/9439, Web 3581/3581, focused routing/integration tests, TypeScript, ESLint, Web build, real Studio active-world replacement and same-world Evolution verification, current Observatory v1.186/Sprint 36 truth, and empty browser diagnostics. |
| Next Recommended Verification | Human/CTO `SPRINT36_FREEZE_REVIEW`; decide whether to freeze Sprint 36 at v1.186. Do not enter Sprint 37 automatically. |

## Sprint 36 Active-World New-World Intent Correctness Discovery

Human/CTO froze Sprint 35 at v1.185 and authorized Sprint 36 discovery on
2026-09-01. The discovery followed the real Studio front door and source call
chain rather than modifying the routing implementation.

The selected blocker is **ACTIVE-WORLD NAMED/WHOLE-WORLD CREATION IS ROUTED AS
EVOLUTION**. The current router distinguishes explicit new/reset markers from
current-world entity/property mutation, but it has no positive active-world
branch for a named or whole-world archetype creation request. As a result,
`创建 MarioWorld`, `创建一个 RPG`, and `生成一个幸存者游戏` become active-world
`unknown` and are handed to World Evolution. The evolution prompt is expressly
mutation-only; in the observed local Studio session structured generation
failed and the deterministic evolution fallback did not support whole-world
replacement. The active world ID and entity set remained unchanged.

The same session verified the preserved boundaries: `再加五只怪` and
`再创建5个怪物` applied through World Evolution in the same world, while
`创建一个新的游戏` reached CreateWorld and replaced the active world. The
issue is a generic Intent/front-door classification gap, not a Mario, Survival,
RPG, Farm, Runtime, Renderer, or provider-authority feature.

Discovery generated exactly one product work order,
`WO-S36-001 — Generic Active-World New-World Intent Classification`, as
`READY`; it is not executed. Architecture remains v1.185. Full evidence is in
[`SPRINT36_PRODUCT_GAP_DISCOVERY.md`](SPRINT36_PRODUCT_GAP_DISCOVERY.md), with
the one-item execution backlog in [`SPRINT36_BACKLOG.md`](SPRINT36_BACKLOG.md).

The repository stops at `SPRINT36_FREEZE_REVIEW` for Human/CTO review. Sprint
37 is not entered.

## Sprint 36 WO-S36-001 Execution, Product Verification, and Fresh Gap Analysis

Human/CTO subsequently authorized `WO-S36-001 — Generic Active-World New-World
Intent Classification`. The implementation advances the architecture from
v1.185 to v1.186 at the existing IntentRouter/Web front-door boundary. It adds
generic whole-world/game construction and named-world signal classification
after current-world mutation precedence and before the active-world unknown
fallback. It reuses the existing CreateWorld replacement contract; no Runtime,
Renderer, Semantic World, provider-authority, second-router, or session
architecture was added.

The resulting route boundary is:

```text
current-world entity/property/continuation mutation → World Evolution
clear whole-world/game creation or explicit new/reset → CreateWorld
bare/underspecified active creation → existing active-world unknown fallback
```

Unit coverage verifies named/archetype and generic whole-world requests in
active and inactive contexts, while preserving entity quantity precedence and
ambiguous non-replacement. Web production integration verifies that active
Survival `world-1` evolves to 11 entities in the same world for
`再创建5个怪物`, `创建 MarioWorld` replaces it with `world-2` and seven
Platformer entities, and `生成一个幸存者游戏` replaces it with `world-3` and
six Survival entities. Real Studio verification additionally exercised
`创建一个 RPG` (`world-4`), `做一个农场游戏` (`world-5`),
`创建一个新的游戏` (`world-6`), `再加五只怪`, and a final Mario/Survival
cross-genre switch (`world-7` → `world-8`). The final Studio view showed
`Space — 攻击`; Full Observatory showed the current Survival world, 6
entities, `v1.186 / Sprint 36`, current gameplay rules, and asset fallback
state with no browser error or warning diagnostics.

All automated and quality gates passed: AI 9439/9439, Web 3581/3581,
focused router/integration/regression tests, AI/Web TypeScript, AI/Web ESLint
with zero errors, Web build, and `git diff --check`. Fresh Sprint 36 Gap
Analysis is **PASS** with no immediate P0 product blocker. The repository is
ready for `SPRINT36_FREEZE_REVIEW`; Sprint 36 is not yet marked FROZEN and
Sprint 37 is not entered.

## Sprint 35 Progression Meaning Discovery

Human/CTO froze Sprint 34 at v1.184 and authorized Sprint 35 discovery on
2026-09-01. The source audit and real Survival evidence showed that Runtime
progression was authoritative and truthful, but a committed Level change
initially emitted only `NUMERIC_STATE_UPDATED`; it did not change a gameplay
capability.

The measured blocker is **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**. The
smallest meaningful candidate is a generic, progression-conditioned Gameplay
RuleSet composition over existing `NUMBER_COMPARE(gameState.level)` and
`DAMAGE_ENTITY` primitives: Level 1 keeps damage `25`, while Level 2 selects
damage `50`, making the existing Enemy defeat loop require fewer attacks. The
candidate ranking and exact audit are recorded in
[`SPRINT35_PRODUCT_GAP_DISCOVERY.md`](SPRINT35_PRODUCT_GAP_DISCOVERY.md).

Discovery is DONE and generated exactly one work order,
`WO-S35-001 — Generic Progression-Conditioned Gameplay Capability`. Human/CTO
subsequently authorized its execution. The bounded RuleSet composition is
complete at v1.185. At that historical Sprint 35 boundary the app metadata
projected `v1.185 / Sprint 35`; Runtime gameplay behavior now selects 25 damage
below Level 2 and 50 damage at Level 2 or above without changing target
selection or introducing a stat framework. Human/CTO subsequently froze Sprint
35 and authorized Sprint 36 discovery.

## Sprint 35 WO-S35-001 Execution and Product Verification

`WO-S35-001` is DONE with Code Complete = YES and Product Verified = YES.
Architecture advances from v1.184 to v1.185. The existing deterministic
Survival RuleSet composes mutually exclusive `NUMBER_COMPARE(gameState.level)`
conditions with the existing `DAMAGE_ENTITY` action:

- `level < 2` → damage `25`;
- `level >= 2` → damage `50`.

The executor reads the current committed progression snapshot while evaluating
the attack event. The existing input/target-selection, range 48, Health 100,
contact danger, defeat/XP/Level chain, fair-start replacement, committed
feedback, Observatory, and Platformer jump behavior remain unchanged. The
production regression proves exactly one offense rule at Level 1, Level 2,
and Level > 2, and no duplicate damage on the lethal Level 1 event.

Real Studio Product Verification used `生成一个幸存者游戏`: Level 1 changed
Enemy Health `100 → 75` with `-25`; the same active world/session reached
committed `XP 1 / Level 2`; the next valid Enemy changed `100 → 50` with `-50`,
and the second Level 2 hit defeated it through the existing replacement path.
Observatory world/XP/Level/event/metadata truth remained current, Platformer
`Space → Jump` remained intact, and browser diagnostics were empty. The fresh
Sprint 35 Gap Analysis is PASS with no immediate P0 blocker.

The repository is stopped at `SPRINT35_FREEZE_REVIEW` for Human/CTO decision;
it does not enter Sprint 36 automatically.

## Sprint 34 Product Gap Discovery — Survival Playability

Human/CTO froze Sprint 33 at v1.183 and authorized Sprint 34 Product Gap
Discovery on 2026-09-01. This discovery started from real product play of the
exact request `生成一个幸存者游戏`, not from a preselected Survivor feature.
No product code, architecture, or new capability was executed in this step.

Two complete combat cycles were observed in the active `world-1` session:
move/attempt evasion → Space attacks → Enemy defeat → XP/Level projection →
Runtime-only replacement → continued combat. The first Enemy and subsequent
replacement pressure repeatedly re-established contact after short movement;
the loop remained technically playable, but the start of each pressure cycle
was not predictably fair.

| Area | Measured result | Finding |
| --- | --- | --- |
| A. Progression meaning | Enemy defeats produced XP `0 → 1 → 2`; Level changed `1 → 2` once and stayed at Level 2 after the second defeat. No Level-dependent action or risk/reward change was visible. | Secondary: **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**. Do not turn this discovery into a skill-tree proposal. |
| B. Replacement pacing/fairness | Each defeat preserved six Runtime entities and spawned a new Enemy. The replacement resumed target pursuit quickly and, after brief movement, was observed co-located with the Player; the spawn path has no player-relative minimum-distance/fair-start guarantee. | **Selected blocker.** |
| C. Combat feel | Range `48`, nearest-target selection, stable targeting, and four `25`-damage hits were predictable. No projectile is required for the smallest next capability; repetition is secondary to the replacement pressure start. | Secondary combat observation; no projectile WO. |
| D. Outcome readability | Accepted Sprint 33 Product Verification remains PASS: committed hit, defeat, replacement, post-replacement hit, and no-target feedback are visible and Runtime-authoritative. | Solved; preserve. |
| E. Survival fairness | Player movement exists and is faster than the Enemy, while contact damage is edge-triggered rather than continuous. The brief manual separation did not create a stable readable window before pursuit re-established contact. | Fairness/pacing impact reinforces B; no failure/death blocker was selected. |

### Candidate ranking and selected blocker

1. **RUNTIME REPLACEMENT PRESSURE LACKS FAIR PACING** — highest normal-Game
   visibility, repeats after every defeat, directly affects agency and the
   rhythm of every short session, and has a small generic fix boundary.
2. **LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE** — real and important, but
   visible mainly through Observatory and changes only after the first
   threshold; no progression implementation is authorized by this discovery.
3. Combat repetition / projectile absence — the existing 48-unit attack is
   understandable and deterministic; projectiles are not the smallest generic
   response.

### Source audit and root cause

The existing Runtime path is already generic and authoritative:

`ENTITY_REMOVED (health <= 0) → GameplayRuleExecutor SPAWN_ENTITY → semantic
Enemy composition → findSafeRuntimeEntityPosition → target-directed movement →
ENTITY_CONTACT_STARTED`

`findSafeRuntimeEntityPosition` chooses a deterministic category-based position,
not a minimum-distance or non-overlap position relative to the current Player.
The composed Enemy then receives target-directed movement at the existing
finite speed and can re-establish contact immediately after a short approach.
The problem is therefore a missing bounded spawn-start fairness policy on an
existing generic `SPAWN_ENTITY` path, not a missing wave framework, timer, or
new Survival combat authority.

### Exactly one READY work order

`WO-S34-001 — Generic Runtime Replacement Fair-Start Policy`

The smallest reusable capability is a deterministic Runtime replacement
spawn-start policy that guarantees a non-overlapping, player-relative minimum
separation (or equivalent bounded fair-start placement) before normal
target-directed pursuit. It must preserve existing entity composition, target
selection, contact semantics, Runtime authority, and replacement continuity.
This is a placement/start-policy slice; it does not introduce a WaveManager,
timer, cooldown, wave scheduler, or genre-specific system.

At the discovery boundary, the WO was **READY only**. That discovery pass
modified no product code, generated no second WO, and did not enter Sprint 35;
the separately authorized execution and post-WO verification are recorded
below.

## Sprint 34 WO-S34-001 Implementation, Product Verification, and Fresh Gap Analysis

Human/CTO authorized execution of `WO-S34-001 — Generic Runtime Replacement
Fair-Start Policy` on 2026-09-01. The bounded implementation advances the
product architecture from v1.183 to v1.184. It adds one reusable Runtime
composition helper for protected Runtime entity IDs, using current Runtime
Position and optional collision AABBs; no Renderer viewport dimensions or
temporal pacing are introduced.

The real replacement path is now:

`ENTITY_REMOVED → GameplayRuleExecutor → SPAWN_ENTITY → current Runtime Player
resolution → deterministic fair-start Position/AABB selection →
RuntimeEntityComposition → WorldMutator.addEntity → Runtime WorldStore →
Renderer`

The default minimum center distance is `96`, twice the existing Survival
attack range of `48`. The helper tries stable cardinal positions relative to
the protected entity/entities, then the existing deterministic category
sequence, with a 100-candidate bound. Occupied Positions, non-finite values,
insufficient separation, and Runtime AABB overlap are rejected. Missing
protected identity/Position or exhausted candidates fail closed, so the
replacement action does not silently spawn on the Player. Only Survival Enemy
replacements use the policy; initial enemies, non-Survival creation,
target-directed pursuit, contact, attack/damage, XP/Level, outcome feedback,
and Platformer behavior remain unchanged.

Automated production-path coverage includes two replacement cycles, a moved
current Player, current-ID resolution, `96`-unit separation, Runtime AABB
non-overlap, bounded fair-candidate skipping, fail-closed missing protected
state, and pursuit continuing after spawn. Full suites passed: Runtime
711/711, Renderer 510/510, and Web 3574/3574. Runtime/Web TypeScript checks
passed; ESLint reported zero errors with existing Web warnings only; the Web
production build passed.

Fresh real Studio Product Verification used a fresh `生成一个幸存者游戏`
session. The active `world-1` preserved six entities; a replacement was read
at `(134,297)` while the current Player was `(80,297)` after the Inspector
observation round trip, retaining AABB non-overlap and an approach window.
The replacement accepted subsequent Space hits and triggered a second
`enemy-runtime-*` replacement. The exact `创建 MarioWorld` smoke retained
seven Runtime entities, a running Canvas, and `Space — 跳跃`; browser error
logs were empty. Previously accepted Sprint 33 hit/defeat/replacement/no-target
feedback remains intact.

The fresh Sprint 34 post-WO Gap Analysis is **PASS**. The selected blocker,
**RUNTIME REPLACEMENT PRESSURE LACKS FAIR PACING**, was resolved within the
authorized spatial slice. Human/CTO subsequently froze Sprint 34 at v1.184;
Sprint 35 discovery is recorded above and does not alter this accepted
implementation result.

## Sprint 33 WO-S33-001 Implementation and Product Verification

Human/CTO authorized execution of `WO-S33-001 — Generic Runtime Gameplay
Outcome Feedback` on 2026-09-01. The implementation advances the product
architecture from v1.182 to v1.183 without changing the v1.182 Runtime
gameplay semantics:

`committed Runtime GameplayRule result → pure outcome projector → existing
Runtime visualization loop → dedicated Pixi feedback layer`

Committed `HEALTH_UPDATED` results produce an ID-bound hit cue with optional
authoritative damage, lethal `ENTITY_REMOVED` results produce a defeat cue at
the last authoritative pre-removal Position, and committed `ENTITY_ADDED`
results produce a replacement cue. Failed/uncommitted results, attack-request
facts without a committed mutation, ordinary removals, and contact-only
damage produce no Player-attack cue. The presentation lifetime uses only the
renderer clock; it does not add a Runtime timer or gameplay state authority.
The Web viewport clears feedback when the Runtime world identity changes.

The focused projector, Renderer presentation, and production Web reachability
tests prove no World mutation or second gameplay authority is introduced. The
final package suites pass: Runtime 708/708, Renderer 510/510, and Web
3573/3573. Runtime/Renderer/Web TypeScript checks pass; package ESLint passes
with existing warnings only and zero errors; the Web production build and
`git diff --check` pass.

Fresh real Studio verification passed the visible hit (`-25`/ring), defeat
(amber ring/X), replacement, and post-replacement hit flow for the exact
`生成一个幸存者游戏` request. Full Observatory retained `world-1`, the live
event stream, `v1.183 / Sprint 33`, and progression truth. The out-of-range
no-target behavior is production-path verified at distance 49 with no cue;
the pursuing Enemy made a sustained manual separation window unstable, which
is recorded as an observation rather than claimed as a separate visual pass.
Platformer `创建 MarioWorld` retained its seven-entity composition and
`Space — 跳跃`; browser error/warning diagnostics were empty.

The fresh post-WO gap analysis is **PASS**: the selected original blocker is
resolved and the product-success question is YES. Progression meaning,
replacement pacing, and evasion readability remain secondary candidates.
Human/CTO subsequently froze Sprint 33 at v1.183; the current Sprint 34
discovery and its single READY WO are recorded above.

## Sprint 31 Observatory Truth Consistency Snapshot

Human/CTO froze Sprint 30 at v1.180 and explicitly authorized Sprint 31 on
2026-08-31. The initial Sprint 31 Gap Analysis found two independent defects:

1. Runtime progression was authoritative, but `GameViewportPanel` created a
   fresh default progression store on every route mount. That store reset the
   Observatory projection to `0 / 1` after Game → Observatory → Game, even
   though the Runtime WorldStore and entity history continued.
2. The current Observatory metadata path is centralized in
   `apps/web/src/projectMetadata.ts`, but its values are stale at
   `v1.177 / Sprint 27`. Current header, overview, and Observatory UI store
   consumers read this source; the Sprint 25 legacy metadata bridge remains
   FROZEN_LEGACY and is not reconnected.

The highest-priority bounded slice was progression continuity. WO-S31-001 now
reuses the existing `DefaultRuntimeGameplayProgressionStateStore` at the
existing Web app-session composition boundary and passes it into each newly
mounted `DefaultRuntimeExecutionLoop`. Runtime remains the only progression
authority; Observatory continues to receive a projection only. No persistence,
route-state framework, duplicate XP state, manager, or legacy path was added.

Real Studio Product Verification passed: exact Survival generation produced
`world-1`; after the first Enemy defeat Full Observatory showed active gameplay
and `1 / 2`; after returning to Game, continuing the same world, and defeating
the replacement Enemy, Full Observatory showed active gameplay and `2 / 2`.
The browser error/warning query returned `[]`.

WO-S31-002 corrected the current centralized application metadata source to
`v1.181 / Sprint 31` without reconnecting the FROZEN_LEGACY bridge. Production
route tests and the real Studio path prove the source reaches the Full
Observatory header and Overview. A fresh real session retained `world-1`,
active `经验值: 2 / 等级: 2`, current metadata across repeated navigation, and
an empty browser error/warning query.

Fresh Sprint 31 Gap Analysis: **PASS**. Runtime progression and current
architecture/Sprint metadata both project truthfully through Full Observatory.
Human/CTO accepted the Sprint 31 freeze at v1.181 on 2026-08-31. Sprint 32
Product Gap Discovery was then authorized; no implementation was entered by
this freeze decision alone.

## Sprint 32 Implementation and Product Verification

`WO-S32-001 — Generic Player-Directed Short-Range Offense` is complete at
v1.182. The top-down composition registers the generic Runtime
`PlayerAttackRequestSystem` on the existing `Space` input. On one input edge it
reads current Runtime Position/Health, selects one positive-Health Enemy within
the finite 48-unit Euclidean range by nearest distance and stable ID tie-break,
and emits `ENTITY_ATTACK_REQUESTED`. The existing Gameplay Rule path commits
the trusted `DAMAGE_ENTITY` action. Survival contact remains Enemy→Player
danger only; Platformer `Space` jump is unchanged.

Automated production reachability covers non-contact damage, out-of-range
no-op, contact danger separation, four-hit defeat with XP/Level and replacement,
replacement targeting, and deterministic one-target selection. Real Studio
verification confirmed the visible `Space — 攻击` affordance, non-contact attack
outcome, no-target no-op, contact danger, active-session/Observatory continuity,
current `v1.182 / Sprint 32` metadata, no attack-time provider/image calls, and
empty browser error/warning diagnostics. The fresh Sprint 32 Gap Analysis is
**PASS**. Sprint 32 is now FROZEN; Sprint 33 discovery generated
`WO-S33-001` as the sole READY item and did not execute it.

## Sprint 32 Freeze and Sprint 33 Product Gap Discovery

Human/CTO froze Sprint 32 at v1.182 on 2026-09-01. `WO-S32-001` remains DONE
with Code Complete = YES and Product Verified = YES, and the fresh Sprint 32
Gap Analysis is PASS. The freeze preserves the generic top-down Space attack,
Runtime-authoritative damage/defeat/progression/replacement path, separate
contact danger, Platformer Space jump, and Observatory truth. Cooldowns,
weapons, projectiles, waves, timers, attack VFX, progression redesign, and
another Sprint 32 WO remain outside the frozen boundary.

Sprint 33 Product Gap Discovery used a fresh real Studio session with
`生成一个幸存者游戏`, active deterministic-fallback `world-1`, and six
entities. Normal play covered movement, an attempted evasion under pursuit,
Space attacks, and a four-hit defeat; the
Game canvas showed no hit, damage, defeat, or replacement cue; the
Inspector/Event Stream were needed to understand those outcomes. Full
Observatory showed `经验值: 1 / 等级: 2`, while the Game surface showed no
progression consequence. A replacement appeared at the Player's current
position and resumed immediate pressure.

The selected Sprint 33 blocker is **PRODUCT_GAP — generic gameplay outcome
feedback/combat readability**. It occurs on every attack and is therefore a
larger normal-play barrier than progression meaning or replacement pacing.
Exactly one next work order was generated:
`WO-S33-001 — Generic Runtime Gameplay Outcome Feedback`, READY and not
executed. Sprint 34 is not entered.

## Sprint 32 Survival Playability Gap Snapshot (historical discovery)

Human/CTO authorized Sprint 32 Product Gap Discovery after freezing Sprint 31
at v1.181. A fresh real Studio play session used `生成一个幸存者游戏` and
observed active deterministic-fallback `world-1` with six entities.

The first largest user-visible blocker is the current contact-only Survival
offense. The only visible Game control is `Arrow Keys — Move`; before any
explicit attack action, Player/Enemy contact changed Enemy Health `100 → 75`
and Player Health `100 → 99` at the same position. Directional movement and
target-directed pursuit kept the pair co-located in the observed session. A
replacement Enemy preserved Runtime composition and active-session continuity,
but resumed pressure at the Player's position. Observatory later showed
`经验值: 1 / 等级: 2` and `经验值: 2 / 等级: 2`, while the Game surface showed
no attack or progression affordance.

The source audit confirmed that Position, Health, target-directed movement,
Runtime ticks, existing `DAMAGE_ENTITY`, and the generic Rule path are already
available. There is no nearest/range selector or attack input fact; no projectile
or timer is required for the smallest measured fix.

Exactly one primary WO was generated: `WO-S32-001 — Generic Player-Directed
Short-Range Offense`, READY and not executed. It may reuse the existing `Space`
input in the top-down composition, choose a deterministic nearby target, and
reuse trusted Runtime damage. Weapon systems, projectiles, waves, timers,
scaling, upgrades, XP redesign, and separate pacing work are not authorized by
this discovery step.

## Sprint 30 Sustained Survival Loop Snapshot

The fresh source audit answered all ten CTO questions before implementation. The
shared `SPAWN_ENTITY` contract and `WorldMutator.addEntity()` existed, but the
trusted Gameplay Rule executor rejected spawn; committed `ENTITY_REMOVED` was
already the smallest usable trigger. Runtime ticks exist, while timer and
entity-count references do not. Existing semantic-to-Runtime evolution already
provided the Enemy composition, and Runtime removal proves that ephemeral
gameplay entities can remain outside the persistent Semantic World.

WO-S30-001 now promotes only the bounded generic creation slice: one defeated
Enemy with an authoritative `health <= 0` removal fact creates one deterministic
Runtime-only replacement from an existing semantic Enemy template. It reuses
the same composition helper, selects a safe deterministic position, targets
the current Player, and copies the resolved canonical Enemy visual through a
binding-only manifest projection. No timer, count, wave, scheduler, manager,
prefab, AI-per-spawn call, or Semantic World mutation was added.

Automated production reachability and the fresh provider-backed Studio scenario
prove defeat/removal, replacement component composition, replacement contact
pressure/offense, visual binding reuse, and active-session continuity. The
bounded WO was complete at v1.180; the Human/CTO subsequently froze Sprint 30
and authorized Sprint 31.

## Sprint 30 Product Verification and Gap Analysis

The exact request `生成一个幸存者游戏` produced `world-1` with five active
entities. Independent contact-starts drove the initial Enemy through
`75→50→25→0`; the Runtime Event Stream showed the committed
`ENTITY_REMOVED → SPAWN_ENTITY → ENTITY_ADDED` chain. Two replacements
(`enemy-runtime-58114`, then `enemy-runtime-79724`) appeared in the same
world/session, retained Position, Health, collision, target-directed pursuit,
and contact pressure/offense compatibility, and kept the entity count at five.
Direct Runtime observations reached XP/Level `1/2` and then `2/2`. Visual
operations stayed at nine and the Game canvas remained rendered without new
provider/image-generation activity; the final warning/error query was empty.

Fresh Gap Analysis = PASS. An exploratory Game → Observatory → Game traversal
revealed the existing page-remount progression projection reset to `0/1` until
the next gameplay event, while world/entity history remained. Full Observatory
header metadata was also stale at v1.177/Sprint 27, and the provider image
queue was only partially settled. The first two findings were non-blocking for
the frozen Sprint 30 gameplay thesis and became the measured input to Sprint
31; the image queue remains outside the bounded scope.

## Sprint 27 Spatial Composition Snapshot

Source-grounded Gap Analysis found that Survival already reached the generic
two-axis Runtime motion path, but visual design and asset requirements still
said side-view, Y motion was not available as Runtime velocity direction, and
resolved terrain was composed as a horizontal ground strip. The bounded fix is
`WorldSpatialMode` plus opt-in vector velocity, adapter direction, top-view
asset/Prompt Truth semantics, and a repeatable X/Y `arena-fill` surface.

Platformer remains the compatibility control: its system composition, Jump
control, side-view asset requirements, horizontal Ground tiling, and existing
presentation state path are unchanged. No enemy pursuit or gameplay-pressure
work was part of Sprint 27. Sprint 27 is now frozen at v1.177 under
`docs/project/SPRINT27_REVIEW.md`.

## Sprint 27 Gap Analysis Post Product Verification

The thesis passes: a user can immediately recognize generated Survival as a
top-down game through spatial composition, environment, terrain usage, and
directional Player presentation while existing Platformer behavior remains
correct. Real provider-backed Survival Prompt Truth and published → resolved →
Renderer applied evidence pass, and Human/CTO confirms the existing
Mario/Platformer product behaves correctly.

No additional measured Spatial & Visual Composition blocker exists. Human/CTO
accepted the freeze at v1.177 and separately authorized Sprint 28. Do not add
another visual-composition polish WO or treat the automated Space observation
as a Platformer defect.

## Sprint 28 Gameplay Pressure Snapshot

The first production-path Gap Analysis inspected the real chain from
`StudioCommandBar` through `gameStore`, CreateWorld, Semantic World, Game DSL,
Runtime projection and system registry, Runtime gameplay event/rule execution,
Renderer, and Observatory. It found that initial Survival enemies have
semantic, Position, Health, and collision-bounds components but no Velocity or
target-directed Runtime behavior. The current fixed-delta movement system and
Player-only position integrator cannot express pursuit.

The existing generic contact event, Survival contact damage rule,
`DAMAGE_ENTITY`, Health, failed state, and same-session Respawn are reusable;
same-world `再加五只怪` is also already verified for continuity and exact +5,
but added enemies do not yet inherit a complete pursuit composition. Therefore
the single smallest selected blocker is generic Runtime target-directed
movement, recorded as `WO-S28-001` in `SPRINT28_BACKLOG.md`. No second Sprint 28
WO is created.

## Sprint 28 Implementation and Product Verification Snapshot

WO-S28-001 is implemented at v1.178. The production path now carries
`TargetDirectedMovementComponent(targetEntityId, speed)` from Survival
semantic/DSL composition into Runtime; `DefaultTargetDirectedMovementSystem`
reads the current target Position and writes normalized Velocity, followed by
generic Velocity→Position integration. Same-world evolution injects the same
Health/collision/pursuit composition into added enemies. Platformer remains on
its pre-existing registry.

Human/CTO confirms automatic Enemy pursuit and the existing contact damage
path. Contact damage is intentionally one application per new overlap because
`EntityContactSystem` emits `ENTITY_CONTACT_STARTED` once until the entities
separate; this WO does not introduce attacks or continuous damage.

The reported incremental visual gap was repaired at the Web visual boundary:
new Survival enemies inherit the existing Enemy visual identity and the
resolved resource is copied to each new asset binding without duplicate
generation. Final real Studio verification passed: the successful provider-
backed session preserved `world-1`, changed 4 entities to 9 with exactly five
new Enemies, confirmed pursuit components and real-input following, and
recorded five binding-only visual additions with no generation required.
Visual operations remained 8 with 6 ready, 0 active, 0 fallback; manifest
assets were 13 with 13 generated-origin entries; the final Diff reported
synchronized semantic, Runtime, asset, and visual stages; and the console was
clean. The UI does not expose per-entity canonical IDs/URLs, so no unobserved
identifier is claimed.

## Sprint 28 Fresh Gap Analysis

The bounded thesis passes: Survival Enemy pressure is immediately observable,
same-session evolution adds exactly five independent Runtime Enemies, all five
retain target-directed pursuit and follow the Player, and the compatible Enemy
visual asset is reused without duplicate generation jobs. No additional
measured Survival gameplay-pressure blocker exists. `SPRINT28_FREEZE_REVIEW` is
selected; Sprint 29 is not entered automatically.

For active SPA navigation, the current path is `Studio view → application-scoped
Pinia gameStore/RuntimeWorldStore → Full Observatory view → Studio view`. The
Pixi viewport may be recreated on return, but the current Runtime world/session
remains the authority; browser refresh, close, and durable restore are not part
of this contract.

## Sprint 26 Post-WO Gap Analysis Snapshot

The exact request now reaches `survival` with genre confidence `1.0`; real
Studio showed six active Runtime/Pixi entities, Player Inspector Position
`(80,400)`, and clean diagnostics. The initial alias blocker is closed.

Motion-profile measurement then closed that gap: survival uses the existing
generic four-direction controller, the viewport omits `Space Jump`, and real
Studio observed horizontal and vertical Player movement while MarioWorld kept
its platformer control surface.

The fresh next gap closed active-world five-enemy addition recovery: clean-page
Studio preserved `world-1`, changed six entities to 11 through deterministic
fallback, reported `deterministic · fallback / provider_failed`, and kept
warning/error diagnostics empty. No further blocker is selected within the
bounded proof; enemy chase, offense, spawning, waves, duration, and progression
expansion are deferred non-goals. SPRINT26_FREEZE_REVIEW is the sole next gate.

## Sprint 25 Reachability Audit Snapshot

WO-S25-001 confirmed that the current production path is `ACTIVE` across
generation providers/fallbacks, CreateWorldPipeline, semantic-to-DSL and
Runtime projection, Runtime systems, Pixi rendering, visual/asset generation,
and the current Observatory store/view model. `PromptAssemblyDomainModel` is
`SUPPORTING` as a compatibility-shaped DTO on the active pipeline. The old
PromptBuilder/strategy/Planner/DefaultPipeline stack, legacy Observatory
metadata route, Mario/demo bootstrap, and inert streaming path are
`FROZEN_LEGACY`; `packages/renderer/src/renderWorld.ts` is a `DEAD` candidate
whose public export must be checked before any cleanup. See
`docs/project/SPRINT25_PRODUCTION_REACHABILITY_AUDIT.md` for evidence and the
full mandatory-target matrix.

## Known Legacy Paths

- `FROZEN_LEGACY`: historical `DefaultPromptBuilder`, `strategy/`, Planner and
  MockPlanner providers, `DefaultPipeline`, Prompt Observatory metadata
  bridge/mapper route, Mario/demo bootstrap, and inert streaming state.
- `DEAD`: `packages/renderer/src/renderWorld.ts` has no current production call
  site, but remains publicly exported pending a bounded consumer check.
- `SUPPORTING`: mock Observatory hydration is limited to the test fixture hook;
  deterministic generation, static asset, and primitive Renderer fallbacks are
  intentional ACTIVE product recovery paths rather than mocks.

## Problem Register

| Problem | Evidence | Sprint treatment |
| --- | --- | --- |
| Player can pass through generated Platform geometry | Resolved and Product Verified in WO-S20-001. | Closed — Sprint 20 frozen at v1.170. |
| Natural-language follow-up `增加5个enemy` can return `Unknown command` | Sprint 21 behavior remains verified. A later active-world create/generate precedence regression was repaired; the v1.173 real Studio preflight verified `再创建5个怪物` as same-world targeted evolution (`7 → 12`) and verified explicit `创建一个新的游戏` as intentional CreateWorld. | Closed for WO-S21-001; regression repair verified in v1.173. Sprint 21 remains frozen; no new Sprint/WO. |
| Full Observatory navigation can lose Studio runtime state | Current source and real SPA measurement retained `world-1`, Player, Health, entities, and post-return World Evolution across Studio → Full Observatory → Studio. | Closed for Sprint 22 continuity. No claim is made for browser refresh, tab close, durable save, or cross-session restore. |
| Failed image generation lacks targeted retry | Resolved in Sprint 23. | Closed — frozen at v1.172. |
| Final image-generation prompt is not exposed in the UI | Resolved in Sprint 23. | Closed — frozen at v1.172. |
| Failed/completed gameplay presentation is basic | Runtime session truth now projects to a bounded Game Over / Victory viewport overlay; both real generated-platformer lifecycle paths pass. | Product Verified — Sprint 24 freeze review selected at v1.173. |
| Completed gameplay continues under Victory | Real Studio confirmed completed + Victory permits Player exploration, matching `目标已完成。当前世界仍可继续探索`. | Expected product behavior; WO-S24-002 cancelled. |

## Sprint 24 Product Verification Record

Real Studio lifecycle measurement completed on 2026-08-27 at `localhost:5888`.

- PV A `active → failed → Game Over → Respawn → active`: PASS. Legitimate
  enemy contact damage reduced Player Health to `0`; the overlay showed
  `failed` and only `重生`; `world-1` and 11 entities remained. Waiting in
  `failed` kept Player/world state stable. Respawn returned to `active` with
  the same `world-1` and 11 entities; no regeneration occurred.
- PV B `active → completed → Victory`: presentation PASS. The real goal
  reached `completed`; Victory was projected from Runtime state and exposed
  no restart/next-level action. Console diagnostics contained only Vite
  connection messages.
- PV B lifecycle correctness: PASS. Idle completed state kept Player at
  `(641,400)` with Health `96`; a real ArrowRight input moved Player to
  `(695,400)` while Victory remained visible, which is expected exploration
  under the clarified contract. Same world/session remained coherent and the
  console stayed clean.
- Human/CTO clarification cancelled WO-S24-002 before implementation. No
  change was made to `DefaultRuntimeExecutionLoop`, and completed does not
  inherit failed-state execution blocking.
- Fresh Sprint 24 Gap Analysis found no new lifecycle-presentation blocker;
  `SPRINT24_FREEZE_REVIEW` is selected and Sprint 25 is not entered.

## WO-S19-001 Product Verification Record

Real Studio manual verification completed on 2026-08-26. Every required
observation passed:

- stationary → idle: PASS
- move right → run: PASS
- stop → idle: PASS
- move left → run + correct horizontal mirroring: PASS
- jump → jump: PASS
- land while moving → run: PASS
- stop after landing → idle: PASS
- existing gameplay continuity preserved: PASS
- browser console clean: PASS

The verification closes the repaired production path:
`KeyboardInputProvider → DefaultPlayerControllerSystem → truthful
VelocityComponent.x → Runtime motion → RuntimeRendererAdapter → presentation
state → Pixi Renderer`. The observed run state is truthful but remains one
static pose sliding through the world; that observation is the measured input
to WO-S19-002.

## WO-S19-002 Product Verification Record

Real Studio manual verification completed on 2026-08-26. Every required
observation passed:

- stationary Player → idle; run-frame cycling does not continue: PASS
- sustained movement right → two distinct generated run frames visibly
  alternate; movement reads as temporal animation: PASS
- sustained movement left → the same temporal alternation with correct
  horizontal mirroring/facing: PASS
- stop horizontal movement → idle; run-frame cycling stops: PASS
- jump → jump; run-frame cycling is not shown while airborne: PASS
- land while horizontal movement continues → temporal run-frame cycling: PASS
- existing Runtime movement/collision/gameplay authority unchanged: PASS
- existing mechanically complete platformer flow remains functional: PASS
- browser console has no new WO-S19-002-attributable errors/warnings: PASS

The verified production flow is:
`KeyboardInputProvider → DefaultPlayerControllerSystem → truthful
VelocityComponent.x → Runtime motion/grounding → RuntimeRendererAdapter →
presentationState + velocity → Player run-frame asset selection → Pixi
Renderer tick alternation and horizontal mirroring`.

## Sprint 19 Freeze Review

- Date: 2026-08-26
- Architecture: v1.164 → v1.167
- Decision: **FROZEN**
- Code Complete: **YES**
- Product Verified: **YES**

The Sprint question is satisfied: Genesis presents a generated Player from real
Runtime behavior so standing, running, facing, and jumping read as character
actions rather than a static image sliding through the world. Verified scope
includes Runtime-reachable horizontal motion truth, idle/run/jump presentation,
left/right facing, real temporal run-frame alternation, landing back to run,
stop back to idle, unchanged Runtime gameplay/collision authority, and the
existing mechanically complete platformer flow.

Sprint 19 does not require full spritesheets, arbitrary frame counts, attack,
hurt, death, enemy animation, skeletal animation, AnimationManager, a universal
animation state machine, or an animation editor. No Sprint 20 work is entered
without explicit Human/CTO authorization.
| Studio Status | Foundation active at `/`; World Explorer and Inspector are read-only real-data surfaces. |
| Architecture Status | **Evolving** — Observatory Runtime Migration (WO-S10-006) + Web Command Routing Integration (WO-S10-004) + Runtime World Injection Foundation (WO-S10-003) + Create World Pipeline Foundation (WO-S10-002) + Intent Router Foundation (WO-S10-001) + Observatory Shell (WO-S6-001) + Overview Dashboard (WO-S6-002) + Trace Viewer (WO-S6-003) + Timeline Viewer (WO-S6-004) + History Viewer (WO-S6-005) + Diff Viewer (WO-S6-006) + I18n Foundation (WO-S6-006.5) + Runtime Viewer (WO-S6-007) + Live Event Stream (WO-S6-008) + Entity Inspector (WO-S6-009) + Trace Graph (WO-S6-010) + World Graph (WO-S6-011) + Data Adapter (WO-S6-012) + Overview Data Integration (WO-S6-013) + Trace Data Integration (WO-S6-014) + Timeline Data Integration (WO-S6-015) + History Data Integration (WO-S6-016) + Diff Data Integration (WO-S6-017) + Runtime Data Integration (WO-S6-018) + Event Stream Data Integration (WO-S6-019) + Metadata Bridge Foundation (WO-S6-020) + Metadata Bridge Consumption (WO-S6-021) + Mapping Layer Foundation (WO-S6-022) + Mapping Layer Consumption (WO-S6-023) + Prompt Metadata Contract Foundation (WO-S6-024) + Prompt Metadata Consumption (WO-S6-025) + Prompt Metadata Emission Foundation (WO-S6-026) + Prompt Metadata Emission Consumption (WO-S6-027) + Real Metadata Activation (WO-S6-028) + Prompt Assembly Domain Model Foundation (WO-S7-001) + Game DSL Foundation (WO-S8-001) + Game DSL Builder Foundation (WO-S8-002) + Game DSL Runtime Projection Foundation (WO-S8-003) + Runtime Component Model Foundation (WO-S8-004) + Semantic Game World DSL Foundation (WO-S8-005) + Semantic World To Game DSL Builder Foundation (WO-S8-006) + Semantic World Generator Foundation (WO-S8-007) + Runtime System Foundation (WO-S8-008) + Runtime Execution Loop Foundation (WO-S8-009) + Runtime World Mutation Foundation (WO-S8-010) + Position Component Foundation (WO-S8-011) + Movement System Foundation (WO-S8-012) + Semantic World Generator Enrichment Foundation (WO-S8-013) + Prompt Entity Extraction Foundation (WO-S8-014) + Prompt Entity Count Extraction Foundation (WO-S8-015) + Game Intent Extraction Foundation (WO-S8-016) + Pixi Renderer Foundation (WO-S9-001) + Runtime → Renderer Sync Foundation (WO-S9-002) + Position Render Model Foundation (WO-S9-003) + Pixi Entity Visualization Foundation (WO-S9-004) + Runtime Visualization Loop Foundation (WO-S9-005) + Real-Time Visualization Loop Foundation (WO-S9-006) + Entity Visual Mapping Foundation (WO-S9-007) + Keyboard Input Foundation (WO-S9-008) + Player Controller System Foundation (WO-S9-009) + Playable Game Bootstrap Foundation (WO-S9-010) + Mario Playable Slice Foundation (WO-S9-011) + Gravity System Foundation (WO-S9-012) complete. `ObservatoryShell` + `ObservatorySidebar` + `ObservatoryHeader` + `ObservatoryContent` compose the dark, minimal, developer-tool shell at `/observatory` (Vue 3 + TypeScript + Pinia + vue-router; no new dependencies). New `observatory` Pinia store (`selectedPanel`, `status`, `version`) + new `i18n` Pinia store (`language`, `setLanguage`, `t`, `has`). 10-panel sidebar navigation with active/hover/keyboard support. **Overview Dashboard Foundation** — `ObservatoryOverview.vue` renders when `selectedPanel === 'Overview'` (Artifact Summary, Observatory Snapshot, System Status). **Trace Viewer Foundation** — two-column master-detail layout via `trace/` components (`ObservatoryTraceViewer`, `TraceList`, `TraceDetails`, `TraceStepCard`); selectable rows with keyboard navigation, Plan/Snapshot/Metadata details. **Timeline Viewer Foundation** — second observability viewer via `timeline/` components (`ObservatoryTimelineViewer`, `TimelineList`, `TimelineDetails`, `TimelineEntryCard`); selectable timelines (mock: timeline-001/12 entries, timeline-002/8, timeline-003/4) with keyboard navigation; details show Timeline ID/Entry Count header + Timeline Entries list of `TimelineEntryCard`s (#index + strategy). **History Viewer Foundation** — third observability viewer via `history/` components (`ObservatoryHistoryViewer`, `HistoryList`, `HistoryDetails`, `HistoryEntryCard`); selectable history builds (mock: history-001 Create Village, history-002 Add Farm, history-003 Add Guards) with keyboard navigation; details show History ID/Timestamp header + Prompt + Result + Evolution sections (Evolution uses `HistoryEntryCard`s with `+` markers). **Diff Viewer Foundation** — fourth observability viewer via `diff/` components (`ObservatoryDiffViewer`, `DiffList`, `DiffDetails`, `DiffChangeCard`); selectable diffs (mock: diff-001 Tavern/Villager, diff-002 Farm, diff-003 Guard/OldRoad/VillageGate) with keyboard navigation; details show Diff ID/Timestamp header + Added (+ green) / Removed (- red) / Changed (• indigo) sections using `DiffChangeCard`s; per-section empty states. **I18n Foundation** — dependency-free localization (`apps/web/src/i18n/` core with `resolveKey`/`createI18n` + `locales/zh-CN.ts` + `locales/en-US.ts`; reactive `stores/i18n.ts` with `language` default `'zh-CN'`, `setLanguage`, `t` fallback-to-key, `has`); shell texts converted (header title/badge/sprint/version, sidebar panels, content placeholders, overview labels) via `useI18n().t()`; compact `[ 中文 ▼ ]` language switcher in the header (中文/English, reactive, no reload); viewer details (Trace/Timeline/History/Diff) intentionally NOT converted yet; the Runtime viewer (WO-S6-007) is the first to use `observatory.runtime.*` keys. **Trace Graph Foundation** — 9th observability panel via `graph/` components (`ObservatoryTraceGraph`, `TraceGraphNode`, `TraceGraphEdge`, `TraceGraphLegend`); pure-CSS vertical flow graph on the new **Trace Graph** panel (sidebar position 8, between EventStream and Settings, `OBSERVATORY_PANELS` now 9); 6 mock nodes (CreateWorld → GenerateTerrain → CreateFarm → CreateNPC → CreateInventory → CreateQuest, all completed) with 5 CSS connector edges; each node is an `<article>` with status dot + status label + strategy name; 3-item legend (Completed/Pending/Failed) with localized labels; i18n keys `observatory.panels.tracegraph` (`执行图谱`/`Trace Graph`) + `observatory.graph.*` (title/legend/completed/pending/failed); no graph libraries, no SVG, no D3/Cytoscape. Prompt Explorer remains future work. Architecture v1.40. **Runtime Viewer Foundation** — fifth observability viewer via `runtime/` components (`ObservatoryRuntimeViewer`, `RuntimeEntityList`, `RuntimeEntityDetails`, `RuntimeStatCard`); selectable runtime entities (mock: guard-001 Guard `(10,4)` Patrol, merchant-001 Merchant `(4,8)` Trading, villager-001 Villager `(1,2)` Working, health 100) with keyboard navigation; stats row (`Runtime Stats` + `world-001`, Entities/Systems/Events/FPS = 187/8/31/60 via reusable `RuntimeStatCard`s) above Position/Health/State `dl` entity details (ID/Type header); data labels localized through the existing S6-006.5 i18n infrastructure (zh-CN default, reactive switcher). **Live Event Stream Foundation** — sixth observability panel via `events/` components (`ObservatoryEventStream`, `EventStreamList`, `EventStreamItem`, `EventFilterBar`); single-column live feed on the new **Event Stream** panel (sidebar position 6, between Runtime and TraceGraph, `OBSERVATORY_PANELS` now 9); 20 seeded mock events (Runtime/Planner/AI/Provider; info/warning/error) with mono timestamps, level badges, source, message; top filter bar (All/Info/Warning/Error, native buttons + `aria-pressed`) with local-only state; `setInterval` simulation appends one mock event every 2000ms and caps the stream at 100 events (oldest spliced); interval cleared on unmount; list is `ul[role="log"]` with `"No events"` empty state; fully localized via `observatory.events.*` keys + `observatory.panels.eventstream` (`事件流`/`Event Stream`). Selection is local component state. Placeholder grid remains for Settings. No inline styles. 1193+ tests across 13 files (161 event stream + 150 graph + 149 inspector + 140 i18n + 139 runtime + 121 shell + 120 diff + 103 history + 99 trace + 99 timeline + 62 overview + 15 streaming); TypeScript 0 errors; ESLint 0 errors. **Entity Inspector Foundation** — `RuntimeEntityInspector.vue` + `RuntimeComponentCard.vue` integrated into the Runtime Viewer below Entity Details; ECS-style component inspection with 3 mock entities (guard-001: 3 components, merchant-001: 4, villager-001: 5); each component shown as a semantic card with `<h3>` name and `<pre>` formatted JSON; i18n keys `observatory.runtime.inspector`/`components`/`componentCount` (zh-CN + en-US). Prompt Explorer remains future work. Architecture v1.39. **Sprint 5 = 100% complete** (Prompt Observability Layer). |
| Runtime Status | Stable (Action Registry + Query Layer) |
| Renderer Status | **Evolving** — Runtime World Injection Foundation (WO-S10-003) + Pixi Renderer Foundation (WO-S9-001) + Runtime → Renderer Sync Foundation (WO-S9-002) + Position Render Model Foundation (WO-S9-003) + Pixi Entity Visualization Foundation (WO-S9-004) + Runtime Visualization Loop Foundation (WO-S9-005) + Real-Time Visualization Loop Foundation (WO-S9-006) + Entity Visual Mapping Foundation (WO-S9-007) + Keyboard Input Foundation (WO-S9-008) + Platform World Rendering Foundation (WO-S9-016)
| Planner Status | Stable (Planner Interface + PlannerResult + PlannerProvider + ProviderFactory) |
| AI Status | Runtime World Injection Foundation (WO-S10-003) + Create World Pipeline Foundation (WO-S10-002) + Intent Router Foundation (WO-S10-001) + Provider Architecture Complete + Streaming Pipeline + Provider Native Tool Calling + Agent Loop Foundation + Pipeline-AgentLoop Integration + Multi-Step Agent Loop + Structured Observation Context + Planner Observation Awareness + Reflection Foundation + Structured Prompt Context + Prompt Renderer Foundation + Context Compression Foundation + Prompt Budget Foundation (Token Estimation) + Memory Ranking Foundation + Prompt Selection Foundation + Prompt Selection Consumption + Prompt Compression Consumption + Prompt Assembly Integration + Provider Budget Foundation + Provider Budget Consumption + AI Configuration Foundation + AI Configuration Consumption + BuilderOptions Foundation + BuilderOptions Consumption + Architecture Review + Intent Analysis Foundation + Rule-Based Intent Analyzer + Intent Consumption + Intent Rendering Foundation + Intent Prompt Integration + **Entity Recognition Foundation + Rule-Based Entity Analyzer + Entity Consumption + Entity Rendering Foundation + Entity Prompt Integration + Semantic Context Foundation + Semantic Context Consumption + Semantic Context Rendering Foundation + Semantic Context Prompt Integration + Prompt Strategy Foundation + Prompt Strategy Consumption + Prompt Strategy Rendering Foundation + Prompt Strategy Prompt Integration** — Mock / OpenAI / DeepSeek Providers + ProviderFactory + StructuredOutputValidator + StreamingPlannerProvider + ToolCallingProvider + AgentLoop (Multi-Step, Structured Observations, Reflection) + **WO-S12-001 provider boundary + WO-S12-002 structured candidate/validator/adapter contract + WO-S12-003 LLM candidate provider/client boundary + WO-S12-004 concrete OpenAI structured client + WO-S12-009 game-design prompt assembly + deterministic fallback** |
| Prompt Pipeline | **Evolving** — Structured Prompt Context (PromptContext) → PromptModule[] → **IntentAnalyzer** → **IntentRenderer** → **EntityAnalyzer** → **EntityRenderer** → **SemanticContextBuilder** → **SemanticContextRenderer** → **StrategyEvaluator** → **PromptStrategySelector** (fallback) → **PromptAssemblyPlanner** → **PromptStrategyRenderer** → **PromptAssemblyStrategy** (resolver + reorder) → Builder → MemoryRanking → PromptBudget → ProviderBudget → PromptSelection (consumes Ranking + Budget + ProviderBudget) → PromptCompression (consumes Selection) → **PromptRenderer** → AIRequest |
| Intent Layer | **Integrated** — IntentAnalyzer + IntentRenderer + DefaultPromptRenderer. Intent rendered in final prompt as "User Intent:" section. |
| Entity Layer | **Prompt Integrated** — EntityAnalyzer + EntityRenderer + DefaultPromptRenderer. Entity rendered in final prompt as "Entities:" section. |
| Strategy Layer | **Evaluator-Driven Scoring + Strategy-Aware Plans + Rendering + Optimization + Diff + Snapshot + Inspector + Export + Trace + TraceDiff + TraceDiff Consumption + Trace Renderer + Trace Renderer Consumption + Trace Exporter + Trace Exporter Consumption + Timeline Foundation + Timeline Consumption + Timeline Diff Foundation + Timeline Diff Consumption + Timeline Rendering Foundation + Timeline Rendering Consumption + Timeline Export Foundation + Timeline Export Consumption + Timeline Snapshot Foundation + Timeline Snapshot Consumption + History Foundation + History Consumption + History Diff Foundation + History Diff Consumption + History Renderer Foundation + History Renderer Consumption + History Export Foundation + History Export Consumption + History Snapshot Foundation + History Snapshot Consumption + Observatory Foundation + Observatory Consumption + Observatory Diff Foundation + Observatory Diff Consumption + Observatory Renderer Foundation + Observatory Renderer Consumption + Observatory Export Foundation + Observatory Export Consumption + Observatory Snapshot Foundation + Observatory Snapshot Consumption** — PromptStrategy + DefaultPromptStrategy + CreateStrategy + QueryStrategy + ModifyStrategy + DeleteStrategy + PromptStrategySelector + DefaultPromptStrategySelector (score-based) + PromptStrategyRenderer + DefaultPromptStrategyRenderer + StrategyModule + CreateStrategyModule + QueryStrategyModule + ModifyStrategyModule + DeleteStrategyModule + StrategyModuleRenderer + DefaultStrategyModuleRenderer + StrategyEvaluator + DefaultStrategyEvaluator + WeightedStrategyEvaluator + StrategySelectionMetadata + StrategySelectionRenderer + DefaultStrategySelectionRenderer + PromptAssemblyStrategy + DefaultPromptAssemblyStrategy + CreatePromptAssemblyStrategy + QueryPromptAssemblyStrategy + ModifyPromptAssemblyStrategy + DeletePromptAssemblyStrategy + PromptAssemblyStrategyResolver + DefaultPromptAssemblyStrategyResolver + **PromptSectionPriority + PromptAssemblyPlan + PromptAssemblyPlanner + DefaultPromptAssemblyPlanner + PriorityAwarePromptAssemblyStrategy + DefaultPriorityAwarePromptAssemblyStrategy + StrategyAwarePromptAssemblyPlanner + PromptAssemblyPlanRenderer + DefaultPromptAssemblyPlanRenderer + PromptAssemblyOptimizer + DefaultPromptAssemblyOptimizer + PromptAssemblyPlanDiff + PromptAssemblyPlanDiffer + DefaultPromptAssemblyPlanDiffer + PromptAssemblySnapshot + PromptAssemblySnapshotBuilder + DefaultPromptAssemblySnapshotBuilder + PromptInspector + PromptInspectorSection + PromptInspectorBuilder + DefaultPromptInspectorBuilder + PromptInspectorRenderer + DefaultPromptInspectorRenderer + PromptInspectorExporter + DefaultPromptInspectorExporter + PromptAssemblyTrace + PromptAssemblyTraceBuilder + DefaultPromptAssemblyTraceBuilder + PromptAssemblyTraceDiff + PromptAssemblyTraceDiffer + DefaultPromptAssemblyTraceDiffer + PromptAssemblyTraceRenderer + DefaultPromptAssemblyTraceRenderer + PromptAssemblyTraceExporter + DefaultPromptAssemblyTraceExporter + PromptAssemblyTimelineEntry + PromptAssemblyTimeline + PromptAssemblyTimelineBuilder + DefaultPromptAssemblyTimelineBuilder + PromptAssemblyTimelineDiff + PromptAssemblyTimelineDiffer + DefaultPromptAssemblyTimelineDiffer + PromptAssemblyTimelineRenderer + DefaultPromptAssemblyTimelineRenderer + PromptAssemblyTimelineExporter + DefaultPromptAssemblyTimelineExporter + PromptAssemblyTimelineSnapshot + PromptAssemblyTimelineSnapshotBuilder + DefaultPromptAssemblyTimelineSnapshotBuilder + PromptAssemblyHistoryEntry + PromptAssemblyHistory + PromptAssemblyHistoryBuilder + DefaultPromptAssemblyHistoryBuilder + PromptAssemblyHistoryDiff + PromptAssemblyHistoryDiffer + DefaultPromptAssemblyHistoryDiffer + PromptAssemblyHistorySnapshot + PromptAssemblyHistorySnapshotBuilder + DefaultPromptAssemblyHistorySnapshotBuilder**. Phase 0.9 evaluates strategies → generates scores → selects highest → produces metadata (evaluator-driven since v0.74). Phase 0.915 renders selection to strategySelectionRendered. Phase 0.955 invokes PromptAssemblyPlanner (strategy-aware since v0.78), stores plan. Phase 0.956 invokes PromptAssemblyOptimizer (v0.82+), stores optimizedPlan. Phase 0.9565 invokes PromptAssemblyPlanDiffer (v0.84+), stores planDiff. Phase 0.957 renders plan (uses optimized plan when available). Phase 0.958 invokes PromptAssemblySnapshotBuilder (v0.86+), stores unified snapshot at `metadata.promptAssembly.snapshot`. Phase 0.959 invokes PromptInspectorBuilder (v0.87+), stores inspector at `metadata.promptAssembly.inspector`. Phase 0.9595 invokes PromptInspectorRenderer (v0.89+), stores inspectorRendered at `metadata.promptAssembly.inspectorRendered`. Phase 0.9597 invokes PromptInspectorExporter (v0.91+), stores inspectorExported at `metadata.promptAssembly.inspectorExported`. Phase 0.96 uses optimized plan for priority-aware ordering. All four business strategies have dedicated assembly. PromptAssemblyTrace (v0.92+) aggregates all diagnostic artifacts into a unified trace domain model. Phase 0.9598 (v0.93+) invokes PromptAssemblyTraceBuilder to produce trace at `metadata.promptAssembly.trace`. PromptAssemblyTraceDiff (v0.94+) provides unified diff model for comparing two traces. Phase 0.95985 (v0.95+) invokes PromptAssemblyTraceDiffer against empty baseline, stores traceDiff at `metadata.promptAssembly.traceDiff`. PromptAssemblyTraceRenderer (v0.96+) provides human-readable rendering of traces. Phase 0.9599 (v0.97+) invokes PromptAssemblyTraceRenderer, stores traceRendered at `metadata.promptAssembly.traceRendered`. PromptAssemblyTraceExporter (v0.98+) provides JSON export of traces via JSON.stringify with 2-space indent. Phase 0.95995 (v0.99+) invokes PromptAssemblyTraceExporter, stores traceExported at `metadata.promptAssembly.traceExported`. PromptAssemblyTimeline (v1.00+) provides multi-build timeline model for trace history, building indexed entries from trace arrays. Phase 0.95996 (v1.01+) invokes PromptAssemblyTimelineBuilder with the current trace, storing timeline at `metadata.promptAssembly.timeline`. PromptAssemblyTimelineDiff (v1.02+) provides structural diff of two timelines by entry index. Phase 0.95997 (v1.03+) invokes PromptAssemblyTimelineDiffer against empty baseline, storing timelineDiff at `metadata.promptAssembly.timelineDiff`. PromptAssemblyTimelineRenderer (v1.04+) provides human-readable rendering of timelines. Phase 0.959975 (v1.05+) invokes PromptAssemblyTimelineRenderer against the current timeline, storing timelineRendered at `metadata.promptAssembly.timelineRendered`. PromptAssemblyTimelineExporter (v1.06+) provides JSON export of timelines via JSON.stringify with 2-space indent. Phase 0.959976 (v1.07+) invokes PromptAssemblyTimelineExporter against the current timeline, storing timelineExported at `metadata.promptAssembly.timelineExported`. PromptAssemblyTimelineSnapshotBuilder (v1.08+) builds condensed snapshot summary from the timeline. Phase 0.9599765 (v1.09+) invokes PromptAssemblyTimelineSnapshotBuilder against the current timeline with rendered/exported metadata, storing timelineSnapshot at `metadata.promptAssembly.timelineSnapshot`. PromptAssemblyHistoryBuilder (v1.10+) builds immutable frozen history from ordered trace arrays. Phase 0.9599767 (v1.11+) invokes PromptAssemblyHistoryBuilder with the current trace, storing history at `metadata.promptAssembly.history`. |
| Semantic Layer | **Prompt Integrated** — SemanticContext + SemanticContextBuilder + DefaultSemanticContextBuilder + SemanticContextRenderer + DefaultSemanticContextRenderer. Semantic Context rendered as official Prompt section. |
| Validator | StructuredOutputValidator — unified response validation for all providers |
| Streaming | Complete — Pipeline.stream() + StreamChunk events + Streaming UI Integration |
| Current Provider | ProviderFactory (configured via AIConfiguration) |
| Backend Status | AI Gateway runtime host active in `@genesis/ai-server`; provider construction remains a server composition-root concern |
| Networking Status | None |
| Development Standards | **Established** — AI_DEVELOPMENT_STANDARD.md v1.0 |
| Architecture Principles | **Established** — ARCHITECTURE_PRINCIPLES.md v1.0 |

### WO-S15-004 Current Behavior

- `@genesis/runtime` owns the bounded post-system execution seam. It matches
  enabled rules by current event type and world/session/semantic binding,
  evaluates only category, archetype, ID, and whitelisted component conditions,
  and orders matches deterministically by priority then stable RuleSet order.
- The initial action executor accepts exactly one `REMOVE_ENTITY` action. It
  resolves event actor/target, exact ID, category, archetype, or role selectors
  against current semantic/Runtime facts, protects the Player, and calls
  `WorldMutator`; it never edits entity arrays, Pixi objects, or provider code.
- `DefaultRuntimeExecutionLoop` runs rule execution after systems finalize the
  event batch. The returned World flows through the existing Renderer and
  `RuntimeWorldStore` commit boundary; committed removal is emitted as
  `ENTITY_REMOVED` on the next tick. Event/rule pairs are exactly-once within a
  bounded world/session/revision execution session.
- `@genesis/renderer` forwards separate rule results, and Observatory records
  them as `Gameplay Rule` entries without collapsing them into raw facts.
  Overview reports an active supported slice while stale/deferred rules remain
  visibly gated. Code Complete: YES. Product Verified: YES — local Studio browser
  verification passed for player → coin contact, remove-only execution,
  next-boundary `ENTITY_REMOVED`, continued player control, and clean console
  warning/error logs.

### WO-S15-003 Historical Boundary

- `@genesis/shared` owns immutable `GameplayRuleSpecification`, `GameplayRuleSet`,
  typed `GameplayTrigger`, entity selectors, compact conditions, typed actions,
  rule execution metadata, and capability-derived support status. The only
  allowed event vocabulary is the five real S15-002 facts; contact direction is
  representable but deferred because Runtime does not emit it.
- `@genesis/ai` owns provider-facing `GameplayRuleCandidate` validation and the
  deterministic `GameplaySpecification → GameplayRuleSet` builder. IDs and
  selectors are normalized against current semantic entities; unknown action
  primitives, duplicate IDs, code/scripts/eval, and nonexistent references are
  rejected. Provider support claims are not authoritative.
- Create World produces the RuleSet beside GameplaySpecification. The web store
  binds it to the current world/session and semantic revision; world replacement
  replaces it, while semantic evolution marks it stale pending future mechanics
  synchronization. Rule construction is side-effect free and does not touch
  Runtime, Renderer, or Event Stream state.
- Observatory Overview originally showed rule counts, one safe rule detail,
  support status, and `Planning only`; S15-004 supersedes that execution status
  for the supported remove-only slice. Rule plans remain distinct from facts.

### WO-S15-002 Current Behavior

- `@genesis/shared` owns the provider-independent immutable `GameplayEvent`
  vocabulary and observer contract. Initial production event types are
  `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_CONTACT_STARTED`,
  `ENTITY_ADDED`, and `ENTITY_REMOVED`. No `ITEM_COLLECTED`, damage, death,
  completion, or other gameplay result is emitted.
- `@genesis/runtime` owns the ephemeral bounded collector, deterministic
  `worldId/tick/sequence` event identity, ordered system emission, jump and
  landing transition observation, explicit Runtime collision bounds/contact
  observation, and committed WorldStore ID-set mutation facts. Runtime holds
  no event history and has no Vue, Pinia, Renderer, or Observatory dependency.
- `@genesis/renderer` only requests `tickWithResult()` when an observer is
  supplied and forwards the immutable event batch. The existing no-observer
  rendering path remains behavior-compatible.
- The Web Observatory maps the batch to `Gameplay` Event Stream entries with
  Runtime tick timestamps and a 100-entry session bound. World Evolution
  events remain separate domain events and are preserved in the same bounded
  projection.
- Entity contact uses Runtime-owned `collision-bounds` components, not visual
  envelopes, Pixi objects, image dimensions, or pixel tests. Contact is
  `started`-only and state is reset on a new Runtime world/session.
- Code Complete: YES. Product Verified: YES — browser jump/landing,
  contact de-duplication, mutation, World Evolution coexistence, and console
  checks passed.

### WO-S15-001 Current Behavior

- `@genesis/shared` owns the immutable `GameplaySpecification`, compact
  `GameLoopSpecification`, mechanic categories, player mechanic IDs,
  interaction/goal/failure/progression/spawn sections, capability catalog, and
  gameplay generation context. The catalog mirrors behavior already wired in
  production Runtime, including the S15-002 event-observation capabilities;
  event observability is not treated as gameplay execution.
- `@genesis/ai` owns the provider-neutral candidate shape, validator, builder,
  deterministic genre defaults, and candidate → validator → specification
  adapter. The existing structured client/gateway boundary is reused. AI can
  propose intent, but cannot promote unsupported mechanics or return engine
  code, scripts, triggers, or provider logs.
- Create-world attaches the gameplay specification after semantic world
  creation. The web store replaces it with the current world and keeps the
  Runtime world projection unchanged. Provider failure is captured as safe
  diagnostics and deterministic gameplay intent keeps creation successful.
- Observatory exposes revision, source, mechanic count, supported/deferred
  counts, validation status, and primary goal only. No fake gameplay timeline,
  execution graph, Runtime system, or hidden provider payload is shown.
- Code Complete: YES. Product Verified: YES — platformer, survival, farm,
  replacement/isolation, Observatory, and browser console checks passed.

### WO-S15-000 Current Behavior

- `@genesis/shared` owns immutable `WorldEvolutionGenerationContext`,
  `ImageGenerationContext`, and `GameDesignGenerationContext` contracts plus
  deterministic builders. `GameplayGenerationContext<T>` was the typed
  extension point consumed by WO-S15-001.
- World evolution derives prompt context from the current request authority and
  includes only semantic world facts, real selected IDs, supported operations,
  and relevant semantic/Runtime/visual revisions. Renderer state, tick state,
  history, logs, credentials, and provider payloads are excluded.
- Initial and evolved image requests carry the current visual and asset facts,
  canonical bindings, and at most three metadata-only neighboring requirements.
  Contextual prompt sections are deterministic and provider-neutral; image
  operation traces expose safe summaries only.
- Existing Sprint 14 stale guards remain authoritative, with an additional
  Runtime revision check on visual execution. Full context snapshots are not
  stored in a global Context Store.
- Code Complete: YES. Product Verified: YES — local Studio browser sequence covered Sheep ID truth, revision metadata, follow-up context rebuild, world isolation, and empty browser warning/error logs. The local structured provider returned an invalid candidate once and the existing deterministic fallback handled world creation; this did not affect the context assertions.

### WO-S14-006 Current Behavior

- Sprint 14 is Code Complete, Product Verified, and frozen at v1.146.
- One continuous browser session retained `world-1`, advanced semantic/Runtime/visual
  revisions 0→4, and converged Cow→Sheep, explicit single removal, Merchant add, and
  background-only Night without a create-world, camera-reset, Runtime bootstrap, renderer
  recreation, or global asset-clear path.
- Canonical evolution generation was proportional to impact: 1 Sheep, 0 remove, 1
  Merchant, and 1 Background. Sheep and Merchant/background artifacts reached renderer
  `ready`; player gameplay reached x=158 and completed jump/re-land after all operations.
- Superseded unfinished create-world visual jobs now become `cancelled` immediately instead
  of remaining falsely queued/generating in Studio and Generation Trace.
- History, Diff, Timeline, Trace, Event Stream, Runtime, World Graph, Overview, and
  Generation Trace all expose the final four-operation/current-world truth. See
  `SPRINT14_REVIEW.md` for the freeze evidence.

### WO-S14-005 Current Behavior

- `DefaultVisualEvolutionPlanner` still consumes the before/after semantic
  snapshots, applied semantic mutation, synchronized Runtime result, and the
  current VisualDesignSpecification/AssetSpecification. It reuses the existing
  `AssetGenerationPolicy` and canonical grouping identity; it does not own
  provider, scheduler, manifest, store, or renderer behavior.
- `VisualAssetEvolutionExecutor` consumes only the planner-owned canonical
  `generationRequired` set. Cow ×3 → Sheep is one request with three bindings;
  Add/replace/night/remove changes remain targeted and unrelated entry objects
  are preserved.
- Existing visuals remain active while a job is queued, generating, resolving,
  or applying. A validated success commits a targeted manifest once, bumps the
  session manifest revision, invalidates only affected AssetStore IDs, and
  reaches the existing Pixi entity/environment renderer through
  `setAssetManifest`. Runtime positions, player state, camera, and loop are not
  reset.
- Provider, artifact, resolution, renderer, stale, and supersession failures
  keep the prior manifest/visual or primitive fallback and never roll back the
  semantic or Runtime commit. Repeated operation IDs return the prior result.
- A current entity ID in an imperative instruction is normalized to an entity
  target before deterministic resolution, so one binding can be removed from a
  shared archetype without turning the request into an unsafe ambiguity; an
  explicit all-group instruction remains authoritative.
- Observatory adds `ASSET_EXECUTION_STARTED` → `ASSET_GENERATION_STARTED` →
  `ASSET_GENERATED` → `MANIFEST_REBOUND` → `ASSET_RESOLVED` →
  `RENDERER_APPLIED` → `VISUAL_SYNC_COMPLETED`/`FAILED`, with canonical counts,
  targeted bindings, manifest revision, renderer counts, and previous-visual
  retention. Remove-only changes omit generation stages.

### WO-S14-003 Current Behavior

- `DefaultRuntimeWorldEvolutionSynchronizer` consumes the immutable semantic
  mutation result and applies only targeted Runtime operations. It never calls
  `DefaultRuntimeProjection` and never rebuilds the world.
- Replacement updates the existing Runtime entity's `type` and real `semantic`
  component while preserving ID, position, velocity, gameplay components,
  controller-owned state, health, and unrelated entity references.
- Additions use the existing semantic + position Runtime shape, deterministic
  collision-free safe placement, and the Renderer primitive fallback. Removal
  removes exactly the resolved Runtime IDs; player removal is rejected safely.
- The web session carries a Runtime semantic revision marker and last applied
  operation ID. Synchronization validates world/session and stale revisions,
  is idempotent, builds off to the side, then commits once through
  `RuntimeWorldStore.setWorld`.
- Runtime sync lifecycle facts are emitted as
  `RUNTIME_SYNC_STARTED` → `RUNTIME_SYNC_COMPLETED`/`FAILED` and
  `world.evolution.runtime_sync_started` → `runtime_synced`/`runtime_sync_failed`.
  Runtime and World Graph rebind from the live Runtime world; visual planning
  now follows synchronization while AssetManifest/image generation remain
  unchanged.

### WO-S14-002 Current Behavior

- `DefaultIntentRouter` recognizes supported current-world evolution language
  separately from create-world commands; ambiguous generic commands remain
  unknown.
- `DefaultWorldEvolutionPlanner` still owns provider-neutral planning,
  semantic target resolution, and immutable delta validation. The web store
  then applies a validated delta with `DefaultSemanticWorldDeltaApplier`.
- The Web store's single semantic authority is the paired current
  `GameWorldModel`, world properties, world/session ID, and monotonic semantic
  revision. A successful mutation replaces that immutable state and subsequent
  evolution requests consume the updated semantics.
- Replacement preserves stable IDs; additions use slugged `name-1`,
  `name-2`, ... allocation against the current world; removal and world
  property updates record exact mutation facts. `movementSpeed` remains
  unsupported in v1.
- History, Diff, Timeline, Trace, and Event Stream include the semantic
  application lifecycle facts that feed S14-003 Runtime synchronization.

### WO-S12-005 Current Behavior

- The browser uses `BrowserStructuredGenerationClient` and only knows the gateway URL.
- `@genesis/ai-server` owns `OpenAIStructuredGenerationClient` and validates gateway requests.
- Browser failures and invalid candidates fall back to the deterministic provider, preserving the Studio experience.
- `创建 MarioWorld` remains the regression path for world creation, Pixi rendering, movement, and Observatory data.

Known remaining gap: a concrete deployment host must mount `createAIGatewayHandler`; the framework-neutral gateway foundation and all in-process tests are complete.

### WO-S12-006 Current Behavior

- `@genesis/ai-server` now listens on `127.0.0.1:8787` by default and exposes `POST /api/world-generation`.
- `startAIServer` receives the `StructuredGenerationClient`; `stopAIServer` closes the owned server without global state.
- Browser configuration is limited to `VITE_AI_ENABLED` and `VITE_AI_GATEWAY_URL`; server credentials stay in the server composition root.
- Local gateway/provider failures remain safe HTTP errors, and the existing browser deterministic fallback keeps world creation working.

Known remaining gap: no authentication, rate limiting, streaming, deployment manifest, or production browser verification is included in this foundation.

### WO-S12-004 Current Behavior

- `OpenAIStructuredGenerationClient` is now server-only behind `StructuredGenerationClient` using the existing OpenAI SDK.
- `VITE_AI_ENABLED` defaults to false; the web composition root selects the gateway only when enabled and configured.
- The default runtime remains deterministic; model/network/parse/validation failures fall back deterministically.
- Web command execution now uses the existing async provider path while preserving synchronous APIs.

Known remaining gap: the gateway still needs a deployment host adapter for production operations.

### WO-S12-002 Current Behavior

- AI world generation now has a structured semantic candidate contract and strict validation boundary.
- The deterministic async provider exercises candidate → validator → `GameWorldModel` conversion.
- Candidates contain only world type and semantic entities; no coordinates, DSL, Runtime, Renderer, prompts, or LLM transport data are accepted.
- No real LLM provider is wired yet; `创建 MarioWorld` remains deterministic and user-visible behavior is unchanged.

Known remaining gap: no AI/LLM provider is wired yet; S12-003 can implement one against the candidate-provider port.

### WO-S12-001 Current Behavior

- `GameWorldGenerationProvider` is an async semantic-generation boundary under `@genesis/ai`.
- `DeterministicGameWorldGenerationProvider` adapts the existing rule-based, catalog-driven generator.
- `DefaultCreateWorldPipeline.executeAsync()` is the provider integration point; the existing synchronous `execute()` remains compatible.
- `创建 MarioWorld` remains deterministic and produces the same platformer world; no real LLM is called.

Known remaining gap: no AI/LLM provider is wired yet; S12-003 can implement one against the candidate-provider contract.

### WO-S10-008 Current Behavior

- `CreateWorldPipeline` passes the extracted `GameIntent` as the authoritative genre to `SemanticWorldGenerator`.
- `创建 MarioWorld` and `create Mario game` select the existing platformer catalog (7 entities), not sandbox, on the deterministic/fallback path.
- Runtime projection retains PositionComponents for Pixi rendering.
- Standalone `SemanticWorldGenerator.generate(model)` calls retain the title-based compatibility fallback.

Current end-to-end path: `Natural Language → IntentRouter → GameIntentExtractor → GameIntent → SemanticWorldGenerator → Game DSL → RuntimeProjection → RuntimeWorldStore → Pixi Renderer`.

No blocking issue for WO-S10-008. LLM generation, world editing, and full gameplay system registration remain future work.

### WO-S10-009 Current Behavior

- `DefaultWorldLayoutGenerator` assigns deterministic spatial positions before DSL construction.
- Platformer layout: player `(80,300)`, terrain `(160,400)`, platform `(300,320)`, enemy `(380,360)`, goal `(650,300)`, checkpoint `(500,320)`.
- Non-platformer and unknown entities use a deterministic horizontal fallback beginning at `(80,80)` with 120px spacing.
- Positions remain existing PositionComponents and are projected unchanged into Runtime and Renderer models.
- Browser behavior verified: `创建 MarioWorld` reports 6 entities and renders separated shapes on the canvas.

No blocking issue for WO-S10-009. Layout is intentionally static; procedural generation, collision, physics, camera redesign, and gameplay systems remain out of scope.

### WO-S10-010 Current Behavior

- The real Web runtime registers `PlayerControllerSystem`, `JumpSystem`, `GravitySystem`, and `GroundCollisionSystem` in that order.
- `KeyboardInputProvider` is attached once during mount and detached during unmount.
- `DefaultCameraController` is passed into `DefaultPixiEntityRenderer`.
- Runtime tick results are written back to `RuntimeWorldStore`, so generated-world replacement remains playable without restarting the visualization loop.
- Manual browser verification confirmed world creation, spatially separated entities, left/right movement, Space jump, gravity-driven return, ground landing, and camera follow behavior.

No blocking issue for WO-S10-010. Gameplay remains a foundation slice without velocity, physics, collision redesign, animation, or additional gameplay systems.

### WO-S10-011 Current Behavior

Observatory production data status:

- Overview: EMPTY/PARTIAL — artifact counters remain available but no real prompt artifacts are manufactured.
- Trace: EMPTY — no real trace source is connected.
- Timeline: EMPTY — no real timeline source is connected.
- History: EMPTY — no real history source is connected.
- Diff: EMPTY — no real diff source is connected.
- Runtime: REAL — sourced from `RuntimeWorldStore`, including current entity count, ids, types, components, and positions.
- Event Stream: EMPTY — no real event source is connected.

The production path uses `ObservatoryRuntimeBinding` on Observatory mount. `loadMockObservatory()` remains explicit for tests/demo fixtures only. Manual browser verification now confirms the Runtime panel receives the generated six-entity MarioWorld through SPA navigation.

### WO-S10-012 Current Behavior

- `/` renders `GameWorkspacePage`; `/observatory` renders `ObservatoryPage` under the same root `router-view`.
- Game and Observatory links use Vue Router and do not reload the document.
- Pinia and `gameStore.worldStore` survive route changes; no browser persistence is used.
- Entering Observatory synchronizes `ObservatoryRuntimeBinding` from that shared world.
- Leaving Game stops the runner and loop, detaches keyboard input, and destroys Pixi.
- Returning to Game creates one fresh runtime presentation stack over the existing world.

Current end-to-end path: `Natural Language → IntentRouter → GameIntentExtractor → SemanticWorldGenerator → Game DSL → RuntimeProjection → RuntimeWorldStore → Game/Observatory SPA views → Pixi Renderer / ObservatoryRuntimeBinding`.

Current blocking issue: none for same-session route continuity. Refresh recovery remains out of scope.

Known legacy paths: inert streaming UI remains; Canvas2D is not used by the production game route; mock Observatory hydration is test/demo-only.

Next recommended verification: repeat Game → Observatory → Game switching while exercising ArrowRight and Space, and confirm one canvas and normal tick speed.

### WO-S11-001 Current Behavior

- `/` is the Genesis Studio shell with Header, World Explorer, Game Viewport, Runtime Inspector, and AI Command Bar.
- Empty sessions display intentional empty states and no mock world entities.
- `创建 MarioWorld` creates six entities that immediately appear in the Explorer, Pixi viewport, Inspector, and command activity.
- All Studio surfaces use the same Pinia-owned `RuntimeWorldStore`.
- Inspector data flows through the existing `ObservatoryRuntimeBinding` and `observatoryData` ViewModel.
- `/observatory` remains a full backward-compatible route in the same SPA session.
- Game viewport unmount/remount retains balanced Pixi, RAF, visualization-loop, and keyboard lifecycle behavior.

Known legacy paths: inert streaming state remains in `gameStore`; Canvas2D is not used by production; mock Observatory hydration remains test/demo-only.

Next recommended verification: manually hold ArrowRight and press Space in the Studio after an Observatory round trip, confirming normal movement, jump, gravity, collision, and camera behavior.

### WO-S11-003 Current Behavior

- World Explorer entity rows are native buttons backed by one `selectedEntityId`
  in `gameStore`.
- Inspector resolves the selected entity from the current RuntimeWorldStore,
  displaying id, type, PositionComponent coordinates, and generic component
  properties without copying or mutating Runtime data.
- Runtime sink updates refresh the same Studio revision signal, so selected
  entity coordinates follow gameplay updates.
- World replacement clears selection when the selected id disappears and
  retains it when the same id remains in the new world.
- Observatory remains independent and continues to use its existing runtime
  binding.

Manual follow-up verification confirms that pressing Enter in the command bar
submits successfully; clicking Generate remains supported as well.

Next recommended verification: select player, hold ArrowRight, select enemy,
replace the world, and confirm selection clearing/retention behavior.

### WO-S11-004 Current Behavior

- `KeyboardInputProvider` listens once on `window`, ignores keyboard events from
  text/UI controls, clears pressed keys on editable focus, and detaches all
  listeners on Studio unmount.
- MarioWorld gameplay coordinates use `x → right`, `y → down`; Jump decreases
  y, Gravity increases y, and GroundCollision clamps at `groundY = 400`.
- Studio passes a `(400,300)` viewport anchor to the Pixi renderer. Camera
  follow changes the container transform only, leaving world positions intact.
- MarioWorld remains laid out at player `(80,300)`, terrain `(160,400)`,
  platform `(300,320)`, enemy `(380,360)`, goal `(650,300)`, checkpoint
  `(500,320)`.

Known gap: browser manual verification is still required for the final Studio
input and camera scenarios.

Next recommended verification: type Space and Arrow keys in the command input,
blur it, then verify movement, upward jump, downward gravity, landing, and
camera readability.

### WO-S11-006 Current Behavior

- World coordinates remain `x → right`, `y → down`; renderer screen transforms
  preserve those directions.
- Camera starts with a stable vertical baseline, holds the player in a 240px
  horizontal dead zone, follows only after horizontal threshold exit, and does
  not follow small jumps vertically.
- The runtime path is `PlayerController → Jump(edge) → Gravity(velocity) →
  VerticalMotion(position) → GroundCollision(clamp/reset)`.
- Space applies one negative `VelocityComponent.y` only on a press edge and
  only while grounded; gravity accelerates it toward positive y; landing sets
  it back to zero.

Automated platformer coverage is frozen on the v1.107 contract: Jump writes
upward velocity on a Space press edge, Gravity changes velocity, VerticalMotion
applies velocity to position, GroundCollision clamps and resets velocity, and
the camera uses a horizontal dead zone with stable vertical framing.

Code Complete: YES. Product Verified: PENDING browser checklist.

Next recommended verification: generate MarioWorld and verify right/left
movement, progressive jump/apex/fall/landing, held-Space behavior, second jump,
and command-input isolation in the browser; automated semantic regression is
now green.

### WO-S11-005 Current Behavior

- Studio Inspector resolves the selected entity by `selectedEntityId` from the
  current `RuntimeWorldStore`; it does not retain an entity snapshot.
- Selected entities show id, type, component count, authoritative Position x/y,
  and all RuntimeComponents in deterministic order with Position first.
- `RuntimeComponentInspector` renders primitive values, null/undefined,
  primitive arrays, nested objects, and nested arrays as bounded key/value rows.
- Inspector updates follow `renderVersion`, so runtime movement and same-id
  world replacement show current component data; removed ids still clear
  selection.
- The Inspector remains read-only and Observatory remains on its existing
  independent ViewModel path.

Manual follow-up verification confirms that command-bar Enter submission works;
clicking Generate continues to submit successfully.

Next recommended verification: inspect player and enemy, then exercise live
movement/jump updates and same-id/different-id world replacement in the Studio.

### WO-S11-009 Current Behavior

- The viewport measures its actual content container and applies the dimensions
  to the Pixi renderer on mount and through a cleaned-up `ResizeObserver`.
- The existing camera dead zone and world coordinates remain unchanged; the
  Studio camera anchor follows the measured viewport center.
- Empty Studio shows restrained no-world copy; generated worlds show the Pixi
  canvas with truthful `Running` state and only Arrow Keys/Space hints.
- Pixi application, visualization runner, loop, keyboard input, and observer
  are balanced across unmount/remount. World replacement continues to use the
  same RuntimeWorldStore.

Code Complete: YES. Product Verified: YES.

Next recommended verification: continue monitoring viewport behavior during
future Studio changes; the WO-S11-009 browser checklist is complete.

### WO-S11-008 Current Behavior

- Inspector defaults to Entity mode and preserves the existing selected-entity,
  Position, and component inspection behavior.
- Observatory mode is a compact Studio-native surface backed by the existing
  `ObservatoryRuntimeBinding` and `observatoryData` ViewModel.
- Runtime shows the real world id, entity count, ids, and types; unsupported
  Trace, Timeline, History, Diff, and Event Stream sections say that data is
  unavailable rather than rendering mock content.
- Mode switching is local UI state and does not change RuntimeWorldStore,
  selected entity state, command activity, or Pixi lifecycle.
- `/observatory` remains the full/deep Observatory SPA route.

Observatory production audit: Overview EMPTY/PARTIAL; Trace EMPTY; Timeline
EMPTY; History EMPTY; Diff EMPTY; Runtime REAL; Event Stream EMPTY.

Code Complete: YES. Product Verified: PENDING browser checklist.

Next recommended verification: generate MarioWorld, switch Inspector between
Entity and Observatory, confirm six live entities and live position updates,
open Full Observatory, return to Studio, and confirm the same world remains.

### WO-S11-010 Baseline Freeze

- Architecture version remains v1.110; this WO freezes and documents the
  existing implementation rather than adding product capability.
- Production path: `StudioCommandBar → gameStore → DefaultCommandExecutor →
  IntentRouter → CreateWorldRuntimeExecutor → CreateWorldPipeline →
  GameIntentExtractor → SemanticWorldGenerator → WorldTemplateCatalog →
  SemanticGameDslBuilder → RuntimeProjection → RuntimeWorldStore → Runtime
  systems → RuntimeVisualizationLoop → PixiEntityRenderer`.
- `RuntimeWorldStore` is the authoritative mutable world owner for Studio,
  Inspector, Explorer, Observatory binding, renderer provider, and the AI
  create-world executor. `Runtime.world` is only its initial compatibility
  object, not a second Studio world source.
- `创建 MarioWorld` produces exactly six deterministic ids: `player`,
  `terrain`, `platform`, `enemy`, `goal`, and `checkpoint`; the DSL layout
  supplies PositionComponents.
- Production Studio does not reach the legacy Canvas2D renderer, MockPlanner,
  or mock Observatory loader. Those remain test/demo or compatibility paths;
  unsupported Observatory telemetry remains explicitly empty.
- Browser verification confirmed empty state, six-entity creation, Explorer
  selection, read-only Inspector data, Studio/Full Observatory runtime data,
  route round-trip, one canvas, and manual ArrowRight/ArrowLeft/Space gameplay:
  movement, jump, gravity, landing, input isolation, and live Inspector
  position updates.

Generation classification: intent routing/extraction are rule-based; world
generation is deterministic template-based; DSL compilation and runtime
projection are deterministic; no live LLM output participates in Mario.

Code Complete: YES. Product Verified: YES.

Next recommended verification: S12-007 should add a server composition-root entrypoint and deployment startup wiring around this host, then manually verify Studio → Gateway → candidate → Pixi with a fake provider.
editing and persistence remain explicitly out of this frozen baseline.

---

## Completed Work Orders

### Sprint 1 — Runtime Foundation

| ID        | Title                   |
| --------- | ----------------------- |
| WO-S1-001 | Create Entity           |
| WO-S1-002 | Runtime Owns World      |
| WO-S1-003 | Move Entity             |
| WO-S1-004 | Runtime Action Registry |
| WO-S1-005 | Runtime Unit Tests      |
| WO-S1-006 | Runtime Query Layer     |
| WO-S1-007 | Planner Interface       |
| WO-S1-008 | PlannerResult           |
| WO-S1-009 | Sprint 1 Freeze         |

### Sprint 2 — AI Foundation

| ID        | Title                       |
| --------- | --------------------------- |
| WO-S2-001 | AI Pipeline Interface       |
| WO-S2-002 | PipelineContext             |
| WO-S2-003 | AIRequest                   |
| WO-S2-004 | PromptBuilder               |
| WO-S2-005 | Pipeline Events             |
| WO-S2-006 | Prompt Modules              |
| WO-S2-007 | Memory Interface            |
| WO-S2-008 | Memory Integration          |
| WO-S2-009 | Planner Provider            |
| WO-S2-010 | AI Configuration            |
| WO-S2-011 | OpenAI Planner Provider     |
| WO-S2-012 | Responses API Migration     |
| WO-S2-013 | DeepSeek Planner Provider   |
| WO-S2-014 | Provider Factory            |
| WO-S2-015 | Structured Output Validator |
| WO-S2-016 | Environment Configuration   |
| WO-S2-017 | Pipeline Integration Tests  |
| WO-S2-018 | Prompt Snapshot Tests       |
| WO-S2-019 | System Prompt Module        |
| WO-S2-020 | World State Prompt Module   |

### Sprint 3 — AI Integration & Polish

| ID        | Title                           |
| --------- | ------------------------------- |
| WO-S3-001 | Streaming Provider Interface    |
| WO-S3-002 | Streaming Pipeline              |
| WO-S3-003 | Streaming UI Integration        |
| WO-S3-004 | Planner Retry & Self-Healing    |
| WO-S3-005 | Tool Calling Foundation         |
| WO-S3-006 | Runtime Tool Execution          |
| WO-S3-007 | Provider-native Tool Calling    |
| WO-S3-008 | Agent Loop Foundation           |
| WO-S3-009 | Pipeline Agent Loop Integration |
| WO-S3-010 | Multi-Step Agent Loop           |
| WO-S3-011 | Structured Observation Context  |
| WO-S3-012 | Planner Observation Awareness   |
| WO-S3-013 | Reflection Foundation           |
| WO-S3-014 | Reflection Prompt Integration   |
| WO-S3-015 | Structured Prompt Context       |
| WO-S3-016 | Prompt Renderer Foundation      |
| WO-S3-017 | Context Compression Foundation  |
| WO-S3-018 | Prompt Budget Foundation        |
| WO-S3-019 | Memory Ranking Foundation       |
| WO-S3-020 | Prompt Assembly Integration     |
| WO-S3-021 | Sprint 3 Freeze                 |

### Sprint 4 — AI Polish & Production Readiness

| ID        | Title                                    |
| --------- | ---------------------------------------- |
| WO-S4-000 | Project Development Standards Foundation |
| WO-S4-001 | Prompt Selection Foundation              |
| WO-S4-002 | Prompt Selection Consumption             |
| WO-S4-003 | Prompt Compression Consumption           |
| WO-S4-004 | Prompt Budget Token Estimation           |
| WO-S4-005 | Provider Budget Foundation               |
| WO-S4-006 | Provider Budget Consumption              |
| WO-S4-007 | AI Configuration Foundation              |
| WO-S4-008 | AI Configuration Consumption             |
| WO-S4-009 | BuilderOptions Foundation                |
| WO-S4-010 | BuilderOptions Consumption               |
| WO-S4-011 | Sprint 4 Architecture Review             |
| WO-S4-012 | Sprint 4 Freeze                          |

### Sprint 5 — Post-Freeze Capabilities

| ID        | Title                                 |
| --------- | ------------------------------------- |
| WO-S5-001 | Intent Analysis Foundation            |
| WO-S5-002 | Rule-Based Intent Analyzer            |
| WO-S5-003 | Intent Consumption                    |
| WO-S5-004 | Intent Rendering Foundation           |
| WO-S5-005 | Intent Prompt Integration             |
| WO-S5-006 | Entity Recognition Foundation         |
| WO-S5-007 | Rule-Based Entity Analyzer            |
| WO-S5-008 | Entity Consumption                    |
| WO-S5-009 | Entity Rendering Foundation           |
| WO-S5-010 | Entity Prompt Integration             |
| WO-S5-011 | Semantic Context Foundation           |
| WO-S5-012 | Semantic Context Consumption          |
| WO-S5-013 | Semantic Context Rendering Foundation |
| WO-S5-014 | Semantic Context Prompt Integration  |
| WO-S5-015 | Prompt Strategy Foundation           |
| WO-S5-016 | Prompt Strategy Consumption          |
| WO-S5-017 | Prompt Strategy Rendering Foundation |
| WO-S5-018 | Prompt Strategy Prompt Integration   |
| WO-S5-019 | Create Strategy                        |
| WO-S5-020 | Query Strategy                         |
| WO-S5-021 | Modify Strategy                        |
| WO-S5-022 | Delete Strategy                        |
| WO-S5-023 | Strategy Module Foundation             |
| WO-S5-024 | Strategy Module Consumption            |
| WO-S5-025 | Strategy Module Rendering Foundation   |
| WO-S5-026 | Strategy Module Prompt Integration      |
| WO-S5-027 | Dynamic Strategy Selection Foundation   |
| WO-S5-028 | Score Based Strategy Selection           |
| WO-S5-029 | Strategy Selection Result Consumption   |
| WO-S5-030 | Weighted Strategy Evaluator             |
| WO-S5-031 | Strategy-Aware Prompt Assembly Foundation |
| WO-S5-032 | Strategy-Aware Prompt Assembly Consumption |
| WO-S5-033 | Create Prompt Assembly Strategy |
| WO-S5-034 | Create Prompt Assembly Strategy Consumption |
| WO-S5-035 | Query Prompt Assembly Strategy |
| WO-S5-036 | Modify Prompt Assembly Strategy |
| WO-S5-037 | Delete Prompt Assembly Strategy |
| WO-S5-038 | Strategy Selection Rendering Foundation |
| WO-S5-039 | Dynamic Strategy Selection Consumption |
| WO-S5-040 | Section Priority Foundation |
| WO-S5-041 | Prompt Assembly Planner Consumption |
| WO-S5-042 | Priority-Aware Prompt Assembly |
| WO-S5-043 | Strategy-Aware Prompt Assembly Planner |
| WO-S5-044 | Prompt Assembly Plan Rendering Foundation |
| WO-S5-045 | Prompt Assembly Plan Rendering Consumption |
| WO-S5-046 | Prompt Assembly Optimizer Foundation |
| WO-S5-047 | Prompt Assembly Optimizer Consumption |
| WO-S5-048 | Prompt Assembly Plan Diff Foundation |
| WO-S5-049 | Prompt Assembly Plan Diff Consumption |
| WO-S5-050 | Prompt Assembly Snapshot Foundation |
| WO-S5-051 | Prompt Assembly Snapshot Consumption |
| WO-S5-052 | Prompt Inspector Foundation |
| WO-S5-053 | Prompt Inspector Consumption |
| WO-S5-054 | Prompt Inspector Rendering Foundation |
| WO-S5-055 | Prompt Inspector Rendering Consumption |
| WO-S5-056 | Prompt Inspector Export Foundation |
| WO-S5-057 | Prompt Inspector Export Consumption |
| WO-S5-058 | Prompt Assembly Trace Foundation |
| WO-S5-059 | Prompt Assembly Trace Consumption |
| WO-S5-060 | Prompt Assembly Trace Diff Foundation |
| WO-S5-061 | Prompt Assembly Trace Diff Consumption |
| WO-S5-062 | Prompt Assembly Trace Rendering Foundation |
| WO-S5-063 | Prompt Assembly Trace Renderer Consumption |
| WO-S5-064 | Prompt Assembly Trace Export Foundation |
| WO-S5-065 | Prompt Assembly Trace Export Consumption |
| WO-S5-066 | Prompt Assembly Timeline Foundation |
| WO-S5-067 | Prompt Assembly Timeline Consumption |
| WO-S5-068 | Prompt Assembly Timeline Diff Foundation |
| WO-S5-069 | Prompt Assembly Timeline Diff Consumption |
| WO-S5-070 | Prompt Assembly Timeline Renderer Foundation |
| WO-S5-071 | Prompt Assembly Timeline Renderer Consumption |
| WO-S5-072 | Prompt Assembly Timeline Export Foundation |
| WO-S5-073 | Prompt Assembly Timeline Export Consumption |
| WO-S5-074 | Prompt Assembly Timeline Snapshot Foundation |
| WO-S5-075 | Prompt Assembly Timeline Snapshot Consumption |
| WO-S5-076 | Prompt Assembly History Foundation |
| WO-S5-077 | Prompt Assembly History Consumption |
| WO-S5-078 | Prompt Assembly History Diff Foundation |
| WO-S5-079 | Prompt Assembly History Diff Consumption |
| WO-S5-080 | Prompt Assembly History Renderer Foundation |
| WO-S5-081 | Prompt Assembly History Renderer Consumption |
| WO-S5-082 | Prompt Assembly History Export Foundation |
| WO-S5-083 | Prompt Assembly History Export Consumption |

### Sprint 6 — Observatory UI

| ID        | Title                                  |
| --------- | -------------------------------------- |
| WO-S6-001 | Observatory Shell Foundation           |
| WO-S6-002 | Observatory Overview Dashboard Foundation |
| WO-S6-003 | Observatory Trace Viewer Foundation         |
| WO-S6-004 | Observatory Timeline Viewer Foundation       |
| WO-S6-005 | Observatory History Viewer Foundation         |
| WO-S6-006 | Observatory Diff Viewer Foundation           |
| WO-S6-006.5 | Observatory I18n Foundation              |
| WO-S6-007 | Observatory Runtime Viewer Foundation         |
| WO-S6-008 | Observatory Live Event Stream Foundation         |
| WO-S6-009 | Observatory Runtime Entity Inspector Foundation         |
| WO-S6-010 | Observatory Trace Graph Foundation         |
| WO-S6-011 | Observatory World Graph Foundation         |
| WO-S6-012 | Observatory Data Adapter Foundation         |
| WO-S6-013 | Observatory Overview Real Data Integration  |
| WO-S6-014 | Observatory Trace Real Data Integration   |
| WO-S6-015 | Observatory Timeline Real Data Integration |
| WO-S6-016 | Observatory History Real Data Integration  |
| WO-S6-017 | Observatory Diff Real Data Integration     |
| WO-S6-018 | Observatory Runtime Real Data Integration  |
| WO-S6-019 | Observatory Event Stream Data Integration  |
| WO-S6-020 | Observatory Metadata Bridge Foundation     |
| WO-S6-021 | Observatory Metadata Bridge Consumption    |
| WO-S6-022 | Observatory Mapping Layer Foundation      |
| WO-S6-023 | Observatory Mapping Layer Consumption     |
| WO-S6-024 | Prompt Metadata Contract Foundation      |
| WO-S6-025 | Prompt Observatory Metadata Consumption |
| WO-S6-026 | Prompt Metadata Emission Foundation     |
| WO-S6-027 | Prompt Metadata Emission Consumption |
| WO-S6-028 | Real Metadata Activation |

---

### Sprint 7 — DSL Preparation

| ID | Title |
| -- | ----------------------- |
| WO-S7-001 | Prompt Assembly Domain Model Foundation |

---

### Sprint 8 — Game DSL

| ID | Title |
| -- | ----------------------- |
| WO-S8-001 | Game DSL Foundation |
| WO-S8-002 | Prompt Assembly To Game DSL Builder Foundation |
| WO-S8-003 | Game DSL Runtime Projection Foundation |
| WO-S8-004 | Runtime Component Model Foundation |
| WO-S8-005 | Semantic Game World DSL Foundation |
| WO-S8-006 | Semantic World To Game DSL Builder Foundation |
| WO-S8-007 | Semantic World Generator Foundation |
| WO-S8-008 | Runtime System Foundation |
| WO-S8-009 | Runtime Execution Loop Foundation |
| WO-S8-010 | Runtime World Mutation Foundation |
| WO-S8-011 | Position Component Foundation |
| WO-S8-012 | Movement System Foundation |
| WO-S8-013 | Semantic World Generator Enrichment Foundation |
| WO-S8-014 | Prompt Entity Extraction Foundation |
| WO-S8-015 | Prompt Entity Count Extraction Foundation |
| WO-S8-016 | Game Intent Extraction Foundation |

---

### Sprint 9 — Renderer Foundation

| ID | Title |
| -- | ----------------------- |
| WO-S9-001 | Pixi Renderer Foundation |
| WO-S9-002 | Runtime → Renderer Sync Foundation |
| WO-S9-003 | Position Render Model Foundation |
| WO-S9-004 | Pixi Entity Visualization Foundation |
| WO-S9-005 | Runtime Visualization Loop Foundation |
| WO-S9-006 | Real-Time Visualization Loop Foundation |
| WO-S9-007 | Entity Visual Mapping Foundation |
| WO-S9-008 | Keyboard Input Foundation |
| WO-S9-009 | Player Controller System Foundation |
| WO-S9-010 | Playable Game Bootstrap Foundation |
| WO-S9-012 | Gravity System Foundation |
| WO-S9-013 | Ground Collision Foundation |
| WO-S9-014 | Jump System Foundation |
| WO-S9-015 | Camera Follow Foundation |
| WO-S9-016 | Platform World Rendering Foundation |
| WO-S8-016 | Game Intent Extraction Foundation |

---

### Sprint 10 — AI Generation Pipeline

| ID | Title |
| -- | ----------------------- |
| WO-S10-001 | Intent Router Foundation |
| WO-S10-002 | Create World Command Pipeline Foundation |
| WO-S10-003 | Runtime World Injection Foundation |
| WO-S10-004 | Web Command Routing Integration |
| WO-S10-006 | Observatory Runtime Migration |
| WO-S10-008 | Game Intent → Semantic World Alignment Foundation |
| WO-S10-009 | Platform World Spatial Layout Foundation |
| WO-S10-010 | Playable Platformer Runtime Wiring |
| WO-S10-011 | Observatory Real Runtime Binding Foundation |
| WO-S10-012 | Observatory SPA Runtime Session Integration |

---

### Sprint 11 - Genesis Studio Experience

| ID | Title |
| -- | ----------------------- |
| WO-S11-001 | Genesis Studio Shell Foundation |

---

## Runtime Public API

```
Runtime()
  .world                → World (readonly)
  .query                → RuntimeQuery
    .findById(id)       → Entity | undefined
    .findByType(type)   → Entity[]
  .applyActions(actions) → void
  .generateId()         → string

RuntimeSystem (interface)
  .name                 → string (readonly)
  .update(world)        → World

RuntimeSystemRegistry (interface)
  .register(system)     → void
  .getSystems()         → readonly RuntimeSystem[]
  .clear()              → void

DefaultRuntimeSystemRegistry()
  .register(system)     → void
  .getSystems()         → readonly RuntimeSystem[] (frozen)
  .clear()              → void

NoOpRuntimeSystem()
  .name                 → 'NoOp' (readonly)
  .update(world)        → World (identity, frozen)

ExecutionTickResult (interface)
  .world                → World (readonly, frozen)
  .executedSystems      → readonly string[] (frozen)
  .systemCount          → number

RuntimeExecutionLoop (interface)
  .tick(world)          → World
  .tickWithResult(world) → ExecutionTickResult

DefaultRuntimeExecutionLoop(registry)
  .tick(world)          → World (all systems in order)
  .tickWithResult(world) → ExecutionTickResult (frozen)

WorldMutator (interface)
  .addEntity(world, entity)   → World (frozen, entity appended)
  .removeEntity(world, id)    → World (frozen, entity removed)
  .replaceEntity(world, entity) → World (frozen, entity replaced)

DefaultWorldMutator()
  .addEntity(world, entity)   → World (frozen, entity frozen before append)
  .removeEntity(world, id)    → World (frozen, unchanged if id not found)
  .replaceEntity(world, entity) → World (frozen, appends if id not found)
```

### Action Types

| Action         | Fields                                         |
| -------------- | ---------------------------------------------- |
| `CreateEntity` | `entityType: string`, `x: number`, `y: number` |
| `MoveEntity`   | `id: string`, `x: number`, `y: number`         |

### Handler Registry

| Action Type    | Handler               |
| -------------- | --------------------- |
| `CreateEntity` | `CreateEntityHandler` |
| `MoveEntity`   | `MoveEntityHandler`   |

---

## AI Public API

### Pipeline

```typescript
interface Pipeline {
  execute(context: PipelineContext): Promise<PipelineContext>
  stream(context: PipelineContext): Promise<PipelineContext>
}
```

### PipelineContext

```typescript
interface PipelineContext {
  input: string
  plannerResult?: PlannerResult
  memory?: Memory
  worldState?: string
  metadata?: Record<string, unknown>
}
```

### AIRequest

```typescript
interface AIRequest {
  prompt: string
  metadata?: Record<string, unknown>
}
```

### Planner

```typescript
interface Planner {
  plan(request: AIRequest): Promise<PlannerResult>
}

interface PlannerResult {
  actions: Action[]
  reasoning?: string
  metadata?: Record<string, unknown>
}
```

### PlannerProvider

```typescript
interface PlannerProvider {
  complete(request: AIRequest): Promise<PlannerResult>
}

class MockPlannerProvider implements PlannerProvider {
  /* keyword matching */
}
class OpenAIPlannerProvider implements PlannerProvider {
  /* OpenAI Responses API */
}
class DeepSeekPlannerProvider implements PlannerProvider {
  /* DeepSeek via OpenAI-compatible Chat Completions */
}

class ProviderFactory {
  static create(config: AIConfiguration): PlannerProvider
}
```

### AIConfiguration

```typescript
interface AIConfiguration {
  provider: string
  model: string
  temperature: number
  /** @deprecated Use maxOutputTokens instead. Kept for backward compatibility. */
  maxTokens: number
  maxOutputTokens?: number
  streaming?: boolean
  toolCalling?: boolean
  apiKey?: string
  baseURL?: string
  allowBrowser?: boolean
}

class DefaultAIConfiguration implements AIConfiguration {
  readonly provider = 'mock'
  readonly model = 'mock'
  readonly temperature = 0
  readonly maxTokens = 0
  readonly streaming = false
  readonly toolCalling = false
  readonly maxOutputTokens = undefined
  readonly apiKey = undefined
  readonly baseURL = undefined
  readonly allowBrowser = undefined
}
```

### PromptBuilder

```typescript
interface PromptBuilder {
  build(context: PipelineContext): Promise<AIRequest>
}

interface PromptModule {
  build(context: PipelineContext): Promise<string>
  buildContext?(context: PipelineContext): Promise<Partial<PromptContext>>
}

interface PromptRenderer {
  render(context: PromptContext): string
}

// Available modules:
//   SystemPromptModule       — system instructions (Project Genesis planner, JSON output)
//   UserInputModule          — returns context.input
//   MemoryPromptModule       — reads "conversation" from Memory
//   WorldStatePromptModule   — reads context.worldState
//   ObservationPromptModule  — reads context.metadata.observations, formats as "## Previous Observations"
//   ReflectionPromptModule   — reads context.metadata.reflectionResults, formats as "## Previous Reflection"
//
// All built-in modules also implement buildContext():
//   SystemPromptModule.buildContext()  → { system: "..." }
//   UserInputModule.buildContext()     → { userInput: "..." }
//   MemoryPromptModule.buildContext()  → { memory: "..." }
//   WorldStatePromptModule.buildContext() → { worldState: "..." }
//   ObservationPromptModule.buildContext() → { observations: "..." }
//   ReflectionPromptModule.buildContext()  → { reflections: "..." }
//
// PromptBuilder collects PromptContext → PromptSelection decides which sections → PromptRenderer renders to string
//
// DefaultPromptBuilder now accepts optional PromptRenderer, PromptCompression, MemoryRanking, PromptBudget, PromptSelection, ProviderBudget, and AIConfiguration
//   (defaults to DefaultPromptRenderer — renders in insertion order)
//   (defaults to DefaultPromptCompression — strips undefined/empty fields)
//   (defaults to DefaultMemoryRanking — fixed priority ranking)
//   (defaults to DefaultPromptBudget — character count budget)
//   (defaults to DefaultPromptSelection — rule-based budget-aware selection)
//   (defaults to no ProviderBudget — no provider budget lookup)
//   (defaults to no AIConfiguration — falls back to 'openai' provider)
//
// BuilderOptions consolidates all optional params into a single options object
//   (consumed by DefaultPromptBuilder constructor since WO-S4-010)
//   Recommended form: new DefaultPromptBuilder(modules, { renderer, compression, ... })
//   Legacy positional form preserved for backward compatibility
//
// Observation formatting is owned by PromptBuilder:
//   formatObservations(obs: Observation[]): string         — rich format for ObservationPromptModule
//   formatObservationsInline(obs: Observation[]): string   — compact format for AgentLoop iterations
//
// Reflection formatting is owned by PromptBuilder:
//   formatReflectionResults(results: ReflectionResult[]): string  — formats as "## Previous Reflection"
//
// PromptContext provides structured access:
//   PromptContext { system?, userInput?, memory?, worldState?, observations?, reflections? }
//   DefaultPromptBuilder.buildContext(context) → PromptContext
//   serializePromptContext(ctx: PromptContext) → string  (delegates to DefaultPromptRenderer)
//
// PromptRenderer is the ONLY text renderer:
//   PromptRenderer.render(context: PromptContext): string
//   DefaultPromptRenderer — default implementation (insertion order for builder, canonical order via renderWithOrder)
//   Future: MarkdownPromptRenderer, XMLPromptRenderer, JSONPromptRenderer, etc.
```

### Pipeline Events

```typescript
type PipelineEventType =
  | 'PipelineStarted'
  | 'PromptBuilt'
  | 'PlannerStarted'
  | 'StreamChunk'
  | 'PlannerRetryStarted'
  | 'PlannerRetryFinished'
  | 'ToolCallStarted'
  | 'ToolCallFinished'
  | 'PlannerFinished'
  | 'PipelineFinished'
  | 'AgentLoopStarted'
  | 'LoopIterationStarted'
  | 'LoopIterationFinished'
  | 'AgentLoopFinished'

interface PipelineEvent {
  type: PipelineEventType
  timestamp: number
  payload?: Record<string, unknown>
}

interface PipelineEventListener {
  onEvent(event: PipelineEvent): void
}

class PipelineEventEmitter {
  subscribe(listener: PipelineEventListener): void
  unsubscribe(listener: PipelineEventListener): void
  emit(event: PipelineEvent): void
}
```

### StreamingPlannerProvider

```typescript
interface StreamingPlannerProvider extends PlannerProvider {
  stream(request: AIRequest): AsyncIterable<string>
}

class MockStreamingProvider implements PlannerProvider, StreamingPlannerProvider {
  /* char-by-char streaming */
}
```

### Observation

```typescript
interface Observation {
  toolName: string
  toolInput: unknown
  toolOutput: unknown
  timestamp: number
  iteration: number
  success?: boolean
}
```

- Structured record of a tool execution within the AgentLoop
- Maintained across all iterations by DefaultAgentLoop
- Passed to Planner via AIRequest.metadata.observations
- Prompt formatting owned by PromptBuilder (ObservationPromptModule + formatObservations)

### Reflection

```typescript
interface Reflection {
  execute(context: ReflectionContext): Promise<ReflectionResult>
}

interface ReflectionContext {
  plannerResult: PlannerResult
  observations: Observation[]
  steps: LoopStep[]
  iteration: number
  maxIterations: number
  metadata?: Record<string, unknown>
}

interface ReflectionResult {
  reasoning: string
  continueLoop: boolean
  metadata?: Record<string, unknown>
}

class DefaultReflection implements Reflection {
  // Simple rule-based reflection:
  // - Actions present → continueLoop=false
  // - Max iterations reached → continueLoop=false
  // - Otherwise → continueLoop=true
}
```

- Independent capability: no Runtime, Renderer, Provider, or Planner dependency
- Results recorded in AgentLoopResult.reflectionResults
- Currently does NOT affect AgentLoop behavior (future WO)
- DefaultReflection provides deterministic baseline

### AgentLoop

```typescript
interface AgentLoop {
  execute(context: AgentLoopContext): Promise<AgentLoopResult>
}

interface AgentLoopContext {
  request: AIRequest
  planner: Planner
  toolRegistry?: ToolRegistry
  maxIterations: number
  metadata?: Record<string, unknown>
}

interface AgentLoopResult {
  plannerResult: PlannerResult
  steps: LoopStep[]
  iterations: number
  finished: boolean
  reasoning?: string
}

interface LoopStep {
  iteration: number
  thought?: string
  toolName?: string
  toolInput?: unknown
  toolOutput?: unknown
  plannerResult?: PlannerResult
}

class DefaultAgentLoop implements AgentLoop {
  // Multi-step execution with structured Observation context
  // Each iteration: attach observations → plan → check actions → execute tools → observe → repeat
  // Observations passed to planner via request.metadata.observations
  // Observation prompt formatting delegated to PromptBuilder (formatObservationsInline)
  // Optional Reflection: evaluates planning state, recorded in reflectionResults (no behavior impact)
  // LoopStep references Observation objects (no data duplication)
  // Stop conditions: Planner returns actions, or maxIterations reached
  // Events: AgentLoopStarted → LoopIterationStarted → [ToolExecuted] → [ObservationRecorded] → LoopIterationFinished → ... → AgentLoopFinished
}
```

### Memory

```typescript
interface Memory {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

class DefaultMemory implements Memory {
  // Map-based, no persistence
}
```

---

## Current Architecture (v0.48)

```
User Natural Language
    ↓
Pipeline.execute(context)
    ↓
PipelineContext { input, memory?, metadata?, worldState? }
    ↓
PromptBuilder.build(context)         ← uses PromptModule[] + IntentAnalyzer + IntentRenderer + EntityAnalyzer + EntityRenderer + SemanticContextBuilder
    ├── IntentAnalyzer.analyze(input) ← consumed: IntentResult → metadata.promptAssembly.intent
    ├── IntentRenderer.render(intent) ← rendered: intentRendered → PromptContext + metadata
    ├── EntityAnalyzer.analyze(input) ← consumed: EntityResult → metadata.promptAssembly.entity
    ├── EntityRenderer.render(entity) ← rendered: entityRendered → PromptContext + metadata
    ├── SemanticContextBuilder.build() ← combined: SemanticContext → metadata.promptAssembly.semantic
    ├── SystemPromptModule            ← Project Genesis system instructions
    ├── UserInputModule               ← returns context.input
    ├── MemoryPromptModule            ← reads "conversation" from Memory
    └── WorldStatePromptModule        ← reads context.worldState
    ↓
DefaultPromptRenderer.render(context) ← renders intentRendered as "User Intent:" + entityRendered as "Entities:" section
    ↓
AIRequest { prompt: "User Intent:\n- Create\n\nEntities:\n- Tree\n\nYou are...\n\nUser Input:\n...", metadata.promptAssembly }
    ↓
Planner.plan(request)
    ↓
ProviderFactory.create(config)        ← selects provider from AIConfiguration.provider
    ├── MockPlannerProvider           ← keyword matching
    ├── OpenAIPlannerProvider         ← OpenAI Responses API
    └── DeepSeekPlannerProvider       ← DeepSeek Chat Completions API
    ↓
PlannerResult { actions, ... }
    ↓
StructuredOutputValidator.validate(parsed)  ← validates action schema
    ↓
Runtime.applyActions(actions)        ← dispatches through Action Handlers
    ↓
World (owned by Runtime)
    ↓
Renderer.renderWorld(ctx, world)     ← reads World, draws to Canvas

Events (fire-and-forget during Pipeline execution):
  PipelineStarted → PromptBuilt → PlannerStarted → PlannerFinished → PipelineFinished

  During streaming (when using Pipeline.stream()):
    StreamChunk (emitted while provider generates response)

  During retry (when using RetryPlanner):
    PlannerRetryStarted → PlannerRetryFinished (emitted per retry attempt)

  During tool calling (when using ToolCallPlanner):
    ToolCallStarted → ToolCallFinished (emitted per planning request)

  During agent loop (when using DefaultAgentLoop):
    AgentLoopStarted → LoopIterationStarted → LoopIterationFinished → AgentLoopFinished

Memory (optional, in PipelineContext):
  DefaultMemory stores conversation history under "conversation" key
  Used by MemoryPromptModule to provide multi-turn context

Configuration:
  AIConfiguration → ProviderFactory.create(config) → PlannerProvider
  DefaultAIConfiguration: provider="mock", model="mock"
  Environment variables (VITE_AI_PROVIDER, VITE_AI_API_KEY, etc.) → createAIConfiguration()
```

### Provider Hierarchy

```
PlannerProvider (interface)
  ├── MockPlannerProvider       — keyword matching, no API required
  ├── OpenAIPlannerProvider     — OpenAI Responses API (client.responses.create)
  └── DeepSeekPlannerProvider   — OpenAI-compatible Chat Completions (client.chat.completions.create)

RetryPlanner (decorator, implements Planner)
  └── wraps any PlannerProvider with automatic retry
```

Provider selection is handled by `ProviderFactory.create(config)` based on `config.provider`:

- `"mock"` → MockPlannerProvider
- `"openai"` → OpenAIPlannerProvider
- `"deepseek"` → DeepSeekPlannerProvider
- Unknown → throws `Error`

### Prompt Module Pipeline

```
PromptBuilder modules (in order):
  1. SystemPromptModule     — system instructions, action schema, JSON format
  2. UserInputModule         — user natural language input
  3. MemoryPromptModule      — conversation history from Memory
  4. ReflectionPromptModule  — previous reflection results from context.metadata
  5. WorldStatePromptModule  — current world entities snapshot
  6. ObservationPromptModule — structured tool observations

PromptBuilder composition flow:
  PromptModule[6]
    ├── Each module.buildContext() → Partial<PromptContext>
    ├── Merge into unified PromptContext
    ├── IntentAnalyzer → pure analysis (user intents) ← (WO-S5-003)
    ├── IntentRenderer → pure rendering (intent as string) ← (WO-S5-004)
    ├── EntityAnalyzer → pure analysis (entity references) ← (WO-S5-008)
    ├── EntityRenderer → pure rendering (entities as string) ← (WO-S5-009)
    ├── SemanticContextBuilder → pure composition (intent + entity) ← (WO-S5-012)
    ├── MemoryRanking → pure measurement (ranks sections)
    ├── PromptBudget → pure measurement (measures sizes)
    ├── ProviderBudget → pure lookup (provider/model token capacity)
    ├── PromptSelection → decides which sections to preserve
    ├── PromptCompression → strips undefined/empty fields
    └── PromptRenderer → serializes to string → AIRequest

  PromptContext fields:
    system?, userInput?, memory?, worldState?, observations?, reflections?

  DefaultPromptBuilder.buildContext(context) → PromptContext (compressed, pipeline run)
  serializePromptContext(ctx: PromptContext) → string (standalone serialization)
```

Modules execute in-order. Each module produces both a string fragment (via build()) and a structured context contribution (via buildContext()). The builder serializes using module-specific context keys matching the module order.

### Architecture Rules

1. Runtime owns World. Only Runtime may mutate World.
2. Planner never mutates World. Planner produces PlannerResult.
3. Renderer never mutates World. Renderer reads World only.
4. Pipeline is the only AI entry point.
5. Pipeline stages communicate only through PipelineContext.
6. Pipeline never manually constructs AIRequest (delegates to PromptBuilder).
7. PromptBuilder composes AIRequest from PromptModule[] fragments.
8. Pipeline emits events. No component knows listeners.
9. Planner delegates to PlannerProvider. Provider is swappable via config.
10. AIConfiguration provides uniform settings across all providers.
11. Runtime mutations happen only through Action Handlers.
12. One Action → One Handler. No switch(action.type).
13. Query Layer is read-only. Never mutates World.
14. Every new abstraction begins with an interface.
15. Keep code simple.

---

## Known Technical Debt

See [TECH_DEBT.md](./TECH_DEBT.md) for full list.

Resolved during Sprint 1:

- ~~Planner Interface~~ (WO-S1-007)

Resolved during Sprint 2:

- ~~AI Pipeline Abstraction~~ (WO-S2-001, WO-S2-002)
- ~~AIRequest Input Model~~ (WO-S2-003)
- ~~PromptBuilder~~ (WO-S2-004)
- ~~Pipeline Events~~ (WO-S2-005)
- ~~Prompt Modules~~ (WO-S2-006)
- ~~Memory Interface~~ (WO-S2-007)
- ~~Memory Integration~~ (WO-S2-008)
- ~~Planner Provider~~ (WO-S2-009)
- ~~AI Configuration~~ (WO-S2-010)
- ~~OpenAI Planner Provider~~ (WO-S2-011)
- ~~Responses API Migration~~ (WO-S2-012)
- ~~DeepSeek Planner Provider~~ (WO-S2-013)
- ~~Provider Factory~~ (WO-S2-014)
- ~~Structured Output Validator~~ (WO-S2-015)
- ~~Environment Configuration~~ (WO-S2-016)
- ~~Pipeline Integration Tests~~ (WO-S2-017)
- ~~Prompt Snapshot Tests~~ (WO-S2-018)
- ~~System Prompt Module~~ (WO-S2-019)
- ~~World State Prompt Module~~ (WO-S2-020)

Key remaining items:

- Renderer uses inline switch on entity type (no Renderer Registry)
- World uses flat `Entity[]` array (no Entity Map)
- No undo / replay / snapshot support
- Runtime runs in main thread (no Worker Runtime)
- No server-side Runtime
- Prompt versioning missing
- ~~Streaming not implemented~~ **Resolved in WO-S3-001 through WO-S3-003**
- Provider retry policy absent
- No conversation memory persistence
- System prompt context window not tracked
- World snapshot token budget unknown
- No tool calling support
- No context compression for long conversations
- ~~`@genesis/ai` missing from `apps/web/package.json` dependencies (META-006)~~ **Resolved in WO-S2-021**
- `MockPlanner` naming inconsistent with actual role (META-006)
- ~~4 Sprint 2 ADRs missing: Structured Output Validator, Environment Config, System Prompt Module, Responses API Migration (META-006)~~ **Resolved in WO-S2-021**
- Provider parseResponse duplication (minor) (META-006)
- No compile-time enforcement of StructuredOutputValidator in new providers (META-006)
- Dead `apps/web/src/planner/` directory (META-006)

---

## ADRs Created

| ADR      | Title                           | File                                                   |
| -------- | ------------------------------- | ------------------------------------------------------ |
| ADR-0006 | AI Pipeline                     | `docs/adr/ADR-0006-ai-pipeline.md`                     |
| ADR-0007 | AIRequest Input Model           | `docs/adr/ADR-0007-airequest.md`                       |
| ADR-0008 | PromptBuilder                   | `docs/adr/ADR-0008-prompt-builder.md`                  |
| ADR-0009 | Prompt Modules                  | `docs/adr/ADR-0009-prompt-modules.md`                  |
| ADR-0010 | Pipeline Events                 | `docs/adr/ADR-0010-pipeline-events.md`                 |
| ADR-0011 | Memory Interface                | `docs/adr/ADR-0011-memory-interface.md`                |
| ADR-0012 | Planner Provider                | `docs/adr/ADR-0012-planner-provider.md`                |
| ADR-0013 | AI Configuration                | `docs/adr/ADR-0013-ai-configuration.md`                |
| ADR-0014 | Provider Factory                | `docs/adr/ADR-0014-provider-factory.md`                |
| ADR-0015 | World State Prompt              | `docs/adr/ADR-0015-world-state-prompt.md`              |
| ADR-0016 | Structured Output Validator     | `docs/adr/ADR-0016-structured-output-validator.md`     |
| ADR-0017 | Environment Configuration       | `docs/adr/ADR-0017-environment-configuration.md`       |
| ADR-0018 | System Prompt Module            | `docs/adr/ADR-0018-system-prompt-module.md`            |
| ADR-0019 | Responses API Migration         | `docs/adr/ADR-0019-responses-api-migration.md`         |
| ADR-0020 | Streaming UI Integration        | `docs/adr/ADR-0020-streaming-ui-integration.md`        |
| ADR-0021 | Planner Retry & Self-Healing    | `docs/adr/ADR-0021-planner-retry.md`                   |
| ADR-0022 | Tool Calling Foundation         | `docs/adr/ADR-0022-tool-calling.md`                    |
| ADR-0023 | Runtime Tool Execution          | `docs/adr/ADR-0023-runtime-tool-execution.md`          |
| ADR-0024 | Provider-native Tool Calling    | `docs/adr/ADR-0024-provider-native-tool-calling.md`    |
| ADR-0025 | Agent Loop Foundation           | `docs/adr/ADR-0025-agent-loop-foundation.md`           |
| ADR-0026 | Pipeline Agent Loop Integration | `docs/adr/ADR-0026-pipeline-agent-loop-integration.md` |
| ADR-0027 | Multi-Step Agent Loop           | `docs/adr/ADR-0027-multi-step-agent-loop.md`           |
| ADR-0028 | Structured Observation Context  | `docs/adr/ADR-0028-structured-observation-context.md`  |
| ADR-0029 | Planner Observation Awareness   | `docs/adr/ADR-0029-planner-observation-awareness.md`   |
| ADR-0030 | Reflection Foundation           | `docs/adr/ADR-0030-reflection-foundation.md`           |
| ADR-0031 | Reflection Prompt Integration   | `docs/adr/ADR-0031-reflection-prompt-integration.md`   |
| ADR-0032 | Structured Prompt Context       | `docs/adr/ADR-0032-structured-prompt-context.md`       |
| ADR-0033 | Prompt Renderer Foundation      | `docs/adr/ADR-0033-prompt-renderer-foundation.md`      |
| ADR-0034 | Context Compression Foundation  | `docs/adr/ADR-0034-context-compression-foundation.md`  |
| ADR-0035 | Prompt Budget Foundation        | `docs/adr/ADR-0035-prompt-budget-foundation.md`        |
| ADR-0036 | Memory Ranking Foundation       | `docs/adr/ADR-0036-memory-ranking-foundation.md`       |
| ADR-0037 | Prompt Assembly Integration     | `docs/adr/ADR-0037-prompt-assembly-integration.md`     |
| ADR-0038 | Prompt Selection Foundation     | `docs/adr/ADR-0038-prompt-selection-foundation.md`     |
| ADR-0039 | Prompt Selection Consumption    | `docs/adr/ADR-0039-prompt-selection-consumption.md`    |
| ADR-0040 | Prompt Compression Consumption  | `docs/adr/ADR-0040-prompt-compression-consumption.md`  |
| ADR-0041 | Prompt Budget Token Estimation  | `docs/adr/ADR-0041-prompt-budget-token-estimation.md`  |
| ADR-0042 | Provider Budget Foundation      | `docs/adr/ADR-0042-provider-budget-foundation.md`      |
| ADR-0043 | Provider Budget Consumption     | `docs/adr/ADR-0043-provider-budget-consumption.md`     |
| ADR-0044 | AI Configuration Foundation     | `docs/adr/ADR-0044-ai-configuration-foundation.md`     |
| ADR-0045 | AI Configuration Consumption    | `docs/adr/ADR-0045-ai-configuration-consumption.md`    |
| ADR-0046 | BuilderOptions Foundation       | `docs/adr/ADR-0046-builder-options-foundation.md`      |
| ADR-0047 | Sprint 4 Freeze                 | `docs/adr/ADR-0047-sprint4-freeze.md`                  |
| ADR-0048 | Intent Analysis Foundation      | `docs/adr/ADR-0048-intent-analysis-foundation.md`      |
| ADR-0049 | Rule-Based Intent Analyzer      | `docs/adr/ADR-0049-rule-based-intent-analyzer.md`      |
| ADR-0050 | Intent Consumption               | `docs/adr/ADR-0050-intent-consumption.md`              |
| ADR-0051 | Intent Rendering Foundation      | `docs/adr/ADR-0051-intent-rendering-foundation.md`     |
| ADR-0052 | Intent Prompt Integration        | `docs/adr/ADR-0052-intent-prompt-integration.md`       |
| ADR-0053 | Entity Recognition Foundation    | `docs/adr/ADR-0053-entity-recognition-foundation.md`   |
| ADR-0054 | Rule-Based Entity Analyzer       | `docs/adr/ADR-0054-rule-based-entity-analyzer.md`      |
| ADR-0055 | Entity Consumption               | `docs/adr/ADR-0055-entity-consumption.md`              |
| ADR-0056 | Entity Rendering Foundation      | `docs/adr/ADR-0056-entity-rendering-foundation.md`     |
| ADR-0057 | Entity Prompt Integration        | `docs/adr/ADR-0057-entity-prompt-integration.md`       |
| ADR-0058 | Semantic Context Foundation      | `docs/adr/ADR-0058-semantic-context-foundation.md`     |
| ADR-0059 | Semantic Context Consumption     | `docs/adr/ADR-0059-semantic-context-consumption.md`    |
| ADR-0060 | Semantic Context Rendering Foundation | `docs/adr/ADR-0060-semantic-context-rendering-foundation.md` |
| ADR-0061 | Semantic Context Prompt Integration | `docs/adr/ADR-0061-semantic-context-prompt-integration.md` |
| ADR-0062 | Prompt Strategy Foundation | `docs/adr/ADR-0062-prompt-strategy-foundation.md` |
| ADR-0063 | Prompt Strategy Consumption | `docs/adr/ADR-0063-prompt-strategy-consumption.md` |
| ADR-0064 | Prompt Strategy Rendering Foundation | `docs/adr/ADR-0064-prompt-strategy-rendering-foundation.md` |
| ADR-0065 | Prompt Strategy Prompt Integration | `docs/adr/ADR-0065-prompt-strategy-prompt-integration.md` |
| ADR-0066 | Create Strategy | `docs/adr/ADR-0066-create-strategy.md` |
| ADR-0067 | Query Strategy | `docs/adr/ADR-0067-query-strategy.md` |
| ADR-0068 | Modify Strategy | `docs/adr/ADR-0068-modify-strategy.md` |
| ADR-0069 | Delete Strategy | `docs/adr/ADR-0069-delete-strategy.md` |
| ADR-0070 | Strategy Module Foundation | `docs/adr/ADR-0070-strategy-module-foundation.md` |
| ADR-0071 | Strategy Module Consumption | `docs/adr/ADR-0071-strategy-module-consumption.md` |
| ADR-0072 | Strategy Module Rendering Foundation | `docs/adr/ADR-0072-strategy-module-rendering-foundation.md` |
| ADR-0073 | Strategy Module Prompt Integration | `docs/adr/ADR-0073-strategy-module-prompt-integration.md` |
| ADR-0074 | Dynamic Strategy Selection Foundation | `docs/adr/ADR-0074-dynamic-strategy-selection-foundation.md` |
| ADR-0075 | Score Based Strategy Selection | `docs/adr/ADR-0075-score-based-strategy-selection.md` |
| ADR-0076 | Strategy Selection Result Consumption | `docs/adr/ADR-0076-strategy-selection-result-consumption.md` |
| ADR-0077 | Weighted Strategy Evaluator | `docs/adr/ADR-0077-weighted-strategy-evaluator.md` |
| ADR-0078 | Prompt Assembly Strategy Foundation | `docs/adr/ADR-0078-prompt-assembly-strategy-foundation.md` |
| ADR-0079 | Prompt Assembly Strategy Consumption | `docs/adr/ADR-0079-prompt-assembly-strategy-consumption.md` |
| ADR-0080 | Create Prompt Assembly Strategy | `docs/adr/ADR-0080-create-prompt-assembly-strategy.md` |
| ADR-0081 | Create Prompt Assembly Consumption | `docs/adr/ADR-0081-create-prompt-assembly-consumption.md` |
| ADR-0082 | Query Prompt Assembly Strategy | `docs/adr/ADR-0082-query-prompt-assembly-strategy.md` |
| ADR-0083 | Modify Prompt Assembly Strategy | `docs/adr/ADR-0083-modify-prompt-assembly-strategy.md` |
| ADR-0084 | Delete Prompt Assembly Strategy | `docs/adr/ADR-0084-delete-prompt-assembly-strategy.md` |
| ADR-0085 | Strategy Selection Rendering Foundation | `docs/adr/ADR-0085-strategy-selection-rendering-foundation.md` |
| ADR-0086 | Dynamic Strategy Selection Consumption | `docs/adr/ADR-0086-dynamic-strategy-selection-consumption.md` |
| ADR-0087 | Section Priority Foundation | `docs/adr/ADR-0087-section-priority-foundation.md` |
| ADR-0088 | Prompt Assembly Planner Consumption | `docs/adr/ADR-0088-prompt-assembly-planner-consumption.md` |
| ADR-0089 | Priority-Aware Prompt Assembly | `docs/adr/ADR-0089-priority-aware-prompt-assembly.md` |
| ADR-0090 | Strategy-Aware Prompt Assembly Planner | `docs/adr/ADR-0090-strategy-aware-prompt-assembly-planner.md` |
| ADR-0091 | Prompt Assembly Plan Rendering Foundation | `docs/adr/ADR-0091-prompt-assembly-plan-rendering-foundation.md` |
| ADR-0092 | Prompt Assembly Plan Rendering Consumption |
| ADR-0093 | Prompt Assembly Optimizer Foundation |
| ADR-0094 | Prompt Assembly Optimizer Consumption |
| ADR-0095 | Prompt Assembly Plan Diff Foundation |
| ADR-0096 | Prompt Assembly Plan Diff Consumption |
| ADR-0097 | Prompt Assembly Snapshot Foundation | `docs/adr/ADR-0097-prompt-assembly-snapshot-foundation.md` |
| ADR-0098 | Prompt Assembly Snapshot Consumption | `docs/adr/ADR-0098-prompt-assembly-snapshot-consumption.md` |
| ADR-0099 | Prompt Inspector Foundation | `docs/adr/ADR-0099-prompt-inspector-foundation.md` |
| ADR-0100 | Prompt Inspector Consumption | `docs/adr/ADR-0100-prompt-inspector-consumption.md` |
| ADR-0101 | Prompt Inspector Rendering Foundation | `docs/adr/ADR-0101-prompt-inspector-rendering-foundation.md` |
| ADR-0102 | Prompt Inspector Rendering Consumption | `docs/adr/ADR-0102-prompt-inspector-rendering-consumption.md` |
| ADR-0103 | Prompt Inspector Export Foundation | `docs/adr/ADR-0103-prompt-inspector-export-foundation.md` |
| ADR-0104 | Prompt Inspector Export Consumption | `docs/adr/ADR-0104-prompt-inspector-export-consumption.md` |
| ADR-0105 | Prompt Assembly Trace Foundation | `docs/adr/ADR-0105-prompt-assembly-trace-foundation.md` |
| ADR-0106 | Prompt Assembly Trace Consumption | `docs/adr/ADR-0106-prompt-assembly-trace-consumption.md` |
| ADR-0107 | Prompt Assembly Trace Diff Foundation | `docs/adr/ADR-0107-prompt-assembly-trace-diff-foundation.md` |
| ADR-0108 | Prompt Assembly Trace Diff Consumption | `docs/adr/ADR-0108-prompt-assembly-trace-diff-consumption.md` |
| ADR-0109 | Prompt Assembly Trace Rendering Foundation | `docs/adr/ADR-0109-prompt-assembly-trace-rendering-foundation.md` |
| ADR-0110 | Prompt Assembly Trace Renderer Consumption | `docs/adr/ADR-0110-prompt-assembly-trace-rendering-consumption.md` |
| ADR-0111 | Prompt Assembly Trace Export Foundation | `docs/adr/ADR-0111-prompt-assembly-trace-export-foundation.md` |
| ADR-0112 | Prompt Assembly Trace Export Consumption | `docs/adr/ADR-0112-prompt-assembly-trace-export-consumption.md` |
| ADR-0113 | Prompt Assembly Timeline Foundation | `docs/adr/ADR-0113-prompt-assembly-timeline-foundation.md` |
| ADR-0114 | Prompt Assembly Timeline Consumption | `docs/adr/ADR-0114-prompt-assembly-timeline-consumption.md` |
| ADR-0115 | Prompt Assembly Timeline Diff Foundation | `docs/adr/ADR-0115-prompt-assembly-timeline-diff-foundation.md` |
| ADR-0116 | Prompt Assembly Timeline Diff Consumption | `docs/adr/ADR-0116-prompt-assembly-timeline-diff-consumption.md` |
| ADR-0117 | Prompt Assembly Timeline Renderer Foundation | `docs/adr/ADR-0117-prompt-assembly-timeline-rendering-foundation.md` |
| ADR-0118 | Prompt Assembly Timeline Renderer Consumption | `docs/adr/ADR-0118-prompt-assembly-timeline-rendering-consumption.md` |
| ADR-0119 | Prompt Assembly Timeline Export Foundation | `docs/adr/ADR-0119-prompt-assembly-timeline-export-foundation.md` |
| ADR-0120 | Prompt Assembly Timeline Export Consumption | `docs/adr/ADR-0120-prompt-assembly-timeline-export-consumption.md` |
| ADR-0121 | Prompt Assembly Timeline Snapshot Foundation | `docs/adr/ADR-0121-prompt-assembly-timeline-snapshot-foundation.md` |
| ADR-0122 | Prompt Assembly Timeline Snapshot Consumption | `docs/adr/ADR-0122-prompt-assembly-timeline-snapshot-consumption.md` |
| ADR-0123 | Prompt Assembly History Foundation | `docs/adr/ADR-0123-prompt-assembly-history-foundation.md` |
| ADR-0124 | Prompt Assembly History Consumption | `docs/adr/ADR-0124-prompt-assembly-history-consumption.md` |
| ADR-0143 | Observatory Shell Foundation | `docs/adr/ADR-0143-observatory-shell-foundation.md` |
| ADR-0144 | Observatory Overview Dashboard Foundation | `docs/adr/ADR-0144-observatory-overview-dashboard-foundation.md` |
| ADR-0145 | Observatory Trace Viewer Foundation | `docs/adr/ADR-0145-observatory-trace-viewer-foundation.md` |
| ADR-0146 | Observatory Timeline Viewer Foundation | `docs/adr/ADR-0146-observatory-timeline-viewer-foundation.md` |
| ADR-0147 | Observatory History Viewer Foundation | `docs/adr/ADR-0147-observatory-history-viewer-foundation.md` |
| ADR-0148 | Observatory Diff Viewer Foundation | `docs/adr/ADR-0148-observatory-diff-viewer-foundation.md` |
| ADR-0149 | Observatory I18n Foundation | `docs/adr/ADR-0149-observatory-i18n-foundation.md` |
| ADR-0150 | Observatory Runtime Viewer Foundation | `docs/adr/ADR-0150-observatory-runtime-viewer-foundation.md` |
| ADR-0151 | Observatory Live Event Stream Foundation | `docs/adr/ADR-0151-observatory-live-event-stream-foundation.md` |
| ADR-0152 | Observatory Runtime Entity Inspector Foundation | `docs/adr/ADR-0152-observatory-runtime-entity-inspector-foundation.md` |
| ADR-0153 | Observatory Trace Graph Foundation | `docs/adr/ADR-0153-observatory-trace-graph-foundation.md` |
| ADR-0154 | Observatory World Graph Foundation | `docs/adr/ADR-0154-observatory-world-graph-foundation.md` |
| ADR-0155 | Observatory Data Adapter Foundation | `docs/adr/ADR-0155-observatory-data-adapter-foundation.md` |
| ADR-0156 | Observatory Overview Real Data Integration | `docs/adr/ADR-0156-observatory-overview-data-integration.md` |
| ADR-0157 | Observatory Trace Real Data Integration | `docs/adr/ADR-0157-observatory-trace-data-integration.md` |
| ADR-0204 | Platform World Rendering Foundation | `docs/adr/ADR-0204-platform-world-rendering-foundation.md` |
| ADR-0205 | Intent Router Foundation | `docs/adr/ADR-0205-intent-router-foundation.md` |
| ADR-0206 | Create World Command Pipeline Foundation | `docs/adr/ADR-0206-create-world-command-pipeline-foundation.md` |
| ADR-0207 | Runtime World Injection Foundation | `docs/adr/ADR-0207-runtime-world-injection-foundation.md` |
| ADR-0279 | Runtime-Derived Player Presentation State Assets | `docs/adr/ADR-0279-runtime-derived-player-presentation-state-assets.md` |
| ADR-0280 | Player Horizontal Motion Truth Reachability Repair | `docs/adr/ADR-0280-player-horizontal-motion-truth-reachability-repair.md` |
| ADR-0281 | Bounded Player Run-Frame Presentation | `docs/adr/ADR-0281-bounded-player-run-frame-presentation.md` |

---

## Architecture Audit (META-006)

**Date:** Sprint 2 Frozen
**Score:** 9.1 / 10

### Audit Summary

| Item                            | Result                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Duplicate code                  | Minor — `parseResponse()` 5-line duplication between OpenAI/DeepSeek                |
| Dependency direction violations | None found                                                                          |
| Over-abstraction                | None found — all interfaces justified by ADRs                                       |
| Prompt Pipeline conformance     | Fully conformant — System→User→Memory→World order matches docs                      |
| Provider conformance            | Fully conformant — Planner→PlannerProvider→Concrete Provider                        |
| Validation uniformity           | LLM providers use StructuredOutputValidator ✅ — Mock bypasses it (correct)         |
| Public API cleanliness          | Missing `@genesis/ai` in web package.json; concrete providers exported (borderline) |
| Documentation gaps              | 4 ADRs missing for Sprint 2 decisions                                               |

### Key Recommendations

| Priority | Item                                                                   |
| -------- | ---------------------------------------------------------------------- |
| ~~P0~~   | ~~Add `@genesis/ai` to `apps/web/package.json` dependencies~~ **Done** |
| ~~P0~~   | ~~Write missing ADRs (ADR-0016 through ADR-0019)~~ **Done**            |
| P1       | Rename `MockPlanner` → `DefaultPlanner`                                |
| P1       | Remove dead `apps/web/src/planner/` directory                          |
| ~~P1~~   | ~~Add TECH_DEBT entries for audit findings~~ **Done**                  |
| P2       | Consider marking concrete providers as `@internal`                     |
| P2       | Add validation enforcement for new providers                           |
| ~~P2~~   | ~~Reference `AI_INTEGRATION.md` from other docs~~ **Done**             |
