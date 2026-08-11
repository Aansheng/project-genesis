# ADR-0162: Observatory Event Stream Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-019  
**Architecture Version:** v1.48 → v1.49

---

## Context

WO-S6-008 delivered the Live Event Stream panel (`ObservatoryEventStream.vue`) with mock event generation, seed event pool, and timer-driven appends defined inside the component file. WO-S6-013 through WO-S6-018 integrated the Overview, Trace, Timeline, History, Diff, and Runtime panels with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the Event Stream — the seventh real data integration for Sprint 6 Observatory panels.

### Problem

1. **Mock event generation in component** — `SEEDS` array, `formatTimestamp()` helper, `INITIAL_EVENTS` constant, and `appendEvent()` timer all defined inside `ObservatoryEventStream.vue`
2. **Timer-driven appends** — `setInterval` at 2000ms with MAX_EVENTS (100) cap owned by the component
3. **No ViewModel consumption** — the event stream does not read from `ObservatoryViewModel`
4. **No EventStreamViewModel type** — the ViewModel had no event stream-specific viewer DTO type
5. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping event stream data

### Scope Boundaries

- No Runtime package integration
- No Planner integration
- No PromptBuilder integration
- No AI package changes
- No Strategy changes
- No metadata changes
- No prompt changes
- No visual changes to the Event Stream layout

---

## Decision

### 1. EventStreamViewModel, EventViewModel, EventLevel

Added to `ObservatoryViewModel.ts`:

```typescript
export type EventLevel = 'info' | 'warning' | 'error'

export interface EventViewModel {
  readonly id: string
  readonly timestamp: string
  readonly level: EventLevel
  readonly source: string
  readonly message: string
}

export interface EventStreamViewModel {
  readonly events: readonly EventViewModel[]
}
```

Design principles:
- **UI-safe** — no Runtime, AI, Planner, or PromptBuilder types
- **Immutable** — all fields are `readonly`
- **Minimal** — only fields consumed by EventStreamItem and EventStreamList
- **Typed level** — `EventLevel` union ensures components only handle three valid values

### 2. `eventStreamView` in Root ViewModel

Updated `ObservatoryViewModel` with:

```typescript
export interface ObservatoryViewModel {
  // ... existing fields ...
  readonly eventStreamView: EventStreamViewModel
}
```

### 3. DefaultObservatoryAdapter: `adaptEventStreamView()`

Added private method to `DefaultObservatoryAdapter`:

```typescript
private adaptEventStreamView(observatory): EventStreamViewModel
```

- Expects `observatory.eventStreamView` to be an object with `events` array
- Maps each array item through `adaptEventViewModel()` for individual field safety
- Defaults invalid levels to `'info'` (safe fallback)
- Returns `DEFAULT_EVENT_STREAM` (`{ events: [] }`) for missing/null/non-object input
- Output is fully frozen (`Object.freeze` on array, on each event, and on the ViewModel)
- Called from the main `adapt()` method alongside all other panel adapters

### 4. Store Data

Added 20 mock events to `stores/observatoryData.ts`:

| ID | Level | Source | Message |
|---|---|---|---|
| evt-001 | info | PromptBuilder | Prompt received |
| evt-002 | info | StrategyResolver | Strategy selected |
| evt-003 | info | Planner | Plan generated |
| evt-004 | warning | Runtime | Entity spawn delayed |
| evt-005 | error | Provider | Response timeout |
| evt-006 | info | PromptBuilder | Prompt validated |
| evt-007 | info | Memory | Context loaded |
| evt-008 | warning | Runtime | NPC path recalculated |
| evt-009 | info | Planner | Plan optimized |
| evt-010 | error | Provider | Stream interrupted |
| evt-011 | info | Runtime | Villager arrived at Tavern |
| evt-012 | warning | AI | Context compression threshold reached |
| evt-013 | info | Provider | Stream chunk received |
| evt-014 | info | Runtime | Guard patrol route updated |
| evt-015 | error | Planner | Plan validation failed |
| evt-016 | info | AI | Prompt rendered |
| evt-017 | warning | Runtime | Merchant stock low |
| evt-018 | info | Provider | Response completed |
| evt-019 | info | Runtime | Farm harvested |
| evt-020 | info | Planner | ModifyStrategy applied |

