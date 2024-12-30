import type { BadgeProps, FormInstance, MenuProps } from 'antd';
import { Badge, Progress, Button, Tooltip, Dropdown } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType, TableProps } from 'antd/es/table';
import _ from 'lodash';
import { PlusOutlined } from '@ant-design/icons';

import type { FancyInputParams } from '@/components/FancyInput/types';

import type { OperatorTask } from '../services/task';
import {
  getLabelTaskList,
  TaskStatusMapping,
  TaskStatus,
  exportLabelRecord,
  exportLabelTaskWorkload,
  batchUpdateLabelTask,
} from '../services/task';
import { labelTaskKey } from '../constant/query-key-factories';
import QueryBlock from '../components/QueryBlock';
import Help from '../components/Help';
import dayjs from 'dayjs';
import CustomPageContainer from '@/apps/operator/layouts/CustomPageContainer';
import TableSelectedTips from '../components/TableSelectedTips';
import { getUserList } from '@/api/user';
import { message, modal } from '@/components/StaticAnt';
import clsx from 'clsx';
import DownloadRange from './task.label.[id]/DownloadRange';

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
  const { data, isFetching, refetch } = useQuery({
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
            return getUserList({
              page: pageNoRef.current!,
              page_size: 10,
              username: filterValue,
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
            <Link title={text} to={`/task/${record.task_id}`} key="detail">
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
        render: (text: number) => {
          return dayjs(text * 1000).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      {
        title: '操作',
        width: 120,
        responsive: ['lg', 'xl', 'xxl'],
        render: (text: string, record: OperatorTask) => [
          <Link to={`/task/${record.task_id}`} key="detail">
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
            新建任务
          </Button>
        </Link>
      ),
    }),
    [queryFormTemplate],
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<OperatorTask[]>([]);
  const rowSelection: TableProps<OperatorTask>['rowSelection'] = useMemo(() => {
    return {
      type: 'checkbox',
      preserveSelectedRowKeys: true,
      selectedRowKeys: selectedRowKeys,
      onChange: (keys: React.Key[], rows: OperatorTask[]) => {
        setSelectedRowKeys(keys);
        setSelectedRows(rows);
      },
    };
  }, [setSelectedRowKeys, setSelectedRows, selectedRowKeys]);

  const handleExport = (e: any) => {
    if (e.key === 'result') return;
    if (e.key === 'record') {
      exportLabelRecord(selectedRowKeys as string[]);
    } else if (e.key === 'workload') {
      exportLabelTaskWorkload(selectedRowKeys as string[]);
    }
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'result',
      label: <DownloadRange taskId={selectedRowKeys as string[]} type="label" />,
    },
    {
      key: 'record',
      label: <a>标注记录</a>,
    },
    {
      key: 'workload',
      label: <a>工作量</a>,
    },
  ];

  // 是否所有任务都是开始状态
  const isOpen = selectedRows?.length > 0 && selectedRows.every((row) => row.status === TaskStatus.Open);
  const handleEndTask = () => {
    if (!isOpen) return;

    modal.confirm({
      title: '确认结束任务？',
      content: '是否确定结束任务，结束后不可重新启动',
      onOk: async () => {
        try {
          await batchUpdateLabelTask({
            task_id: selectedRowKeys as string[],
            status: TaskStatus.Done,
          });
          refetch();
          setSelectedRowKeys([]);
          setSelectedRows([]);
          message.success('结束任务成功');
        } catch (error) {
          /* empty */
        }
      },
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
    });
  };

  const tableProps = useMemo(
    () => ({
      columns,
      rowSelection,
      dataSource: data?.list,
      rowKey: 'task_id',
      loading: isFetching,
      pagination: {
        total: data?.total,
        showTotal: (total: number) => `共 ${total} 条`,
        showSizeChanger: true,
        showQuickJumper: true,
      },
    }),
    [columns, data, isFetching, rowSelection],
  );

  return (
    <CustomPageContainer bodyClassName="flex flex-col flex-1 relative" title="任务列表">
      <QueryBlock
        formProps={formProps}
        onSearch={handleSearch}
        tableProps={tableProps}
        emptyDescription={_.isEmpty(location.search) ? '还没有任务，快去新建吧！' : '没有找到相关内容'}
      />
      {data?.list && data.list.length > 0 && (
        <TableSelectedTips
          noHover
          className="absolute left-0 mt-4"
          ids={selectedRowKeys as (string | number)[]}
          clear={() => setSelectedRowKeys([])}
        >
          <Dropdown disabled={selectedRowKeys.length === 0} menu={{ items: dropdownItems, onClick: handleExport }}>
            <span
              className={clsx(selectedRowKeys.length === 0 ? 'text-secondary cursor-not-allowed' : 'cursor-default')}
            >
              下载
            </span>
          </Dropdown>
          <Tooltip title={isOpen ? undefined : '请选择进行中的任务'}>
            <span
              className={clsx(!isOpen ? 'text-secondary cursor-not-allowed' : 'cursor-pointer')}
              onClick={handleEndTask}
            >
              <span>结束</span>
            </span>
          </Tooltip>
        </TableSelectedTips>
      )}
    </CustomPageContainer>
  );
}
