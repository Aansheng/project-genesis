# Engineering Roadmap Projection

This file records only high-level direction. It does not invent detailed future
architecture.

## Completed foundations

- Sprint 23 Freeze Review: Human/CTO froze Generation Transparency & Recovery
  at v1.172 with Code Complete and Product Verified both YES. Exact provider
  prompt truth and one safe, lineage-linked canonical recovery are frozen.
- Sprint 24 authorization: Game Lifecycle Presentation is limited to a Runtime
  session-state projection in Studio. WO-S24-001 is Code Complete at v1.173:
  Game Over uses existing Runtime Respawn, Victory has no invented follow-up,
  and real Studio Product Verification remains pending.

- Sprint 21 Freeze Review: Human/CTO froze Free-form Conversational World
  Evolution at v1.171. The bounded thesis is verified through free-form Enemy
  ADD paraphrases, Coin ADD, and Enemy REMOVE without phrase-specific routing.
- Sprint 22 direction decision: Human/CTO authorized Studio Session Continuity
  measurement. Source audit and real Studio SPA navigation preserved the same
  application-scoped Runtime/session; no implementation WO was generated and
  `SPRINT22_FREEZE_REVIEW` is ready. Durable persistence remains out of scope.

- Sprints 6–10: Observatory, DSL, Runtime, Renderer, and AI generation
  foundations.
- Sprint 11: Genesis Studio baseline.
- Sprint 12: AI world generation and Runtime activation.
- Sprint 13: visual and asset generation; frozen after correctness audit.
- Sprint 14: targeted world evolution; frozen after multi-turn verification.
- Sprint 15 through WO-S15-007: capability-specific context and the bounded
  gameplay rule execution slices for enemy stomp, generic Health damage, and
  current-session goal completion.
- WO-META-005: just-in-time next-work discovery and gap-analysis foundation;
  WO-S15-007 advances product architecture to v1.154.
- Sprint 15 Freeze Review: the Gameplay Mechanics Foundation thesis passed;
  Sprint 15 is frozen at v1.154 with Code Complete and Product Verified both
  YES.
- Sprint 16 direction decision: Human/CTO selected targeted Gameplay Rule
  Reconciliation for Gameplay-Preserving World Evolution. `SPRINT16_DISCOVERY`
  is complete and generated exactly one product WO,
  `WO-S16-001`; the WO is complete at v1.155 and Product Verified.
- WO-S16-002 is complete at v1.156 and Product Verified: the existing
  GameplayEvent → GameplayRule path now commits finite additive deltas to a
  generic Runtime-owned numeric progression state, with `experience` as the
  first use case. Renderer and Observatory projections are wired separately.
- Human/CTO chose CONTINUE because numeric storage alone did not prove a
  progression transition. WO-S16-003 is complete at v1.157: typed
  `NUMBER_COMPARE` evaluates `experience >= 1 AND level < 2`, and the existing
  numeric action commits Level 1 → Level 2 exactly once. Runtime, Renderer,
  Web, and Observatory evidence is Product Verified.
- Sprint 16 Freeze Review: Human/CTO chose FREEZE. Sprint 16 is frozen at
  v1.157 with Code Complete = YES and Product Verified = YES. The Freeze Review
  introduced no architecture change.
- Sprint 17 — Mechanically Complete Platformer Generation: Human/CTO chose
  FREEZE on 2026-08-25. WO-S17-001 through WO-S17-004 are Code Complete = YES
  and Product Verified = YES at v1.160; the complete success and bounded
  failure/recovery lifecycles are verified. See `SPRINT17_REVIEW.md`.
- Sprint 18 direction decision: Human/CTO authorized Visually Coherent
  Platformer Generation. Fresh discovery selected exactly one current bounded
  WO: `WO-S18-001` for role-aware asset render usage; no full visual framework
  or future Sprint backlog is pre-generated.
- WO-S18-002 is complete at v1.162 and Product Verified for its bounded usage
  contract. Real image-backed measurement then found that the baseline Runtime
  models Platform as `type: terrain` and the adapter had dropped its semantic
  name. The bounded v1.163 projection repair is automated-test complete, but
  exact provider-backed platform application remains pending after the current
  Codex CLI platform request timed out. Runtime geometry, tiling, and
  image-pixel inference remain deferred.
- Sprint 18 Freeze Review: Human/CTO froze Visually Coherent Platformer
  Generation at v1.164 with Code Complete and Product Verified both YES.
