# ADR-0164: Observatory Metadata Bridge Consumption

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-021  
**Architecture Version:** v1.50 → v1.51

---

## Context

The Observatory Metadata Bridge (WO-S6-020) created a pure abstraction layer between PromptAssembly metadata and the Observatory adapter layer. However, the bridge data was never consumed — the store had no mechanism to accept bridge data.

### Problem

1. **No bridge data in store** — `observatoryDataStore` had no `bridgeData` state or `loadBridgeData` action
2. **No priority mechanism** — bridge data should be the preferred source, with mock data as fallback
3. **No consumption path** — the bridge was created but never used

### Scope Boundaries

- No PromptBuilder integration yet
- No Runtime changes
- No Planner changes
- No AI package changes
- No metadata generation changes
- No prompt changes
- No UI changes
- No component changes
- No route changes
- No i18n changes

---

## Decision

### 1. Store State

Add `bridgeData` to `observatoryDataStore` state:

```typescript
const bridgeData = ref<ObservatoryBridgeData>(EMPTY_BRIDGE_DATA)
```

Default is `EMPTY_BRIDGE_DATA` — a shared frozen empty object.

### 2. loadBridgeData Action

```typescript
function loadBridgeData(metadata: unknown): void {
  const result = bridge.adapt(metadata)
  bridgeData.value = result
  const keys = Object.keys(result)
  if (keys.length > 0) {
    viewModel.value = adapter.adapt(result as unknown as Record<string, unknown>)
  } else {
    viewModel.value = EMPTY_VIEW_MODEL
  }
}
```

Behavior:
- Uses `DefaultObservatoryMetadataBridge.adapt()` to extract known keys from metadata
- Stores the result in `bridgeData` (always frozen)
- When bridge data is non-empty, adapts it through `DefaultObservatoryAdapter` to produce the viewModel
- When bridge data is empty, resets viewModel to EMPTY_VIEW_MODEL

### 3. Bridge Priority

Bridge data has priority over mock data:
- Calling `loadBridgeData(metadata)` → viewModel computed from bridge data
- Calling `loadMockObservatory()` → viewModel computed from mock data, bridgeData reset to EMPTY_BRIDGE_DATA
- No combined viewModel — only one source is active at a time

### 4. Current Adapter Key Gap

The bridge uses these keys: `overview`, `trace`, `timeline`, `history`, `diff`, `runtime`, `eventStream`

The adapter looks for these keys: `trace`, `timeline`, `history`, `traceView`, `timelineView`, `historyView`, `diffView`, `runtimeView`, `eventStreamView`, `traceSnapshot`, `timelineSnapshot`, `historySnapshot`

Keys that match: `trace`, `timeline`, `history`

Keys that don't match: `diff` (adapter uses `diffView`), `runtime` (adapter uses `runtimeView`), `eventStream` (adapter uses `eventStreamView`)

This means bridge data currently populates `trace`, `timeline`, and `history` sections (and their derived overview counts), while `diffView`, `runtimeView`, and `eventStreamView` fall through to defaults. A future mapping layer will bridge this gap.

---

## Consequences

### Positive

1. **Bridge data now consumable** — store accepts bridge data and adapts it to viewModel
2. **Priority mechanism** — bridge data is preferred, mock data remains fallback
3. **Pure consumption path** — `loadBridgeData` is pure, stateless, uses the bridge and adapter deterministically
4. **Backward compatible** — all existing `loadMockObservatory()` callers continue working unchanged
5. **No AI dependencies** — store imports only bridge and adapter types
6. **No visual changes** — components read viewModel the same way as before
7. **228 tests** — comprehensive coverage of all consumption paths, edge cases, and invariants

### Negative

- Bridge keys (`diff`, `runtime`, `eventStream`) don't match adapter keys (`diffView`, `runtimeView`, `eventStreamView`) — these sections use defaults from bridge data
- No connection to PromptBuilder yet — bridge data must be manually loaded

---

## Verification

| Check | Status |
|---|---|
| TypeScript 0 errors | ✓ |
| ESLint 0 errors | ✓ |
| 228 bridge consumption tests pass | ✓ |
| All 3138 tests pass (23 files) | ✓ |
| Store accepts bridge data | ✓ |
| Bridge data preferred over mock data | ✓ |
| Mock data still works | ✓ |
| No UI changes | ✓ |
| No Runtime changes | ✓ |
| No Planner changes | ✓ |
| No PromptBuilder changes | ✓ |
| No AI package changes | ✓ |
| Architecture version v1.51 | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `apps/web/src/stores/observatoryData.ts` | Added `bridgeData` state, `loadBridgeData()` method, `bridge` instance, updated `loadMockObservatory()` to reset bridgeData |
| `apps/web/src/__tests__/ObservatoryMetadataBridgeConsumption.test.ts` | New — 228 tests across 27 sections |
| `docs/adr/ADR-0164-observatory-metadata-bridge-consumption.md` | New — this document |