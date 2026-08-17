import type { World } from '@genesis/shared'

export interface RuntimeWorldSource {
  getWorld(): World
}

export interface ObservatoryRuntimeTarget {
  loadRuntimeWorld(world: World): void
  loadGenerationTrace?(trace: unknown): void
}

/** Thin binding from the authoritative RuntimeWorldStore to Observatory data. */
export class ObservatoryRuntimeBinding {
  constructor(
    private readonly source: RuntimeWorldSource,
    private readonly target: ObservatoryRuntimeTarget,
  ) {}

  sync(): void {
    this.target.loadRuntimeWorld(this.source.getWorld())
  }

  syncGenerationTrace(trace: unknown): void {
    this.target.loadGenerationTrace?.(trace)
  }
}
