import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanner } from './PromptAssemblyPlanner'
import type { PromptSectionPriority } from './PromptSectionPriority'

/**
 * StrategyAwarePromptAssemblyPlanner — strategy-aware implementation of
 * PromptAssemblyPlanner.
 *
 * Produces different priority plans based on the selected strategy name.
 * Each strategy (create, query, modify, delete) has a distinct set of
 * section priorities reflecting its semantic intent. The default strategy
 * assigns all sections priority 100 (neutral).
 *
 * Priority rules:
 *
 * | Section                | create | query | modify | delete | default |
 * |------------------------|--------|-------|--------|--------|---------|
 * | userInput              | 100    | 100   | 100    | 100    | 100     |
 * | worldState             | 90     | 90    | 90     | 90     | 100     |
 * | entityRendered         | 0      | 0     | 85     | 85     | 100     |
 * | strategyModuleRendered | 80     | 60    | 50     | 50     | 100     |
 * | strategyRendered       | 70     | 50    | 40     | 40     | 100     |
 * | memory                 | 30     | 80    | 70     | 70     | 100     |
 * | observations           | 20     | 70    | 60     | 80     | 100     |
 * | (others)               | 0      | 0     | 0      | 0      | 100     |
 *
 * Design principles:
 * - Pure: same inputs always produce same plan
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify strategy name or sections
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class StrategyAwarePromptAssemblyPlanner implements PromptAssemblyPlanner {
  /** Default priority for all sections under the default strategy */
  static readonly DEFAULT_PRIORITY = 100

  /** Priority for sections not listed in a strategy's table */
  static readonly UNKNOWN_PRIORITY = 0

  buildPlan(
    strategyName: string,
    sections: readonly string[],
  ): PromptAssemblyPlan {
    const priorityTable = STRATEGY_PRIORITY_TABLE[strategyName]

    if (priorityTable === undefined) {
      // Unknown strategy — all sections get default priority
      const priorities: PromptSectionPriority[] = sections.map(section => ({
        section,
        priority: StrategyAwarePromptAssemblyPlanner.DEFAULT_PRIORITY,
      }))
      return { priorities }
    }

    // Strategy-specific priorities
    const priorities: PromptSectionPriority[] = sections.map(section => ({
      section,
      priority: priorityTable[section] ?? StrategyAwarePromptAssemblyPlanner.UNKNOWN_PRIORITY,
    }))

    return { priorities }
  }
}

/**
 * Strategy priority table — maps strategy name → { section → priority }.
 *
 * Readonly for safety — the planner reads from this table without modification.
 */
const STRATEGY_PRIORITY_TABLE: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  create: {
    userInput: 100,
    worldState: 90,
    strategyModuleRendered: 80,
    strategyRendered: 70,
    memory: 30,
    observations: 20,
  },
  query: {
    userInput: 100,
    worldState: 90,
    memory: 80,
    observations: 70,
    strategyModuleRendered: 60,
    strategyRendered: 50,
  },
  modify: {
    userInput: 100,
    worldState: 90,
    entityRendered: 85,
    memory: 70,
    observations: 60,
    strategyModuleRendered: 50,
    strategyRendered: 40,
  },
  delete: {
    userInput: 100,
    worldState: 90,
    entityRendered: 85,
    observations: 80,
    memory: 70,
    strategyModuleRendered: 50,
    strategyRendered: 40,
  },
}