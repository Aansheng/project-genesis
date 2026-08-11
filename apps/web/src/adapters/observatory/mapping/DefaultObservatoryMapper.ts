import type { ObservatoryMapper } from './ObservatoryMapper'
import type { ObservatoryBridgeData } from '../bridge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value should be considered "empty" and thus omitted.
 * undefined, null, empty array, and empty object (own keys only) are empty.
 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length === 0
  }
  return false
}

// ---------------------------------------------------------------------------
// Mapping table
// ---------------------------------------------------------------------------

/**
 * Mapping from bridge key to adapter key.
 * Keys with identical names use the same value — they are pass-through.
 */
const BRIDGE_TO_ADAPTER: Record<string, string> = {
  overview: 'overview',
  trace: 'trace',
  timeline: 'timeline',
  history: 'history',
  diff: 'diffView',
  runtime: 'runtimeView',
  eventStream: 'eventStreamView',
}

/** Bridge keys in canonical order. */
const BRIDGE_KEYS: readonly string[] = Object.keys(BRIDGE_TO_ADAPTER)

// ---------------------------------------------------------------------------
// DefaultObservatoryMapper
// ---------------------------------------------------------------------------

/**
 * DefaultObservatoryMapper — default implementation of ObservatoryMapper.
 *
 * Maps each bridge key to its corresponding adapter key.
 * Omits undefined, null, and empty values.
 * Never mutates input.
 * Always returns a frozen result.
 *
 * Rules:
 * - undefined → omitted
 * - null → omitted
 * - empty array → omitted
 * - empty object → omitted
 * - valid value → included with mapped key
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultObservatoryMapper implements ObservatoryMapper {
  map(bridgeData: ObservatoryBridgeData): Record<string, unknown> {
    // Handle invalid input
    if (bridgeData === undefined || bridgeData === null) {
      return Object.freeze({})
    }
    if (typeof bridgeData !== 'object' || Array.isArray(bridgeData)) {
      return Object.freeze({})
    }

    const result: Record<string, unknown> = {}

    for (const bridgeKey of BRIDGE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(bridgeData, bridgeKey)) continue

      const value = (bridgeData as Record<string, unknown>)[bridgeKey]

      // Skip empty values
      if (isEmpty(value)) continue

      const adapterKey = BRIDGE_TO_ADAPTER[bridgeKey]
      result[adapterKey] = value
    }

    return Object.freeze(result)
  }
}