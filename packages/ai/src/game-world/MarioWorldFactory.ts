/**
 * MarioWorldFactory — produces a predefined Mario-style GameWorldModel.
 *
 * WO-S9-011 — Mario Playable Slice Foundation
 * Architecture version v1.86
 *
 * Creates a minimal Mario playable world with:
 * - worldType: 'platformer'
 * - player entity (player)
 * - ground entity (terrain)
 * - goal entity (item — flag/goal marker)
 *
 * This is a pure, stateless, deterministic factory.
 * No AI generation. No LLM. No world templates.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between creates
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { GameWorldModel } from '@genesis/shared'

// ---------------------------------------------------------------------------
// MarioWorldFactory Interface
// ---------------------------------------------------------------------------

export interface MarioWorldFactory {
  /**
   * Create a predefined Mario-style GameWorldModel.
   *
   * Returns a frozen GameWorldModel with:
   * - worldType: 'platformer'
   * - A player entity (category: 'player', name: 'Mario')
   * - A ground entity (category: 'terrain', name: 'Ground')
   * - A goal entity (category: 'item', name: 'Flag')
   *
   * @returns Frozen GameWorldModel with exactly 3 entities
   */
  create(): GameWorldModel
}

// ---------------------------------------------------------------------------
// MarioWorldFactory Implementation
// ---------------------------------------------------------------------------

/**
 * DefaultMarioWorldFactory — default implementation of MarioWorldFactory.
 *
 * Produces a predefined Mario-style world with exactly 3 entities:
 * player, ground, and goal.
 *
 * Pure. Stateless. Deterministic. Frozen output.
 */
export class DefaultMarioWorldFactory implements MarioWorldFactory {
  /**
   * Create a predefined Mario-style GameWorldModel.
   *
   * @returns Frozen GameWorldModel with exactly 3 entities
   */
  create(): GameWorldModel {
    return Object.freeze({
      worldType: 'platformer',
      entities: Object.freeze([
        // Player character — Mario
        Object.freeze({
          id: 'player',
          category: 'player' as const,
          name: 'Mario',
        }),
        // Ground terrain — the floor Mario walks on
        Object.freeze({
          id: 'ground',
          category: 'terrain' as const,
          name: 'Ground',
        }),
        // Goal marker — the flag at the end of the level
        Object.freeze({
          id: 'goal',
          category: 'item' as const,
          name: 'Flag',
        }),
      ]),
    })
  }
}