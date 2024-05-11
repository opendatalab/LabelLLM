import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';

import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import type { ERouterTaskType } from '@/apps/supplier/constant/task';

type IProps = HTMLAttributes<HTMLDivElement> & {
  types: ERouterTaskType[];
};

const CheckTaskType: React.FC<PropsWithChildren<IProps>> = ({ types, children }) => {
  const { type } = useTaskParams();
  if (types.includes(type)) return <>{children}</>;
  return null;
};

export default CheckTaskType;
