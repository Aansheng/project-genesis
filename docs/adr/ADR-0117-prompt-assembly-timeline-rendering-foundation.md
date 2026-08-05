# ADR-0117: Prompt Assembly Timeline Renderer Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-070  
**Architecture Version:** v1.04

---

## Context

The Prompt Assembly Timeline system (WO-S5-066, ADR-0113) introduced `PromptAssemblyTimelineEntry`, `PromptAssemblyTimeline`, `PromptAssemblyTimelineBuilder`, and `DefaultPromptAssemblyTimelineBuilder`. Timeline consumption (WO-S5-067, ADR-0114) wired the timeline builder into `DefaultPromptBuilder`. Timeline diff foundation (WO-S5-068, ADR-0115) and consumption (WO-S5-069, ADR-0116) added comparison and storage.

However, there is currently **no human-readable rendering** of the timeline. Without a renderer, consumers cannot easily display the timeline contents for logging, debugging, observability, or diagnostics.

### Problem

1. **No timeline rendering** — `PromptAssemblyTimeline` instances can only be inspected programmatically
2. **No renderer interface** — no abstraction for converting timelines to human-readable strings
3. **No default implementation** — no canonical strategy for formatting timeline entries

---

## Decision

### PromptAssemblyTimelineRenderer

Introduce a service interface for rendering a timeline as a human-readable string:

```typescript
export interface PromptAssemblyTimelineRenderer {
  render(timeline: PromptAssemblyTimeline): string
}
```

- Pure: same timeline always produces same string
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify the timeline

### DefaultPromptAssemblyTimelineRenderer

Default implementation with the following behavior:

**Non-empty timeline:**
```
Prompt Assembly Timeline

Entries:

#0 create
#1 modify
#2 query
```

**Empty timeline:**
```
Prompt Assembly Timeline

No Entries
```

Rules:
- Header: `"Prompt Assembly Timeline"` followed by a blank line
- Non-empty: `"Entries:"` label, blank line, then one entry per line
- Empty: `"No Entries"` instead of the entries section
- Each entry formatted as `"#{index} {strategyName}"`
- Strategy name extracted from `entry.trace.strategy?.name`
- When strategy or name is missing: `"#{index} unknown"`
- Entries preserve timeline order — no sorting
- No trailing newline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- `PromptAssemblyTimeline`
- `PromptAssemblyTimelineEntry`
- `PromptAssemblyTimelineBuilder`
- `DefaultPromptAssemblyTimelineBuilder`
- `PromptAssemblyTimelineDiff`
- `PromptAssemblyTimelineDiffer`
- `DefaultPromptAssemblyTimelineDiffer`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Timeline rendering** — timelines can now be rendered as human-readable strings
2. **Foundation complete** — timeline renderer infrastructure exists for future consumption
3. **Additive** — no existing code modified
4. **Backward compatible** — no breaking changes to any Public API
5. **Zero new dependencies** — only depends on existing timeline types

### Negative

None.

### Neutral

1. Foundation only — no consumption in `DefaultPromptBuilder` yet
2. Strategy name extracted from `trace.strategy?.name` — no deep inspection of other fields
3. Unknown entries render as `"#N unknown"` — no fallback to other trace properties

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTimelineRenderingFoundation.test.ts` with 80 test cases
  - Interface Contract (5 tests)
  - Empty Timeline (3 tests)
  - Single Entry — create (2 tests)
  - Single Entry — query (1 test)
  - Single Entry — modify (1 test)
  - Single Entry — delete (1 test)
  - Single Entry — unknown (4 tests)
  - Multiple Entries — preserve order (3 tests)
  - Multiple Entries — mixed strategies (2 tests)
  - Multiple Entries — unknown entries (2 tests)
  - Formatting (10 tests)
  - Deterministic (3 tests)
  - Stateless (3 tests)
  - Pure (3 tests)
  - Immutable (3 tests)
  - Export Validation (6 tests)
  - Architecture Compliance (10 tests)
  - Compatibility — RetryPlanner (1 test)
  - Compatibility — ToolCallPlanner (1 test)
  - Compatibility — Streaming (1 test)
  - Compatibility — AgentLoop (1 test)
  - Edge Cases (13 tests)
- **No breaking changes** to any Public API
- **No metadata changes**
- **No prompt changes**

---

## References

- WO-S5-066 — Prompt Assembly Timeline Foundation (ADR-0113)
- WO-S5-067 — Prompt Assembly Timeline Consumption (ADR-0114)
- WO-S5-068 — Prompt Assembly Timeline Diff Foundation (ADR-0115)
- WO-S5-069 — Prompt Assembly Timeline Diff Consumption (ADR-0116)
- WO-S5-070 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTimelineRenderer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTimelineRenderer.ts`