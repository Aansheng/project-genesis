# ADR-0172: Prompt Assembly Domain Model Foundation

**Status:** Accepted  
**Date:** Sprint 7  
**Work Order:** WO-S7-001  
**Architecture Version:** v1.58 → v1.59

---

## Context

The current Observatory metadata contract (`PromptObservatoryMetadata`) uses `unknown`-based section payloads:

```typescript
export interface PromptObservatoryMetadata {
  readonly overview?: unknown
  readonly trace?: unknown
  readonly timeline?: unknown
  readonly history?: unknown
  readonly diff?: unknown
  readonly runtime?: unknown
  readonly eventStream?: unknown
}
```

This was acceptable during Sprint 6, when the priority was establishing the data pipeline (Bridge → Mapper → Adapter → Store → UI). The `unknown`-slot pattern kept the contract decoupled and future-proof.

### Problem

1. **No typed Prompt Assembly representation** — the raw Prompt Assembly output has no typed domain model
2. **`unknown` everywhere** — every consumer must re-validate data shapes independently
3. **DSL preparation gap** — Sprint 7 begins preparation for Game DSL, which requires typed domain structures
4. **No parallel model** — breaking the `unknown` contract is not an option; a parallel typed model is needed

### Scope Boundaries

- Parallel model only — does NOT replace `PromptObservatoryMetadata`
- No breaking changes — existing `unknown`-based pipeline continues unchanged
- No Runtime, Renderer, Planner, Pipeline, UI, Store, Bridge, Mapper, or Adapter changes
- No DSL implementation — this is the *foundation* for future DSL work

---

## Decision

### 1. Create `PromptAssemblyDomainModel`

A new typed domain model interface with 7 typed sections, each replacing an `unknown` slot:

| Section | Domain Interface | Key Fields |
|---------|-----------------|------------|
| overview | `OverviewDomain` | `traceCount`, `timelineCount`, `historyCount` |
| trace | `TraceDomain[]` | `id`, `label`, `steps: TraceStepDomain[]` |
| timeline | `TimelineDomain[]` | `id`, `label`, `entries: TimelineEntryDomain[]` |
| history | `HistoryDomain[]` | `id`, `label`, `entries: HistoryEntryDomain[]` |
| diff | `DiffDomain[]` | `id`, `timestamp`, `added`, `removed`, `changed` |
| runtime | `RuntimeDomain` | `worldId`, `entityCount`, `entities: RuntimeEntityDomain[]` |
| eventStream | `EventStreamDomain` | `events: EventDomain[]` |

All interfaces follow these design principles:
- **readonly** — all fields are readonly
- **immutable** — output is always frozen via `Object.freeze()`
- **serializable** — all types are JSON-serializable primitives
- **framework-independent** — no Vue, Pinia, or web framework imports
- **runtime-independent** — no Runtime type imports
- **UI-independent** — no ViewModel or UI type imports

### 2. Create `PromptAssemblyDomainModelBuilder`

Converts `PromptObservatoryMetadata` → `PromptAssemblyDomainModel`:

```
PromptObservatoryMetadata (unknown slots)
  ↓
PromptAssemblyDomainModelBuilder.build()
  ↓
PromptAssemblyDomainModel (typed sections)
```

Rules:
- **Pure** — no side effects, no I/O
- **Stateless** — no mutable state between calls
- **Deterministic** — same input always produces same output
- **No mutation** — input is never modified
- **Frozen output** — output is always frozen

Section adaptation logic:
- Valid sections are typed and included
- Invalid sections are omitted (undefined)
- Empty arrays are omitted
- All array items and nested objects are frozen
- Health values are converted to string
- Event levels default to `'info'` for invalid values

### 3. Location

All files live in `packages/ai/src/observatory/domain/`:

| File | Purpose |
|------|---------|
| `PromptAssemblyDomainModel.ts` | All domain model interfaces |
| `PromptAssemblyDomainModelBuilder.ts` | Builder interface + default implementation |
| `index.ts` | Re-exports |

Exported through `packages/ai/src/observatory/index.ts` via `export * from './domain'`.

### 4. Compatibility

- `PromptObservatoryMetadata` is UNCHANGED
- All existing consumers (Bridge, Mapper, Adapter, Store, UI) continue to work
- The domain model is opt-in — no migration required

---

## Consequences

### Positive

1. **First typed Prompt Assembly domain model** — replaces `unknown` with structured types
2. **Parallel model** — no breaking changes to existing pipeline
3. **DSL-ready foundation** — Sprint 8 DSL work can build on typed domain structures
4. **Defensive extraction** — all sections use safe helpers (`safeNumber`, `safeString`, `safeEventLevel`)
5. **63 tests** — covers construction, empty, full, partial, immutability, determinism, serialization, edge cases

### Negative

1. **Code duplication** — the builder's adapt functions resemble the Adapter's private methods (intentional: domain and ViewModel have different responsibilities)
2. **Additional test surface** — 63 new tests

### Neutral

1. **Internal to AI package** — no public API changes
2. **No web package changes** — Bridge, Mapper, Adapter, Store, UI unchanged

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 63 tests passing in `packages/ai/src/__tests__/PromptAssemblyDomainModelBuilder.test.ts`
- All 8493 existing AI package tests pass
- All 3929 existing web package tests pass
- No breaking changes
- No Runtime changes
- No UI changes
- No Store changes
- No Bridge changes
- No Mapper changes
- No Adapter changes

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/observatory/domain/PromptAssemblyDomainModel.ts` | New — 7 typed domain interfaces |
| `packages/ai/src/observatory/domain/PromptAssemblyDomainModelBuilder.ts` | New — builder interface + default implementation |
| `packages/ai/src/observatory/domain/index.ts` | New — re-exports |
| `packages/ai/src/observatory/index.ts` | Modified — added `export * from './domain'` |
| `packages/ai/src/__tests__/PromptAssemblyDomainModelBuilder.test.ts` | New — 63 tests |
| `docs/adr/ADR-0172-prompt-assembly-domain-model-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.59, WO-S7-001 |
| `docs/project/CHANGELOG.md` | Updated — v1.59, WO-S7-001 |