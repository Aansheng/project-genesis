import type { PromptRenderer } from './PromptRenderer'
import type { PromptCompression } from './PromptCompression'
import type { MemoryRanking } from './MemoryRanking'
import type { PromptBudget } from './PromptBudget'
import type { PromptSelection } from './PromptSelection'
import type { ProviderBudget } from './ProviderBudget'
import type { AIConfiguration } from '../config'
import type { IntentAnalyzer } from '../intent/IntentAnalyzer'
import type { IntentRenderer } from '../intent/IntentRenderer'
import type { EntityAnalyzer } from '../entity/EntityAnalyzer'
import type { EntityRenderer } from '../entity/EntityRenderer'
import type { SemanticContextBuilder } from '../semantic/SemanticContextBuilder'
import type { SemanticContextRenderer } from '../semantic/SemanticContextRenderer'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { PromptStrategySelector } from '../strategy/PromptStrategySelector'
import type { PromptStrategyRenderer } from '../strategy/PromptStrategyRenderer'
import type { StrategyModule } from '../strategy/StrategyModule'
import type { StrategyEvaluator } from '../strategy/StrategyEvaluator'
import type { StrategyModuleRenderer } from '../strategy/StrategyModuleRenderer'
import type { PromptAssemblyStrategyResolver } from '../strategy/PromptAssemblyStrategyResolver'
import type { StrategySelectionRenderer } from '../strategy/StrategySelectionRenderer'

/**
 * BuilderOptions consolidates all optional collaborators for DefaultPromptBuilder
 * into a single options object, preventing constructor parameter growth.
 *
 * Since WO-S4-010, DefaultPromptBuilder consumes BuilderOptions directly
 * via constructor overloads. The legacy positional parameter form is preserved
 * for backward compatibility.
 *
 * Since WO-S5-003, BuilderOptions also accepts an optional IntentAnalyzer.
 * Since WO-S5-004, BuilderOptions also accepts an optional IntentRenderer.
 * Since WO-S5-008, BuilderOptions also accepts an optional EntityAnalyzer.
 * Since WO-S5-009, BuilderOptions also accepts an optional EntityRenderer.
 * Since WO-S5-012, BuilderOptions also accepts an optional SemanticContextBuilder.
 * Since WO-S5-013, BuilderOptions also accepts an optional SemanticContextRenderer.
 * Since WO-S5-016, BuilderOptions also accepts optional strategySelector and strategies.
 * Since WO-S5-017, BuilderOptions also accepts an optional strategyRenderer.
 * Since WO-S5-024, BuilderOptions also accepts optional strategyModules.
 * Since WO-S5-025, BuilderOptions also accepts an optional strategyModuleRenderer.
 * Since WO-S5-029, BuilderOptions also accepts an optional strategyEvaluator.
 * Since WO-S5-032, BuilderOptions also accepts an optional promptAssemblyStrategyResolver.
 * Since WO-S5-038, BuilderOptions also accepts an optional strategySelectionRenderer.
 *
 * Design principles:
 * - All fields are optional — no breaking changes
 * - Each field maps to an existing constructor parameter
 * - No new fields beyond what the constructor already accepts
 * - Pure data object — no methods, no behavior
 *
 * @see DefaultPromptBuilder — consumes BuilderOptions via constructor overload
 */
export interface BuilderOptions {
  /** Optional PromptRenderer (defaults to DefaultPromptRenderer) */
  renderer?: PromptRenderer
  /** Optional PromptCompression (defaults to DefaultPromptCompression) */
  compression?: PromptCompression
  /** Optional MemoryRanking (defaults to DefaultMemoryRanking) */
  ranking?: MemoryRanking
  /** Optional PromptBudget (defaults to DefaultPromptBudget) */
  budget?: PromptBudget
  /** Optional PromptSelection (defaults to DefaultPromptSelection) */
  selection?: PromptSelection
  /** Optional ProviderBudget (defaults to undefined — no provider budget lookup) */
  providerBudget?: ProviderBudget
  /** Optional AIConfiguration (defaults to undefined — falls back to 'openai' provider) */
  configuration?: AIConfiguration
  /** Optional IntentAnalyzer (defaults to undefined — no intent analysis) */
  intentAnalyzer?: IntentAnalyzer
  /** Optional IntentRenderer (defaults to undefined — no intent rendering) */
  intentRenderer?: IntentRenderer
  /** Optional EntityAnalyzer (defaults to undefined — no entity analysis) */
  entityAnalyzer?: EntityAnalyzer
  /** Optional EntityRenderer (defaults to undefined — no entity rendering) */
  entityRenderer?: EntityRenderer
  /** Optional SemanticContextBuilder (defaults to undefined — no semantic context) */
  semanticContextBuilder?: SemanticContextBuilder
  /** Optional SemanticContextRenderer (defaults to undefined — no semantic rendering) */
  semanticContextRenderer?: SemanticContextRenderer
  /** Optional PromptStrategySelector (defaults to undefined — no strategy selection, uses DefaultPromptStrategy) */
  strategySelector?: PromptStrategySelector
  /** Optional list of PromptStrategy to select from (defaults to undefined) */
  strategies?: readonly PromptStrategy[]
  /** Optional PromptStrategyRenderer (defaults to undefined — no strategy rendering) */
  strategyRenderer?: PromptStrategyRenderer
  /** Optional StrategyModule list for strategy-specific prompt content (defaults to undefined — no module resolution) */
  strategyModules?: readonly StrategyModule[]
  /** Optional StrategyModuleRenderer (defaults to undefined — uses DefaultStrategyModuleRenderer when needed) */
  strategyModuleRenderer?: StrategyModuleRenderer
  /** Optional StrategyEvaluator (defaults to undefined — no candidate scoring metadata) */
  strategyEvaluator?: StrategyEvaluator
  /** Optional PromptAssemblyStrategyResolver (defaults to undefined — no assembly strategy resolution) */
  promptAssemblyStrategyResolver?: PromptAssemblyStrategyResolver
  /** Optional StrategySelectionRenderer (defaults to undefined — no strategy selection rendering) */
  strategySelectionRenderer?: StrategySelectionRenderer
}