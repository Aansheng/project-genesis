# ADR-0139: Prompt Assembly Observatory Export Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-092  
**Architecture Version:** v1.25 → v1.26

---

## Context

PromptAssemblyObservatory is the unified aggregation container for all prompt assembly observability data, consolidating six artifacts: trace, timeline, history, traceSnapshot, timelineSnapshot, and historySnapshot.

While the observatory already has rendering capability (WO-S5-090, ADR-0137), there is no mechanism to export it as a serialized string representation. Following the established pattern of PromptAssemblyTraceExporter, PromptAssemblyTimelineExporter, and PromptAssemblyHistoryExporter, the observatory now requires an export capability.

### Problem

1. **No observatory exporter** — no mechanism to export PromptAssemblyObservatory as a serialized string
2. **No export interface** — no contract defining how observatory export should behave
3. **No default exporter** — no canonical implementation for exporting the observatory

---

## Decision

### PromptAssemblyObservatoryExporter

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatoryExporter.ts`:

```typescript
export interface PromptAssemblyObservatoryExporter {
  export(observatory: PromptAssemblyObservatory): string
}
```

Single method contract — accepts an observatory, returns a serialized string.

### DefaultPromptAssemblyObservatoryExporter

A new class in `packages/ai/src/strategy/DefaultPromptAssemblyObservatoryExporter.ts`:

```typescript
export class DefaultPromptAssemblyObservatoryExporter
  implements PromptAssemblyObservatoryExporter
{
  export(observatory: PromptAssemblyObservatory): string {
    return JSON.stringify(observatory, null, 2)
  }
}
```

Output is pretty-printed JSON with 2-space indentation, identical to `JSON.stringify(observatory, null, 2)`.

### Design Properties

- **Pure** — same observatory always produces same JSON string
- **Stateless** — no internal state between calls
- **Deterministic** — no randomness or external factors
- **Immutable** — never modifies the input observatory
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### Exports

Updated `packages/ai/src/strategy/index.ts` and `packages/ai/src/index.ts` to export type and class.

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

1. **Observatory export capability** — `PromptAssemblyObservatoryExporter` interface defined
2. **Default implementation** — `DefaultPromptAssemblyObservatoryExporter` via pretty-printed JSON
3. **Foundation only** — no consumer changes, no breakage risk
4. **Tested** — 100+ tests covering interface contract, empty observatory, six single artifacts, multiple artifacts, JSON validation, pretty printing, determinism, statelessness, purity, immutability, export validation, architecture compliance, edge cases, error handling, and compatibility
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
- **100+ new tests pass** — in `PromptAssemblyObservatoryExportFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No metadata changes** — foundation only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.25 → v1.26