import type {
  AssetRequirement,
  AssetSpecification,
  ImageGenerationRequest,
} from '@genesis/shared'

/** Meaningful semantic assets are eligible; technical markers remain static-only. */
export function isAiGenerationEligible(requirement: AssetRequirement): boolean {
  if (requirement.target === 'environment') return requirement.kind === 'background' || requirement.kind === 'terrain'
  if (requirement.kind === 'character') return true
  if (requirement.kind === 'prop') return requirement.visualRole !== 'checkpoint marker' && requirement.visualRole !== 'goal marker'
  return false
}

export function selectAiGenerationRequirement(specification: AssetSpecification): AssetRequirement | undefined {
  return specification.assets.find(isAiGenerationEligible)
}

export function selectAiGenerationRequirements(specification: AssetSpecification): readonly AssetRequirement[] {
  const priority: Record<string, number> = { background: 0, terrain: 1, character: 2 }
  return specification.assets.filter(isAiGenerationEligible).sort((a, b) => (priority[a.kind] ?? 9) - (priority[b.kind] ?? 9))
}

/** Stable semantic identity for one generated visual, independent of entity/index/provider. */
export function visualGenerationIdentity(specification: AssetSpecification, requirement: AssetRequirement): string {
  return JSON.stringify({
    kind: requirement.kind,
    archetype: requirement.visualArchetype ?? requirement.subject ?? requirement.visualRole,
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
    prompt: [requirement.subject, requirement.visualRole, requirement.kind === 'background' ? 'wide game environment background; no text; no UI; no foreground character' : requirement.kind === 'terrain' ? 'reusable platform terrain texture; no level layout; no text' : requirement.kind === 'prop' ? 'reusable game prop artwork' : 'game character artwork'].filter(Boolean).join('; '),
    subject: requirement.subject,
    ...(requirement.visualArchetype ? { visualArchetype: requirement.visualArchetype } : {}),
    visualContext: specification.visualContext,
    constraints: {
      assetKind: requirement.kind,
      view: requirement.technicalProfile.view,
      transparentBackground: requirement.technicalProfile.transparentBackground,
      ...(requirement.kind === 'background' ? { preferredAspectRatio: 16 / 9 } : {}),
    },
  }
}
