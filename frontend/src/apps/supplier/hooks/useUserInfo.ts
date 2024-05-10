import { useQuery } from '@tanstack/react-query';

import { getUserInfo } from '@/api/user';
import { userInfoKey } from '@/constant/query-key-factories';

export const useUserInfo = () => {
  const { data: userInfo } = useQuery({
    queryKey: userInfoKey.all,
    queryFn: async () => getUserInfo(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return {
    userInfo,
  };
};
