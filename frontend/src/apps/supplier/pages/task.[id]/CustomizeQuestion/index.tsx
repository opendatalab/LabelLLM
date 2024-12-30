import { DrawerForm, ProFormTextArea } from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useIntl } from 'react-intl';

import type { TStoreKey } from '@/hooks/useStoreIds';
import { useStoreIds } from '@/hooks/useStoreIds';
import IconFont from '@/components/IconFont';

export default ({ storeKey, onSearch }: { storeKey: TStoreKey; onSearch: (value: string) => void }) => {
  const [form] = Form.useForm<{ ids: string }>();
  const { saveIds, getIds } = useStoreIds();
  const { formatMessage } = useIntl();

  const obj = {
    data_id: {
      title: formatMessage({ id: 'task.custom.question.title' }),
      desc: formatMessage({ id: 'task.custom.question.desc' }),
      placeholder: formatMessage({ id: 'task.custom.question.placeholder' }),
    },
    questionnaire_id: {
      title: formatMessage({ id: 'task.custom.root.title' }),
      desc: formatMessage({ id: 'task.custom.root.desc' }),
      placeholder: formatMessage({ id: 'task.custom.root.placeholder' }),
    },
  };

  return (
    <DrawerForm<{
      ids: string;
    }>
      title={obj[storeKey].title}
      form={form}
      trigger={<IconFont className="text-sm text-primary cursor-pointer" type="icon-bianji" />}
      drawerProps={{
        destroyOnClose: true,
      }}
      onOpenChange={(open) => {
        if (open) {
          form.setFieldsValue({ ids: getIds(storeKey).join('\n') });
        }
      }}
      submitter={{
        render: (_, dom) => {
          return (
            <div className="w-full text-left space-x-4">
              {dom[1]}
              {dom[0]}
            </div>
          );
        },
      }}
      onFinish={async (values) => {
        await saveIds(storeKey, values.ids);
        const ids = getIds(storeKey);
        onSearch(ids[0]);
        message.success(formatMessage({ id: 'common.save.placeholder' }));
        // 不返回不会关闭弹框
        return true;
      }}
    >
      <div>{obj[storeKey].desc}</div>
      <ProFormTextArea
        name="ids"
        placeholder={obj[storeKey].placeholder}
        fieldProps={{
          rows: 10,
        }}
        rules={[
          { required: true },
          // {
          //   validator: async (_, value) => {
          //     if (value.split('\n').filter(Boolean).length > 10) {
          //       return Promise.reject('最多输入100行');
          //     }
          //     return Promise.resolve();
          //   },
          // },
        ]}
      />
    </DrawerForm>
  );
};
