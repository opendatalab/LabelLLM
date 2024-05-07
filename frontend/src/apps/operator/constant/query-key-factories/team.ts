// 团队列表
export const teamKey = {
  all: ['team_key'] as const,
  lists: () => [...teamKey.all, 'list'] as const,
  list: (filter: any) => [...teamKey.lists(), filter] as const,
  details: () => [...teamKey.all, 'details'] as const,
  detail: (id: string | number) => [...teamKey.details(), id] as const,
};

// 团队成员列表
export const teamMemberKey = {
  all: ['team_member_key'] as const,
  lists: () => [...teamMemberKey.all, 'list'] as const,
  list: (filter: any) => [...teamMemberKey.lists(), filter] as const,
  details: () => [...teamMemberKey.all, 'details'] as const,
  detail: (id: string | number) => [...teamMemberKey.details(), id] as const,
};
