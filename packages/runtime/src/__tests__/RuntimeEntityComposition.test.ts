import { describe, expect, it } from 'vitest'
import {
  createCollisionBoundsComponent,
  createPositionComponent,
  isPositionComponent,
  type Entity,
  type World,
} from '@genesis/shared'
import {
  DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE,
  findRuntimeEntityPositionWithMinimumSeparation,
} from '../index'

function entity(
  id: string,
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([
      createPositionComponent(x, y),
      createCollisionBoundsComponent(width, height),
    ]),
  }) as unknown as Entity
}

function world(entities: readonly Entity[]): World {
  return Object.freeze({ entities: Object.freeze([...entities]) }) as unknown as World
}

function overlaps(
  first: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  second: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): boolean {
  return first.x - first.width / 2 < second.x + second.width / 2
    && first.x + first.width / 2 > second.x - second.width / 2
    && first.y - first.height / 2 < second.y + second.height / 2
    && first.y + first.height / 2 > second.y - second.height / 2
}

describe('Runtime entity minimum-separation placement', () => {
  it('uses current protected Runtime position and deterministic ordering', () => {
    const initial = world([entity('player', 'player', 80, 300, 32, 48)])
    const first = findRuntimeEntityPositionWithMinimumSeparation(
      initial.entities,
      'enemy-runtime-1',
      'enemy',
      { protectedEntityIds: ['player'] },
    )!
    const repeated = findRuntimeEntityPositionWithMinimumSeparation(
      initial.entities,
      'enemy-runtime-1',
      'enemy',
      { protectedEntityIds: ['player'] },
    )!

    expect(first).toEqual(repeated)
    expect(Math.hypot(first.x - 80, first.y - 300))
      .toBeGreaterThanOrEqual(DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE)
    expect(overlaps(
      { ...first, width: 32, height: 32 },
      { x: 80, y: 300, width: 32, height: 48 },
    )).toBe(false)

    const moved = world([entity('player', 'player', 400, 240, 32, 48)])
    const movedPosition = findRuntimeEntityPositionWithMinimumSeparation(
      moved.entities,
      'enemy-runtime-1',
      'enemy',
      { protectedEntityIds: ['player'] },
    )!

    expect(movedPosition).not.toEqual(first)
    expect(Math.hypot(movedPosition.x - 400, movedPosition.y - 240))
      .toBeGreaterThanOrEqual(DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE)
    expect(overlaps(
      { ...movedPosition, width: 32, height: 32 },
      { x: 400, y: 240, width: 32, height: 48 },
    )).toBe(false)
  })

  it('skips occupied fair-start candidates and stays bounded', () => {
    const player = entity('player', 'player', 80, 300, 32, 48)
    const directions = [
      entity('occupied-right', 'item', 176, 300, 24, 24),
      entity('occupied-down', 'item', 80, 396, 24, 24),
      entity('occupied-left', 'item', -16, 300, 24, 24),
      entity('occupied-up', 'item', 80, 204, 24, 24),
    ]
    const result = findRuntimeEntityPositionWithMinimumSeparation(
      world([player, ...directions]).entities,
      'enemy-runtime-2',
      'enemy',
      { protectedEntityIds: ['player'] },
    )

    expect(result).toBeDefined()
    expect(directions.some(item => {
      const position = item.components?.find(isPositionComponent)?.properties
      return position?.x === result?.x && position?.y === result?.y
    })).toBe(false)
    expect(Math.hypot(result!.x - 80, result!.y - 300))
      .toBeGreaterThanOrEqual(DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE)
  })

  it('fails closed when the protected Runtime reference is unavailable', () => {
    const missing = findRuntimeEntityPositionWithMinimumSeparation(
      world([entity('enemy', 'enemy', 120, 400, 32, 32)]).entities,
      'enemy-runtime-3',
      'enemy',
      { protectedEntityIds: ['player'] },
    )
    const unpositioned = Object.freeze({
      id: 'player',
      type: 'player',
      x: 0,
      y: 0,
      components: Object.freeze([]),
    }) as unknown as Entity
    const noPosition = findRuntimeEntityPositionWithMinimumSeparation(
      world([unpositioned]).entities,
      'enemy-runtime-4',
      'enemy',
      { protectedEntityIds: ['player'] },
    )

    expect(missing).toBeUndefined()
    expect(noPosition).toBeUndefined()
  })
})
