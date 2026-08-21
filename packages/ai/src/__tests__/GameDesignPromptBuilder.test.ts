import { describe, expect, it } from 'vitest'
import { DefaultGameDesignPromptBuilder } from '../game-world/generation/GameDesignPromptBuilder'

const request = { input: '创建一个冰雪平台游戏，有两个巡逻敌人、一个检查点和 Boss，难度中等', intent: { genre: 'platformer' as const, title: '冰雪平台游戏' } }

describe('DefaultGameDesignPromptBuilder', () => {
  it('assembles a deterministic semantic-only prompt for a rich request', () => {
    const builder = new DefaultGameDesignPromptBuilder()
    const first = builder.build(request)
    const second = builder.build(request)

    expect(first).toEqual(second)
    expect(first.system).toContain('theme')
    expect(first.system).toContain('difficulty')
    expect(first.system).toContain('objectives')
    expect(first.system).toContain('entities')
    expect(first.system).toContain('platformer')
    expect(first.system).toContain('Preserve but do not pretend to execute')
    expect(first.system).toContain('Do not use Markdown')
    expect(first.system).not.toContain('think step by step')
    expect(first.user).toContain('冰雪平台游戏')
    expect(first.user).toContain('platformer')
    expect(first.generationContext).toMatchObject({
      scope: 'game-design',
      request: { instruction: request.input, genre: 'platformer', title: '冰雪平台游戏' },
    })
    expect(Object.isFrozen(first.generationContext)).toBe(true)
  })

  it('does not teach implementation details as output fields', () => {
    const prompt = new DefaultGameDesignPromptBuilder().build(request)
    expect(prompt.system).toContain('coordinates')
    expect(prompt.system).toContain('renderer styles')
    expect(prompt.system).toContain('code')
    expect(prompt.system).not.toContain('x/y')
  })
})
