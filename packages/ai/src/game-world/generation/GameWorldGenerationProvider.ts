import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'

/** Provider boundary for semantic world generation; providers never see Runtime or Renderer. */
export interface GameWorldGenerationProvider {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string } | undefined
  generate(request: GameWorldGenerationRequest): Promise<GameWorldModel>
  generateWithDiagnostics?(request: GameWorldGenerationRequest): Promise<GameWorldGenerationResult>
}
