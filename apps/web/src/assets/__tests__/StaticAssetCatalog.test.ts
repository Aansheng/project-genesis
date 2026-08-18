import { describe, expect, it } from 'vitest'
import type { AssetRequirement } from '@genesis/shared'
import { createStaticAssetResolutions, resolveStaticAsset } from '../StaticAssetCatalog'

function requirement(overrides: Partial<AssetRequirement>): AssetRequirement {
  return {
    id: 'asset-1',
    kind: 'character',
    target: 'entity',
    entityId: 'entity-1',
    subject: 'fixture',
    visualRole: 'unsupported role',
    requiredStates: [],
    technicalProfile: { transparentBackground: true, view: 'side' },
    ...overrides,
  }
}

describe('StaticAssetCatalog', () => {
  it.each([
    ['player character', 'player.png'],
    ['enemy creature', 'enemy.png'],
    ['boss character', 'boss.png'],
  ])('maps %s to a repository fixture', (visualRole, file) => {
    expect(resolveStaticAsset(requirement({ visualRole }))).toBe(`/assets/genesis/${file}`)
  })

  it('maps checkpoint props and leaves unsupported requirements unresolved', () => {
    expect(resolveStaticAsset(requirement({ kind: 'prop', visualRole: 'checkpoint marker' }))).toBe('/assets/genesis/checkpoint.png')
    expect(resolveStaticAsset(requirement({ entityId: 'checkpoint', kind: 'icon', visualRole: 'collectible item' }))).toBe('/assets/genesis/checkpoint.png')
    expect(resolveStaticAsset(requirement({ kind: 'terrain', target: 'environment' }))).toBeUndefined()
  })

  it('creates static-origin resolutions only for mapped requirements', () => {
    const resolutions = createStaticAssetResolutions([
      requirement({ id: 'player', visualRole: 'player character' }),
      requirement({ id: 'unknown' }),
    ])
    expect(resolutions).toEqual({ player: { origin: 'static', resource: { uri: '/assets/genesis/player.png' } } })
  })
})
