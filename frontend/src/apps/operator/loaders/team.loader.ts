import type { LoaderFunctionArgs } from 'react-router-dom';

import queryClient from '@/constant/queryClient';

import { getTeamDetail } from '../services/team';
import { teamKey } from '../constant/query-key-factories';

export async function teamLoader({ params }: LoaderFunctionArgs) {
  try {
    return await queryClient.fetchQuery({
      queryKey: teamKey.detail(params.team_id!),
      queryFn: async () => getTeamDetail(params.team_id!),
    });
  } catch (err) {
    return null;
  }
}
