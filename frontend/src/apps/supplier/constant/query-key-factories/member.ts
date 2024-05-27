// 任务列表
export const memberKey = {
  all: ['member_key'] as const,
  lists: () => [...memberKey.all, 'memberKey'] as const,
  list: (filter: any) => [...memberKey.lists(), filter] as const,
  details: () => [...memberKey.all, 'details'] as const,
  detail: (id: string | number) => [...memberKey.details(), id] as const,
};
