import { describe, expect, it, vi } from 'vitest'
import { CodexCliStructuredGenerationClient, extractCodexStructuredCandidate } from '../CodexCliStructuredGenerationClient'

const request = { input: 'create a farm', intent: { genre: 'farm' as const, title: 'farm' } }

describe('CodexCliStructuredGenerationClient', () => {
  it('extracts the final candidate from Codex JSONL events and keeps metadata private', async () => {
    const runner = vi.fn().mockResolvedValue({
      exitCode: 0,
      stderr: 'hidden diagnostic',
      stdout: JSON.stringify({ type: 'turn.started' }) + '\n' + JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ genre: 'farm', entities: [{ id: 'player', category: 'player', name: 'Farmer' }] }) } }),
    })
    const client = new CodexCliStructuredGenerationClient({ timeoutMs: 100, maxAttempts: 1 }, runner)
    await expect(client.generateStructured(request)).resolves.toMatchObject({ genre: 'farm', entities: [{ id: 'player' }] })
    expect(runner.mock.calls[0]?.[0]).toContain('create a farm')
    expect(JSON.stringify(await client.generateStructured(request))).not.toContain('hidden diagnostic')
    expect(extractCodexStructuredCandidate('{"genre":"farm","entities":[]}')).toMatchObject({ genre: 'farm' })
  })

  it('classifies malformed output and terminates a timed-out run through AbortSignal', async () => {
    const malformed = new CodexCliStructuredGenerationClient({ timeoutMs: 100, maxAttempts: 1 }, vi.fn().mockResolvedValue({ exitCode: 0, stdout: '{"not":"a candidate"}', stderr: '' }))
    await expect(malformed.generateStructured(request)).rejects.toMatchObject({ reason: 'malformed_response' })

    const aborted = vi.fn((_prompt: string, signal: AbortSignal) => new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))))
    const timeout = new CodexCliStructuredGenerationClient({ timeoutMs: 5, maxAttempts: 1 }, aborted)
    await expect(timeout.generateStructured(request)).rejects.toMatchObject({ reason: 'timeout' })
    expect(aborted).toHaveBeenCalledOnce()
  })
})
