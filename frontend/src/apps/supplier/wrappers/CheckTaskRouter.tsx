import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { ERouterTaskType } from '@/apps/supplier/constant/task';

type IProps = HTMLAttributes<HTMLDivElement>;

const CheckTaskRouter: React.FC<PropsWithChildren<IProps>> = ({ children }) => {
  const { type } = useParams<{ type: ERouterTaskType }>();

  const isRouter = Object.values(ERouterTaskType).some((item) => item === type);
  if (type && !isRouter) {
    return <Navigate to="/404" />;
  }

  return <>{children}</>;
};

export default CheckTaskRouter;
