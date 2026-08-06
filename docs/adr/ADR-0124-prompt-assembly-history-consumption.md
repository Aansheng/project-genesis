# ADR-0124: Prompt Assembly History Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-077  
**Architecture Version:** v1.11

---

## Context

The Prompt Assembly History Foundation (WO-S5-076, ADR-0123) introduced `PromptAssemblyHistoryEntry`, `PromptAssemblyHistory`, `PromptAssemblyHistoryBuilder`, and `DefaultPromptAssemblyHistoryBuilder` — but they were **not consumed** by `DefaultPromptBuilder`. The history builder existed, yet no production code produced a `history` in metadata.

### Problem

1. **No history generated** — the history builder domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.history` did not exist
3. **Foundation not consumable** — the history builder was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyHistoryBuilder?: PromptAssemblyHistoryBuilder
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no history

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyHistoryBuilder?: PromptAssemblyHistoryBuilder
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9599767

Inserted between Phase 0.9599765 (PromptAssemblyTimelineSnapshotBuilder) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.9599765  TimelineSnapshotBuilder
Phase 0.9599767  HistoryBuilder  ← NEW
Phase 0.96       PromptAssemblyStrategyResolver
```

### Logic

When both `trace !== undefined` and `this.promptAssemblyHistoryBuilder !== undefined`:

```typescript
history = this.promptAssemblyHistoryBuilder.build([trace])
```

Stored at `metadata.promptAssembly.history`.

### Metadata Rules

- `history` is additive — never overwrites existing fields
- Coexists with all existing metadata
- Not injected into prompt output — metadata only

### No Consumer Changes Beyond BuilderOptions

This work item is **consumption only**. No changes to:
- `PromptRenderer`
- `PromptCompression`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptAssemblyHistoryEntry`
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `DefaultPromptAssemblyHistoryBuilder`

---

## Consequences

### Positive

1. **History generated** — `history` is now stored in metadata during prompt building
2. **Backward compatible** — no breaking changes to any public API
3. **All metadata coexists** — `history` is additive, never overwrites
4. **No prompt changes** — history is metadata-only
5. **Tested** — 65 tests covering BuilderOptions, builder invocation, metadata creation, metadata coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and history validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **65 new tests pass** — 65 tests in `PromptAssemblyHistoryConsumption.test.ts`
- **No prompt changes** — metadata only
- **No API breaking changes** — consumption only
- **Architecture version** v1.10 → v1.11