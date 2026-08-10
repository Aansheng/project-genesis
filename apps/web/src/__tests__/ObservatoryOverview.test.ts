import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryStore } from '../stores/observatory'
import { useI18nStore } from '../stores/i18n'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryShell from '../components/observatory/ObservatoryShell.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Activate a fresh Pinia in en-US so legacy English assertions hold. */
function activateEn(): void {
  setActivePinia(createPinia())
  useI18nStore().setLanguage('en-US')
}
function mountOverview(): VueWrapper {
  return mount(ObservatoryOverview)
}

function artifactCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.artifact-card')
}

function sectionTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

// ---------------------------------------------------------------------------
// Section 1 — Artifact Summary
// ---------------------------------------------------------------------------

describe('observatory overview — artifact summary', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the Artifact Summary section', () => {
    const wrapper = mountOverview()
    expect(wrapper.find('.overview-section').exists()).toBe(true)
  })

  it('renders an h2 heading "Artifact Summary"', () => {
    const wrapper = mountOverview()
    const heading = wrapper.find('h2')
    expect(heading.text()).toBe('Artifact Summary')
  })

  it('renders exactly 3 artifact cards', () => {
    const wrapper = mountOverview()
    expect(artifactCards(wrapper)).toHaveLength(3)
  })

  it('renders a Trace card', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toContain('Trace')
  })

  it('renders a Timeline card', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toContain('Timeline')
  })

  it('renders a History card', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toContain('History')
  })

  it('renders artifact card titles in order', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toEqual([
      'Trace',
      'Timeline',
      'History',
    ])
  })

  it('Trace card displays count 12', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const trace = cards.filter((c) => c.text().includes('Trace'))[0]
    expect(trace.find('.artifact-card-count').text()).toBe('12')
  })

  it('Timeline card displays count 8', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const timeline = cards.filter((c) => c.text().includes('Timeline'))[0]
    expect(timeline.find('.artifact-card-count').text()).toBe('8')
  })

  it('History card displays count 4', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const history = cards.filter((c) => c.text().includes('History'))[0]
    expect(history.find('.artifact-card-count').text()).toBe('4')
  })

  it('renders a Count label inside each card via dl', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.find('dt.artifact-card-label').text()).toBe('Count')
      expect(card.find('dd.artifact-card-count').exists()).toBe(true)
    }
  })

  it('renders a description for each artifact card', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.find('.artifact-card-description').text().length).toBeGreaterThan(0)
    }
  })

  it('renders counts with the monospace numeric class', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.find('.artifact-card-count').exists()).toBe(true)
    }
  })

  it('exposes an accessible label on each artifact card', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.attributes('aria-label')).toBeTruthy()
    }
  })

  it('uses semantic article elements for artifact cards', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('makes artifact cards keyboard reachable via tabindex', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.attributes('tabindex')).toBe('0')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Observatory Snapshot
// ---------------------------------------------------------------------------

describe('observatory overview — observatory snapshot', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the Observatory Snapshot section', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Observatory Snapshot')
  })

  it('renders an h2 heading "Observatory Snapshot"', () => {
    const wrapper = mountOverview()
    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings).toContain('Observatory Snapshot')
  })

  it('renders 7 snapshot items', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('.snapshot-item')).toHaveLength(7)
  })

  it('renders an Artifact Count item', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.snapshot-label')).toContain('Artifact Count')
  })

  it('Artifact Count value is 6', () => {
    const wrapper = mountOverview()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Artifact Count')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('6')
  })

  it('renders Has Trace with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Trace')
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Has Trace')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('Yes')
  })

  it('renders Has Timeline with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Timeline')
  })

  it('renders Has History with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has History')
  })

  it('renders Has Trace Snapshot with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Trace Snapshot')
  })

  it('renders Has Timeline Snapshot with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Timeline Snapshot')
  })

  it('renders Has History Snapshot with Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has History Snapshot')
  })

  it('renders snapshot in label order', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.snapshot-label')).toEqual([
      'Artifact Count',
      'Has Trace',
      'Has Timeline',
      'Has History',
      'Has Trace Snapshot',
      'Has Timeline Snapshot',
      'Has History Snapshot',
    ])
  })

  it('uses a dl element for the snapshot grid', () => {
    const wrapper = mountOverview()
    expect(wrapper.find('dl.snapshot-grid').exists()).toBe(true)
  })

  it('uses dt/dd pairs for snapshot items', () => {
    const wrapper = mountOverview()
    for (const item of wrapper.findAll('.snapshot-item')) {
      expect(item.find('dt.snapshot-label').exists()).toBe(true)
      expect(item.find('dd.snapshot-value').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 3 — System Status
// ---------------------------------------------------------------------------

describe('observatory overview — system status', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the System Status section', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('System Status')
  })

  it('renders an h2 heading "System Status"', () => {
    const wrapper = mountOverview()
    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings).toContain('System Status')
  })

  it('renders 3 system status items', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('.system-status-item')).toHaveLength(3)
  })

  it('renders a Version item', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.system-status-label')).toContain('Version')
  })

  it('reads the version from the observatory store', () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    const labels = wrapper.findAll('.system-status-label')
    const index = labels.findIndex((l) => l.text() === 'Version')
    expect(wrapper.findAll('.system-status-value')[index].text()).toBe(
      store.version,
    )
  })

  it('renders Sprint 6', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Sprint 6')
  })

  it('renders the Sprint label', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.system-status-label')).toContain('Sprint')
  })

  it('renders a Status item', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.system-status-label')).toContain('Status')
  })

  it('reads the status from the observatory store', () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    const labels = wrapper.findAll('.system-status-label')
    const index = labels.findIndex((l) => l.text() === 'Status')
    expect(wrapper.findAll('.system-status-value')[index].text()).toBe(
      store.status,
    )
  })

  it('uses a dl element for system status', () => {
    const wrapper = mountOverview()
    expect(wrapper.find('dl.system-status-list').exists()).toBe(true)
  })

  it('uses dt/dd pairs for system status items', () => {
    const wrapper = mountOverview()
    for (const item of wrapper.findAll('.system-status-item')) {
      expect(item.find('dt').exists()).toBe(true)
      expect(item.find('dd').exists()).toBe(true)
    }
  })

  it('updates the version reactively when the store changes', async () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    store.setVersion('v1.31')
    await nextTick()
    expect(wrapper.text()).toContain('v1.31')
  })

  it('updates the status reactively when the store changes', async () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    store.setStatus('Building')
    await nextTick()
    expect(wrapper.text()).toContain('Building')
  })

  it('keeps the sprint label static at Sprint 6', () => {
    const wrapper = mountOverview()
    const labels = wrapper.findAll('.system-status-label')
    const index = labels.findIndex((l) => l.text() === 'Sprint')
    expect(wrapper.findAll('.system-status-value')[index].text()).toBe('Sprint 6')
  })
})

