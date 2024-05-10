import request from '@/api/request';
import type { ETeamAccess } from '@/api/team';

/**
 * 创建团队
 * */
export interface ITeam {
  name: string; // 团队名称
  owner: string; // 团队拥有者 联系人
  owner_cellphone: string; // 联系人手机号
  team_id: string; // 团队id
  user_count: number; // 团队成员数量
  is_default_team: boolean; // 是否是默认团队
}
export const createTeam = (params: Omit<ITeam, 'team_id' | 'user_count' | 'is_default_team'>) => {
  return request.post('/v1/team/create', params);
};

/**
 * 更新团队
 * */
export type IUpdateTeam = Omit<ITeam, 'user_count' | 'is_default_team'>;
export const updateTeam = (params: IUpdateTeam) => {
  return request.patch('/v1/team/update', params);
};

/**
 * 获取团队列表
 * */
interface ITeamListParams {
  page?: number; // 页码
  page_size?: number; // 每页数量
}

export const getTeamList = (params: ITeamListParams): Promise<{ list: ITeam[]; total: number }> => {
  return request.post('/v1/team/list', params);
};

/**
 * 获取团队详情
 * */
export const getTeamDetail = async (team_id: string): Promise<ITeam> => {
  return request.get(`/v1/team/get/${team_id}`);
};

/**
 * 删除团队
 */
export const deleteTeam = (params: { team_id: string }) => {
  return request.post('/v1/team/delete', params);
};

/**
 * 获取运营人员列表
 * */
export interface IOperatorItemParams {
  user_name?: string; // 用户名
  role?: ETeamAccess; // 用户角色
  page_size: number; // 每页数量
  is_operator: boolean; // 是否是运营人员
  page?: number; // 页码
}
export interface IOperatorRes {
  user_id: string; // 用户名
  role: ETeamAccess; // 用户角色
  name?: string; // 用户名
}
/**
 * 添加运营人员 删除运营人员
 * */
export const editOperator = (params: IOperatorRes) => {
  return request.post('/v1/user/edit', params);
};
