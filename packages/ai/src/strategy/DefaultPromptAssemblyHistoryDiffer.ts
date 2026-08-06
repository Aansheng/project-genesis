import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistoryDiff } from './PromptAssemblyHistoryDiff'
import type { PromptAssemblyHistoryDiffer } from './PromptAssemblyHistoryDiffer'
import type { PromptAssemblyHistoryEntry } from './PromptAssemblyHistoryEntry'

/**
 * DefaultPromptAssemblyHistoryDiffer — default implementation of
 * PromptAssemblyHistoryDiffer.
 *
 * Compares two PromptAssemblyHistory instances by iterating over history
 * entries and classifying each index as:
 * 1. **Added** — entry index present in "after" but not in "before"
 * 2. **Removed** — entry index present in "before" but not in "after"
 * 3. **Changed** — entry index present in both but with different trace
 *    reference (using !== comparison)
 * 4. **Equal** — entry index present in both with same trace reference
 *    (no output)
 *
 * Algorithm:
 * - Build a Map<number, PromptAssemblyHistoryEntry> from each history for
 *   O(1) lookup
 * - Added: iterate "after" entries, check if index is missing in "before"
 * - Removed: iterate "before" entries, check if index is missing in "after"
 * - Changed: iterate "before" entries, check if matching index in "after"
 *   has a different trace reference
 * - Results preserve encounter order from their respective source histories
 *
 * Properties:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies either input; result is Object.frozen
 * - No sorting: preserves encounter order from source histories
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop,
 *   or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyHistoryDiffer
  implements PromptAssemblyHistoryDiffer
{
  diff(
    before: PromptAssemblyHistory,
    after: PromptAssemblyHistory,
  ): PromptAssemblyHistoryDiff {
    // Build lookup maps for O(1) entry retrieval
    const beforeMap: Map<number, PromptAssemblyHistoryEntry> = new Map(
      before.entries.map(e => [e.index, e]),
    )
    const afterMap: Map<number, PromptAssemblyHistoryEntry> = new Map(
      after.entries.map(e => [e.index, e]),
    )

    // Added: indexes in "after" but not in "before"
    // Preserve encounter order from "after" history
    const added: number[] = []
    for (const entry of after.entries) {
      if (!beforeMap.has(entry.index)) {
        added.push(entry.index)
      }
    }

    // Removed: indexes in "before" but not in "after"
    // Preserve encounter order from "before" history
    const removed: number[] = []
    for (const entry of before.entries) {
      if (!afterMap.has(entry.index)) {
        removed.push(entry.index)
      }
    }

    // Changed: indexes present in both but with different trace reference
    // Preserve encounter order from "before" history
    const changed: number[] = []
    for (const entry of before.entries) {
      const afterEntry = afterMap.get(entry.index)
      if (afterEntry && entry.trace !== afterEntry.trace) {
        changed.push(entry.index)
      }
    }

    return Object.freeze({
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      changed: Object.freeze(changed),
    })
  }
}