Variety: 13 info, 4 warning, 3 error events; sources include PromptBuilder, StrategyResolver, Planner, Runtime, Provider, Memory, and AI.

### 5. Component Update

**Removed from `ObservatoryEventStream.vue`:**
- `MAX_EVENTS` constant
- `APPEND_INTERVAL_MS` constant
- `StreamEventSeed` interface
- `SEEDS` array (20 seed pool entries)
- `clockTick` counter
- `formatTimestamp()` function
- `INITIAL_EVENTS` array
- `nextNumber` counter
- `streamTimer` state
- `appendEvent()` function
- `onMounted` / `onBeforeUnmount` lifecycle hooks

**Added:**
- `useObservatoryDataStore()` import and instance
- `storeEvents` computed — maps `EventViewModel[]` from the store to `StreamEvent[]` consumed by child components
- Filter logic now operates on store-derived data

**Preserved:**
- `EventFilterBar` component
- `EventStreamList` component
- `EventStreamItem` component integration
- Filter state and filter switching
- Layout, styles, and scoped CSS
- Title rendering through i18n

---

## Consequences

### Positive

1. **Component no longer owns mock data** — zero inline event generation
2. **Event data flows through the established ViewModel → Adapter → Store path**
3. **Backward compatible** — all 143 existing tests pass with updated expectations
4. **Pure adapter mapping** — `adaptEventStreamView()` is pure, stateless, deterministic
5. **No visual regressions** — layout, filtering, rendering, and i18n all identical
6. **Frozen output** — no accidental mutation of event data

### Negative

1. Timer-driven live appends are removed (deferred to a future WO with real observatory event subscription)

### Neutral

- Event data now requires `loadMockObservatory()` to be called before rendering populated stream
- Component must have a Pinia store active (same as all other integrated panels)

---

## Verification

| Check | Status |
|---|---|
| TypeScript 0 errors | ✓ |
| ESLint 0 errors | ✓ |
| 143 existing EventStream tests pass | ✓ |
| 192 new integration tests pass | ✓ |
| All 2735 tests pass (21 files) | ✓ |
| Event Stream no longer owns mock event data | ✓ |
| Event data comes from ObservatoryViewModel | ✓ |
| Uses DefaultObservatoryAdapter | ✓ |
| No Runtime changes | ✓ |
| No Planner changes | ✓ |
| No PromptBuilder changes | ✓ |
| No AI package changes | ✓ |
| No Strategy changes | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | Added `EventStreamViewModel`, `EventViewModel`, `EventLevel` types; added `eventStreamView` to root ViewModel |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | Added `adaptEventStreamView()`, `adaptEventViewModel()`, `adaptEventLevel()`; updated `adapt()` and defaults |
| `apps/web/src/adapters/observatory/index.ts` | Exported new types |
| `apps/web/src/stores/observatoryData.ts` | Added 20 mock events; updated mock types |
| `apps/web/src/components/observatory/events/ObservatoryEventStream.vue` | Removed mock generation, reads from store |
| `apps/web/src/__tests__/ObservatoryEventStream.test.ts` | Updated 143 tests for store-driven component |
| `apps/web/src/__tests__/ObservatoryEventStreamDataIntegration.test.ts` | 192 new integration tests (20 sections) |
| Fixed 6 other test files for new `eventStreamView` field | ObservatoryOverviewDataIntegration, TraceDataIntegration, TimelineDataIntegration, HistoryDataIntegration, DiffDataIntegration, RuntimeDataIntegration, Adapter |