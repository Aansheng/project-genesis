import { describe, expect, it } from 'vitest'
import type { VisualDesignSpecification } from '../visual-design'

describe('VisualDesignSpecification contract', () => {
  it('is vendor-independent and can represent a minimal semantic design', () => {
    const design: VisualDesignSpecification = {
      artDirection: 'stylized-2d',
      theme: { sourceTheme: 'none', visualTheme: 'classic-neutral' },
      palette: { temperature: 'neutral', contrast: 'standard', mood: 'neutral' },
      environment: {
        terrain: 'clear platform terrain',
        background: 'simple layered background',
        atmosphere: 'readable and adventurous',
      },
      entities: [],
    }

    expect(design.theme.sourceTheme).toBe('none')
  })
})
