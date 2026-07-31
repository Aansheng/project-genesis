import type { PromptBuilder } from './PromptBuilder'
import type { PromptModule } from './modules'
import type { PipelineContext } from '../pipeline'
import type { AIRequest } from '../request'
import type { PromptContext } from './PromptContext'
import type { PromptRenderer } from './PromptRenderer'
import type { PromptCompression } from './PromptCompression'
import type { MemoryRanking } from './MemoryRanking'
import type { PromptBudget } from './PromptBudget'
import type { PromptSelection } from './PromptSelection'
import type { PromptSelectionResult } from './PromptSelectionResult'
import type { PromptBudgetResult } from './PromptBudgetResult'
import type { MemoryRankingResult } from './MemoryRankingResult'
import type { ProviderBudget } from './ProviderBudget'
import type { ProviderBudgetResult } from './ProviderBudgetResult'
import type { AIConfiguration } from '../config'
import type { Observation } from '../agent'
import type { ReflectionResult } from '../reflection'
import type { BuilderOptions } from './BuilderOptions'
import type { IntentAnalyzer } from '../intent/IntentAnalyzer'
import type { IntentResult } from '../intent/IntentResult'
import type { IntentRenderer } from '../intent/IntentRenderer'
import type { EntityAnalyzer } from '../entity/EntityAnalyzer'
import type { EntityResult } from '../entity/EntityResult'
import type { EntityRenderer } from '../entity/EntityRenderer'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { SemanticContextBuilder } from '../semantic/SemanticContextBuilder'
import type { SemanticContextRenderer } from '../semantic/SemanticContextRenderer'
import type { PromptStrategy } from '../strategy/PromptStrategy'
import type { PromptStrategySelector } from '../strategy/PromptStrategySelector'
import type { PromptStrategyRenderer } from '../strategy/PromptStrategyRenderer'
import type { StrategyModule } from '../strategy/StrategyModule'
import type { StrategyModuleRenderer } from '../strategy/StrategyModuleRenderer'
import { DefaultPromptStrategy } from '../strategy/DefaultPromptStrategy'
import { DefaultPromptStrategyRenderer } from '../strategy/DefaultPromptStrategyRenderer'
import { DefaultStrategyModuleRenderer } from '../strategy/DefaultStrategyModuleRenderer'
import { DefaultPromptRenderer } from './DefaultPromptRenderer'
import { DefaultPromptCompression } from './DefaultPromptCompression'
import { DefaultMemoryRanking } from './DefaultMemoryRanking'
import { DefaultPromptBudget } from './DefaultPromptBudget'
import { DefaultPromptSelection } from './DefaultPromptSelection'
import { formatObservations as doFormat } from './modules/ObservationPromptModule'
import { formatReflectionResults as doFormatReflection } from './modules/ReflectionPromptModule'

export class DefaultPromptBuilder implements PromptBuilder {
  private readonly modules: PromptModule[]
  private readonly renderer: PromptRenderer
  private readonly compression: PromptCompression
  private readonly ranking: MemoryRanking
  private readonly budget: PromptBudget
  private readonly selection: PromptSelection
  private readonly providerBudget?: ProviderBudget
  private readonly configuration?: AIConfiguration
  private readonly intentAnalyzer?: IntentAnalyzer
  private readonly intentRenderer?: IntentRenderer
  private readonly entityAnalyzer?: EntityAnalyzer
  private readonly entityRenderer?: EntityRenderer
  private readonly semanticContextBuilder?: SemanticContextBuilder
  private readonly semanticContextRenderer?: SemanticContextRenderer
  private readonly strategySelector?: PromptStrategySelector
  private readonly strategies?: readonly PromptStrategy[]
  private readonly strategyRenderer?: PromptStrategyRenderer
  private readonly strategyModules?: readonly StrategyModule[]
  private readonly strategyModuleRenderer?: StrategyModuleRenderer

