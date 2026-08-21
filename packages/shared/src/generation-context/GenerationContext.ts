import type { AssetKind, AssetRequirement, AssetSpecification, AssetTarget, AssetTechnicalProfile, AssetVisualState } from '../asset-specification'
import type { EntityCategory, GameWorldModel, WorldType } from '../game-world'
import type { GameDifficulty, GameObjectiveType } from '../game-design'
import type {
  ArtDirection,
  EnvironmentVisualDesign,
  VisualPaletteSemantics,
  VisualTheme,
} from '../visual-design'
import type {
  WorldEvolutionOperationKind,
  WorldSemanticProperties,
} from '../world-evolution/WorldEvolution'

export type GenerationContextScope =
  | 'world-evolution'
  | 'image-generation'
  | 'game-design'
  | 'gameplay-generation'

/** Provider-neutral identity and revision facts captured by one snapshot. */
export interface GenerationContextMetadata {
  readonly scope: GenerationContextScope
  readonly worldId?: string
  readonly sessionId?: string
  readonly operationId?: string
  readonly correlationId?: string
  readonly semanticRevision?: number
  readonly runtimeSemanticRevision?: number
  readonly visualRevision?: number
  readonly architectureVersion?: string
}

export type GenerationContextMetadataInput = Omit<GenerationContextMetadata, 'scope'>

/** Safe, bounded fields suitable for an operation trace or Observatory view. */
export interface GenerationContextTraceMetadata {
  readonly scope: GenerationContextScope
  readonly worldId?: string
  readonly operationId?: string
  readonly semanticRevision?: number
  readonly runtimeSemanticRevision?: number
  readonly visualRevision?: number
  readonly targetArchetype?: string
  readonly bindingCount?: number
  readonly referenceMetadataCount?: number
}

export interface WorldEvolutionEntityContext {
  readonly id: string
  readonly name: string
  readonly category: EntityCategory
}

/** Minimum current semantic facts needed to interpret an existing-world edit. */
export interface WorldEvolutionGenerationContext extends GenerationContextMetadata {
  readonly scope: 'world-evolution'
  readonly world: {
    readonly worldType: WorldType
    readonly properties?: WorldSemanticProperties
  }
  readonly entities: readonly WorldEvolutionEntityContext[]
  readonly selectedEntityId?: string
  readonly supportedOperations: readonly WorldEvolutionOperationKind[]
}

export interface WorldEvolutionGenerationContextInput {
  readonly metadata?: GenerationContextMetadataInput
  readonly semanticWorld: GameWorldModel
  readonly properties?: WorldSemanticProperties
  readonly selectedEntityId?: string
}

export interface WorldEvolutionGenerationContextBuilder {
  build(input: WorldEvolutionGenerationContextInput): WorldEvolutionGenerationContext
}

export interface ImageGenerationAssetContext {
  /** The first requirement in the canonical group. */
  readonly canonicalAssetId: string
  /** Stable asset bindings are evidence, not visual identity. */
  readonly assetIds: readonly string[]
  readonly entityIds: readonly string[]
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly subject: string
  readonly entityId?: string
  readonly visualRole?: string
  readonly visualArchetype?: string
  readonly requiredStates: readonly AssetVisualState[]
  readonly technicalProfile: AssetTechnicalProfile
}

export interface ImageGenerationReferenceMetadata {
  readonly assetId: string
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly subject: string
  readonly visualRole?: string
  readonly visualArchetype?: string
}

/** Small visual/game snapshot for one text-to-image or future image capability. */
export interface ImageGenerationContext extends GenerationContextMetadata {
  readonly scope: 'image-generation'
  readonly game: {
    readonly worldType?: WorldType
    readonly theme?: string
    readonly timeOfDay?: string
  }
  readonly visual: {
    readonly artDirection: ArtDirection
    readonly theme: VisualTheme
    readonly palette: VisualPaletteSemantics
    readonly environment?: EnvironmentVisualDesign
    readonly targetRole?: string
    readonly targetArchetype?: string
  }
  readonly asset: ImageGenerationAssetContext
  /** Metadata only; no image bytes or resource URI is carried here. */
  readonly references: readonly ImageGenerationReferenceMetadata[]
}

export interface ImageGenerationContextBuilderInput {
  readonly metadata?: GenerationContextMetadataInput
  readonly semanticWorld?: GameWorldModel
  readonly properties?: WorldSemanticProperties
  readonly visualDesign: {
    readonly artDirection: ArtDirection
    readonly theme: VisualTheme
    readonly palette: VisualPaletteSemantics
    readonly environment?: EnvironmentVisualDesign
  }
  readonly assetSpecification: AssetSpecification
  readonly requirement: AssetRequirement
  readonly bindings?: readonly AssetRequirement[]
}

export interface ImageGenerationContextBuilder {
  build(input: ImageGenerationContextBuilderInput): ImageGenerationContext
}

