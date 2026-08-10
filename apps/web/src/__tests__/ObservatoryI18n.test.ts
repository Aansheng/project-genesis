import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import {
  createI18n,
  resolveKey,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type Language,
  type MessageCatalog,
} from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'
import { useI18nStore, useI18n } from '../stores/i18n'
import { useObservatoryStore } from '../stores/observatory'
import type { ObservatoryPanel } from '../stores/observatory'
import ObservatoryHeader from '../components/observatory/ObservatoryHeader.vue'
import ObservatorySidebar from '../components/observatory/ObservatorySidebar.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryShell from '../components/observatory/ObservatoryShell.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountHeader(): VueWrapper {
  return mount(ObservatoryHeader)
}

function mountSidebar(): VueWrapper {
  return mount(ObservatorySidebar)
}

function mountContentAs(panel: ObservatoryPanel): VueWrapper {
  useObservatoryStore().selectPanel(panel)
  return mount(ObservatoryContent)
}

function mountOverview(): VueWrapper {
  return mount(ObservatoryOverview)
}

function mountShell(): VueWrapper {
  return mount(ObservatoryShell)
}

function sidebarLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll('button.sidebar-button').map((b) => b.text())
}

function contentCardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.card-title').map((c) => c.text().trim())
}

async function switchLanguage(wrapper: VueWrapper, lang: Language): Promise<void> {
  await wrapper.find('select.locale-select').setValue(lang)
  await nextTick()
}

// ---------------------------------------------------------------------------
// Locale catalogs
// ---------------------------------------------------------------------------

