/**
 * RuntimeSystem — verifies the RuntimeSystem interface, registry, and
 * NoOpRuntimeSystem implementation.
 *
 * WO-S8-008 — Runtime System Foundation
 * Architecture version v1.67
 *
 * Coverage:
 * - construction (interface, implementation, name)
 * - registration (single, multiple, overwrite)
 * - retrieval (empty, populated, after clear)
 * - multiple systems (ordering, deduplication)
 * - clear (empty, populated, repopulate)
 * - immutability (frozen arrays, frozen outputs)
 * - determinism (same input, multiple runs)
 * - NoOp behavior (identity, empty world, populated world)
 * - large system collections (100, 1000 systems)
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import type { RuntimeSystem, RuntimeSystemRegistry } from '../system'
import { DefaultRuntimeSystemRegistry, NoOpRuntimeSystem } from '../system'

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

/** Create a simple test system with a given name and optional transform. */
function createTestSystem(
  name: string,
  transform?: (world: World) => World,
): RuntimeSystem {
  return {
    name,
    update: (world: World): World => {
      if (transform) {
        return transform(world)
      }
      // Default: return frozen copy (identity)
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World as unknown as World
    },
  }
}

/** Create a system that appends a marker entity. */
function createMarkerSystem(name: string): RuntimeSystem {
  return {
    name,
    update: (world: World): World => {
      const marker: Entity = Object.freeze({
        id: `marker-${name}`,
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
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates a NoOpRuntimeSystem', () => {
    const system = new NoOpRuntimeSystem()
    expect(system).toBeDefined()
  })

  it('implements RuntimeSystem interface', () => {
    const system: RuntimeSystem = new NoOpRuntimeSystem()
    expect(system.name).toBe('NoOp')
    expect(typeof system.update).toBe('function')
  })

  it('creates a system with a custom name', () => {
    const system = createTestSystem('CustomSystem')
    expect(system.name).toBe('CustomSystem')
  })

  it('creates a system with a name containing special characters', () => {
    const system = createTestSystem('System-001_Position')
    expect(system.name).toBe('System-001_Position')
  })

  it('creates a system with empty string name', () => {
    const system = createTestSystem('')
    expect(system.name).toBe('')
  })

  it('creates multiple systems with different names', () => {
    const names = ['Movement', 'Collision', 'Rendering', 'Animation']
    const systems = names.map((n) => createTestSystem(n))
    expect(systems).toHaveLength(4)
    systems.forEach((s, i) => {
      expect(s.name).toBe(names[i])
    })
  })

  it('update is callable on NoOpRuntimeSystem', () => {
    const system = new NoOpRuntimeSystem()
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(result).toBeDefined()
  })

  it('update is callable on custom system', () => {
    const system = createTestSystem('Custom')
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Registration
// ---------------------------------------------------------------------------

describe('registration', () => {
  it('registers a single system', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const system = new NoOpRuntimeSystem()
    registry.register(system)
    const systems = registry.getSystems()
    expect(systems).toHaveLength(1)
    expect(systems[0].name).toBe('NoOp')
  })

  it('registers multiple systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.register(createTestSystem('B'))
    registry.register(createTestSystem('C'))
    const systems = registry.getSystems()
    expect(systems).toHaveLength(3)
  })

  it('registers custom systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const system = createTestSystem('Movement')
    registry.register(system)
    const systems = registry.getSystems()
    expect(systems[0].name).toBe('Movement')
  })

  it('overwrites a system with the same name', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systemA = createTestSystem('Test', () =>
      Object.freeze({ entities: Object.freeze([]) }) as unknown as World,
    )
    const systemB = createMarkerSystem('Test')
    registry.register(systemA)
    registry.register(systemB)
    const systems = registry.getSystems()
    expect(systems).toHaveLength(1)
    // The second registration should overwrite the first
    const world = createEmptyWorld()
    const result = systemB.update(world)
    expect(result.entities).toHaveLength(1)
  })

  it('registers NoOp system by name', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const systems = registry.getSystems()
    expect(systems[0].name).toBe('NoOp')
  })

  it('registers ten systems in sequence', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    for (let i = 0; i < 10; i++) {
      registry.register(createTestSystem(`system-${i}`))
    }
    expect(registry.getSystems()).toHaveLength(10)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Retrieval
// ---------------------------------------------------------------------------

describe('retrieval', () => {
  it('returns empty array from empty registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = registry.getSystems()
    expect(systems).toHaveLength(0)
  })

  it('returns all registered systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.register(createTestSystem('B'))
    const systems = registry.getSystems()
    const names = systems.map((s) => s.name).sort()
    expect(names).toEqual(['A', 'B'])
  })

  it('returns systems after clear and repopulate', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.clear()
    registry.register(createTestSystem('B'))
    const systems = registry.getSystems()
    expect(systems).toHaveLength(1)
    expect(systems[0].name).toBe('B')
  })

  it('returns systems that can be invoked after retrieval', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const systems = registry.getSystems()
    const world = createEmptyWorld()
    const result = systems[0].update(world)
    expect(result.entities).toHaveLength(0)
  })

  it('returns systems with correct update behavior', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const marker = createMarkerSystem('Marker')
    registry.register(marker)
    const systems = registry.getSystems()
    const world = createEmptyWorld()
    const result = systems[0].update(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('marker-Marker')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Multiple Systems
// ---------------------------------------------------------------------------

describe('multiple systems', () => {
  it('registers and retrieves many systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(10)
    for (const system of systems) {
      registry.register(system)
    }
    expect(registry.getSystems()).toHaveLength(10)
  })

  it('overwrites duplicate name preserving latest', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const first = createMarkerSystem('Dupe')
    const second = createMarkerSystem('Dupe')
    registry.register(first)
    registry.register(second)
    const systems = registry.getSystems()
    expect(systems).toHaveLength(1)
    const world = createEmptyWorld()
    const result = systems[0].update(world)
    // The second system's marker entity ID
    expect(result.entities[0].id).toBe('marker-Dupe')
  })

  it('systems are returned in registration order', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const names = ['First', 'Second', 'Third']
    for (const name of names) {
      registry.register(createTestSystem(name))
    }
    const systems = registry.getSystems()
    expect(systems[0].name).toBe('First')
    expect(systems[1].name).toBe('Second')
    expect(systems[2].name).toBe('Third')
  })

  it('name uniqueness is enforced by overwrite', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('Unique'))
    registry.register(createTestSystem('Unique'))
    registry.register(createTestSystem('Unique'))
    expect(registry.getSystems()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Clear
// ---------------------------------------------------------------------------

describe('clear', () => {
  it('clears an empty registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.clear()
    expect(registry.getSystems()).toHaveLength(0)
  })

  it('clears a populated registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.register(createTestSystem('B'))
    registry.register(createTestSystem('C'))
    registry.clear()
    expect(registry.getSystems()).toHaveLength(0)
  })

  it('clears a registry with many systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(50)
    for (const system of systems) {
      registry.register(system)
    }
    registry.clear()
    expect(registry.getSystems()).toHaveLength(0)
  })

  it('allows repopulation after clear', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.clear()
    registry.register(createTestSystem('B'))
    expect(registry.getSystems()).toHaveLength(1)
    expect(registry.getSystems()[0].name).toBe('B')
  })

  it('clear preserves registry usability', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.clear()
    registry.clear()
    registry.register(createTestSystem('A'))
    expect(registry.getSystems()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('getSystems returns a frozen array', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    const systems = registry.getSystems()
    expect(Object.isFrozen(systems)).toBe(true)
  })

  it('getSystems returns a new array each call', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    const first = registry.getSystems()
    const second = registry.getSystems()
    expect(first).not.toBe(second)
  })

  it('registering after getSystems does not affect previous snapshot', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    const snapshot = registry.getSystems()
    registry.register(createTestSystem('B'))
    expect(snapshot).toHaveLength(1)
    expect(registry.getSystems()).toHaveLength(2)
  })

  it('NoOpRuntimeSystem returns frozen World', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(3)
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('NoOpRuntimeSystem does not mutate input World', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(3)
    const originalEntities = [...world.entities]
    system.update(world)
    expect(world.entities).toEqual(originalEntities)
  })

  it('custom system output is frozen', () => {
    const system = createMarkerSystem('Test')
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('NoOpRuntimeSystem produces same output for same input', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(5)
    const result1 = system.update(world)
    const result2 = system.update(world)
    expect(result1).toEqual(result2)
  })

  it('NoOpRuntimeSystem produces same output across instances', () => {
    const system1 = new NoOpRuntimeSystem()
    const system2 = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(5)
    const result1 = system1.update(world)
    const result2 = system2.update(world)
    expect(result1).toEqual(result2)
  })

  it('custom system produces same output for same input', () => {
    const system = createMarkerSystem('Marker')
    const world = createEmptyWorld()
    const result1 = system.update(world)
    const result2 = system.update(world)
    expect(result1).toEqual(result2)
  })

  it('registry getSystems is deterministic after registration', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(createTestSystem('A'))
    registry.register(createTestSystem('B'))
    const result1 = registry.getSystems()
    const result2 = registry.getSystems()
    expect(result1.map((s) => s.name)).toEqual(result2.map((s) => s.name))
  })

  it('registry getSystems is deterministic for empty registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const result1 = registry.getSystems()
    const result2 = registry.getSystems()
    expect(result1).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — NoOp Behavior
// ---------------------------------------------------------------------------

describe('NoOp behavior', () => {
  it('returns empty world for empty input', () => {
    const system = new NoOpRuntimeSystem()
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(result.entities).toHaveLength(0)
  })

  it('returns populated world for populated input', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(5)
    const result = system.update(world)
    expect(result.entities).toHaveLength(5)
  })

  it('preserves entity data unchanged', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(3)
    const result = system.update(world)
    for (let i = 0; i < 3; i++) {
      expect(result.entities[i].id).toBe(`entity-${i}`)
      expect(result.entities[i].type).toBe('test')
      expect(result.entities[i].x).toBe(i)
      expect(result.entities[i].y).toBe(i * 2)
    }
  })

  it('returns world for single-entity world', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(1)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('entity-0')
  })

  it('returns world for large world', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(100)
    const result = system.update(world)
    expect(result.entities).toHaveLength(100)
  })

  it('returns new object (not same reference)', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(3)
    const result = system.update(world)
    expect(result).not.toBe(world)
    expect(result.entities).not.toBe(world.entities)
  })

  it('NoOp system in pipeline via registry', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    registry.register(new NoOpRuntimeSystem())
    const systems = registry.getSystems()
    const world = createPopulatedWorld(3)
    let current = world
    for (const system of systems) {
      current = system.update(current)
    }
    expect(current.entities).toHaveLength(3)
    // Contents unchanged
    expect(current.entities[0].id).toBe('entity-0')
    expect(current.entities[2].id).toBe('entity-2')
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Large System Collections
// ---------------------------------------------------------------------------

describe('large system collections', () => {
  it('registers 100 systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(100)
    for (const system of systems) {
      registry.register(system)
    }
    expect(registry.getSystems()).toHaveLength(100)
  })

  it('registers and retrieves 1000 systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(1000)
    for (const system of systems) {
      registry.register(system)
    }
    const retrieved = registry.getSystems()
    expect(retrieved).toHaveLength(1000)
  })

  it('clears 1000 systems', () => {
    const registry: RuntimeSystemRegistry = new DefaultRuntimeSystemRegistry()
    const systems = createSystemCollection(1000)
    for (const system of systems) {
      registry.register(system)
    }
    registry.clear()
    expect(registry.getSystems()).toHaveLength(0)
  })

  it('1000 systems can all be invoked', () => {
    const systems = createSystemCollection(1000)
    const world = createPopulatedWorld(10)
    let current = world
    for (const system of systems) {
      current = system.update(current)
    }
    expect(current.entities).toHaveLength(10)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — RuntimeSystem Contract Validation
// ---------------------------------------------------------------------------

describe('RuntimeSystem contract validation', () => {
  it('name is a readonly property', () => {
    const system = new NoOpRuntimeSystem()
    expect(typeof system.name).toBe('string')
  })

  it('update is a function', () => {
    const system = new NoOpRuntimeSystem()
    expect(typeof system.update).toBe('function')
  })

  it('update accepts World and returns World', () => {
    const system = new NoOpRuntimeSystem()
    const world = createEmptyWorld()
    const result: World = system.update(world)
    expect(Array.isArray(result.entities)).toBe(true)
  })

  it('system can have empty name', () => {
    const system = createTestSystem('')
    expect(system.name).toBe('')
  })

  it('system name defaults through constructor', () => {
    // Multiple NoOp systems all have the default name 'NoOp'
    const system1 = new NoOpRuntimeSystem()
    const system2 = new NoOpRuntimeSystem()
    expect(system1.name).toBe(system2.name)
  })

  it('system update is callable multiple times without state change', () => {
    const system = new NoOpRuntimeSystem()
    const world = createPopulatedWorld(3)
    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities).toHaveLength(3)
    }
  })
})