import type { AuditTaskStatisticsBody, LabelTaskStatisticsBody } from '../../services/task';

// 任务列表
export const labelTaskKey = {
  all: ['label_task_in_operator'] as const,
  lists: () => [...labelTaskKey.all, 'list'] as const,
  list: (filter: Record<string, string | string[]>) => [...labelTaskKey.lists(), filter] as const,
  details: () => [...labelTaskKey.all, 'details'] as const,
  detail: (id: string | number) => [...labelTaskKey.details(), id] as const,
};

export const labelerKey = {
  all: ['all_labelers'] as const,
  lists: () => [...labelTaskKey.all, 'list'] as const,
  list: (filter: LabelTaskStatisticsBody) => [...labelTaskKey.lists(), filter] as const,
  details: () => [...labelTaskKey.all, 'details'] as const,
  detail: (id: string | number) => [...labelTaskKey.details(), id] as const,
};

export const auditorKey = {
  all: ['all_auditors'] as const,
  lists: () => [...auditorKey.all, 'list'] as const,
  list: (filter: AuditTaskStatisticsBody) => [...auditorKey.lists(), filter] as const,
  details: () => [...auditorKey.all, 'details'] as const,
  detail: (id: string | number) => [...auditorKey.details(), id] as const,
};

// 任务列表
export const auditTaskKey = {
  all: ['audit_task_in_operator'] as const,
  lists: () => [...auditTaskKey.all, 'list'] as const,
  list: (filter: Record<string, string | string[]>) => [...auditTaskKey.lists(), filter] as const,
  details: () => [...auditTaskKey.all, 'details'] as const,
  detail: (id: string | number) => [...auditTaskKey.details(), id] as const,
};
