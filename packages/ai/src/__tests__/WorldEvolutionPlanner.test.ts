import { describe, expect, it, vi } from 'vitest'
import type { GameWorldModel, WorldEvolutionRequest } from '@genesis/shared'
import {
  DefaultWorldEvolutionPlanner,
  DefaultWorldEvolutionPromptBuilder,
  DefaultWorldSemanticDeltaValidator,
  StructuredWorldEvolutionCandidateProvider,
  type WorldEvolutionCandidateProvider,
} from '../world-evolution'
import type { StructuredGenerationClient } from '../game-world/generation/StructuredGenerationClient'

const world: GameWorldModel = Object.freeze({
  worldType: 'farm',
  entities: Object.freeze([
    Object.freeze({ id: 'player-1', category: 'player' as const, name: 'Player' }),
    Object.freeze({ id: 'cow-1', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'cow-2', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'cow-3', category: 'npc' as const, name: 'Cow' }),
    Object.freeze({ id: 'crop-1', category: 'terrain' as const, name: 'Crop' }),
    Object.freeze({ id: 'barn-1', category: 'building' as const, name: 'Barn' }),
  ]),
})

function request(instruction: string, semanticWorld: GameWorldModel = world): WorldEvolutionRequest {
  return {
    operationId: `op-${instruction}`,
    instruction,
    createdAt: '2026-08-20T00:00:00.000Z',
    context: { worldId: 'world-a', semanticWorld, properties: { timeOfDay: 'day' } },
  }
}

function planner(provider?: WorldEvolutionCandidateProvider): DefaultWorldEvolutionPlanner {
  return new DefaultWorldEvolutionPlanner(provider, undefined, undefined, undefined, () => '2026-08-20T00:00:01.000Z')
}

