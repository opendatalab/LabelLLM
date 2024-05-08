import React from 'react';
import { Button, Alert, Spin } from 'antd';
import { RedoOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { message } from '@/components/StaticAnt';
import { createInviteLink } from '@/api/team';

interface IProps {
  teamId: string;
}

const Invite = ({ teamId }: IProps) => {
  const { data, refetch, isLoading, isFetching } = useQuery({
    queryKey: ['createInviteLink', teamId],
    queryFn: async () => createInviteLink({ team_id: teamId as string }),
  });

  const url = data?.link_id ? window.location.origin + '/supplier/join/' + data?.link_id : '';
  return (
    <>
      <Alert
        className="mt-8 mb-6"
        message="温馨提示：如某用户已加入某团队，再加入新团队，将自动退出之前的团队"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
      />
      <div>操作方式：将链接发给成员，成员点击链接通过邀请加入团队</div>
      <Spin spinning={isFetching}>
        <div className="mt-2 bg-fill-tertiary rounded overflow-hidden flex h-11 items-center">
          <div className="truncate w-full overflow-hidden text-black px-3">{url}</div>
          <CopyToClipboard
            text={url}
            onCopy={() => {
              message.success('复制成功');
            }}
          >
            <Button disabled={!url} type="primary" block className="!rounded-none h-full !w-[104px]">
              复制链接
            </Button>
          </CopyToClipboard>
        </div>
      </Spin>
      <div className="flex justify-between items-center mt-4">
        <span
          className="text-primary cursor-pointer"
          onClick={() => {
            if (!isLoading) {
              refetch?.();
            }
          }}
        >
          <RedoOutlined spin={isLoading} rotate={270} className="mr-1" />
          重新生成
        </span>
        <span className="text-secondary">有效期至 {dayjs(data?.expire_time).format('YYYY-MM-DD HH:mm:ss')}</span>
      </div>
    </>
  );
};

export default Invite;
