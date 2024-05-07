import { Navigate } from 'react-router-dom';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';

import { hasPermission } from '@/apps/supplier/constant/access';

type IProps = HTMLAttributes<HTMLDivElement>;

const CheckMemberAuth: React.FC<PropsWithChildren<IProps>> = ({ children }) => {
  if (!hasPermission('canReadMember')) {
    return <Navigate to="/task" />;
  }
  return <>{children}</>;
};

export default CheckMemberAuth;
