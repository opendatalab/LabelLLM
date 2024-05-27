import { PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, Form, message } from 'antd';

import { EUserRole, IUserInfo } from '@/api/user';

interface IProps {
  mutateAsync: (d: IUserInfo) => Promise<any>;
}

export default ({ mutateAsync }: IProps) => {
  const [form] = Form.useForm<IUserInfo>();
  return (
    <ModalForm<IUserInfo>
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
      onFinish={async (values) => {
        await mutateAsync({ ...values, role: EUserRole.admin });
        message.success('添加成功');
        return true;
      }}
    >
      <div className="m-6" />
      <ProFormText name="name" label="用户名" placeholder="输入用户名" rules={[{ required: true }]} />
    </ModalForm>
  );
};