describe('i18n — locale catalogs', () => {
  it('loads the zh-CN catalog', () => {
    expect(zhCN).toBeDefined()
  })

  it('loads the en-US catalog', () => {
    expect(enUS).toBeDefined()
  })

  it('zh-CN contains the observatory title', () => {
    expect(resolveKey(zhCN, 'observatory.title')).toBe('可观测中心')
  })

  it('en-US contains the observatory title', () => {
    expect(resolveKey(enUS, 'observatory.title')).toBe('Observatory')
  })

  it('zh-CN contains all 9 required panel keys', () => {
    for (const key of [
      'overview',
      'trace',
      'timeline',
      'history',
      'diff',
      'runtime',
      'eventstream',
      'tracegraph',
      'worldgraph',
    ]) {
      expect(resolveKey(zhCN, `observatory.panels.${key}`)).toBeDefined()
    }
  })

  it('en-US contains all 9 required panel keys', () => {
    for (const key of [
      'overview',
      'trace',
      'timeline',
      'history',
      'diff',
      'runtime',
      'eventstream',
      'tracegraph',
      'worldgraph',
    ]) {
      expect(resolveKey(enUS, `observatory.panels.${key}`)).toBeDefined()
    }
  })

  it('zh-CN contains the settings panel key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.settings')).toBe('设置')
  })

  it('zh-CN contains the tracegraph panel key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.tracegraph')).toBe('执行图谱')
  })

  it('en-US contains the tracegraph panel key', () => {
    expect(resolveKey(enUS, 'observatory.panels.tracegraph')).toBe('Trace Graph')
  })

  it('zh-CN contains the worldgraph panel key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.worldgraph')).toBe('世界图谱')
  })

  it('en-US contains the worldgraph panel key', () => {
    expect(resolveKey(enUS, 'observatory.panels.worldgraph')).toBe('World Graph')
  })

  it('both catalogs contain the ready status key', () => {
    expect(resolveKey(zhCN, 'observatory.status.ready')).toBe('就绪')
    expect(resolveKey(enUS, 'observatory.status.ready')).toBe('Ready')
  })

  it('both catalogs contain the version / sprint label keys', () => {
    expect(resolveKey(zhCN, 'observatory.labels.version')).toBe('版本')
    expect(resolveKey(zhCN, 'observatory.labels.sprint')).toBe('迭代')
    expect(resolveKey(enUS, 'observatory.labels.version')).toBe('Version')
    expect(resolveKey(enUS, 'observatory.labels.sprint')).toBe('Sprint')
  })

  it('zh-CN translates every panel key to Chinese', () => {
    expect(resolveKey(zhCN, 'observatory.panels.overview')).toBe('概览')
    expect(resolveKey(zhCN, 'observatory.panels.trace')).toBe('追踪')
    expect(resolveKey(zhCN, 'observatory.panels.timeline')).toBe('时间线')
    expect(resolveKey(zhCN, 'observatory.panels.history')).toBe('历史记录')
    expect(resolveKey(zhCN, 'observatory.panels.diff')).toBe('差异分析')
    expect(resolveKey(zhCN, 'observatory.panels.runtime')).toBe('运行时')
    expect(resolveKey(zhCN, 'observatory.panels.eventstream')).toBe('事件流')
  })

  it('en-US translates every panel key to English', () => {
    expect(resolveKey(enUS, 'observatory.panels.overview')).toBe('Overview')
    expect(resolveKey(enUS, 'observatory.panels.trace')).toBe('Trace')
    expect(resolveKey(enUS, 'observatory.panels.timeline')).toBe('Timeline')
    expect(resolveKey(enUS, 'observatory.panels.history')).toBe('History')
    expect(resolveKey(enUS, 'observatory.panels.diff')).toBe('Diff')
    expect(resolveKey(enUS, 'observatory.panels.runtime')).toBe('Runtime')
    expect(resolveKey(enUS, 'observatory.panels.eventstream')).toBe(
      'Event Stream',
    )
  })

  it('zh-CN contains the overview section titles', () => {
    expect(resolveKey(zhCN, 'observatory.sections.artifactSummary')).toBe('工件概览')
    expect(resolveKey(zhCN, 'observatory.sections.observatorySnapshot')).toBe(
      '可观测中心快照',
    )
    expect(resolveKey(zhCN, 'observatory.sections.systemStatus')).toBe('系统状态')
  })

  it('zh-CN contains the runtime stat and property keys', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.entities')).toBe('实体')
    expect(resolveKey(zhCN, 'observatory.runtime.systems')).toBe('系统')
    expect(resolveKey(zhCN, 'observatory.runtime.events')).toBe('事件')
    expect(resolveKey(zhCN, 'observatory.runtime.fps')).toBe('运行帧率')
    expect(resolveKey(zhCN, 'observatory.runtime.position')).toBe('位置')
    expect(resolveKey(zhCN, 'observatory.runtime.state')).toBe('状态')
    expect(resolveKey(zhCN, 'observatory.runtime.health')).toBe('生命值')
  })

  it('en-US contains the runtime stat and property keys', () => {
    expect(resolveKey(enUS, 'observatory.runtime.entities')).toBe('Entities')
    expect(resolveKey(enUS, 'observatory.runtime.systems')).toBe('Systems')
    expect(resolveKey(enUS, 'observatory.runtime.events')).toBe('Events')
    expect(resolveKey(enUS, 'observatory.runtime.fps')).toBe('FPS')
    expect(resolveKey(enUS, 'observatory.runtime.position')).toBe('Position')
    expect(resolveKey(enUS, 'observatory.runtime.state')).toBe('State')
    expect(resolveKey(enUS, 'observatory.runtime.health')).toBe('Health')
  })

  it('zh-CN contains the runtime inspector keys', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.inspector')).toBe('实体检查器')
    expect(resolveKey(zhCN, 'observatory.runtime.components')).toBe('组件')
    expect(resolveKey(zhCN, 'observatory.runtime.componentCount')).toBe('组件数量')
  })

  it('en-US contains the runtime inspector keys', () => {
    expect(resolveKey(enUS, 'observatory.runtime.inspector')).toBe('Entity Inspector')
    expect(resolveKey(enUS, 'observatory.runtime.components')).toBe('Components')
    expect(resolveKey(enUS, 'observatory.runtime.componentCount')).toBe('Component Count')
  })

  it('zh-CN contains the event stream panel key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.eventstream')).toBe('事件流')
  })

  it('en-US contains the event stream panel key', () => {
    expect(resolveKey(enUS, 'observatory.panels.eventstream')).toBe(
      'Event Stream',
    )
  })

  it('zh-CN contains the graph keys', () => {
    expect(resolveKey(zhCN, 'observatory.graph.title')).toBe('执行图谱')
    expect(resolveKey(zhCN, 'observatory.graph.legend')).toBe('图例')
    expect(resolveKey(zhCN, 'observatory.graph.completed')).toBe('已完成')
    expect(resolveKey(zhCN, 'observatory.graph.pending')).toBe('进行中')
    expect(resolveKey(zhCN, 'observatory.graph.failed')).toBe('失败')
  })

  it('en-US contains the graph keys', () => {
    expect(resolveKey(enUS, 'observatory.graph.title')).toBe('Trace Graph')
    expect(resolveKey(enUS, 'observatory.graph.legend')).toBe('Legend')
    expect(resolveKey(enUS, 'observatory.graph.completed')).toBe('Completed')
    expect(resolveKey(enUS, 'observatory.graph.pending')).toBe('Pending')
    expect(resolveKey(enUS, 'observatory.graph.failed')).toBe('Failed')
  })

  it('zh-CN contains the world graph keys', () => {
    expect(resolveKey(zhCN, 'observatory.world.title')).toBe('世界图谱')
    expect(resolveKey(zhCN, 'observatory.world.legend')).toBe('图例')
    expect(resolveKey(zhCN, 'observatory.world.world')).toBe('世界')
    expect(resolveKey(zhCN, 'observatory.world.location')).toBe('地点')
    expect(resolveKey(zhCN, 'observatory.world.npc')).toBe('NPC')
    expect(resolveKey(zhCN, 'observatory.world.quest')).toBe('任务')
    expect(resolveKey(zhCN, 'observatory.world.active')).toBe('活跃')
    expect(resolveKey(zhCN, 'observatory.world.inactive')).toBe('非活跃')
  })

  it('en-US contains the world graph keys', () => {
    expect(resolveKey(enUS, 'observatory.world.title')).toBe('World Graph')
    expect(resolveKey(enUS, 'observatory.world.legend')).toBe('Legend')
    expect(resolveKey(enUS, 'observatory.world.world')).toBe('World')
    expect(resolveKey(enUS, 'observatory.world.location')).toBe('Location')
    expect(resolveKey(enUS, 'observatory.world.npc')).toBe('NPC')
    expect(resolveKey(enUS, 'observatory.world.quest')).toBe('Quest')
    expect(resolveKey(enUS, 'observatory.world.active')).toBe('Active')
    expect(resolveKey(enUS, 'observatory.world.inactive')).toBe('Inactive')
  })

  it('zh-CN contains the events keys', () => {
    expect(resolveKey(zhCN, 'observatory.events.title')).toBe('事件流')
    expect(resolveKey(zhCN, 'observatory.events.all')).toBe('全部')
    expect(resolveKey(zhCN, 'observatory.events.info')).toBe('信息')
    expect(resolveKey(zhCN, 'observatory.events.warning')).toBe('警告')
    expect(resolveKey(zhCN, 'observatory.events.error')).toBe('错误')
    expect(resolveKey(zhCN, 'observatory.events.source')).toBe('来源')
    expect(resolveKey(zhCN, 'observatory.events.timestamp')).toBe('时间')
    expect(resolveKey(zhCN, 'observatory.events.message')).toBe('消息')
  })

  it('en-US contains the events keys', () => {
    expect(resolveKey(enUS, 'observatory.events.title')).toBe('Event Stream')
    expect(resolveKey(enUS, 'observatory.events.all')).toBe('All')
    expect(resolveKey(enUS, 'observatory.events.info')).toBe('Info')
    expect(resolveKey(enUS, 'observatory.events.warning')).toBe('Warning')
    expect(resolveKey(enUS, 'observatory.events.error')).toBe('Error')
    expect(resolveKey(enUS, 'observatory.events.source')).toBe('Source')
    expect(resolveKey(enUS, 'observatory.events.timestamp')).toBe('Timestamp')
    expect(resolveKey(enUS, 'observatory.events.message')).toBe('Message')
  })

  it('catalogs have matching key parity', () => {
    const required = [
      'observatory.title',
      'observatory.panels.overview',
      'observatory.panels.trace',
      'observatory.panels.timeline',
      'observatory.panels.history',
      'observatory.panels.diff',
      'observatory.panels.runtime',
      'observatory.panels.eventstream',
      'observatory.panels.settings',
      'observatory.status.ready',
      'observatory.labels.version',
      'observatory.labels.sprint',
      'observatory.labels.status',
      'observatory.labels.count',
      'observatory.labels.active',
      'observatory.labels.comingSoon',
      'observatory.sections.artifactSummary',
      'observatory.sections.observatorySnapshot',
      'observatory.sections.systemStatus',
      'observatory.artifacts.traceDesc',
      'observatory.artifacts.timelineDesc',
      'observatory.artifacts.historyDesc',
      'observatory.snapshot.artifactCount',
      'observatory.snapshot.hasTrace',
      'observatory.snapshot.hasTimeline',
      'observatory.snapshot.hasHistory',
      'observatory.snapshot.hasTraceSnapshot',
      'observatory.snapshot.hasTimelineSnapshot',
      'observatory.snapshot.hasHistorySnapshot',
      'observatory.common.yes',
      'observatory.common.no',
      'observatory.runtime.entities',
      'observatory.runtime.systems',
      'observatory.runtime.events',
      'observatory.runtime.fps',
      'observatory.runtime.position',
      'observatory.runtime.state',
      'observatory.runtime.health',
      'observatory.runtime.inspector',
      'observatory.runtime.components',
      'observatory.runtime.componentCount',
      'observatory.graph.title',
      'observatory.graph.legend',
      'observatory.graph.completed',
      'observatory.graph.pending',
      'observatory.graph.failed',
      'observatory.events.title',
      'observatory.events.all',
      'observatory.events.info',
      'observatory.events.warning',
      'observatory.events.error',
      'observatory.events.source',
      'observatory.events.timestamp',
      'observatory.events.message',
      'observatory.world.title',
      'observatory.world.legend',
      'observatory.world.world',
      'observatory.world.location',
      'observatory.world.npc',
      'observatory.world.quest',
      'observatory.world.active',
      'observatory.world.inactive',
      'observatory.panels.worldgraph',
      'observatory.labels.types',
    ]
    for (const key of required) {
      expect(resolveKey(zhCN, key), `zh key ${key}`).toBeDefined()
      expect(resolveKey(enUS, key), `en key ${key}`).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// resolveKey
// ---------------------------------------------------------------------------

describe('i18n — resolveKey', () => {
  it('resolves a top-level string key', () => {
    expect(resolveKey(zhCN, 'observatory.title')).toBe('可观测中心')
  })

  it('resolves a two-level nested key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.overview')).toBe('概览')
  })

  it('resolves a three-level nested key', () => {
    expect(resolveKey(zhCN, 'observatory.artifacts.traceDesc')).toBe(
      '捕获的提示词组装追踪',
    )
  })

  it('returns undefined for a missing top-level key', () => {
    expect(resolveKey(zhCN, 'missing')).toBeUndefined()
  })

  it('returns undefined for a missing nested key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.unknown')).toBeUndefined()
  })

  it('returns undefined for a missing deep branch', () => {
    expect(resolveKey(zhCN, 'observatory.missing.deep')).toBeUndefined()
  })

  it('returns undefined for an empty key', () => {
    expect(resolveKey(zhCN, '')).toBeUndefined()
  })

  it('returns undefined when traversing through a non-object leaf', () => {
    expect(resolveKey(zhCN, 'observatory.title.nested')).toBeUndefined()
  })

  it('returns undefined for a non-string leaf (boolean)', () => {
    const catalog: MessageCatalog = { flag: { on: true } }
    expect(resolveKey(catalog, 'flag.on')).toBeUndefined()
  })

  it('is case-sensitive', () => {
    expect(resolveKey(zhCN, 'Observatory.Title')).toBeUndefined()
    expect(resolveKey(zhCN, 'observatory.title')).toBe('可观测中心')
  })

  it('returns undefined for a trailing dot', () => {
    expect(resolveKey(zhCN, 'observatory.title.')).toBeUndefined()
  })

  it('returns undefined for a leading dot', () => {
    expect(resolveKey(zhCN, '.observatory.title')).toBeUndefined()
  })

  it('works with arbitrary catalogs', () => {
    const catalog: MessageCatalog = { a: { b: { c: 'value' } } }
    expect(resolveKey(catalog, 'a.b.c')).toBe('value')
  })

  it('does not descend into arrays', () => {
    const catalog: MessageCatalog = { a: ['x', 'y'] }
    expect(resolveKey(catalog, 'a.0')).toBeUndefined()
  })

  it('handles keys with many segments', () => {
    expect(
      resolveKey(zhCN, 'observatory.snapshot.hasTimelineSnapshot'),
    ).toBe('有时间线快照')
  })
})

