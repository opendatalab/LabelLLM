import { Alert, TablePaginationConfig } from 'antd';
import { Button, Table, Modal } from 'antd';
import { useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useBoolean } from 'react-use';
import useUrlState from '@ahooksjs/use-url-state';
import { useQuery } from '@tanstack/react-query';

import type { ITeamMember, ITeamMemberParams } from '@/api/team';
import { getTeamMemberList, deleteTeamMember } from '@/api/team';
import { modal } from '@/components/StaticAnt';
import MemberInvite from '@/components/MemberInvite';
import { DEFAULT_TEAM } from '@/constant/team';

import { teamMemberKey } from '../../constant/query-key-factories';
import CustomPageContainer from '../../layouts/CustomPageContainer';

export default function SupplierMember() {
  const params = useParams<{ team_id: string }>();
  const [state, setState] = useUrlState({ page: 1, page_size: 10, user_name: undefined });
  const formRef = useRef<ProFormInstance>();
  const [open, onOpenChange] = useBoolean(false);

  const sendData = { ...state, team_id: params.team_id } as ITeamMemberParams;
  const { data, refetch, isFetching } = useQuery({
    queryKey: teamMemberKey.list(sendData),
    queryFn: async () => getTeamMemberList(sendData),
  });

  function remove(user_id: string) {
    modal.confirm({
      title: '移除',
      centered: true,
      content: '是否确定将此用户移除此团队',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await deleteTeamMember({ team_id: params.team_id as string, user_id });
        refetch?.();
      },
    });
  }

  const columns: ColumnsType<ITeamMember> = [
    {
      title: '用户名',
      dataIndex: 'name',
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Button
          className="!p-0"
          type="link"
          disabled={params.team_id === DEFAULT_TEAM}
          onClick={() => remove(record.user_id)}
        >
          移除
        </Button>
      ),
    },
  ];

  const onChange = (pagination: TablePaginationConfig) => {
    setState({ page: pagination.current, page_size: pagination.pageSize });
  };

  return (
    <CustomPageContainer>
      {params.team_id === DEFAULT_TEAM && (data?.total ?? 0) > 0 && (
        <Alert
          className="mb-4"
          message="用户注册后默认加入标注团队中的“默认团队”，赋予标注员身份；加入其他团队后将自动退出此团队"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      )}

      <div className="flex justify-between mb-4">
        <ProForm
          layout="inline"
          autoFocusFirstInput={false}
          formRef={formRef}
          onFinish={async (values) => {
            setState({ user_name: values.name || undefined, page: undefined, page_size: undefined });
            return true;
          }}
          submitter={{
            searchConfig: {
              submitText: '搜索',
            },
            render: (props, defaultDoms) => {
              return [defaultDoms?.[1]];
            },
          }}
        >
          <ProFormText
            name="name"
            placeholder="请输入用户名"
            fieldProps={{
              onPressEnter: () => {
                formRef.current?.submit();
              },
            }}
          />
        </ProForm>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenChange}>
          邀请成员
        </Button>
      </div>
      <Table
        rowKey="user_id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.list || []}
        pagination={{
          total: data?.total,
          defaultCurrent: Number(state.page),
          defaultPageSize: Number(state.page_size),
          showTotal: (total: number) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={onChange}
      />
      <Modal
        title="邀请成员"
        open={open}
        onCancel={onOpenChange}
        centered
        footer={null}
        destroyOnClose={true}
        width={560}
      >
        <MemberInvite teamId={params.team_id as string} />
      </Modal>
    </CustomPageContainer>
  );
}
