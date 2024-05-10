import queryClient from '@/constant/queryClient';

import { getUserTeamInfo } from '@/api/user';

export async function userTeamInfoLoader() {
  try {
    return await queryClient.fetchQuery({
      queryKey: ['supplier_userTeamInfo'],
      queryFn: async () => getUserTeamInfo(),
    });
  } catch (err) {
    return null;
  }
}
