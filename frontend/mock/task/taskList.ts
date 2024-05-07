import type { MockMethod } from 'vite-plugin-mock';

export default [
  {
    url: '/api/v1/operator/task/list',
    method: 'get',
    timeout: 200,
    response: () => {
      return new Array(100).fill(0).map((_, index) => {
        return {
          id: index,
          name: '很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称',
          status: ['unready', 'processing'][index % 2],
          progress: 20,
          created_by: '我是创建人',
          created_at: '2021-08-01 12:00:00',
          updated_at: '2021-08-01 12:00:00',
        };
      });
    },
  },
  {
    url: '/api/v1/operator/task/list/:id',
    method: 'get',
    timeout: 200,
    response: () => {
      return {
        id: 3,
        name: '很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称很长的名称',
        status: 'processing',
        progress: 20,
        description: '我是描述',
        created_by: '我是创建人',
        created_at: '2021-08-01 12:00:00',
        updated_at: '2021-08-01 12:00:00',
      };
    },
  },
] as MockMethod[];
