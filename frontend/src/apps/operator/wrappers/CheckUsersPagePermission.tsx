import { Outlet, Navigate } from 'react-router-dom';

import { hasPermission } from '@/apps/operator/constant/access';

const CheckUsersPagePermission = () => {
  if (!hasPermission('canUsersPagePermission')) {
    return <Navigate to="/task" />;
  }
  return <Outlet />;
};

export default CheckUsersPagePermission;
