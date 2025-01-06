import React, { useRef, useState } from 'react';
import type { MenuProps, RadioChangeEvent, TabsProps } from 'antd';
import { Alert, Button, Drawer, Dropdown, Radio, Spin, Table, Tabs, Tag, Typography } from 'antd';
import { CaretDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProCard, ProForm, ProFormDependency, ProFormList, ProFormSelect } from '@ant-design/pro-components';
import { useParams, useRouteLoaderData } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useStoreIds } from '@/hooks/useStoreIds';
import type { ConversationConfig, ITaskLabelDataFilterParams, OperatorTaskDetail } from '@/apps/operator/services/task';
import {
  EKind,
  EScopeType,
  exportTaskLabelIdData,
  exportTaskLabelResultData,
  exportTaskLabelStats,
  getTaskLabelDataFilter,
  getTaskLabelIds,
  getTaskLabelStats,
  getTaskLabelId,
} from '@/apps/operator/services/task';
import Help from '@/components/Help';
import CustomEmpty from '@/apps/operator/components/CustomEmpty';
import QuickCreate from '../QuickCreate';
import useLang from '@/hooks/useLang';

const { Text } = Typography;

const options = [
  { label: '针对整段内容/对话', value: EScopeType.conversation },
  { label: '针对对话里每条回复', value: EScopeType.message },
  { label: '针对对话里的每个提问', value: EScopeType.question },
];
const filterOptions = [
  { label: '单题标注结果', value: EKind.without_duplicate },
  {
    label: (
      <span>
        源题多结果对比 <Help>适用于一题多次答题，多人的答案进行对比</Help>
      </span>
    ),
    value: EKind.with_duplicate,
  },
];

// 数据分布
const Distributed = () => {
  const params = useParams<{ id: string }>();
  const [v, setValue] = useState<EScopeType>(EScopeType.conversation);
  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setValue(value);
  };

  const { setLang } = useLang();

  const { data, isFetching } = useQuery({
    queryKey: ['/v1/operator/task/label/stats', v],
    queryFn: async () => getTaskLabelStats({ _id: params.id!, scope: v }),
  });

  const { task_id } = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;

  const { saveIds } = useStoreIds();
  const { mutate, isPending } = useMutation({
    mutationFn: getTaskLabelId,
    onSuccess: (d) => {
      const ids = d?.data?.map((item) => item.data_id);
      saveIds('data_id', ids.join('\n'));
      setLang('zh-CN');
      window.open(`/supplier/review/${task_id}?question_type=customize&data_id=${ids[0]}`, '_blank');
    },
  });

  const renderColumns = (question_value: string) => {
    return [
      {
        title: '选项',
        dataIndex: 'label',
      },
      {
        title: '题数',
        dataIndex: 'count',
        width: 100,
      },
      {
        title: '占比',
        dataIndex: 'total',
        width: 140,
        render: (text: number, record: any) => {
          return text === 0 ? '0.00%' : `${((record.count / text) * 100).toFixed(2)}%`;
        },
      },
      {
        title: '操作',
        dataIndex: 'value',
        width: 120,
        render: (text: string, record: any) => {
          return (
            <div className="flex space-x-1">
              <Button
                type="link"
                size="small"
                disabled={record?.count < 1}
                className="text-primary cursor-pointer"
                onClick={() =>
                  exportTaskLabelStats({
                    task_id: params.id!,
                    scope: v,
                    question_value,
                    choice_value: text,
                  })
                }
              >
                下载 ID
              </Button>
              <Button
                type="link"
                size="small"
                loading={isPending}
                disabled={record?.count < 1}
                onClick={() => {
                  mutate({
                    task_id: params.id!,
                    scope: v,
                    question_value,
                    choice_value: text,
                  });
                }}
              >
                查看题目
              </Button>
            </div>
          );
        },
      },
    ];
  };

  return (
    <Spin spinning={isFetching}>
      <Radio.Group size="small" options={options} onChange={onChange} value={v} optionType="button" />
      <Alert
        className="my-4"
        message={
          <span>仅支持选择题的统计分析，文本题、排序题不支持; 未达标（指运营打回重做）的题目不在统计范围内</span>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
      />
      {!data?.data?.length ? (
        <CustomEmpty className="mt-32" />
      ) : (
        data?.data?.map((item) => {
          return (
            <div key={item.value} className="mb-6">
              <div className="flex items-center mb-2 space-x-2">
                <Text className="text-base font-bold" style={{ maxWidth: 400 }} ellipsis={{ tooltip: item.label }}>
                  {item.label}
                </Text>
                <Tag bordered={false} color="processing">
                  选择题
                </Tag>
              </div>
              <Table rowKey="id" dataSource={item?.data || []} columns={renderColumns(item.value)} pagination={false} />
            </div>
          );
        })
      )}
    </Spin>
  );
};

