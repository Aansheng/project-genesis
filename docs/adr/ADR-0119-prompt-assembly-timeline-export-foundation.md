# ADR-0119: Prompt Assembly Timeline Export Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-072  
**Architecture Version:** v1.06

---

## Context

The Prompt Assembly Timeline system (WO-S5-066, ADR-0113) introduced `PromptAssemblyTimeline`, `PromptAssemblyTimelineEntry`, and `PromptAssemblyTimelineBuilder`. Timeline consumption (WO-S5-067, ADR-0114) wired the timeline builder into `DefaultPromptBuilder`. Timeline diff foundation (WO-S5-068, ADR-0115) and consumption (WO-S5-069, ADR-0116) added comparison and storage. Timeline renderer foundation (WO-S5-070, ADR-0117) and consumption (WO-S5-071, ADR-0118) added human-readable rendering.

However, there is currently **no JSON export** of the timeline. Without an exporter, consumers cannot serialize the timeline for storage, logging, network transmission, or debugging UIs.

### Problem

1. **No timeline export** — `PromptAssemblyTimeline` instances cannot be serialized to string
2. **No exporter interface** — no abstraction for converting timelines to portable external representations
3. **No default implementation** — no canonical strategy for JSON serialization

---

## Decision

### PromptAssemblyTimelineExporter

Introduce a service interface for exporting a timeline as a serialized string:

```typescript
export interface PromptAssemblyTimelineExporter {
  export(timeline: PromptAssemblyTimeline): string
}
```

- Pure: same timeline always produces same string
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify the timeline
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### DefaultPromptAssemblyTimelineExporter

Default implementation that exports via `JSON.stringify(timeline, null, 2)`:

```typescript
export class DefaultPromptAssemblyTimelineExporter
  implements PromptAssemblyTimelineExporter {

  export(timeline: PromptAssemblyTimeline): string {
    return JSON.stringify(timeline, null, 2)
  }
}
```

**Output format:**

```json
{
  "entries": [
    {
      "index": 0,
      "trace": {
        "strategy": {
          "name": "create"
        }
      }
    }
  ]
}
```

Properties:
- **Deterministic:** same timeline always produces identical JSON string
- **Pure:** never modifies the input timeline
- **Stateless:** no internal state between calls
- **Immutable:** never modifies the input timeline

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
- `PromptAssemblyTimelineRenderer`
- `DefaultPromptAssemblyTimelineRenderer`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Timeline export** — timelines can now be exported as pretty-printed JSON
2. **Exact JSON.stringify match** — output is identical to `JSON.stringify(timeline, null, 2)`
3. **Foundation complete** — timeline exporter infrastructure exists for future consumption
4. **Backward compatible** — no breaking changes to any public API
5. **No dependency creep** — pure JSON serialization, no external dependencies
6. **Tested** — 80+ tests covering interface contract, empty timeline, single entry, multiple entries, JSON validation, determinism, statelessness, purity, immutability, export validation, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **80+ new tests pass** — 80+ tests in `PromptAssemblyTimelineExportFoundation.test.ts`
- **No prompt changes** — foundation only
- **No metadata changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.05 → v1.06