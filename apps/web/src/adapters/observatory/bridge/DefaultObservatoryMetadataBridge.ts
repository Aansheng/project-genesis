import type { ObservatoryMetadataBridge } from './ObservatoryMetadataBridge'
import type { ObservatoryBridgeData } from './ObservatoryBridgeData'
import { EMPTY_BRIDGE_DATA } from './ObservatoryBridgeData'

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
 * Accepts unknown metadata and extracts known observatory section keys.
 * Ignores unknown keys, never mutates input, always returns a frozen result.
 *
 * Rules:
 * - undefined → empty object
 * - null → empty object
 * - primitive → empty object
 * - array → empty object
 * - invalid shapes → empty object
 * - object → extract known keys only
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultObservatoryMetadataBridge implements ObservatoryMetadataBridge {
  adapt(metadata: unknown): ObservatoryBridgeData {
    // Handle null, undefined, and non-object input
    if (!isObject(metadata)) {
      return EMPTY_BRIDGE_DATA
    }

    // Extract only known keys
    const result: Record<string, unknown> = {}

    for (const key of KNOWN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(metadata, key)) {
        result[key] = metadata[key]
      }
    }

    return Object.freeze(result) as ObservatoryBridgeData
  }
}