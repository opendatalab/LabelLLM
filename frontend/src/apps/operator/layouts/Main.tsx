import type { MenuDataItem } from '@ant-design/pro-components';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation, useRouteLoaderData, useMatches } from 'react-router-dom';
import {
  ImportOutlined,
  FileTextOutlined,
  MoreOutlined,
  InfoCircleFilled,
  QuestionCircleFilled,
  GithubFilled,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, MenuProps, Popover, Space, Tooltip } from 'antd';
import { ReactNode, useState } from 'react';
import { useEffect } from 'react';
import _ from 'lodash';

import { logout, IUserInfo } from '@/api/user';
import { goLogin } from '@/utils/sso';
import type { Match } from '@/components/Breadcrumb';
import { hasPermission } from '@/apps/operator/constant/access';
import NoAuth from '@/apps/operator/components/NoAuth';
import ErrorBoundary from '@/components/ErrorBoundary';
import IconFont from '@/components/IconFont';

import logo from '../assets/logo.svg';
import { ReactComponent as LabelingTitle } from '../assets/title.svg';

import './index.css';
import clsx from 'clsx';
import AppPanel from '@/components/AppPanel';

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useRouteLoaderData('root') as IUserInfo;
  const [collapse, setCollapse] = useState(false);

  // 导航菜单，不从 routes 文件读取，单独在此定义
  const route = {
    path: '/',
    children: [
      {
        path: '/task',
        name: '任务管理',
        icon: <IconFont type="icon-renwuguanli" />,
      },
      {
        path: '/users',
        name: '用户管理',
        hide: !hasPermission('canUsersPagePermission'),
        icon: <IconFont type="icon-yonghuguanli" />,
        children: [
          {
            path: 'team',
            name: '标注团队',
          },
          {
            path: 'operator',
            name: '运营人员',
          },
        ],
      },
    ].filter((item) => !item.hide),
  };

  const matches = useMatches() as Match[];
  const title = _.chain(matches)
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => match.handle.crumb!(match.data))
    .last()
    .value() as string;

  useEffect(() => {
    // 如果是根路径，跳转到任务管理（以任务管理为首页）
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/task');
    }
  }, [location.pathname, navigate]);

  const onLogout = async () => {
    await logout();
    goLogin();
  };

  const items: MenuProps['items'] = [
    {
      key: 'quit',
      icon: <ImportOutlined className="text-icon" />,
      label: <a onClick={onLogout}>退出登录</a>,
    },
  ];

  const name = userInfo?.name;

  const isRead = hasPermission('canReadPage');

  // 导航栏的默认样式 没有权限时，关闭导航栏的一些功能
  const defaultProperty = isRead
    ? {
        route,
      }
    : {
        defaultCollapsed: true,
        collapsedButtonRender: false,
        route: undefined,
      };

  return (
    <ProLayout
      className="layout-wrapper h-screen bg-white"
      logo={logo}
      // @ts-ignore
      title={<LabelingTitle className="ml-2 -mt-1" />}
      collapsed={collapse}
      onCollapse={setCollapse}
      breakpoint={false}
      pageTitleRender={() => title}
      token={{
        pageContainer: {
          paddingBlockPageContainerContent: 0,
          paddingInlinePageContainerContent: 0,
        },
        bgLayout: '#fff',
        sider: {
          colorMenuBackground: '#FFF',
          colorTextMenu: 'var(--color-text-base)',
          colorTextMenuActive: 'var(--color-text-base)',
          colorTextMenuItemHover: 'var(--color-primary)',
          colorTextMenuSelected: 'var(--color-primary)',
          colorBgMenuItemSelected: '#F4F5F9',
        },
      }}
      {...defaultProperty}
      menu={{ autoClose: false, defaultOpenAll: true }}
      // @ts-ignore
      ErrorBoundary={ErrorBoundary}
      location={location}
      avatarProps={{
        render: (p) => {
          return (
            <Dropdown placement="topLeft" menu={{ items }}>
              <div className={clsx('flex items-center gap-x-1 cursor-pointer', !collapse && 'pl-2')}>
                <Avatar className="bg-primary">{name[0]}</Avatar>
                {!collapse && <span className="text-color">{name}</span>}
              </div>
            </Dropdown>
          );
        },
      }}
      menuFooterRender={() => <div />}
      actionsRender={() => {
        return [
          <Tooltip title="帮助中心" placement="top" key="help">
            <a
              href="https://github.com/opendatalab/LabelLLM/wiki/%E5%B8%AE%E5%8A%A9%E4%B8%AD%E5%BF%83-%E2%80%90-%E8%BF%90%E8%90%A5%E7%AB%AF"
              target="_blank"
              className="text-color py-2"
              rel="noreferrer"
            >
              <FileTextOutlined className="text-sm" />
            </a>
          </Tooltip>,
          <AppPanel key="AppPanel" />,
        ];
      }}
      onMenuHeaderClick={() => navigate('/')}
      menuItemRender={(item: MenuDataItem, dom: ReactNode) => (
        <span
          onClick={() => {
            navigate(item.path || '/');
          }}
        >
          {dom}
        </span>
      )}
    >
      {!isRead ? (
        <NoAuth />
      ) : (
        <PageContainer
          header={{
            breadcrumb: {},
            title: null,
          }}
        >
          <Outlet />
        </PageContainer>
      )}
    </ProLayout>
  );
};
