import type { PromptObservatoryMetadata } from './PromptObservatoryMetadata'
import type { PromptObservatoryMetadataEmitter } from './PromptObservatoryMetadataEmitter'
import type { PromptObservatoryMetadataBuilder } from './PromptObservatoryMetadataBuilder'
import { DefaultPromptObservatoryMetadataBuilder } from './DefaultPromptObservatoryMetadataBuilder'

// ---------------------------------------------------------------------------
// DefaultPromptObservatoryMetadataEmitter
// ---------------------------------------------------------------------------

/**
 * DefaultPromptObservatoryMetadataEmitter — default implementation of
 * PromptObservatoryMetadataEmitter.
 *
 * Delegates to PromptObservatoryMetadataBuilder to produce a typed
 * PromptObservatoryMetadata contract from raw metadata.
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
export class DefaultPromptObservatoryMetadataEmitter
  implements PromptObservatoryMetadataEmitter
{
  private readonly builder: PromptObservatoryMetadataBuilder

  constructor(builder?: PromptObservatoryMetadataBuilder) {
    this.builder = builder ?? new DefaultPromptObservatoryMetadataBuilder()
  }

  emit(metadata: Record<string, unknown>): PromptObservatoryMetadata {
    // Delegate to builder — it handles validation, extraction, and freezing
    return this.builder.build(metadata)
  }
}