  /**
   * Create a DefaultPromptBuilder.
   *
   * Two constructor forms are supported:
   *
   * 1. **BuilderOptions form** (recommended):
   *    ```
   *    new DefaultPromptBuilder(modules, {
   *      renderer: myRenderer,
   *      compression: myCompression,
   *      configuration: myConfig,
   *    })
   *    ```
   *
   * 2. **Legacy positional form** (backward compatible):
   *    ```
   *    new DefaultPromptBuilder(modules, renderer, compression, ranking, budget, selection, providerBudget, configuration)
   *    ```
   */
  constructor(modules: PromptModule[], options?: BuilderOptions)
  constructor(
    modules: PromptModule[],
    renderer?: PromptRenderer,
    compression?: PromptCompression,
    ranking?: MemoryRanking,
    budget?: PromptBudget,
    selection?: PromptSelection,
    providerBudget?: ProviderBudget,
    configuration?: AIConfiguration,
  )
  constructor(
    modules: PromptModule[],
    rendererOrOptions?: PromptRenderer | BuilderOptions,
    compression?: PromptCompression,
    ranking?: MemoryRanking,
    budget?: PromptBudget,
    selection?: PromptSelection,
    providerBudget?: ProviderBudget,
    configuration?: AIConfiguration,
  ) {
    this.modules = modules
    if (rendererOrOptions !== undefined && !('render' in rendererOrOptions)) {
      // BuilderOptions form
      const opts = rendererOrOptions as BuilderOptions
      this.renderer = opts.renderer ?? new DefaultPromptRenderer()
      this.compression = opts.compression ?? new DefaultPromptCompression()
      this.ranking = opts.ranking ?? new DefaultMemoryRanking()
      this.budget = opts.budget ?? new DefaultPromptBudget()
      this.selection = opts.selection ?? new DefaultPromptSelection()
      this.providerBudget = opts.providerBudget
      this.configuration = opts.configuration
      this.intentAnalyzer = opts.intentAnalyzer
      this.intentRenderer = opts.intentRenderer
      this.entityAnalyzer = opts.entityAnalyzer
      this.entityRenderer = opts.entityRenderer
      this.semanticContextBuilder = opts.semanticContextBuilder
      this.semanticContextRenderer = opts.semanticContextRenderer
      this.strategySelector = opts.strategySelector
      this.strategies = opts.strategies
      this.strategyRenderer = opts.strategyRenderer
      this.strategyModules = opts.strategyModules
      this.strategyModuleRenderer = opts.strategyModuleRenderer
    } else {
      // Legacy positional form
      this.renderer = (rendererOrOptions as PromptRenderer | undefined) ?? new DefaultPromptRenderer()
      this.compression = compression ?? new DefaultPromptCompression()
      this.ranking = ranking ?? new DefaultMemoryRanking()
      this.budget = budget ?? new DefaultPromptBudget()
      this.selection = selection ?? new DefaultPromptSelection()
      this.providerBudget = providerBudget
      this.configuration = configuration
      this.intentAnalyzer = undefined
      this.intentRenderer = undefined
      this.entityAnalyzer = undefined
      this.entityRenderer = undefined
      this.semanticContextBuilder = undefined
      this.semanticContextRenderer = undefined
    }
  }