- Sprint 19 direction decision: Human/CTO authorized Animated Entity
  Presentation. The first repository audit proved semantic visual-identity
  grouping already deduplicates equivalent entity generations, so no reuse
  infrastructure is planned. WO-S19-001 is Product Verified at v1.166 for
  Runtime-derived idle/run/jump/facing state switching. Fresh real Studio
  observation measured one static run pose sliding through the world, so the
  only generated next item is WO-S19-002: two independent Player run frames
  with Player-only Renderer tick alternation at v1.167. WO-S19-002 is Product
  Verified, and Sprint 19 Freeze Review froze Animated Entity Presentation at
  v1.167. Sprint 20 is not entered automatically.
- Sprints 20–31 completed and froze their bounded product slices through
  playable platform geometry, free-form evolution, Studio session continuity,
  generation transparency/recovery, lifecycle presentation, production
  reachability review, Survival generalization/spatial composition, pursuit,
  contact offense, sustained replacement, and Observatory truth consistency.
  Sprint 32 then froze at v1.182 after adding generic top-down Player-directed
  short-range offense with Runtime-authoritative damage and replacement
  continuity. No future combat system is implied by those slices.

## Current direction

Keep the end-to-end pipeline playable, truthful, and visually composable:

Natural language → Intent → Semantic World → Game DSL → Runtime → Renderer
→ playable game → targeted natural-language evolution.

Sprint 33 Product Gap Discovery selected generic gameplay outcome feedback as
the largest remaining Game-surface blocker. Human/CTO authorized the single
bounded `WO-S33-001`, which is complete at v1.183 and Product Verified, and
then froze Sprint 33. Committed Runtime results now project to transient
generic hit, defeat, and replacement cues; no weapons, projectiles, waves,
timers, upgrades, or new combat authority were introduced.

Sprint 34 is complete and FROZEN at v1.184 by Human/CTO decision. Fresh real
play selected exactly one blocker, **RUNTIME REPLACEMENT PRESSURE LACKS FAIR
PACING**; `WO-S34-001 — Generic Runtime Replacement Fair-Start Policy` is
Code Complete and Product Verified. The existing replacement path resolves the
current Runtime Player and applies deterministic bounded spatial
separation/non-overlap before normal pursuit. No temporal pacing, product-wide
bounds authority, WaveManager, timer framework, or progression effect was
introduced.

Sprint 35 Progression Meaning execution is complete and frozen at v1.185. The
selected blocker—**LEVEL PROGRESSION HAS NO GAMEPLAY CONSEQUENCE**—was
resolved by the bounded `WO-S35-001 — Generic Progression-Conditioned
Gameplay Capability`. The existing Survival RuleSet now uses mutually
exclusive `NUMBER_COMPARE(gameState.level)` conditions to select
`DAMAGE_ENTITY` amount 25 below Level 2 and 50 at Level 2 or above. Code
Complete and Product Verified are YES; Human/CTO accepted the Sprint 35
freeze on 2026-09-01.

Sprint 36 reached v1.186 through the authorized
`WO-S36-001 — Generic Active-World New-World Intent Classification`. The
existing IntentRouter/Web front door now preserves current-world
entity/property/continuation mutations for World Evolution while generic
whole-world/game construction and named-world signals use the existing
CreateWorld replacement path even with an active world. Explicit-new behavior,
AI candidate validation, Runtime/Renderer authority, and ambiguous
non-replacement remain intact. Focused and full package tests, quality gates,
real Studio world-identity/cross-genre verification, Platformer Space smoke,
Observatory truth, and empty browser diagnostics passed. Fresh Sprint 36 Gap
Analysis is PASS with no immediate P0 blocker. Human/CTO froze Sprint 36 at
v1.186 and authorized Sprint 37 CreateWorld Semantic Fidelity Discovery.

Sprint 37 discovery traced the post-routing path through typed `GameIntent`,
provider candidate/validation, deterministic fallback, the current semantic
template catalog, DSL, and Runtime projection. The five clear requests all
reached CreateWorld. Platformer, Survival, and RPG preserved their supported
types on fallback; `做一个农场游戏` was the only measured divergence because
`DefaultGameIntentExtractor` did not recognize `农场`, so both provider context
and deterministic fallback inherited `sandbox`. The current Farm template was
already present, and a controlled valid `farm` provider candidate reached it.

The authorized `WO-S37-001 — Generic CreateWorld Supported-Archetype Intent
Preservation` is now complete at v1.187. The existing immutable supported
archetype alias boundary recognizes `农场 → farm`, so provider failure and
deterministic fallback reach the existing eight-entity Farm composition. Code
Complete and Product Verified are YES; focused/full tests, quality gates,
real Studio clean/active Farm verification, regression behavior, Observatory
truth, and empty browser diagnostics passed. Fresh Sprint 37 Gap Analysis is
PASS. Human/CTO subsequently froze Sprint 37 at v1.187 and authorized Sprint
38 discovery. No Farm/RPG mechanics, router/provider architecture, legacy
reconnection, or second Sprint 37 WO was introduced.

