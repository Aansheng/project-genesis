/**
 * RuntimeExecutionLoop — verifies the RuntimeExecutionLoop interface,
 * DefaultRuntimeExecutionLoop implementation, and ExecutionTickResult type.
 *
 * WO-S8-009 — Runtime Execution Loop Foundation
 * Architecture version v1.68
 *
 * Coverage:
 * - empty registry (tick, tickWithResult, metadata)
 * - single system (NoOp, custom, identity)
 * - multiple systems (two, three, chain)
 * - execution order (registration order preserved, marker chain)
 * - world propagation (output of system1 is input to system2)
 * - immutability (frozen output, no input mutation)
 * - determinism (same input, same systems, same output)
 * - large system collections (100, 1000 systems)
 * - NoOp systems (identity through loop)
 * - mixed systems (NoOp + marker combinations)
 * - result metadata (executedSystems names, systemCount)
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import type { RuntimeSystem, RuntimeSystemRegistry } from '../system'
import type { RuntimeExecutionLoop, ExecutionTickResult } from '../execution'
import { DefaultRuntimeSystemRegistry, NoOpRuntimeSystem } from '../system'
import { DefaultRuntimeExecutionLoop } from '../execution'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an empty World. */
function createEmptyWorld(): World {
  return Object.freeze({ entities: Object.freeze([]) }) as unknown as World
}

/** Create a populated World with count entities. */
function createPopulatedWorld(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) =>
    Object.freeze({
      id: `entity-${i}`,
      type: 'test',
      x: i,
      y: i * 2,
    }),
  )
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

/** Create a simple test system (identity). */
function createTestSystem(name: string): RuntimeSystem {
  return {
    name,
    update: (world: World): World => {
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World
    },
  }
}

/** Create a system that appends a marker entity. */
function createMarkerSystem(name: string, markerId?: string): RuntimeSystem {
  const id = markerId ?? `marker-${name}`
  return {
    name,
    update: (world: World): World => {
      const marker: Entity = Object.freeze({
        id,
        type: 'marker',
        x: 0,
        y: 0,
      })
      return Object.freeze({
        entities: Object.freeze([...world.entities, marker]),
      }) as unknown as World
    },
  }
}

/** Create a system that tracks its input entity count in an output marker. */
function createTrackingSystem(name: string): RuntimeSystem {
  return {
    name,
    update: (world: World): World => {
      const tracker: Entity = Object.freeze({
        id: `tracker-${name}`,
        type: 'tracker',
        x: world.entities.length,
        y: 0,
      })
      return Object.freeze({
        entities: Object.freeze([...world.entities, tracker]),
      }) as unknown as World
    },
  }
}

/** Create a collection of many systems. */
function createSystemCollection(count: number): RuntimeSystem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `system-${i}`,
    update: (world: World): World => {
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World
    },
  }))
}

// ---------------------------------------------------------------------------
// Section 1 — Empty Registry
// ---------------------------------------------------------------------------

