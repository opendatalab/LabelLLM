import { DrawerForm, ProFormTextArea } from '@ant-design/pro-components';
import { Form, message } from 'antd';

import type { TStoreKey } from '@/hooks/useStoreIds';
import { useStoreIds } from '@/hooks/useStoreIds';
import IconFont from '@/components/icon-font';

const obj = {
  data_id: {
    title: '自定义题目范围',
    desc: '请输入题目ID （字段：Data_id）一个题目ID一行',
    placeholder: '一个题目ID一行',
  },
  questionnaire_id: {
    title: '自定义源题范围',
    desc: '请输入源题ID（字段：Questionnaire_id）一个源题ID一行',
    placeholder: '一个源题ID一行',
  },
};

export default ({ storeKey, onSearch }: { storeKey: TStoreKey; onSearch: (value: string) => void }) => {
  const [form] = Form.useForm<{ ids: string }>();
  const { saveIds, getIds } = useStoreIds();

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
        message.success('保存成功');
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
