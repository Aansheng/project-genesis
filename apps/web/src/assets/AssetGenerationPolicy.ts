import type {
  AssetRequirement,
  AssetSpecification,
  ImageGenerationRequest,
} from '@genesis/shared'

/** First production slice: only the player character may trigger generation. */
export function isAiGenerationEligible(requirement: AssetRequirement): boolean {
  return requirement.kind === 'character' && requirement.visualRole === 'player character'
}

export function selectAiGenerationRequirement(specification: AssetSpecification): AssetRequirement | undefined {
  return specification.assets.find(isAiGenerationEligible)
}

export function buildImageGenerationRequest(
  specification: AssetSpecification,
  requirement: AssetRequirement,
): ImageGenerationRequest {
  return {
    assetId: requirement.id,
    mode: 'text-to-image',
    prompt: [requirement.subject, requirement.visualRole].filter(Boolean).join('; '),
    subject: requirement.subject,
    visualContext: specification.visualContext,
    constraints: {
      assetKind: requirement.kind,
      view: requirement.technicalProfile.view,
      transparentBackground: requirement.technicalProfile.transparentBackground,
    },
  }
}
