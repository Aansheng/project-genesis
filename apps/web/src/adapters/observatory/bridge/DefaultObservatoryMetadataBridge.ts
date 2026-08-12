import type { ObservatoryMetadataBridge } from './ObservatoryMetadataBridge'
import type { ObservatoryBridgeData } from './ObservatoryBridgeData'
import { EMPTY_BRIDGE_DATA } from './ObservatoryBridgeData'
import type { PromptObservatoryMetadataBuilder } from '@genesis/ai'
import { DefaultPromptObservatoryMetadataBuilder } from '@genesis/ai'
import type { PromptObservatoryMetadata } from '@genesis/ai'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a value is a non-null object (not an array). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Known observatory section keys that the bridge extracts. */
const KNOWN_KEYS: readonly string[] = [
  'overview',
  'trace',
  'timeline',
  'history',
  'diff',
  'runtime',
  'eventStream',
]

// ---------------------------------------------------------------------------
// DefaultObservatoryMetadataBridge
// ---------------------------------------------------------------------------

/**
 * DefaultObservatoryMetadataBridge — default implementation of
 * ObservatoryMetadataBridge.
 *
 * Consumes PromptObservatoryMetadata via PromptObservatoryMetadataBuilder.
 * Accepts unknown metadata, builds a typed contract via the builder,
 * then extracts known observatory section keys.
 *
 * Ignores unknown keys, never mutates input, always returns a frozen result.
 *
 * Rules:
 * - undefined → empty object
 * - null → empty object
 * - primitive → empty object
 * - array → empty object
 * - invalid shapes → empty object
 * - object → build contract, extract known keys only
 *
 * Builder invoked exactly once per adapt() call.
 *
 * Pure. Stateless. Deterministic.
 */
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