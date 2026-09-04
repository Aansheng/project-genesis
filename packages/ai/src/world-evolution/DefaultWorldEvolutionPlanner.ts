import type {
  EntityCategory,
  EvolutionEntitySemantic,
  EvolutionTargetSelector,
  EvolutionValueOperation,
  EvolutionWorldProperty,
  WorldEvolutionEvent,
  WorldEvolutionIntent,
  WorldEvolutionOperation,
  WorldEvolutionPlanStatus,
  WorldEvolutionRequest,
  WorldEvolutionSource,
  WorldEvolutionStage,
  WorldEvolutionStageName,
  WorldSemanticDelta,
  WorldSemanticDeltaOperation,
} from '@genesis/shared'
import { DefaultWorldEvolutionGenerationContextBuilder, summarizeGenerationContext } from '@genesis/shared'
import type {
  WorldEvolutionCandidateProvider,
  WorldEvolutionPlanResult,
  WorldEvolutionPlanner,
  WorldEvolutionTargetResolver,
  WorldSemanticDeltaValidator,
} from './WorldEvolutionPlanner'
import { DefaultWorldEvolutionPromptBuilder, type WorldEvolutionPromptBuilder } from './WorldEvolutionPromptBuilder'
import { DefaultWorldEvolutionTargetResolver } from './DefaultWorldEvolutionTargetResolver'
import { DefaultWorldSemanticDeltaValidator } from './DefaultWorldSemanticDeltaValidator'
import type { GameDesignPrompt } from '../game-world/generation/GameDesignPromptBuilder'
import type { StructuredGenerationClient } from '../game-world/generation/StructuredGenerationClient'
import type { StructuredGenerationRequestOptions } from '../game-world/generation/StructuredGenerationReliability'

type Clock = () => string

const CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
const WORLD_PROPERTIES: readonly EvolutionWorldProperty[] = ['theme', 'timeOfDay']
const VALUE_OPERATIONS: readonly EvolutionValueOperation[] = ['set', 'multiply']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function isCategory(value: unknown): value is EntityCategory {
  return typeof value === 'string' && CATEGORIES.includes(value as EntityCategory)
}

function freezeRequest(request: WorldEvolutionRequest, createdAt: string): WorldEvolutionRequest {
  const context = Object.freeze({
    worldId: request.context.worldId.trim(),
    ...(request.context.semanticRevision !== undefined ? { semanticRevision: request.context.semanticRevision } : {}),
    ...(request.context.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: request.context.runtimeSemanticRevision } : {}),
    ...(request.context.visualRevision !== undefined ? { visualRevision: request.context.visualRevision } : {}),
    ...(request.context.selectedEntityId ? { selectedEntityId: request.context.selectedEntityId.trim() } : {}),
    semanticWorld: Object.freeze({
      worldType: request.context.semanticWorld.worldType,
      entities: Object.freeze(request.context.semanticWorld.entities.map(entity => Object.freeze({ ...entity }))),
    }),
    ...(request.context.properties ? { properties: Object.freeze({ ...request.context.properties }) } : {}),
  })
  const generationContext = new DefaultWorldEvolutionGenerationContextBuilder().build({
    metadata: {
      worldId: context.worldId,
      operationId: request.operationId.trim(),
      ...(context.semanticRevision !== undefined ? { semanticRevision: context.semanticRevision } : {}),
      ...(context.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: context.runtimeSemanticRevision } : {}),
      ...(context.visualRevision !== undefined ? { visualRevision: context.visualRevision } : {}),
    },
    semanticWorld: context.semanticWorld,
    ...(context.properties ? { properties: context.properties } : {}),
    ...(context.selectedEntityId ? { selectedEntityId: context.selectedEntityId } : {}),
  })
  return Object.freeze({
    operationId: request.operationId.trim(),
    instruction: request.instruction.trim(),
    createdAt,
    context,
    generationContext,
  })
}

function fallbackRequest(): WorldEvolutionRequest {
  return Object.freeze({
    operationId: 'invalid-evolution-operation',
    instruction: '',
    createdAt: new Date(0).toISOString(),
    context: Object.freeze({
      worldId: '',
      semanticWorld: Object.freeze({ worldType: 'sandbox', entities: Object.freeze([]) }),
    }),
  })
}

