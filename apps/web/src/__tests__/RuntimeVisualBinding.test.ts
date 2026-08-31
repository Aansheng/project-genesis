import { describe, expect, it } from 'vitest'
import type { AssetManifest, AssetSpecification, GameWorldModel, World } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import { synchronizeRuntimeVisualBindings } from '../assets/RuntimeVisualBinding'

describe('Runtime visual binding projection', () => {
  it('reuses one resolved canonical Enemy resource for an ephemeral Runtime entity', () => {
    const semanticWorld: GameWorldModel = Object.freeze({
      worldType: 'survival',
      entities: Object.freeze([
        Object.freeze({ id: 'survivor', category: 'player', name: 'Survivor' }),
        Object.freeze({ id: 'infected', category: 'enemy', name: 'Infected' }),
      ]),
    })
    const specification: AssetSpecification = Object.freeze({
      visualContext: Object.freeze({
        artDirection: 'stylized-2d',
        theme: Object.freeze({ sourceTheme: 'survival', visualTheme: 'survival' }),
        palette: Object.freeze({ temperature: 'cool', contrast: 'high', mood: 'dark' }),
      }),
      assets: Object.freeze([Object.freeze({
        id: 'entity-infected-primary',
        kind: 'character',
        target: 'entity',
        subject: 'infected',
        entityId: 'infected',
        requiredStates: Object.freeze([]),
        technicalProfile: Object.freeze({ transparentBackground: true, view: 'top' }),
      })]),
    })
    const manifest: AssetManifest = Object.freeze({ entries: Object.freeze([Object.freeze({
      assetId: 'entity-infected-primary',
      kind: 'character',
      target: 'entity',
      entityId: 'infected',
      status: 'resolved',
      origin: 'generated',
      resource: Object.freeze({ uri: 'data:image/png;base64,enemy' }),
    })]) })
    const runtimeWorld = Object.freeze({ entities: Object.freeze([
      Object.freeze({ id: 'survivor', type: 'player', x: 0, y: 0, components: Object.freeze([createPositionComponent(80, 400)]) }),
      Object.freeze({
        id: 'infected-runtime-42',
        type: 'enemy',
        x: 0,
        y: 0,
        components: Object.freeze([
          Object.freeze({ type: 'semantic', properties: Object.freeze({ category: 'enemy', name: 'Infected' }) }),
          createPositionComponent(120, 400),
        ]),
      }),
    ]) }) as unknown as World

    const result = synchronizeRuntimeVisualBindings({ manifest, specification, semanticWorld, runtimeWorld })
    const binding = result.entries.find(entry => entry.entityId === 'infected-runtime-42')

    expect(binding).toMatchObject({
      kind: 'character',
      target: 'entity',
      status: 'resolved',
      origin: 'generated',
      resource: { uri: 'data:image/png;base64,enemy' },
    })
    expect(binding?.assetId).toContain('runtime-binding-infected-runtime-42-')
    expect(result.entries).toHaveLength(2)
    expect(synchronizeRuntimeVisualBindings({ manifest: result, specification, semanticWorld, runtimeWorld })).toBe(result)
  })
})
