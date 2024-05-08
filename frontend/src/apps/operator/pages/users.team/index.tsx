import { useState } from 'react';
import type { TablePaginationConfig } from 'antd';
import { Button, Space, Divider, Table } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useBoolean } from 'react-use';
import { useQuery } from '@tanstack/react-query';
import useUrlState from '@ahooksjs/use-url-state';

import type { ITeam } from '@/apps/operator/services/team';
import { getTeamList } from '@/apps/operator/services/team';

import { teamKey } from '../../constant/query-key-factories';
import CustomPageContainer from '../../layouts/CustomPageContainer';
import Edit from './Edit';

export default function UsersTeam() {
  const [state, setState] = useUrlState({ page: 1, page_size: 10 });

  const [open, onOpenChange] = useBoolean(false);
  const [teamInfo, setTeamInfo] = useState<ITeam | undefined>(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: teamKey.list(state),
    queryFn: async () => getTeamList(state),
  });

  const columns: ColumnsType<ITeam> = [
    {
      title: '团队名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '联系人',
      dataIndex: 'owner',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'owner_cellphone',
      render: (text) => text || '-',
    },
    {
      title: '人数',
      dataIndex: 'user_count',
      width: 100,
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space split={<Divider type="vertical" />}>
          <a
            onClick={() => {
              setTeamInfo(record);
              onOpenChange();
            }}
          >
            编辑
          </a>
          <Link to={record.team_id as string}>成员管理</Link>
        </Space>
      ),
    },
  ];

  const onCreate = () => {
    setTeamInfo(undefined);
    onOpenChange();
  };

  const onChange = (pagination: TablePaginationConfig) => {
    setState({ page: pagination.current, page_size: pagination.pageSize });
  };

  const resetState = () => {
    setState({ page: undefined, page_size: undefined });
  };

  return (
    <CustomPageContainer title="标注团队">
      <div className="text-right mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新建团队
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="team_id"
        columns={columns}
        dataSource={data?.list || []}
        pagination={{
          total: Number(data?.total) || 0,
          defaultCurrent: Number(state.page),
          defaultPageSize: Number(state.page_size),
          showTotal: (total: number) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={onChange}
      />
      <Edit
        isCreate={!teamInfo}
        info={teamInfo}
        open={open}
        onCancel={onCreate}
        onUpdate={() => {
          if (!!teamInfo) {
            refetch?.();
          } else {
            const isPage = state.page > 1;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            isPage ? resetState() : refetch?.();
          }
          onOpenChange();
        }}
      />
    </CustomPageContainer>
  );
}
