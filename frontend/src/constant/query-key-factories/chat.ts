// 对话列表
export const chatKey = {
  all: ['chat_key'] as const,
  lists: () => [...chatKey.all, 'list'] as const,
  list: (filter: string) => [...chatKey.lists(), filter] as const,
  details: () => [...chatKey.all, 'details'] as const,
  detail: (id: string | number) => [...chatKey.details(), id] as const,
};

// 消息列表
export const messageKey = {
  all: ['message_key'] as const,
  lists: () => [...messageKey.all, 'list'] as const,
  list: (filter: string) => [...messageKey.lists(), filter] as const,
  details: () => [...messageKey.all, 'details'] as const,
  detail: (id: string | number) => [...messageKey.details(), id] as const,
};
