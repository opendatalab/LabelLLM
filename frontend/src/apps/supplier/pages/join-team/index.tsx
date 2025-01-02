import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { getInviteLinkDetail, joinTeam } from '@/apps/supplier/services/joinTeam';

import { ReactComponent as JoinImg } from '../../assets/join.svg';
import { ReactComponent as Timeout } from '../../assets/timeout.svg';
import { useIntl } from 'react-intl';

type IProps = HTMLAttributes<HTMLDivElement>;

const Team: React.FC<PropsWithChildren<IProps>> = () => {
  const { formatMessage } = useIntl();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getInviteLinkDetail', params.id],
    queryFn: async () => getInviteLinkDetail(params.id as string),
  });

  const toTask = async () => {
    await joinTeam({ team_id: data?.team_id as string });
    refetch?.();
  };

  return (
    <Spin spinning={isLoading}>
      <div className="h-screen w-screen flex flex-col justify-center items-center">
        {data?.is_expired ? <Timeout /> : <JoinImg />}
        <div className="font-bold text-xl mt-4">
          {formatMessage({ id: 'member.team' })}：{data?.team_name}
        </div>
        <div className="mb-6 mt-2">{formatMessage({ id: 'member.team.join' })}</div>
        {data?.is_expired && (
          <Button type="primary" disabled={true}>
            {formatMessage({ id: 'member.link.timeout' })}
          </Button>
        )}
        {!data?.is_expired && data?.is_joined && (
          <Button type="primary" onClick={() => navigate('/')}>
            {formatMessage({ id: 'member.team.join.success' })}
          </Button>
        )}
        {!data?.is_expired && !data?.is_joined && (
          <Button type="primary" onClick={toTask}>
            {formatMessage({ id: 'member.join' })}
          </Button>
        )}
      </div>
    </Spin>
  );
};

export default Team;
