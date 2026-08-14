import type { World } from '@genesis/shared'
import type { InputProvider } from '../input'

/**
 * GameBootstrapConfig — configuration for bootstrapping a playable game.
 *
 * WO-S9-010 — Playable Game Bootstrap Foundation
 * Architecture version v1.84
 *
 * Provides the external dependencies needed to wire up a complete game:
 * - world: the initial game world containing entities and their components
 * - inputProvider: source of keyboard (or other) input state
 *
 * All fields are readonly. Once constructed, the config is immutable.
 */
export interface GameBootstrapConfig {
  /** The initial game world with entities and components. */
  readonly world: World

  /** The input provider that drives player movement. */
  readonly inputProvider: InputProvider
}