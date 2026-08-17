import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Provider boundary for semantic world generation; providers never see Runtime or Renderer. */
export interface GameWorldGenerationProvider {
  generate(request: GameWorldGenerationRequest): Promise<GameWorldModel>
}
