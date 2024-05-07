import Login from './pages/login';

export default [
  {
    path: '/',
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
