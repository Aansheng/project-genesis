export interface VisualAssetGenerationJob<T> {
  readonly jobId: string
  readonly run: () => Promise<T>
}

export type VisualAssetGenerationJobStatus = 'queued' | 'running' | 'completed' | 'cancelled'

export class VisualAssetGenerationScheduler<T> {
  private readonly queue: Array<VisualAssetGenerationJob<T>> = []
  private readonly statuses = new Map<string, VisualAssetGenerationJobStatus>()
  private running = 0

  constructor(
    private readonly concurrency = 1,
    private readonly onStatus?: (jobId: string, status: VisualAssetGenerationJobStatus) => void,
  ) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('concurrency must be a positive integer')
  }

  enqueue(job: VisualAssetGenerationJob<T>): void {
    this.statuses.set(job.jobId, 'queued')
    this.onStatus?.(job.jobId, 'queued')
    this.queue.push(job)
    this.pump()
  }

  cancel(): void {
    while (this.queue.length) {
      const job = this.queue.shift()!
      this.statuses.set(job.jobId, 'cancelled')
      this.onStatus?.(job.jobId, 'cancelled')
    }
  }

  status(jobId: string): VisualAssetGenerationJobStatus | undefined {
    return this.statuses.get(jobId)
  }

  private pump(): void {
    while (this.running < this.concurrency && this.queue.length) {
      const job = this.queue.shift()!
      this.running++
      this.statuses.set(job.jobId, 'running')
      this.onStatus?.(job.jobId, 'running')
      void job.run()
        .catch(() => undefined)
        .finally(() => {
          this.running--
          this.statuses.set(job.jobId, 'completed')
          this.onStatus?.(job.jobId, 'completed')
          this.pump()
        })
    }
  }
}
