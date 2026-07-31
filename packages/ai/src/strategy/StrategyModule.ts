import type { PromptModule } from '../prompt/modules/PromptModule'

/**
 * StrategyModule — strategy-specific PromptModule.
 *
 * Extends PromptModule to allow each strategy to contribute prompt content.
 * Each StrategyModule has a `name` that matches its corresponding PromptStrategy's
 * `name`, enabling the PromptBuilder to resolve the correct module for the
 * selected strategy.
 *
 * Resolution rule: `module.name === strategy.name`
 *
 * Each concrete strategy module produces deterministic guideline text
 * that shapes LLM behavior for its intent category:
 * - CreateStrategyModule  → name='create', "Creation Guidelines: …"
 * - QueryStrategyModule   → name='query', "Query Guidelines: …"
 * - ModifyStrategyModule  → name='modify', "Modification Guidelines: …"
 * - DeleteStrategyModule  → name='delete', "Deletion Guidelines: …"
 *
 * Properties:
 * - Pure: same PipelineContext always produces same output string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface StrategyModule extends PromptModule {
  /** Strategy name — matches PromptStrategy.name for module resolution */
  readonly name: string
}
