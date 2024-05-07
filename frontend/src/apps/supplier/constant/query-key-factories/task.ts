import type { IPagination } from '@/apps/supplier/services/task';

// 任务列表
export const taskKey = {
  all: ['task_key'] as const,
  lists: () => [...taskKey.all, 'list'] as const,
  list: (filter: IPagination) => [...taskKey.lists(), filter] as const,
  details: () => [...taskKey.all, 'details'] as const,
  detail: (id: string | number) => [...taskKey.details(), id] as const,
};

// 审核任务列表
export const auditTaskKey = {
  all: ['audit_task_key'] as const,
  lists: () => [...auditTaskKey.all, 'list'] as const,
  list: (filter: IPagination) => [...auditTaskKey.lists(), filter] as const,
  details: () => [...auditTaskKey.all, 'details'] as const,
  detail: (id: string | number) => [...auditTaskKey.details(), id] as const,
};

// 问题列表
export const questionKey = {
  all: ['question_key'] as const,
  lists: () => [...questionKey.all, 'list'] as const,
  list: (filter: string) => [...questionKey.lists(), filter] as const,
  details: () => [...questionKey.all, 'details'] as const,
  detail: (obj: any) => [...questionKey.details(), obj] as const,
};

// 审核问题列表
export const auditQuestionKey = {
  all: ['audit_question_key'] as const,
  lists: () => [...auditQuestionKey.all, 'list'] as const,
  list: (filter: string) => [...auditQuestionKey.lists(), filter] as const,
  details: () => [...auditQuestionKey.all, 'details'] as const,
  detail: (obj: any) => [...auditQuestionKey.details(), obj] as const,
};
