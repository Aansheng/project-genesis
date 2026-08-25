import type {
  AssetKind,
  AssetRequirement,
  AssetSpecification,
  AssetTarget,
  AssetVisualState,
  VisualDesignSpecification,
} from '@genesis/shared'

export interface AssetSpecificationBuilder {
  build(specification: VisualDesignSpecification): AssetSpecification
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

function entityAssetKind(visualRole: string, category: string): AssetKind {
  if (category === 'item') return 'prop'
  if (category === 'quest' || category === 'building' || visualRole.includes('marker')) return 'prop'
  if (category === 'player' || category === 'enemy' || category === 'npc' || visualRole.includes('character')) return 'character'
  // Entity terrain (trees, rocks, resources) is a renderable prop; only the
  // generated environment requirement below uses the terrain kind.
  if (category === 'terrain') return 'prop'
  return 'prop'
}

function entityStates(kind: AssetKind, category: string): readonly AssetVisualState[] {
  if (kind !== 'character') return Object.freeze([])
  if (category === 'player') return Object.freeze<AssetVisualState[]>(['idle', 'run', 'jump'])
  return Object.freeze<AssetVisualState[]>(['idle'])
}

function entitySubject(visualRole: string, kind: AssetKind, visualArchetype?: string): string {
  if (visualArchetype?.trim() && (kind === 'character' || kind === 'prop')) return visualArchetype
  if (kind === 'character') return visualRole
  if (kind === 'terrain') return visualRole === 'terrain element' ? 'themed platform terrain' : visualRole
  if (kind === 'icon') return visualRole
  return visualRole
}

function createUniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  const id = `${base}-${suffix}`
  used.add(id)
  return id
}

function createEntityRequirement(
  entity: VisualDesignSpecification['entities'][number],
  usedIds: Set<string>,
): AssetRequirement {
  const kind = entityAssetKind(entity.visualRole, entity.category)
  return freeze({
    id: createUniqueId(`entity-${entity.entityId}-primary`, usedIds),
    kind,
    target: 'entity' as AssetTarget,
    entityId: entity.entityId,
    visualArchetype: entity.visualArchetype,
    subject: entitySubject(entity.visualRole, kind, entity.visualArchetype),
    visualRole: entity.visualRole,
    renderUsage: 'entity-sprite',
    requiredStates: entityStates(kind, entity.category),
    technicalProfile: freeze({ transparentBackground: true, view: 'side' }),
  })
}

export class DefaultAssetSpecificationBuilder implements AssetSpecificationBuilder {
  build(specification: VisualDesignSpecification): AssetSpecification {
    const usedIds = new Set<string>()
    const entityAssets = specification.entities.flatMap(entity => {
      const primary = createEntityRequirement(entity, usedIds)
      return entity.category === 'player'
        ? primary.requiredStates.map(state => freeze({ ...primary, id: createUniqueId(`entity-${entity.entityId}-${state}`, usedIds), presentationState: state }))
        : [primary]
    })
    const terrain = freeze<AssetRequirement>({
      id: createUniqueId('terrain-main', usedIds),
      kind: 'terrain',
      target: 'environment',
      subject: specification.environment.terrain,
      visualRole: 'ground terrain',
      renderUsage: 'ground-repeat-x',
      requiredStates: Object.freeze([]),
      technicalProfile: freeze({ transparentBackground: false, view: 'side' }),
    })
    const background = freeze<AssetRequirement>({
      id: createUniqueId('background-main', usedIds),
      kind: 'background',
      target: 'environment',
      subject: specification.environment.background,
      visualRole: 'scene background',
      renderUsage: 'background-cover',
      requiredStates: Object.freeze([]),
      technicalProfile: freeze({ transparentBackground: false, view: 'side' }),
    })
    const visualContext = freeze({
      artDirection: specification.artDirection,
      theme: freeze({ ...specification.theme }),
      palette: freeze({ ...specification.palette }),
    })

    return freeze({
      visualContext,
      assets: Object.freeze([...entityAssets, terrain, background]),
    })
  }
}
