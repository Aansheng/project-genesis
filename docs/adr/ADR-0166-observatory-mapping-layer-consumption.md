# ADR-0166: Observatory Mapping Layer Consumption

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-023  
**Architecture Version:** v1.52 → v1.53

---

## Context

WO-S6-022 introduced the `DefaultObservatoryMapper` (a pure, stateless, deterministic mapping layer) but nothing consumed it. The data flow was:

```
Metadata → Bridge → Store → Adapter
```

Bridge output (`ObservatoryBridgeData`) was passed directly to the adapter, bypassing the mapper. This meant:

1. **Key mismatch persisted** — `diff` vs `diffView`, `runtime` vs `runtimeView`, `eventStream` vs `eventStreamView`
2. **No explicit mapping** — the store cast bridge data to `Record<string, unknown>` without resolving naming differences
3. **Invisible resolution** — the mapper existed but was unused

### Problem

The `loadBridgeData` method in `observatoryData.ts` did not call `mapper.map()` before passing data to `adapter.adapt()`. Bridge keys `diff`, `runtime`, and `eventStream` were never renamed to `diffView`, `runtimeView`, `eventStreamView`, so the adapter could not process them.

### Scope Boundaries

- Consumption only — no mapper changes, no adapter changes
- No UI changes
- No Runtime changes
- No Planner changes
- No PromptBuilder changes
- No AI package changes
- No route changes
- No i18n changes

---

## Decision

### 1. Updated Data Flow

```
Metadata → Bridge → Mapper → Store → Adapter
```

The mapper is now a mandatory intermediate layer between bridge and adapter.

### 2. Store Changes

File: `apps/web/src/stores/observatoryData.ts`

**New imports:**
```typescript
import { DefaultObservatoryMapper } from '../adapters/observatory/mapping'
import type { ObservatoryMapper } from '../adapters/observatory/mapping'
```

**New instance:**
```typescript
const mapper: ObservatoryMapper = new DefaultObservatoryMapper()
```

**Updated `loadBridgeData`:**
```typescript
function loadBridgeData(metadata: unknown): void {
    const result = bridge.adapt(metadata)
    bridgeData.value = result
    const mapped = mapper.map(result)       // ← NEW: mapper invocation
    const keys = Object.keys(mapped)
    if (keys.length > 0) {
      viewModel.value = adapter.adapt(mapped as Record<string, unknown>)
    } else {
      viewModel.value = EMPTY_VIEW_MODEL
    }
  }
```

### 3. Invocation Contract

| Component | Invoked | Trigger |
|-----------|---------|---------|
| `bridge.adapt()` | Exactly once | `loadBridgeData` |
| `mapper.map()` | Exactly once | `loadBridgeData` (after bridge) |
| `adapter.adapt()` | Exactly once | `loadBridgeData` (after mapper) |

All three are invoked in order. No component is skipped.

### 4. Behavior After Consumption

| Bridge Key | Mapped To | Adapter Sees |
|-----------|-----------|-------------|
| `diff` | `diffView` | ✅ `diffView` with data |
| `runtime` | `runtimeView` | ✅ `runtimeView` with data |
| `eventStream` | `eventStreamView` | ✅ `eventStreamView` with data |
| `overview` | `overview` | ✅ passthrough |
| `trace` | `trace` | ✅ passthrough |
| `timeline` | `timeline` | ✅ passthrough |
| `history` | `history` | ✅ passthrough |

---

## Consequences

### Positive

1. **Mapper is now consumed** — the mapping layer is fully integrated into the data pipeline
2. **Key renaming works** — `diff`, `runtime`, `eventStream` are correctly renamed to their adapter equivalents
3. **No behavior change for passthrough keys** — `overview`, `trace`, `timeline`, `history` remain unaffected
4. **Backward compatible** — `loadMockObservatory` (bypasses mapper) and public store API are unchanged
5. **Clean separation** — bridge owns extraction, mapper owns renaming, adapter owns transformation

### Negative

1. **Additional function call** — `mapper.map()` adds trivial overhead per `loadBridgeData` invocation
2. **Existing tests updated** — tests that assumed `diff` → adapter default now verify correct mapping

### Neutral

1. **Mapper is an internal implementation detail** — not exposed on the store's public API
2. **No dependency changes** — the mapper has zero external dependencies

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 230+ new tests in `apps/web/src/__tests__/ObservatoryMapperConsumption.test.ts`
- All existing tests continue to pass (with updated expectations for mapper-resolved keys)

---

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/stores/observatoryData.ts` | Modified — added mapper import, instance, consumption |
| `apps/web/src/__tests__/ObservatoryMapperConsumption.test.ts` | New — 230+ tests |
| `apps/web/src/__tests__/ObservatoryMetadataBridgeConsumption.test.ts` | Modified — updated expectations for mapper-resolved keys |
| `docs/adr/ADR-0166-observatory-mapping-layer-consumption.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.53 |
| `docs/project/AI_ARCHITECTURE.md` | Updated — v1.53 |
| `docs/project/CHANGELOG.md` | Updated — v1.53, WO-S6-023 |