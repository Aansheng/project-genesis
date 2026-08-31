import type {
  AssetManifest,
  AssetManifestEntry,
  AssetSpecification,
  Entity,
  EntityCategory,
  GameWorldModel,
  World,
} from '@genesis/shared'

const RUNTIME_BINDING_PREFIX = 'runtime-binding-'

function runtimeCategory(entity: Entity): EntityCategory | undefined {
  const value = entity.components?.find(component => component.type === 'semantic')?.properties.category
  return typeof value === 'string' ? value as EntityCategory : undefined
}

function bindingId(entityId: string, sourceAssetId: string): string {
  return `${RUNTIME_BINDING_PREFIX}${entityId}-${sourceAssetId}`
}

function inheritedEntry(
  entityId: string,
  source: AssetManifestEntry,
): AssetManifestEntry {
  return Object.freeze({
    ...source,
    assetId: bindingId(entityId, source.assetId),
    entityId,
    ...(source.resource ? { resource: Object.freeze({ ...source.resource }) } : {}),
    ...(source.metadata ? { metadata: Object.freeze({ ...source.metadata }) } : {}),
  })
}

/**
 * Project canonical semantic artwork onto ephemeral Runtime entities.
 * The returned entries are binding-only copies; no asset request is created.
 */
export function synchronizeRuntimeVisualBindings(input: {
  readonly manifest: AssetManifest
  readonly specification: AssetSpecification
  readonly semanticWorld: GameWorldModel
  readonly runtimeWorld: World
}): AssetManifest {
  const semanticIds = new Set(input.semanticWorld.entities.map(entity => entity.id))
  const retained = input.manifest.entries.filter(entry => !entry.assetId.startsWith(RUNTIME_BINDING_PREFIX))
  const entriesById = new Map(retained.map(entry => [entry.assetId, entry]))
  const runtimeEntries: AssetManifestEntry[] = []

  for (const runtimeEntity of input.runtimeWorld.entities) {
    if (semanticIds.has(runtimeEntity.id)) continue
    const category = runtimeCategory(runtimeEntity)
    const sourceEntity = category
      ? input.semanticWorld.entities.find(entity => entity.category === category)
      : undefined
    if (!sourceEntity) continue
    const sourceRequirements = input.specification.assets.filter(requirement =>
      requirement.target === 'entity' && requirement.entityId === sourceEntity.id,
    )
    for (const requirement of sourceRequirements) {
      const sourceEntry = entriesById.get(requirement.id)
      if (sourceEntry) runtimeEntries.push(inheritedEntry(runtimeEntity.id, sourceEntry))
    }
  }

  const nextEntries = Object.freeze([...retained, ...runtimeEntries])
  const unchanged = nextEntries.length === input.manifest.entries.length
    && nextEntries.every((entry, index) => {
      const current = input.manifest.entries[index]
      return current !== undefined
        && entry.assetId === current.assetId
        && entry.entityId === current.entityId
        && entry.status === current.status
        && entry.resource?.uri === current.resource?.uri
    })
  return unchanged ? input.manifest : Object.freeze({ entries: nextEntries })
}