  async build(context: PipelineContext): Promise<AIRequest> {
    const promptContext: PromptContext = {}
    const legacySections: string[] = []

    for (const module of this.modules) {
      // Collect structured context if available
      if ('buildContext' in module && typeof module.buildContext === 'function') {
        const ctx = await module.buildContext(context)
        Object.assign(promptContext, ctx)
      } else {
        // Legacy module fallback: use build() for the raw string
        legacySections.push(await module.build(context))
      }
    }

    // Phase 0: IntentAnalyzer — extract user intents (pure analysis)
    let intentResult: IntentResult | undefined
    if (this.intentAnalyzer !== undefined) {
      intentResult = this.intentAnalyzer.analyze(context.input)
    }

    // Phase 0.5: IntentRenderer — format intents as string (pure rendering)
    let intentRendered: string | undefined
    if (intentResult !== undefined && this.intentRenderer !== undefined) {
      intentRendered = this.intentRenderer.render(intentResult)
    }

    // Inject intentRendered into PromptContext for rendering
    if (intentRendered !== undefined) {
      promptContext.intentRendered = intentRendered
    }

    // Phase 0.75: EntityAnalyzer — extract entity references (pure analysis)
    let entityResult: EntityResult | undefined
    if (this.entityAnalyzer !== undefined) {
      entityResult = this.entityAnalyzer.analyze(context.input)
    }

    // Phase 0.875: EntityRenderer — format entities as string (pure rendering)
    let entityRendered: string | undefined
    if (entityResult !== undefined && this.entityRenderer !== undefined) {
      entityRendered = this.entityRenderer.render(entityResult)
    }

    // Phase 0.8: SemanticContextBuilder — combine intent and entity into unified context
    let semanticContext: SemanticContext | undefined
    if (this.semanticContextBuilder !== undefined) {
      semanticContext = this.semanticContextBuilder.build(intentResult, entityResult)
    }

    // Phase 0.85: SemanticContextRenderer — format semantic context as string
    let semanticRendered: string | undefined
    if (semanticContext !== undefined && this.semanticContextRenderer !== undefined) {
      semanticRendered = this.semanticContextRenderer.render(semanticContext)
    }

    // Inject semanticRendered into PromptContext for rendering
    if (semanticRendered !== undefined && semanticRendered.length > 0) {
      promptContext.semanticRendered = semanticRendered
    }

    // Phase 0.9: PromptStrategySelector — determine prompt assembly strategy
    const selectedStrategy: PromptStrategy =
      this.strategySelector !== undefined && this.strategies !== undefined
        ? this.strategySelector.select(this.strategies, semanticContext ?? {})
        : new DefaultPromptStrategy()

    // Phase 0.925: StrategyModule resolution — find module matching selected strategy
    let strategyModuleOutput: string | undefined
    if (this.strategyModules !== undefined) {
      for (const module of this.strategyModules) {
        if (module.name === selectedStrategy.name) {
          strategyModuleOutput = await module.build(context)
          break
        }
      }
    }

    // Phase 0.94: StrategyModuleRenderer — render module content as formatted string
    let strategyModuleRendered: string | undefined
    if (strategyModuleOutput !== undefined) {
      const moduleRenderer = this.strategyModuleRenderer ?? new DefaultStrategyModuleRenderer()
      strategyModuleRendered = moduleRenderer.render(strategyModuleOutput)
    }

    // Phase 0.95: PromptStrategyRenderer — render strategy as string
    const strategyRenderer = this.strategyRenderer ?? new DefaultPromptStrategyRenderer()
    const strategyRendered: string | undefined = strategyRenderer.render(selectedStrategy)

    // Inject strategyRendered into PromptContext for rendering
    if (strategyRendered !== undefined && strategyRendered.length > 0) {
      promptContext.strategyRendered = strategyRendered
    }

    // Phase 1: MemoryRanking — determine section priority (pure measurement)
    const rankingResult: MemoryRankingResult = this.ranking.rank(promptContext)

    // Phase 2: PromptBudget — calculate section sizes (pure measurement)
    const budgetResult: PromptBudgetResult = this.budget.calculate(promptContext)

    // Phase 2.5: ProviderBudget — look up provider/model capacity (pure lookup)
    // Uses AIConfiguration when available, otherwise falls back to defaults
    let providerBudgetResult: ProviderBudgetResult | undefined
    if (this.providerBudget !== undefined) {
      const provider = this.configuration?.provider ?? 'openai'
      const model = this.configuration?.model
      providerBudgetResult = this.providerBudget.getBudget(provider, model)
    }

    // Phase 3: PromptSelection — decide which sections to preserve (pure decision)
    const selectionResult: PromptSelectionResult = this.selection.select(
      promptContext,
      rankingResult,
      budgetResult,
      providerBudgetResult,
    )

    // Phase 4: PromptCompression — clean up context (consumes selection result)
    const compressed = this.compression.compress(promptContext, selectionResult)

    // Build render context with intentRendered, entityRendered, semanticRendered first (ensures correct insertion order)
    const renderContext: PromptContext = {}
    if (intentRendered !== undefined && intentRendered.length > 0) {
      renderContext.intentRendered = intentRendered
    }
    if (entityRendered !== undefined && entityRendered.length > 0) {
      renderContext.entityRendered = entityRendered
    }
    if (semanticRendered !== undefined && semanticRendered.length > 0) {
      renderContext.semanticRendered = semanticRendered
    }
    if (strategyRendered !== undefined && strategyRendered.length > 0) {
      renderContext.strategyRendered = strategyRendered
    }
    Object.assign(renderContext, compressed)

    // Phase 6: PromptRenderer — convert to string
    const rendered = this.renderer.render(renderContext)

    // Build metadata with assembly info
    const metadata: Record<string, unknown> = {
      ...(context.metadata ?? {}),
      promptAssembly: {
        ...(intentResult !== undefined ? { intent: intentResult } : {}),
        ...(intentRendered !== undefined ? { intentRendered } : {}),
        ...(entityResult !== undefined ? { entity: entityResult } : {}),
        ...(entityRendered !== undefined ? { entityRendered } : {}),
        ...(semanticContext !== undefined ? { semantic: semanticContext } : {}),
        ...(semanticRendered !== undefined ? { semanticRendered } : {}),
        strategy: { name: selectedStrategy.name },
        ...(strategyRendered !== undefined && strategyRendered.length > 0 ? { strategyRendered } : {}),
        ...(strategyModuleOutput !== undefined ? { strategyModule: strategyModuleOutput } : {}),
        ...(strategyModuleRendered !== undefined && strategyModuleRendered.length > 0 ? { strategyModuleRendered } : {}),
        ranking: rankingResult,
        budget: budgetResult,
        selection: selectionResult,
        ...(providerBudgetResult !== undefined ? { providerBudget: providerBudgetResult } : {}),
      },
    }

    // Append legacy module output if any
    if (legacySections.length > 0) {
      const allParts = [rendered, ...legacySections].filter(Boolean)
      return { prompt: allParts.join('\n'), metadata }
    }

    return { prompt: rendered, metadata }
  }

