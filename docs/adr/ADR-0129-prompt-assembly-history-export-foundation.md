# ADR-0129: Prompt Assembly History Export Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-082  
**Architecture Version:** v1.15 → v1.16

---

## Context

The Prompt Assembly History architecture already has `PromptAssemblyHistory` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryBuilder` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryDiff` and `PromptAssemblyHistoryDiffer` (WO-S5-078, ADR-0125), and `PromptAssemblyHistoryRenderer` (WO-S5-080, ADR-0127). However, there is no **JSON export capability** for the history.

### Problem

1. **No export interface** — no abstraction for serializing `PromptAssemblyHistory` to a portable string representation
2. **No default implementation** — no canonical way to produce a pretty-printed JSON export of the history
3. **No JSON serialization** — downstream consumers (loggers, debug UIs, storage, network) cannot obtain a stable external representation

---

## Decision

### PromptAssemblyHistoryExporter

A new interface in `packages/ai/src/strategy/PromptAssemblyHistoryExporter.ts`:

```typescript
import type { PromptAssemblyHistory }
from './PromptAssemblyHistory'

export interface PromptAssemblyHistoryExporter {
  export(
    history: PromptAssemblyHistory,
  ): string
}
```

### DefaultPromptAssemblyHistoryExporter

A default implementation in `packages/ai/src/strategy/DefaultPromptAssemblyHistoryExporter.ts`:

```typescript
export class
DefaultPromptAssemblyHistoryExporter
implements PromptAssemblyHistoryExporter
```

Implementation:

```typescript
export(
  history: PromptAssemblyHistory,
): string {
  return JSON.stringify(
    history,
    null,
    2,
  )
}
```

Properties:
- **Pure:** same history always produces same JSON string
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies the input history
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
- **Output is identical to `JSON.stringify(history, null, 2)`**

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `PromptAssemblyHistoryRenderer`
- `DefaultPromptAssemblyHistoryRenderer`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **JSON export capability** — `PromptAssemblyHistoryExporter` provides a clean abstraction for serialization
2. **Pretty-printed JSON** — 2-space indentation, human-readable output
3. **Foundation complete** — export infrastructure exists for future consumption
4. **Backward compatible** — no breaking changes to any public API
5. **Tested** — 105 tests covering interface contract, empty history, single entry, multiple entries, JSON validation, determinism, statelessness, purity, immutability, JSON formatting, edge cases, various content types, exports, architecture compliance, and compatibility

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **105 new tests pass** — in `PromptAssemblyHistoryExportFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.15 → v1.16