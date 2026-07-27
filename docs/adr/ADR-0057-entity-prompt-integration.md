# ADR-0057: Entity Prompt Integration

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-010  
**Architecture Version:** v0.45

---

## Context

The Entity Layer has EntityAnalyzer (WO-S5-006/007), Entity consumption (WO-S5-008), and Entity rendering (WO-S5-009). EntityResult is analyzed, rendered, and stored in metadata. However, the rendered entity string is NOT yet injected into the final prompt — the LLM cannot see entity information.

Current pipeline:

```
EntityAnalyzer → EntityRenderer → metadata.promptAssembly.entityRendered
                                    ↓
                                  NOT in prompt
```

### Problem

1. **Entity invisible to LLM** — EntityResult is metadata-only, never in the prompt
2. **Planner can't use entity info** — LLM must re-parse entity references from raw text
3. **Entity layer incomplete** — Analysis, rendering, and consumption exist, but prompt integration is missing

### Constraints

1. **Additive to PromptContext** — Add `entityRendered?: string` field (optional, non-breaking)
2. **Canonical ordering** — Entity section follows Intent section, precedes User Input
3. **Empty section omitted** — Empty/undefined entityRendered produces no section
4. **No blank line duplication** — Single blank line between sections
5. **No PromptRenderer interface changes** — Renderer already handles any PromptContext key
6. **No PromptBuilder interface changes** — Builder is the only orchestrator
7. **No frozen interface changes** — PromptCompression, PromptSelection, PromptBudget, etc. unchanged
8. **Backward compatible** — All existing tests pass unchanged

---

## Decision

### 1. PromptContext Extension

```typescript
interface PromptContext {
  system?: string
  intentRendered?: string
  entityRendered?: string          // ← NEW
  userInput?: string
  memory?: string
  worldState?: string
  observations?: string
  reflections?: string
}
```

- **Additive only** — No modifications to existing fields
- **Optional** — Absent or empty → no entity section in prompt
- **No breaking changes** — All existing code continues working

### 2. Canonical Order Update

DefaultPromptRenderer.CANONICAL_ORDER updated:

```typescript
CANONICAL_ORDER = [
  'intentRendered',    // User Intent section
  'entityRendered',    // Entities section       ← NEW
  'system',            // System instructions
  'userInput',         // User input
  'memory',            // Conversation history
  'reflections',       // Reflection results
  'worldState',        // World snapshot
  'observations',      // Tool observations
]
```

Entity section rendered after intent, before all other sections.

### 3. DefaultPromptCompression Update

`isPromptContextKey()` updated to recognize `'entityRendered'` as a valid PromptContext key.

### 4. DefaultPromptBuilder Injection

During `build()`, `entityRendered` is injected into the render context after `intentRendered`:

```typescript
const renderContext: PromptContext = {}
if (intentRendered !== undefined && intentRendered.length > 0) {
  renderContext.intentRendered = intentRendered
}
if (entityRendered !== undefined && entityRendered.length > 0) {
  renderContext.entityRendered = entityRendered    // ← NEW
}
Object.assign(renderContext, compressed)
```

### 5. Rendering Behavior

```
Empty entity     → "User Intent:\n- Create\n\nUser Input:\nDraw a tree"
                   (no entity section)

Single entity    → "User Intent:\n- Create\n\nEntities:\n- Tree\n\nUser Input:\nDraw a tree"

Multiple entities → "User Intent:\n- Create\n\nEntities:\n- Tree\n- Flower\n\nUser Input:\nDraw a tree"
```

Sections are separated by exactly one blank line (`\n\n`). Empty/undefined entityRendered is filtered out by the renderer — no blank lines, no placeholders.

---

## Consequences

**Positive:**
- Entity information now visible to the LLM in the generated prompt
- Canonical order: Intent → Entities → System → User Input → ...
- Empty entity produces no section — prompt identical to pre-entity state
- Blank line rules consistent with intent section
- No modifications to any existing interface or frozen component
- All existing tests pass unchanged (1752 total)
- Builder remains sole orchestrator

**Negative:**
- None — additive and backward compatible

**Neutral:**
- PromptContext gains one optional field
- Architecture version bumped to v0.45

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Entity Quantity | Render entity count (e.g., "2x Tree") |
| Entity Position | Include entity position/context in prompt |
| Custom Entity Format | Configurable entity rendering format |

---

## References

- ADR-0052: Intent Prompt Integration (pattern reference)
- ADR-0056: Entity Rendering Foundation (predecessor)
- WO-S5-010: Entity Prompt Integration (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state