Sprint 38 Cross-Genre Playability Fidelity Discovery selected the blocker
**SUPPORTED ARCHETYPE ENTITIES ARE NOT PLAYER-REACHABLE THROUGH AN EXPLICIT
PLAYER INTERACTION PATH**. The authorized `WO-S38-001` implementation is
complete at v1.188: one generic Runtime request system exposes `Enter` only
for Farm/RPG, selects one nearest finite-range target with stable Runtime-ID
tie-breaking, emits `ENTITY_INTERACTION_REQUESTED`, and routes through one
bounded Gameplay Rule per archetype. Farm targets `npc`; RPG targets `quest`;
the trusted `SET_ENTITY_PROPERTY` action commits immutable
`gameplay-state.activated` state and the Renderer presents committed feedback.

Platformer `Space — Jump` and Survival `Space — Attack` remain unchanged.
The deterministic Farm path retains its existing 8-entity composition and RPG
retains its 9-entity composition. Real Studio normal play confirmed committed
Farm and RPG interaction outcomes, truthful repeated no-ops, and empty browser
diagnostics. The Provider-accepted Farm PV candidate contained 5 entities;
this is recorded as a separate Provider candidate composition completeness
variance and is not a blocker for WO-S38-001. Full and focused automated
production-path tests, package quality gates, Web build, and browser
UI/Observatory checks pass; the fresh Sprint 38 Gap Analysis is PASS.
Human/CTO then froze Sprint 38 at v1.188 and authorized Sprint 39 discovery.
Full discovery evidence is in `docs/project/SPRINT38_PRODUCT_GAP_DISCOVERY.md`,
execution evidence is in `docs/project/SPRINT38_BACKLOG.md`, and the fresh-gap
record is `docs/project/SPRINT38_GAP_ANALYSIS.md`.

Sprint 39 Cross-Genre Interaction Meaning Discovery selected the blocker
**SUPPORTED ARCHETYPE INTERACTIONS LACK MECHANICALLY MEANINGFUL
CONSEQUENCES**. Under the explicit 2026-09-03 authorization, the single
`WO-S39-001` execution advances the architecture to v1.189 by reusing the
existing typed `SET_ENTITY_PROPERTY` seam: Farm targets eligible field-like
terrain and commits `harvested=true`, while RPG targets `quest` and commits
`questAccepted=true`, both alongside `activated=true`. The generic Enter /
range-48 / nearest / stable-ID / no-target / repeat path and Runtime authority
remain unchanged, and Renderer feedback derives the committed labels.

Full production-path suites, TypeScript, ESLint, Web build, and real Studio
Farm/RPG Product Verification pass. A Provider-accepted 5-entity Farm world
and the 9-entity RPG deterministic fallback both produced the characteristic
committed state; Full Observatory agreed and repeated RPG input was a truthful
no-op. Fresh Sprint 39 Gap Analysis is PASS. Human/CTO froze Sprint 39 at
v1.189 on 2026-09-03.

Sprint 40 Cross-Genre Gameplay Loop Continuity Discovery selected the blocker
**SUPPORTED ARCHETYPE INTERACTIONS DO NOT CONTINUE INTO A BOUNDED
MULTI-STEP GAMEPLAY LOOP**. Human/CTO then authorized and `WO-S40-001` is
complete at v1.190 by reusing the existing generic GameplayRule and
`SET_ENTITY_PROPERTY` seams: `BOOLEAN_EQUALS` reads current Runtime entity
state, Farm gates quest completion on `wheat-field.gameplay-state.harvested`,
and RPG gates main-quest completion on
`quest-giver.gameplay-state.questAccepted`.

Real Studio Farm and RPG both prove two distinct, ordered, committed gameplay
moments. The second interaction is rejected before the first, succeeds only
after the first committed state, and repeats are truthful `no_op`s. Full
Observatory and Runtime inspection agree with the visible outcomes. The
generic Runtime contains no Farm/RPG world-type branch; archetype composition
selects the semantic entities and rules. Provider Farm composition variance,
inherited spatial/control composition, and next-state readability remain
secondary observations. Full package gates and the direct Web build pass;
the fresh Sprint 40 Gap Analysis is PASS. Human/CTO froze Sprint 40 at v1.190
on 2026-09-04, with checkpoint commit 04c3090.