function validRequest(request: unknown): request is WorldEvolutionRequest {
  if (!isRecord(request) || typeof request.operationId !== 'string' || request.operationId.trim() === '') return false
  if (typeof request.instruction !== 'string' || request.instruction.trim() === '') return false
  if (!isRecord(request.context) || typeof request.context.worldId !== 'string' || request.context.worldId.trim() === '') return false
  if (request.context.semanticRevision !== undefined && (typeof request.context.semanticRevision !== 'number' || !Number.isInteger(request.context.semanticRevision) || request.context.semanticRevision < 0)) return false
  if (request.context.runtimeSemanticRevision !== undefined && (typeof request.context.runtimeSemanticRevision !== 'number' || !Number.isInteger(request.context.runtimeSemanticRevision) || request.context.runtimeSemanticRevision < 0)) return false
  if (request.context.visualRevision !== undefined && (typeof request.context.visualRevision !== 'number' || !Number.isInteger(request.context.visualRevision) || request.context.visualRevision < 0)) return false
  const world = request.context.semanticWorld
  return isRecord(world) && typeof world.worldType === 'string' && Array.isArray(world.entities) && world.entities.every(entity => isRecord(entity) && typeof entity.id === 'string' && typeof entity.name === 'string' && isCategory(entity.category))
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function semanticName(value: unknown): string | undefined {
  if (typeof value === 'string') return textValue(value)
  if (!isRecord(value)) return undefined
  return textValue(value.name) ?? textValue(value.semantic) ?? textValue(value.label) ?? textValue(value.type)
}

function readSemantic(value: unknown): EvolutionEntitySemantic | undefined {
  const name = semanticName(value)
  if (!name) return undefined
  if (!isRecord(value)) return Object.freeze({ name })
  return Object.freeze({
    name,
    ...(isCategory(value.category) ? { category: value.category } : {}),
    ...(typeof value.role === 'string' && value.role.trim() ? { role: value.role.trim() } : {}),
  })
}

function readSelector(value: unknown, fallback: Record<string, unknown>): EvolutionTargetSelector | undefined {
  if (typeof value === 'string' && value.trim()) return Object.freeze({ semantic: value.trim() })
  const record = isRecord(value) ? value : fallback
  const entityId = typeof record.entityId === 'string' && record.entityId.trim() ? record.entityId.trim() : undefined
  const semantic = semanticName(record.semantic) ?? textValue(record.name) ?? textValue(record.targetName) ?? textValue(record.archetype) ?? semanticName(record.source) ?? semanticName(record.from)
  const category = isCategory(record.category) ? record.category : undefined
  const role = typeof record.role === 'string' && record.role.trim() ? record.role.trim() : undefined
  const match = record.match === 'all' || record.match === 'one' ? record.match : undefined
  if (!entityId && !semantic && !category && !role) return undefined
  return Object.freeze({
    ...(entityId ? { entityId } : {}),
    ...(semantic ? { semantic } : {}),
    ...(category ? { category } : {}),
    ...(role ? { role } : {}),
    ...(match ? { match } : {}),
  })
}

function readKind(candidate: Record<string, unknown>): string {
  if (typeof candidate.kind === 'string') return candidate.kind
  if (typeof candidate.type === 'string') return candidate.type
  if (typeof candidate.operation === 'string' && ['add', 'add-entity', 'remove', 'remove-entity', 'replace', 'replace-entity', 'replace-archetype', 'replace-entity-semantic', 'update-world', 'update-world-property', 'update-entity', 'update-entity-property'].includes(candidate.operation)) return candidate.operation
  if (typeof candidate.action === 'string' && ['add', 'add-entity', 'remove', 'remove-entity', 'replace', 'replace-entity', 'replace-archetype', 'replace-entity-semantic', 'update-world', 'update-world-property', 'update-entity', 'update-entity-property'].includes(candidate.action)) return candidate.action
  return ''
}

function readScope(candidate: Record<string, unknown>, fallback: WorldEvolutionIntent['scope']): WorldEvolutionIntent['scope'] {
  if (candidate.scope === 'entity' || candidate.scope === 'archetype-group' || candidate.scope === 'world') return candidate.scope
  const target = isRecord(candidate.target) ? candidate.target : undefined
  return target?.match === 'all' ? 'archetype-group' : fallback
}

/** Converts untrusted structured output into the compact evolution intent. */
export function parseWorldEvolutionCandidate(candidate: unknown): WorldEvolutionIntent {
  if (!isRecord(candidate)) throw new InvalidWorldEvolutionCandidateError()
  if (candidate.kind === 'unsupported') throw new UnsupportedWorldEvolutionError()
  const kind = readKind(candidate)

  if (kind === 'add' || kind === 'add-entity') {
    const semantic = readSemantic(candidate.semantic ?? candidate.entity ?? candidate.entityType)
    if (!semantic) throw new InvalidWorldEvolutionCandidateError()
    const count = typeof candidate.count === 'number' ? candidate.count : 1
    return Object.freeze({ kind: 'add-entity', scope: 'entity', semantic, count })
  }

  if (kind === 'remove' || kind === 'remove-entity') {
    const target = readSelector(candidate.target ?? candidate.targetSemantic ?? candidate.targetId ?? candidate.source ?? candidate.from, candidate)
    if (!target) throw new InvalidWorldEvolutionCandidateError()
    return Object.freeze({ kind: 'remove-entity', scope: readScope(candidate, 'entity') as 'entity' | 'archetype-group', target })
  }

  if (kind === 'replace' || kind === 'replace-entity' || kind === 'replace-archetype' || kind === 'replace-entity-semantic') {
    const target = readSelector(candidate.target ?? candidate.targetSemantic ?? candidate.targetId ?? candidate.source ?? candidate.from, candidate)
    const replacement = readSemantic(candidate.replacement ?? candidate.to ?? candidate.semantic ?? candidate.newSemantic)
    if (!target || !replacement) throw new InvalidWorldEvolutionCandidateError()
    return Object.freeze({
      kind: 'replace-entity-semantic',
      scope: readScope(candidate, 'entity') as 'entity' | 'archetype-group',
      target,
      replacement,
      preserveIdentity: candidate.preserveIdentity !== false,
    })
  }

  if (kind === 'update-entity' || kind === 'update-entity-property') {
    const target = readSelector(candidate.target ?? candidate.targetSemantic ?? candidate.targetId ?? candidate.source ?? candidate.from, candidate)
    const operation = VALUE_OPERATIONS.includes(candidate.operation as EvolutionValueOperation) ? candidate.operation as EvolutionValueOperation : 'set'
    if (!target || candidate.property !== 'movementSpeed' || (typeof candidate.value !== 'number' && typeof candidate.value !== 'string')) throw new InvalidWorldEvolutionCandidateError()
    return Object.freeze({ kind: 'update-entity-property', scope: readScope(candidate, 'entity') as 'entity' | 'archetype-group', target, property: 'movementSpeed', operation, value: candidate.value })
  }

  if (kind === 'update-world' || kind === 'update-world-property') {
    const property = candidate.property
    if (!WORLD_PROPERTIES.includes(property as EvolutionWorldProperty) || typeof candidate.value !== 'string' || !candidate.value.trim()) throw new InvalidWorldEvolutionCandidateError()
    return Object.freeze({ kind: 'update-world-property', scope: 'world', property: property as EvolutionWorldProperty, value: candidate.value.trim() })
  }

  throw new UnsupportedWorldEvolutionError()
}

export class InvalidWorldEvolutionCandidateError extends Error {
  constructor() {
    super('World evolution candidate is invalid')
    this.name = 'InvalidWorldEvolutionCandidateError'
  }
}

export class UnsupportedWorldEvolutionError extends Error {
  constructor() {
    super('World evolution operation is unsupported')
    this.name = 'UnsupportedWorldEvolutionError'
  }
}

/** Deterministic candidate source for controlled tests and local fallback-free operation. */
export class DeterministicWorldEvolutionCandidateProvider implements WorldEvolutionCandidateProvider {
  readonly source: WorldEvolutionSource = 'deterministic'

  getProviderMetadata(): { readonly provider: string } {
    return { provider: 'deterministic' }
  }

  async generate(request: WorldEvolutionRequest): Promise<unknown> {
    const text = request.instruction.toLocaleLowerCase()
    if ((text.includes('所有') || text.includes('全部') || text.includes('all')) && (text.includes('牛') || text.includes('cow')) && (text.includes('羊') || text.includes('sheep'))) {
      return Object.freeze({ kind: 'replace-entity-semantic', scope: 'archetype-group', target: { semantic: 'cow', match: 'all' }, replacement: { name: 'sheep' }, preserveIdentity: true })
    }
    if ((text.includes('商人') || text.includes('merchant')) && (text.includes('机器人') || text.includes('robot')) && (text.includes('改') || text.includes('replace') || text.includes('change') || text.includes('变'))) {
      return Object.freeze({ kind: 'replace-entity-semantic', scope: 'entity', target: { semantic: 'merchant', match: 'one' }, replacement: { name: 'robot' }, preserveIdentity: true })
    }
    const additionRequested = /(?:增加|添加|新增|再添加|再创建|再生成|再加|再来|add|create|generate)/iu.test(text)
    const archetypeNativeAddition = additionRequested ? deterministicArchetypeNativeAddition(request, text) : undefined
    if (archetypeNativeAddition) return archetypeNativeAddition
    if (additionRequested && ['敌人', '怪物', '怪', 'enemy', 'enemies'].some(alias => text.includes(alias))) {
      return Object.freeze({ kind: 'add-entity', scope: 'entity', semantic: { name: 'Enemy', category: 'enemy' }, count: requestedCount(request.instruction) })
    }
    if (additionRequested && (text.includes('商人') || text.includes('merchant'))) {
      return Object.freeze({ kind: 'add-entity', scope: 'entity', semantic: { name: 'merchant', category: 'npc' }, count: requestedCount(request.instruction) })
    }
    if ((text.includes('删除') || text.includes('移除') || text.includes('remove') || text.includes('delete')) && (text.includes('boss') || text.includes('首领'))) {
      return Object.freeze({ kind: 'remove-entity', scope: 'entity', target: { semantic: 'boss', match: 'one' } })
    }
    if ((text.includes('整个世界') || text.includes('世界') || text.includes('whole world')) && (text.includes('夜晚') || text.includes('夜间') || text.includes('night'))) {
      return Object.freeze({ kind: 'update-world-property', scope: 'world', property: 'timeOfDay', value: 'night' })
    }
    throw new UnsupportedWorldEvolutionError()
  }
}

const FARM_FIELD_ALIASES = ['麦田', '麦地', '小麦田', '农田', '田地', 'farmland', 'farm field', 'wheat field', 'wheat-field', 'field'] as const
const RPG_QUEST_ALIASES = ['任务', 'quest', 'mission'] as const

function containsEvolutionAlias(text: string, alias: string): boolean {
  if (/^[a-z -]+$/iu.test(alias)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'iu').test(text)
  }
  return text.includes(alias)
}