// ---------------------------------------------------------------------------
// createI18n (standalone)
// ---------------------------------------------------------------------------

describe('i18n — createI18n', () => {
  it('defaults to zh-CN', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.language).toBe('zh-CN')
  })

  it('accepts an initial language', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS }, 'en-US')
    expect(i18n.language).toBe('en-US')
  })

  it('exposes the current language', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS }, 'en-US')
    expect(i18n.language).toBe('en-US')
  })

  it('setLanguage switches the language', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    i18n.setLanguage('en-US')
    expect(i18n.language).toBe('en-US')
  })

  it('setLanguage ignores unsupported languages', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    i18n.setLanguage('fr-FR' as Language)
    expect(i18n.language).toBe('zh-CN')
  })

  it('t resolves nested keys', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.t('observatory.panels.overview')).toBe('概览')
  })

  it('t falls back to the key string when missing', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.t('observatory.missing')).toBe('observatory.missing')
  })

  it('t falls back to the key string for a missing nested key', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.t('observatory.panels.unknown')).toBe('observatory.panels.unknown')
  })

  it('t returns an empty string for an empty key', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.t('')).toBe('')
  })

  it('t never throws for malformed keys', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(() => i18n.t('a..b.')).not.toThrow()
  })

  it('t reflects a language switch', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.t('observatory.title')).toBe('可观测中心')
    i18n.setLanguage('en-US')
    expect(i18n.t('observatory.title')).toBe('Observatory')
  })

  it('has returns true for existing keys', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.has('observatory.title')).toBe(true)
  })

  it('has returns false for missing keys', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.has('observatory.nope')).toBe(false)
  })

  it('has reflects the active language', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    expect(i18n.has('observatory.common.yes')).toBe(true)
  })

  it('instances are isolated from each other', () => {
    const a = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    const b = createI18n({ 'zh-CN': zhCN, 'en-US': enUS })
    a.setLanguage('en-US')
    expect(b.language).toBe('zh-CN')
    expect(b.t('observatory.title')).toBe('可观测中心')
  })

  it('t picks the catalog of the current language', () => {
    const i18n = createI18n({ 'zh-CN': zhCN, 'en-US': enUS }, 'en-US')
    expect(i18n.t('observatory.status.ready')).toBe('Ready')
  })

  it('exposes the default language constant', () => {
    expect(DEFAULT_LANGUAGE).toBe('zh-CN')
  })

  it('exposes the supported language list', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['zh-CN', 'en-US'])
  })
})

