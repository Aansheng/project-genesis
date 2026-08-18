import type { AssetRequirement, AssetResolutionInput } from '@genesis/shared'

const STATIC_ASSET_ROOT = '/assets/genesis'

/** Maps semantic asset requirements to repository-owned static fixtures. */
export function resolveStaticAsset(requirement: AssetRequirement): string | undefined {
  if (requirement.kind === 'character' && requirement.visualRole === 'player character') return `${STATIC_ASSET_ROOT}/player.png`
  if (requirement.kind === 'character' && requirement.visualRole === 'enemy creature') return `${STATIC_ASSET_ROOT}/enemy.png`
  if (requirement.kind === 'character' && requirement.visualRole === 'boss character') return `${STATIC_ASSET_ROOT}/boss.png`
  if (requirement.kind === 'prop' && requirement.visualRole === 'checkpoint marker') return `${STATIC_ASSET_ROOT}/checkpoint.png`
  if (requirement.entityId === 'boss' && requirement.kind === 'character') return `${STATIC_ASSET_ROOT}/boss.png`
  if (requirement.entityId === 'checkpoint' && requirement.target === 'entity') return `${STATIC_ASSET_ROOT}/checkpoint.png`
  return undefined
}

export function createStaticAssetResolutions(
  requirements: readonly AssetRequirement[],
): Readonly<Record<string, AssetResolutionInput>> {
  const resolutions: Record<string, AssetResolutionInput> = {}
  for (const requirement of requirements) {
    const uri = resolveStaticAsset(requirement)
    if (uri) resolutions[requirement.id] = { origin: 'static', resource: { uri } }
  }
  return Object.freeze(resolutions)
}
