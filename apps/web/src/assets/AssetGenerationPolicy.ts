import type {
  AssetRequirement,
  AssetSpecification,
  ImageGenerationRequest,
} from '@genesis/shared'

/** Player, enemies, and bosses are generated; props and environments stay static. */
export function isAiGenerationEligible(requirement: AssetRequirement): boolean {
  return requirement.kind === 'character' && (
    requirement.visualRole === 'player character' ||
    requirement.visualRole === 'enemy creature' ||
    requirement.visualRole === 'boss character'
  )
}

export function selectAiGenerationRequirement(specification: AssetSpecification): AssetRequirement | undefined {
  return specification.assets.find(isAiGenerationEligible)
}

export function selectAiGenerationRequirements(specification: AssetSpecification): readonly AssetRequirement[] {
  return specification.assets.filter(isAiGenerationEligible)
}

/** Stable semantic identity for one generated visual, independent of entity/index/provider. */
export function visualGenerationIdentity(specification: AssetSpecification, requirement: AssetRequirement): string {
  return JSON.stringify({
    kind: requirement.kind,
    visualRole: requirement.visualRole,
    subject: requirement.subject,
    context: specification.visualContext,
  })
}

export function groupAiGenerationRequirements(
  specification: AssetSpecification,
): readonly (readonly [AssetRequirement, readonly AssetRequirement[]])[] {
  const groups = new Map<string, AssetRequirement[]>()
  for (const requirement of selectAiGenerationRequirements(specification)) {
    const key = visualGenerationIdentity(specification, requirement)
    const group = groups.get(key) ?? []
    group.push(requirement)
    groups.set(key, group)
  }
  return [...groups.values()].map(group => [group[0], Object.freeze(group)] as const)
}

export function buildImageGenerationRequest(
  specification: AssetSpecification,
  requirement: AssetRequirement,
): ImageGenerationRequest {
  return {
    assetId: requirement.id,
    ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
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
