import type { PromptModule } from '../prompt/modules/PromptModule'

/**
 * StrategyModule — strategy-specific PromptModule.
 *
 * Extends PromptModule to allow each strategy to contribute prompt content.
 * This is the foundation that connects the Strategy Layer to the Prompt
 * Assembly pipeline.
 *
 * Each concrete strategy module produces deterministic guideline text
 * that shapes LLM behavior for its intent category:
 * - CreateStrategyModule  → "Creation Guidelines: …"
 * - QueryStrategyModule   → "Query Guidelines: …"
 * - ModifyStrategyModule  → "Modification Guidelines: …"
 * - DeleteStrategyModule  → "Deletion Guidelines: …"
 *
 * Properties:
 * - Pure: same PipelineContext always produces same output string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — no consumption by PromptBuilder yet.
 */
export interface StrategyModule extends PromptModule {}