describe('World Evolution planner', () => {
  it('plans a group replacement against current IDs and excludes unrelated entities', async () => {
    const result = await planner().plan(request('把所有牛改成羊'))

    expect(result.status).toBe('validated')
    if (result.status !== 'validated') return
    expect(result.delta.operations[0]).toMatchObject({
      kind: 'replace-entity-semantic',
      targetIds: ['cow-1', 'cow-2', 'cow-3'],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    })
    expect(result.delta.operations[0]).not.toMatchObject({ targetIds: expect.arrayContaining(['crop-1', 'barn-1']) })
    expect(result.operation.resolvedTargetIds).toEqual(['cow-1', 'cow-2', 'cow-3'])
  })

  it('keeps current semantic and runtime-facing input untouched after planning', async () => {
    const before = JSON.stringify(world)
    const result = await planner().plan(request('把所有牛改成羊'))
    expect(result.status).toBe('validated')
    expect(JSON.stringify(world)).toBe(before)
  })

  it('resolves distinct merchant and villager archetypes without category bleed', async () => {
    const rpg: GameWorldModel = {
      worldType: 'rpg',
      entities: [
        { id: 'merchant-1', category: 'npc', name: 'Merchant' },
        { id: 'villager-1', category: 'npc', name: 'Villager' },
        { id: 'villager-2', category: 'npc', name: 'Villager' },
        { id: 'slime-1', category: 'enemy', name: 'Slime' },
        { id: 'slime-2', category: 'enemy', name: 'Slime' },
        { id: 'skeleton-1', category: 'enemy', name: 'Skeleton' },
      ],
    }
    const result = await planner().plan(request('把商人改成机器人', rpg))
    expect(result.status).toBe('validated')
    if (result.status !== 'validated') return
    expect(result.operation.resolvedTargetIds).toEqual(['merchant-1'])
    expect(result.delta.operations[0]).toMatchObject({ replacement: { name: 'Robot' } })
  })

  it('uses an explicit source noun when a provider returns only a generic category selector', async () => {
    const provider: WorldEvolutionCandidateProvider = {
      source: 'ai',
      generate: async () => ({
        kind: 'replace-entity-semantic',
        target: { category: 'npc' },
        replacement: { name: 'robot' },
      }),
    }
    const result = await planner(provider).plan(request('把商人改成机器人', {
      worldType: 'rpg',
      entities: [
        { id: 'merchant-1', category: 'npc', name: 'Merchant' },
        { id: 'villager-1', category: 'npc', name: 'Villager' },
      ],
    }))

    expect(result.status).toBe('validated')
    if (result.status !== 'validated') return
    expect(result.operation.resolvedTargetIds).toEqual(['merchant-1'])
  })

  it('accepts common provider aliases for replacement source and destination', async () => {
    const provider: WorldEvolutionCandidateProvider = {
      source: 'ai',
      generate: async () => ({ operation: 'replace', from: { name: 'Merchant', category: 'npc' }, to: { semantic: 'robot' } }),
    }
    const result = await planner(provider).plan(request('把商人改成机器人', {
      worldType: 'rpg',
      entities: [{ id: 'merchant-1', category: 'npc', name: 'Merchant' }],
    }))

    expect(result.status).toBe('validated')
    if (result.status !== 'validated') return
    expect(result.operation.resolvedTargetIds).toEqual(['merchant-1'])
    expect(result.delta.operations[0]).toMatchObject({ replacement: { name: 'Robot' } })
  })

  it('supports deterministic add, remove, and world update intents', async () => {
    const add = await planner().plan(request('增加一个商人'))
    const remove = await planner().plan(request('删除 Boss', { worldType: 'rpg', entities: [{ id: 'boss-1', category: 'enemy', name: 'Boss' }] }))
    const night = await planner().plan(request('把整个世界改成夜晚'))

    expect(add.status).toBe('validated')
    expect(remove.status).toBe('validated')
    expect(night.status).toBe('validated')
    if (add.status === 'validated') expect(add.delta.operations[0]).toMatchObject({ kind: 'add-entity', semantic: { name: 'Merchant', category: 'npc' }, count: 1 })
    if (night.status === 'validated') expect(night.delta.operations[0]).toMatchObject({ kind: 'update-world-property', property: 'timeOfDay', from: 'day', to: 'night' })
  })

  it('requires clarification for an unknown or ambiguous target', async () => {
    const unknown = await planner({ source: 'deterministic', generate: async () => ({ kind: 'replace-entity-semantic', target: { semantic: 'unicorn', match: 'one' }, replacement: { name: 'robot' } }) }).plan(request('把独角兽改成机器人'))
    const ambiguous = await planner().plan(request('把商人改成机器人', { worldType: 'farm', entities: [{ id: 'merchant-1', category: 'npc', name: 'Merchant' }, { id: 'merchant-2', category: 'npc', name: 'Merchant' }] }))

    expect(unknown.status).toBe('needs_clarification')
    expect(ambiguous.status).toBe('needs_clarification')
    if (ambiguous.status === 'needs_clarification') expect(ambiguous.operation.failureReason).toBe('ambiguous_target')
  })

  it('keeps explicit group language authoritative when a provider omits match', async () => {
    const provider: WorldEvolutionCandidateProvider = {
      source: 'ai',
      generate: async () => ({
        kind: 'replace-entity-semantic',
        target: { semantic: 'cow' },
        replacement: { name: 'sheep' },
      }),
    }
    const result = await planner(provider).plan(request('把所有牛改成羊'))

    expect(result.status).toBe('validated')
    if (result.status !== 'validated') return
    expect(result.intent).toMatchObject({ scope: 'archetype-group', target: { match: 'all' } })
    expect(result.operation.resolvedTargetIds).toEqual(['cow-1', 'cow-2', 'cow-3'])
  })

  it('does not execute movement property updates before their contract exists', async () => {
    const provider: WorldEvolutionCandidateProvider = {
      source: 'deterministic',
      generate: async () => ({ kind: 'update-entity-property', target: { semantic: 'cow', match: 'all' }, property: 'movementSpeed', operation: 'multiply', value: 2 }),
    }
    const result = await planner(provider).plan(request('让所有牛速度提高一倍'))
    expect(result.status).toBe('unsupported')
    if (result.status !== 'unsupported') return
    expect(result.operation.resolvedTargetIds).toEqual([])
  })

  it('turns provider failures and invalid candidates into no-op failed plans', async () => {
    const failing: WorldEvolutionCandidateProvider = { source: 'ai', generate: async () => { throw new Error('secret provider detail') } }
    const invalid: WorldEvolutionCandidateProvider = { source: 'ai', generate: async () => ({ kind: 'replace-entity-semantic', target: {} }) }

    const failed = await planner(failing).plan(request('把牛改成羊'))
    const rejected = await planner(invalid).plan(request('把牛改成羊'))
    expect(failed.status).toBe('failed')
    expect(rejected.status).toBe('failed')
    if (failed.status === 'failed') expect(failed.operation.failureReason).toBe('provider_error')
    if (rejected.status === 'failed') expect(rejected.operation.failureReason).toBe('candidate_invalid')
    expect(JSON.stringify(world)).toContain('cow-1')
    expect(JSON.stringify(world)).not.toContain('Sheep')
  })

  it('reuses the selectable structured-generation boundary without leaking provider types into the delta', async () => {
    const client: StructuredGenerationClient = {
      getProviderMetadata: () => ({ provider: 'codex-cli' }),
      generateStructured: vi.fn().mockResolvedValue({
        kind: 'replace-entity-semantic',
        scope: 'archetype-group',
        target: { semantic: 'cow', match: 'all' },
        replacement: { name: 'sheep' },
        preserveIdentity: true,
      }),
    }
    const result = await planner(new StructuredWorldEvolutionCandidateProvider(client)).plan(request('把所有牛改成羊'))
    expect(result.status).toBe('validated')
    expect(client.generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'world-evolution', operationId: expect.any(String) }),
      expect.objectContaining({ system: expect.stringContaining('existing semantic world') }),
      undefined,
    )
    if (result.status === 'validated') {
      expect(result.operation.source).toBe('ai')
      expect(result.operation.provider).toBe('codex-cli')
      expect(JSON.stringify(result.delta)).not.toContain('codex-cli')
    }
  })

  it('emits only real planning stages and correlated domain events', async () => {
    const result = await planner().plan(request('把所有牛改成羊'))
    expect(result.operation.stages.map(stage => stage.name)).toEqual([
      'REQUEST_RECEIVED', 'CANDIDATE_PARSE', 'TARGET_RESOLUTION', 'DELTA_VALIDATION',
    ])
    expect(result.operation.events.map(event => event.type)).toEqual([
      'world.evolution.requested', 'world.evolution.planned',
    ])
    expect(result.operation.events.every(event => event.operationId === result.operation.operationId)).toBe(true)
  })
})

