import type {
  EnvironmentVisualDesign,
  GameDesignEntity,
  GameDesignSpecification,
  VisualDesignSpecification,
  VisualMood,
  VisualTemperature,
} from '@genesis/shared'
import { resolveWorldSpatialMode } from '@genesis/shared'

export interface VisualDesignSpecificationBuilder {
  build(specification: GameDesignSpecification): VisualDesignSpecification
}

const THEME_RULES: ReadonlyArray<{
  readonly match: ReadonlyArray<string>
  readonly visualTheme: string
  readonly terrain: string
  readonly background: string
  readonly atmosphere: string
  readonly temperature: VisualTemperature
  readonly mood: VisualMood
}> = [
  { match: ['snow', 'ice', '冬', '雪', '冰'], visualTheme: 'snow-and-ice', terrain: 'ice platforms', background: 'snow mountains', atmosphere: 'cold and bright', temperature: 'cool', mood: 'bright' },
  { match: ['forest', 'wood', 'jungle', '森林', '丛林'], visualTheme: 'forest', terrain: 'natural ground', background: 'layered woodland', atmosphere: 'lush and grounded', temperature: 'warm', mood: 'bright' },
  { match: ['desert', 'sand', '沙漠'], visualTheme: 'desert', terrain: 'sandy platforms', background: 'open desert horizon', atmosphere: 'dry and sunlit', temperature: 'warm', mood: 'bright' },
  { match: ['cyber', 'neon', '赛博', '霓虹'], visualTheme: 'cyberpunk', terrain: 'modular city platforms', background: 'neon city layers', atmosphere: 'electric and high-contrast', temperature: 'cool', mood: 'neon' },
]

const DEFAULT_THEME = {
  visualTheme: 'classic-neutral',
  terrain: 'clear platform terrain',
  background: 'simple layered background',
  atmosphere: 'readable and adventurous',
  temperature: 'neutral' as VisualTemperature,
  mood: 'neutral' as VisualMood,
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

function resolveTheme(name?: string) {
  const sourceTheme = name?.trim() || 'none'
  const normalized = sourceTheme.toLocaleLowerCase()
  return THEME_RULES.find(rule => rule.match.some(token => normalized.includes(token))) ?? DEFAULT_THEME
}

function deriveVisualRole(entity: GameDesignEntity): string {
  const semanticRole = entity.role?.trim().toLocaleLowerCase()
  if (entity.category === 'player') return 'player character'
  if (semanticRole?.includes('boss')) return 'boss character'
  if (semanticRole?.includes('checkpoint')) return 'checkpoint marker'
  if (semanticRole?.includes('goal')) return 'goal marker'
  if (entity.category === 'enemy') return 'enemy creature'
  if (entity.category === 'terrain') return 'terrain element'
  if (entity.category === 'quest') return 'quest marker'
  if (entity.category === 'building') return 'world structure'
  if (entity.category === 'item') return 'collectible item'
  if (entity.category === 'npc') return 'supporting character'
  return 'world element'
}

function deriveVisualArchetype(entity: GameDesignEntity, visualRole: string): string {
  return entity.name.trim() || visualRole
}

function deriveEnvironment(
  theme: ReturnType<typeof resolveTheme>,
  worldSpatialMode: VisualDesignSpecification['worldSpatialMode'],
): EnvironmentVisualDesign {
  if (worldSpatialMode !== 'top-down') {
    return {
      terrain: theme.terrain,
      background: theme.background,
      atmosphere: theme.atmosphere,
    }
  }

  return {
    terrain: theme.terrain === DEFAULT_THEME.terrain
      ? 'continuous arena surface'
      : `${theme.terrain} arena surface`,
    background: theme.background === DEFAULT_THEME.background
      ? 'top-down environmental field'
      : `${theme.background} viewed from above`,
    atmosphere: theme.atmosphere === DEFAULT_THEME.atmosphere
      ? 'clear top-down arena atmosphere'
      : theme.atmosphere,
  }
}

export class DefaultVisualDesignSpecificationBuilder implements VisualDesignSpecificationBuilder {
  build(specification: GameDesignSpecification): VisualDesignSpecification {
    const sourceTheme = specification.theme?.name?.trim() || 'none'
    const theme = resolveTheme(specification.theme?.name)
    const worldSpatialMode = resolveWorldSpatialMode(specification.genre)
    const entities = specification.entities.map(entity => {
      const visualRole = deriveVisualRole(entity)
      return freeze({
        entityId: entity.id,
        category: entity.category,
        visualRole,
        visualArchetype: deriveVisualArchetype(entity, visualRole),
      })
    })

    return freeze({
      artDirection: 'stylized-2d',
      worldSpatialMode,
      theme: freeze({ sourceTheme, visualTheme: theme.visualTheme }),
      palette: freeze({
        temperature: theme.temperature,
        contrast: theme.mood === 'neon' ? 'high' : 'standard',
        mood: theme.mood,
      }),
      environment: freeze({
        ...deriveEnvironment(theme, worldSpatialMode),
      }),
      entities: Object.freeze(entities),
    })
  }
}
