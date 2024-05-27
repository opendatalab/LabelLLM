import type { IPagination } from '@/apps/supplier/services/task';

// 任务列表
export const taskKey = {
  all: ['task_key'] as const,
  lists: () => [...taskKey.all, 'list'] as const,
  list: (filter: IPagination) => [...taskKey.lists(), filter] as const,
  details: () => [...taskKey.all, 'details'] as const,
  detail: (id: string | number) => [...taskKey.details(), id] as const,
};

// 问题列表
export const questionKey = {
  all: ['question_key'] as const,
  lists: () => [...questionKey.all, 'list'] as const,
  list: (filter: string) => [...questionKey.lists(), filter] as const,
  details: () => [...questionKey.all, 'details'] as const,
  detail: (obj: any) => [...questionKey.details(), obj] as const,
};
