/**
 * 此组件可用于react-router>=6.4.0的特性，比如loader等Data API
 * 见：https://reactrouter.com/en/main/routers/picking-a-router
 */
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import _ from 'lodash';
import { useTitle } from 'ahooks';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useMatches } from 'react-router-dom';

import type { Match } from '@/components/Breadcrumb';

export type RouteWithParent = RouteObject & {
  parent: RouteWithParent | null;
};

// 将对应的面包屑信息添加到页面标题中
function RouteWithTitle({ children }: { children: React.ReactNode }) {
  const matches = useMatches() as Match[];
  const title = _.chain(matches)
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => match.handle.crumb!(match.data))
    .last()
    .value() as string;

  useTitle(title || '标注平台');

  return <>{children}</>;
}

function mapRoutes(
  inputRoutes: RouteObject[],
  parentPath: string = '',
  parentRoute: RouteWithParent | null = null,
): React.ReactNode {
  return inputRoutes.map((route) => {
    const { path, element, children, index, ...restProps } = route;
    const routeWithParent: RouteWithParent = { ...route, parent: parentRoute };
    const comp = <RouteWithTitle key={`${parentPath}-${path}`}>{element}</RouteWithTitle>;

    if (index) {
      return (
        <Route
          index={Boolean(index)}
          key={`${parentPath}-${path}`}
          path={undefined}
          element={comp as React.ReactElement}
          {...(restProps as any)}
        />
      );
    }

    return (
      <Route key={`${parentPath}-${path}`} path={path} element={comp as React.ReactElement} {...(restProps as any)}>
        {Array.isArray(children) ? mapRoutes(children, path, routeWithParent) : null}
      </Route>
    );
  });
}

export interface RouterProps {
  routes: RouteObject[];
  basename?: string;
}

export default function RouterContainer({ routes, basename }: RouterProps) {
  const router = useMemo(
    () =>
      createBrowserRouter(createRoutesFromElements(mapRoutes(routes)), {
        basename,
      }),
    [basename, routes],
  );
  const fallback = <Spin style={{ width: '100vw', marginTop: '40vh' }} spinning />;

  return <RouterProvider router={router} fallbackElement={fallback} />;
}