describe('empty registry', () => {
  it('tick returns world unchanged', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
  })

  it('tick preserves entity data', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tick(world)
    for (let i = 0; i < 3; i++) {
      expect(result.entities[i].id).toBe(`entity-${i}`)
    }
  })

  it('tick returns new object reference', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tick(world)
    expect(result).not.toBe(world)
  })

  it('tickWithResult returns empty metadata', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toHaveLength(0)
    expect(result.systemCount).toBe(0)
  })

  it('tickWithResult returns world unchanged', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tickWithResult(world)
    expect(result.world.entities).toHaveLength(3)
  })

  it('tickWithResult executedSystems is frozen', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(Object.isFrozen(result.executedSystems)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Single System
// ---------------------------------------------------------------------------

describe('single system', () => {
  it('tick executes NoOp system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
  })

  it('tick executes custom system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('AddOne'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('marker-AddOne')
  })

  it('tickWithResult returns correct metadata for single system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual(['NoOp'])
    expect(result.systemCount).toBe(1)
  })

  it('tickWithResult world is the system output', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('AddOne'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.world.entities).toHaveLength(1)
    expect(result.world.entities[0].id).toBe('marker-AddOne')
  })

  it('tick with identity system preserves world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('Identity'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(5)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Multiple Systems
// ---------------------------------------------------------------------------

describe('multiple systems', () => {
  it('tick executes two systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('A'))
    registry.register(createMarkerSystem('B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(2)
  })

  it('tick executes three systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('X'))
    registry.register(createMarkerSystem('Y'))
    registry.register(createMarkerSystem('Z'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
  })

  it('tickWithResult returns all system names', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Alpha'))
    registry.register(createMarkerSystem('Beta'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual(['Alpha', 'Beta'])
    expect(result.systemCount).toBe(2)
  })

  it('tickWithResult systemCount matches count', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 5; i++) {
      registry.register(createTestSystem(`sys-${i}`))
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Execution Order
// ---------------------------------------------------------------------------

describe('execution order', () => {
  it('systems execute in registration order (marker chain)', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Alpha', 'marker-1'))
    registry.register(createMarkerSystem('Beta', 'marker-2'))
    registry.register(createMarkerSystem('Gamma', 'marker-3'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
    expect(result.entities[0].id).toBe('marker-1')
    expect(result.entities[1].id).toBe('marker-2')
    expect(result.entities[2].id).toBe('marker-3')
  })

  it('reordered registration changes execution order', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('First', 'marker-A'))
    registry.register(createMarkerSystem('Second', 'marker-B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities[0].id).toBe('marker-A')
    expect(result.entities[1].id).toBe('marker-B')
  })

  it('tickWithResult executedSystems preserves order', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('First'))
    registry.register(createTestSystem('Second'))
    registry.register(createTestSystem('Third'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual(['First', 'Second', 'Third'])
  })

  it('overwriting system changes executed system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Dupe', 'original'))
    registry.register(createMarkerSystem('Dupe', 'overwritten'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    // Only one system named 'Dupe' — the last one wins
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('overwritten')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — World Propagation
// ---------------------------------------------------------------------------

describe('world propagation', () => {
  it('output of system1 is input to system2', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    // Tracking systems record entity count at time of execution
    registry.register(createTrackingSystem('First'))
    registry.register(createTrackingSystem('Second'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    // First sees 0 entities, adds tracker → 1 entity
    // Second sees 1 entity, adds tracker → 2 entities
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('tracker-First')
    expect(result.entities[1].id).toBe('tracker-Second')
  })

  it('three systems propagate correctly', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTrackingSystem('A'))
    registry.register(createTrackingSystem('B'))
    registry.register(createTrackingSystem('C'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
    // Each tracker's x value = entity count when it was created
    expect(result.entities[0].x).toBe(0) // A saw 0 entities
    expect(result.entities[1].x).toBe(1) // B saw 1 entity
    expect(result.entities[2].x).toBe(2) // C saw 2 entities
  })

  it('world carries through identity systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('Id1'))
    registry.register(createMarkerSystem('Marker'))
    registry.register(createTestSystem('Id2'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('marker-Marker')
  })

  it('output world has all entities from chained systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 5; i++) {
      registry.register(createMarkerSystem(`Sys${i}`, `chain-${i}`))
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(result.entities[i].id).toBe(`chain-${i}`)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('tick returns frozen world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('tickWithResult result is frozen', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.executedSystems)).toBe(true)
  })

  it('tick does not mutate input world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Marker'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const originalEntityCount = world.entities.length
    loop.tick(world)
    expect(world.entities.length).toBe(originalEntityCount)
  })

  it('tickWithResult world is frozen', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('M'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
  })

  it('executedSystems array is frozen', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.register(createTestSystem('B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(Object.isFrozen(result.executedSystems)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same output for tick', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('A'))
    registry.register(createMarkerSystem('B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result1 = loop.tick(world)
    const result2 = loop.tick(world)
    expect(result1).toEqual(result2)
  })

  it('same input produces same output for tickWithResult', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('A'))
    registry.register(createMarkerSystem('B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result1 = loop.tickWithResult(world)
    const result2 = loop.tickWithResult(world)
    expect(result1.world).toEqual(result2.world)
    expect(result1.executedSystems).toEqual(result2.executedSystems)
    expect(result1.systemCount).toBe(result2.systemCount)
  })

  it('deterministic across loop instances', () => {
    const buildResult = (): World => {
      const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
      registry.register(createMarkerSystem('A'))
      registry.register(createMarkerSystem('B'))
      const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
      return loop.tick(createEmptyWorld())
    }
    const result1 = buildResult()
    const result2 = buildResult()
    expect(result1).toEqual(result2)
  })

  it('deterministic for empty registry', () => {
    const loop1: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(
      new DefaultRuntimeSystemRegistry(),
    )
    const loop2: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(
      new DefaultRuntimeSystemRegistry(),
    )
    const world = createPopulatedWorld(5)
    const result1 = loop1.tick(world)
    const result2 = loop2.tick(world)
    expect(result1).toEqual(result2)
  })

  it('deterministic for NoOp systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(5)
    const result1 = loop.tick(world)
    const result2 = loop.tick(world)
    expect(result1).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Large System Collections
// ---------------------------------------------------------------------------

describe('large system collections', () => {
  it('executes 100 identity systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(100)
    for (const system of systems) {
      registry.register(system)
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(10)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(10)
  })

  it('executes 1000 identity systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(1000)
    for (const system of systems) {
      registry.register(system)
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(10)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(10)
  })

  it('tickWithResult handles 1000 systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(1000)
    for (const system of systems) {
      registry.register(system)
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(1000)
    expect(result.executedSystems).toHaveLength(1000)
    expect(result.executedSystems[0]).toBe('system-0')
    expect(result.executedSystems[999]).toBe('system-999')
  })

  it('100 marker systems produce 100 entities', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 100; i++) {
      registry.register(createMarkerSystem(`M-${i}`, `marker-${i}`))
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(100)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — NoOp Systems
// ---------------------------------------------------------------------------

describe('NoOp systems', () => {
  it('single NoOp preserves world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(5)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(5)
  })

  it('multiple NoOps preserve world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    registry.register(new NoOpRuntimeSystem())
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(5)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(5)
  })

  it('ten NoOps preserve world', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 10; i++) {
      registry.register(new NoOpRuntimeSystem())
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(3)
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(3)
  })

  it('NoOp through tickWithResult preserves metadata', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(1)
    expect(result.executedSystems).toEqual(['NoOp'])
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Mixed Systems
// ---------------------------------------------------------------------------

describe('mixed systems', () => {
  it('NoOp followed by marker produces marker entity', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    registry.register(createMarkerSystem('Marker'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('marker-Marker')
  })

  it('marker followed by NoOp preserves marker entity', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Marker'))
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('marker-Marker')
  })

  it('alternating NoOp and marker systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    registry.register(createMarkerSystem('A', 'marker-A'))
    registry.register(new NoOpRuntimeSystem())
    registry.register(createMarkerSystem('B', 'marker-B'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('marker-A')
    expect(result.entities[1].id).toBe('marker-B')
  })

  it('identity systems combined with markers', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('Id1'))
    registry.register(createMarkerSystem('M1', 'first'))
    registry.register(createTestSystem('Id2'))
    registry.register(createMarkerSystem('M2', 'second'))
    registry.register(createTestSystem('Id3'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tick(world)
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })

  it('mixed system metadata is correct', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    registry.register(createMarkerSystem('Marker'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual(['NoOp', 'Marker'])
    expect(result.systemCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Result Metadata
// ---------------------------------------------------------------------------

describe('result metadata', () => {
  it('executedSystems contains all system names in order', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('Alpha'))
    registry.register(createTestSystem('Beta'))
    registry.register(createTestSystem('Gamma'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('systemCount is accurate', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 7; i++) {
      registry.register(createTestSystem(`sys-${i}`))
    }
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(7)
  })

  it('systemCount is 0 for empty registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(0)
  })

  it('systemCount is 1 for single system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.systemCount).toBe(1)
  })

  it('world in result is the final output', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createMarkerSystem('Final'))
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.world.entities).toHaveLength(1)
    expect(result.world.entities[0].id).toBe('marker-Final')
  })

  it('world in result for empty registry matches input', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createPopulatedWorld(5)
    const result = loop.tickWithResult(world)
    expect(result.world.entities).toHaveLength(5)
    expect(result.world.entities[0].id).toBe('entity-0')
  })

  it('executedSystems is empty for empty registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result = loop.tickWithResult(world)
    expect(result.executedSystems).toEqual([])
  })

  it('ExecutionTickResult type has readonly fields', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const loop: RuntimeExecutionLoop = new DefaultRuntimeExecutionLoop(registry)
    const world = createEmptyWorld()
    const result: ExecutionTickResult = loop.tickWithResult(world)
    expect(typeof result.systemCount).toBe('number')
    expect(Array.isArray(result.executedSystems)).toBe(true)
    expect('entities' in result.world).toBe(true)
  })
})