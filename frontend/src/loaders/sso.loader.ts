import type { LoaderFunctionArgs } from 'react-router-dom';
import { redirect } from 'react-router-dom';
import { parse, stringify } from 'qs';

import type { LoginParams } from '@/api/sso';
import { getUserInfo, login } from '@/api/sso';
import queryClient from '@/constant/queryClient';
import { ssoUserInfoKey } from '@/constant/query-key-factories/sso';

export async function ssoLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  // 过滤掉code和username
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { code, username, ...query } = parse(url.search, {
    ignoreQueryPrefix: true,
  });

  try {
    if (code) {
      // 处理登陆过来url是否携带code
      await login({ code } as LoginParams);
      // 替换basename
      const path = `${location.pathname.replace(/^\/([^/]+)/g, '')}${stringify(
        { ...query, clientId: undefined },
        {
          addQueryPrefix: true,
        },
      )}`;

      return redirect(path);
    } else {
      // 往react-router中注入用户信息
      const data = await queryClient.fetchQuery({
        queryKey: ssoUserInfoKey.all,
        queryFn: getUserInfo,
        staleTime: Infinity,
        gcTime: Infinity,
      });

      return data;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}
