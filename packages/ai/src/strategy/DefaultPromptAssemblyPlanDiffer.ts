import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanDiff } from './PromptAssemblyPlanDiff'
import type { PromptAssemblyPlanDiffer } from './PromptAssemblyPlanDiffer'

/**
 * DefaultPromptAssemblyPlanDiffer — default implementation of PromptAssemblyPlanDiffer.
 *
 * Detects three types of changes between two PromptAssemblyPlan instances:
 * 1. **Added sections** — sections present in "after" but not in "before"
 * 2. **Removed sections** — sections present in "before" but not in "after"
 * 3. **Changed priorities** — sections whose priority value differs
 *
 * Algorithm:
 * - Build a Set of section names from each plan (O(n) lookup)
 * - Find added: sections in "after" not in "before"
 * - Find removed: sections in "before" not in "after"
 * - Find changed: sections present in both but with different priority
 * - Results are deterministically ordered by input plan order (added/removed
 *   follow the order they appear in "after" and "before" respectively;
 *   changed follows the order of the "before" plan)
 *
 * Properties:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies either input plan
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyPlanDiffer implements PromptAssemblyPlanDiffer {
  diff(
    before: PromptAssemblyPlan,
    after: PromptAssemblyPlan,
  ): PromptAssemblyPlanDiff {
    const beforeSections = new Set(before.priorities.map(p => p.section))
    const afterSections = new Set(after.priorities.map(p => p.section))

    // Build a map of section → priority for O(1) lookup
    const afterMap = new Map(after.priorities.map(p => [p.section, p.priority]))

    // Added: sections in "after" but not in "before"
    // Preserve order from "after" plan
    const added: string[] = []
    for (const p of after.priorities) {
      if (!beforeSections.has(p.section)) {
        added.push(p.section)
      }
    }

    // Removed: sections in "before" but not in "after"
    // Preserve order from "before" plan
    const removed: string[] = []
    for (const p of before.priorities) {
      if (!afterSections.has(p.section)) {
        removed.push(p.section)
      }
    }

    // Changed: sections present in both but with different priority
    // Preserve order from "before" plan
    const changed: Array<{ section: string; before: number; after: number }> = []
    for (const p of before.priorities) {
      const afterPriority = afterMap.get(p.section)
      if (afterPriority !== undefined && afterPriority !== p.priority) {
        changed.push({ section: p.section, before: p.priority, after: afterPriority })
      }
    }

    // Use Object.freeze to ensure immutability at runtime
    return Object.freeze({
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      changed: Object.freeze(changed.map(c => Object.freeze(c))),
    })
  }
}