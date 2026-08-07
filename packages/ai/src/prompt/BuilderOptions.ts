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
import type { PromptAssemblyPlanner } from '../strategy/PromptAssemblyPlanner'
import type { PromptAssemblyPlanRenderer } from '../strategy/PromptAssemblyPlanRenderer'
import type { PromptAssemblyOptimizer } from '../strategy/PromptAssemblyOptimizer'
import type { PromptAssemblyPlanDiffer } from '../strategy/PromptAssemblyPlanDiffer'
import type { PromptAssemblySnapshotBuilder } from '../strategy/PromptAssemblySnapshotBuilder'
import type { PromptInspectorBuilder } from '../strategy/PromptInspectorBuilder'
import type { PromptInspectorRenderer } from '../strategy/PromptInspectorRenderer'
import type { PromptInspectorExporter } from '../strategy/PromptInspectorExporter'
import type { PromptAssemblyTraceBuilder } from '../strategy/PromptAssemblyTraceBuilder'
import type { PromptAssemblyTraceDiffer } from '../strategy/PromptAssemblyTraceDiffer'
import type { PromptAssemblyTraceRenderer } from '../strategy/PromptAssemblyTraceRenderer'
import type { PromptAssemblyTraceExporter } from '../strategy/PromptAssemblyTraceExporter'
import type { PromptAssemblyTimelineBuilder } from '../strategy/PromptAssemblyTimelineBuilder'
import type { PromptAssemblyTimelineDiffer } from '../strategy/PromptAssemblyTimelineDiffer'
import type { PromptAssemblyTimelineRenderer } from '../strategy/PromptAssemblyTimelineRenderer'
import type { PromptAssemblyTimelineExporter } from '../strategy/PromptAssemblyTimelineExporter'
import type { PromptAssemblyTimelineSnapshotBuilder } from '../strategy/PromptAssemblyTimelineSnapshotBuilder'
import type { PromptAssemblyHistoryBuilder } from '../strategy/PromptAssemblyHistoryBuilder'
import type { PromptAssemblyHistoryDiffer } from '../strategy/PromptAssemblyHistoryDiffer'
import type { PromptAssemblyHistoryRenderer } from '../strategy/PromptAssemblyHistoryRenderer'
import type {
  PromptAssemblyHistoryExporter,
} from '../strategy/PromptAssemblyHistoryExporter'
import type {
  PromptAssemblyHistorySnapshotBuilder,
} from '../strategy/PromptAssemblyHistorySnapshotBuilder'
import type {
  PromptAssemblyObservatoryBuilder,
} from '../strategy/PromptAssemblyObservatoryBuilder'
import type {
  PromptAssemblyObservatoryDiffer,
} from '../strategy/PromptAssemblyObservatoryDiffer'
import type {
  PromptAssemblyObservatoryRenderer,
} from '../strategy/PromptAssemblyObservatoryRenderer'
import type {
  PromptAssemblyObservatoryExporter,
} from '../strategy/PromptAssemblyObservatoryExporter'

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
 * Since WO-S5-041, BuilderOptions also accepts an optional promptAssemblyPlanner.
 * Since WO-S5-045, BuilderOptions also accepts an optional promptAssemblyPlanRenderer.
 * Since WO-S5-047, BuilderOptions also accepts an optional promptAssemblyOptimizer.
 * Since WO-S5-049, BuilderOptions also accepts an optional promptAssemblyPlanDiffer.
 * Since WO-S5-051, BuilderOptions also accepts an optional promptAssemblySnapshotBuilder.
 * Since WO-S5-053, BuilderOptions also accepts an optional promptInspectorBuilder.
 * Since WO-S5-055, BuilderOptions also accepts an optional promptInspectorRenderer.
 * Since WO-S5-057, BuilderOptions also accepts an optional promptInspectorExporter.
 * Since WO-S5-059, BuilderOptions also accepts an optional promptAssemblyTraceBuilder.
 * Since WO-S5-061, BuilderOptions also accepts an optional promptAssemblyTraceDiffer.
 * Since WO-S5-063, BuilderOptions also accepts an optional promptAssemblyTraceRenderer.
 * Since WO-S5-065, BuilderOptions also accepts an optional promptAssemblyTraceExporter.
 * Since WO-S5-067, BuilderOptions also accepts an optional promptAssemblyTimelineBuilder.
 * Since WO-S5-069, BuilderOptions also accepts an optional promptAssemblyTimelineDiffer.
 * Since WO-S5-071, BuilderOptions also accepts an optional promptAssemblyTimelineRenderer.
 * Since WO-S5-073, BuilderOptions also accepts an optional promptAssemblyTimelineExporter.
 * Since WO-S5-075, BuilderOptions also accepts an optional promptAssemblyTimelineSnapshotBuilder.
 * Since WO-S5-077, BuilderOptions also accepts an optional promptAssemblyHistoryBuilder.
 * Since WO-S5-079, BuilderOptions also accepts an optional promptAssemblyHistoryDiffer.
 * Since WO-S5-081, BuilderOptions also accepts an optional promptAssemblyHistoryRenderer.
 * Since WO-S5-083, BuilderOptions also accepts an optional promptAssemblyHistoryExporter.
 * Since WO-S5-085, BuilderOptions also accepts an optional promptAssemblyHistorySnapshotBuilder.
 * Since WO-S5-087, BuilderOptions also accepts an optional promptAssemblyObservatoryBuilder.
 * Since WO-S5-089, BuilderOptions also accepts an optional promptAssemblyObservatoryDiffer.
 * Since WO-S5-091, BuilderOptions also accepts an optional promptAssemblyObservatoryRenderer.
 * Since WO-S5-093, BuilderOptions also accepts an optional promptAssemblyObservatoryExporter.
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
  /** Optional PromptAssemblyPlanner (defaults to undefined — no assembly plan generation) */
  promptAssemblyPlanner?: PromptAssemblyPlanner
  /** Optional PromptAssemblyPlanRenderer (defaults to undefined — no plan rendering) */
  promptAssemblyPlanRenderer?: PromptAssemblyPlanRenderer
  /** Optional PromptAssemblyOptimizer (defaults to undefined — no plan optimization) */
  promptAssemblyOptimizer?: PromptAssemblyOptimizer
  /** Optional PromptAssemblyPlanDiffer (defaults to undefined — no plan diff) */
  promptAssemblyPlanDiffer?: PromptAssemblyPlanDiffer
  /** Optional PromptAssemblySnapshotBuilder (defaults to undefined — no snapshot) */
  promptAssemblySnapshotBuilder?: PromptAssemblySnapshotBuilder
  /** Optional PromptInspectorBuilder (defaults to undefined — no inspector) */
  promptInspectorBuilder?: PromptInspectorBuilder
  /** Optional PromptInspectorRenderer (defaults to undefined — no inspector rendering) */
  promptInspectorRenderer?: PromptInspectorRenderer
  /** Optional PromptInspectorExporter (defaults to undefined — no inspector export) */
  promptInspectorExporter?: PromptInspectorExporter
  /** Optional PromptAssemblyTraceBuilder (defaults to undefined — no assembly trace) */
  promptAssemblyTraceBuilder?: PromptAssemblyTraceBuilder
  /** Optional PromptAssemblyTraceDiffer (defaults to undefined — no trace diff) */
  promptAssemblyTraceDiffer?: PromptAssemblyTraceDiffer
  /** Optional PromptAssemblyTraceRenderer (defaults to undefined — no trace rendering) */
  promptAssemblyTraceRenderer?: PromptAssemblyTraceRenderer
  /** Optional PromptAssemblyTraceExporter (defaults to undefined — no trace export) */
  promptAssemblyTraceExporter?: PromptAssemblyTraceExporter
  /** Optional PromptAssemblyTimelineBuilder (defaults to undefined — no timeline) */
  promptAssemblyTimelineBuilder?: PromptAssemblyTimelineBuilder

  /** Optional PromptAssemblyTimelineDiffer (defaults to undefined — no timeline diff) */
  promptAssemblyTimelineDiffer?: PromptAssemblyTimelineDiffer

  /** Optional PromptAssemblyTimelineRenderer (defaults to undefined — no timeline rendering) */
  promptAssemblyTimelineRenderer?: PromptAssemblyTimelineRenderer

  /** Optional PromptAssemblyTimelineExporter (defaults to undefined — no timeline export) */
  promptAssemblyTimelineExporter?: PromptAssemblyTimelineExporter

  /** Optional PromptAssemblyTimelineSnapshotBuilder (defaults to undefined — no timeline snapshot) */
  promptAssemblyTimelineSnapshotBuilder?: PromptAssemblyTimelineSnapshotBuilder

  /** Optional PromptAssemblyHistoryBuilder (defaults to undefined — no history) */
  promptAssemblyHistoryBuilder?: PromptAssemblyHistoryBuilder

  /** Optional PromptAssemblyHistoryDiffer (defaults to undefined — no history diff) */
  promptAssemblyHistoryDiffer?: PromptAssemblyHistoryDiffer

  /** Optional PromptAssemblyHistoryRenderer (defaults to undefined — no history rendering) */
  promptAssemblyHistoryRenderer?: PromptAssemblyHistoryRenderer

  /** Optional PromptAssemblyHistoryExporter (defaults to undefined — no history export) */
  promptAssemblyHistoryExporter?:
    PromptAssemblyHistoryExporter

  /** Optional PromptAssemblyHistorySnapshotBuilder (defaults to undefined — no history snapshot) */
  promptAssemblyHistorySnapshotBuilder?:
    PromptAssemblyHistorySnapshotBuilder

  /** Optional PromptAssemblyObservatoryBuilder (defaults to undefined — no observatory) */
  promptAssemblyObservatoryBuilder?:
    PromptAssemblyObservatoryBuilder

  /** Optional PromptAssemblyObservatoryDiffer (defaults to undefined — no observatory diff) */
  promptAssemblyObservatoryDiffer?:
    PromptAssemblyObservatoryDiffer

  /** Optional PromptAssemblyObservatoryRenderer (defaults to undefined — no observatory rendering) */
  promptAssemblyObservatoryRenderer?:
    PromptAssemblyObservatoryRenderer

  /** Optional PromptAssemblyObservatoryExporter (defaults to undefined — no observatory export) */
  promptAssemblyObservatoryExporter?:
    PromptAssemblyObservatoryExporter
}