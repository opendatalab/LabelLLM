import Login from './pages/home';

export default [
  {
    path: '/',
    element: <Login />,
    // 此ID可以用于在路由中获取loader中的数据
    id: 'root',
    handle: {
      crumb: () => {
        return 'LabelU-LLM';
      },
    },
  },
  {
    path: '/login',
    element: <Login />,
    // 此ID可以用于在路由中获取loader中的数据
    id: 'login',
    handle: {
      crumb: () => {
        return 'LabelU-LLM';
      },
    },
  },
];
