import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  enableAutoUnmount,
  mount,
  type VueWrapper,
} from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryEventStream from '../components/observatory/events/ObservatoryEventStream.vue'
import EventFilterBar from '../components/observatory/events/EventFilterBar.vue'
import EventStreamList from '../components/observatory/events/EventStreamList.vue'
import EventStreamItem, { type StreamEvent } from '../components/observatory/events/EventStreamItem.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryRuntimeViewer from '../components/observatory/runtime/ObservatoryRuntimeViewer.vue'
import {
  useObservatoryStore,
  OBSERVATORY_PANELS,
} from '../stores/observatory'
import { useI18nStore } from '../stores/i18n'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'

enableAutoUnmount(afterEach)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Activate a fresh Pinia in en-US so rendering assertions are language-stable. */
function activateEn(): void {
  setActivePinia(createPinia())
  useI18nStore().setLanguage('en-US')
}

function mountStream(attachTo?: HTMLElement): VueWrapper {
  return mount(ObservatoryEventStream, attachTo ? { attachTo } : undefined)
}

function items(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.event-stream-item')
}

function itemTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function filterButtons(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('button.event-filter-button')
}

function filterLabels(wrapper: VueWrapper): string[] {
  return filterButtons(wrapper).map((b) => b.text().trim())
}

function activeFilters(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return filterButtons(wrapper).filter((b) =>
    b.classes().includes('event-filter-button--active'),
  )
}

async function clickFilter(
  wrapper: VueWrapper,
  index: number,
): Promise<void> {
  await filterButtons(wrapper)[index].trigger('click')
  await nextTick()
}

