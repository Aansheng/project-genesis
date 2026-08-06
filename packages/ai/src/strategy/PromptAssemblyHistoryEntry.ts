import type { PromptAssemblyTrace } from './PromptAssemblyTrace'

/**
 * PromptAssemblyHistoryEntry — a single entry in a PromptAssemblyHistory.
 *
 * Each entry pairs a zero-based index with the PromptAssemblyTrace from
 * that build. The index represents the build order and is assigned by the
 * builder based on insertion order.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistoryEntry {
  /**
   * Zero-based index indicating build order.
   * Always sequential starting from 0.
   */
  readonly index: number

  /**
   * The PromptAssemblyTrace captured at this build position.
   */
  readonly trace: PromptAssemblyTrace
}