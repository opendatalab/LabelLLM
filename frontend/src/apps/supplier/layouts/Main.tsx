import type { MenuDataItem } from '@ant-design/pro-components';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation, useRouteLoaderData } from 'react-router-dom';
import { ProfileOutlined, MoreOutlined, ImportOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, MenuProps, Popover } from 'antd';
import { useState, type ReactNode } from 'react';

import { IUserInfo, logout } from '@/api/user';
import { goLogin } from '@/utils/sso';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppPanel from '@/components/AppPanel';

import logo from '../assets/logo.svg';
import { ReactComponent as Title } from '@/apps/supplier/assets/title.svg';
import { FormattedMessage } from 'react-intl';
import IconFont from '@/components/IconFont';
import clsx from 'clsx';
import useLang from '@/hooks/useLang';
import './index.css';

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useRouteLoaderData('root') as IUserInfo;
  const { isPreview } = useTaskParams();
  const { setLang, isZh } = useLang();
  const [collapse, setCollapse] = useState(false);

  // 导航菜单，不从 routes 文件读取，单独在此定义
  const route = {
    path: '/',
    children: [
      {
        path: '/task',
        name: <FormattedMessage id="task.menu.name" />,
        icon: <ProfileOutlined />,
        children: [
          {
            path: '/task',
          },
        ],
      },
    ],
  };

  const onLogout = async () => {
    await logout();
    goLogin();
  };

  const items: MenuProps['items'] = [
    {
      key: 'quit',
      icon: <IconFont className="!text-base" type="icon-tuichu" />,
      label: (
        <a onClick={onLogout}>
          <FormattedMessage id={'common.quit'} />
        </a>
      ),
    },
  ];

  const name = userInfo?.name;
  return (
    <ProLayout
      className="layout-wrapper"
      logo={logo}
      // @ts-ignore
      title={<Title className="ml-2 mt-1" />}
      pageTitleRender={() => ''}
      defaultCollapsed={true}
      breakpoint={false}
      collapsed={collapse}
      onCollapse={setCollapse}
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
        render: () => (
          // @ts-ignore
          <Dropdown placement="leftTop" menu={{ items }}>
            <div className={clsx('flex items-center gap-x-1 cursor-pointer', !collapse && 'ml-4')}>
              <Avatar className="bg-primary">{name[0]}</Avatar>
              {!collapse && <span className="text-color">{name}</span>}
            </div>
          </Dropdown>
        ),
      }}
      actionsRender={() => [
        <IconFont
          key="lang"
          type="icon-zhongyingwenfanyi"
          className="text-color hover:text-black"
          onClick={() => setLang(isZh ? 'en-US' : 'zh-CN')}
        />,
        <span key="1" className="text-color" onClick={() => setCollapse(!collapse)}>
          {collapse ? <IconFont type="icon-zhankai" /> : <IconFont type="icon-shouqi" />}
        </span>,
      ]}
      onMenuHeaderClick={() => {
        window.location.href = '/supplier';
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