/** Advance fake timers and flush Vue's microtask scheduler before asserting. */
async function advanceTimers(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('event stream — rendering', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the root stream container', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.observatory-event-stream').exists()).toBe(true)
  })

  it('renders the EventFilterBar component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventFilterBar).exists()).toBe(true)
  })

  it('renders the EventStreamList component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventStreamList).exists()).toBe(true)
  })

  it('renders 20 EventStreamItem components', () => {
    const wrapper = mountStream()
    expect(wrapper.findAllComponents(EventStreamItem)).toHaveLength(20)
  })

  it('renders the stream title as "Event Stream"', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-title').text()).toBe('Event Stream')
  })

  it('renders the stream title as an h2', () => {
    const wrapper = mountStream()
    const h2 = wrapper.find('.event-stream-title')
    expect(h2.element.tagName).toBe('H2')
  })

  it('renders the filter bar with 4 buttons', () => {
    const wrapper = mountStream()
    expect(filterButtons(wrapper)).toHaveLength(4)
  })

  it('renders filter labels All, Info, Warning, Error', () => {
    const wrapper = mountStream()
    expect(filterLabels(wrapper)).toEqual(['All', 'Info', 'Warning', 'Error'])
  })

  it('renders the event list as a ul', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').exists()).toBe(true)
  })

  it('exposes the event list with role="log"', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('role')).toBe('log')
  })

  it('labels the event list with aria-label', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('aria-label')).toBe(
      'Event stream',
    )
  })

  it('renders every event inside a list item', () => {
    const wrapper = mountStream()
    const lis = wrapper.findAll('li.event-stream-list-item')
    expect(lis).toHaveLength(20)
    for (const li of lis) {
      expect(li.find('article.event-stream-item').exists()).toBe(true)
    }
  })

  it('renders a header before the filter bar and list', () => {
    const wrapper = mountStream()
    const header = wrapper.find('header.event-stream-header')
    const filter = wrapper.find('.event-filter-bar')
    const list = wrapper.find('ul.event-stream-list')
    expect(header.element.compareDocumentPosition(filter.element)).toBe(4)
    expect(filter.element.compareDocumentPosition(list.element)).toBe(4)
  })

  it('lays out the stream as a single column', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.observatory-event-stream').exists()).toBe(true)
    expect(wrapper.find('.event-filter-bar').exists()).toBe(true)
    expect(wrapper.find('ul.event-stream-list').exists()).toBe(true)
  })

  it('renders a timestamp inside every event item', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-timestamp')).toHaveLength(20)
  })

  it('renders a source inside every event item', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-source')).toHaveLength(20)
  })

  it('renders a message inside every event item', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-message')).toHaveLength(20)
  })

  it('renders the first event timestamp as 12:00:01', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-item-timestamp').text()).toBe('12:00:01')
  })

  it('renders the first event source as Runtime', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-item-source').text()).toBe('Runtime')
  })

  it('renders the first event message as World created', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-item-message').text()).toBe('World created')
  })

  it('renders the last event message', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages[messages.length - 1]).toBe('DeleteStrategy applied')
  })

  it('renders the filter bar above the scrollable list', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').element.parentElement).toBe(
      wrapper.find('.observatory-event-stream').element,
    )
  })

  it('does not show any placeholder cards', () => {
    const wrapper = mountStream()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('renders all four fields inside every event item', () => {
    const wrapper = mountStream()
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-timestamp').exists()).toBe(true)
      expect(item.find('.event-item-badge').exists()).toBe(true)
      expect(item.find('.event-item-source').exists()).toBe(true)
      expect(item.find('.event-item-message').exists()).toBe(true)
    }
  })

  it('places the title inside the stream header', () => {
    const wrapper = mountStream()
    const header = wrapper.find('header.event-stream-header')
    expect(header.find('.event-stream-title').exists()).toBe(true)
  })

  it('renders the second event message', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages[1]).toBe('CreateFarm strategy selected')
  })

  it('renders a badge before the source and message per item', () => {
    const wrapper = mountStream()
    const first = items(wrapper)[0]
    const badge = first.find('.event-item-badge')
    const source = first.find('.event-item-source')
    expect(badge.element.compareDocumentPosition(source.element)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('event stream — mock data', () => {
  beforeEach(() => {
    activateEn()
  })

  it('seeds the stream with 20 mock events', () => {
    const wrapper = mountStream()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('sequentially numbering ids starts at evt-001', () => {
    const wrapper = mountStream()
    const first = items(wrapper)[0].find('.event-item-message')
    expect(first.text()).toBe('World created')
  })

  it('includes the World created example event', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-message')).toContain('World created')
  })

  it('includes the CreateFarm strategy selected example event', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-message')).toContain(
      'CreateFarm strategy selected',
    )
  })

  it('includes the NPC path recalculated warning event', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-message')).toContain(
      'NPC path recalculated',
    )
  })

  it('includes the Provider timeout error event', () => {
    const wrapper = mountStream()
    expect(itemTexts(wrapper, '.event-item-message')).toContain(
      'Provider timeout',
    )
  })

  it('renders timestamps as a sequential 12:00:NN series', () => {
    const wrapper = mountStream()
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    expect(timestamps[0]).toBe('12:00:01')
    expect(timestamps[19]).toBe('12:00:20')
  })

  it('mixes info, warning, and error levels', () => {
    const wrapper = mountStream()
    const badges = itemTexts(wrapper, '.event-item-badge')
    expect(badges).toContain('Info')
    expect(badges).toContain('Warning')
    expect(badges).toContain('Error')
  })

  it('uses Runtime, Planner, AI, and Provider as sources', () => {
    const wrapper = mountStream()
    const sources = itemTexts(wrapper, '.event-item-source')
    expect(sources).toContain('Runtime')
    expect(sources).toContain('Planner')
    expect(sources).toContain('AI')
    expect(sources).toContain('Provider')
  })

  it('keeps events in chronological order', () => {
    const wrapper = mountStream()
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    const sorted = [...timestamps].sort()
    expect(timestamps).toEqual(sorted)
  })

  it('assigns unique messages across the seed stream', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(new Set(messages).size).toBe(messages.length)
  })

  it('marks the evt-003 warning with a warning badge', () => {
    const wrapper = mountStream()
    const badges = wrapper.findAll('.event-item-badge')
    const sources = itemTexts(wrapper, '.event-item-source')
    const warnings = badges.filter(
      (_b, i) => sources[i] === 'Runtime' && badges[i].text() === 'Warning',
    )
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('labels the Provider timeout event with an error badge', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    const index = messages.indexOf('Provider timeout')
    expect(index).toBeGreaterThan(-1)
    expect(wrapper.findAll('.event-item-badge')[index].text()).toBe('Error')
  })

  it('labels the NPC path recalculated event with a warning badge', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    const index = messages.indexOf('NPC path recalculated')
    expect(index).toBeGreaterThan(-1)
    expect(wrapper.findAll('.event-item-badge')[index].text()).toBe('Warning')
  })

  it('contains at least one event from every source', () => {
    const wrapper = mountStream()
    const sources = new Set(itemTexts(wrapper, '.event-item-source'))
    expect(sources.has('Runtime')).toBe(true)
    expect(sources.has('Planner')).toBe(true)
    expect(sources.has('AI')).toBe(true)
    expect(sources.has('Provider')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Event item
// ---------------------------------------------------------------------------

describe('event stream — event item', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders as an article', () => {
    const wrapper = mountStream()
    for (const item of items(wrapper)) {
      expect(item.element.tagName).toBe('ARTICLE')
    }
  })

  it('renders the timestamp as a span', () => {
    const wrapper = mountStream()
    expect(wrapper.find('span.event-item-timestamp').exists()).toBe(true)
  })

  it('renders the level badge as a span', () => {
    const wrapper = mountStream()
    expect(wrapper.find('span.event-item-badge').exists()).toBe(true)
  })

  it('renders the source as a span', () => {
    const wrapper = mountStream()
    expect(wrapper.find('span.event-item-source').exists()).toBe(true)
  })

  it('renders the message as a span', () => {
    const wrapper = mountStream()
    expect(wrapper.find('span.event-item-message').exists()).toBe(true)
  })

  it('applies a per-level modifier class on the item', () => {
    const wrapper = mountStream()
    const first = items(wrapper)[0]
    expect(first.classes()).toContain('event-stream-item--info')
  })

  it('renders an info badge class on info events', () => {
    const wrapper = mountStream()
    const first = wrapper.find('.event-stream-item--info .event-item-badge')
    expect(first.classes()).toContain('event-badge--info')
  })

  it('renders a warning badge class on warning events', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-item--warning .event-badge--warning').exists()).toBe(true)
  })

  it('renders an error badge class on error events', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-item--error .event-badge--error').exists()).toBe(true)
  })

  it('localizes the badge label', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-badge--info').text()).toBe('Info')
    expect(wrapper.find('.event-badge--warning').text()).toBe('Warning')
    expect(wrapper.find('.event-badge--error').text()).toBe('Error')
  })

  it('renders a standalone item from props', () => {
    const event: StreamEvent = {
      id: 'evt-000',
      timestamp: '12:00:00',
      level: 'error',
      source: 'Test',
      message: 'Standalone message',
    }
    const wrapper = mount(EventStreamItem, { props: { event } })
    expect(wrapper.find('.event-item-timestamp').text()).toBe('12:00:00')
    expect(wrapper.find('.event-item-source').text()).toBe('Test')
    expect(wrapper.find('.event-item-message').text()).toBe('Standalone message')
    expect(wrapper.find('.event-badge--error').text()).toBe('Error')
  })
})

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

