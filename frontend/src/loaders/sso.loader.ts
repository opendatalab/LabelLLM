import type { LoaderFunctionArgs } from 'react-router-dom';

import { getUserInfo } from '@/api/user';
import queryClient from '@/constant/queryClient';
import { userInfoKey } from '@/constant/query-key-factories';

export async function ssoLoader({ request }: LoaderFunctionArgs) {
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
