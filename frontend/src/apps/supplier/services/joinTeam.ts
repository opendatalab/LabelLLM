import request from '@/api/request';

/**
 * 邀请链接详情
 */
interface IInviteLinkDetail {
  is_expired: boolean; // 是否过期
  is_joined: boolean; // 是否已加入
  team_name: string; // 团队名称
  team_id: string; // 团队id
}
export const getInviteLinkDetail = async (link_id: string): Promise<IInviteLinkDetail> => {
  return request.get(`/v1/user/team/invitations/${link_id}`);
};

/**
 * 加入团队
 */
export const joinTeam = async (params: { team_id: string }): Promise<void> => {
  return request.post(`/v1/user/invitations/join`, params);
};