  /**
   * Get the structured PromptContext for the given PipelineContext.
   */
  async buildContext(context: PipelineContext): Promise<PromptContext> {
    const promptContext: PromptContext = {}

    for (const module of this.modules) {
      if ('buildContext' in module && typeof module.buildContext === 'function') {
        const ctx = await module.buildContext(context)
        Object.assign(promptContext, ctx)
      }
    }

    // Full assembly pipeline
    const rankingResult = this.ranking.rank(promptContext)
    const budgetResult = this.budget.calculate(promptContext)

    // ProviderBudget: only when injected
    let providerBudgetResult: ProviderBudgetResult | undefined
    if (this.providerBudget !== undefined) {
      const provider = this.configuration?.provider ?? 'openai'
      const model = this.configuration?.model
      providerBudgetResult = this.providerBudget.getBudget(provider, model)
    }

    const selectionResult = this.selection.select(promptContext, rankingResult, budgetResult, providerBudgetResult)

    // Apply compression (consumes selection result)
    return this.compression.compress(promptContext, selectionResult)
  }

  /**
   * Convert structured Observation[] to formatted prompt text.
   */
  formatObservations(observations: Observation[]): string {
    return doFormat(observations)
  }

  /**
   * Convert structured ReflectionResult[] to formatted prompt text.
   */
  formatReflectionResults(results: ReflectionResult[]): string {
    return doFormatReflection(results)
  }
}