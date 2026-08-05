import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTraceDiff } from './PromptAssemblyTraceDiff'

/**
 * PromptAssemblyTraceDiffer — compares two PromptAssemblyTrace instances.
 *
 * Produces a structured diff showing which trace fields were added, removed,
 * or changed between two traces. This enables inspection of how the prompt
 * assembly evolved without coupling to the builder or any downstream consumers.
 *
 * Design principles:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify either trace
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTraceDiffer {
  /**
   * Diff two PromptAssemblyTrace instances.
   *
   * @param before — The trace before the change (or baseline)
   * @param after — The trace after the change (or comparison)
   * @returns A PromptAssemblyTraceDiff describing the field-level changes
   */
  diff(
    before: PromptAssemblyTrace,
    after: PromptAssemblyTrace,
  ): PromptAssemblyTraceDiff
}