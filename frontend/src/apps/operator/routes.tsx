import loadable from '@loadable/component';
import { Spin } from 'antd';

import RequireAuth from '@/wrappers/RequireSSO';
import { ssoLoader } from '@/loaders/sso.loader';

import MainLayout from './layouts/Main';
import CheckChildRoute from './wrappers/CheckChildRoute';
import { labelTaskLoader } from './loaders/task.loader';
import CheckUsersPagePermission from './wrappers/CheckUsersPagePermission';
import { teamLoader } from './loaders/team.loader';
import type { OperatorTask } from './services/task';
import type { ITeam } from './services/team';

const moduleSpin = {
  fallback: <Spin className="w-full mt-[30vh]" />,
};

const LabelTask = loadable(() => import('./pages/task'), moduleSpin);
const UserTeam = loadable(() => import('./pages/users.team'), moduleSpin);
const LabelTaskDetail = loadable(() => import('./pages/task.label.[id]'), moduleSpin);
const CreateLabelTask = loadable(() => import('./pages/task.label.create'), moduleSpin);
const UsersTeamMember = loadable(() => import('./pages/users.team.[id]'), moduleSpin);
const UsersOperator = loadable(() => import('./pages/users.operator'), moduleSpin);

export default [
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    // 此ID可以用于在路由中获取loader中的数据
    id: 'root',
    loader: ssoLoader,
    handle: {
      crumb: () => {
        return '任务管理';
      },
    },
    children: [
      {
        path: 'task',
        id: 'labelTaskList',
        element: (
          <CheckChildRoute>
            <LabelTask />
          </CheckChildRoute>
        ),
        children: [
          {
            path: 'create',
            element: <CreateLabelTask />,
            handle: {
              crumb: () => {
                return '新建任务';
              },
            },
          },
          {
            path: ':id',
            loader: labelTaskLoader,
            id: 'labelTask',
            element: (
              <CheckChildRoute>
                <LabelTaskDetail />
              </CheckChildRoute>
            ),
            handle: {
              crumb: (data: OperatorTask) => {
                return data?.title;
              },
            },
            children: [
              {
                path: 'edit',
                element: <CreateLabelTask />,
                handle: {
                  crumb: () => {
                    return '编辑任务';
                  },
                },
              },
            ],
          },
        ],
      },
      {
        path: 'users',
        element: <CheckUsersPagePermission />,
        children: [
          {
            path: 'team',
            element: (
              <CheckChildRoute>
                <UserTeam />
              </CheckChildRoute>
            ),
            handle: {
              crumb: () => {
                return '标注团队';
              },
            },
            children: [
              {
                path: ':team_id',
                loader: teamLoader,
                element: <UsersTeamMember />,
                handle: {
                  crumb: (data: ITeam) => {
                    return data?.name || '团队详情页';
                  },
                },
              },
            ],
          },
          {
            path: 'operator',
            element: <UsersOperator />,
            handle: {
              crumb: () => {
                return '运营人员';
              },
            },
          },
        ],
      },
    ],
  },
];
