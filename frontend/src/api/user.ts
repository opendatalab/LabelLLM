import request from './request';
import type { ETeamAccess } from './team';

export interface ILoginParams {
  code: string;
}
interface ILoginRes {
  access_token: string;
  token_type: string;
}

export interface FakeLoginParams {
  email: string;
  password: string;
}

export interface FakeRegisterParams {
  email: string;
  password: string;
}

export enum EUserRole {
  super_admin = 'super_admin', // 管理员
  admin = 'admin', // 管理员
  user = 'user', // 普通用户
}

// export const userRoleMap = {
//   [EUserRole.admin]: '超级管理员',
//   [EUserRole.admin]: '管理员',
//   [EUserRole.user]: '普通成员',
// };

interface ITeam {
  user_id?: string;
  name?: string;
  role?: ETeamAccess;
}

export interface IUserInfo {
  sso_uid: string;
  email: string;
  phone: string;
  github_account: string;
  wechat: string;
  wechat_name: string;
  avatar: string;
  username: string;
  nickname: string;
  user_id: string;
  role: EUserRole;
  teams: ITeam[];
}
/**
 * 用户登录
 * */
export const login = (params: ILoginParams): Promise<ILoginRes> => {
  return request.post('/v1/auth/token', params);
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (): Promise<IUserInfo> => {
  return request.post('/v1/auth/me');
};

/**
 * 退出登录
 */
export const logout = (): Promise<void> => {
  return request.post('/v1/auth/logout');
};
