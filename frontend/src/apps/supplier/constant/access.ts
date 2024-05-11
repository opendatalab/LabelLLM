import type { IUserInfo } from '@/api/user';
import { EUserRole } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { userInfoKey } from '@/constant/query-key-factories';

export interface IAccessValue {
  canReadPage: boolean; // 是否能访问页面
  canReadMember: boolean; // 是否能访问成员管理页面
}

// 用户团队权限

export const accessObj: Record<EUserRole, string> = {
  [EUserRole.admin]: '管理员',
  [EUserRole.user]: '普通用户',
};

type UserRoleMap = Record<EUserRole, IAccessValue>;

const roleAccessMap: UserRoleMap = {
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
  const user = queryClient.getQueryData<IUserInfo>(userInfoKey.all);
  const role = user?.role || EUserRole.user;
  return roleAccessMap[role][permission];
}

export default roleAccessMap;
