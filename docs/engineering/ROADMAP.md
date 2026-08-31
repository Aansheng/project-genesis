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

## Current direction

Keep the end-to-end pipeline playable, truthful, and visually composable:

Natural language → Intent → Semantic World → Game DSL → Runtime → Renderer
→ playable game → targeted natural-language evolution.

Sprint 24 measures only player-facing presentation of the existing Runtime
failure/completion lifecycle. It must remain a projection: no UI-owned gameplay
state, generic managers, lifecycle framework, campaign flow, or game menus.
After real Studio verification, prefer Sprint 24 Freeze Review rather than
expanding the scope.

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