describe('World Evolution validation and prompt boundaries', () => {
  it('rejects invalid add counts and conflicting remove/replace operations', () => {
    const validator = new DefaultWorldSemanticDeltaValidator()
    const context = request('test')
    const invalid = validator.validate({
      operationId: context.operationId,
      worldId: context.context.worldId,
      summary: 'invalid',
      operations: [{ kind: 'add-entity', scope: 'entity', semantic: { name: 'Merchant', category: 'npc' }, count: 0 }],
    }, context)
    const conflict = validator.validate({
      operationId: context.operationId,
      worldId: context.context.worldId,
      summary: 'conflict',
      operations: [
        { kind: 'remove-entity', scope: 'entity', targetIds: ['cow-1'] },
        { kind: 'replace-entity-semantic', scope: 'entity', targetIds: ['cow-1'], from: [{ name: 'Cow', category: 'npc' }], replacement: { name: 'Sheep', category: 'npc' }, preserveIdentity: true },
      ],
    }, context)
    expect(invalid.valid).toBe(false)
    expect(conflict.valid).toBe(false)
  })

  it('sends only minimal semantic facts to the prompt builder', () => {
    const prompt = new DefaultWorldEvolutionPromptBuilder().build(request('把所有牛改成羊'))
    expect(prompt.user).toContain('cow-1')
    expect(prompt.user).toContain('Cow')
    expect(prompt.user).not.toContain('position')
    expect(prompt.user).not.toContain('texture')
    expect(prompt.system).toContain('Do not recreate the world')
  })
})
