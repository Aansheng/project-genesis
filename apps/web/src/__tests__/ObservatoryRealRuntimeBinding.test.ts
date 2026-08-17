import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { useObservatoryDataStore } from '../stores/observatoryData'
import { ObservatoryRuntimeBinding } from '../adapters/observatory'
import { DefaultRuntimeWorldStore } from '@genesis/runtime'
import type { World } from '@genesis/shared'

describe('WO-S10-011: Observatory real runtime binding', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('binds generated MarioWorld runtime data without mock entities', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建 MarioWorld')
    new ObservatoryRuntimeBinding(game.worldStore, observatory).sync()

    const runtime = observatory.viewModel.runtimeView
    expect(runtime.entityCount).toBe(6)
    expect(runtime.entities.map((entity) => entity.id)).toEqual([
      'player', 'terrain', 'platform', 'enemy', 'goal', 'checkpoint',
    ])
    expect(runtime.entities.map((entity) => entity.type)).toEqual([
      'player', 'terrain', 'terrain', 'enemy', 'item', 'item',
    ])
    expect(runtime.entities[0].position).toBe('{"x":80,"y":300}')
    expect(runtime.entities.some((entity) => entity.id === 'guard-001')).toBe(false)
    expect(Object.isFrozen(runtime.entities)).toBe(true)
  })

  it('replaces runtime data and reflects updated positions on repeated sync', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    const binding = new ObservatoryRuntimeBinding(game.worldStore, observatory)
    await game.send('创建 MarioWorld')
    binding.sync()
    const player = game.worldStore.getWorld().entities.find((entity) => entity.id === 'player')!
    const moved = Object.freeze({
      entities: Object.freeze(player ? [Object.freeze({ ...player, components: Object.freeze([{ type: 'position', properties: { x: 123, y: 321 } }]) })] : []),
    }) as unknown as World
    game.worldStore.setWorld(moved)
    binding.sync()
    expect(observatory.viewModel.runtimeView.entityCount).toBe(1)
    expect(observatory.viewModel.runtimeView.entities[0].position).toBe('{"x":123,"y":321}')
  })

  it('keeps mock hydration explicit and does not use it during real binding', () => {
    const observatory = useObservatoryDataStore()
    observatory.loadMockObservatory()
    expect(observatory.viewModel.runtimeView.entities[0].id).toBe('guard-001')
    const emptyStore = new DefaultRuntimeWorldStore()
    new ObservatoryRuntimeBinding(emptyStore, observatory).sync()
    expect(observatory.viewModel.runtimeView.entityCount).toBe(0)
    expect(observatory.viewModel.runtimeView.entities).toHaveLength(0)
  })
})
