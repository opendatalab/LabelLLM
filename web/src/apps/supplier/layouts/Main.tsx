import type { MenuDataItem } from '@ant-design/pro-components';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation, useRouteLoaderData } from 'react-router-dom';
import { ProfileOutlined, MoreOutlined, ImportOutlined, UserOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd';
import { type ReactNode } from 'react';

import type { SSOUserInfo } from '@/api/sso';
import { logout } from '@/api/sso';
import { goAuth, goLogin, goSSO } from '@/utils/sso';
import { hasPermission } from '@/apps/supplier/constant/access';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import ErrorBoundary from '@/components/ErrorBoundary';

import logo from '../assets/logo.svg';
import './index.css';

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useRouteLoaderData('root') as SSOUserInfo;
  const { isPreview } = useTaskParams();

  // 导航菜单，不从 routes 文件读取，单独在此定义
  const route = {
    path: '/',
    children: [
      {
        path: '/task',
        name: '任务',
        icon: <ProfileOutlined />,
        children: [
          {
            path: '/task',
          },
          {
            path: '/audit',
          },
        ],
      },
      {
        path: '/member',
        name: '成员管理',
        hide: !hasPermission('canReadMember'),
        icon: <UsergroupAddOutlined />,
      },
    ].filter((item) => !item.hide),
  };

  const onLogout = async () => {
    await logout();
    goLogin();
  };

  const name = userInfo?.username || userInfo?.nickname;
  return (
    <ProLayout
      className="layout-wrapper"
      logo={logo}
      // @ts-ignore
      title={<span className="text-primary ml-2 text-xl">冰山之下</span>}
      pageTitleRender={() => ''}
      defaultCollapsed={true}
      breakpoint={false}
      token={{
        pageContainer: {
          paddingBlockPageContainerContent: 0,
          paddingInlinePageContainerContent: 0,
        },
        sider: {
          colorMenuBackground: '#fff',
          colorTextMenu: 'var(--color-text-base)',
          colorTextMenuActive: 'var(--color-text-base)',
          colorTextMenuItemHover: 'var(--color-text-base)',
          colorTextMenuSelected: 'var(--color-text-base)',
        },
      }}
      headerTitleRender={() => <span>33</span>}
      route={!isPreview ? route : []}
      suppressSiderWhenMenuEmpty={true}
      // @ts-ignore
      ErrorBoundary={ErrorBoundary}
      location={location}
      avatarProps={{
        src: userInfo?.avatar,
        icon: <span className="flex items-center h-full justify-center">{name?.[0]}</span>,
        title: name,
        style: !userInfo?.avatar
          ? {
              background: 'var(--color-primary)',
            }
          : {},
      }}
      actionsRender={() => [
        <Popover
          key="userinfo"
          arrow={false}
          placement="rightTop"
          content={
            <div className="flex flex-col">
              <Button type="text" onClick={goSSO} icon={<UserOutlined className="text-icon" />}>
                个人中心
              </Button>
              <Button type="text" onClick={onLogout} icon={<ImportOutlined className="text-icon" />}>
                退出登录
              </Button>
              {import.meta.env.DEV && (
                <Button type="text" onClick={goAuth} icon={<ImportOutlined className="text-icon" />}>
                  登录
                </Button>
              )}
            </div>
          }
        >
          <Button key="download" type="text" icon={<MoreOutlined className="!text-icon text-base" />} />
        </Popover>,
      ]}
      onMenuHeaderClick={() => {
        window.location.href = '/';
      }}
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
      <PageContainer
        header={{
          breadcrumb: {},
          title: null,
        }}
      >
        <div className="min-h-screen bg-white">
          <Outlet />
        </div>
      </PageContainer>
    </ProLayout>
  );
};
