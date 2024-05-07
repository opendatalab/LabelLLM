import type { BadgeProps, FormInstance } from 'antd';
import { Badge, Progress, Button } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import _ from 'lodash';
import formatter from '@label-u/formatter';
import { PlusOutlined } from '@ant-design/icons';

import type { FancyInputParams } from '@/components/FancyInput/types';

import type { OperatorTask } from '../services/task';
import { getLabelTaskList, TaskStatusMapping, TaskStatus } from '../services/task';
import { labelTaskKey } from '../constant/query-key-factories';
import QueryBlock from '../components/QueryBlock';
import Help from '../components/Help';
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
  const { data, isFetching } = useQuery({
    queryKey: labelTaskKey.list(queryParams),
    queryFn: () => getLabelTaskList(queryParams),
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
          optionFilterProp: 'label',
          className: '!w-[280px]',
          popupClassName: 'creator_id_selector',
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
        width: 340,
        render: (text: string, record: OperatorTask) => {
          return (
            <Link title={text} to={`/task/label/${record.task_id}`} key="detail">
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
        render: (text: TaskStatus) => {
          return <Badge status={badgeStatusMapping[text] as BadgeProps['status']} text={TaskStatusMapping[text]} />;
        },
      },
      {
        title: (
          <div>
            进度
            <Help>已完成题数/总题数</Help>
          </div>
        ),
        responsive: ['md', 'lg', 'xl', 'xxl'],
        render: (text: string, record) => {
          if (record.status === TaskStatus.Created) {
            return '-';
          }

          return (
            <Progress
              percent={
                record.completed_count ? Number(((record.completed_count * 100) / record.total_count).toFixed(2)) : 0
              }
            />
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
        width: 200,
        render: (text: string) => {
          return formatter.format('dateTime', text, { style: 'YYYY-MM-DD HH:mm:ss' });
        },
      },
      {
        title: '操作',
        width: 120,
        responsive: ['lg', 'xl', 'xxl'],
        render: (text: string, record: OperatorTask) => [
          <Link to={`/task/label/${record.task_id}`} key="detail">
            查看
          </Link>,
        ],
      },
    ] as ColumnsType<OperatorTask>;
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
        <Link className="hover:text-white" to="create">
          <Button type="primary" icon={<PlusOutlined />}>
            新建标注任务
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
      loading: isFetching,
      pagination: {
        total: data?.total,
        showTotal: (total: number) => `共 ${total} 条`,
        showSizeChanger: true,
        showQuickJumper: true,
      },
    }),
    [columns, data, isFetching],
  );

  return (
    <>
      <QueryBlock
        formProps={formProps}
        onSearch={handleSearch}
        tableProps={tableProps}
        emptyDescription={_.isEmpty(location.search) ? '还没有任务，快去新建吧！' : '没有找到相关内容'}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1">
        <a
          href="https://beian.miit.gov.cn/#/Integrated/index"
          className="text-secondary text-sm"
          target="_blank"
          rel="noreferrer"
        >
          ©2023 shlab. All Rights Reserved 沪ICP备2021009351号-3
        </a>
      </div>
    </>
  );
}
