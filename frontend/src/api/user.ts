import request from './request';

export enum EUserRole {
  admin = 'admin', // 管理员
  user = 'user', // 普通用户
}

/**
 * 用户注册 username password
 * */
export interface ICreate {
  username: string;
  password: string;
  password2?: string;
}
export const create = (params: ICreate): Promise<void> => {
  return request.post('/v1/user/create', params);
};

export interface IUserInfo {
  user_id: number;
  name: string;
  role: EUserRole;
  teams?: IUserInfo[];
}

/**
 * 用户登录
 * */
export const login = (params: ICreate): Promise<IUserInfo> => {
  return request.post('/v1/user/login', params);
};

/**
 * 退出登录
 */
export const logout = (): Promise<void> => {
  return request.post('/v1/user/logout');
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (): Promise<IUserInfo> => {
  return request.get('/v1/user/me');
};

/**
 * 获取用户列表
 */
interface IUserListParams {
  page?: number;
  page_size?: number;
  username?: string;
  role?: EUserRole;
}
export const getUserList = async (params: IUserListParams): Promise<{ list: IUserInfo[]; total: number }> => {
  return request.post('/v1/user/list', params);
};

/**
 * 更新用户
 */
export const updateUser = (params: Pick<IUserInfo, 'user_id' | 'role'>) => {
  return request.post('/v1/user/edit', params);
};
