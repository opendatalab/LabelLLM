import { parse, stringify } from 'qs';

const sso = [
  // test 不用 用 staging 比较稳定
  // {
  //   clientId: 'ekbm5ywavkwax8l6gem8',
  //   auth: 'https://sso.dev.openxlab.org.cn/authentication',
  //   login: 'https://sso.dev.openxlab.org.cn/login',
  //   register: 'https://sso.dev.openxlab.org.cn/register',
  //   origin: 'https://sso.dev.openxlab.org.cn',
  //   env: 'dev',
  // },
  {
    clientId: '48xjnqpzxrkp4jyobzpg',
    auth: 'https://sso.openxlab.org.cn/authentication',
    login: 'https://sso.openxlab.org.cn/login',
    register: 'https://sso.openxlab.org.cn/register',
    origin: 'https://sso.openxlab.org.cn',
    host: [
      'labelu-llm.openxlab.org.cn',
      'labelu-llm.shlab.tech',
      'open-labelu-llm.shlab.tech',
      'iceberg-labelu-llm.shlab.tech',
    ],
    env: 'production',
  },
  {
    clientId: 'olvrjrm2dblj1yqy6a9d',
    auth: 'https://sso.staging.openxlab.org.cn/authentication',
    login: 'https://sso.staging.openxlab.org.cn/login',
    register: 'https://sso.staging.openxlab.org.cn/register',
    origin: 'https://sso.staging.openxlab.org.cn',
    host: ['labelu-llm-ut.shlab.tech', 'labelu-llm.staging.openxlab.org.cn'],
    env: 'staging',
  },
].find((item) => item?.host?.includes(location.host) || item.env === 'staging');

/** 获取 UAA 平台链接 */
export function getUAA(url: string): string {
  const query = parse(location.search, {
    ignoreQueryPrefix: true,
  });

  const search = stringify(
    {
      ...query,
      clientId: sso?.clientId,
      username: true,
      code: undefined,
    },
    {
      addQueryPrefix: true,
    },
  );

  return `${url}?redirect=${location.origin}${location.pathname}${search}`;
}

/** 前往sso登录页 */
export function goLogin() {
  window.location.href = getUAA(sso?.login || '');
}

/** 前往sso注册页 */
export function goRegister() {
  window.location.href = getUAA(sso?.register || '');
}

/** 前往sso鉴权 */
export function goAuth() {
  window.location.href = getUAA(sso?.auth || '');
}
/** 个人中心 */
export function goSSO() {
  window.location.href = getUAA(sso?.origin || '');
}
