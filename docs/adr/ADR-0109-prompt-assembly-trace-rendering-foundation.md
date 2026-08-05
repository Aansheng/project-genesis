# ADR-0109: Prompt Assembly Trace Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-062  
**Architecture Version:** v0.96

---

## Context

The Prompt Assembly Trace system (WO-S5-058 through WO-S5-061) introduced `PromptAssemblyTrace`, `PromptAssemblyTraceBuilder`, `PromptAssemblyTraceDiff`, and `PromptAssemblyTraceDiffer` — but there was **no way to render a trace as human-readable text**. The trace domain model existed as a structured data object, yet had no formatted representation for logging, debugging, observability, or diagnostics.

### Problem

1. **No human-readable rendering** — `PromptAssemblyTrace` had no `toString()` equivalent
2. **No renderer interface** — no abstraction for trace-to-string conversion
3. **No default renderer** — no canonical output format for trace representation

---

## Decision

### PromptAssemblyTraceRenderer

Introduce a rendering interface:

```typescript
export interface PromptAssemblyTraceRenderer {
  render(trace: PromptAssemblyTrace): string
}
```

- Single responsibility: convert trace to human-readable string
- Pure: same trace always produces same string
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors

### DefaultPromptAssemblyTraceRenderer

The default implementation produces the following format:

```
Prompt Assembly Trace

Strategy:
create

Components:

- strategySelection
- plan
- optimizedPlan
- planDiff
- snapshot
- inspector
- inspectorRendered
- inspectorExported
```

**Rules:**

| Condition | Output |
|-----------|--------|
| strategy present with `{ name }` | `Strategy:\n<name>\n` |
| strategy present without `name` | `Strategy:\n<toString()>\n` |
| strategy absent | Strategy section omitted entirely |
| No components (only strategy or empty) | `No Components` |
| Components present | Bullet list of present field names |
| Empty trace | `Prompt Assembly Trace\n\nNo Components` |

**Component order:**

Follows `PromptAssemblyTrace` field declaration order:

1. `strategySelection`
2. `plan`
3. `optimizedPlan`
4. `planDiff`
5. `snapshot`
6. `inspector`
7. `inspectorRendered`
8. `inspectorExported`

The `strategy` field is rendered separately as a header section; all other present fields are listed under Components. No sorting is applied — the declaration order is the canonical order.

**Not modified:**

- `PromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `Runtime` — unchanged
- `Planner` — unchanged
- `Pipeline` — unchanged
- `AgentLoop` — unchanged
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `PromptAssemblyTraceDiffer` — unchanged
- `DefaultPromptAssemblyTraceDiffer` — unchanged
- Prompt output — unchanged (foundation only, no consumption)

---

## Consequences

### Positive

1. **Human-readable rendering** — traces can now be rendered as formatted text
2. **Canonical format** — all consumers get consistent output
3. **Deterministic** — same trace always produces same string
4. **Pure** — no side effects, no mutation
5. **Strategy header** — strategy is rendered separately as a named header
6. **Component list** — all other fields are listed as bullet items
7. **Foundation only** — no consumers, no breaking changes, no prompt changes

### Negative

None.

### Neutral

1. Strategy values without a `name` property are rendered via `String()` (e.g., `[object Object]`)
2. The `strategy` field is rendered as a header while all other fields are components
3. Foundation only — not consumed by any production code yet

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceRenderingFoundation.test.ts` with 82 test cases
  - Interface contract (3 tests)
  - Empty trace (5 tests)
  - Strategy rendering (7 tests)
  - Component rendering (11 tests)
  - Ordering (3 tests)
  - Deterministic (4 tests)
  - Stateless (2 tests)
  - Pure (3 tests)
  - Edge cases (10 tests)
  - Exact output (6 tests)
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
- WO-S5-062 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTraceRenderer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTraceRenderer.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceRenderingFoundation.test.ts`