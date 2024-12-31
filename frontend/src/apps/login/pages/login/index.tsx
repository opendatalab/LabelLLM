import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { useToggle } from 'ahooks';

import { create, EUserRole, ICreate, login } from '@/api/user';
import bg from './bg.png';
import { message } from '@/components/StaticAnt';
import { Form } from 'antd';

export default () => {
  const [form] = Form.useForm<ICreate>();
  const [on, { toggle }] = useToggle(true);

  const handleClick = () => {
    toggle();
    form.resetFields();
  };

  const onFinish = async (values: ICreate) => {
    if (on) {
      const res = await login(values);
      window.location.href = res.role === EUserRole.admin ? '/operator/task' : '/supplier';
    } else {
      if (values.password !== values.password2) {
        message.error('两次密码不一致');
        return;
      }
      await create(values);
      handleClick();
    }
  };

  return (
    <div className="w-screen h-screen !bg-cover relative" style={{ background: `url(${bg})` }}>
      <div className="absolute right-32 top-1/2 -translate-y-1/2 bg-white p-10 rounded">
        <LoginForm<ICreate>
          onFinish={onFinish}
          form={form}
          submitter={{
            searchConfig: {
              submitText: on ? '登录' : '注册',
            },
          }}
        >
          <div className="text-center text-2xl font-bold mb-10">{on ? '账号登录' : '账号注册'}</div>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              maxLength: 20,
              showCount: true,
              prefix: <UserOutlined className={'prefixIcon'} />,
            }}
            placeholder="请输入用户名"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '请输入用户名!',
              },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: '只允许输入英文或数字',
              },
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              maxLength: 18,
              showCount: true,
              prefix: <LockOutlined className={'prefixIcon'} />,
            }}
            placeholder="密码"
            rules={[
              {
                required: true,
                message: '请输入密码！',
              },
            ]}
          />
          {!on && (
            <ProFormText.Password
              name="password2"
              fieldProps={{
                size: 'large',
                maxLength: 18,
                showCount: true,
                prefix: <LockOutlined className={'prefixIcon'} />,
              }}
              placeholder="密码"
              rules={[
                {
                  required: true,
                  message: '请输入密码！',
                },
              ]}
            />
          )}
          {on && (
            <div
              style={{
                marginBlockEnd: 24,
              }}
            >
              <ProFormCheckbox initialValue={true} noStyle name="remember_me">
                7天免登录
              </ProFormCheckbox>
            </div>
          )}
        </LoginForm>
        <div className="text-right pr-8 -mt-4">
          {on ? (
            <span className="text-primary cursor-pointer" onClick={handleClick}>
              注册
            </span>
          ) : (
            <>
              <span>已有账号？</span>
              <span className="text-primary cursor-pointer" onClick={handleClick}>
                登录
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
