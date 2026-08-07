import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatoryDiff } from './PromptAssemblyObservatoryDiff'
import type { PromptAssemblyObservatoryDiffer } from './PromptAssemblyObservatoryDiffer'

/**
 * Known observatory fields for comparison.
 *
 * The field declaration order is significant — diff results preserve this
 * order in the output arrays for deterministic, predictable results.
 */
const OBSERVATORY_FIELDS: ReadonlyArray<keyof PromptAssemblyObservatory> = [
  'trace',
  'timeline',
  'history',
  'traceSnapshot',
  'timelineSnapshot',
  'historySnapshot',
]

/**
 * DefaultPromptAssemblyObservatoryDiffer — default implementation of
 * PromptAssemblyObservatoryDiffer.
 *
 * Compares two PromptAssemblyObservatory instances by iterating over all
 * known observatory fields and classifying each field as:
 * 1. **Added** — field present in "after" but not in "before"
 * 2. **Removed** — field present in "before" but not in "after"
 * 3. **Changed** — field present in both but with different value (using !==)
 * 4. **Equal** — field present in both with same value (no output)
 *
 * Fields not in the known OBSERVATORY_FIELDS list are ignored — only
 * recognized observatory fields participate in the diff.
 *
 * Algorithm:
 * - Iterate known fields in declaration order
 * - For each field, check presence in before/after
 * - Classify into added, removed, or changed
 * - Results preserve the OBSERVATORY_FIELDS declaration order
 *
 * Properties:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies either input; result is Object.frozen
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop,
 *   or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyObservatoryDiffer
  implements PromptAssemblyObservatoryDiffer {

  diff(
    before: PromptAssemblyObservatory,
    after: PromptAssemblyObservatory,
  ): PromptAssemblyObservatoryDiff {
    const added: string[] = []
    const removed: string[] = []
    const changed: string[] = []

    for (const field of OBSERVATORY_FIELDS) {
      const beforeValue = before[field]
      const afterValue = after[field]
      const beforeHas = beforeValue !== undefined
      const afterHas = afterValue !== undefined

      if (!beforeHas && afterHas) {
        // Field missing in before → present in after
        added.push(field)
      } else if (beforeHas && !afterHas) {
        // Field present in before → missing in after
        removed.push(field)
      } else if (beforeHas && afterHas && beforeValue !== afterValue) {
        // Field present in both but with different value
        changed.push(field)
      }
      // Equal: present in both with same value → no output
    }

    return Object.freeze({
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      changed: Object.freeze(changed),
    })
  }
}