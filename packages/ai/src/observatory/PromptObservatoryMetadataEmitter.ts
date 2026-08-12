import type { PromptObservatoryMetadata } from './PromptObservatoryMetadata'

/**
 * PromptObservatoryMetadataEmitter — emits a PromptObservatoryMetadata
 * from raw metadata (Record<string, unknown>).
 *
 * This is the first official Observatory Metadata emission path inside
 * AI Core. It delegates to PromptObservatoryMetadataBuilder to produce
 * the typed contract.
 *
 * Design principles:
 * - Pure: no side effects, no I/O
 * - Stateless: no mutable state between calls
 * - Deterministic: same input always produces same output
 * - Immutable: never mutates input, output is frozen
 */
export interface PromptObservatoryMetadataEmitter {
  /**
   * Emit a PromptObservatoryMetadata from raw metadata.
   *
   * @param metadata — Raw metadata, typically from PromptBuilder output
   * @returns Frozen PromptObservatoryMetadata with only known keys extracted
   */
  emit(metadata: Record<string, unknown>): PromptObservatoryMetadata
}