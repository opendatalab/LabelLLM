import type { TablePaginationConfig } from 'antd';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { useRef } from 'react';
import useUrlState from '@ahooksjs/use-url-state';
import { useMutation, useQuery } from '@tanstack/react-query';

import { editOperator } from '@/apps/operator/services/team';
import { ETeamAccess } from '@/api/team';
import { message, modal } from '@/components/StaticAnt';

import Invite from './Invite';
import { operatorTeamKey } from '../../constant/query-key-factories';
import CustomPageContainer from '../../layouts/CustomPageContainer';
import { EUserRole, getUserList, IUserInfo, updateUser } from '@/api/user';
import { useRouteLoaderData } from 'react-router-dom';

export default function SupplierMember() {
  const [state, setState] = useUrlState({ page: 1, page_size: 10, name: undefined, role: EUserRole.admin });
  const formRef = useRef<ProFormInstance>();
  const userInfo = useRouteLoaderData('root') as IUserInfo;

  const { data, isFetching, refetch } = useQuery({
    queryKey: operatorTeamKey.list(state),
    queryFn: async () => getUserList(state),
  });

  const { mutateAsync } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      refetch?.();
    },
  });

  const columns: ColumnsType<IUserInfo> = [
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
          disabled={record.user_id === userInfo.user_id}
          onClick={() => remove(record)}
        >
          移除
        </Button>
      ),
    },
  ];
  function remove(user: IUserInfo) {
    modal.confirm({
      title: '移除',
      centered: true,
      content: '是否确定将此成员',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          try {
            await mutateAsync({ user_id: user.user_id, role: EUserRole.user });
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
            setState({ name: values.name || undefined, page: undefined, page_size: undefined });
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
