import type {
  AssetManifest,
  AssetManifestBuilder,
  AssetManifestEntry,
  AssetResolutionInput,
} from './AssetManifest'
import type { AssetSpecification } from '../asset-specification'

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

function validateResolution(assetId: string, input: AssetResolutionInput): void {
  const status = input.status ?? (input.resource ? 'resolved' : 'failed')
  if (status === 'resolved' && !input.resource?.uri.trim()) {
    throw new Error(`Resolved asset "${assetId}" requires a non-empty resource URI`)
  }
  if (status === 'failed' && input.resource) {
    throw new Error(`Failed asset "${assetId}" cannot contain a resource URI`)
  }
}

function createEntry(
  requirement: AssetSpecification['assets'][number],
  input?: AssetResolutionInput,
): AssetManifestEntry {
  if (!input) {
    return freeze({
      assetId: requirement.id,
      kind: requirement.kind,
      target: requirement.target,
      ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
      ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
      status: 'unresolved' as const,
    })
  }

  validateResolution(requirement.id, input)
  const status = input.status ?? (input.resource ? 'resolved' : 'failed')
  return freeze({
    assetId: requirement.id,
    kind: requirement.kind,
    target: requirement.target,
    ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
    ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
    status,
    ...(input.origin ? { origin: input.origin } : {}),
    ...(input.resource ? { resource: freeze({ uri: input.resource.uri }) } : {}),
    ...(input.metadata ? { metadata: freeze({ ...input.metadata }) } : {}),
  })
}

export class DefaultAssetManifestBuilder implements AssetManifestBuilder {
  build(
    specification: AssetSpecification,
    resolutions: Readonly<Record<string, AssetResolutionInput>> = {},
  ): AssetManifest {
    const requirementIds = new Set(specification.assets.map(asset => asset.id))
    for (const assetId of Object.keys(resolutions)) {
      if (!requirementIds.has(assetId)) {
        throw new Error(`Resolution provided for unknown asset "${assetId}"`)
      }
    }

    const entries = specification.assets.map(requirement =>
      createEntry(requirement, resolutions[requirement.id]),
    )
    return freeze({ entries: Object.freeze(entries) })
  }
}
