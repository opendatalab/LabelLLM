import { useQuery } from '@tanstack/react-query';

import { userInfoKey } from '@/constant/query-key-factories';
import { getUserInfo } from '@/api/user';

export const useUserInfo = () => {
  return useQuery({
    queryKey: userInfoKey.all,
    queryFn: getUserInfo,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
