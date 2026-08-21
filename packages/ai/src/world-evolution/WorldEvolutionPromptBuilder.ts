import type { GameDesignPrompt } from '../game-world/generation/GameDesignPromptBuilder'
import type { WorldEvolutionRequest } from '@genesis/shared'
import { DefaultWorldEvolutionGenerationContextBuilder } from '@genesis/shared'

export interface WorldEvolutionPromptBuilder {
  build(request: WorldEvolutionRequest): GameDesignPrompt
}

const supportedOperations = Object.freeze([
  'add-entity',
  'remove-entity',
  'replace-entity-semantic',
  'update-world-property',
])

/** Builds a minimal semantic-only prompt for the existing-world planner. */
export class DefaultWorldEvolutionPromptBuilder implements WorldEvolutionPromptBuilder {
  build(request: WorldEvolutionRequest): GameDesignPrompt {
    const context = new DefaultWorldEvolutionGenerationContextBuilder().build({
      metadata: {
        worldId: request.context.worldId,
        operationId: request.operationId,
        ...(request.context.semanticRevision !== undefined ? { semanticRevision: request.context.semanticRevision } : {}),
        ...(request.context.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: request.context.runtimeSemanticRevision } : {}),
        ...(request.context.visualRevision !== undefined ? { visualRevision: request.context.visualRevision } : {}),
      },
      semanticWorld: request.context.semanticWorld,
      ...(request.context.properties ? { properties: request.context.properties } : {}),
      ...(request.context.selectedEntityId ? { selectedEntityId: request.context.selectedEntityId } : {}),
    })
    const system = [
      'You are a world evolution planner for Project Genesis.',
      'Modify the existing semantic world by returning one bounded semantic delta intent.',
      'Do not recreate the world. Preserve unrelated entities.',
      'Return structured JSON only; do not return Markdown, explanations, reasoning, or hidden chain-of-thought.',
      'Never fabricate or trust concrete entity IDs. Use semantic selectors; Genesis resolves current IDs.',
      'Preserve entity identity for semantic replacement by setting preserveIdentity to true.',
      'Supported output shape: {kind, scope, target?, semantic?, replacement?, count?, property?, value?, operation?, preserveIdentity?}.',
      `Supported v1 kinds: ${supportedOperations.join(', ')}.`,
      'Entity property updates are a typed extension point and are not executable in v1.',
    ].join('\n')
    const user = JSON.stringify({
      world: {
        id: context.worldId,
        revision: context.semanticRevision ?? 0,
        type: context.world.worldType,
        properties: context.world.properties ?? {},
        entities: context.entities.map(entity => ({
          id: entity.id,
          category: entity.category,
          name: entity.name,
        })),
      },
      instruction: request.instruction,
    })
    return Object.freeze({ system, user, generationContext: context })
  }
}
