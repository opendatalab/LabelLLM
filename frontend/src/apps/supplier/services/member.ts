import request from '@/api/request';
import type { ETeamAccess } from '@/api/team';

/**
 * 获取用户所在的团队信息
 */
export interface IUserTeamInfo {
  user_id: string;
  role: ETeamAccess;
  team_id: string;
}
export const getUserTeamInfo = async (): Promise<IUserTeamInfo> => {
  return request.post('/v1/user/team/list').then((res: any) => res?.list?.[0]);
};