// ---------------------------------------------------------------------------
// i18n store
// ---------------------------------------------------------------------------

describe('i18n — store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('defaults language to zh-CN', () => {
    expect(useI18nStore().language).toBe('zh-CN')
  })

  it('updates language with setLanguage', () => {
    const store = useI18nStore()
    store.setLanguage('en-US')
    expect(store.language).toBe('en-US')
  })

  it('ignores unsupported languages', () => {
    const store = useI18nStore()
    store.setLanguage('fr-FR' as Language)
    expect(store.language).toBe('zh-CN')
  })

  it('t returns the zh-CN translation by default', () => {
    expect(useI18nStore().t('observatory.title')).toBe('可观测中心')
  })

  it('t returns the en-US translation after switching', () => {
    const store = useI18nStore()
    store.setLanguage('en-US')
    expect(store.t('observatory.title')).toBe('Observatory')
  })

  it('t falls back to the key string when missing', () => {
    expect(useI18nStore().t('observatory.nope')).toBe('observatory.nope')
  })

  it('t resolves nested keys', () => {
    expect(useI18nStore().t('observatory.panels.diff')).toBe('差异分析')
  })

  it('language is reactive state', () => {
    const store = useI18nStore()
    expect(store.language).toBe('zh-CN')
    store.setLanguage('en-US')
    expect(store.language).toBe('en-US')
    store.setLanguage('zh-CN')
    expect(store.language).toBe('zh-CN')
  })

  it('switching back to zh-CN restores Chinese translations', () => {
    const store = useI18nStore()
    store.setLanguage('en-US')
    store.setLanguage('zh-CN')
    expect(store.t('observatory.status.ready')).toBe('就绪')
  })

  it('useI18n is the same store as useI18nStore', () => {
    expect(useI18n).toBe(useI18nStore)
  })

  it('each fresh pinia instance resets to zh-CN', () => {
    const first = useI18nStore()
    first.setLanguage('en-US')
    setActivePinia(createPinia())
    expect(useI18nStore().language).toBe('zh-CN')
  })
})

