import { describe, expect, it } from 'vitest'
import {
  DefaultGameplayPromptBuilder,
  DefaultGameplaySpecificationBuilder,
  DefaultGameplaySpecificationValidator,
  GameplayGenerationProviderAdapter,
  buildDefaultGameplaySpecificationCandidate,
} from '../index'
import { DEFAULT_GAMEPLAY_CAPABILITY_CATALOG, DefaultGameplayGenerationContextBuilder } from '@genesis/shared'
import type { GameWorldModel } from '@genesis/shared'
import type { GameplayGenerationRequest, GameplaySpecificationCandidate } from '../index'

const platformer = {
  worldType: 'platformer' as const,
  entities: [
    { id: 'player', category: 'player' as const, name: 'Player' },
    { id: 'enemy', category: 'enemy' as const, name: 'Enemy' },
    { id: 'goal', category: 'item' as const, name: 'Goal' },
  ],
}

function requestFor(world: GameWorldModel, instruction = '生成一个马里奥式平台游戏'): GameplayGenerationRequest {
  const context = new DefaultGameplayGenerationContextBuilder().build({
    metadata: { worldId: 'world-1', semanticRevision: 0, gameplayRevision: 0 },
    semanticWorld: world,
    capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
    instruction,
  })
  return { kind: 'gameplay-generation', input: instruction, context }
}

