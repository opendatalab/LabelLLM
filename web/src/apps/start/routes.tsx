import Start from './pages/start';

export default [
  {
    path: '/',
    element: <Start />,
    // 此ID可以用于在路由中获取loader中的数据
    id: 'start',
    handle: {
      crumb: () => {
        return '冰山之下 - 项目官网';
      },
    },
  },
];
