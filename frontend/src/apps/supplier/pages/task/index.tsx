import useUrlState from '@ahooksjs/use-url-state';
import { useQuery } from '@tanstack/react-query';
import { Pagination, Spin } from 'antd';
import { clsx } from 'clsx';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Empty from '@/apps/supplier/components/Empty';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import CustomPageContainer from '@/apps/supplier/layouts/CustomPageContainer';
import { ETaskStatus, getTaskLabelList } from '@/apps/supplier/services/task';
import { message } from '@/components/StaticAnt';
import { useStoreIds } from '@/hooks/useStoreIds';

import { questionKey, taskKey } from '../../constant/query-key-factories';
import Card from './Card';

type IProps = HTMLAttributes<HTMLDivElement>;
const Task: React.FC<PropsWithChildren<IProps>> = () => {
  const navigate = useNavigate();

  const [state, setState] = useUrlState({ page: 1, page_size: 24 });

  const { clearAll } = useStoreIds();

  const { data, isLoading } = useQuery({
    queryKey: taskKey.list(state),
    queryFn: async () => getTaskLabelList(state),
  });

  const onChange = (bool: boolean, id: string, flow_index?: string) => {
    clearAll();
    if (bool) {
      navigate(`${id}`);
    } else {
      message.warning('当前任务已无更多题，请选择其他任务卡片');
    }
  };
  const noData = !data?.list?.length && !isLoading;

  return (
    <CustomPageContainer
      className="task-box-bg py-7"
      bodyClassName="flex flex-col justify-between min-h-[calc(100vh-64px-36px)]"
    >
      <Spin className="mt-30" spinning={isLoading}>
        {noData ? (
          <Empty className="pt-[30vh]" />
        ) : (
          <>
            <div className={clsx('grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]')}>
              {data?.list?.map((item) => {
                const isDone = item.status === ETaskStatus.done;
                return (
                  <Card
                    key={`${item.task_id}-${item.flow_index}`}
                    {...item}
                    onClick={() => (isDone ? undefined : onChange(!!item.remain_count, item.task_id, item.flow_index))}
                  />
                );
              })}
            </div>
            {!!data && data?.total > state.page_size && (
              <Pagination
                className="text-right mt-8"
                pageSizeOptions={['12', '24', '48', '96']}
                defaultCurrent={Number(state.page) || 1}
                defaultPageSize={Number(state.page_size) || 24}
                total={Number(data?.total) || 0}
                onChange={(page, pageSize) => {
                  setState({ page, page_size: pageSize });
                }}
              />
            )}
          </>
        )}
      </Spin>
    </CustomPageContainer>
  );
};

export default Task;
