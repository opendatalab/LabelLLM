import type { IUserInfo } from '@/api/user';
import { EUserRole } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { ssoUserInfoKey } from '@/constant/query-key-factories';

export interface IAccessValue {
  canReadPage: boolean; // 是否能访问页面
  canReadUsersPage: boolean; // 是否能访问用户管理页面
  canUsersPagePermission: boolean; // 是否有用户管理模块权限
}

type UserRoleMap = Record<EUserRole, IAccessValue>;

/**
 * 后台管理可以看着只有两个角色，管理员和普通用户
 * 管理员 ---> 超级管理员 EUserRole.super_admin
 * 普通成员  ---> 管理员 EUserRole.admin
 */

const roleAccessMap: UserRoleMap = {
  [EUserRole.super_admin]: {
    canReadPage: true,
    canUsersPagePermission: true,
    canReadUsersPage: true,
  },
  [EUserRole.admin]: {
    canReadPage: true,
    canUsersPagePermission: false,
    canReadUsersPage: false,
  },
  [EUserRole.user]: {
    canReadPage: false,
    canUsersPagePermission: false,
    canReadUsersPage: false,
  },
};

export function hasPermission(permission: keyof IAccessValue) {
  const user = queryClient.getQueryData<IUserInfo>(ssoUserInfoKey.all);
  if (!user?.role) return false;
  return roleAccessMap[user?.role][permission];
}

export default roleAccessMap;
