import { PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, Form, message } from 'antd';

import type { IOperatorRes } from '@/apps/operator/services/team';
import { ETeamAccess } from '@/api/team';

interface IProps {
  mutateAsync: (d: IOperatorRes) => Promise<any>;
}

export default ({ mutateAsync }: IProps) => {
  const [form] = Form.useForm<IOperatorRes>();
  return (
    <ModalForm<IOperatorRes>
      title="添加成员"
      layout="horizontal"
      trigger={
        <Button type="primary">
          <PlusOutlined />
          添加成员
        </Button>
      }
      form={form}
      modalProps={{
        width: 400,
        centered: true,
        destroyOnClose: true,
        onCancel: () => console.log('run'),
      }}
      submitTimeout={2000}
      onFinish={async (values) => {
        await mutateAsync({ ...values, role: ETeamAccess.admin });
        message.success('添加成功');
        return true;
      }}
    >
      <div className="m-6" />
      <ProFormText name="user_id" label="用户名" placeholder="输入用户名添加成员" rules={[{ required: true }]} />
    </ModalForm>
  );
};
