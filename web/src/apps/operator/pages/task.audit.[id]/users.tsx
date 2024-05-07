import type { FormInstance } from 'antd';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType, TableProps } from 'antd/es/table';

import type { FancyInputParams } from '@/components/FancyInput/types';

import type { QueryBlockProps } from '../../components/QueryBlock';
import QueryBlock from '../../components/QueryBlock';
import Help from '../../components/Help';
import { auditorKey } from '../../constant/query-key-factories';
import type { GroupDataByUser, AuditTaskStatisticsBody } from '../../services/task';
import { getAuditTaskUserStatistics } from '../../services/task';

const queryFormTemplate: FancyInputParams[] = [
  {
    field: 'username',
    key: 'username',
    type: 'string',
    antProps: {
      className: '!w-[220px]',
      placeholder: '用户名',
    },
  },
];

export interface AuditorsTableProps {
  flowIndex: number;
}

export default function AuditorsTable({ flowIndex }: AuditorsTableProps) {
  const formRef = useRef<FormInstance>(null);
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams({
    page: '1',
    page_size: '10',
    username: '',
    flow_index: flowIndex ? `${flowIndex}` : '1',
  });
  const [queryParams, setQueryParams] = useState<AuditTaskStatisticsBody>(
    Object.fromEntries(searchParams) as unknown as AuditTaskStatisticsBody,
  );
  const { data, isLoading } = useQuery({
    queryKey: auditorKey.list(queryParams),
    queryFn: async () => getAuditTaskUserStatistics({ ...queryParams, task_id: routeParams.id! }),
  });

  useEffect(() => {
    setQueryParams((prev) => ({ ...prev, flow_index: flowIndex }));
    searchParams.set('flow_index', `${flowIndex}`);
    setSearchParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowIndex]);

  const columns = [
    {
      title: '用户ID',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      ellipsis: true,
      render: (unused, record) => {
        return record?.label_user?.user_id;
      },
    },
    {
      title: '用户名',
      responsive: ['md', 'lg', 'xl', 'xxl'],
      render: (unused, record) => {
        return record?.label_user?.username;
      },
    },
    {
      title: '审题数',
      dataIndex: 'completed',
      key: 'completed',
      responsive: ['lg', 'xl', 'xxl'],
      width: 90,
    },
    {
      title: (
        <div>
          未采纳题数
          <Help>假设一道题需要3轮审核，另外2人判断为达标，此用户判断为未达标，则此题的审题结果是未被采纳</Help>
        </div>
      ),
      dataIndex: 'discarded',
      key: 'discarded',
      responsive: ['md', 'lg', 'xl', 'xxl'],
      width: 160,
      sorter: true,
      sortField: 'discarded',
      orderMap: {
        ascend: 'asc',
        descend: 'desc',
      },
    },
    {
      title: '未采纳率',
      responsive: ['lg', 'xl', 'xxl'],
      width: 110,
      render: (unused, record) => {
        return record?.completed ? `${((record?.discarded * 100) / record?.completed).toFixed(2)}%` : '-';
      },
    },
    {
      title: '操作',
      responsive: ['lg', 'xl', 'xxl'],
      width: 78,
      render: (text: string, record) => {
        if (!record?.completed || record.completed === 0) {
          return '-';
        }

        return (
          <a
            href={`/supplier/review_audit/${routeParams.id}?user_id=${record.label_user.user_id}&flow_index=${flowIndex}`}
            target="_blank"
            key="detail"
            rel="noreferrer"
          >
            查看
          </a>
        );
      },
    },
  ] as ColumnsType<GroupDataByUser>;

  const handleSearch: QueryBlockProps<GroupDataByUser>['onSearch'] = (params) => {
    setQueryParams(params as unknown as AuditTaskStatisticsBody);
  };

  const formProps = {
    template: queryFormTemplate,
    searchText: '搜索',
    ref: formRef,
    initialParams: {},
  };

  const tableProps: TableProps<GroupDataByUser> = {
    columns,
    dataSource: data?.list,
    rowKey: 'id',
    loading: isLoading,
    pagination: {
      total: data?.total,
      showTotal: (total: number) => `共 ${total} 条`,
      showSizeChanger: true,
      showQuickJumper: true,
    },
  };

  return (
    <QueryBlock
      formProps={formProps}
      tableProps={tableProps}
      onSearch={handleSearch}
      emptyDescription="没有找到相关内容"
    />
  );
}