const downloadItems: MenuProps['items'] = [
  {
    key: 'id',
    label: 'ID',
  },
  {
    key: 'result',
    label: '标注结果',
  },
];

// 数据筛选
const Filter = () => {
  const { tool_config, task_id } = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;
  type TValues = Pick<ITaskLabelDataFilterParams, 'filters' | 'operator'>;
  const formRef = useRef<ProFormInstance<TValues>>();
  const refData = useRef<{ count: number }>();

  const { setLang } = useLang();

  // 判断每一个筛选项是否有选择题
  type TQuestionsType = 'conversation' | 'message' | 'question';
  const checkQuestions = (key: TQuestionsType) => {
    return (tool_config[key] as ConversationConfig)?.questions?.some(
      (item) => item.type === 'array' || item.type === 'enum',
    );
  };
  const list = [
    { label: '针对整段内容/对话', value: 'conversation', isSelect: checkQuestions('conversation') },
    { label: '针对对话里每条回复', value: 'message', isSelect: checkQuestions('message') },
    { label: '针对对话里的每个提问', value: 'question', isSelect: checkQuestions('question') },
  ];

  const [v, setValue] = useState<EKind>(EKind.without_duplicate);
  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    refData.current = undefined;
    formRef.current?.resetFields();
    setValue(value);
  };

  const getFormData = (): ITaskLabelDataFilterParams => {
    return {
      ...formRef.current?.getFieldsValue(),
      kind: v,
      _id: task_id!,
    } as ITaskLabelDataFilterParams;
  };

  const { saveIds } = useStoreIds();
  // 获取标注结果ids
  const { isPending: idsLoading, mutate } = useMutation({
    mutationFn: getTaskLabelIds,
    onSuccess: (data) => {
      const isWithDuplicate = v === EKind.with_duplicate;
      const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
      const ids = isWithDuplicate
        ? data.data?.map((item) => item.questionnaire_id)
        : data.data?.map((item) => item.data_id);

      saveIds(key, ids.join('\n'));
      setLang('zh-CN');
      if (isWithDuplicate) {
        window.open(
          `/supplier/review/${task_id}?question_type=customize&kind=${EKind.with_duplicate}&questionnaire_id=${ids[0]}&inlet=operator`,
          '_blank',
        );
      } else {
        window.open(`/supplier/review/${task_id}?question_type=customize&data_id=${ids[0]}&inlet=operator`, '_blank');
      }
    },
  });

  const { isPending: isLoading, mutateAsync } = useMutation({
    mutationFn: getTaskLabelDataFilter,
    onSuccess: (data) => {
      refData.current = data;
    },
  });

  const download = (type: 'result' | 'id') => {
    const data = getFormData();
    if (type === 'result') {
      exportTaskLabelResultData(JSON.stringify(data));
    } else {
      exportTaskLabelIdData(JSON.stringify(data));
    }
  };

  return (
    <div>
      <Radio.Group size="small" options={filterOptions} onChange={onChange} value={v} optionType="button" />
      <Alert
        className="my-4"
        message={<span>仅支持选择题的筛选统计；未达标 运营打回重做 的题目不在统计范围内</span>}
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
      />
      <ProCard bordered title="设置筛选条件" className="my-4">
        <ProForm<TValues>
          formRef={formRef}
          initialValues={{
            operator: 'and',
            filters: [{}],
          }}
          submitter={{
            render: (props, defaultDoms) => {
              return <div className="text-right">{[defaultDoms[1]]}</div>;
            },
            searchConfig: {
              submitText: '开始运行',
            },
          }}
          onFinish={async (values) => {
            await mutateAsync({ ...values, kind: v, _id: task_id! });
            return true;
          }}
        >
          <div className="flex">
            <ProFormDependency name={['filters']}>
              {({ filters }) => {
                if (filters?.length > 1) {
                  return (
                    <div className="w-16 mb-[84px] relative shrink-0">
                      <div className="absolute h-[calc(100%-34px)] w-6 top-4 right-1 border border-solid border-fill-secondary border-r-0" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-white">
                        <ProFormSelect
                          fieldProps={{
                            size: 'small',
                            style: { width: 56 },
                          }}
                          allowClear={false}
                          valueEnum={{
                            and: '且',
                            or: '或',
                          }}
                          formItemProps={{ className: 'mb-0' }}
                          name="operator"
                          placeholder="请选择"
                        />
                      </div>
                    </div>
                  );
                }
              }}
            </ProFormDependency>

            <div className="w-[calc(100%-60px)]">
              <ProFormList
                min={1}
                name="filters"
                copyIconProps={false}
                creatorButtonProps={{
                  creatorButtonText: '添加条件',
                  type: 'link',
                  block: false,
                }}
                itemRender={({ listDom, action }) => {
                  return (
                    <div className="pr-10 relative">
                      {listDom}
                      <span className="absolute right-0 top-0">{action}</span>
                    </div>
                  );
                }}
              >
                {(meta, index, action) => {
                  return (
                    <div className="space-x-4 inline-flex w-full">
                      <ProFormSelect
                        options={list?.filter((item) => item.isSelect)}
                        name="scope"
                        placeholder="请选择模块"
                        formItemProps={{ className: 'w-52' }}
                        rules={[{ required: true, message: '请选择' }]}
                        // @ts-ignore
                        onChange={() => {
                          action.setCurrentRowData({ question: undefined, answer: undefined });
                        }}
                      />
                      <ProFormDependency name={['scope']}>
                        {({ scope }) => {
                          const questions = scope
                            ? tool_config[scope as TQuestionsType]?.questions
                                ?.filter((item) => item.type === 'array' || item.type === 'enum')
                                ?.map((itm) => ({
                                  label: itm.label,
                                  value: itm.value,
                                }))
                            : [];
                          return (
                            <ProFormSelect
                              options={questions}
                              name="question"
                              placeholder="请选择题目"
                              formItemProps={{ className: 'w-52' }}
                              rules={[{ required: true, message: '请选择' }]}
                              // @ts-ignore
                              onChange={() => {
                                action.setCurrentRowData({ answer: undefined });
                              }}
                            />
                          );
                        }}
                      </ProFormDependency>

                      <span className="shrink-0 mt-2">等于</span>

                      {v === EKind.without_duplicate ? (
                        <ProFormDependency name={['scope', 'question']}>
                          {({ scope, question }) => {
                            const arr =
                              scope && question
                                ? tool_config[scope as TQuestionsType]?.questions.find(
                                    (item) => item.value === question,
                                  )?.options
                                : [];
                            return (
                              <ProFormSelect
                                options={arr}
                                formItemProps={{ className: 'w-48' }}
                                name="answer"
                                placeholder="请选择选项"
                                rules={[{ required: true, message: '请选择' }]}
                                fieldProps={{
                                  mode: 'multiple',
                                  maxTagCount: 'responsive',
                                }}
                              />
                            );
                          }}
                        </ProFormDependency>
                      ) : (
                        <ProFormSelect
                          formItemProps={{ className: 'w-48' }}
                          name="answer"
                          placeholder="请选择选项"
                          rules={[{ required: true, message: '请选择' }]}
                          valueEnum={{
                            equal: '均一致',
                            not_equal: '存在不一致',
                          }}
                          fieldProps={{
                            maxCount: 1,
                            mode: 'multiple',
                          }}
                        />
                      )}
                    </div>
                  );
                }}
              </ProFormList>
            </div>
          </div>
        </ProForm>
      </ProCard>
      <Spin spinning={isLoading} key={v}>
        {!!refData.current && (
          <ProCard bordered title="输出结果">
            <div className="flex justify-between items-center pb-2">
              <span>共 {refData.current?.count} 条符合条件的数据</span>
              <div className="flex space-x-3">
                <QuickCreate
                  source="analyze"
                  getIds={async () => {
                    const result = await getTaskLabelIds(getFormData());
                    const ids = result?.data?.map((item) => item.data_id);
                    return (v === EKind.without_duplicate ? ids : ids.flat()) as string[];
                  }}
                  trigger={
                    <Button disabled={refData.current?.count === 0} type="primary" ghost>
                      以此新建任务
                    </Button>
                  }
                />
                <Dropdown
                  menu={{
                    items: refData.current?.count === 0 ? [] : downloadItems,
                    onClick: (e) => {
                      download(e.key as 'id' | 'result');
                    },
                  }}
                  placement="bottom"
                >
                  <Button disabled={refData.current?.count === 0} type="primary" ghost>
                    下载
                    <CaretDownOutlined />
                  </Button>
                </Dropdown>
                <Button
                  loading={idsLoading}
                  disabled={refData.current?.count === 0}
                  type="primary"
                  onClick={() => {
                    mutate(getFormData());
                  }}
                >
                  查看题目
                </Button>
              </div>
            </div>
          </ProCard>
        )}
      </Spin>
    </div>
  );
};

const Analyze: React.FC = () => {
  const { clearAll } = useStoreIds();
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    clearAll();
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const items: TabsProps['items'] = [
    {
      key: EScopeType.conversation,
      label: '数据分布',
      children: <Distributed />,
    },
    {
      key: EKind.without_duplicate,
      label: '数据筛选',
      children: <Filter />,
    },
  ];

  return (
    <>
      <Button className="!p-0" type="link" onClick={showDrawer}>
        统计分析
      </Button>
      <Drawer title="统计分析" width={900} destroyOnClose onClose={onClose} open={open}>
        <Tabs size="large" className="-mt-4" defaultActiveKey={EScopeType.conversation} items={items} />
      </Drawer>
    </>
  );
};

export default Analyze;
