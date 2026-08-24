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
- Sprint 15 through WO-S15-006: capability-specific context and the bounded
  gameplay rule execution slices for enemy stomp and generic Health damage.
- WO-META-005: just-in-time next-work discovery and gap-analysis foundation;
  product architecture remains v1.153.

## Current direction

Keep the end-to-end pipeline playable and truthful:

Natural language → Intent → Semantic World → Game DSL → Runtime → Renderer
→ playable game → targeted natural-language evolution.

Sprint 15's measurable checkpoint is a coherent platformer slice with
movement/jump continuity, event-driven gameplay, collectible interaction,
enemy stomp, enemy damage/Health, a truthful success/goal path, and coherent
end-to-end behavior. The completed S15-006 boundary extended the smallest
trusted Runtime primitive needed for damage/Health and preserved current
authority boundaries. Discovery evidence now identifies goal/session completion
as the smallest remaining Sprint blocker; the only generated next product WO
is blocked pending a human authority decision.

## Deferred direction

Score/state, death/respawn/game-over, enemy behavior, timers, spawning,
progression, richer rule actions, durable history, and broader context systems
stay deferred until a concrete product need and acceptance path justify them.
Goal completion is the current Sprint candidate, but no goal implementation is
authorized until its authoritative owner/lifecycle is selected.

## Supervisor rollout

The Supervisor executes one selected work item, verifies it, updates
projections, performs one bounded discovery pass, generates exactly one next
READY/BLOCKED work item, and stops. WO-META-005 establishes
`continuation_mode = ONE_WORK_ITEM_WITH_DISCOVERY`; continuous Sprint-wide
autonomous execution remains intentionally disabled.
