import type { LoaderFunctionArgs } from 'react-router-dom';
import { parse } from 'qs';

import { getUserInfo } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { userInfoKey } from '@/constant/query-key-factories';

export async function ssoLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  // 过滤掉code和username
  const { code, username, ...query } = parse(url.search, {
    ignoreQueryPrefix: true,
  });

  try {
    // 往react-router中注入用户信息
    return await queryClient.fetchQuery({
      queryKey: userInfoKey.all,
      queryFn: getUserInfo,
      staleTime: Infinity,
      gcTime: Infinity,
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}
