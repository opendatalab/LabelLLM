import request from './request';

/**
 * 获取团队成员列表
 * */

export enum ETeamAccess {
  admin = 'admin', // 管理员
  user = 'user', // 普通用户
}
export interface ITeamMemberParams {
  team_id: string; // 团队id
  name?: string; // 用户名
  page?: number; // 页码
  page_size?: number; // 每页数量
  role?: ETeamAccess; // 用户角色
}
export interface ITeamMember {
  user_id: string; // 用户id
  name: string; // 用户名
  role: ETeamAccess; // 用户角色
}

export const getTeamMemberList = (params: ITeamMemberParams): Promise<{ list: ITeamMember[]; total: number }> => {
  return request.post('/v1/team/member/list', params);
};

/**
 * 删除团队成员
 * */
interface IDeleteTeamMemberParams {
  team_id: string; // 团队id
  user_id: string; // 用户id
}
export const deleteTeamMember = (params: IDeleteTeamMemberParams) => {
  return request.post('/v1/team/member/remove', params);
};

/**
 * 更新团队成员
 * */
export interface IUpdateTeamMemberParams {
  team_id: string; // 团队id
  user_info: {
    user_id: string; // 用户id
    name: string; // 用户名
    role: ETeamAccess; // 用户角色
  };
}
export const updateTeamMember = (params: IUpdateTeamMemberParams) => {
  return request.post('/v1/team/member/edit', params);
};

/**
 * 创捷邀请链接
 * */
interface ICreateInviteLinkRes {
  expire_time: string; // 过期时间
  link_id: string; // 链接id
}
export const createInviteLink = (params: { team_id: string }): Promise<ICreateInviteLinkRes> => {
  return request.post('/v1/team/member/invitations/create', params);
};
