# ADR-0056: Entity Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-009  
**Architecture Version:** v0.44

---

## Context

The Entity Layer has `EntityAnalyzer` (WO-S5-006/007) with production keyword-based entity detection. WO-S5-008 wired `EntityAnalyzer` into the Prompt Assembly pipeline, storing `EntityResult` in `AIRequest.metadata.promptAssembly.entity`.

However, there is no rendering abstraction for converting `EntityResult` to a formatted string. Downstream components have no standard way to display entity information.

The pipeline currently:

```
EntityAnalyzer
    ↓
EntityResult → metadata.promptAssembly.entity
```

### Problem

1. **No entity rendering** — `EntityResult` is raw data with no string representation
2. **No architectural mirror** — `IntentRenderer` exists but no `EntityRenderer`
3. **No reusable rendering** — Any component needing entity text must re-implement formatting
4. **Entity layer incomplete** — Analysis exists, rendering does not

### Constraints

1. **Same pattern as IntentRenderer** — Single-method interface returning string
2. **Pure, stateless, deterministic** — No side effects, no state, no I/O
3. **No PromptContext modification** — Rendered string stored in metadata only
4. **No PromptRenderer modification** — Entity not rendered into final prompt
5. **No frozen interface changes** — PromptRenderer, PromptCompression, PromptSelection, etc. unchanged
6. **Builder remains sole orchestrator** — EntityRenderer only called from DefaultPromptBuilder
7. **Backward compatible** — All existing tests pass unchanged

---

## Decision

### 1. EntityRenderer Interface

```typescript
interface EntityRenderer {
  render(entity: EntityResult): string
}
```

- Single-method interface mirroring `IntentRenderer`
- Accepts `EntityResult`, returns formatted string
- Pure, stateless, deterministic
- No dependencies on any component
- Future implementations: MarkdownEntityRenderer, JSONEntityRenderer, etc.

### 2. DefaultEntityRenderer

```typescript
class DefaultEntityRenderer implements EntityRenderer {
  render(entity: EntityResult): string
}
```

**Rendering rules:**
- Empty `EntityResult` → empty string `""`
- Single entity → `"Entities:\n- Tree"`
- Multiple entities → `"Entities:\n- Tree\n- Flower\n- House"`
- Preserves `EntityResult` order (no sorting)
- No localization (always uses English entity type names)

**Properties:**
- Pure function: same input always produces same output
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No dependencies on Planner, Runtime, Provider, Memory, or any other component

### 3. BuilderOptions Extension

```typescript
interface BuilderOptions {
  // ... existing fields ...
  entityRenderer?: EntityRenderer
}
```

- **Additive only** — No modifications to existing fields
- **Optional** — Default is `undefined` (no entity rendering)
- **Only BuilderOptions form** — No new positional parameter

### 4. DefaultPromptBuilder Integration

New Phase 0.875 between EntityAnalyzer (Phase 0.75) and MemoryRanking (Phase 1):

```
Phase 0.75: EntityAnalyzer.analyze()     → entityResult
    ↓
Phase 0.875: EntityRenderer.render()     → entityRendered ← NEW
    ↓
Phase 1: MemoryRanking.rank()
```

**Implementation:**
- `EntityRenderer.render()` called only when both `EntityAnalyzer` AND `EntityRenderer` are injected
- `entityRendered` stored in `metadata.promptAssembly.entityRendered`
- Not injected into `PromptContext`
- Not rendered into final prompt

### 5. Metadata Shape

```typescript
metadata.promptAssembly = {
  intent?: IntentResult,
  intentRendered?: string,
  entity?: EntityResult,
  entityRendered?: string,        // ← NEW
  ranking: MemoryRankingResult,
  budget: PromptBudgetResult,
  selection: PromptSelectionResult,
  providerBudget?: ProviderBudgetResult,
}
```

---

## Consequences

**Positive:**
- Entity rendering abstraction mirrors IntentRenderer architecture
- DefaultEntityRenderer provides clean "Entities:" format
- EntityRenderer integrated into Prompt Assembly — invoked during every `build()` call
- entityRendered available in `AIRequest.metadata.promptAssembly.entityRendered`
- No modifications to any existing interface or frozen component
- All existing tests pass unchanged (1717 total)
- Pure, stateless, deterministic — consistent with all pipeline components
- Additive only — BuilderOptions gains one optional field
- Backward compatible — builders without EntityRenderer produce identical output

**Negative:**
- Entity result not rendered into final prompt (deferred)
- Not available via legacy positional constructor (same as IntentRenderer)

**Neutral:**
- EntityRenderer added to public API
- Architecture version bumped to v0.44

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Entity Prompt Rendering | Inject entityRendered into PromptContext for final prompt |
| MarkdownEntityRenderer | Alternative rendering with markdown formatting |
| JSONEntityRenderer | Machine-readable entity rendering |

---

## References

- ADR-0051: Intent Rendering Foundation (pattern reference)
- ADR-0055: Entity Consumption (predecessor)
- WO-S5-009: Entity Rendering Foundation (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state