/**
 * Bounded local recovery for already-supported archetype-native roles. The
 * result remains an untrusted candidate and is resolved/applied by the normal
 * World Evolution pipeline below; this function never touches Runtime state.
 */
function deterministicArchetypeNativeAddition(request: WorldEvolutionRequest, text: string): unknown | undefined {
  const worldType = request.context.semanticWorld.worldType.toLocaleLowerCase()
  if (worldType === 'farm' && FARM_FIELD_ALIASES.some(alias => containsEvolutionAlias(text, alias))) {
    return Object.freeze({
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Wheat Field', category: 'terrain' },
      count: requestedCount(request.instruction),
    })
  }
  if (worldType === 'rpg' && RPG_QUEST_ALIASES.some(alias => containsEvolutionAlias(text, alias))) {
    return Object.freeze({
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Quest', category: 'quest' },
      count: requestedCount(request.instruction),
    })
  }
  return undefined
}

/** Adapter over the existing selectable API/Codex structured-generation client. */
export class StructuredWorldEvolutionCandidateProvider implements WorldEvolutionCandidateProvider {
  readonly source: WorldEvolutionSource = 'ai'

  constructor(
    private readonly client: StructuredGenerationClient,
    private readonly options?: StructuredGenerationRequestOptions,
  ) {}

