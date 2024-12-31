import { Button, type FormInstance } from 'antd';
import { useParams, useRevalidator, useSearchParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType, TableProps } from 'antd/es/table';

import type { FancyInputParams } from '@/components/FancyInput/types';
import { message, modal } from '@/components/StaticAnt';

import type { QueryBlockProps } from '../../components/QueryBlock';
import QueryBlock from '../../components/QueryBlock';
import Help from '@/components/Help';
import { labelerKey } from '../../constant/query-key-factories';
import type { GroupDataByUser, LabelTaskStatisticsBody } from '../../services/task';
import { getLabelTaskUserStatistics, rejectLabelTask } from '../../services/task';
import QuickCreate from './QuickCreate';

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

export default function LabelersTable() {
  const formRef = useRef<FormInstance>(null);
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams({ page: '1', page_size: '10', username: '' });
  const [selectedRecords, setSelectedRecords] = useState<GroupDataByUser[]>([]);
  const [queryParams, setQueryParams] = useState<LabelTaskStatisticsBody>(
    Object.fromEntries(searchParams) as unknown as LabelTaskStatisticsBody,
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: labelerKey.list(queryParams),
    queryFn: async () => getLabelTaskUserStatistics({ ...queryParams, task_id: routeParams.id! }),
  });

  const handleReject = async (user_ids?: string[]) => {
    modal.confirm({
      title: '打回重做',
      okText: '确认',
      cancelText: '取消',
      content: (
        <div>
          <p>
            已选 <span className="font-semibold">{(user_ids || selectedRecords).length}</span>{' '}
            个标注员，是否确定全部打回？ 打回后题目将被标为未达标，同时生成一道新题，扔回题目池，由其他用户抢答。
          </p>
          <p className="text-secondary">打回的题目范围：除了已标为未达标的题目</p>
        </div>
      ),
      onOk: async () => {
        try {
          await rejectLabelTask({
            task_id: routeParams.id!,
            user_id: user_ids || selectedRecords.map((record) => record.label_user.user_id),
          });

          message.success('所选标注员的答题已打回');
          revalidator.revalidate();
          refetch();
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const columns = [
    {
      title: '用户名',
      responsive: ['md', 'lg', 'xl', 'xxl'],
      render: (unused, record) => {
        return record?.label_user?.username;
      },
    },
    {
      title: '答题数',
      dataIndex: 'completed',
      key: 'completed',
      responsive: ['lg', 'xl', 'xxl'],
      width: 90,
    },
    {
      title: (
        <div>
          未达标题数
          <Help>运营打回重做</Help>
        </div>
      ),
      dataIndex: 'discarded',
      key: 'discarded',
      responsive: ['md', 'lg', 'xl', 'xxl'],
      width: 150,
      sorter: true,
      sortField: 'discarded',
      orderMap: {
        ascend: 'asc',
        descend: 'desc',
      },
    },
    {
      title: '未达标率',
      responsive: ['lg', 'xl', 'xxl'],
      width: 100,
      render: (unused, record) => {
        return record?.completed ? `${((record?.discarded * 100) / record?.completed).toFixed(2)}%` : '-';
      },
    },
    {
      title: '操作',
      responsive: ['lg', 'xl', 'xxl'],
      width: 120,
      render: (text: string, record) => {
        if (!record?.completed || record.completed === 0) {
          return '-';
        }

        return (
          <div>
            <a className="mr-2" onClick={() => handleReject([record.label_user.user_id])}>
              打回
            </a>
            <a
              href={`/supplier/review_task/${routeParams.id}?user_id=${record.label_user.user_id}&inlet=operator`}
              target="_blank"
              key="detail"
              rel="noreferrer"
            >
              查看
            </a>
          </div>
        );
      },
    },
  ] as ColumnsType<GroupDataByUser>;

  const handleSearch: QueryBlockProps<any>['onSearch'] = (params) => {
    setQueryParams(params as unknown as LabelTaskStatisticsBody);
  };

  const formProps = {
    template: queryFormTemplate,
    searchText: '搜索',
    ref: formRef,
    initialParams: {},
  };

  const tableProps: TableProps<GroupDataByUser> = {
    columns,
    rowSelection: {
      selections: true,
      selectedRowKeys: selectedRecords.map((record) => record.label_user.user_id),
      type: 'checkbox',
      onChange: (selectedRowKeys, selectedRows) => {
        setSelectedRecords(selectedRows);
      },
    },
    footer: () => (
      <div className="flex">
        <Button type="link" className="!px-0" disabled={selectedRecords.length === 0} onClick={() => handleReject()}>
          打回重做
        </Button>
        <QuickCreate
          list={selectedRecords}
          trigger={
            <Button className="!px-0 ml-4" disabled={selectedRecords.length === 0} type="link">
              以此新建任务
            </Button>
          }
        />
        <Help className="ml-1">筛选标注结果快捷新建任务</Help>
      </div>
    ),
    dataSource: data?.list,
    rowKey: (record) => record.label_user.user_id,
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
