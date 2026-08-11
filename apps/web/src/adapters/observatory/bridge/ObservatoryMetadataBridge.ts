import type { ObservatoryBridgeData } from './ObservatoryBridgeData'

/**
 * ObservatoryMetadataBridge — abstraction that sits between PromptBuilder
 * Metadata and the ObservatoryAdapter layer.
 *
 * The bridge accepts raw (unknown) metadata and extracts observatory-safe
 * sections into an ObservatoryBridgeData object. Each section is kept as
 * unknown — the adapter layer validates the shape independently.
 *
 * Design principles:
 * - Pure — no side effects, no I/O, no exceptions
 * - Stateless — identical input always produces identical output
 * - Deterministic — no randomness, no temporal dependencies
 * - Immutable — never mutates input, output is frozen
 * - No AI imports — no dependency on PromptAssembly, PromptBuilder, etc.
 * - No Runtime imports — no dependency on Runtime types
 *
 * Foundation only — no connection to PromptBuilder yet.
 */
export interface ObservatoryMetadataBridge {
  /**
   * Accept unknown metadata and return an ObservatoryBridgeData
   * with only the observatory-safe sections extracted.
   *
   * @param metadata — raw metadata, typically from PromptBuilder output
   * @returns immutable ObservatoryBridgeData
   */
  adapt(metadata: unknown): ObservatoryBridgeData
}