import type { IUserInfo } from '@/api/user';
import { EUserRole } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { ssoUserInfoKey } from '@/constant/query-key-factories';

// 运营权限
export interface IAccessValue {
  canReadPage: boolean; // 是否能访问页面
  canReadPreview: boolean; // 是否能访问预览页面
}

type UserRoleMap = Record<EUserRole, IAccessValue>;

const roleAccessMap: UserRoleMap = {
  [EUserRole.super_admin]: {
    canReadPage: true,
    canReadPreview: true,
  },
  [EUserRole.admin]: {
    canReadPage: true,
    canReadPreview: true,
  },
  [EUserRole.user]: {
    canReadPage: true,
    canReadPreview: false,
  },
};

// 权限验证
export function hasPermission(permission: keyof IAccessValue) {
  const user = queryClient.getQueryData<IUserInfo>(ssoUserInfoKey.all);
  if (!user?.role) return false;
  return roleAccessMap[user?.role][permission];
}

export default roleAccessMap;
