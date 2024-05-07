// 团队列表
export const operatorTeamKey = {
  all: ['operator_teams'] as const,
  lists: () => [...operatorTeamKey.all, 'list'] as const,
  list: (filter: any) => [...operatorTeamKey.lists(), filter] as const,
  details: () => [...operatorTeamKey.all, 'details'] as const,
  detail: (id: string | number) => [...operatorTeamKey.details(), id] as const,
};
