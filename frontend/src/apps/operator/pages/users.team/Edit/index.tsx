import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';

import type { ITeam, IUpdateTeam } from '@/apps/operator/services/team';
import { updateTeam, createTeam } from '@/apps/operator/services/team';

interface IProps {
  info?: ITeam;
  isCreate?: boolean;
  open: boolean;
  onUpdate: () => void;
  onCancel: () => void;
}

// 正则校验手机号
const phoneReg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/;

export default (props: IProps) => {
  return (
    <ModalForm
      title={props.isCreate ? '新建团队' : '编辑团队'}
      open={props.open}
      autoFocusFirstInput={false}
      onFinish={async (values: IUpdateTeam) => {
        const api = props.isCreate ? createTeam : updateTeam;
        await api({ ...values, team_id: props.info?.team_id as string });
        message.success('提交成功');
        props?.onUpdate();
        return true;
      }}
      initialValues={props.info}
      modalProps={{
        centered: true,
        width: 500,
        destroyOnClose: true,
        onCancel: () => props.onCancel(),
      }}
    >
      <div className="mt-4" />
      <ProFormText
        name="name"
        label="团队名称"
        disabled={props.info?.is_default_team}
        rules={[{ required: true }]}
        fieldProps={{
          maxLength: 50,
          showCount: true,
        }}
      />
      <ProFormText
        name="owner"
        label="联系人"
        fieldProps={{
          maxLength: 20,
          showCount: true,
        }}
      />
      <ProFormText
        name="owner_cellphone"
        label="联系电话"
        rules={[{ pattern: phoneReg, message: '请输入正确的手机号' }]}
        fieldProps={{
          maxLength: 20,
          showCount: true,
        }}
      />
    </ModalForm>
  );
};
