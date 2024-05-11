import type { LabelTaskStatisticsBody } from '../../services/task';

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
