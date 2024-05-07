import request from './request';

export interface SSOUserInfo {
  /** 用户sso uid */
  sso_uid: string;
  /** 电子邮箱 */
  email: string;
  /** 手机号码 */
  phone: string;
  /** github账号 */
  githubAccount: string;
  /** 用户微信唯一ID */
  wechat: string;
  /** 用户微信名 */
  wechatName: string;
  /** 用户头像URL */
  avatar: string;
  /** 用户名（存量用户、后台创建用户，可能为空） */
  username: string;
  /** 用户昵称 */
  nickname: string;
}

export interface AuthResponse {
  code: string;
  redirect: string;
}

export interface LoginParams {
  code: string;
}

interface LoginRes {
  access_token: string;
  token_type: string;
}

/**
 * 用户登录
 * */
export const login = (params: LoginParams): Promise<LoginRes> => {
  return request.post('/v1/auth/token', params);
};

/**
 * 获取用户信息
 */
export function getUserInfo(): Promise<SSOUserInfo> {
  return request.post('/v1/auth/me');
}

/**
 * 登出
 */
export function logout(): Promise<void> {
  return request.post('/v1/auth/logout');
}
