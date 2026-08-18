import { describe, expect, it, vi } from 'vitest'
import { VisualAssetGenerationScheduler } from '../VisualAssetGenerationScheduler'

describe('VisualAssetGenerationScheduler', () => {
  it('runs FIFO with bounded concurrency and continues after completion', async () => {
    let releaseFirst!: () => void
    const first = new Promise<void>(resolve => { releaseFirst = resolve })
    const calls: string[] = []
    const scheduler = new VisualAssetGenerationScheduler<void>(1)
    scheduler.enqueue({ jobId: 'player', run: async () => { calls.push('player'); await first } })
    scheduler.enqueue({ jobId: 'enemy', run: async () => { calls.push('enemy') } })
    await Promise.resolve()
    expect(calls).toEqual(['player'])
    releaseFirst()
    await vi.waitFor(() => expect(calls).toEqual(['player', 'enemy']))
  })

  it('does not start queued jobs after cancellation', async () => {
    const calls: string[] = []
    const scheduler = new VisualAssetGenerationScheduler<void>(1)
    scheduler.enqueue({ jobId: 'running', run: async () => { calls.push('running') } })
    scheduler.enqueue({ jobId: 'queued', run: async () => { calls.push('queued') } })
    scheduler.cancel()
    await Promise.resolve()
    expect(calls).toEqual(['running'])
    expect(scheduler.status('queued')).toBe('cancelled')
  })

  it('releases capacity when a job rejects and starts the next job', async () => {
    const calls: string[] = []
    const scheduler = new VisualAssetGenerationScheduler<void>(1)
    scheduler.enqueue({ jobId: 'failed', run: async () => { calls.push('failed'); throw new Error('timeout') } })
    scheduler.enqueue({ jobId: 'next', run: async () => { calls.push('next') } })

    await vi.waitFor(() => expect(calls).toEqual(['failed', 'next']))
    expect(scheduler.status('failed')).toBe('completed')
    expect(scheduler.status('next')).toBe('completed')
  })
})
