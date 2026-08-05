# ADR-0111: Prompt Assembly Trace Export Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-064  
**Architecture Version:** v0.98

---

## Context

The Prompt Assembly Trace system (WO-S5-058 through WO-S5-063) introduced trace creation, comparison, diffing, rendering, and consumption — but there was **no way to export a trace as a serialized, portable format**. The trace domain model existed as a structured data object, yet had no JSON or other external representation for storage, network transfer, or integration with external tools.

### Problem

1. **No portable export** — `PromptAssemblyTrace` had no serialized representation
2. **No exporter interface** — no abstraction for trace-to-string conversion
3. **No default exporter** — no canonical external format for trace representation

---

## Decision

### PromptAssemblyTraceExporter

Introduce an exporting interface:

```typescript
export interface PromptAssemblyTraceExporter {
  export(trace: PromptAssemblyTrace): string
}
```

- Single responsibility: convert trace to serialized string
- Pure: same trace always produces same string
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors

### DefaultPromptAssemblyTraceExporter

The default implementation uses `JSON.stringify(trace, null, 2)` to produce a pretty-printed JSON representation with 2-space indentation, preserving the full trace structure exactly.

**Output format:**

```json
{
  "strategy": {
    "name": "create"
  },
  "strategySelection": {
    "selected": "create",
    "candidates": []
  },
  "plan": {
    "priorities": [
      { "section": "userInput", "priority": 100 }
    ]
  }
}
```

**Properties:**

- Pretty-printed JSON with 2-space indentation
- Preserves all trace fields exactly
- Deterministic: same trace always produces same JSON
- Pure: never mutates the input trace
- Stateless: no internal state between calls
- Output is identical to `JSON.stringify(trace, null, 2)`

### NOT Modified

- `PromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `Runtime` — unchanged
- `Planner` — unchanged
- `Pipeline` — unchanged
- `AgentLoop` — unchanged
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `PromptAssemblyTraceDiffer` — unchanged
- `PromptAssemblyTraceRenderer` — unchanged
- Prompt output — unchanged (foundation only, no consumption)

---

## Consequences

### Positive

1. **Portable export** — traces can now be exported as JSON
2. **Canonical format** — all consumers get consistent JSON output
3. **Deterministic** — same trace always produces same JSON
4. **Pure** — no side effects, no mutation
5. **Standard format** — uses `JSON.stringify` with standard parameters
6. **Foundation only** — no consumers, no breaking changes, no prompt changes

### Negative

None.

### Neutral

1. JSON encoding is lossless for all JSON-safe types
2. `undefined` values are omitted from JSON output (standard JSON behavior)
3. Foundation only — not consumed by any production code yet

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceExportFoundation.test.ts` with 80 test cases
  - Interface contract (3 tests)
  - JSON export (12 tests)
  - Exact output (5 tests)
  - Deterministic (4 tests)
  - Stateless (2 tests)
  - Pure (3 tests)
  - JSON formatting (6 tests)
  - Edge cases (10 tests)
  - Various content types (10 tests)
  - Exports (6 tests)
  - Architecture compliance (14 tests)
  - Compatibility (4 tests)
- **No breaking changes** to any Public API
- **No prompt output changes** — foundation only

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — Prompt Assembly Trace Diff Foundation (ADR-0107)
- WO-S5-061 — Prompt Assembly Trace Diff Consumption (ADR-0108)
- WO-S5-062 — Prompt Assembly Trace Rendering Foundation (ADR-0109)
- WO-S5-063 — Prompt Assembly Trace Renderer Consumption (ADR-0110)
- WO-S5-064 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTraceExporter.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTraceExporter.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceExportFoundation.test.ts`