  getProviderMetadata(): { readonly provider: string; readonly model?: string } | undefined {
    return this.client.getProviderMetadata?.()
  }

  async generate(request: WorldEvolutionRequest, prompt?: GameDesignPrompt): Promise<unknown> {
    return this.client.generateStructured({ kind: 'world-evolution', ...request }, prompt, this.options)
  }
}

function defaultClock(): string {
  return new Date().toISOString()
}

function sourceFor(provider: WorldEvolutionCandidateProvider): WorldEvolutionSource {
  if (provider.source) return provider.source
  return provider.getProviderMetadata?.()?.provider === 'deterministic' ? 'deterministic' : 'ai'
}

function requestedCount(instruction: string): number {
  const match = instruction.replace(/再(?:添加|创建|生成|加|来)/u, '增加').match(/(?:增加|添加|新增|add|create|generate)\s*(?:(\d+)|(一个|一|两个|两|三个|三|四个|四|五个|五))?/iu)
  if (!match) return 1
  if (match[1]) return Math.max(1, Number(match[1]))
  const chinese = { 一个: 1, 一: 1, 两个: 2, 两: 2, 三个: 3, 三: 3, 四个: 4, 四: 4, 五个: 5, 五: 5 } as const
  return match[2] ? chinese[match[2] as keyof typeof chinese] : 1
}

