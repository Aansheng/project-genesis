import type { MessageCatalog } from '../index'

/**
 * Simplified Chinese catalog — Observatory namespace (WO-S6-006.5).
 * Default observatory language is 'zh-CN'.
 */
export const zhCN: MessageCatalog = {
  observatory: {
    title: '可观测中心',
    panels: {
      overview: '概览',
      trace: '追踪',
      timeline: '时间线',
      history: '历史记录',
      diff: '差异分析',
      runtime: '运行时',
      settings: '设置',
    },
    status: {
      ready: '就绪',
    },
    labels: {
      version: '版本',
      sprint: '迭代',
      status: '状态',
      count: '数量',
      active: '活动',
      comingSoon: '即将推出',
    },
    sections: {
      artifactSummary: '工件概览',
      observatorySnapshot: '可观测中心快照',
      systemStatus: '系统状态',
    },
    artifacts: {
      traceDesc: '捕获的提示词组装追踪',
      timelineDesc: '跨会话的序列化构建事件',
      historyDesc: '持久化的提示词组装条目',
    },
    snapshot: {
      artifactCount: '工件数量',
      hasTrace: '有追踪记录',
      hasTimeline: '有时间线',
      hasHistory: '有历史记录',
      hasTraceSnapshot: '有追踪快照',
      hasTimelineSnapshot: '有时间线快照',
      hasHistorySnapshot: '有历史快照',
    },
    common: {
      yes: '是',
      no: '否',
    },
    runtime: {
      entities: '实体',
      systems: '系统',
      events: '事件',
      fps: '运行帧率',
      position: '位置',
      state: '状态',
      health: '生命值',
    },
  },
}