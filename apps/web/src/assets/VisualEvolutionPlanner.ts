import {
  DefaultAssetSpecificationBuilder,
  DefaultVisualDesignSpecificationBuilder,
} from '@genesis/ai'
import type {
  AssetImpactEntry,
  AssetImpactPlan,
  AssetRequirement,
  AssetSpecification,
  EntityCategory,
  GameDesignSpecification,
  GameWorldModel,
  RuntimeEvolutionResult,
  SemanticWorldMutationResult,
  VisualArchetypeSnapshot,
  VisualBindingChange,
  VisualDesignSpecification,
  VisualEvolutionFailureReason,
  VisualEvolutionPlan,
  VisualEvolutionPlanner as VisualEvolutionPlannerContract,
  VisualEvolutionPlanningOptions,
  VisualRequirementReplacement,
  VisualWorldImpact,
} from '@genesis/shared'
import {
  groupAiGenerationRequirements,
  visualGenerationIdentity,
} from './AssetGenerationPolicy'

interface RequirementGroup {
  readonly identity: string
  readonly canonical: AssetRequirement
  readonly requirements: readonly AssetRequirement[]
  readonly eligibleForGeneration: boolean
}

const EMPTY_IMPACT: AssetImpactPlan = Object.freeze({
  status: 'no_visual_impact',
  entries: Object.freeze([]),
  generationRequired: Object.freeze([]),
  orphanedAssetIds: Object.freeze([]),
  unaffectedAssetIds: Object.freeze([]),
  unaffectedArchetypes: Object.freeze([]),
  noImpactReason: 'No visual specification or asset requirement changed',
})

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items])
}

function freezeObject<T extends object>(value: T): T {
  return Object.freeze(value)
}

