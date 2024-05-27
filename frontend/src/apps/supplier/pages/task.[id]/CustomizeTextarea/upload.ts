import type { RcFile } from 'antd/es/upload';

import { getUploadUrl } from '@/apps/supplier/services/task';
import request from '@/api/request';

export const upload = async (file: RcFile) => {
  const { get_url, put_url } = await getUploadUrl({
    type: file.type,
    content_length: file.size,
    suffix: file.name.split('.').pop()?.toLowerCase() || '',
  });
  await request.put(put_url, file, { headers: { 'Content-Type': file.type, 'Content-Length': file.size } });
  return get_url;
};
