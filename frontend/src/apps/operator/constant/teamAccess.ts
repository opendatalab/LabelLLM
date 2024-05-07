// 团队权限管理
import { ETeamAccess } from '@/api/team';

export const teamAccessObj = {
  [ETeamAccess.super_admin]: '超级管理员',
  [ETeamAccess.admin]: '管理员',
  [ETeamAccess.user]: '普通用户',
};
