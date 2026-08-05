import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTraceDiff } from './PromptAssemblyTraceDiff'
import type { PromptAssemblyTraceDiffer } from './PromptAssemblyTraceDiffer'

/**
 * Known trace fields for comparison.
 *
 * The field declaration order is significant — diff results preserve this
 * order in the output arrays for deterministic, predictable results.
 */
const TRACE_FIELDS: ReadonlyArray<keyof PromptAssemblyTrace> = [
  'strategy',
  'strategySelection',
  'plan',
  'optimizedPlan',
  'planDiff',
  'snapshot',
  'inspector',
  'inspectorRendered',
  'inspectorExported',
]

/**
 * DefaultPromptAssemblyTraceDiffer — default implementation of
 * PromptAssemblyTraceDiffer.
 *
 * Compares two PromptAssemblyTrace instances by iterating over all known
 * trace fields and classifying each field as:
 * 1. **Added** — field present in "after" but not in "before"
 * 2. **Removed** — field present in "before" but not in "after"
 * 3. **Changed** — field present in both but with different value (using !==)
 * 4. **Equal** — field present in both with same value (no output)
 *
 * Fields not in the known TRACE_FIELDS list are ignored — only recognized
 * trace fields participate in the diff.
 *
 * Algorithm:
 * - Iterate known fields in declaration order
 * - For each field, check presence in before/after
 * - Classify into added, removed, or changed
 * - Results preserve the TRACE_FIELDS declaration order
 *
 * Properties:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies either input; result is Object.frozen
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTraceDiffer implements PromptAssemblyTraceDiffer {
  diff(
    before: PromptAssemblyTrace,
    after: PromptAssemblyTrace,
  ): PromptAssemblyTraceDiff {
    const added: string[] = []
    const removed: string[] = []
    const changed: string[] = []

    for (const field of TRACE_FIELDS) {
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