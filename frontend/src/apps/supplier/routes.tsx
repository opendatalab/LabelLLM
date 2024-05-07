import loadable from '@loadable/component';
import { Spin } from 'antd';
import { Navigate } from 'react-router';

import { ssoLoader } from '@/loaders/sso.loader';
import RequireSSO from '@/wrappers/RequireSSO';
import CheckMemberAuth from '@/apps/supplier/wrappers/CheckMemberAuth';
import CheckTaskRouter from '@/apps/supplier/wrappers/CheckTaskRouter';

import MainLayout from './layouts/Main';
import CheckPreviewAuth from './wrappers/CheckPreviewAuth';
import { userTeamInfoLoader } from './loaders/userTeamInfo.loader';

const moduleSpin = {
  fallback: <Spin className="w-full mt-[30vh]" />,
};

const Task = loadable(() => import('./pages/task'), moduleSpin);
const TaskDetail = loadable(() => import('./pages/task.[id]'), moduleSpin);
const Join = loadable(() => import('./pages/join-team'), moduleSpin);
const Member = loadable(() => import('./pages/member'), moduleSpin);
const NotFound = loadable(() => import('./pages/404'), moduleSpin);

export default [
  {
    path: '/',
    element: (
      <RequireSSO>
        <MainLayout />
      </RequireSSO>
    ),
    loader: ssoLoader,
    // 此ID可以用于在路由中获取loader中的数据
    id: 'root',
    handle: {
      crumb: () => {
        return '冰山之下 - 数据贡献';
      },
    },
    children: [
      {
        index: true,
        element: <Navigate to="/task" />,
        handle: {
          crumb: () => {
            return '冰山之下 - 数据贡献';
          },
        },
      },
      {
        path: ':type',
        element: (
          <CheckTaskRouter>
            <Task key="audit" />
          </CheckTaskRouter>
        ),
        handle: {
          crumb: () => {
            return '任务 - 冰山之下';
          },
        },
      },
      {
        // type 类型 看查看 constants/task.ts ERouterTaskType
        path: ':type/:id',
        element: (
          <CheckTaskRouter>
            <CheckPreviewAuth>
              <TaskDetail />
            </CheckPreviewAuth>
          </CheckTaskRouter>
        ),
        hideInMenu: true,
        handle: {
          crumb: () => {
            return '任务详情 - 冰山之下';
          },
        },
      },
      {
        path: 'member',
        loader: userTeamInfoLoader,
        element: (
          <CheckMemberAuth>
            <Member />
          </CheckMemberAuth>
        ),
        handle: {
          crumb: () => {
            return '成员管理';
          },
        },
      },
      {
        path: '404',
        element: <NotFound />,
        handle: {
          crumb: () => {
            return '成员管理';
          },
        },
      },
    ],
  },
  {
    path: '/join/:id',
    element: <Join />,
    loader: ssoLoader,
    handle: {
      crumb: () => {
        return '加入团队';
      },
    },
  },
];
