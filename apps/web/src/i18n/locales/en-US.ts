import type { MessageCatalog } from '../index'

/**
 * English catalog — Observatory namespace (WO-S6-006.5).
 */
export const enUS: MessageCatalog = {
  observatory: {
    title: 'Observatory',
    panels: {
      overview: 'Overview',
      trace: 'Trace',
      timeline: 'Timeline',
      history: 'History',
      diff: 'Diff',
      runtime: 'Runtime',
      eventstream: 'Event Stream',
      tracegraph: 'Trace Graph',
      worldgraph: 'World Graph',
      generation: 'Generation',
      settings: 'Settings',
    },
    status: {
      ready: 'Ready',
    },
    labels: {
      version: 'Version',
      sprint: 'Sprint',
      status: 'Status',
      types: 'Types',
      count: 'Count',
      active: 'Active',
      comingSoon: 'Coming Soon',
    },
    sections: {
      artifactSummary: 'Artifact Summary',
      observatorySnapshot: 'Observatory Snapshot',
      systemStatus: 'System Status',
    },
    artifacts: {
      traceDesc: 'Captured prompt assembly traces',
      timelineDesc: 'Sequenced build events across sessions',
      historyDesc: 'Persisted prompt assembly entries',
    },
    snapshot: {
      artifactCount: 'Artifact Count',
      hasTrace: 'Has Trace',
      hasTimeline: 'Has Timeline',
      hasHistory: 'Has History',
      hasTraceSnapshot: 'Has Trace Snapshot',
      hasTimelineSnapshot: 'Has Timeline Snapshot',
      hasHistorySnapshot: 'Has History Snapshot',
    },
    common: {
      yes: 'Yes',
      no: 'No',
    },
    runtime: {
      entities: 'Entities',
      systems: 'Systems',
      events: 'Events',
      fps: 'FPS',
      position: 'Position',
      state: 'State',
      health: 'Health',
      experience: 'Experience',
      level: 'Level',
      inspector: 'Entity Inspector',
      components: 'Components',
      componentCount: 'Component Count',
    },
    graph: {
      title: 'Trace Graph',
      legend: 'Legend',
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
    },
    events: {
      title: 'Event Stream',
      all: 'All',
      info: 'Info',
      warning: 'Warning',
      error: 'Error',
      source: 'Source',
      timestamp: 'Timestamp',
      message: 'Message',
    },
    world: {
      title: 'World Graph',
      legend: 'Legend',
      world: 'World',
      location: 'Location',
      npc: 'NPC',
      quest: 'Quest',
      active: 'Active',
      inactive: 'Inactive',
    },
  },
}