// ---------------------------------------------------------------------------
// zh-CN rendering (default)
// ---------------------------------------------------------------------------

describe('i18n — zh-CN rendering (default)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the observatory title in Chinese', () => {
    expect(mountHeader().find('.header-title').text()).toBe('可观测中心')
  })

  it('renders the status badge as 就绪', () => {
    expect(mountHeader().find('.header-badge').text()).toContain('就绪')
  })

  it('renders the sprint label as 迭代 6', () => {
    expect(mountHeader().find('.header-sprint').text()).toBe('迭代 6')
  })

  it('renders the version aria label in Chinese', () => {
    expect(mountHeader().find('.header-version').attributes('aria-label')).toBe(
      '版本',
    )
  })

  it('renders the version value unchanged', () => {
    expect(mountHeader().find('.header-version').text()).toBe('v1.29')
  })

  it('renders sidebar labels in Chinese', () => {
    expect(sidebarLabels(mountSidebar())).toEqual([
      '概览',
      '追踪',
      '时间线',
      '历史记录',
      '差异分析',
      '运行时',
      '事件流',
      '执行图谱',
      '世界图谱',
      '设置',
    ])
  })

  it('renders a Chinese switcher as the current language', () => {
    const wrapper = mountHeader()
    const select = wrapper.find('select.locale-select').element as HTMLSelectElement
    expect(select.value).toBe('zh-CN')
    expect(wrapper.find('option[value="zh-CN"]').text()).toBe('中文')
  })

  it('renders content placeholder cards in Chinese', () => {
    const wrapper = mountContentAs('Settings')
    expect(contentCardTitles(wrapper)).toEqual([
      '概览',
      '追踪',
      '时间线',
      '历史记录',
      '差异分析',
      '运行时',
    ])
  })

  it('renders the Coming Soon placeholder in Chinese', () => {
    const wrapper = mountContentAs('Settings')
    expect(wrapper.find('.card-body').text()).toBe('即将推出')
  })

  it('does not render an Active tag for the Settings grid', () => {
    const wrapper = mountContentAs('Settings')
    expect(wrapper.find('.card-active-tag').exists()).toBe(false)
  })

  it('renders artifact summary section title in Chinese', () => {
    expect(mountOverview().text()).toContain('工件概览')
  })

  it('renders observatory snapshot section title in Chinese', () => {
    expect(mountOverview().text()).toContain('可观测中心快照')
  })

  it('renders system status section title in Chinese', () => {
    expect(mountOverview().text()).toContain('系统状态')
  })

  it('renders artifact titles in Chinese', () => {
    const wrapper = mountOverview()
    const titles = wrapper
      .findAll('.artifact-card-title')
      .map((el) => el.text().trim())
    expect(titles).toEqual(['追踪', '时间线', '历史记录'])
  })

  it('renders the artifact count label in Chinese', () => {
    expect(mountOverview().find('.artifact-card-label').text()).toBe('数量')
  })

  it('renders snapshot labels in Chinese', () => {
    const wrapper = mountOverview()
    const labels = wrapper
      .findAll('.snapshot-label')
      .map((el) => el.text().trim())
    expect(labels[0]).toBe('工件数量')
    expect(labels[1]).toBe('有追踪记录')
    expect(labels).toContain('有时间线快照')
  })

  it('renders boolean snapshot values in Chinese', () => {
    const wrapper = mountOverview()
    const values = wrapper
      .findAll('.snapshot-value')
      .map((el) => el.text().trim())
    expect(values[1]).toBe('是')
    expect(values[0]).toBe('6')
  })

  it('renders system status labels in Chinese', () => {
    const wrapper = mountOverview()
    const labels = wrapper
      .findAll('.system-status-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['版本', '迭代', '状态'])
  })

  it('renders the shell fully in Chinese', () => {
    const wrapper = mountShell()
    expect(wrapper.text()).toContain('可观测中心')
    expect(wrapper.text()).toContain('就绪')
    expect(wrapper.text()).toContain('概览')
  })
})

