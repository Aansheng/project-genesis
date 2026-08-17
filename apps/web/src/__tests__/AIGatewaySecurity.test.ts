import { describe, expect, it } from 'vitest'
import { createAIConfiguration } from '@genesis/ai'

describe('browser AI gateway security', () => {
  it('does not turn VITE_AI_API_KEY into browser configuration', () => {
    const config = createAIConfiguration({ VITE_AI_API_KEY: 'must-not-leak', VITE_AI_ENABLED: 'true' })
    expect(config.apiKey).toBeUndefined()
    expect(config.gatewayURL).toBeUndefined()
  })
})
