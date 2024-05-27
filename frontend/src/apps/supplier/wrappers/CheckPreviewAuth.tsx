import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { useParams } from 'react-router-dom';

import { ERouterTaskType } from '@/apps/supplier/constant/task';
import { goLogin } from '@/utils/sso';
import { hasPermission } from '@/apps/supplier/constant/operatorAccess';

type IProps = HTMLAttributes<HTMLDivElement>;

const CheckPreviewAuth: React.FC<PropsWithChildren<IProps>> = ({ children }) => {
  const { type } = useParams<{ type: ERouterTaskType }>();

  // 当前任务类型为预览，并且没有预览权限
  if (type && [ERouterTaskType.preview, ERouterTaskType.review].includes(type) && !hasPermission('canReadPreview')) {
    goLogin();
    return null;
  }

  return <>{children}</>;
};

export default CheckPreviewAuth;
