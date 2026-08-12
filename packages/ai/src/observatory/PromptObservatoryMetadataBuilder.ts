import type { PromptObservatoryMetadata } from './PromptObservatoryMetadata'

/**
 * PromptObservatoryMetadataBuilder — builds a PromptObservatoryMetadata
 * from raw metadata (Record<string, unknown>).
 *
 * Extracts the known observatory sections (overview, trace, timeline,
 * history, diff, runtime, eventStream) and ignores everything else.
 *
 * Design principles:
 * - Pure: no side effects, no I/O
 * - Stateless: no mutable state between calls
 * - Deterministic: same input always produces same output
 * - Immutable: never mutates input, output is frozen
 */
export interface PromptObservatoryMetadataBuilder {
  /**
   * Build a PromptObservatoryMetadata from raw metadata.
   *
   * @param metadata — Raw metadata, typically from PromptBuilder output
   * @returns Frozen PromptObservatoryMetadata with only known keys extracted
   */
  build(metadata: Record<string, unknown>): PromptObservatoryMetadata
}