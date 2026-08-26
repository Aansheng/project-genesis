# ADR-0283 — Free-form World Evolution Front-door Fallback

- Status: Accepted
- Date: 2026-08-26
- Work order: WO-S21-001
- Architecture: v1.170 → v1.171

## Context

The Studio command front door sent only `world-evolution` routes to the existing
structured World Evolution planner. `DefaultIntentRouter` deliberately uses a
small deterministic verb/target vocabulary; therefore a valid request such as
`增加5个enemy` was classified as `unknown` and then reached the create-only
`CommandExecutor`, which reported `Unknown command` before an AI candidate was
requested.

The downstream boundary already supports an AI candidate containing
`add-entity`, a semantic category, and a positive count. It validates the
candidate, atomically applies counted semantic additions, synchronizes only
affected Runtime entities, reconciles gameplay rules, and groups equivalent
visual requirements into canonical generation work.

## Decision

Keep existing deterministic routing as the inexpensive fast path. In
`gameStore.send`, when a current semantic world exists, route an `unknown`
deterministic result to the existing `WorldEvolutionPlanner` as a semantic
interpretation fallback. Before a world exists, unknown input retains the
existing unknown-command behavior.

The fallback introduces no new intent schema or mutation authority. The
existing provider remains a candidate source; parser, semantic resolver, delta
validator, revision guards, semantic applier, Runtime synchronizer, gameplay
reconciler, and visual planner retain their existing authority. A malformed,
unsupported, unresolved, stale, or unavailable candidate stays an explicit
non-applied evolution result.

## Consequences

- Free-form paraphrases can reach structured AI interpretation without adding
  phrase-specific product handlers.
- A successful `add-entity` count is preserved through semantic, Runtime, and
  visual reconciliation while the current world/session survives.
- Existing deterministic World Evolution requests remain fast-path requests;
  create-world routing remains unchanged.
- The existing operation source and stages distinguish AI interpretation,
  validation, and execution in Observatory projections.
