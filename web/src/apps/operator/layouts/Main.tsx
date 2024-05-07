import type { MenuDataItem } from '@ant-design/pro-components';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation, useRouteLoaderData, useMatches } from 'react-router-dom';
import { ImportOutlined, UserOutlined, FileTextOutlined, MoreOutlined } from '@ant-design/icons';
import { Avatar, Button, Popover, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import _ from 'lodash';

import type { SSOUserInfo } from '@/api/sso';
import { logout } from '@/api/sso';
import { goAuth, goLogin, goSSO } from '@/utils/sso';
import type { Match } from '@/components/Breadcrumb';
import { hasPermission } from '@/apps/operator/constant/access';
import NoAuth from '@/apps/operator/components/NoAuth';
import ErrorBoundary from '@/components/ErrorBoundary';
import IconFont from '@/components/icon-font';

import logo from '../assets/logo.svg';
import { ReactComponent as LabelingTitle } from '../assets/title.svg';

import './index.css';

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useRouteLoaderData('root') as SSOUserInfo;

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
            name: '执行团队',
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

  const name = userInfo?.username || userInfo?.nickname;

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
      menuFooterRender={({ collapsed }: any) =>
        collapsed ? (
          <div className="flex flex-col gap-4 items-center p-2">
            <Tooltip title="帮助中心" placement="right">
              <a
                href="https://aicarrier.feishu.cn/drive/folder/EXc9fYpWLlFKJ6dJx8Fch7j4nFE?from=from_copylink"
                target="_blank"
                className="text-color py-2"
                rel="noreferrer"
              >
                <FileTextOutlined />
              </a>
            </Tooltip>

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
              <div className="flex items-center gap-2 justify-start rounded-sm p-2 hover:bg-slate-50">
                <Avatar
                  src={userInfo?.avatar}
                  style={
                    !userInfo?.avatar
                      ? {
                          background: 'var(--color-primary)',
                        }
                      : {}
                  }
                >
                  {name?.[0]}
                </Avatar>
              </div>
            </Popover>
          </div>
        ) : (
          <div className="flex flex-col px-4 gap-2">
            <div className="flex px-10 mb-4">
              <Button
                icon={<FileTextOutlined />}
                shape="round"
                block
                href="https://aicarrier.feishu.cn/drive/folder/EXc9fYpWLlFKJ6dJx8Fch7j4nFE?from=from_copylink"
                target="_blank"
                className="text-color h-[32px] py-[4px]"
              >
                帮助中心
              </Button>
            </div>
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
              <div className="flex items-center justify-between rounded-sm p-2 hover:bg-slate-50">
                <div className="flex items-center gap-2 justify-start">
                  <Avatar
                    src={userInfo?.avatar}
                    style={
                      !userInfo?.avatar
                        ? {
                            background: 'var(--color-primary)',
                          }
                        : {}
                    }
                  >
                    {name?.[0]}
                  </Avatar>
                  <span className="text-color">{name}</span>
                </div>
                <MoreOutlined className="text-color" />
              </div>
            </Popover>
          </div>
        )
      }
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
