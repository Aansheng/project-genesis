# ADR-0167: Prompt Observatory Metadata Contract Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-024  
**Architecture Version:** v1.53 → v1.54

---

## Context

The Observatory data flow currently uses `unknown` metadata inside the Bridge layer. There is no official strongly-typed contract between PromptBuilder and Observatory for the metadata that flows through the pipeline.

### Problem

1. **No typed contract** — `unknown` metadata provides no type safety or documentation
2. **No builder abstraction** — no pure function exists to extract known observatory sections from raw metadata
3. **Future integration risk** — without a contract, PromptBuilder→Observatory integration will require ad-hoc type casting
4. **No foundation** — downstream consumption (WO-S6-025+) depends on this contract

### Scope Boundaries

- Foundation only — no PromptBuilder consumption
- No Runtime changes
- No Planner changes
- No Pipeline changes
- No AgentLoop changes
- No Metadata generation changes
- No UI changes
- No web package imports

---

## Decision

### 1. Create `packages/ai/src/observatory/` directory

```
packages/ai/src/observatory/
├── PromptObservatoryMetadata.ts                    # Interface
├── PromptObservatoryMetadataBuilder.ts             # Builder interface
├── DefaultPromptObservatoryMetadataBuilder.ts      # Implementation
└── index.ts                                        # Barrel exports
```

### 2. PromptObservatoryMetadata Interface

```typescript
export interface PromptObservatoryMetadata {
  readonly overview?: unknown
  readonly trace?: unknown
  readonly timeline?: unknown
  readonly history?: unknown
  readonly diff?: unknown
  readonly runtime?: unknown
  readonly eventStream?: unknown
}
```

All fields are:
- **Optional** — empty object is valid
- **Readonly** — typed as immutable
- **`unknown`** — opaque payload, no ViewModel/UI type coupling
- **No web package imports**

### 3. PromptObservatoryMetadataBuilder Interface

```typescript
export interface PromptObservatoryMetadataBuilder {
  build(metadata: Record<string, unknown>): PromptObservatoryMetadata
}
```

### 4. DefaultPromptObservatoryMetadataBuilder Behavior

| Input | Output |
|-------|--------|
| Known key present | Included with original value |
| Known key absent | Omitted from output |
| Unknown key | Ignored |
| `undefined` / `null` | Returns empty frozen object |
| Non-object / array | Returns empty frozen object |

**Guarantees:**
- **Pure** — no side effects, no I/O
- **Stateless** — no mutable state between calls
- **Deterministic** — same input always produces same output
- **Immutable** — never mutates input, output is always frozen
- **Safe** — `hasOwnProperty` check prevents prototype chain leakage
- **Non-throwing** — returns empty frozen object for any input

### 5. Known Keys

| Key | Type |
|-----|------|
| `overview` | `unknown` |
| `trace` | `unknown` |
| `timeline` | `unknown` |
| `history` | `unknown` |
| `diff` | `unknown` |
| `runtime` | `unknown` |
| `eventStream` | `unknown` |

### 6. Exports

**`packages/ai/src/observatory/index.ts`**:
```typescript
export type { PromptObservatoryMetadata } from './PromptObservatoryMetadata'
export type { PromptObservatoryMetadataBuilder } from './PromptObservatoryMetadataBuilder'
export { DefaultPromptObservatoryMetadataBuilder } from './DefaultPromptObservatoryMetadataBuilder'
```

**`packages/ai/src/index.ts`** — added exports:
```typescript
export type { PromptObservatoryMetadata } from './observatory'
export type { PromptObservatoryMetadataBuilder } from './observatory'
export { DefaultPromptObservatoryMetadataBuilder } from './observatory'
```

---

## Consequences

### Positive

1. **Strongly typed contract** — `PromptObservatoryMetadata` provides type safety for metadata
2. **Pure builder** — `build()` is pure, stateless, deterministic, non-throwing
3. **Safe defaults** — all invalid/empty inputs return empty frozen object
4. **No mutation** — input is never modified, output is always frozen
5. **No AI coupling** — the contract has zero dependencies on AI internals
6. **Foundation for consumption** — downstream work orders can now consume the contract

### Negative

1. **Additional abstraction** — one more layer before full PromptBuilder integration
2. **Future work required** — consumption and integration are separate work orders

### Neutral

1. **Internal implementation detail** — the builder is an internal component of the AI package
2. **No dependency changes** — the builder has zero external dependencies

---

## Verification

- TypeScript: 0 errors
- ESLint: 0 errors
- 250+ tests passing in `packages/ai/src/__tests__/PromptObservatoryMetadataFoundation.test.ts`
- All existing AI package tests continue to pass

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/observatory/PromptObservatoryMetadata.ts` | New |
| `packages/ai/src/observatory/PromptObservatoryMetadataBuilder.ts` | New |
| `packages/ai/src/observatory/DefaultPromptObservatoryMetadataBuilder.ts` | New |
| `packages/ai/src/observatory/index.ts` | New |
| `packages/ai/src/index.ts` | Modified — added observatory exports |
| `packages/ai/src/__tests__/PromptObservatoryMetadataFoundation.test.ts` | New — 250+ tests |
| `docs/adr/ADR-0167-prompt-observatory-metadata-contract-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.54 |
| `docs/project/AI_ARCHITECTURE.md` | Updated — v1.54 |
| `docs/project/CHANGELOG.md` | Updated — v1.54, WO-S6-024 |