function freezeDelta(delta: WorldSemanticDelta): WorldSemanticDelta {
  const freezeOperation = (operation: WorldSemanticDeltaOperation): WorldSemanticDeltaOperation => {
    if (operation.kind === 'add-entity') {
      return Object.freeze({ ...operation, semantic: Object.freeze({ ...operation.semantic }) })
    }
    if (operation.kind === 'replace-entity-semantic') {
      return Object.freeze({
        ...operation,
        targetIds: Object.freeze([...operation.targetIds]),
        from: Object.freeze(operation.from.map(item => Object.freeze({ ...item }))),
        replacement: Object.freeze({ ...operation.replacement }),
      })
    }
    if ('targetIds' in operation) return Object.freeze({ ...operation, targetIds: Object.freeze([...operation.targetIds]) })
    return Object.freeze({ ...operation })
  }
  return Object.freeze({
    ...delta,
    ...(delta.semanticRevision !== undefined ? { semanticRevision: delta.semanticRevision } : {}),
    operations: Object.freeze(delta.operations.map(freezeOperation)),
  })
}

function freezeIntent(intent: WorldEvolutionIntent): WorldEvolutionIntent {
  return Object.freeze({
    ...intent,
    ...('target' in intent ? { target: Object.freeze({ ...intent.target }) } : {}),
    ...('semantic' in intent ? { semantic: Object.freeze({ ...intent.semantic }) } : {}),
    ...('replacement' in intent ? { replacement: Object.freeze({ ...intent.replacement }) } : {}),
  }) as WorldEvolutionIntent
}

function explicitlyRequestsAll(instruction: string): boolean {
  return /(所有|全部|每个|都)/u.test(instruction) || /\b(?:all|every|each)\b/iu.test(instruction)
}

const SEMANTIC_HINTS = [
  { name: 'cow', aliases: ['牛', '奶牛', 'cow', 'cows'] },
  { name: 'sheep', aliases: ['羊', 'sheep'] },
  { name: 'merchant', aliases: ['商人', 'merchant'] },
  { name: 'robot', aliases: ['机器人', 'robot'] },
  { name: 'villager', aliases: ['村民', 'villager', 'villagers'] },
  { name: 'slime', aliases: ['史莱姆', 'slime', 'slimes'] },
  { name: 'skeleton', aliases: ['骷髅', 'skeleton'] },
  { name: 'wolf', aliases: ['狼', 'wolf', 'wolves'] },
  { name: 'enemy', aliases: ['敌人', '怪物', '怪', 'enemy', 'enemies'] },
  { name: 'boss', aliases: ['首领', 'boss'] },
] as const

const GENERIC_TARGET_SEMANTICS = new Set(['entity', 'npc', 'actor', 'character', 'thing', 'object'])

function semanticHintForInstruction(instruction: string, intent: Extract<WorldEvolutionIntent, { readonly target: EvolutionTargetSelector }>): string | undefined {
  const replacement = 'replacement' in intent ? intent.replacement.name.toLocaleLowerCase() : ''
  const lower = instruction.toLocaleLowerCase()
  return SEMANTIC_HINTS.find(hint =>
    hint.aliases.some(alias => lower.includes(alias.toLocaleLowerCase())) &&
    !hint.aliases.some(alias => replacement.includes(alias.toLocaleLowerCase())),
  )?.name
}

function explicitEntityIdForInstruction(instruction: string, entityIds: readonly string[]): string | undefined {
  return [...entityIds]
    .sort((left, right) => right.length - left.length)
    .find(entityId => new RegExp(`(?:^|[^A-Za-z0-9_-])${entityId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}(?:$|[^A-Za-z0-9_-])`, 'iu').test(instruction))
}

