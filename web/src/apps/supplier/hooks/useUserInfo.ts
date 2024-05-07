import { useQuery } from '@tanstack/react-query';

import { getUserInfo } from '@/api/user';
import { ssoUserInfoKey } from '@/constant/query-key-factories';

export const useUserInfo = () => {
  const { data: userInfo } = useQuery({
    queryKey: ssoUserInfoKey.all,
    queryFn: async () => getUserInfo(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return {
    userInfo,
  };
};
