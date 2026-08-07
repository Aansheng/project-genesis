# ADR-0141: Prompt Assembly Observatory Snapshot Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-094  
**Architecture Version:** v1.27 → v1.28

---

## Context

PromptAssemblyObservatory is the unified aggregation container for all prompt assembly observability data, consolidating six artifacts: trace, timeline, history, traceSnapshot, timelineSnapshot, and historySnapshot. It already has builder, differ, renderer, and exporter capabilities.

Following the established snapshot pattern (`PromptAssemblySnapshot`, `PromptAssemblyTimelineSnapshot`, `PromptAssemblyHistorySnapshot`), the observatory now requires a condensed summary capability.

### Problem

1. **No observatory snapshot** — no mechanism to produce a lightweight summary of PromptAssemblyObservatory
2. **No snapshot interface** — no contract defining the condensed observatory representation
3. **No default builder** — no canonical implementation for building the observatory snapshot

---

## Decision

### PromptAssemblyObservatorySnapshot

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatorySnapshot.ts`:

```typescript
export interface PromptAssemblyObservatorySnapshot {
  readonly artifactCount: number

  readonly hasTrace: boolean
  readonly hasTimeline: boolean
  readonly hasHistory: boolean

  readonly hasTraceSnapshot: boolean
  readonly hasTimelineSnapshot: boolean
  readonly hasHistorySnapshot: boolean

  readonly rendered?: string
  readonly exported?: string
}
```

### PromptAssemblyObservatorySnapshotBuilder

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatorySnapshotBuilder.ts`:

```typescript
export interface PromptAssemblyObservatorySnapshotBuilder {
  build(
    observatory: PromptAssemblyObservatory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyObservatorySnapshot
}
```

### DefaultPromptAssemblyObservatorySnapshotBuilder

A new class in `packages/ai/src/strategy/DefaultPromptAssemblyObservatorySnapshotBuilder.ts`:

- **artifactCount** — counts present artifacts among trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot (0–6)
- **boolean flags** — `hasTrace`, `hasTimeline`, `hasHistory`, `hasTraceSnapshot`, `hasTimelineSnapshot`, `hasHistorySnapshot` reflect presence of each artifact
- **metadata extraction** — reads `metadata.observatoryRendered` → `rendered` and `metadata.observatoryExported` → `exported`
- **Only stored when value is a string** — non-string values (number, boolean, object, array, null) are ignored, not converted
- Unknown metadata keys silently ignored

### Design Properties

- **Pure** — same observatory + metadata always produces same snapshot
- **Stateless** — no internal state between calls
- **Deterministic** — no randomness or external factors
- **Immutable** — never modifies the input observatory or metadata; returns a fresh object
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
- **No PromptBuilder dependency**

### Exports

Updated `packages/ai/src/strategy/index.ts` and `packages/ai/src/index.ts` to export type and class:
- `PromptAssemblyObservatorySnapshot`
- `PromptAssemblyObservatorySnapshotBuilder`
- `DefaultPromptAssemblyObservatorySnapshotBuilder`

### No Consumer Changes

This work item is **foundation only**. No modifications to:
- `PromptBuilder`
- `BuilderOptions`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptRenderer`
- `PromptCompression`
- `Metadata`
- `Prompt Output`

No PromptBuilder changes. No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Observatory snapshot capability** — `PromptAssemblyObservatorySnapshot` interface defined
2. **Default implementation** — `DefaultPromptAssemblyObservatorySnapshotBuilder` computes artifact count, presence flags, and optional rendered/exported extraction
3. **Foundation only** — no consumer changes, no breakage risk
4. **Tested** — 146 tests covering interface contract, empty observatory, six single artifacts, multiple artifacts, artifact count, boolean flags, metadata extraction (rendered, exported, both, missing, wrong types), determinism, statelessness, purity, immutability, export validation, architecture compliance, compatibility, and edge cases
5. **Backward compatible** — no existing code modified beyond export additions

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **146 new tests pass** — in `PromptAssemblyObservatorySnapshotFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.27 → v1.28