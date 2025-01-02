import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { useToggle } from 'ahooks';
import { useIntl, FormattedMessage } from 'react-intl';

import { create, EUserRole, ICreate, login } from '@/api/user';
import bg from './bg.png';
import { message } from '@/components/StaticAnt';
import { Form } from 'antd';
import useLang from '@/hooks/useLang';
import IconFont from '@/components/IconFont';

export default () => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm<ICreate>();
  const [on, { toggle }] = useToggle(true);
  const { setLang, isZh } = useLang();

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
        message.error(formatMessage({ id: 'login.password.not.same' }));
        return;
      }
      await create(values);
      handleClick();
    }
  };

  return (
    <div className="w-screen h-screen !bg-cover relative" style={{ background: `url(${bg})` }}>
      <IconFont
        key="lang"
        type="icon-zhongyingwenfanyi"
        className="absolute right-10 top-8 text-xl text-color hover:text-black"
        onClick={() => setLang(isZh ? 'en-US' : 'zh-CN')}
      />
      <div className="absolute right-32 top-1/2 -translate-y-1/2 bg-white p-10 rounded">
        <LoginForm<ICreate>
          onFinish={onFinish}
          form={form}
          submitter={{
            searchConfig: {
              submitText: on ? <FormattedMessage id="login.login" /> : <FormattedMessage id="login.register" />,
            },
          }}
        >
          <div className="text-center text-2xl font-bold mb-10">
            {on ? <FormattedMessage id="login.login.title" /> : <FormattedMessage id="login.register.title" />}
          </div>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              maxLength: 20,
              showCount: true,
              prefix: <UserOutlined className={'prefixIcon'} />,
            }}
            placeholder={formatMessage({ id: 'login.username.placeholder' })}
            rules={[
              {
                required: true,
                whitespace: true,
                message: formatMessage({ id: 'login.username.placeholder' }),
              },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: formatMessage({ id: 'login.username.rule' }),
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
            placeholder={formatMessage({ id: 'login.password.placeholder' })}
            rules={[
              {
                required: true,
                message: formatMessage({ id: 'login.password.placeholder' }),
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
              placeholder={formatMessage({ id: 'login.password.placeholder' })}
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'login.password.placeholder' }),
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
                <FormattedMessage id="login.7.days.no.login" />
              </ProFormCheckbox>
            </div>
          )}
        </LoginForm>
        <div className="text-right pr-8 -mt-4">
          {on ? (
            <span className="text-primary cursor-pointer" onClick={handleClick}>
              <FormattedMessage id="login.register" />
            </span>
          ) : (
            <>
              <span>
                <FormattedMessage id="login.have.account" />
              </span>
              <span className="text-primary cursor-pointer" onClick={handleClick}>
                <FormattedMessage id="login.login" />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
