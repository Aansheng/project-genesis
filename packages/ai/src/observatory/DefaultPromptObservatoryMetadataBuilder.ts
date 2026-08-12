import type { PromptObservatoryMetadata } from './PromptObservatoryMetadata'
import type { PromptObservatoryMetadataBuilder } from './PromptObservatoryMetadataBuilder'

// ---------------------------------------------------------------------------
// Known keys
// ---------------------------------------------------------------------------

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
// DefaultPromptObservatoryMetadataBuilder
// ---------------------------------------------------------------------------

/**
 * DefaultPromptObservatoryMetadataBuilder — default implementation of
 * PromptObservatoryMetadataBuilder.
 *
 * Extracts the 7 known observatory keys from raw metadata.
 * Ignores everything else.
 * Preserves the original value for each known key.
 * Returns a frozen object.
 *
 * Rules:
 * - known key present → included with original value
 * - known key absent → omitted (not in output)
 * - unknown key → ignored
 * - undefined/null input → returns empty frozen object
 * - non-object input → returns empty frozen object
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultPromptObservatoryMetadataBuilder
  implements PromptObservatoryMetadataBuilder
{
  build(metadata: Record<string, unknown>): PromptObservatoryMetadata {
    // Handle invalid input
    if (metadata === undefined || metadata === null) {
      return Object.freeze({})
    }
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      return Object.freeze({})
    }

    const result: Record<string, unknown> = {}

    for (const key of KNOWN_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue

      const value = (metadata as Record<string, unknown>)[key]
      result[key] = value
    }

    return Object.freeze(result) as PromptObservatoryMetadata
  }
}