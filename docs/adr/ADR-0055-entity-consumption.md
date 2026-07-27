# ADR-0055: Entity Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-008  
**Architecture Version:** v0.43

---

## Context

The Entity Layer (WO-S5-006) established the `EntityAnalyzer` interface and `DefaultEntityAnalyzer` placeholder. WO-S5-007 added the production `RuleBasedEntityAnalyzer` with keyword-based entity detection for 7 entity types. However, neither is integrated into the Prompt Assembly pipeline — the EntityAnalyzer exists but is never called.

The Prompt Assembly pipeline currently:

```
PromptModules → IntentAnalyzer → IntentRenderer → MemoryRanking → PromptBudget → ProviderBudget → PromptSelection → PromptCompression → PromptRenderer
```

Entity information is missing from the pipeline. The `EntityAnalyzer` must be slotted into the assembly flow so that `EntityResult` is available in `AIRequest.metadata`.

### Problem

1. **EntityAnalyzer not called** — `EntityAnalyzer` exists but `DefaultPromptBuilder.build()` never invokes it
2. **No entity metadata** — `EntityResult` is absent from `AIRequest.metadata`
3. **Planner cannot consume entities** — Downstream components cannot read entity information
4. **Entity layer incomplete** — The entity analysis pipeline stage is missing

### Constraints

1. **Same interface** — `EntityAnalyzer` interface unchanged
2. **BuilderOptions additive** — Only add new optional field to BuilderOptions
3. **No new positional parameters** — Only BuilderOptions form available for entityAnalyzer
4. **No PromptContext modification** — EntityResult stored in metadata only, not in PromptContext
5. **No PromptRenderer modification** — Entity results NOT rendered into final prompt
6. **No frozen interface changes** — PromptRenderer, PromptBuilder, PromptCompression, PromptSelection, PromptBudget, ProviderBudget, Runtime, Planner, Pipeline unchanged
7. **Backward compatible** — All existing tests must pass unchanged
8. **Builder remains sole orchestrator** — No component bypasses the builder

---

## Decision

### 1. BuilderOptions Extension

Add an optional `entityAnalyzer` field to `BuilderOptions`:

```typescript
interface BuilderOptions {
  // ... existing fields ...
  /** Optional EntityAnalyzer (defaults to undefined — no entity analysis) */
  entityAnalyzer?: EntityAnalyzer
}
```

- **Additive only** — No modifications to existing fields
- **Optional** — Default is `undefined` (no entity analysis)
- **No new positional parameter** — Only available via BuilderOptions form (same pattern as IntentAnalyzer)

### 2. DefaultPromptBuilder Integration

The `build()` method is extended with a new Phase 0.75 between IntentRenderer and MemoryRanking:

```
PromptModules
    ↓
Phase 0:   IntentAnalyzer.analyze()      — extract intents
    ↓
Phase 0.5: IntentRenderer.render()       — format intents
    ↓
Phase 0.75: EntityAnalyzer.analyze()     — extract entities  ← NEW
    ↓
Phase 1:   MemoryRanking.rank()
    ↓
Phase 2:   PromptBudget.calculate()
    ↓
Phase 2.5: ProviderBudget.getBudget()
    ↓
Phase 3:   PromptSelection.select()
    ↓
Phase 4:   PromptCompression.compress()
    ↓
Phase 5:   PromptRenderer.render()
    ↓
AIRequest { prompt, metadata.promptAssembly }
```

**Implementation details:**
- `EntityAnalyzer` is called with `context.input` (same input as IntentAnalyzer)
- `EntityResult` is stored in `aiRequest.metadata.promptAssembly.entity`
- Not injected into `PromptContext` (no rendering yet)
- Not rendered into final prompt string
- Conditionally present: only when `BuilderOptions.entityAnalyzer` is provided
- The `buildContext()` method is NOT modified — entity analysis only happens during `build()`

### 3. Metadata Shape

```typescript
metadata.promptAssembly = {
  intent?: IntentResult,           // present when intentAnalyzer is injected
  intentRendered?: string,         // present when intentRenderer is injected
  entity?: EntityResult,           // present when entityAnalyzer is injected ← NEW
  ranking: MemoryRankingResult,
  budget: PromptBudgetResult,
  selection: PromptSelectionResult,
  providerBudget?: ProviderBudgetResult,
}
```

### 4. No Integration Beyond Metadata

This WO does NOT:
- Modify PromptContext — entity not added to context fields
- Modify PromptRenderer — entity section not rendered in prompt
- Add entity to BuilderOptions beyond the `entityAnalyzer` field
- Wire EntityAnalyzer into Pipeline, Planner, AgentLoop, or any component outside PromptBuilder

---

## Consequences

**Positive:**
- EntityAnalyzer participates in Prompt Assembly — invoked during every `build()` call
- EntityResult accessible via `AIRequest.metadata.promptAssembly.entity`
- No modifications to any existing interface or frozen component
- All existing tests pass unchanged (1672 total)
- Additive only — BuilderOptions gains one optional field
- Same pattern as IntentAnalyzer consumption — consistent architecture
- Backward compatible — builders without entityAnalyzer produce identical output

**Negative:**
- Entity result not rendered into prompt (deferred to future WO)
- Entity not available in `buildContext()` output
- Only available via BuilderOptions — not via legacy positional constructor

**Neutral:**
- EntityAnalyzer now fully consumed in the pipeline
- Architecture version bumped to v0.43

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Entity Prompt Rendering | Render entity results as "User Entities:" section in final prompt |
| Entity → PromptContext | Add entity result to PromptContext for downstream consumption |
| Entity → Planner | Pass entity information to Planner for entity-aware planning |

---

## References

- ADR-0053: Entity Recognition Foundation
- ADR-0054: Rule-Based Entity Analyzer
- ADR-0050: Intent Consumption (pattern reference)
- WO-S5-008: Entity Consumption (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state