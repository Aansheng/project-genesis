# ADR-0061: Semantic Context Prompt Integration

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-014  
**Architecture Version:** v0.49

---

## Context

WO-S5-011 established the Semantic Layer foundation. WO-S5-012 integrated SemanticContextBuilder consumption into the Prompt Builder pipeline. WO-S5-013 added SemanticContextRenderer support, writing rendered semantic context to `metadata.promptAssembly.semanticRendered`.

However, the rendered semantic context string is NOT yet injected into the final prompt. It lives only in metadata. The Intent and Entity layers both have full prompt integration — their rendered strings appear as official sections in the final prompt. The Semantic Layer is the last remaining layer that needs prompt integration.

### Problem

1. **No prompt section** — `semanticRendered` is metadata-only, never appears in the final prompt
2. **Incomplete Semantic Layer** — All other layers (Intent, Entity) have prompt integration
3. **No PromptContext field** — `PromptContext` has no `semanticRendered` field
4. **No canonical order entry** — `DefaultPromptRenderer.CANONICAL_ORDER` doesn't include `semanticRendered`
5. **No compression support** — `DefaultPromptCompression.isPromptContextKey()` doesn't recognize `semanticRendered`

### Constraints

1. **Follow existing patterns** — Must match Intent and Entity prompt integration exactly
2. **No interface modifications** — `PromptRenderer`, `PromptBuilder`, `Pipeline`, `Planner`, `Runtime`, `Provider`, `Memory`, `AgentLoop`, `BuilderOptions`, `SemanticContextBuilder`, `SemanticContextRenderer` — all unchanged
3. **Additive only** — New fields, new entries in arrays — no deletions, no modifications to existing fields
4. **No breaking changes** — All existing tests pass unchanged
5. **No Sprint 4 frozen interface modifications**

---

## Decision

### 1. PromptContext: New `semanticRendered` Field

Add an optional `semanticRendered?: string` field to `PromptContext`, positioned after `entityRendered`.

```typescript
interface PromptContext {
  // ... existing fields unchanged ...
  entityRendered?: string
  /** Formatted semantic context text */
  semanticRendered?: string    // ← NEW (WO-S5-014)
  userInput?: string
  // ... remaining fields unchanged ...
}
```

### 2. DefaultPromptRenderer: Canonical Order

Add `'semanticRendered'` to `CANONICAL_ORDER` between `entityRendered` and `system`:

```
intentRendered → entityRendered → semanticRendered → system → userInput → memory → reflections → worldState → observations
```

### 3. DefaultPromptCompression: Known Key

Add `'semanticRendered'` to the `validKeys` array in `isPromptContextKey()`.

### 4. DefaultPromptBuilder: PromptContext Injection

After the SemanticContextRenderer phase (Phase 0.85), inject `semanticRendered` into `promptContext` when it exists and is non-empty:

```typescript
if (semanticRendered !== undefined && semanticRendered.length > 0) {
  promptContext.semanticRendered = semanticRendered
}
```

Also inject into the `renderContext` during the render context construction phase, after `entityRendered` and before `Object.assign(renderContext, compressed)`.

### 5. Final Prompt Order

When all layers are active, the final prompt order is:

```
Intent (User Intent:)
Entity (Entities:)
Semantic Context (Semantic Context:)
System
User Input
Memory
Reflection
World State
Observations
```

### 6. No Other Changes

This WO does NOT modify:
- `PromptRenderer` interface — only `DefaultPromptRenderer` implementation
- `PromptBuilder` interface
- `Pipeline`
- `Planner`
- `AgentLoop`
- `BuilderOptions`
- `SemanticContextBuilder`
- `SemanticContextRenderer`
- Any Sprint 4 Frozen Interface

---

## Consequences

**Positive:**
- Semantic Context now appears as an official section in the final prompt
- All three semantic layers (Intent, Entity, Semantic) have consistent prompt integration
- Canonical order is maintained
- Compression properly recognizes `semanticRendered`
- Backward compatible — all existing tests pass unchanged
- Provider-agnostic — works identically with Mock, OpenAI, DeepSeek

**Negative:**
- None — strictly additive changes

**Neutral:**
- Architecture version bumped to v0.49
- `PromptContext` gains one new optional field

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Semantic → Planner | Pass SemanticContext to Planner for semantic-aware planning |
| Custom Semantic Formats | Alternative rendering formats |

---

## References

- ADR-0058: Semantic Context Foundation
- ADR-0059: Semantic Context Consumption
- ADR-0060: Semantic Context Rendering Foundation
- WO-S5-014: Semantic Context Prompt Integration (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state