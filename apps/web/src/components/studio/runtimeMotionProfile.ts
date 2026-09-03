/**
 * Studio runtime motion composition.
 *
 * The semantic WorldType selects between the existing generic platformer and
 * top-down motion capabilities at the Web composition boundary. This module
 * does not add a Runtime system or a genre-specific execution path.
 */
import type {
  InputProvider,
  RuntimeSystemRegistry,
} from '@genesis/runtime'
import {
  DefaultEntityContactSystem,
  DefaultGravitySystem,
  DefaultGroundCollisionSystem,
  DefaultJumpSystem,
  DefaultPlayerInteractionRequestSystem,
  DefaultPlayerAttackRequestSystem,
  DefaultPlayerControllerSystem,
  DefaultTargetDirectedMovementSystem,
  DefaultVelocityMotionSystem,
  DefaultVerticalMotionSystem,
} from '@genesis/runtime'
import { resolveWorldSpatialMode } from '@genesis/shared'
import type { EntityCategory, WorldType } from '@genesis/shared'

export type StudioMotionProfile = 'platformer' | 'top-down'

const FARM_INTERACTION_TARGET_CATEGORIES = Object.freeze(['terrain'] as const)
const RPG_INTERACTION_TARGET_CATEGORIES = Object.freeze(['quest'] as const)

/** Resolve the explicit Runtime categories eligible for Studio interaction. */
export function resolveStudioInteractionTargetCategories(
  worldType: WorldType | null | undefined,
): readonly EntityCategory[] {
  if (worldType === 'farm') return FARM_INTERACTION_TARGET_CATEGORIES
  if (worldType === 'rpg') return RPG_INTERACTION_TARGET_CATEGORIES
  return Object.freeze([])
}

/**
 * Resolve the generic motion profile for the current semantic world.
 *
 * Unknown/empty worlds retain the existing platformer composition until a
 * generated semantic world selects a more specific profile.
 */
export function resolveStudioMotionProfile(
  worldType: WorldType | null | undefined,
): StudioMotionProfile {
  return resolveWorldSpatialMode(worldType) === 'top-down' ? 'top-down' : 'platformer'
}

/**
 * Register the current Studio motion systems in deterministic order.
 *
 * The survival profile reuses four-direction input, one generic player-directed
 * offense request, target-directed movement, generic velocity motion, and
 * contact. Platformer-only jump, gravity, and ground collision systems are
 * omitted. All other WorldTypes preserve the established platformer set.
 */
export function registerStudioRuntimeSystems(
  registry: RuntimeSystemRegistry,
  inputProvider: InputProvider,
  worldType: WorldType | null | undefined,
): void {
  registry.clear()
  const motionProfile = resolveStudioMotionProfile(worldType)
  registry.register(new DefaultPlayerControllerSystem(inputProvider, 3, {
    motionMode: motionProfile === 'top-down' ? 'velocity-vector' : 'axis-delta',
  }))

  if (motionProfile === 'platformer') {
    registry.register(new DefaultJumpSystem(inputProvider, 10))
    registry.register(new DefaultGravitySystem(0.5))
  }

  if (motionProfile === 'top-down') {
    registry.register(new DefaultPlayerAttackRequestSystem(inputProvider, {
      targetCategory: 'enemy',
    }))
    registry.register(new DefaultTargetDirectedMovementSystem())
    registry.register(new DefaultVelocityMotionSystem())
  } else {
    registry.register(new DefaultVerticalMotionSystem())
  }

  if (motionProfile === 'platformer') {
    registry.register(new DefaultGroundCollisionSystem(400))
  }

  const interactionTargetCategories = resolveStudioInteractionTargetCategories(worldType)
  if (interactionTargetCategories.length > 0) {
    registry.register(new DefaultPlayerInteractionRequestSystem(inputProvider, {
      inputKey: 'Enter',
      targetCategories: interactionTargetCategories,
    }))
  }

  registry.register(new DefaultEntityContactSystem())
}
