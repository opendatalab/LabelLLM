import useUrlState from '@ahooksjs/use-url-state';
import { useQuery } from '@tanstack/react-query';
import { Divider, Pagination, Space, Spin } from 'antd';
import { clsx } from 'clsx';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';

import Empty from '@/apps/supplier/components/empty';
import { ERouterTaskType } from '@/apps/supplier/constant/task';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import CustomPageContainer from '@/apps/supplier/layouts/CustomPageContainer';
import {
  ETaskStatus,
  // getAuditData,
  // getAuditTaskList,
  getLabelData,
  getTaskLabelList,
} from '@/apps/supplier/services/task';
import { message } from '@/components/StaticAnt';
import { useStoreIds } from '@/hooks/useStoreIds';

import { /* auditQuestionKey, auditTaskKey, */ questionKey, taskKey } from '../../constant/query-key-factories';
import Card from './card';
import WeChatPopover from './wechat';

type IProps = HTMLAttributes<HTMLDivElement>;

const tabs = [
  {
    title: '数据贡献',
    documentTitle: '冰山之下 - 数据贡献',
    key: '1',
    path: '/task',
    type: ERouterTaskType.task,
    queryKey: taskKey,
    api: getTaskLabelList,
    apiDetailKey: questionKey,
    apiDetail: getLabelData,
  },
  // {
  //   title: '审核',
  //   documentTitle: '冰山之下 - 审核',
  //   key: '2',
  //   path: '/audit',
  //   type: ERouterTaskType.audit,
  //   queryKey: auditTaskKey,
  //   api: getAuditTaskList,
  //   apiDetailKey: auditQuestionKey,
  //   apiDetail: getAuditData,
  // },
];
const Task: React.FC<PropsWithChildren<IProps>> = () => {
  const navigate = useNavigate();

  const { type, isAudit } = useTaskParams();

  const tab = tabs.find((item) => item.type === type) || tabs[0];

  const [state, setState] = useUrlState({ page: 1, page_size: 24 });

  const { clearAll } = useStoreIds();

  const { data, isLoading } = useQuery({
    queryKey: tab.queryKey.list(state),
    queryFn: async () => tab.api(state),
  });

  const onChange = (bool: boolean, id: string, flow_index?: string) => {
    clearAll();
    if (bool) {
      const url = isAudit ? `${id}?flow_index=${flow_index}` : `${id}`;
      navigate(url);
    } else {
      message.warning('当前任务已无更多题，请选择其他任务卡片');
    }
  };
  const noData = !data?.list?.length && !isLoading;

  return (
    <CustomPageContainer
      className="task-box-bg py-7"
      bodyClassName="flex flex-col justify-between min-h-[calc(100vh-64px-36px)]"
      title={
        <Space split={<Divider type="vertical" />}>
          {tabs.map((item) => (
            <Link
              to={item.path}
              key={item.key}
              className={clsx('text-color text-base', type === item.type && 'text-primary')}
            >
              {item.title}
            </Link>
          ))}
        </Space>
      }
    >
      <Spin className="mt-30" spinning={isLoading}>
        <Helmet>
          <title>{tab.documentTitle}</title>
        </Helmet>
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
                    isAudit={isAudit}
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
      <WeChatPopover />
    </CustomPageContainer>
  );
};

export default Task;