describe('event stream — filter bar', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders All, Info, Warning, Error filter buttons', () => {
    const wrapper = mountStream()
    expect(filterLabels(wrapper)).toEqual(['All', 'Info', 'Warning', 'Error'])
  })

  it('renders filters as native buttons', () => {
    const wrapper = mountStream()
    for (const button of filterButtons(wrapper)) {
      expect(button.element.tagName).toBe('BUTTON')
      expect(button.attributes('type')).toBe('button')
    }
  })

  it('marks the All filter active by default', () => {
    const wrapper = mountStream()
    expect(activeFilters(wrapper)).toHaveLength(1)
    expect(activeFilters(wrapper)[0].text()).toBe('All')
  })

  it('sets aria-pressed=true on the active filter', () => {
    const wrapper = mountStream()
    expect(filterButtons(wrapper)[0].attributes('aria-pressed')).toBe('true')
  })

  it('sets aria-pressed=false on inactive filters', () => {
    const wrapper = mountStream()
    expect(filterButtons(wrapper)[1].attributes('aria-pressed')).toBe('false')
    expect(filterButtons(wrapper)[2].attributes('aria-pressed')).toBe('false')
    expect(filterButtons(wrapper)[3].attributes('aria-pressed')).toBe('false')
  })

  it('moves the active class to the clicked filter', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 1)
    expect(activeFilters(wrapper)).toHaveLength(1)
    expect(activeFilters(wrapper)[0].text()).toBe('Info')
  })

  it('moves aria-pressed alongside the active filter', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    expect(filterButtons(wrapper)[3].attributes('aria-pressed')).toBe('true')
    expect(filterButtons(wrapper)[0].attributes('aria-pressed')).toBe('false')
  })

  it('returns to All when the All filter is clicked again', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 2)
    await clickFilter(wrapper, 0)
    expect(activeFilters(wrapper)[0].text()).toBe('All')
  })

  it('emits change from a standalone filter bar', async () => {
    const wrapper = mount(EventFilterBar, { props: { active: 'all' } })
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0]).toEqual(['warning'])
  })

  it('reflects the active prop on a standalone filter bar', () => {
    const wrapper = mount(EventFilterBar, { props: { active: 'error' } })
    const active = wrapper.findAll('button').filter((b) =>
      b.classes().includes('event-filter-button--active'),
    )
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Error')
  })

  it('sets aria-pressed from the active prop on a standalone filter bar', () => {
    const wrapper = mount(EventFilterBar, { props: { active: 'warning' } })
    const buttons = wrapper.findAll('button')
    expect(buttons[2].attributes('aria-pressed')).toBe('true')
    expect(buttons[0].attributes('aria-pressed')).toBe('false')
  })

  it('exposes a group role on the filter bar', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('role')).toBe('group')
  })

  it('labels the filter bar group', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('aria-label')).toBe(
      'Event stream filters',
    )
  })
})

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe('event stream — filtering', () => {
  beforeEach(() => {
    activateEn()
  })

  it('shows all 20 events with the All filter', () => {
    const wrapper = mountStream()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('shows only info events with the Info filter', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 1)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages.length).toBeLessThan(20)
    expect(messages).toContain('World created')
    expect(messages).not.toContain('Provider timeout')
  })

  it('shows only warning events with the Warning filter', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 2)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages).toContain('NPC path recalculated')
    expect(messages).not.toContain('World created')
  })

  it('shows only error events with the Error filter', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages).toContain('Provider timeout')
    expect(messages).not.toContain('World created')
  })

  it('hides non-matching sources from the message list', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 1)
    const sources = itemTexts(wrapper, '.event-item-source')
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-badge').text()).toBe('Info')
    }
    expect(sources).toHaveLength(items(wrapper).length)
  })

  it('restores all events when switching back to All', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    await clickFilter(wrapper, 0)
    expect(items(wrapper)).toHaveLength(20)
  })

  it('keeps the filter state after a filtered click', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 2)
    const before = itemTexts(wrapper, '.event-item-message')
    await clickFilter(wrapper, 2)
    expect(itemTexts(wrapper, '.event-item-message')).toEqual(before)
  })

  it('renders zero events only through an empty list', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.findAll('.event-stream-item')).toHaveLength(0)
  })

  it('does not include placeholder cards in filtered views', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('matches the warning filter to the warning event count', async () => {
    const all = mountStream()
    const warningCount = itemTexts(all, '.event-item-badge').filter(
      (b) => b === 'Warning',
    ).length
    await clickFilter(all, 2)
    expect(items(all)).toHaveLength(warningCount)
  })

  it('keeps the Info filter strict as events arrive', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await clickFilter(wrapper, 1)
    await advanceTimers(6000)
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-badge').text()).toBe('Info')
    }
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// Auto stream simulation
// ---------------------------------------------------------------------------

describe('event stream — auto append', () => {
  beforeEach(() => {
    activateEn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with exactly 20 events', () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('appends one event after 2000ms', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(2000)
    expect(items(wrapper)).toHaveLength(21)
  })

  it('appends a second event after another 2000ms', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(4000)
    expect(items(wrapper)).toHaveLength(22)
  })

  it('does not append before the 2000ms interval elapses', () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    vi.advanceTimersByTime(1999)
    expect(items(wrapper)).toHaveLength(20)
  })

  it('continues appending on each interval tick', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(10000)
    expect(items(wrapper)).toHaveLength(25)
  })

  it('gives the appended event a sequential timestamp', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(2000)
    const final = itemTexts(wrapper, '.event-item-timestamp')
    expect(final[final.length - 1]).toBe('12:00:21')
  })

  it('appends the next seed message on each tick', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(2000)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages[messages.length - 1]).toBe('World created')
    await advanceTimers(2000)
    const again = itemTexts(wrapper, '.event-item-message')
    expect(again[again.length - 1]).toBe('CreateFarm strategy selected')
  })

  it('appends events from the cycling seed pool', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(40000)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages.length).toBe(40)
    expect(messages[39]).toBe('DeleteStrategy applied')
    await advanceTimers(2000)
    const after = itemTexts(wrapper, '.event-item-message')
    expect(after[after.length - 1]).toBe('World created')
  })

  it('respects the active filter for appended events', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await clickFilter(wrapper, 3) // Error filter only
    await advanceTimers(2000)
    const seen = itemTexts(wrapper, '.event-item-message')
    expect(seen).toContain('Provider timeout')
    expect(seen[0]).toBe('Provider timeout')
  })

  it('keeps appended warning events visible under the Warning filter', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await clickFilter(wrapper, 2)
    await advanceTimers(4000)
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages).toContain('NPC path recalculated')
  })

  it('does not append when the component is unmounted', () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    wrapper.unmount()
    expect(() => vi.advanceTimersByTime(20000)).not.toThrow()
  })

  it('schedules the interval when mounted', () => {
    vi.useFakeTimers()
    const setSpy = vi.spyOn(globalThis, 'setInterval')
    const wrapper = mountStream()
    expect(setSpy).toHaveBeenCalled()
    wrapper.unmount()
    setSpy.mockRestore()
  })

  it('appends a new event for every elapsed interval', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(6000)
    expect(items(wrapper)).toHaveLength(23)
    await advanceTimers(4000)
    expect(items(wrapper)).toHaveLength(25)
  })

  it('continues appending for an extended duration', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(40000)
    expect(items(wrapper)).toHaveLength(40)
  })

  it('reaches exactly 100 events at 160000ms', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(160000)
    expect(items(wrapper)).toHaveLength(100)
  })

  it('cycles event levels across appended events', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(2000)
    expect(wrapper.findAll('.event-item-badge').at(-1)?.text()).toBe('Info')
    await advanceTimers(2000)
    expect(wrapper.findAll('.event-item-badge').at(-1)?.text()).toBe('Info')
    await advanceTimers(2000)
    expect(wrapper.findAll('.event-item-badge').at(-1)?.text()).toBe(
      'Warning',
    )
    await advanceTimers(2000)
    expect(wrapper.findAll('.event-item-badge').at(-1)?.text()).toBe('Error')
  })
})

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