Sprint 41 World Evolution Gameplay Capability Continuity is complete at v1.191
for the authorized first divergence. The existing deterministic World
Evolution candidate provider now has one bounded current-archetype mapping for
Farm field and RPG quest additions after structured Provider failure. Real
Studio Farm `再加一块麦田` and RPG `再加一个任务` stayed in the same world,
created validated semantic deltas, synchronized Runtime entities, and rendered
the additions. Farm's new field committed `harvested=true`; RPG preserved the
accepted baseline quest state and emitted an interaction request for the new
quest, but the current exact `Quest Giver` rule binding returned
`conditions_failed`. The latter is the fresh downstream gap and was not
repaired in this WO.

The Survival control `生成一个幸存者游戏` → `再加五只怪` still passes
same-world +5 Enemy, pursuit, contact damage, and canonical visual reuse.
Merchant addition and honest unknown-request failure remain intact. `WO-S41-001`
is DONE with Code Complete = YES and Product Verified = YES; fresh Sprint 41
Gap Analysis is PASS. Human/CTO froze Sprint 41 at v1.191; its freeze review
is closed and the separately authorized Sprint 42 Discovery is recorded next.

Human/CTO subsequently froze Sprint 41 at v1.191 and authorized Sprint 42 —
World Evolution Gameplay Rule Binding Continuity Discovery. Discovery is
complete without a product architecture change: Farm's evolved
`wheat-field-1` is harvestable, Survival's evolved Enemies retain
pursuit/contact damage/visual reuse, and RPG's evolved `quest-1` is
Enter-reachable but fails the exact `Quest Giver` archetype condition.

The single measured blocker is **EVOLVED RPG QUEST ENTITIES DO NOT CARRY AN
EXPLICIT GAMEPLAY ROLE/CAPABILITY CONTRACT, SO WORLD EVOLUTION CANNOT SAFELY
BIND THE APPROPRIATE EXISTING RPG RULE**. Exactly one READY item exists:
`WO-S42-001 — Evolved-Entity Gameplay Capability Binding Contract`. It is not
executed. The current rule is not concrete-ID-bound, but is entity-specific in
effect through semantic name matching; category-wide broadening and full rule
rebuilds are not justified. Sprint 42 stops at `SPRINT42_DISCOVERY_REVIEW`,
and Sprint 43 is not entered. See
`docs/project/SPRINT42_GAMEPLAY_RULE_BINDING_DISCOVERY.md`.

Sprint 15's measurable checkpoint is a coherent platformer slice with
movement/jump continuity, event-driven gameplay, collectible interaction,
enemy stomp, enemy damage/Health, a truthful success/goal path, and coherent
end-to-end behavior. The completed S15-006 boundary extended the smallest
trusted Runtime primitive needed for damage/Health and preserved current
authority boundaries. The subsequent discovery identified goal/session
completion as the smallest Sprint blocker; WO-S15-007 now commits
`RuntimeGameplaySessionState`, and the Sprint 15 Freeze Review records that
thesis as satisfied. Sprint 16's bounded reconciliation WO is complete at
v1.155 and preserves the same authority boundaries. Human/CTO continued Sprint
16 because its corrected goal also requires the first generic progression
loop. WO-S16-002 closed the measured Runtime-owned numeric-state gap at v1.156;
WO-S16-003 closed the smallest remaining transition gap at v1.157. Sprint 16
is frozen at v1.157 with its accepted product thesis complete.

## Deferred direction

Skills, modifiers, score policy, game-over/lives/checkpoints, enemy behavior,
timers, periodic spawning, waves, richer rule actions, durable history, and broader
context systems stay deferred until a concrete product need and acceptance path
justify them. The bounded Sprint 30 removal-triggered Runtime replacement is
supported, but it does not imply timer/count/wave behavior. Offline World
Evolution fallback remains resilience debt. Sprint
17 is frozen; Sprint 18 visual work is limited to measured role-aware asset
composition gaps and must not become a graphics framework, image-based
collision system, or speculative future-role taxonomy.

## Supervisor rollout

The Supervisor executes one selected work item at a time, verifies it, updates
projections, performs one bounded discovery pass, and generates exactly one
next READY/BLOCKED work item. With `continuation_mode = SPRINT_CONTINUOUS`, it
may continue sequentially through that next item and later same-Sprint items
after all gates pass. `max_concurrent_subagents = 2`, repair budget `= 3`,
Human/CTO escalation, one-next-WO generation, and the Sprint-boundary stop
remain active. Sprint 19 is now frozen at v1.167; the boundary requires
explicit Human/CTO authorization before Sprint 20 can begin.
