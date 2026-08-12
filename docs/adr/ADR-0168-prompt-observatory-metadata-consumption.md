# ADR-0168: Prompt Observatory Metadata Consumption

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-025  
**Architecture Version:** v1.54 → v1.55

---

## Context

The Observatory data flow has a `PromptObservatoryMetadata` interface and `DefaultPromptObservatoryMetadataBuilder` (ADR-0167, WO-S6-024), but the Bridge layer (`DefaultObservatoryMetadataBridge`) still accepts `unknown` metadata directly and performs its own key extraction.

### Problem

1. **No typed contract path** — `unknown` metadata bypasses the `PromptObservatoryMetadata` contract
2. **Duplicate extraction logic** — the bridge and the builder both extract the same known keys independently
3. **No builder dependency** — the bridge has no way to consume the typed contract
4. **Future integration risk** — PromptBuilder will produce `PromptObservatoryMetadata`, and the bridge must consume it

### Previous Consumption Pattern

The bridging + consumption pattern has been successfully established in prior work orders:

- **WO-S6-021** (ADR-0164): Observatory Metadata Bridge Consumption — consumed bridge data via the Pinia store
- **WO-S6-023** (ADR-0166): Observatory Mapping Layer Consumption — consumed mapper from the data store
- **WO-S6-025** (this ADR): Consumes `PromptObservatoryMetadataBuilder` from within the bridge

### Scope Boundaries

- Consumption only — no PromptBuilder emission yet
- No PromptBuilder changes
- No Runtime changes
- No Planner changes
- No Pipeline changes
- No AgentLoop changes
- No Metadata generation changes
- No UI changes
- No adapter changes
- No mapper changes

---

## Decision

### 1. Modify `DefaultObservatoryMetadataBridge`

Add a `PromptObservatoryMetadataBuilder` dependency:

```typescript
export class DefaultObservatoryMetadataBridge implements ObservatoryMetadataBridge {
  private readonly builder: PromptObservatoryMetadataBuilder

  constructor(builder?: PromptObservatoryMetadataBuilder) {
    this.builder = builder ?? new DefaultPromptObservatoryMetadataBuilder()
  }

  adapt(metadata: unknown): ObservatoryBridgeData {
    // Handle null, undefined, and non-object input
    if (!isObject(metadata)) {
      return EMPTY_BRIDGE_DATA
    }

    // Step 1: Build metadata contract via PromptObservatoryMetadataBuilder
    const contract: PromptObservatoryMetadata = this.builder.build(metadata)

    // Step 2: Read only contract fields
    const result: Record<string, unknown> = {}
    for (const key of KNOWN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(contract, key)) {
        result[key] = (contract as Record<string, unknown>)[key]
      }
    }

    return Object.freeze(result) as ObservatoryBridgeData
  }
}
```

### 2. Flow

```
unknown metadata
      ↓
DefaultObservatoryMetadataBridge.adapt()
      ↓
isObject check → EMPTY_BRIDGE_DATA for invalid
      ↓
PromptObservatoryMetadataBuilder.build(metadata)  ← exactly once
      ↓
PromptObservatoryMetadata (typed contract)
      ↓
Extract known keys from contract
      ↓
ObservatoryBridgeData (frozen)
```

### 3. Builder Invocation

- Builder is invoked **exactly once** per valid `adapt()` call
- Builder is **NOT invoked** for invalid inputs (undefined, null, primitives, arrays)
- Default builder is `DefaultPromptObservatoryMetadataBuilder`
- Custom builder can be injected via constructor

### 4. Preserved Behavior

| Scenario | Before | After |
|----------|--------|-------|
| `undefined` | `EMPTY_BRIDGE_DATA` | `EMPTY_BRIDGE_DATA` |
| `null` | `EMPTY_BRIDGE_DATA` | `EMPTY_BRIDGE_DATA` |
| `42` | `EMPTY_BRIDGE_DATA` | `EMPTY_BRIDGE_DATA` |
| `[]` | `EMPTY_BRIDGE_DATA` | `EMPTY_BRIDGE_DATA` |
| `{ overview: {} }` | `{ overview: {} }` | `{ overview: {} }` |
| Full metadata | 7 keys extracted | 7 keys extracted |
| Unknown keys | Ignored | Ignored |
| Frozen output | Yes | Yes |

### 5. No Public API Changes

- `adapt(metadata: unknown): ObservatoryBridgeData` — unchanged signature
- `ObservatoryMetadataBridge` interface — unchanged
- `ObservatoryBridgeData` — unchanged
- `EMPTY_BRIDGE_DATA` — unchanged

---

## Consequences

### Positive

1. **First official metadata contract path** — `unknown → builder → PromptObservatoryMetadata → bridge`
2. **Single builder invocation** — exactly one call per adapt, deterministic
3. **Injectable builder** — custom builders for testing or transformation
4. **Backward compatible** — all existing 3615+ tests continue to pass
5. **No UI changes** — consumer layer unaffected

### Negative

1. **One additional abstraction** — the builder adds one more layer between raw metadata and bridge output
2. **Additional test surface** — 274 new tests to verify builder integration

### Neutral

1. **Bridge now depends on @genesis/ai** — the bridge imports `PromptObservatoryMetadataBuilder` and `DefaultPromptObservatoryMetadataBuilder`
2. **Future PromptBuilder emission** — WO-S6-026+ will use `PromptObservatoryMetadataBuilder` at the emission point

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 274 tests passing in `apps/web/src/__tests__/PromptObservatoryMetadataConsumption.test.ts`
- All existing 3615+ tests continue to pass
- No UI changes
- No Runtime changes
- No PromptBuilder changes
- No Metadata generation changes

---

## Files Created/Modified

| File | Action |
|------|--------|
| `apps/web/src/adapters/observatory/bridge/DefaultObservatoryMetadataBridge.ts` | Modified — added PromptObservatoryMetadataBuilder dependency |
| `apps/web/src/__tests__/PromptObservatoryMetadataConsumption.test.ts` | New — 274 tests |
| `docs/adr/ADR-0168-prompt-observatory-metadata-consumption.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.55, WO-S6-025 |
| `docs/project/AI_ARCHITECTURE.md` | Updated — v1.55 header |
| `docs/project/CHANGELOG.md` | Updated — v1.55, WO-S6-025 |