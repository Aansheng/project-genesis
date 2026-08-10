# ADR-0155: Observatory Data Adapter Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-012  
**Architecture Version:** v1.41 → v1.42

---

## Context

WO-S6-001 through WO-S6-011 delivered 10 Observatory UI panels (Overview, Trace, Timeline, History, Diff, Runtime, Event Stream, Trace Graph, World Graph, Settings). All panels currently use hardcoded mock data defined inside the Vue component files. There is no structured bridge between the Prompt Assembly Observability Layer (`PromptAssemblyObservatory` in `@genesis/ai`) and the UI layer.

As the project scales toward real Prompt Assembly integration, the UI layer must remain isolated from AI package types. A data adapter layer between the two prevents direct coupling.

### Problem

1. **No bridge layer** — UI components currently define mock data inline; there is no abstraction for transforming real observatory data into UI-safe DTOs
2. **No ViewModel** — there is no canonical UI-side representation of observatory data that components can depend on without importing AI types
3. **No contract** — there is no interface defining the adapter shape, making it impossible to substitute implementations (mock vs real)
4. **Defensive gaps** — components have no guard layer against undefined, null, or malformed observatory data

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime DTOs yet
- No actual wiring into PromptBuilder
- No Runtime integration
- No Planner integration
- No metadata changes
- No prompt changes
- No AI package modifications
- No Strategy modifications
- No Vue component changes (components continue using mock data)
- No import of AI package types into the UI layer

---

## Decision

### Directory Structure

```
apps/web/src/adapters/observatory/
├── index.ts                    — barrel exports
├── ObservatoryAdapter.ts       — adapter interface
├── ObservatoryViewModel.ts     — UI-safe DTO types
└── DefaultObservatoryAdapter.ts — stateless, pure adapter implementation
```

### ObservatoryViewModel

A set of UI-safe DTOs with no dependencies on `@genesis/ai`. Every field is `readonly` for immutability:

```
ObservatoryViewModel {
  overview: OverviewDTO {
    traceCount: number
    timelineCount: number
    historyCount: number
  }
  trace: readonly TraceDTO[]
  timeline: readonly TimelineDTO[]
  history: readonly HistoryDTO[]
}
```

Where each DTO is minimal:

- **TraceDTO**: `id`, `label`, `steps: readonly TraceStepDTO[]`
- **TraceStepDTO**: `id`, `label`, `status`
- **TimelineDTO**: `id`, `label`, `entries: readonly TimelineEntryDTO[]`
- **TimelineEntryDTO**: `id`, `label`, `timestamp`
- **HistoryDTO**: `id`, `label`, `entries: readonly HistoryEntryDTO[]`
- **HistoryEntryDTO**: `id`, `label`, `timestamp`

### ObservatoryAdapter Interface

```typescript
interface ObservatoryAdapter {
  adapt(observatory: unknown): ObservatoryViewModel
}
```

Single-method interface accepting raw `unknown` (the Prompt Assembly data shape will be passed here in a future work order). Returns a fully populated ViewModel.

### DefaultObservatoryAdapter

Stateless, pure, deterministic implementation:

- **Null/undefined/non-object input** → returns default ViewModel (all counts 0, all arrays empty)
- **String/number/boolean/array input** → returns default ViewModel
- **Empty object** → returns default ViewModel
- **Partial observatory** → derives counts from available data
- **Complete observatory** → extracts trace array, timeline array, history array + counts
- **Snapshot-based derivation** — if trace/timeline/history arrays are missing, falls back to `traceSnapshot.stepCount`, `timelineSnapshot.entryCount`, `historySnapshot.entryCount`, then `hasTrace`/`hasTimeline`/`hasHistory` boolean flags
- **All output arrays are frozen** (`Object.freeze`) for immutability
- **Input is never mutated**

### Count Derivation Priority

1. Array `.length` (if `trace`/`timeline`/`history` is an array of objects)
2. Snapshot `stepCount`/`entryCount` (if present on `traceSnapshot`/`timelineSnapshot`/`historySnapshot`)
3. Boolean flags `hasTrace`/`hasTimeline`/`hasHistory`
4. Default `0`

### Mock Fixtures

Mock observatory objects are defined **only inside test files** — no mock data in production code. Three fixtures:
- `createEmptyObservatory()` — `{}`
- `createCompleteObservatory()` — full trace (2 steps), timeline (2 entries), history (2 entries), plus three snapshots
- `createPartialObservatory()` — only trace + boolean flags

---

## Consequences

### Positive

1. **First bridge layer** — the UI now has an abstraction boundary between Prompt Assembly data and Vue components
2. **UI isolation** — no AI package types leak into `apps/web/src/adapters/` or `apps/web/src/components/`
3. **Defensive by default** — the adapter handles every possible edge case (null, undefined, primitives, malformed objects) without throwing
4. **Deterministic** — same input always produces same output; pure function with no side effects
5. **Immutable output** — all arrays in the ViewModel are frozen; the input is never mutated
6. **Extensible** — new DTO types (RuntimeDTO, WorldDTO) can be added without breaking changes
7. **Testable** — 185 tests cover all edge cases, DTO shapes, determinism, immutability, and purity

### Negative

1. **Not wired yet** — no Vue component consumes the adapter; this is pure foundation
2. **No Runtime DTOs** — the adapter only handles trace/timeline/history; Runtime, World, Event Stream adapters are future work
3. **Count derivation heuristic** — snapshot-based counts are a heuristic; real integration may revise the priority order

### Neutral

1. **`DefaultObservatoryAdapter` is a class** — could be a plain object with a function, but a class provides a clear extension point for dependency injection in future work orders
2. **`unknown` input type** — keeps the interface maximally flexible; internal type narrowing handles all real-world inputs