describe('GameplaySpecification foundation', () => {
  it('builds an immutable platformer loop with truthful support statuses', () => {
    const specification = new DefaultGameplaySpecificationBuilder().build({ semanticWorld: platformer })

    expect(Object.isFrozen(specification)).toBe(true)
    expect(Object.isFrozen(specification.gameLoop)).toBe(true)
    expect(Object.isFrozen(specification.mechanics)).toBe(true)
    expect(specification.gameLoop.completionMode).toBe('goal')
    expect(specification.mechanics.find(item => item.id === 'player-move')?.supportStatus).toBe('supported')
    expect(specification.mechanics.find(item => item.id === 'enemy-stomp')?.supportStatus).toBe('supported')
    expect(specification.mechanics.find(item => item.id === 'gain-experience')?.supportStatus).toBe('supported')
    expect(specification.mechanics.find(item => item.id === 'level-up')?.supportStatus).toBe('supported')
    expect(specification.gameLoop.progressionModes).toEqual(['experience', 'levels'])
    expect(specification.progression).toMatchObject({ modes: ['experience', 'levels'], supportStatus: 'supported' })
    expect(specification.mechanics.find(item => item.id === 'reach-goal')?.supportStatus).toBe('supported')
    expect(specification.interactions?.find(item => item.id === 'player-enemy-contact')).toMatchObject({
      supportStatus: 'supported',
      outcome: expect.stringContaining('removes the enemy'),
    })
    expect(specification.goals?.[0]?.targetEntityId).toBe('goal')
    expect(specification.goals?.[0]?.supportStatus).toBe('supported')
    expect(specification.interactions?.find(item => item.id === 'player-goal-reach')).toMatchObject({
      supportStatus: 'supported',
    })
  })

  it('uses the same schema for survivor and does not inject platformer mechanics into farm', () => {
    const survivor = new DefaultGameplaySpecificationBuilder().build({
      semanticWorld: { ...platformer, worldType: 'survival' },
    })
    const farm = new DefaultGameplaySpecificationBuilder().build({
      semanticWorld: {
        worldType: 'farm',
        entities: [{ id: 'player', category: 'player', name: 'Player' }, { id: 'merchant', category: 'npc', name: 'Merchant' }],
      },
    })

    expect(survivor.progression?.modes).toEqual(['experience', 'levels', 'upgrades'])
    expect(survivor.progression?.supportStatus).toBe('partially_supported')
    expect(survivor.spawnRules?.[0]?.supportStatus).toBe('deferred')
    expect(survivor.mechanics.some(item => item.id === 'enemy-chase')).toBe(true)
    expect(survivor.mechanics.find(item => item.id === 'contact-offense')?.supportStatus).toBe('supported')
    expect(survivor.mechanics.find(item => item.id === 'auto-attack')?.supportStatus).toBe('deferred')
    expect(survivor.mechanics.find(item => item.id === 'gain-experience')?.supportStatus).toBe('supported')
    expect(farm.mechanics.some(item => item.id === 'enemy-stomp')).toBe(false)
    expect(farm.mechanics.some(item => item.id === 'choose-skill')).toBe(false)
  })

  it('does not promote an arbitrary enemy-contact interaction by concept alone', () => {
    const defaultCandidate = buildDefaultGameplaySpecificationCandidate(platformer)
    const candidate = Object.freeze({
      ...defaultCandidate,
      interactions: Object.freeze([
        Object.freeze({
          ...defaultCandidate.interactions![0],
          outcome: 'Enemy contact triggers an unspecified provider effect.',
        }),
      ]),
    })
    const specification = new DefaultGameplaySpecificationBuilder().build({
      semanticWorld: platformer,
      candidate,
    })

    expect(specification.interactions?.[0]?.supportStatus).toBe('deferred')
  })

  it('normalizes unsupported provider claims instead of trusting them', () => {
    const candidate = {
      gameLoop: {
        objective: 'Collect the item',
        repeatableActions: ['move'],
        challengeSources: ['enemy'],
        rewardSources: ['item'],
        progressionModes: ['none'],
        completionMode: 'goal',
        success: 'Collect it',
        failure: 'Player death',
      },
      playerMechanics: ['player-move'],
      mechanics: [
        { id: 'player-move', kind: 'movement', subject: 'player', description: 'Move', supportStatus: 'supported' },
        { id: 'collect-coin', kind: 'collection', subject: 'player', target: 'item', description: 'Collect', supportStatus: 'supported' },
      ],
    }
    const result = new DefaultGameplaySpecificationValidator().validate(candidate, {
      semanticWorld: platformer,
      capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
    })

    expect(result.valid).toBe(true)
    expect(result.warnings.some(warning => warning.includes('collect-coin'))).toBe(true)
    expect(result.candidate?.mechanics.find(item => item.id === 'collect-coin')?.supportStatus).toBe('deferred')
  })

  it('rejects duplicate mechanics and nonexistent semantic entity references', () => {
    const result = new DefaultGameplaySpecificationValidator().validate({
      gameLoop: {
        objective: 'Goal', repeatableActions: ['move'], challengeSources: ['hazard'], rewardSources: ['progress'],
        progressionModes: ['none'], completionMode: 'goal', success: 'Goal', failure: 'Death',
      },
      playerMechanics: ['move'],
      mechanics: [
        { id: 'move', kind: 'movement', description: 'Move' },
        { id: 'move', kind: 'movement', description: 'Move again' },
      ],
      goals: [{ id: 'goal', kind: 'reach-goal', description: 'Reach', targetEntityId: 'missing' }],
    }, { semanticWorld: platformer, capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG })

    expect(result.valid).toBe(false)
    expect(result.errors.some(error => error.includes('must be unique'))).toBe(true)
    expect(result.errors.some(error => error.includes('existing semantic entity'))).toBe(true)
  })

  it('builds minimal gameplay context and deterministic provider-neutral prompt', () => {
    const request = requestFor(platformer)
    const prompt = new DefaultGameplayPromptBuilder().build(request)

    expect(request.context.game.worldType).toBe('platformer')
    expect(request.context.semanticWorld.entities.map(entity => entity.id)).toEqual(['player', 'enemy', 'goal'])
    expect(request.context.capabilities.supportedMechanicIds).toContain('player-jump')
    expect(request.context.capabilities.supportedMechanicIds).toContain('contact-offense')
    expect(prompt.system).toContain('Return structured JSON only')
    expect(prompt.system).toContain('Do not generate engine code')
    expect(prompt.user).toContain('player-jump')
    expect(prompt.user).not.toContain('Pixi')
    expect(prompt.user).not.toContain('Authorization')
  })

  it('keeps candidate validation before specification construction', async () => {
    const candidate: GameplaySpecificationCandidate = {
      gameLoop: {
        objective: 'Move', repeatableActions: ['move'], challengeSources: ['none'], rewardSources: ['progress'],
        progressionModes: ['none'], completionMode: 'open-ended', success: 'Move', failure: 'None',
      },
      playerMechanics: ['player-move'],
      mechanics: [{ id: 'player-move', kind: 'movement', subject: 'player', description: 'Move', supportStatus: 'supported' }],
    }
    const provider = new GameplayGenerationProviderAdapter(
      { generate: async () => candidate },
      new DefaultGameplaySpecificationValidator(),
      new DefaultGameplaySpecificationBuilder(),
    )
    const result = await provider.generateWithDiagnostics(requestFor({
      worldType: 'sandbox',
      entities: [{ id: 'player', category: 'player', name: 'Player' }],
    }))

    expect(result.specification.gameplayRevision).toBe(1)
    expect(result.specification.mechanics[0]?.supportStatus).toBe('supported')
    expect(result.diagnostics.validationStatus).toBe('valid')
  })
})