/** Preserve explicit user target language when a provider returns a generic selector. */
function alignIntentWithInstruction(intent: WorldEvolutionIntent, instruction: string, entityIds: readonly string[]): WorldEvolutionIntent {
  if (!('target' in intent)) return intent
  const targetIntent = intent as Extract<WorldEvolutionIntent, { readonly target: EvolutionTargetSelector }>
  const hint = semanticHintForInstruction(instruction, targetIntent)
  const targetSemantic = targetIntent.target.semantic?.toLocaleLowerCase()
  const shouldUseHint = hint !== undefined && (targetSemantic === undefined || GENERIC_TARGET_SEMANTICS.has(targetSemantic))
  const all = explicitlyRequestsAll(instruction)
  const explicitEntityId = all ? undefined : explicitEntityIdForInstruction(instruction, entityIds)
  if (!shouldUseHint && !all && !explicitEntityId) return intent
  return Object.freeze({
    ...targetIntent,
    ...(explicitEntityId ? { scope: 'entity' as const } : all ? { scope: 'archetype-group' as const } : {}),
    target: explicitEntityId
      ? Object.freeze({ entityId: explicitEntityId })
      : Object.freeze({
          ...targetIntent.target,
          ...(shouldUseHint ? { semantic: hint } : {}),
          ...(all ? { match: 'all' as const } : {}),
        }),
  })
}

function summary(operation: WorldSemanticDeltaOperation): string {
  if (operation.kind === 'add-entity') return `Add ${operation.semantic.name} ×${operation.count}`
  if (operation.kind === 'remove-entity') return `Remove ${operation.targetIds.join(', ')}`
  if (operation.kind === 'replace-entity-semantic') return `Replace ${operation.from[0]?.name ?? 'semantic'} → ${operation.replacement.name} for ${operation.targetIds.join(', ')}`
  if (operation.kind === 'update-world-property') return `Update ${operation.property}: ${operation.from ?? 'unset'} → ${operation.to}`
  return `Update ${operation.property} for ${operation.targetIds.join(', ')}`
}

function stageName(name: WorldEvolutionStageName, status: WorldEvolutionStage['status'], timestamp: string, error?: string): WorldEvolutionStage {
  return Object.freeze({ name, status, timestamp, ...(error ? { error } : {}) })
}

/** Provider-neutral orchestration: AI proposes meaning; Genesis resolves and validates reality. */
export class DefaultWorldEvolutionPlanner implements WorldEvolutionPlanner {
  private readonly candidateProvider: WorldEvolutionCandidateProvider
  private readonly source: WorldEvolutionSource
  private readonly promptBuilder: WorldEvolutionPromptBuilder
  private readonly resolver: WorldEvolutionTargetResolver
  private readonly validator: WorldSemanticDeltaValidator
  private readonly clock: Clock

  constructor(
    candidateProvider?: WorldEvolutionCandidateProvider,
    promptBuilder: WorldEvolutionPromptBuilder = new DefaultWorldEvolutionPromptBuilder(),
    resolver: WorldEvolutionTargetResolver = new DefaultWorldEvolutionTargetResolver(),
    validator: WorldSemanticDeltaValidator = new DefaultWorldSemanticDeltaValidator(),
    clock: Clock = defaultClock,
  ) {
    this.candidateProvider = candidateProvider ?? new DeterministicWorldEvolutionCandidateProvider()
    this.source = sourceFor(this.candidateProvider)
    this.promptBuilder = promptBuilder
    this.resolver = resolver
    this.validator = validator
    this.clock = clock
  }

