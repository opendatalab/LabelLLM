import type { BreadcrumbItemProps } from 'antd';
import { Breadcrumb as BreadcrumbAnt } from 'antd';
import type { Params } from 'react-router-dom';
import { useLocation, Link, useMatches } from 'react-router-dom';

export interface Match {
  id: string;
  pathname: string;
  params: Params<string>;
  data: unknown;
  handle: {
    crumb?: (data?: any) => React.ReactNode;
  };
}

export interface CustomBreadcrumbProps extends BreadcrumbItemProps {
  className?: string;
  /** 有些页面不需要显示首页的标题 */
  hideHome?: boolean;
  style?: React.CSSProperties;
  separator?: React.ReactNode;
  /** 当路由深度小于等于这个值时不显示面包屑 */
  hiddenDepth?: number;
}

/**
 * 面包屑导航
 * 通过react-router-dom 的useMatches得到route的父子路径
 */
function Breadcrumb({ className, hiddenDepth, hideHome = false, style, ...rest }: CustomBreadcrumbProps) {
  const matches = useMatches() as Match[];
  const location = useLocation();
  const paths = location.pathname.split('/');

  if (location.pathname.endsWith('/')) {
    paths.pop();
  }

  if (hiddenDepth && paths.length <= hiddenDepth) {
    return null;
  }

  const crumbs = matches.filter((match) => {
    if (hideHome && match.pathname === '/') {
      return false;
    }

    return Boolean(match.handle?.crumb?.(match.data));
  });
  const items = crumbs.map((match, index) => {
    const title = match.handle.crumb!(match.data);

    return {
      title: index === crumbs.length - 1 ? title : <Link to={match.pathname}>{title}</Link>,
      key: match.pathname,
    };
  });

  return <BreadcrumbAnt className={className} style={style} items={items} {...rest} />;
}

export default Breadcrumb;
