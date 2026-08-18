import { describe, expect, it } from 'vitest'
import type { AssetSpecification } from '../asset-specification'
import { DefaultAssetManifestBuilder } from '../asset-manifest'

const specification: AssetSpecification = {
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'snow', visualTheme: 'snow-and-ice' },
    palette: { temperature: 'cool', contrast: 'standard', mood: 'bright' },
  },
  assets: [
    { id: 'entity-player-primary', kind: 'character', target: 'entity', entityId: 'player', requiredStates: ['idle'], technicalProfile: { transparentBackground: true, view: 'side' }, subject: 'player' },
    { id: 'entity-enemy-primary', kind: 'character', target: 'entity', entityId: 'enemy-1', requiredStates: ['idle'], technicalProfile: { transparentBackground: true, view: 'side' }, subject: 'enemy' },
    { id: 'terrain-main', kind: 'terrain', target: 'environment', requiredStates: [], technicalProfile: { transparentBackground: false, view: 'side' }, subject: 'ice platforms' },
    { id: 'background-main', kind: 'background', target: 'environment', requiredStates: [], technicalProfile: { transparentBackground: false, view: 'side' }, subject: 'snow mountains' },
    { id: 'checkpoint-primary', kind: 'prop', target: 'entity', entityId: 'checkpoint-1', requiredStates: [], technicalProfile: { transparentBackground: true, view: 'side' }, subject: 'checkpoint' },
  ],
}

describe('DefaultAssetManifestBuilder', () => {
  it('represents every requirement as unresolved by default', () => {
    const manifest = new DefaultAssetManifestBuilder().build(specification)

    expect(manifest.entries).toHaveLength(specification.assets.length)
    expect(manifest.entries.every(entry => entry.status === 'unresolved')).toBe(true)
    expect(manifest.entries.every(entry => entry.resource === undefined)).toBe(true)
  })

  it('preserves canonical IDs, kinds, and entity bindings', () => {
    const entries = new DefaultAssetManifestBuilder().build(specification).entries

    expect(entries.map(entry => entry.assetId)).toEqual(specification.assets.map(asset => asset.id))
    expect(entries.map(entry => entry.kind)).toEqual(['character', 'character', 'terrain', 'background', 'prop'])
    expect(entries[1].entityId).toBe('enemy-1')
  })

  it('supports partial static resolution with metadata and origin', () => {
    const manifest = new DefaultAssetManifestBuilder().build(specification, {
      'entity-player-primary': {
        status: 'resolved',
        origin: 'static',
        resource: { uri: '/assets/player.png' },
        metadata: { mimeType: 'image/png', width: 64, height: 64 },
      },
      'terrain-main': {
        status: 'resolved',
        origin: 'generated',
        resource: { uri: 'asset://generated/terrain-main' },
      },
    })

    expect(manifest.entries[0]).toMatchObject({
      assetId: 'entity-player-primary',
      status: 'resolved',
      origin: 'static',
      resource: { uri: '/assets/player.png' },
      metadata: { mimeType: 'image/png', width: 64, height: 64 },
    })
    expect(manifest.entries[1].status).toBe('unresolved')
    expect(manifest.entries[2]).toMatchObject({ status: 'resolved', origin: 'generated' })
  })

  it('supports failed resolution without pretending a resource exists', () => {
    const manifest = new DefaultAssetManifestBuilder().build(specification, {
      'entity-enemy-primary': { status: 'failed', origin: 'fallback' },
    })

    expect(manifest.entries[1]).toMatchObject({ status: 'failed', origin: 'fallback' })
    expect(manifest.entries[1].resource).toBeUndefined()
  })

  it('rejects invalid resolution results and unknown IDs', () => {
    const builder = new DefaultAssetManifestBuilder()

    expect(() => builder.build(specification, {
      'entity-player-primary': { status: 'resolved' },
    })).toThrow('requires a non-empty resource URI')
    expect(() => builder.build(specification, {
      'unknown-asset': { status: 'resolved', resource: { uri: 'asset://unknown' } },
    })).toThrow('unknown asset')
    expect(() => builder.build(specification, {
      'entity-player-primary': { status: 'failed', resource: { uri: 'asset://invalid' } },
    })).toThrow('cannot contain a resource URI')
  })

  it('deeply freezes the manifest snapshot', () => {
    const manifest = new DefaultAssetManifestBuilder().build(specification, {
      'entity-player-primary': { status: 'resolved', resource: { uri: '/assets/player.png' }, metadata: { width: 64 } },
    })

    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.entries)).toBe(true)
    expect(Object.isFrozen(manifest.entries[0])).toBe(true)
    expect(Object.isFrozen(manifest.entries[0].resource)).toBe(true)
    expect(Object.isFrozen(manifest.entries[0].metadata)).toBe(true)
  })

  it('is deterministic for the same specification and resolution mapping', () => {
    const resolutions = { 'entity-player-primary': { status: 'resolved' as const, resource: { uri: '/assets/player.png' } } }
    const builder = new DefaultAssetManifestBuilder()

    expect(builder.build(specification, resolutions)).toEqual(builder.build(specification, resolutions))
  })
})
