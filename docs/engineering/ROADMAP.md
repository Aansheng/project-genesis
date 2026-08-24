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
  is complete and generated exactly one READY product WO,
  `WO-S16-001`; no Sprint 16 implementation has executed.

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
`RuntimeGameplaySessionState`, and the Freeze Review records the complete
Sprint thesis as satisfied. Sprint 16 now opens with one READY bounded
reconciliation WO; it preserves the same authority boundaries and is not
executed in this decision-resolution step.

## Deferred direction

Score/state, death/respawn/game-over, enemy behavior, timers, spawning,
progression, richer rule actions, durable history, and broader context systems
stay deferred until a concrete product need and acceptance path justify them.
Goal completion beyond the current session-completed truth, including victory
UI, next level, restart, failure, and progression, remains deferred. The
current Sprint 16 opening gap is targeted mechanics synchronization across
natural-language world evolution: semantic evolution currently marks the
world-bound `GameplayRuleSet` stale rather than preserving and reconciling
validated gameplay intent. After this bounded bridge, Next-Work Discovery must
reassess whether progression (XP / Level / Skills / Spawn/Waves) is the next
measured bottleneck.

## Supervisor rollout

The Supervisor executes one selected work item at a time, verifies it, updates
projections, performs one bounded discovery pass, and generates exactly one
next READY/BLOCKED work item. With `continuation_mode = SPRINT_CONTINUOUS`, it
may continue sequentially through that next item and later same-Sprint items
after all gates pass. `max_concurrent_subagents = 2`, repair budget `= 3`,
Human/CTO escalation, one-next-WO generation, and the Sprint-boundary stop
remain active. Continuous mode never authorizes automatic cross-Sprint
execution.