  async plan(input: WorldEvolutionRequest): Promise<WorldEvolutionPlanResult> {
    const createdAt = typeof input?.createdAt === 'string' && input.createdAt ? input.createdAt : this.clock()
    const request = validRequest(input) ? freezeRequest(input, createdAt) : fallbackRequest()
    const stages: WorldEvolutionStage[] = []
    const events: WorldEvolutionEvent[] = [Object.freeze({
      id: `${request.operationId}:requested`,
      operationId: request.operationId,
      worldId: request.context.worldId,
      type: 'world.evolution.requested',
      timestamp: request.createdAt ?? createdAt,
      message: 'World evolution request received',
    })]
    const metadata = this.candidateProvider.getProviderMetadata?.()
    const resolvedTargetIds: string[] = []

    if (!validRequest(input)) {
      stages.push(stageName('REQUEST_RECEIVED', 'failed', this.clock()))
      return this.failure(request, 'failed', 'invalid_request', 'World evolution request is invalid', stages, events, metadata, resolvedTargetIds)
    }
    stages.push(stageName('REQUEST_RECEIVED', 'success', this.clock()))

    let candidate: unknown
    try {
      let prompt: GameDesignPrompt | undefined
      if (this.source === 'ai') {
        prompt = this.promptBuilder.build(request)
        stages.push(stageName('PROMPT_ASSEMBLY', 'success', this.clock()))
      }
      candidate = await this.candidateProvider.generate(request, prompt)
      if (this.source === 'ai') stages.push(stageName('STRUCTURED_GENERATION', 'success', this.clock()))
    } catch {
      stages.push(stageName('STRUCTURED_GENERATION', 'failed', this.clock()))
      return this.failure(request, 'failed', 'provider_error', 'Structured world evolution planning failed', stages, events, metadata, resolvedTargetIds)
    }

    let intent: WorldEvolutionIntent
    try {
      intent = freezeIntent(alignIntentWithInstruction(parseWorldEvolutionCandidate(candidate), request.instruction, request.context.semanticWorld.entities.map(entity => entity.id)))
      stages.push(stageName('CANDIDATE_PARSE', 'success', this.clock()))
    } catch (error) {
      stages.push(stageName('CANDIDATE_PARSE', 'failed', this.clock()))
      const status = error instanceof UnsupportedWorldEvolutionError ? 'unsupported' : 'failed'
      const reason = error instanceof UnsupportedWorldEvolutionError ? 'unsupported_operation' : 'candidate_invalid'
      return this.failure(request, status, reason, status === 'unsupported' ? 'World evolution operation is unsupported' : 'World evolution candidate is invalid', stages, events, metadata, resolvedTargetIds)
    }

    let operation: WorldSemanticDeltaOperation
    try {
      operation = this.resolveOperation(intent, request, resolvedTargetIds)
      stages.push(stageName('TARGET_RESOLUTION', 'success', this.clock()))
    } catch (error) {
      stages.push(stageName('TARGET_RESOLUTION', 'failed', this.clock()))
      const resolution = error instanceof ResolutionError ? error : new ResolutionError('target_unresolved')
      const status = resolution.reason === 'ambiguous_target' || resolution.reason === 'target_unresolved' ? 'needs_clarification' : 'unsupported'
      return this.failure(request, status, resolution.reason, resolution.reason === 'ambiguous_target' ? 'Current target is ambiguous; choose an exact entity or all matching entities' : 'No matching current semantic target was resolved', stages, events, metadata, resolvedTargetIds, intent)
    }

    const delta = freezeDelta(Object.freeze({
      operationId: request.operationId,
      worldId: request.context.worldId,
      ...(request.context.semanticRevision !== undefined ? { semanticRevision: request.context.semanticRevision } : {}),
      operations: Object.freeze([operation]),
      summary: summary(operation),
    }))
    const validation = this.validator.validate(delta, request)
    if (!validation.valid) {
      stages.push(stageName('DELTA_VALIDATION', 'failed', this.clock()))
      return this.failure(request, 'failed', 'delta_invalid', 'World semantic delta validation failed', stages, events, metadata, resolvedTargetIds, intent)
    }
    stages.push(stageName('DELTA_VALIDATION', 'success', this.clock()))
    const completedAt = this.clock()
    events.push(Object.freeze({
      id: `${request.operationId}:planned`,
      operationId: request.operationId,
      worldId: request.context.worldId,
      type: 'world.evolution.planned',
      timestamp: completedAt,
      message: 'World evolution semantic delta validated',
    }))
    const record = this.operation(request, 'validated', stages, events, metadata, resolvedTargetIds, intent, delta.summary, completedAt)
    return Object.freeze({ status: 'validated', request, intent, delta, operation: record })
  }

