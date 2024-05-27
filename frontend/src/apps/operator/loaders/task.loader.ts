import type { LoaderFunctionArgs } from 'react-router-dom';

import queryClient from '@/constant/queryClient';

import { getLabelTaskDetail } from '../services/task';
import { labelTaskKey } from '../constant/query-key-factories';

export async function labelTaskLoader({ params }: LoaderFunctionArgs) {
  try {
    // @ts-ignore
    return await queryClient.fetchQuery({
      queryKey: labelTaskKey.detail(params.id!),
      queryFn: () => getLabelTaskDetail({}, { task_id: params.id! }),
    });
  } catch (err) {
    return null;
  }
}