export interface GameDesignGenerationCapabilities {
  readonly supportedGenres: readonly WorldType[]
  readonly supportedEntityCategories: readonly EntityCategory[]
  readonly supportedDifficulties: readonly GameDifficulty[]
  readonly supportedObjectiveTypes: readonly GameObjectiveType[]
  readonly realizedSemantics: readonly string[]
  readonly preservedSemantics: readonly string[]
}

/** Existing create-world inputs and provider-neutral product constraints. */
export interface GameDesignGenerationContext extends GenerationContextMetadata {
  readonly scope: 'game-design'
  readonly request: {
    readonly instruction: string
    readonly genre: WorldType
    readonly title: string
  }
  readonly capabilities: GameDesignGenerationCapabilities
}

export interface GameDesignGenerationContextBuilderInput {
  readonly metadata?: GenerationContextMetadataInput
  readonly instruction: string
  readonly genre: WorldType
  readonly title: string
  readonly capabilities: GameDesignGenerationCapabilities
}

export interface GameDesignGenerationContextBuilder {
  build(input: GameDesignGenerationContextBuilderInput): GameDesignGenerationContext
}

/** Typed boundary for the future gameplay-mechanics generation work order. */
export interface GameplayGenerationContext<TGameplaySpecification = unknown> extends GenerationContextMetadata {
  readonly scope: 'gameplay-generation'
  readonly genre?: WorldType
  readonly semanticWorldSummary?: string
  readonly existingGameplaySpecification?: TGameplaySpecification
  readonly supportedRuntimePrimitives?: readonly string[]
  readonly userGameplayIntent?: string
}

export interface GameplayGenerationContextBuilder<TGameplaySpecification = unknown> {
  build(input: GameplayGenerationContext<TGameplaySpecification>): GameplayGenerationContext<TGameplaySpecification>
}

function metadata<S extends GenerationContextScope>(
  scope: S,
  input: GenerationContextMetadataInput = {},
): GenerationContextMetadata & { readonly scope: S } {
  return Object.freeze({
    scope,
    ...(input.worldId ? { worldId: input.worldId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.operationId ? { operationId: input.operationId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    ...(input.semanticRevision !== undefined ? { semanticRevision: input.semanticRevision } : {}),
    ...(input.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: input.runtimeSemanticRevision } : {}),
    ...(input.visualRevision !== undefined ? { visualRevision: input.visualRevision } : {}),
    ...(input.architectureVersion ? { architectureVersion: input.architectureVersion } : {}),
  })
}

const EVOLUTION_OPERATIONS: readonly WorldEvolutionOperationKind[] = Object.freeze([
  'add-entity',
  'remove-entity',
  'replace-entity-semantic',
  'update-world-property',
])

export class DefaultWorldEvolutionGenerationContextBuilder implements WorldEvolutionGenerationContextBuilder {
  build(input: WorldEvolutionGenerationContextInput): WorldEvolutionGenerationContext {
    const entities = Object.freeze(input.semanticWorld.entities.map(entity => Object.freeze({
      id: entity.id,
      name: entity.name,
      category: entity.category,
    })))
    const selectedEntityId = input.selectedEntityId && entities.some(entity => entity.id === input.selectedEntityId)
      ? input.selectedEntityId
      : undefined
    return Object.freeze({
      ...metadata('world-evolution', input.metadata),
      world: Object.freeze({
        worldType: input.semanticWorld.worldType,
        ...(input.properties && Object.keys(input.properties).length > 0
          ? { properties: Object.freeze({ ...input.properties }) }
          : {}),
      }),
      entities,
      ...(selectedEntityId ? { selectedEntityId } : {}),
      supportedOperations: EVOLUTION_OPERATIONS,
    })
  }
}

function visualIdentity(specification: AssetSpecification, requirement: AssetRequirement): string {
  return JSON.stringify({
    kind: requirement.kind,
    archetype: requirement.visualArchetype ?? requirement.subject ?? requirement.visualRole,
    subject: requirement.subject,
    context: specification.visualContext,
  })
}

function referenceMetadata(requirement: AssetRequirement): ImageGenerationReferenceMetadata {
  return Object.freeze({
    assetId: requirement.id,
    kind: requirement.kind,
    target: requirement.target,
    subject: requirement.subject,
    ...(requirement.visualRole ? { visualRole: requirement.visualRole } : {}),
    ...(requirement.visualArchetype ? { visualArchetype: requirement.visualArchetype } : {}),
  })
}

function selectReferences(
  specification: AssetSpecification,
  requirement: AssetRequirement,
  bindingIds: ReadonlySet<string>,
): readonly ImageGenerationReferenceMetadata[] {
  const candidates = specification.assets
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) =>
      !bindingIds.has(candidate.id)
      && candidate.kind === requirement.kind
      && candidate.target === requirement.target,
    )
    .sort((left, right) => {
      const leftRole = left.candidate.visualRole === requirement.visualRole ? 1 : 0
      const rightRole = right.candidate.visualRole === requirement.visualRole ? 1 : 0
      return rightRole - leftRole || left.index - right.index
    })
  const seen = new Set<string>()
  const selected: ImageGenerationReferenceMetadata[] = []
  for (const { candidate } of candidates) {
    const identity = visualIdentity(specification, candidate)
    if (seen.has(identity)) continue
    seen.add(identity)
    selected.push(referenceMetadata(candidate))
    if (selected.length === 3) break
  }
  return Object.freeze(selected)
}