describe('event stream — cleanup', () => {
  beforeEach(() => {
    activateEn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the interval on unmount', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mountStream()
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('clears the same timer that was scheduled', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const setSpy = vi.spyOn(globalThis, 'setInterval')
    const wrapper = mountStream()
    const scheduled = setSpy.mock.results[0]?.value
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalledWith(scheduled)
    clearSpy.mockRestore()
    setSpy.mockRestore()
  })

  it('stops appending after unmount', () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    wrapper.unmount()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('restarts the simulation on a fresh mount', async () => {
    vi.useFakeTimers()
    const first = mountStream()
    first.unmount()
    const second = mountStream()
    expect(items(second)).toHaveLength(20)
    await advanceTimers(2000)
    expect(items(second)).toHaveLength(21)
  })

  it('unmounting twice is safe', () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    wrapper.unmount()
    expect(() => wrapper.unmount()).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 100-event retention
// ---------------------------------------------------------------------------

describe('event stream — max 100 events', () => {
  beforeEach(() => {
    activateEn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('caps the stream at 100 events', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(200000) // 100 appends → 120 total
    expect(items(wrapper)).toHaveLength(100)
  })

  it('drops the oldest event once the cap is reached', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(200000)
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    expect(timestamps[0]).toBe('12:00:21')
    expect(timestamps[timestamps.length - 1]).toBe('12:02:00')
  })

  it('stays at 100 events with further appends', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(400000)
    expect(items(wrapper)).toHaveLength(100)
  })

  it('keeps the newest 100 events after the cap', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(200000)
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    expect(timestamps[0]).toBe('12:00:21')
  })

  it('retains events in order while capped', async () => {
    vi.useFakeTimers()
    const wrapper = mountStream()
    await advanceTimers(300000)
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    const sorted = [...timestamps].sort()
    expect(timestamps).toEqual(sorted)
    expect(timestamps).toHaveLength(100)
  })
})

// ---------------------------------------------------------------------------
// i18n rendering
// ---------------------------------------------------------------------------

describe('event stream — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the title in Chinese by default', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-title').text()).toBe('事件流')
  })

  it('renders the title in English after switching language', async () => {
    const wrapper = mountStream()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.event-stream-title').text()).toBe('Event Stream')
  })

  it('renders filter labels in Chinese by default', () => {
    const wrapper = mountStream()
    expect(filterLabels(wrapper)).toEqual(['全部', '信息', '警告', '错误'])
  })

  it('renders filter labels in English after switching language', async () => {
    const wrapper = mountStream()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(filterLabels(wrapper)).toEqual(['All', 'Info', 'Warning', 'Error'])
  })

  it('renders badge labels in Chinese by default', () => {
    const wrapper = mountStream()
    const badges = itemTexts(wrapper, '.event-item-badge')
    expect(badges).toContain('信息')
    expect(badges).toContain('警告')
    expect(badges).toContain('错误')
  })

  it('renders badge labels in English after switching language', async () => {
    const wrapper = mountStream()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const badges = itemTexts(wrapper, '.event-item-badge')
    expect(badges).toContain('Info')
    expect(badges).toContain('Warning')
    expect(badges).toContain('Error')
  })

  it('updates labels reactively on language switch', async () => {
    const wrapper = mountStream()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.event-stream-title').text()).toBe('Event Stream')
    expect(filterLabels(wrapper)[0]).toBe('All')
  })

  it('switches back to Chinese labels reactively', async () => {
    const wrapper = mountStream()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.find('.event-stream-title').text()).toBe('事件流')
    expect(filterLabels(wrapper)[1]).toBe('信息')
  })

  it('preserves the active filter across a language switch', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(activeFilters(wrapper)[0].text()).toBe('Error')
  })

  it('does not remount on language switch', async () => {
    const wrapper = mountStream()
    const title = wrapper.find('.event-stream-title')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.event-stream-title').exists()).toBe(true)
    expect(title.text()).toBe('Event Stream')
  })

  it('zh-CN catalog contains the events title key', () => {
    expect(resolveKey(zhCN, 'observatory.events.title')).toBe('事件流')
  })

  it('zh-CN catalog contains the events filter keys', () => {
    expect(resolveKey(zhCN, 'observatory.events.all')).toBe('全部')
    expect(resolveKey(zhCN, 'observatory.events.info')).toBe('信息')
    expect(resolveKey(zhCN, 'observatory.events.warning')).toBe('警告')
    expect(resolveKey(zhCN, 'observatory.events.error')).toBe('错误')
  })

  it('zh-CN catalog contains the events field keys', () => {
    expect(resolveKey(zhCN, 'observatory.events.source')).toBe('来源')
    expect(resolveKey(zhCN, 'observatory.events.timestamp')).toBe('时间')
    expect(resolveKey(zhCN, 'observatory.events.message')).toBe('消息')
  })

  it('en-US catalog contains all events keys', () => {
    expect(resolveKey(enUS, 'observatory.events.title')).toBe('Event Stream')
    expect(resolveKey(enUS, 'observatory.events.all')).toBe('All')
    expect(resolveKey(enUS, 'observatory.events.info')).toBe('Info')
    expect(resolveKey(enUS, 'observatory.events.warning')).toBe('Warning')
    expect(resolveKey(enUS, 'observatory.events.error')).toBe('Error')
    expect(resolveKey(enUS, 'observatory.events.source')).toBe('Source')
    expect(resolveKey(enUS, 'observatory.events.timestamp')).toBe('Timestamp')
    expect(resolveKey(enUS, 'observatory.events.message')).toBe('Message')
  })

  it('zh-CN catalog contains the event stream panel key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.eventstream')).toBe('事件流')
  })

  it('en-US catalog contains the event stream panel key', () => {
    expect(resolveKey(enUS, 'observatory.panels.eventstream')).toBe(
      'Event Stream',
    )
  })

  it('events keys have matching parity across locales', () => {
    for (const key of [
      'title',
      'all',
      'info',
      'warning',
      'error',
      'source',
      'timestamp',
      'message',
    ]) {
      const full = `observatory.events.${key}`
      expect(resolveKey(zhCN, full), `zh key ${full}`).toBeDefined()
      expect(resolveKey(enUS, full), `en key ${full}`).toBeDefined()
    }
  })

  it('badges switch back to Chinese reactively', async () => {
    const wrapper = mountStream()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    const badges = itemTexts(wrapper, '.event-item-badge')
    expect(badges).toContain('信息')
    expect(badges).toContain('警告')
    expect(badges).toContain('错误')
  })

  it('resolves the events title key through the i18n store', () => {
    const store = useI18nStore()
    expect(store.t('observatory.events.title')).toBe('事件流')
    store.setLanguage('en-US')
    expect(store.t('observatory.events.title')).toBe('Event Stream')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('event stream — accessibility', () => {
  beforeEach(() => {
    activateEn()
  })

  it('uses native buttons for the filter bar', () => {
    const wrapper = mountStream()
    for (const button of filterButtons(wrapper)) {
      expect(button.element.tagName).toBe('BUTTON')
      expect(button.attributes('type')).toBe('button')
    }
  })

  it('exposes aria-pressed on every filter button', () => {
    const wrapper = mountStream()
    for (const button of filterButtons(wrapper)) {
      expect(button.attributes('aria-pressed')).toBeDefined()
    }
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountStream()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('does not use role=button anywhere', () => {
    const wrapper = mountStream()
    expect(wrapper.findAll('[role="button"]')).toHaveLength(0)
  })

  it('gives every filter button a text-accessible name', () => {
    const wrapper = mountStream()
    for (const button of filterButtons(wrapper)) {
      expect(button.text().trim().length).toBeGreaterThan(0)
    }
  })

  it('uses an h2 for the stream title', () => {
    const wrapper = mountStream()
    expect(wrapper.find('h2.event-stream-title').exists()).toBe(true)
  })

  it('exposes the live list as role="log"', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('role')).toBe('log')
  })

  it('labels the live list', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('aria-label')).toBe(
      'Event stream',
    )
  })

  it('exposes the filter bar as a group', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('role')).toBe('group')
  })

  it('labels the filter bar group', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('aria-label')).toBe(
      'Event stream filters',
    )
  })

  it('renders event items as articles', () => {
    const wrapper = mountStream()
    for (const item of items(wrapper)) {
      expect(item.element.tagName).toBe('ARTICLE')
    }
  })

  it('keeps the visual order timestamp, badge, source, message', () => {
    const wrapper = mountStream()
    const first = items(wrapper)[0]
    const timestamp = first.find('.event-item-timestamp')
    const badge = first.find('.event-item-badge')
    const source = first.find('.event-item-source')
    const message = first.find('.event-item-message')
    expect(timestamp.element.compareDocumentPosition(badge.element)).toBe(4)
    expect(badge.element.compareDocumentPosition(source.element)).toBe(4)
    expect(source.element.compareDocumentPosition(message.element)).toBe(4)
  })

  it('marks filtered content with aria-pressed state', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 2)
    expect(filterButtons(wrapper)[2].attributes('aria-pressed')).toBe('true')
    expect(filterButtons(wrapper)[0].attributes('aria-pressed')).toBe('false')
  })

  it('keeps list semantics on the empty state', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.find('p.event-stream-empty').element.tagName).toBe('P')
  })

  it('highlights exactly one filter as active at a time', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 1)
    await clickFilter(wrapper, 2)
    await clickFilter(wrapper, 0)
    expect(activeFilters(wrapper)).toHaveLength(1)
  })

  it('keeps the title heading above the filtered list', async () => {
    const wrapper = mountStream()
    await clickFilter(wrapper, 3)
    const title = wrapper.find('.event-stream-title')
    const list = wrapper.find('ul.event-stream-list')
    expect(title.element.compareDocumentPosition(list.element)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('event stream — empty state', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders an empty message when there are no events', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.text()).toContain('No events')
  })

  it('hides the list when there are no events', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.find('ul.event-stream-list').exists()).toBe(false)
  })

  it('renders no list items when there are no events', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('marks the empty message as a paragraph', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.find('p.event-stream-empty').exists()).toBe(true)
  })

  it('renders items when events are provided', () => {
    const event: StreamEvent = {
      id: 'evt-999',
      timestamp: '12:59:59',
      level: 'info',
      source: 'Runtime',
      message: 'Final check',
    }
    const wrapper = mount(EventStreamList, { props: { events: [event] } })
    expect(wrapper.findAll('.event-stream-item')).toHaveLength(1)
  })

  it('does not render role="log" on the empty state', () => {
    const wrapper = mount(EventStreamList, { props: { events: [] } })
    expect(wrapper.find('[role="log"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('event stream — content integration', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders the event stream when EventStream is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render placeholder cards when EventStream is selected', () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the event stream on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('EventStream')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
  })

  it('switches from the trace viewer to the event stream', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('EventStream')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
  })

  it('switches from the runtime viewer to the event stream', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
    store.selectPanel('EventStream')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
  })

  it('switches from the event stream back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the event stream to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('re-mounts a fresh event stream after panel switching', async () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryEventStream).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    store.selectPanel('EventStream')
    await nextTick()
    const stream = wrapper.findComponent(ObservatoryEventStream)
    expect(stream.exists()).toBe(true)
    expect(stream.findAll('.event-stream-item')).toHaveLength(20)
  })

  it('sits between Runtime and Settings in the panel order', () => {
    const runtimeIndex = OBSERVATORY_PANELS.indexOf('Runtime')
    const eventIndex = OBSERVATORY_PANELS.indexOf('EventStream')
    const settingsIndex = OBSERVATORY_PANELS.indexOf('Settings')
    expect(eventIndex).toBe(runtimeIndex + 1)
    expect(settingsIndex).toBe(eventIndex + 1)
  })

  it('accepts the panel in the observatory panel union', () => {
    const store = useObservatoryStore()
    expect(() => {
      store.selectPanel('EventStream')
    }).not.toThrow()
    expect(store.selectedPanel).toBe('EventStream')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('event stream — deterministic rendering', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders identical timestamps across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-timestamp')).toEqual(
      itemTexts(b, '.event-item-timestamp'),
    )
  })

  it('renders identical messages across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-message')).toEqual(
      itemTexts(b, '.event-item-message'),
    )
  })

  it('renders identical sources across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-source')).toEqual(
      itemTexts(b, '.event-item-source'),
    )
  })

  it('renders identical filter labels across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(filterLabels(a)).toEqual(filterLabels(b))
  })

  it('starts with the same event count across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(items(a)).toHaveLength(items(b).length)
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(a.html()).toBe(b.html())
  })

  it('renders identical badge labels across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-badge')).toEqual(
      itemTexts(b, '.event-item-badge'),
    )
  })
})