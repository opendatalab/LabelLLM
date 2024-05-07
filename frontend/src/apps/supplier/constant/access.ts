import type { IUserInfo } from '@/api/user';
import { EUserRole } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { ssoUserInfoKey } from '@/constant/query-key-factories';
import { ETeamAccess } from '@/api/team';

export interface IAccessValue {
  canReadPage: boolean; // 是否能访问页面
  canReadMember: boolean; // 是否能访问成员管理页面
}

// 用户团队权限

export const accessObj: Record<ETeamAccess, string> = {
  [ETeamAccess.super_admin]: '超级管理员',
  [ETeamAccess.admin]: '管理员',
  [ETeamAccess.user]: '普通用户',
};

type UserRoleMap = Record<ETeamAccess, IAccessValue>;

const roleAccessMap: UserRoleMap = {
  [EUserRole.super_admin]: {
    canReadPage: true,
    canReadMember: true,
  },
  [EUserRole.admin]: {
    canReadPage: true,
    canReadMember: true,
  },
  [EUserRole.user]: {
    canReadPage: true,
    canReadMember: false,
  },
};

// 校验当前用户的团队权限
export function hasPermission(permission: keyof IAccessValue) {
  const user = queryClient.getQueryData<IUserInfo>(ssoUserInfoKey.all);
  const role = user?.teams?.[0]?.role || ETeamAccess.user;
  return roleAccessMap[role][permission];
}

export default roleAccessMap;