// ---------------------------------------------------------------------------
// en-US rendering
// ---------------------------------------------------------------------------

describe('i18n — en-US rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useI18nStore().setLanguage('en-US')
  })

  it('renders the observatory title in English', () => {
    expect(mountHeader().find('.header-title').text()).toBe('Observatory')
  })

  it('renders the status badge as Ready', () => {
    expect(mountHeader().find('.header-badge').text()).toContain('Ready')
  })

  it('renders the sprint label as Sprint 6', () => {
    expect(mountHeader().find('.header-sprint').text()).toBe('Sprint 6')
  })

  it('renders the version aria label in English', () => {
    expect(mountHeader().find('.header-version').attributes('aria-label')).toBe(
      'Version',
    )
  })

  it('renders an English switcher as the current language', () => {
    const wrapper = mountHeader()
    const select = wrapper.find('select.locale-select').element as HTMLSelectElement
    expect(select.value).toBe('en-US')
    expect(wrapper.find('option[value="en-US"]').text()).toBe('English')
  })

  it('renders sidebar labels in English', () => {
    expect(sidebarLabels(mountSidebar())).toEqual([
      'Overview',
      'Trace',
      'Timeline',
      'History',
      'Diff',
      'Runtime',
      'Event Stream',
      'Trace Graph',
      'World Graph',
      'Settings',
    ])
  })

  it('renders content placeholder cards in English', () => {
    const wrapper = mountContentAs('Settings')
    expect(contentCardTitles(wrapper)).toEqual([
      'Overview',
      'Trace',
      'Timeline',
      'History',
      'Diff',
      'Runtime',
    ])
  })

  it('renders the Coming Soon placeholder in English', () => {
    const wrapper = mountContentAs('Settings')
    expect(wrapper.find('.card-body').text()).toBe('Coming Soon')
  })

  it('does not render an Active tag for the Settings grid in English', () => {
    const wrapper = mountContentAs('Settings')
    expect(wrapper.find('.card-active-tag').exists()).toBe(false)
  })

  it('renders artifact summary section title in English', () => {
    expect(mountOverview().text()).toContain('Artifact Summary')
  })

  it('renders observatory snapshot section title in English', () => {
    expect(mountOverview().text()).toContain('Observatory Snapshot')
  })

  it('renders system status section title in English', () => {
    expect(mountOverview().text()).toContain('System Status')
  })

  it('renders artifact titles in English', () => {
    const wrapper = mountOverview()
    const titles = wrapper
      .findAll('.artifact-card-title')
      .map((el) => el.text().trim())
    expect(titles).toEqual(['Trace', 'Timeline', 'History'])
  })

  it('renders the artifact count label in English', () => {
    expect(mountOverview().find('.artifact-card-label').text()).toBe('Count')
  })

  it('renders snapshot labels in English', () => {
    const wrapper = mountOverview()
    const labels = wrapper
      .findAll('.snapshot-label')
      .map((el) => el.text().trim())
    expect(labels[0]).toBe('Artifact Count')
    expect(labels[1]).toBe('Has Trace')
    expect(labels).toContain('Has Timeline Snapshot')
  })

  it('renders boolean snapshot values in English', () => {
    const wrapper = mountOverview()
    const values = wrapper
      .findAll('.snapshot-value')
      .map((el) => el.text().trim())
    expect(values[1]).toBe('Yes')
  })

  it('renders system status labels in English', () => {
    const wrapper = mountOverview()
    const labels = wrapper
      .findAll('.system-status-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['Version', 'Sprint', 'Status'])
  })

  it('renders the shell fully in English', () => {
    const wrapper = mountShell()
    expect(wrapper.text()).toContain('Observatory')
    expect(wrapper.text()).toContain('Ready')
    expect(wrapper.text()).toContain('Overview')
  })

  it('renders artifact descriptions in English', () => {
    const wrapper = mountOverview()
    const descriptions = wrapper
      .findAll('.artifact-card-description')
      .map((el) => el.text().trim())
    expect(descriptions[0]).toBe('Captured prompt assembly traces')
  })
})