function unique<T>(items: readonly T[]): readonly T[] {
  return freezeArray([...new Set(items)])
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function entityIds(group: RequirementGroup): readonly string[] {
  return freezeArray(group.requirements.flatMap(requirement => requirement.entityId ? [requirement.entityId] : []))
}

function assetIds(group: RequirementGroup): readonly string[] {
  return freezeArray(group.requirements.map(requirement => requirement.id))
}

function snapshot(group: RequirementGroup): VisualArchetypeSnapshot {
  const canonical = group.canonical
  return freezeObject({
    identity: group.identity,
    kind: canonical.kind,
    target: canonical.target,
    subject: canonical.subject,
    ...(canonical.visualArchetype ? { visualArchetype: canonical.visualArchetype } : {}),
    assetIds: assetIds(group),
    entityIds: entityIds(group),
    eligibleForGeneration: group.eligibleForGeneration,
  })
}

function groupRequirements(specification: AssetSpecification): readonly RequirementGroup[] {
  const eligibleIds = new Set<string>()
  const groups: RequirementGroup[] = []
  for (const [canonical, requirements] of groupAiGenerationRequirements(specification)) {
    for (const requirement of requirements) eligibleIds.add(requirement.id)
    groups.push({
      identity: visualGenerationIdentity(specification, canonical),
      canonical,
      requirements,
      eligibleForGeneration: true,
    })
  }
  for (const requirement of specification.assets) {
    if (eligibleIds.has(requirement.id)) continue
    groups.push({
      identity: `static:${requirement.id}`,
      canonical: requirement,
      requirements: freezeArray([requirement]),
      eligibleForGeneration: false,
    })
  }
  return freezeArray(groups)
}

function roleForCategory(category: EntityCategory): string {
  if (category === 'player') return 'player character'
  if (category === 'enemy') return 'enemy creature'
  if (category === 'terrain') return 'terrain element'
  if (category === 'quest') return 'quest marker'
  if (category === 'building') return 'world structure'
  if (category === 'item') return 'collectible item'
  if (category === 'npc') return 'supporting character'
  return 'world element'
}

function buildThemeContext(
  sourceTheme: string,
  worldSpatialMode: VisualDesignSpecification['worldSpatialMode'] = 'side-view',
): Pick<VisualDesignSpecification, 'theme' | 'palette' | 'environment' | 'worldSpatialMode'> {
  const design: GameDesignSpecification = {
    title: 'visual-evolution-theme',
    genre: worldSpatialMode === 'top-down' ? 'survival' : 'sandbox',
    theme: { name: sourceTheme },
    objectives: [],
    entities: [],
  }
  const derived = new DefaultVisualDesignSpecificationBuilder().build(design)
  return {
    theme: derived.theme,
    palette: derived.palette,
    environment: derived.environment,
    worldSpatialMode: derived.worldSpatialMode ?? worldSpatialMode,
  }
}

function withTimeOfDay(background: string, timeOfDay: string): string {
  const base = background.replace(/\s·\s[^·]+ lighting$/u, '').trim()
  return `${base} · ${timeOfDay.trim()} lighting`
}

function buildVisualDesign(
  current: VisualDesignSpecification,
  afterSemanticWorld: GameWorldModel,
  mutation: SemanticWorldMutationResult,
): { readonly design: VisualDesignSpecification; readonly worldImpact: readonly VisualWorldImpact[] } {
  const currentById = new Map(current.entities.map(entity => [entity.entityId, entity]))
  const addedEntityIds = new Set(mutation.addedEntityIds)

  // Survival enemy additions are the same gameplay role as the existing
  // enemy pressure source. Preserve that role's visual identity so the
  // existing generated enemy resource can be rebound to every new entity.
  // This is composition at the Web visual boundary; Runtime remains
  // component-driven and does not know about world types or assets.
  const inheritedVisual = (entity: GameWorldModel['entities'][number]): VisualDesignSpecification['entities'][number] | undefined => {
    if (afterSemanticWorld.worldType !== 'survival' || entity.category !== 'enemy' || !addedEntityIds.has(entity.id)) return undefined
    return current.entities.find(candidate => candidate.category === 'enemy' && !addedEntityIds.has(candidate.entityId))
  }
  let theme = current.theme
  let palette = current.palette
  let environment = current.environment
  const worldImpact: VisualWorldImpact[] = []

  for (const update of mutation.worldPropertyUpdates) {
    if (update.property === 'theme') {
      const context = buildThemeContext(update.to, current.worldSpatialMode)
      theme = context.theme
      palette = context.palette
      environment = context.environment
      worldImpact.push(freezeObject({
        property: update.property,
        affectedAssetKinds: freezeArray(['background', 'terrain', 'character', 'prop']),
        affectedAssetIds: freezeArray([]),
        reason: 'Theme and palette are shared visual context for eligible requirements',
      }))
    }
    if (update.property === 'timeOfDay') {
      environment = freezeObject({
        ...environment,
        background: withTimeOfDay(environment.background, update.to),
      })
      worldImpact.push(freezeObject({
        property: update.property,
        affectedAssetKinds: freezeArray(['background']),
        affectedAssetIds: freezeArray(['background-main']),
        reason: 'Current visual model encodes time-of-day only in the background context',
      }))
    }
  }

  const entities = afterSemanticWorld.entities.map(entity => {
    const previous = currentById.get(entity.id)
    if (previous
      && previous.category === entity.category
      && previous.visualArchetype === entity.name
      && previous.visualRole) return previous
    const inherited = inheritedVisual(entity)
    if (inherited) {
      return freezeObject({
        entityId: entity.id,
        category: entity.category,
        visualRole: inherited.visualRole,
        visualArchetype: inherited.visualArchetype,
      })
    }
    const categoryChanged = previous?.category !== entity.category
    return freezeObject({
      entityId: entity.id,
      category: entity.category,
      visualRole: categoryChanged ? roleForCategory(entity.category) : previous?.visualRole ?? roleForCategory(entity.category),
      visualArchetype: entity.name.trim() || previous?.visualArchetype || roleForCategory(entity.category),
    })
  })

  return {
    design: freezeObject({
      artDirection: current.artDirection,
      ...(current.worldSpatialMode ? { worldSpatialMode: current.worldSpatialMode } : {}),
      theme,
      palette,
      environment,
      entities: freezeArray(entities),
    }),
    worldImpact: freezeArray(worldImpact),
  }
}

function buildTargetedAssetSpecification(
  current: AssetSpecification,
  visualDesign: VisualDesignSpecification,
): AssetSpecification {
  const candidate = new DefaultAssetSpecificationBuilder().build(visualDesign)
  const currentById = new Map(current.assets.map(asset => [asset.id, asset]))
  const assets = candidate.assets.map(asset => {
    const previous = currentById.get(asset.id)
    return previous && sameJson(previous, asset) ? previous : asset
  })
  return freezeObject({
    visualContext: sameJson(current.visualContext, candidate.visualContext)
      ? current.visualContext
      : candidate.visualContext,
    assets: freezeArray(assets),
  })
}

function sameMembers(left: RequirementGroup, right: RequirementGroup): boolean {
  return sameJson(assetIds(left), assetIds(right)) && sameJson(entityIds(left), entityIds(right))
}

function canPair(left: RequirementGroup, right: RequirementGroup): boolean {
  if (left.canonical.target === 'environment' || right.canonical.target === 'environment') {
    return left.canonical.id === right.canonical.id
  }
  return sameJson(entityIds(left), entityIds(right)) && entityIds(left).length > 0
}

function sameArchetype(left: RequirementGroup, right: RequirementGroup): boolean {
  return left.canonical.kind === right.canonical.kind
    && left.canonical.subject === right.canonical.subject
    && left.canonical.visualArchetype === right.canonical.visualArchetype
}

function bindingChanges(left: RequirementGroup, right: RequirementGroup): readonly VisualBindingChange[] {
  const beforeById = new Map(left.requirements.map(requirement => [requirement.entityId, requirement]))
  const afterById = new Map(right.requirements.map(requirement => [requirement.entityId, requirement]))
  const changes: VisualBindingChange[] = []
  for (const entityId of new Set([...beforeById.keys(), ...afterById.keys()])) {
    if (!entityId) continue
    const before = beforeById.get(entityId)
    const after = afterById.get(entityId)
    if (before && after) continue
    if (before) {
      changes.push(freezeObject({
        entityId,
        assetId: before.id,
        beforeArchetype: before.visualArchetype ?? before.subject,
        action: 'REMOVE' as const,
      }))
    } else if (after) {
      changes.push(freezeObject({
        entityId,
        assetId: after.id,
        afterArchetype: after.visualArchetype ?? after.subject,
        action: 'ADD' as const,
      }))
    }
  }
  return freezeArray(changes)
}

function buildAssetImpact(
  before: AssetSpecification,
  after: AssetSpecification,
): {
  readonly impact: AssetImpactPlan
  readonly oldArchetypes: readonly VisualArchetypeSnapshot[]
  readonly newArchetypes: readonly VisualArchetypeSnapshot[]
  readonly added: readonly AssetRequirement[]
  readonly removed: readonly AssetRequirement[]
  readonly replaced: readonly VisualRequirementReplacement[]
  readonly bindings: readonly VisualBindingChange[]
} {
  const beforeGroups = [...groupRequirements(before)]
  const afterGroups = [...groupRequirements(after)]
  const usedBefore = new Set<number>()
  const usedAfter = new Set<number>()
  const entries: AssetImpactEntry[] = []
  const added: AssetRequirement[] = []
  const removed: AssetRequirement[] = []
  const replaced: VisualRequirementReplacement[] = []
  const bindings: VisualBindingChange[] = []
  const generationRequired: AssetRequirement[] = []

  const appendUnchangedOrRebind = (beforeGroup: RequirementGroup, afterGroup: RequirementGroup, beforeIndex: number, afterIndex: number): void => {
    usedBefore.add(beforeIndex)
    usedAfter.add(afterIndex)
    if (sameMembers(beforeGroup, afterGroup) && sameJson(beforeGroup.requirements, afterGroup.requirements)) {
      entries.push(freezeObject({ action: 'UNCHANGED', before: snapshot(beforeGroup), after: snapshot(afterGroup), generationRequired: false, orphaned: false }))
      return
    }
    if (sameMembers(beforeGroup, afterGroup)) {
      const action = sameArchetype(beforeGroup, afterGroup) ? 'REGENERATE' as const : 'REPLACE' as const
      const requiresGeneration = afterGroup.eligibleForGeneration
      entries.push(freezeObject({ action, before: snapshot(beforeGroup), after: snapshot(afterGroup), generationRequired: requiresGeneration, orphaned: false }))
      replaced.push(freezeObject({ before: beforeGroup.canonical, after: afterGroup.canonical, action, generationRequired: requiresGeneration }))
      if (requiresGeneration) generationRequired.push(afterGroup.canonical)
      return
    }
    const changes = bindingChanges(beforeGroup, afterGroup)
    bindings.push(...changes)
    entries.push(freezeObject({ action: 'REBIND', before: snapshot(beforeGroup), after: snapshot(afterGroup), generationRequired: false, orphaned: false }))
  }

  for (let beforeIndex = 0; beforeIndex < beforeGroups.length; beforeIndex += 1) {
    const beforeGroup = beforeGroups[beforeIndex]
    const afterIndex = afterGroups.findIndex((group, index) => !usedAfter.has(index) && group.identity === beforeGroup.identity)
    if (afterIndex >= 0) appendUnchangedOrRebind(beforeGroup, afterGroups[afterIndex]!, beforeIndex, afterIndex)
  }

  for (let beforeIndex = 0; beforeIndex < beforeGroups.length; beforeIndex += 1) {
    if (usedBefore.has(beforeIndex)) continue
    const beforeGroup = beforeGroups[beforeIndex]
    const afterIndex = afterGroups.findIndex((group, index) => !usedAfter.has(index) && canPair(beforeGroup, group))
    if (afterIndex < 0) continue
    const afterGroup = afterGroups[afterIndex]!
    usedBefore.add(beforeIndex)
    usedAfter.add(afterIndex)
    const action = sameArchetype(beforeGroup, afterGroup) ? 'REGENERATE' as const : 'REPLACE' as const
    const requiresGeneration = afterGroup.eligibleForGeneration
    entries.push(freezeObject({ action, before: snapshot(beforeGroup), after: snapshot(afterGroup), generationRequired: requiresGeneration, orphaned: false }))
    replaced.push(freezeObject({ before: beforeGroup.canonical, after: afterGroup.canonical, action, generationRequired: requiresGeneration }))
    if (requiresGeneration) generationRequired.push(afterGroup.canonical)
  }

  for (let beforeIndex = 0; beforeIndex < beforeGroups.length; beforeIndex += 1) {
    if (usedBefore.has(beforeIndex)) continue
    const group = beforeGroups[beforeIndex]
    usedBefore.add(beforeIndex)
    removed.push(group.canonical)
    entries.push(freezeObject({ action: 'REMOVE', before: snapshot(group), generationRequired: false, orphaned: true }))
  }

  for (let afterIndex = 0; afterIndex < afterGroups.length; afterIndex += 1) {
    if (usedAfter.has(afterIndex)) continue
    const group = afterGroups[afterIndex]
    usedAfter.add(afterIndex)
    const requiresGeneration = group.eligibleForGeneration
    added.push(group.canonical)
    entries.push(freezeObject({ action: 'ADD', after: snapshot(group), generationRequired: requiresGeneration, orphaned: false }))
    if (requiresGeneration) generationRequired.push(group.canonical)
  }

  const affectedEntries = entries.filter(entry => entry.action !== 'UNCHANGED')
  // REBIND changes entity membership only. The canonical visual asset and
  // its archetype remain reusable, so they belong to the unaffected set.
  const unaffectedEntries = entries.filter(entry => entry.action === 'UNCHANGED' || entry.action === 'REBIND')
  const orphanedAssetIds = affectedEntries.flatMap(entry => entry.action === 'REMOVE' && entry.before ? [entry.before.assetIds[0]] : [])
  const unaffectedAssetIds = unaffectedEntries.flatMap(entry => entry.after?.assetIds ?? [])
  const unaffectedArchetypes = unaffectedEntries.flatMap(entry => entry.after?.visualArchetype ? [entry.after.visualArchetype] : [])
  const noImpact = generationRequired.length === 0
  const impact: AssetImpactPlan = freezeObject({
    status: noImpact ? 'no_visual_impact' : 'planned',
    entries: freezeArray(entries),
    generationRequired: freezeArray(generationRequired),
    orphanedAssetIds: freezeArray(orphanedAssetIds),
    unaffectedAssetIds: unique(unaffectedAssetIds),
    unaffectedArchetypes: unique(unaffectedArchetypes),
    ...(noImpact ? { noImpactReason: affectedEntries.length ? 'Visual changes are binding-only or static-only; no generation is required' : 'No visual specification or asset requirement changed' } : {}),
  })
  const oldArchetypes = freezeArray(affectedEntries.flatMap(entry => entry.before ? [entry.before] : []))
  const newArchetypes = freezeArray(affectedEntries.flatMap(entry => entry.after ? [entry.after] : []))
  return {
    impact,
    oldArchetypes,
    newArchetypes,
    added: freezeArray(added),
    removed: freezeArray(removed),
    replaced: freezeArray(replaced),
    bindings: freezeArray(bindings),
  }
}

function failedPlan(
  reason: VisualEvolutionFailureReason,
  mutation: SemanticWorldMutationResult,
  runtimeEvolution: RuntimeEvolutionResult,
  visualRevision: number,
  visualDesign: VisualDesignSpecification,
  assetSpecification: AssetSpecification,
): VisualEvolutionPlan {
  const failedImpact = freezeObject({ ...EMPTY_IMPACT, status: 'failed' as const, noImpactReason: undefined })
  return freezeObject({
    status: 'failed',
    operationId: mutation.operationId,
    worldId: mutation.worldId,
    semanticRevision: mutation.updatedRevision,
    runtimeRevision: runtimeEvolution.updatedRevision,
    previousVisualRevision: visualRevision,
    updatedVisualRevision: visualRevision,
    affectedEntityIds: freezeArray([]),
    oldArchetypes: freezeArray([]),
    newArchetypes: freezeArray([]),
    addedVisualRequirements: freezeArray([]),
    removedVisualRequirements: freezeArray([]),
    replacedVisualRequirements: freezeArray([]),
    bindingOnlyChanges: freezeArray([]),
    worldLevelVisualImpact: freezeArray([]),
    unaffectedAssetIds: freezeArray([]),
    unaffectedArchetypes: freezeArray([]),
    generationRequired: freezeArray([]),
    previousVisualDesign: visualDesign,
    updatedVisualDesign: visualDesign,
    previousAssetSpecification: assetSpecification,
    updatedAssetSpecification: assetSpecification,
    assetImpactPlan: failedImpact,
    failureReason: reason,
  })
}

function alreadyPlannedPlan(
  mutation: SemanticWorldMutationResult,
  runtimeEvolution: RuntimeEvolutionResult,
  visualRevision: number,
  visualDesign: VisualDesignSpecification,
  assetSpecification: AssetSpecification,
): VisualEvolutionPlan {
  return freezeObject({
    status: 'already_planned',
    operationId: mutation.operationId,
    worldId: mutation.worldId,
    semanticRevision: mutation.updatedRevision,
    runtimeRevision: runtimeEvolution.updatedRevision,
    previousVisualRevision: visualRevision,
    updatedVisualRevision: visualRevision,
    affectedEntityIds: freezeArray([]),
    oldArchetypes: freezeArray([]),
    newArchetypes: freezeArray([]),
    addedVisualRequirements: freezeArray([]),
    removedVisualRequirements: freezeArray([]),
    replacedVisualRequirements: freezeArray([]),
    bindingOnlyChanges: freezeArray([]),
    worldLevelVisualImpact: freezeArray([]),
    unaffectedAssetIds: freezeArray([]),
    unaffectedArchetypes: freezeArray([]),
    generationRequired: freezeArray([]),
    noVisualImpactReason: 'Visual delta for this operation was already planned',
    previousVisualDesign: visualDesign,
    updatedVisualDesign: visualDesign,
    previousAssetSpecification: assetSpecification,
    updatedAssetSpecification: assetSpecification,
    assetImpactPlan: EMPTY_IMPACT,
  })
}

export class DefaultVisualEvolutionPlanner implements VisualEvolutionPlannerContract {
  plan(
    beforeSemanticWorld: GameWorldModel,
    afterSemanticWorld: GameWorldModel,
    semanticMutation: SemanticWorldMutationResult,
    runtimeEvolution: RuntimeEvolutionResult,
    currentVisualDesign: VisualDesignSpecification,
    currentAssetSpecification: AssetSpecification,
    options: VisualEvolutionPlanningOptions = {},
  ): VisualEvolutionPlan {
    const previousVisualRevision = options.visualRevision ?? 0
    if (!currentVisualDesign || !Array.isArray(currentVisualDesign.entities)
      || !currentAssetSpecification || !Array.isArray(currentAssetSpecification.assets)) {
      return failedPlan('visual_state_missing', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (semanticMutation.status !== 'applied' || !semanticMutation.operationId) {
      return failedPlan('invalid_mutation', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (!['synchronized', 'no_runtime_impact', 'already_applied'].includes(runtimeEvolution.status)) {
      return failedPlan('invalid_runtime_evolution', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (runtimeEvolution.operationId !== semanticMutation.operationId) {
      return failedPlan('invalid_runtime_evolution', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (options.worldId !== undefined && options.worldId !== semanticMutation.worldId) {
      return failedPlan('world_mismatch', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (options.semanticRevision !== undefined && options.semanticRevision !== semanticMutation.previousRevision) {
      return failedPlan('stale_revision', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (options.runtimeRevision !== undefined && options.runtimeRevision !== runtimeEvolution.previousRevision) {
      return failedPlan('stale_revision', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (runtimeEvolution.worldId !== semanticMutation.worldId || runtimeEvolution.updatedRevision !== semanticMutation.updatedRevision) {
      return failedPlan('stale_revision', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (options.lastPlannedOperationId === semanticMutation.operationId) {
      return alreadyPlannedPlan(semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (new Set(beforeSemanticWorld.entities.map(entity => entity.id)).size !== beforeSemanticWorld.entities.length
      || new Set(afterSemanticWorld.entities.map(entity => entity.id)).size !== afterSemanticWorld.entities.length) {
      return failedPlan('duplicate_entity_id', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    if (!sameJson(beforeSemanticWorld, semanticMutation.previousWorld)
      || !sameJson(afterSemanticWorld, semanticMutation.updatedWorld)) {
      return failedPlan('stale_revision', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    const beforeEntityIds = new Set(beforeSemanticWorld.entities.map(entity => entity.id))
    const visualEntityIds = new Set(currentVisualDesign.entities.map(entity => entity.entityId))
    const assetIds = new Set<string>()
    if (visualEntityIds.size !== currentVisualDesign.entities.length) {
      return failedPlan('visual_state_missing', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    for (const entity of currentVisualDesign.entities) {
      if (!beforeEntityIds.has(entity.entityId)) {
        return failedPlan('entity_not_found', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
      }
    }
    if (visualEntityIds.size !== beforeEntityIds.size
      || [...beforeEntityIds].some(entityId => !visualEntityIds.has(entityId))) {
      return failedPlan('visual_state_missing', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
    }
    for (const asset of currentAssetSpecification.assets) {
      if (assetIds.has(asset.id)) {
        return failedPlan('visual_state_missing', semanticMutation, runtimeEvolution, previousVisualRevision, currentVisualDesign, currentAssetSpecification)
      }
      assetIds.add(asset.id)
    }

    const { design, worldImpact } = buildVisualDesign(currentVisualDesign, afterSemanticWorld, semanticMutation)
    const updatedAssetSpecification = buildTargetedAssetSpecification(currentAssetSpecification, design)
    const assetAnalysis = buildAssetImpact(currentAssetSpecification, updatedAssetSpecification)
    const impactWithIds = worldImpact.map(impact => freezeObject({
      ...impact,
      affectedAssetIds: impact.affectedAssetIds.length
        ? impact.affectedAssetIds
        : freezeArray(updatedAssetSpecification.assets
          .filter(asset => impact.affectedAssetKinds.includes(asset.kind))
          .map(asset => asset.id)),
    }))
    const generationRequired = assetAnalysis.impact.generationRequired
    const status = assetAnalysis.impact.status === 'no_visual_impact' ? 'no_visual_impact' as const : 'planned' as const
    return freezeObject({
      status,
      operationId: semanticMutation.operationId,
      worldId: semanticMutation.worldId,
      semanticRevision: semanticMutation.updatedRevision,
      runtimeRevision: runtimeEvolution.updatedRevision,
      previousVisualRevision,
      updatedVisualRevision: previousVisualRevision + 1,
      affectedEntityIds: unique(semanticMutation.affectedEntityIds),
      oldArchetypes: assetAnalysis.oldArchetypes,
      newArchetypes: assetAnalysis.newArchetypes,
      addedVisualRequirements: assetAnalysis.added,
      removedVisualRequirements: assetAnalysis.removed,
      replacedVisualRequirements: assetAnalysis.replaced,
      bindingOnlyChanges: assetAnalysis.bindings,
      worldLevelVisualImpact: freezeArray(impactWithIds),
      unaffectedAssetIds: assetAnalysis.impact.unaffectedAssetIds,
      unaffectedArchetypes: assetAnalysis.impact.unaffectedArchetypes,
      generationRequired,
      ...(assetAnalysis.impact.noImpactReason ? { noVisualImpactReason: assetAnalysis.impact.noImpactReason } : {}),
      previousVisualDesign: currentVisualDesign,
      updatedVisualDesign: design,
      previousAssetSpecification: currentAssetSpecification,
      updatedAssetSpecification,
      assetImpactPlan: freezeObject({
        ...assetAnalysis.impact,
        entries: freezeArray(assetAnalysis.impact.entries),
      }),
    })
  }
}

export const VisualEvolutionPlanner = DefaultVisualEvolutionPlanner