  private resolveOperation(intent: WorldEvolutionIntent, request: WorldEvolutionRequest, resolvedTargetIds: string[]): WorldSemanticDeltaOperation {
    if (intent.kind === 'add-entity') {
      const semantic = this.resolver.resolveSemantic(intent.semantic)
      if (semantic.status !== 'resolved' || !semantic.semantic) throw new ResolutionError('target_unresolved')
      return Object.freeze({ kind: 'add-entity', scope: 'entity', semantic: Object.freeze({ ...semantic.semantic }), count: intent.count })
    }
    if (intent.kind === 'update-world-property') {
      return Object.freeze({ kind: 'update-world-property', scope: 'world', property: intent.property, from: request.context.properties?.[intent.property], to: intent.value })
    }
    if (intent.kind === 'update-entity-property') throw new ResolutionError('unsupported_operation')

    const target = this.resolver.resolveTargets(intent.target, request)
    if (target.status !== 'resolved') throw new ResolutionError(target.status === 'ambiguous' ? 'ambiguous_target' : 'target_unresolved')
    resolvedTargetIds.push(...target.targetIds)
    if (intent.kind === 'remove-entity') return Object.freeze({ kind: 'remove-entity', scope: intent.scope, targetIds: Object.freeze([...target.targetIds]) })
    const entities = request.context.semanticWorld.entities.filter(entity => target.targetIds.includes(entity.id))
    const replacement = this.resolver.resolveSemantic(intent.replacement, entities[0]?.category)
    if (replacement.status !== 'resolved' || !replacement.semantic) throw new ResolutionError('target_unresolved')
    return Object.freeze({
      kind: 'replace-entity-semantic',
      scope: intent.scope,
      targetIds: Object.freeze([...target.targetIds]),
      from: Object.freeze(entities.map(entity => Object.freeze({ name: entity.name, category: entity.category }))),
      replacement: Object.freeze({ ...replacement.semantic }),
      preserveIdentity: intent.preserveIdentity,
    })
  }

  private operation(
    request: WorldEvolutionRequest,
    status: WorldEvolutionPlanStatus,
    stages: readonly WorldEvolutionStage[],
    events: readonly WorldEvolutionEvent[],
    metadata: { readonly provider: string; readonly model?: string } | undefined,
    resolvedTargetIds: readonly string[],
    intent?: WorldEvolutionIntent,
    deltaSummary?: string,
    completedAt?: string,
    failureReason?: string,
  ): WorldEvolutionOperation {
    return Object.freeze({
      operationId: request.operationId,
      worldId: request.context.worldId,
      ...(request.context.semanticRevision !== undefined ? { semanticRevision: request.context.semanticRevision } : {}),
      instruction: request.instruction,
      status,
      createdAt: request.createdAt ?? this.clock(),
      ...(completedAt ? { completedAt } : {}),
      source: this.source,
      ...(metadata?.provider ? { provider: metadata.provider } : {}),
      ...(metadata?.model ? { model: metadata.model } : {}),
      ...(request.generationContext ? { contextMetadata: summarizeGenerationContext(request.generationContext) } : {}),
      ...(intent ? { kind: intent.kind, scope: intent.scope } : {}),
      resolvedTargetIds: Object.freeze([...resolvedTargetIds]),
      ...(deltaSummary ? { deltaSummary } : {}),
      ...(failureReason ? { failureReason } : {}),
      stages: Object.freeze(stages.map(stage => Object.freeze({ ...stage }))),
      events: Object.freeze(events.map(event => Object.freeze({ ...event }))),
    })
  }

  private failure(
    request: WorldEvolutionRequest,
    status: 'needs_clarification' | 'unsupported' | 'failed',
    failureReason: string,
    reason: string,
    stages: readonly WorldEvolutionStage[],
    events: WorldEvolutionEvent[],
    metadata: { readonly provider: string; readonly model?: string } | undefined,
    resolvedTargetIds: readonly string[],
    intent?: WorldEvolutionIntent,
  ): WorldEvolutionPlanResult {
    const eventType = status === 'needs_clarification' ? 'world.evolution.needs_clarification' : status === 'failed' ? 'world.evolution.validation_failed' : 'world.evolution.validation_failed'
    events.push(Object.freeze({
      id: `${request.operationId}:${status}`,
      operationId: request.operationId,
      worldId: request.context.worldId,
      type: eventType,
      timestamp: this.clock(),
      message: reason,
    }))
    const operation = this.operation(request, status, stages, events, metadata, resolvedTargetIds, intent, undefined, this.clock(), failureReason)
    return Object.freeze({ status, request, operation, reason })
  }
}

class ResolutionError extends Error {
  constructor(readonly reason: 'target_unresolved' | 'ambiguous_target' | 'unsupported_operation') {
    super(reason)
  }
}