// ---------------------------------------------------------------------------
// Language switcher
// ---------------------------------------------------------------------------

describe('i18n — language switcher', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a compact select switcher in the header', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('select.locale-select').exists()).toBe(true)
  })

  it('renders exactly two language options', () => {
    const wrapper = mountHeader()
    expect(wrapper.findAll('option')).toHaveLength(2)
  })

  it('offers 中文 and English options', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('option[value="zh-CN"]').text()).toBe('中文')
    expect(wrapper.find('option[value="en-US"]').text()).toBe('English')
  })

  it('defaults to the zh-CN option selected', () => {
    const wrapper = mountHeader()
    const select = wrapper.find('select.locale-select').element as HTMLSelectElement
    expect(select.value).toBe('zh-CN')
  })

  it('updates the store language when switched', async () => {
    const store = useI18nStore()
    const wrapper = mountHeader()
    await switchLanguage(wrapper, 'en-US')
    expect(store.language).toBe('en-US')
  })

  it('updates the header title reactively', async () => {
    const wrapper = mountHeader()
    expect(wrapper.find('.header-title').text()).toBe('可观测中心')
    await switchLanguage(wrapper, 'en-US')
    expect(wrapper.find('.header-title').text()).toBe('Observatory')
  })

  it('updates the badge reactively', async () => {
    const wrapper = mountHeader()
    expect(wrapper.find('.header-badge').text()).toContain('就绪')
    await switchLanguage(wrapper, 'en-US')
    expect(wrapper.find('.header-badge').text()).toContain('Ready')
  })

  it('updates the sprint label reactively', async () => {
    const wrapper = mountHeader()
    await switchLanguage(wrapper, 'en-US')
    expect(wrapper.find('.header-sprint').text()).toBe('Sprint 6')
  })

  it('updates the sidebar labels reactively', async () => {
    const wrapper = mountSidebar()
    expect(sidebarLabels(wrapper)[0]).toBe('概览')
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    expect(sidebarLabels(wrapper)[0]).toBe('Overview')
    expect(sidebarLabels(wrapper)[3]).toBe('History')
  })

  it('updates overview labels reactively', async () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('系统状态')
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    expect(wrapper.text()).toContain('System Status')
    expect(wrapper.find('.artifact-card-title').text()).toBe('Trace')
  })

  it('updates content placeholder cards reactively', async () => {
    const wrapper = mountContentAs('Settings')
    expect(contentCardTitles(wrapper)[0]).toBe('概览')
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    expect(contentCardTitles(wrapper)[0]).toBe('Overview')
  })

  it('does not reload or remount the component on switch', async () => {
    const wrapper = mountHeader()
    const titleElement = wrapper.find('.header-title')
    await switchLanguage(wrapper, 'en-US')
    expect(titleElement.text()).toBe('Observatory')
    expect(wrapper.find('.header-title').exists()).toBe(true)
  })

  it('switches back to zh-CN reactively', async () => {
    const wrapper = mountHeader()
    await switchLanguage(wrapper, 'en-US')
    await switchLanguage(wrapper, 'zh-CN')
    expect(wrapper.find('.header-title').text()).toBe('可观测中心')
  })

  it('exposes an accessible label on the switcher', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('select.locale-select').attributes('aria-label')).toBe(
      'Language',
    )
  })

  it('renders a decorative caret next to the select', () => {
    const wrapper = mountHeader()
    const caret = wrapper.find('.locale-caret')
    expect(caret.exists()).toBe(true)
    expect(caret.attributes('aria-hidden')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// Missing key fallback
// ---------------------------------------------------------------------------

describe('i18n — missing key fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store t falls back to the key string', () => {
    expect(useI18nStore().t('observatory.nope')).toBe('observatory.nope')
  })

  it('store t falls back for missing nested keys', () => {
    expect(useI18nStore().t('observatory.panels.unknown')).toBe(
      'observatory.panels.unknown',
    )
  })

  it('store t falls back in en-US too', () => {
    const store = useI18nStore()
    store.setLanguage('en-US')
    expect(store.t('observatory.nope')).toBe('observatory.nope')
  })

  it('store t returns an empty string for an empty key', () => {
    expect(useI18nStore().t('')).toBe('')
  })

  it('store t does not throw for malformed keys', () => {
    const store = useI18nStore()
    expect(() => store.t('a..b.')).not.toThrow()
  })

  it('resolveKey returns undefined for unknown keys', () => {
    expect(resolveKey(zhCN, 'unknown.key')).toBeUndefined()
    expect(resolveKey(enUS, 'unknown.key')).toBeUndefined()
  })

  it('unknown keys never leak into known translations', () => {
    const store = useI18nStore()
    expect(store.t('observatory.missing.title')).not.toBe('可观测中心')
  })

  it('has disambiguates missing keys', () => {
    const store = useI18nStore()
    expect(store.has('observatory.title')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Reactivity & integration
// ---------------------------------------------------------------------------

describe('i18n — reactivity and integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('multiple components react to a single language switch', async () => {
    const header = mountHeader()
    const sidebar = mountSidebar()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    expect(header.find('.header-title').text()).toBe('Observatory')
    expect(sidebarLabels(sidebar)[0]).toBe('Overview')
  })

  it('language switching preserves observatory panel selection', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const i18n = useI18nStore()
    i18n.setLanguage('en-US')
    expect(store.selectedPanel).toBe('Runtime')
  })

  it('language switching preserves version and status values', async () => {
    const store = useObservatoryStore()
    store.setVersion('v2.0.0')
    store.setStatus('Busy')
    useI18nStore().setLanguage('en-US')
    const wrapper = mountHeader()
    expect(wrapper.find('.header-version').text()).toBe('v2.0.0')
    expect(store.status).toBe('Busy')
  })

  it('non-Ready custom statuses render raw (no translation key)', () => {
    const store = useObservatoryStore()
    store.setStatus('Building')
    const wrapper = mountHeader()
    expect(wrapper.find('.header-badge').text()).toContain('Building')
  })

  it('the shell header and overview stay in sync on switch', async () => {
    const shell = mountShell()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    expect(shell.find('.header-title').text()).toBe('Observatory')
    expect(shell.text()).toContain('System Status')
  })

  it('the language switcher is inside the observatory header area', () => {
    const wrapper = mountShell()
    const header = wrapper.findComponent(ObservatoryHeader)
    expect(header.find('.locale-switcher').exists()).toBe(true)
  })

  it('switching via the shell header select updates the whole shell', async () => {
    const wrapper = mountShell()
    await wrapper.find('select.locale-select').setValue('zh-CN')
    await nextTick()
    expect(wrapper.find('.header-title').text()).toBe('可观测中心')
    const sidebar = wrapper.findComponent(ObservatorySidebar)
    expect(sidebar.text()).toContain('概览')
  })

  it('renders zh-CN artifact descriptions', () => {
    const wrapper = mountOverview()
    const descriptions = wrapper
      .findAll('.artifact-card-description')
      .map((el) => el.text().trim())
    expect(descriptions[0]).toBe('捕获的提示词组装追踪')
    expect(descriptions[1]).toBe('跨会话的序列化构建事件')
    expect(descriptions[2]).toBe('持久化的提示词组装条目')
  })

  it('renders en-US artifact descriptions after switching', async () => {
    const wrapper = mountOverview()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const descriptions = wrapper
      .findAll('.artifact-card-description')
      .map((el) => el.text().trim())
    expect(descriptions[1]).toBe('Sequenced build events across sessions')
  })

  it('viewer detail views remain untouched by i18n scope', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.find('.trace-list-title').text()).toBe('Trace List')
  })
})