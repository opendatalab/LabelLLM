import type { TablePaginationConfig } from 'antd';
import { Select, Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { useRef } from 'react';
import useUrlState from '@ahooksjs/use-url-state';
import { useMutation, useQuery } from '@tanstack/react-query';

import type { IOperatorItemParams, IOperatorRes } from '@/apps/operator/services/team';
import { editOperator, getOperateList } from '@/apps/operator/services/team';
import { ETeamAccess } from '@/api/team';
import { message, modal } from '@/components/StaticAnt';

import Invite from './invite';
import { operatorTeamKey } from '../../constant/query-key-factories';
import CustomPageContainer from '../../layouts/CustomPageContainer';

/**
 * 团队成员管理
 * 这个地方的角色和全局不太一样 一下只是展示逻辑
 * supper_admin => 管理员
 * admin => 普通成员
 */
const teamAccessMap = {
  [ETeamAccess.super_admin]: '管理员',
  [ETeamAccess.admin]: '普通成员',
};
const options = Object.entries(teamAccessMap).map(([key, value]) => ({ label: value, value: key }));

export default function SupplierMember() {
  const [state, setState] = useUrlState({ page: 1, page_size: 10, user_name: undefined, is_operator: true });
  const formRef = useRef<ProFormInstance>();

  const { data, isFetching, refetch } = useQuery({
    queryKey: operatorTeamKey.list(state),
    queryFn: async () => getOperateList(state as IOperatorItemParams),
  });

  const { mutateAsync, isPending: isLoading } = useMutation({
    mutationFn: editOperator,
    onSuccess: () => {
      refetch?.();
    },
  });

  const columns: ColumnsType<IOperatorRes> = [
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
      render: (text, record) => (
        <Select
          style={{ width: 130, marginLeft: -14 }}
          variant="borderless"
          options={options}
          loading={isLoading}
          allowClear={false}
          value={text}
          size="small"
          onChange={async (v) => {
            await mutateAsync({ user_id: record.user_id, role: v });
            message.success('修改成功');
          }}
        />
      ),
      // @ts-ignore
      // render: (text) => teamAccessMap[text] || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Button
          className="!p-0"
          type="link"
          disabled={record.role === ETeamAccess.super_admin}
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
      content: '是否确定将此成员',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        return new Promise(async (resolve, reject) => {
          try {
            await mutateAsync({ user_id: user_id, role: ETeamAccess.user });
            message.success('移除成功');
            resolve(true);
          } catch (e) {
            reject(false);
          }
        });
      },
    });
  }

  const onChange = (pagination: TablePaginationConfig) => {
    setState({ page: pagination.current, page_size: pagination.pageSize });
  };

  return (
    <CustomPageContainer title="运营人员">
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
        <Invite mutateAsync={mutateAsync} />
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
    </CustomPageContainer>
  );
}
