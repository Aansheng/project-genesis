# ADR-0256: World Evolution Semantic Delta and Operation History

- Status: Accepted
- Date: 2026-08-20
- Work Order: WO-S14-001
- Architecture Version: v1.141 → v1.142

## Context

Genesis Studio could create a semantic world and project it into Runtime, but
there was no provider-neutral contract for a natural-language change to the
current world. Observatory History, Diff, Timeline, Trace, and Event Stream
therefore had no truthful production producer after the legacy fixture was
retired.

The first evolution slice must describe and validate a change without
rebuilding the world or mutating Runtime, assets, or Renderer state.

## Decision

- Add a shared `WorldEvolutionRequest` containing an operation/correlation ID,
  instruction, current `GameWorldModel`, world ID, and optional world
  properties.
- Add a discriminated `WorldEvolutionIntent` and immutable
  `WorldSemanticDelta` for add, remove, semantic replacement, entity-property
  extension, and world-property operations. v1 validates the extension point
  but does not execute movement-property updates.
- Keep the existing structured-generation boundary. API and Codex providers
  receive an evolution-specific request/prompt and return only an untrusted
  semantic candidate; no new browser credential or provider boundary is added.
- Let the AI propose meaning, then let Genesis resolve target IDs against the
  explicit current semantic snapshot and validate the delta. Group language
  such as “所有”/“all” is authoritative even if a provider omits
  `selector.match`.
- Record an immutable `WorldEvolutionOperation` with safe stages, source,
  provider/model metadata, status, target IDs, and correlated domain events.
  Provider failures never fall back to Create World and never claim an applied
  result.
- Project validated planning operations into Observatory History, Diff,
  Timeline, Trace, and Event Stream. Diff is labelled `PLANNED`; Runtime and
  World Graph remain unchanged.
- Reset evolution projections when a new current world is created. A stale
  World A operation cannot populate World B surfaces.

## Consequences

Supported commands such as “把所有牛改成羊”, “把商人改成机器人”,
“增加一个商人”, “删除 Boss”, and “把整个世界改成夜晚” produce
deterministic, inspectable planning facts when the current semantic world
supports them. Unsupported, invalid, unresolved, and ambiguous operations
remain explicit no-op outcomes.

The Runtime application contract is intentionally deferred. Applying a delta
will require a separate decision for identity preservation, ID allocation,
asset-manifest changes, and Renderer synchronization.

## Verification

- Shared, AI, AI server, and Web type checks pass.
- World evolution planner, gateway, Web integration, Observatory, and existing
  regression suites cover targeting, validation, provider failure, session
  isolation, and Runtime non-mutation.
- Real browser verification created a Farm world, planned the cow-to-sheep
  group replacement, showed History/Diff/Timeline/Trace/Event Stream facts,
  and confirmed Runtime still contained the original cow IDs.
