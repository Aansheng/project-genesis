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
      settings: 'Settings',
    },
    status: {
      ready: 'Ready',
    },
    labels: {
      version: 'Version',
      sprint: 'Sprint',
      status: 'Status',
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
  },
}