export class DefaultImageGenerationContextBuilder implements ImageGenerationContextBuilder {
  build(input: ImageGenerationContextBuilderInput): ImageGenerationContext {
    const bindings = input.bindings && input.bindings.length > 0 ? input.bindings : [input.requirement]
    const bindingIds = Object.freeze([...new Set(bindings.map(binding => binding.id))])
    const entityIds = Object.freeze([...new Set(bindings.flatMap(binding => binding.entityId ? [binding.entityId] : []))])
    const requirement = input.requirement
    const theme = input.properties?.theme?.trim() || input.visualDesign.theme.sourceTheme.trim()
    const environmentTarget = requirement.target === 'environment'
    const timeOfDay = environmentTarget && input.properties?.timeOfDay?.trim()
      ? input.properties.timeOfDay.trim()
      : undefined
    const asset = Object.freeze({
      canonicalAssetId: requirement.id,
      assetIds: bindingIds,
      entityIds,
      kind: requirement.kind,
      target: requirement.target,
      subject: requirement.subject,
      ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
      ...(requirement.visualRole ? { visualRole: requirement.visualRole } : {}),
      ...(requirement.visualArchetype ? { visualArchetype: requirement.visualArchetype } : {}),
      requiredStates: Object.freeze([...requirement.requiredStates]),
      technicalProfile: Object.freeze({ ...requirement.technicalProfile }),
    })
    return Object.freeze({
      ...metadata('image-generation', input.metadata),
      game: Object.freeze({
        ...(input.semanticWorld ? { worldType: input.semanticWorld.worldType } : {}),
        ...(theme && theme !== 'none' ? { theme } : {}),
        ...(timeOfDay ? { timeOfDay } : {}),
      }),
      visual: Object.freeze({
        artDirection: input.visualDesign.artDirection,
        theme: Object.freeze({ ...input.visualDesign.theme }),
        palette: Object.freeze({ ...input.visualDesign.palette }),
        ...(environmentTarget && input.visualDesign.environment ? { environment: Object.freeze({ ...input.visualDesign.environment }) } : {}),
        ...(requirement.visualRole ? { targetRole: requirement.visualRole } : {}),
        ...(requirement.visualArchetype ? { targetArchetype: requirement.visualArchetype } : {}),
      }),
      asset,
      references: selectReferences(input.assetSpecification, requirement, new Set(bindingIds)),
    })
  }
}

export class DefaultGameDesignGenerationContextBuilder implements GameDesignGenerationContextBuilder {
  build(input: GameDesignGenerationContextBuilderInput): GameDesignGenerationContext {
    const capabilities = Object.freeze({
      supportedGenres: Object.freeze([...input.capabilities.supportedGenres]),
      supportedEntityCategories: Object.freeze([...input.capabilities.supportedEntityCategories]),
      supportedDifficulties: Object.freeze([...input.capabilities.supportedDifficulties]),
      supportedObjectiveTypes: Object.freeze([...input.capabilities.supportedObjectiveTypes]),
      realizedSemantics: Object.freeze([...input.capabilities.realizedSemantics]),
      preservedSemantics: Object.freeze([...input.capabilities.preservedSemantics]),
    })
    return Object.freeze({
      ...metadata('game-design', input.metadata),
      request: Object.freeze({ instruction: input.instruction, genre: input.genre, title: input.title }),
      capabilities,
    })
  }
}

export function summarizeGenerationContext(
  context: GenerationContextMetadata & {
    readonly visual?: { readonly targetArchetype?: string }
    readonly asset?: { readonly assetIds: readonly string[] }
    readonly references?: readonly unknown[]
  },
): GenerationContextTraceMetadata {
  return Object.freeze({
    scope: context.scope,
    ...(context.worldId ? { worldId: context.worldId } : {}),
    ...(context.operationId ? { operationId: context.operationId } : {}),
    ...(context.semanticRevision !== undefined ? { semanticRevision: context.semanticRevision } : {}),
    ...(context.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: context.runtimeSemanticRevision } : {}),
    ...(context.visualRevision !== undefined ? { visualRevision: context.visualRevision } : {}),
    ...(context.visual?.targetArchetype ? { targetArchetype: context.visual.targetArchetype } : {}),
    ...(context.asset ? { bindingCount: context.asset.assetIds.length } : {}),
    ...(context.references ? { referenceMetadataCount: context.references.length } : {}),
  })
}
