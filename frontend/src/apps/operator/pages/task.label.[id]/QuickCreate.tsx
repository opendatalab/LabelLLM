import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Button, Card, Form, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams, useRouteLoaderData } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { labelerKey } from '@/apps/operator/constant/query-key-factories';
import type { GroupDataByUser, IDeriveLabelTaskParams, OperatorTaskDetail } from '@/apps/operator/services/task';
import { getLabelTaskUserStatistics, deriveLabelTask } from '@/apps/operator/services/task';
import Help from '@/apps/operator/components/Help';
import IconFont from '@/components/IconFont';
interface QuickCreateProps {
  source?: 'create' | 'analyze';
  getIds?: () => Promise<string[]>;
  list?: GroupDataByUser[];
  trigger?: JSX.Element;
}

export default ({ source = 'create', list, trigger, getIds }: QuickCreateProps) => {
  const [form] = Form.useForm<{ data: IDeriveLabelTaskParams[] }>();
  const routeParams = useParams();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<{ is_ok: boolean }[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taskInfo = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;

  const { data } = useQuery({
    queryKey: labelerKey.all,
    queryFn: async () =>
      getLabelTaskUserStatistics({ task_id: routeParams.id!, username: '', page: 1, page_size: 1000 }),
    enabled: open,
  });

  const users = Array.from(
    new Map((data?.list?.map((item) => item.label_user) || []).map((user) => [user.user_id, user])).values(),
  );

  useEffect(() => {
    const taskConfiguration = {
      title: `${taskInfo.title}（副本）`,
      expire_time: taskInfo.expire_time / 60,
      distribute_count: taskInfo.distribute_count,
    };
    if (open) {
      const arr = list?.map((item) => ({
        ...taskConfiguration,
        title: `${taskInfo.title}（${item.label_user.username}）`,
        user_id: [item.label_user.user_id],
        // 字段“标注结果” 默认选中“未达标”，如此标注员未达标题数为0，则默认选中“全部”
        data_status: item.discarded === 0 ? 'all' : 'discarded',
      }));
      form.setFieldsValue({
        data: arr || [taskConfiguration],
      });
    }
  }, [list, open, taskInfo, form]);

  return (
    <DrawerForm<{ data: IDeriveLabelTaskParams[] }>
      // open={true}
      width={900}
      title="快捷新建标注任务"
      form={form}
      layout="horizontal"
      labelAlign="left"
      trigger={
        trigger || (
          <Button type="primary">
            以此新建任务 <Help className="ml-1">筛选标注结果快捷新建任务</Help>
          </Button>
        )
      }
      drawerProps={{
        destroyOnClose: true,
      }}
      submitter={{
        searchConfig: {
          submitText: '确定新建',
          resetText: '取消',
        },
        render: (_, dom) => {
          return <div className="w-full space-x-4">{dom.reverse()}</div>;
        },
      }}
      onOpenChange={(v) => {
        setOpen(v);
        setErrors([]);
      }}
      onFinish={async (values) => {
        let ids: string[] | undefined = undefined;
        if (source === 'analyze') {
          // 获取 所有 data_ids
          ids = await getIds?.();
        }
        const d = values.data?.map((item) => ({
          ...item,
          expire_time: item.expire_time * 60,
          data_ids: ids,
          task_id: routeParams.id!,
        }));
        const res = await deriveLabelTask({ data: d });

        const allOk = res?.data?.every((item) => item.is_ok);
        if (allOk) {
          message.success('快捷新建成功');
        } else {
          message.error('快捷新建失败');
          setErrors(res?.data || []);
        }
        return allOk;
      }}
    >
      <Alert
        className="mb-4"
        message="说明：通过此方式创建的任务，工具配置与当前任务一致，创建后自动进入“进行中”状态"
        type="info"
        showIcon
      />
      <ProFormList
        name="data"
        min={1}
        onAfterRemove={(index) => {
          setErrors(errors.filter((_, i) => i !== index));
        }}
        itemRender={({ listDom, action }, listMeta) => {
          return (
            <Card
              title={
                <div>
                  <span>任务 {listMeta.index + 1}</span>
                  {errors[listMeta.index]?.is_ok === false && (
                    <span className="text-error ml-2 font-normal">
                      当前筛选结果对应题数为0，无法创建任务！请修改筛选条件
                    </span>
                  )}
                </div>
              }
              className="mb-4"
              size="small"
              bordered
              extra={<span className="absolute right-4 top-0.5">{action}</span>}
            >
              {listDom}
            </Card>
          );
        }}
        copyIconProps={false}
        deleteIconProps={{
          Icon: (props) => <IconFont type="icon-shanchu" {...props} className="hover:text-error" />,
        }}
        creatorButtonProps={{
          style: source === 'create' ? undefined : { display: 'none' },
        }}
      >
        {() => (
          <>
            <div className="mb-4">
              <span className="font-bold mr-2">数据源</span>
              <span className="text-secondary">
                <ExclamationCircleOutlined /> 以当前筛选结果作为数据源
              </span>
            </div>
            {source === 'create' && (
              <>
                <ProFormRadio.Group
                  name="data_status"
                  label="标注结果"
                  formItemProps={{
                    labelCol: { flex: '0 0 130px' },
                  }}
                  // 默认选中未达标
                  initialValue="discarded"
                  options={[
                    {
                      label: '全部',
                      value: 'all',
                    },
                    {
                      label: '已达标',
                      value: 'completed',
                    },
                    {
                      label: '未达标',
                      value: 'discarded',
                    },
                  ]}
                />
                <ProFormSelect
                  name="user_id"
                  label="标注员"
                  options={users as any}
                  fieldProps={{
                    mode: 'multiple',
                    fieldNames: {
                      label: 'username',
                      value: 'user_id',
                    },
                  }}
                  formItemProps={{
                    labelCol: { flex: '0 0 130px' },
                  }}
                />
              </>
            )}

            <ProFormRadio.Group
              name="data_duplicated"
              label="题目去重"
              formItemProps={{
                labelCol: { flex: '0 0 130px' },
              }}
              // 默认选中不去重
              initialValue={false}
              options={[
                {
                  label: '不去重',
                  value: false,
                },
                {
                  label: '去重（同一题答多遍， 仅保留一个）',
                  value: true,
                },
              ]}
            />
            <ProFormDependency name={['data_duplicated']}>
              {({ data_duplicated }) => {
                // 当题目去重为“去重”时 选项仅显示 “仅原题” 默认选中
                // 当题目去重为“不去重”时 选项为“仅原题、原题+标注结果、原题+标注结果+审核结果”，默认选中“原题+标注结果+审核结果”
                if (!data_duplicated) {
                  return (
                    <ProFormRadio.Group
                      name="data_format"
                      label="载入内容"
                      formItemProps={{
                        labelCol: { flex: '0 0 130px' },
                      }}
                      initialValue="raw_label"
                      // 默认选中未达标
                      options={[
                        {
                          label: '仅原题',
                          value: 'raw',
                        },
                        {
                          label: (
                            <span>
                              原题+标注结果 <Help>作为预标注载入</Help>
                            </span>
                          ),
                          value: 'raw_label',
                        },
                      ]}
                    />
                  );
                }
                return (
                  <ProFormRadio.Group
                    name="data_format"
                    label="载入内容"
                    formItemProps={{
                      labelCol: { flex: '0 0 130px' },
                    }}
                    initialValue="raw"
                    // 默认选中未达标
                    options={[
                      {
                        label: '仅原题',
                        value: 'raw',
                      },
                    ]}
                  />
                );
              }}
            </ProFormDependency>
            <div className="mb-4">
              <span className="font-bold mr-2">任务配置</span>
            </div>
            <ProFormText
              name="title"
              label="任务名称"
              fieldProps={{
                maxLength: 40,
                showCount: true,
              }}
              initialValue={`${taskInfo.title}（副本）`}
              placeholder="请输入任务名称, 40字符以内"
              rules={[{ required: true, message: '请输入任务名称' }]}
              formItemProps={{
                labelCol: { flex: '0 0 130px' },
              }}
            />
            <ProFormDigit
              label="标注规则"
              name="distribute_count"
              min={1}
              initialValue={taskInfo.distribute_count}
              tooltip="配置一道题需要被回答几次"
              fieldProps={{ precision: 0, addonBefore: '每题', addonAfter: '轮答题' }}
              rules={[{ required: true, message: '请输入标注规则' }]}
              formItemProps={{
                labelCol: { flex: '0 0 130px' },
              }}
            />
            <ProFormDigit
              label="答题倒计时"
              name="expire_time"
              min={1}
              initialValue={taskInfo.expire_time / 60}
              tooltip="用户的最长答题时长，超时自动回收，答题结果不做保存"
              fieldProps={{ precision: 0, addonAfter: '分钟' }}
              rules={[{ required: true, message: '请输入答题倒计时' }]}
              formItemProps={{
                labelCol: { flex: '0 0 130px' },
              }}
            />
          </>
        )}
      </ProFormList>
    </DrawerForm>
  );
};
