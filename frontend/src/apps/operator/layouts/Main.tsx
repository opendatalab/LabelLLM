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
import { Avatar, Button, Dropdown, Popover, Space } from 'antd';
import type { ReactNode } from 'react';
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

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useRouteLoaderData('root') as IUserInfo;

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
      menuFooterRender={({ collapsed }: any) => {
        return (
          <div className="flex flex-col px-2 gap-2">
            <div className={clsx(collapsed ? 'px-1' : 'flex px-10 mb-4')}>
              <Button
                icon={<FileTextOutlined />}
                shape="round"
                size="small"
                block={!collapsed}
                href="https://github.com/opendatalab/LabelLLM/wiki/%E5%B8%AE%E5%8A%A9%E4%B8%AD%E5%BF%83-%E2%80%90-%E8%BF%90%E8%90%A5%E7%AB%AF"
                target="_blank"
                className={clsx({ 'text-color h-[32px] py-[4px]': !collapsed })}
                type={collapsed ? 'text' : 'default'}
              >
                {!collapsed && '帮助中心'}
              </Button>
            </div>
            <Popover
              key="userinfo"
              arrow={false}
              placement="rightTop"
              content={
                <div className="flex flex-col">
                  <Button type="text" onClick={onLogout} icon={<ImportOutlined className="text-icon" />}>
                    退出登录
                  </Button>
                </div>
              }
            >
              <div className="flex items-center justify-between rounded-sm p-2 hover:bg-slate-50">
                <div className="flex items-center justify-start">
                  <Avatar className="bg-primary text-xl mr-2">{name?.[0]}</Avatar>
                  <span className={clsx('text-color', { hidden: collapsed })}>{name}</span>
                </div>
                <MoreOutlined className={clsx('text-color', { hidden: collapsed })} />
              </div>
            </Popover>
          </div>
        );
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
