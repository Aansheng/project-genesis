# Engineering Roadmap Projection

This file records only high-level direction. It does not invent detailed future
architecture.

## Completed foundations

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

## Current direction

Keep the end-to-end pipeline playable and truthful:

Natural language → Intent → Semantic World → Game DSL → Runtime → Renderer
→ playable game → targeted natural-language evolution.

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
remains open and not frozen pending the fresh Freeze Review Human/CTO decision.

## Deferred direction

Skills, modifiers, score policy, death/respawn/
game-over, enemy behavior, timers, spawning, waves, richer rule actions,
durable history, and broader context systems stay deferred until a concrete
product need and acceptance path justify them. Goal completion beyond the
current session-completed truth, including victory UI, next level, restart,
failure, and progression beyond the bounded numeric primitive, remains
deferred. Offline World Evolution fallback is recorded as resilience debt, not
the current Sprint bottleneck. The post-WO-S16-003 Freeze Review is READY FOR
FREEZE and blocks only on Human/CTO direction; no Sprint 17 work is authorized.

## Supervisor rollout

The Supervisor executes one selected work item at a time, verifies it, updates
projections, performs one bounded discovery pass, and generates exactly one
next READY/BLOCKED work item. With `continuation_mode = SPRINT_CONTINUOUS`, it
may continue sequentially through that next item and later same-Sprint items
after all gates pass. `max_concurrent_subagents = 2`, repair budget `= 3`,
Human/CTO escalation, one-next-WO generation, and the Sprint-boundary stop
remain active. With Sprint 16 implementation gates complete, continuous mode
stops at the pending Freeze Review; it never authorizes automatic cross-Sprint
execution.
