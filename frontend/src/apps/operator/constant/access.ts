import type { IUserInfo } from '@/api/user';
import { EUserRole } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { userInfoKey } from '@/constant/query-key-factories';

export interface IAccessValue {
  canReadPage: boolean; // 是否能访问页面
  canReadUsersPage: boolean; // 是否能访问用户管理页面
  canUsersPagePermission: boolean; // 是否有用户管理模块权限
}

type UserRoleMap = Record<EUserRole, IAccessValue>;

const roleAccessMap: UserRoleMap = {
  [EUserRole.admin]: {
    canReadPage: true,
    canUsersPagePermission: true,
    canReadUsersPage: true,
  },
  [EUserRole.user]: {
    canReadPage: true,
    canUsersPagePermission: true,
    canReadUsersPage: true,
  },
};

export function hasPermission(permission: keyof IAccessValue) {
  const user = queryClient.getQueryData<IUserInfo>(userInfoKey.all);
  if (!user?.role) return false;
  return roleAccessMap[user?.role][permission];
}

export default roleAccessMap;
