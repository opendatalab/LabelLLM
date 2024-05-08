import type { TablePaginationConfig } from 'antd';
import { Button, Modal, Table } from 'antd';
import { useLoaderData } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useBoolean } from 'react-use';
import useUrlState from '@ahooksjs/use-url-state';
import { useQuery } from '@tanstack/react-query';

import type { ITeamMember, ITeamMemberParams } from '@/api/team';
import { deleteTeamMember, ETeamAccess, getTeamMemberList, updateTeamMember } from '@/api/team';
import { modal } from '@/components/StaticAnt';
import type { IUserTeamInfo } from '@/apps/supplier/services/member';
import { accessObj } from '@/apps/supplier/constant/access';
import MemberInvite from '@/components/MemberInvite';
import { DEFAULT_TEAM } from '@/constant/team';

import { memberKey } from '../../constant/query-key-factories';
import CustomPageContainer from '../../layouts/CustomPageContainer';

const teamAccessMap = (Object.keys(accessObj) as ETeamAccess[]).reduce((acc, cur) => {
  if (cur !== ETeamAccess.super_admin) {
    acc[cur] = accessObj[cur];
  }
  return acc;
}, {} as Record<ETeamAccess, string>);

export default function SupplierMember() {
  const [state, setState] = useUrlState({ page: 1, page_size: 10, user_name: undefined });
  const formRef = useRef<ProFormInstance>();
  const [open, onOpenChange] = useBoolean(false);
  const teamInfo = useLoaderData() as IUserTeamInfo;

  const sendData = { ...state, team_id: teamInfo?.team_id } as ITeamMemberParams;
  const { data, isFetching, refetch } = useQuery({
    queryKey: memberKey.list(sendData),
    queryFn: async () => getTeamMemberList(sendData),
    enabled: !!teamInfo?.team_id,
  });

  const selectChange = (value: ETeamAccess, user: ITeamMember) => {
    updateTeamMember({
      team_id: teamInfo?.team_id as string,
      user_info: { ...user, role: value },
    }).then(() => {
      refetch?.();
    });
  };

  const columns: ColumnsType<ITeamMember> = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
    },
    {
      title: '用户名',
      dataIndex: 'name',
      render: (text) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 200,
      render: (text: keyof typeof ETeamAccess, record) => {
        // todo 用户角色修改 用的是系统权限还是团队权限 等产品确认  -> 目前使用当前用户的团队角色
        // 团队成员角色不是超级管理员时，用户角色是超级管理员时，允许修改
        if (text !== ETeamAccess.super_admin && teamInfo.role === ETeamAccess.super_admin) {
          return (
            <ProFormSelect
              noStyle
              valueEnum={teamAccessMap}
              fieldProps={{
                style: {
                  width: 120,
                  marginLeft: -10,
                },
                size: 'small',
                allowClear: false,
                value: text,
                bordered: false,
                onSelect: (val) => selectChange(val as ETeamAccess, record),
              }}
            />
          );
        }
        return accessObj[text];
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Button
          className="!p-0"
          type="link"
          // todo 默认团队不支持移除 当是超级管理员时也不支持移除
          disabled={
            // 当团队成员是管理员 属于默认团队 不允许移除
            record.role === ETeamAccess.super_admin ||
            teamInfo?.team_id === DEFAULT_TEAM ||
            // 当前用户是管理员 且 团队用户是管理员 不允许移除
            (teamInfo.role === ETeamAccess.admin && record.role === ETeamAccess.admin)
          }
          onClick={() => remove(record.user_id)}
        >
          移除
        </Button>
      ),
    },
  ];
  function remove(user_id: string) {
    modal.confirm({
      title: '移除',
      centered: true,
      content: '是否确定将此用户移除此团队',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        return deleteTeamMember({ team_id: teamInfo?.team_id as string, user_id }).then(() => {
          refetch?.();
        });
      },
    });
  }

  const onChange = (pagination: TablePaginationConfig) => {
    setState({ page: pagination.current, page_size: pagination.pageSize });
  };

  return (
    <CustomPageContainer title="成员管理">
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
        <MemberInvite teamId={teamInfo?.team_id} />
      </Modal>
    </CustomPageContainer>
  );
}
