import { notification } from 'antd';
import _ from 'lodash';
import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';

import { goLogin } from '@/utils/sso';
import { message } from '@/components/StaticAnt';

import { EECode, ECode, getErrorText } from './errorCode';

/**
 * @param response
 * @returns
 */
export function successHandler(response: AxiosResponse<any>) {
  return response.data;
}

function errorHandler(error: AxiosError) {
  const errMsgFromServer = _.get(error, 'response.data.detail.message');
  const errCode = _.get(error, 'response.data.detail.code');

  // 特殊错误 code 不需要全局报错 需要在业务中自行处理
  if (Object.values(EECode).includes(errCode as any)) {
    return Promise.reject(_.get(error, 'response.data.detail'));
  }

  const errorText = (errCode && getErrorText(errCode)) || errMsgFromServer;
  if (errorText) {
    message.error(errorText);
  }

  return Promise.reject(error);
}

const authorizationBearerFailed = (error: any) => {
  // 401一秒后跳转到登录页
  if (error?.response?.status === 401 && !import.meta.env.DEV) {
    goLogin();
  }
  // 特殊状态码 没有具体code
  if (error?.response?.status === 422) {
    message.error('数据格式错误');
  }

  return Promise.reject(error);
};

const requestConfig = {
  timeout: 2 * 60 * 1000,
  baseURL: '/api',
};

const request = axios.create(requestConfig);
export const plainRequest = axios.create(requestConfig);

request.interceptors.response.use(successHandler, errorHandler);
request.interceptors.response.use(undefined, authorizationBearerFailed);
plainRequest.interceptors.response.use(undefined, errorHandler);
plainRequest.interceptors.response.use(undefined, authorizationBearerFailed);

export default request;
