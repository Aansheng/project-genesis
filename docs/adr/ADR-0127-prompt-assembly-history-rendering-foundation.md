# ADR-0127: Prompt Assembly History Renderer Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-080  
**Architecture Version:** v1.13

---

## Context

The Prompt Assembly architecture now has `PromptAssemblyHistory` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryBuilder` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryDiff` (WO-S5-078, ADR-0125), and `PromptAssemblyHistoryDiffer` (WO-S5-078, ADR-0125). However, there is no **human-readable rendering** for `PromptAssemblyHistory`.

### Problem

1. **No history renderer** — no way to produce formatted text from a history
2. **No renderer interface** — no abstraction for history rendering
3. **No default implementation** — no canonical text format for histories

---

## Decision

### PromptAssemblyHistoryRenderer

Service interface for rendering history as human-readable text:

```typescript
export interface PromptAssemblyHistoryRenderer {
  render(history: PromptAssemblyHistory): string
}
```

### DefaultPromptAssemblyHistoryRenderer

Default implementation with the following output format:

**Non-empty:**
```
Prompt Assembly History

Entries:

#0 create
#1 modify
#2 query
```

**Empty:**
```
Prompt Assembly History

No Entries
```

### Rendering Rules

- Strategy extracted from `entry.trace.strategy?.name`
- When strategy name is unavailable, renders `unknown`
- Entries preserve history order — no sorting
- Each entry on its own line: `#<index> <strategy>`

### Implementation Properties

- **Pure:** same history always produces same string
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies the input history
- **No caching** — fresh output on every call
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `DefaultPromptAssemblyHistoryDiffer`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Human-readable rendering** — standardized text format for PromptAssemblyHistory
2. **Clean format** — indexed entries with strategy names, one per line
3. **Graceful fallback** — unknown strategies rendered as "unknown"
4. **Foundation complete** — renderer infrastructure exists for future consumption
5. **Backward compatible** — no breaking changes to any public API
6. **Tested** — 90 tests covering interface contract, empty history, single entry, multiple entries, rendering validation, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — 6157 tests pass
- **90 new tests pass** — in `PromptAssemblyHistoryRenderingFoundation.test.ts`
- **No prompt changes** — foundation only
- **No metadata changes** — foundation only
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.13 → v1.14