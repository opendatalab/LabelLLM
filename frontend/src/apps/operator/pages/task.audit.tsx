import type { BadgeProps, FormInstance } from 'antd';
import { Badge, Tooltip, Button } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import formatter from '@label-u/formatter';

import type { FancyInputParams } from '@/components/FancyInput/types';

import type { AuditTaskListItem, OperatorTask } from '../services/task';
import { TaskStatusMapping, TaskStatus, getAuditTaskList } from '../services/task';
import { auditTaskKey } from '../constant/query-key-factories';
import QueryBlock from '../components/QueryBlock';
import chineseCharMap from '../constant/chineseCharMap';
import { getOperateList } from '../services/team';

const taskStatusOptions = Object.values(TaskStatus).map((status) => ({
  label: TaskStatusMapping[status],
  value: status,
}));

const badgeStatusMapping = {
  [TaskStatus.Open]: 'success',
  [TaskStatus.Created]: 'warning',
  [TaskStatus.Done]: 'error',
};

export default function TaskList() {
  const formRef = useRef<FormInstance>(null);
  const [searchParams] = useSearchParams();
  const [queryParams, setQueryParams] = useState(
    searchParams.get('creator_id')
      ? { ...Object.fromEntries(searchParams), creator_id: searchParams.get('creator_id')!.split(',') }
      : Object.fromEntries(searchParams),
  );
  const { data, isLoading } = useQuery({
    queryKey: auditTaskKey.list(queryParams),
    queryFn: () => getAuditTaskList(queryParams),
  });

  const queryFormTemplate: FancyInputParams[] = useMemo(
    () => [
      {
        field: 'title',
        key: 'title',
        type: 'string',
        antProps: {
          className: '!w-[220px]',
          placeholder: '任务名称',
          allowClear: true,
          onPressEnter: () => {
            formRef.current?.submit();
          },
        },
      },
      {
        field: 'status',
        key: 'status',
        type: 'enum',
        antProps: {
          placeholder: '任务状态',
          options: taskStatusOptions,
          allowClear: true,
          className: '!w-[220px]',
          onChange: () => {
            formRef.current?.submit();
          },
        },
      },
      {
        field: 'creator_id',
        key: 'creator_id',
        type: 'enum',
        antProps: {
          queryFn: (filterValue: string, { totalRef, pageNoRef }: { totalRef: any; pageNoRef: any }) => {
            return getOperateList({
              page: pageNoRef.current!,
              is_operator: false,
              page_size: 10,
              user_name: filterValue,
            }).then((res) => {
              totalRef.current = res.total;
              pageNoRef.current += 1;
              return res.list.map((item) => ({ label: item.name, value: item.user_id }));
            });
          },
          placeholder: '创建人',
          allowClear: true,
          mode: 'multiple',
          className: '!w-[220px]',
          maxTagCount: 'responsive',
          onChange: () => {
            formRef.current?.submit();
          },
        },
      },
    ],
    [],
  );

  const columns = useMemo(() => {
    return [
      {
        title: '任务名称',
        dataIndex: 'title',
        key: 'title',
        responsive: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        ellipsis: true,
        render: (text: string, record: OperatorTask) => {
          return (
            <Link title={text} to={`/task/audit/${record.task_id}`} key="detail">
              {text}
            </Link>
          );
        },
      },
      {
        title: '任务状态',
        dataIndex: 'status',
        key: 'status',
        responsive: ['md', 'lg', 'xl', 'xxl'],
        width: 120,
        render: (text: TaskStatus) => {
          return <Badge status={badgeStatusMapping[text] as BadgeProps['status']} text={TaskStatusMapping[text]} />;
        },
      },
      {
        title: (
          <div>
            进度
            <Tooltip title="已完成题数/总题数">
              <QuestionCircleOutlined className="ml-2 text-[var(--color-text-secondary)]" />
            </Tooltip>
          </div>
        ),
        responsive: ['md', 'lg', 'xl', 'xxl'],
        width: 220,
        render: (text: string, record) => {
          if (record.status === TaskStatus.Created) {
            return '-';
          }

          return (
            <div>
              {record?.flow?.map((flowItem) => (
                <span className="mr-4" key={flowItem.flow_index}>
                  {chineseCharMap[flowItem.flow_index]}审：{flowItem.completed_count}/{flowItem.total_count}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        title: '创建人',
        dataIndex: 'creator',
        key: 'creator',
        // width: 200,
        responsive: ['lg', 'xl', 'xxl'],
      },
      {
        title: '创建时间',
        dataIndex: 'created_time',
        key: 'created_time',
        responsive: ['lg', 'xl', 'xxl'],
        render: (text: string) => {
          return formatter.format('dateTime', text, { style: 'YYYY-MM-DD HH:mm:ss' });
        },
      },
      {
        title: '操作',
        width: 120,
        responsive: ['lg', 'xl', 'xxl'],
        render: (text: string, record: AuditTaskListItem) => [
          <Link to={`/task/audit/${record.task_id}`} key="detail">
            查看
          </Link>,
        ],
      },
    ] as ColumnsType<AuditTaskListItem>;
  }, []);

  const handleSearch = (params: Record<string, string>) => {
    // @ts-ignore
    setQueryParams(params.creator_id ? { ...params, creator_id: params.creator_id.split(',') } : params);
  };

  const formProps = useMemo(
    () => ({
      template: queryFormTemplate,
      searchText: '搜索',
      ref: formRef,
      initialParams: {
        page: '1',
        page_size: '10',
      },
      extra: (
        <Link className="hover:text-white" to="/task/audit/create">
          <Button type="primary" icon={<PlusOutlined />}>
            新建审核任务
          </Button>
        </Link>
      ),
    }),
    [queryFormTemplate],
  );

  const tableProps = useMemo(
    () => ({
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
    }),
    [columns, data, isLoading],
  );

  return (
    <QueryBlock
      formProps={formProps}
      onSearch={handleSearch}
      tableProps={tableProps}
      emptyDescription={_.isEmpty(location.search) ? '还没有任务，快去新建吧！' : '没有找到相关内容'}
    />
  );
}
