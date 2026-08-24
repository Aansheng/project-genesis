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

## Current direction

Keep the end-to-end pipeline playable and truthful:

Natural language → Intent → Semantic World → Game DSL → Runtime → Renderer
→ playable game → targeted natural-language evolution.

The completed boundary extended the smallest trusted Runtime primitive needed
for the measured DAMAGE/HEALTH scenario and preserved current authority
boundaries. The Supervisor stops after WO-S15-006 under
`continuation_mode = ONE_WORK_ITEM`; no next product work order is selected in
this turn.

## Deferred direction

Score/state, death/respawn/game-over, goals, enemy behavior, timers, spawning,
progression, win/lose, richer rule actions, durable history, and broader
context systems stay deferred until a concrete product need and acceptance path
justify them.

## Supervisor rollout

The initial engineering rollout executes one selected work item, verifies it,
updates projections, reports, and stops. WO-META-004 hardens that rollout
without changing `continuation_mode = ONE_WORK_ITEM`; continuous Sprint-wide
autonomous execution is intentionally not enabled.
