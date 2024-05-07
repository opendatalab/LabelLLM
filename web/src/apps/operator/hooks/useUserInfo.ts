import { useQuery } from '@tanstack/react-query';

import { ssoUserInfoKey } from '@/constant/query-key-factories';
import { getUserInfo } from '@/api/user';

export const useUserInfo = () => {
  return useQuery({
    queryKey: ssoUserInfoKey.all,
    queryFn: getUserInfo,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
