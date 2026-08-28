import type {
  AssetRequirement,
  AssetRenderUsage,
  AssetSpecification,
  ImageGenerationContext,
  ImageGenerationRequest,
  WorldSpatialMode,
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
    presentationState: requirement.presentationState ?? null,
    presentationFrame: requirement.presentationFrame ?? null,
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

const RENDER_USAGE_PROMPTS: Readonly<Record<AssetRenderUsage, string>> = Object.freeze({
  'entity-sprite': 'isolated game entity sprite; transparent background; no scenery; no ground; no text; no UI',
  'background-cover': 'distant background scenery only; sky, clouds, mountains, or distant vegetation; no playable ground; no platform; no foreground character; no text; no UI',
  'ground-repeat-x': 'seamless repeatable side-view ground surface material; horizontal repeat intent; no sky; no clouds; no distant scenery; no platform layout; no character; no text; no UI',
  'arena-fill': 'continuous top-down arena environment surface; repeatable across X and Y; no horizon; no sky; no clouds; no side-view scenery; no platform strip; no character; no text; no UI',
})

function renderUsagePrompt(
  requirement: AssetRequirement,
  worldSpatialMode: WorldSpatialMode = 'side-view',
): string {
  if (requirement.renderUsage === 'background-cover' && worldSpatialMode === 'top-down') {
    return 'top-down environment background; ambient field viewed from above; no horizon; no sky; no side-view scenery; no playable foreground geometry; no character; no text; no UI'
  }
  return requirement.renderUsage
    ? RENDER_USAGE_PROMPTS[requirement.renderUsage]
    : requirement.kind === 'background'
      ? 'wide game environment background; no text; no UI; no foreground character'
      : requirement.kind === 'terrain'
        ? 'reusable platform terrain texture; no level layout; no text'
        : requirement.kind === 'prop'
          ? 'reusable game prop artwork'
          : 'game character artwork'
}

export function buildImageGenerationRequest(
  specification: AssetSpecification,
  requirement: AssetRequirement,
  generationContext?: ImageGenerationContext,
): ImageGenerationRequest {
  const prompt = generationContext ? buildContextualImagePrompt(requirement, generationContext) : [
    requirement.subject,
    requirement.visualRole,
    requirement.presentationState ? `${requirement.presentationState} presentation pose` : undefined,
    requirement.presentationFrame !== undefined ? `animation frame ${requirement.presentationFrame + 1} of 2` : undefined,
    renderUsagePrompt(requirement, specification.visualContext.worldSpatialMode),
  ].filter(Boolean).join('; ')
  return Object.freeze({
    assetId: requirement.id,
    ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
    ...(requirement.presentationState ? { presentationState: requirement.presentationState } : {}),
    ...(requirement.presentationFrame !== undefined ? { presentationFrame: requirement.presentationFrame } : {}),
    mode: 'text-to-image',
    prompt,
    subject: requirement.subject,
    ...(requirement.visualArchetype ? { visualArchetype: requirement.visualArchetype } : {}),
    ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
    visualContext: specification.visualContext,
    ...(generationContext ? { generationContext } : {}),
    constraints: {
      assetKind: requirement.kind,
      ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
      view: requirement.technicalProfile.view,
      transparentBackground: requirement.technicalProfile.transparentBackground,
      ...(requirement.kind === 'background' ? { preferredAspectRatio: 16 / 9 } : {}),
    },
  })
}

function buildContextualImagePrompt(
  requirement: AssetRequirement,
  context: ImageGenerationContext,
): string {
  const references = context.references.map(reference => reference.visualArchetype ?? reference.subject).join(', ')
  return [
    'GAME CONTEXT',
    context.game.worldType ? `world type: ${context.game.worldType}` : undefined,
    context.game.theme ? `current theme: ${context.game.theme}` : undefined,
    context.game.timeOfDay ? `time of day: ${context.game.timeOfDay}` : undefined,
    'VISUAL CONTEXT',
    `art direction: ${context.visual.artDirection}`,
    context.visual.worldSpatialMode ? `world spatial mode: ${context.visual.worldSpatialMode}` : undefined,
    `theme: ${context.visual.theme.sourceTheme}; visual theme: ${context.visual.theme.visualTheme}`,
    `palette: ${context.visual.palette.temperature}, ${context.visual.palette.contrast}, ${context.visual.palette.mood}`,
    'TARGET ASSET',
    `subject: ${context.asset.subject}`,
    context.asset.visualRole ? `role: ${context.asset.visualRole}` : undefined,
    context.asset.visualArchetype ? `archetype: ${context.asset.visualArchetype}` : undefined,
    context.asset.presentationState ? `presentation state: ${context.asset.presentationState}` : undefined,
    context.asset.presentationFrame !== undefined ? `animation frame: ${context.asset.presentationFrame + 1} of 2` : undefined,
    `kind: ${context.asset.kind}`,
    context.visual.environment
      ? `environment: ${context.visual.environment.background}; ${context.visual.environment.terrain}; ${context.visual.environment.atmosphere}`
      : undefined,
    references ? `metadata-only visual neighbors: ${references}` : undefined,
    'CONSTRAINTS',
    context.asset.technicalProfile.view ? `view: ${context.asset.technicalProfile.view}` : undefined,
    context.asset.technicalProfile.transparentBackground ? 'isolated subject, transparent background' : undefined,
    renderUsagePrompt(requirement, context.visual.worldSpatialMode),
    'no text, no logos',
  ].filter((value): value is string => Boolean(value)).join('\n')
}