// ---------------------------------------------------------------------------
// Semantics & Accessibility
// ---------------------------------------------------------------------------

describe('observatory overview — semantics and accessibility', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders 3 semantic section elements', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('section.overview-section')).toHaveLength(3)
  })

  it('uses h2 headings for all section titles', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('h2')).toHaveLength(3)
  })

  it('labels each section via aria-labelledby matching its h2 id', () => {
    const wrapper = mountOverview()
    for (const section of wrapper.findAll('section.overview-section')) {
      const labelledBy = section.attributes('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      expect(wrapper.find(`#${labelledBy}`).exists()).toBe(true)
    }
  })

  it('renders exactly 3 overview section titles', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.overview-section-title')).toEqual([
      'Artifact Summary',
      'Observatory Snapshot',
      'System Status',
    ])
  })

  it('renders no headless dl elements (dl always has dt/dd pairs)', () => {
    const wrapper = mountOverview()
    for (const dl of wrapper.findAll('dl')) {
      expect(dl.find('dt').exists()).toBe(true)
      expect(dl.find('dd').exists()).toBe(true)
    }
  })

  it('renders count values with a monospace numeric class', () => {
    const wrapper = mountOverview()
    const counts = wrapper.findAll('.artifact-card-count')
    expect(counts).toHaveLength(3)
    for (const count of counts) {
      expect(count.text()).toMatch(/^\d+$/)
    }
  })

  it('card values are deterministic numbers, not templates', () => {
    const wrapper = mountOverview()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['12', '8', '4'])
  })
})

// ---------------------------------------------------------------------------
// Deterministic Rendering
// ---------------------------------------------------------------------------

describe('observatory overview — deterministic rendering', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders identical artifact counts across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.artifact-card-count')).toEqual(
      sectionTexts(second, '.artifact-card-count'),
    )
  })

  it('renders identical snapshot labels across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.snapshot-label')).toEqual(
      sectionTexts(second, '.snapshot-label'),
    )
  })

  it('renders identical snapshot values across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.snapshot-value')).toEqual(
      sectionTexts(second, '.snapshot-value'),
    )
  })

  it('renders the same section count across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(first.findAll('.overview-section')).toHaveLength(
      second.findAll('.overview-section').length,
    )
  })

  it('does not depend on render order or async state', () => {
    const wrapper = mountOverview()
    const snapshot = wrapper.html()
    const replay = mountOverview().html()
    expect(replay).toBe(snapshot)
  })
})

// ---------------------------------------------------------------------------
// Overview inside ObservatoryContent / Shell
// ---------------------------------------------------------------------------

describe('overview dashboard integration', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the overview dashboard inside the content area by default', () => {
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('renders the overview dashboard inside the full shell by default', () => {
    const wrapper = mount(ObservatoryShell)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('hides the overview dashboard when a non-Overview panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    store.selectPanel('Trace')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('re-renders the overview dashboard when Overview is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('keeps the shell sidebar working while the dashboard is shown', async () => {
    const wrapper = mount(ObservatoryShell)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[9].trigger('click') // Settings
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('shows the dashboard version from the same store used by the shell header', async () => {
    const store = useObservatoryStore()
    store.setVersion('v2.0.0')
    const wrapper = mount(ObservatoryShell)
    expect(wrapper.find('.header-version').text()).toBe('v2.0.0')
    expect(wrapper.find('.system-status-value').text()).toContain('v2.0.0')
  })
})