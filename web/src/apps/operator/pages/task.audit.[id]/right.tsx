import type { FormProps, MenuProps } from 'antd';
import { Alert, Button, Card, Divider, Dropdown, Form, Steps } from 'antd';
import { useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import {
  CaretDownFilled,
  CheckOutlined,
  DownloadOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import clsx from 'clsx';

import FancyInput from '@/components/FancyInput';
import { message, modal } from '@/components/StaticAnt';

import type { AuditTaskDetail, AuditTaskFlowForDetail, AuditTaskUpdatePayload } from '../../services/task';
import { exportAuditTaskWorkload, exportAuditTask, TaskStatus, updateAuditTask } from '../../services/task';
import { getTeamList } from '../../services/team';
import TaskSelect from '../../components/TaskSelect';
import chineseCharMap from '../../constant/chineseCharMap';
import PercentageCircle from '../../components/PercentageCircle';
import Help from '../../components/Help';
import { teamKey } from '../../constant/query-key-factories';
import AuditorsTable from './users';

const FormWrapper = styled(Form)`
  .ant-steps-item-content {
    padding-left: 2rem;
    padding-right: 1rem;
  }

  .ant-steps-item-title {
    padding: 0;
    width: 100%;
  }

  .ant-steps-item-tail {
    inset-inline-start: 12px !important;
  }

  .ant-steps-item-icon {
    margin-top: 4px;
  }

  .ant-form-item-label {
    width: 120px;
  }
`;

export default function AuditDetailRight() {
  const routeParams = useParams();
  const revalidator = useRevalidator();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taskInfo = (useRouteLoaderData('auditTask') || {}) as AuditTaskDetail;
  const [form] = Form.useForm();
  const [stepStatus, setStepStatus] = useState<Record<string, 'processing' | 'finish'>>({
    0: 'processing',
    1: 'processing',
  });
  const [currentFlowIndex, setFlow] = useState(0);
  const handleFlowChange = (index: number) => () => {
    setFlow(index);
  };
  const update = useMutation({
    mutationFn: updateAuditTask,
  });

  useEffect(() => {
    if (_.get(taskInfo, 'progress.total')) {
      setStepStatus((pre) => ({
        ...pre,
        0: 'finish',
      }));
    }
  }, [taskInfo]);

  const { data } = useQuery({
    queryKey: teamKey.list({
      page: 1,
      // 获取所有团队
      page_size: 100000,
    }),
    queryFn: async () =>
      getTeamList({
        page: 1,
        // 获取所有团队
        page_size: 100000,
      }),
    enabled: taskInfo?.status === TaskStatus.Created,
  });

  const teamOptions = useMemo(() => {
    return data?.list.map((team) => ({
      label: team.name,
      value: team.team_id,
    }));
  }, [data]);

  const tabs = useMemo(() => {
    return (
      <div className="flex font-normal text-sm bg-[var(--color-bg-layout)] h-[32px] gap-1 rounded-sm p-[4px]">
        {taskInfo?.flow?.map((flow, index) => {
          return (
            <div key={flow.flow_index} className="flex items-center">
              <div
                onClick={handleFlowChange(index)}
                className={clsx('px-2 h-full leading-6 rounded-sm cursor-pointer', {
                  'bg-white': index === currentFlowIndex,
                  'text-primary': index === currentFlowIndex,
                })}
              >
                {chineseCharMap[flow.flow_index]}审
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [currentFlowIndex, taskInfo.flow]);

  const currentFlow = useMemo(() => taskInfo?.flow?.[currentFlowIndex], [currentFlowIndex, taskInfo.flow]);
  const currentProgress = useMemo(() => taskInfo?.progress?.[currentFlowIndex], [currentFlowIndex, taskInfo.progress]);

  const handleExportWorkload = () => {
    exportAuditTaskWorkload(routeParams.id!);
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'sync') {
      modal.info({
        title: '同步说明',
        content: '标注结果如有更新，每日凌晨00:00定时同步；如无更新，则无同步',
        okText: '知道了',
        onOk: () => {
          // TODO: syncing request
          console.log('start syncing');
        },
      });
    } else {
      exportAuditTask(routeParams.id!);
    }
  };

  const handleTaskStart: FormProps['onFinish'] = async (values: AuditTaskUpdatePayload) => {
    try {
      await update.mutateAsync({
        ...values,
        // 后端接收需要转换为秒
        flow: values.flow?.map((item) => ({
          ...item,
          expire_time: item.expire_time * 60,
        })),
        task_id: routeParams.id!,
        status: TaskStatus.Open,
      });

      message.success('任务已开始');
      revalidator.revalidate();
    } catch (error) {}
  };

  const handleTaskFormOnChange: FormProps['onValuesChange'] = (changedValues, values) => {
    setStepStatus((pre) => ({
      ...pre,
      0: values.target_task_id ? 'finish' : 'processing',
    }));

    setStepStatus((pre) => ({
      ...pre,
      1: values.flow.every(
        (item: AuditTaskFlowForDetail) =>
          item.expire_time > 0 && !_.isEmpty(item.teams) && item.max_audit_count && item.pass_audit_count,
      )
        ? 'finish'
        : 'processing',
    }));
  };

  const initialValues = {
    is_data_recreate: true,
    flow: [
      {
        expire_time: undefined,
        max_audit_count: 3,
        pass_audit_count: 2,
        sample_ratio: 100,
        teams: [],
      },
    ],
  };

  const isSubmitDisabled = useMemo(() => {
    return Object.values(stepStatus).some((status) => status !== 'finish');
  }, [stepStatus]);

  if (taskInfo.status === TaskStatus.Created) {
    return (
      <>
        <div className=" flex-1 overflow-auto min-h-0">
          <FormWrapper
            className="px-12 pt-12 flex"
            colon={false}
            form={form}
            onValuesChange={handleTaskFormOnChange}
            onFinish={handleTaskStart}
            labelAlign="left"
            initialValues={initialValues}
          >
            <Steps
              current={1}
              direction="vertical"
              items={[
                {
                  title: '目标任务',
                  description: (
                    <div className="mt-2">
                      <Form.Item
                        name="target_task_id"
                        label="来源于标注任务"
                        rules={[
                          {
                            required: true,
                            message: '请选择标注任务',
                          },
                        ]}
                      >
                        <TaskSelect />
                      </Form.Item>
                    </div>
                  ),
                  icon:
                    stepStatus[0] === 'finish' ? (
                      <div className="rounded-full w-6 h-6 text-sm flex items-center justify-center text-white bg-success">
                        <CheckOutlined />
                      </div>
                    ) : (
                      <div className="rounded-full w-6 h-6 text-sm flex items-center justify-center text-white bg-primary">
                        <EllipsisOutlined />
                      </div>
                    ),
                },
                {
                  title: (
                    <div className="flex justify-between">
                      任务派发
                      <div className="flex items-center">
                        <Form.Item name="is_data_recreate" className="!mb-0" label="">
                          <FancyInput size="small" type="boolean" />
                        </Form.Item>
                        <span className="text-sm ml-2">未达标自动打回至标注</span>
                      </div>
                    </div>
                  ),
                  description: (
                    <div className="mt-4">
                      <Form.List name="flow">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field, idx) => (
                              <Card className="mb-4" key={field.key}>
                                <div className="mb-2 text-secondary flex justify-between items-center">
                                  <div>{chineseCharMap[idx + 1]}审</div>
                                  {idx > 0 && (
                                    <Button size="small" onClick={() => remove(idx)} type="link">
                                      删除
                                    </Button>
                                  )}
                                </div>
                                <Form.Item label="审核规则">
                                  <div className="flex sm:flex-col md:flex-col lg:flex-col xl:flex-col 2xl:flex-row">
                                    <Form.Item
                                      label=""
                                      name={[idx, 'max_audit_count']}
                                      dependencies={['flow', idx, 'pass_audit_count']}
                                      className="mb-0 sm:mb-4 md:mb-4 lg:mb-4 xl:mb-4 2xl:mb-0"
                                      rules={[
                                        {
                                          required: true,
                                          message: '请填写每题审核次数',
                                        },
                                      ]}
                                    >
                                      <FancyInput min={1} addonBefore="每题" addonAfter="次审核" type="number" />
                                    </Form.Item>
                                    <span className="mx-2 sm:hidden md:hidden lg:hidden xl:hidden 2xl:block">，</span>
                                    <Form.Item
                                      label=""
                                      name={[idx, 'pass_audit_count']}
                                      dependencies={['flow', idx, 'max_audit_count']}
                                      className="mb-0"
                                      rules={[
                                        {
                                          required: true,
                                          message: '请填写达标次数',
                                        },
                                        ({ getFieldValue }) => ({
                                          validator(_unused, value) {
                                            const maxAuditCount = getFieldValue(['flow', idx, 'max_audit_count']);

                                            if (value > maxAuditCount) {
                                              return Promise.reject('达标次数不能大于每题审核次数');
                                            }

                                            return Promise.resolve();
                                          },
                                        }),
                                      ]}
                                    >
                                      <FancyInput min={1} addonAfter="次审核通过为达标" type="number" />
                                    </Form.Item>
                                  </div>
                                </Form.Item>

                                <Form.Item
                                  label="审核比例"
                                  name={[idx, 'sample_ratio']}
                                  rules={[
                                    {
                                      required: true,
                                      message: '请填写审核比例',
                                    },
                                  ]}
                                >
                                  <FancyInput
                                    precision={0}
                                    type="number"
                                    addonAfter={'%'}
                                    min={1}
                                    max={100}
                                    className="w-full"
                                  />
                                </Form.Item>

                                <Form.Item
                                  label="答题倒计时"
                                  name={[idx, 'expire_time']}
                                  tooltip="用户的最长答题时长，超时自动回收，答题结果不做保存"
                                  rules={[
                                    {
                                      required: true,
                                      message: '请填写答题倒计时',
                                    },
                                  ]}
                                >
                                  <FancyInput type="number" addonAfter="分钟" min={1} className="w-full" />
                                </Form.Item>
                                <Form.Item
                                  className="mb-0"
                                  label="执行团队"
                                  name={[idx, 'teams']}
                                  rules={[
                                    {
                                      required: true,
                                      message: '请选择执行团队',
                                    },
                                  ]}
                                >
                                  <FancyInput
                                    type="enum"
                                    mode="multiple"
                                    allowClear
                                    options={teamOptions}
                                    className="w-full"
                                  />
                                </Form.Item>
                              </Card>
                            ))}
                            <Form.Item className="!my-6 flex">
                              <Button
                                type="primary"
                                ghost
                                onClick={() =>
                                  add({
                                    expire_time: undefined,
                                    max_audit_count: 3,
                                    pass_audit_count: 2,
                                    sample_ratio: 100,
                                    teams: [],
                                  })
                                }
                                icon={<PlusOutlined />}
                              >
                                添加审核流程
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  ),
                  icon:
                    stepStatus[1] === 'finish' ? (
                      <div className="rounded-full w-6 h-6 text-sm flex items-center justify-center text-white bg-success">
                        <CheckOutlined />
                      </div>
                    ) : (
                      <div className="rounded-full w-6 h-6 text-sm flex items-center justify-center text-white bg-primary">
                        <EllipsisOutlined />
                      </div>
                    ),
                },
              ]}
            />
          </FormWrapper>
        </div>
        <div
          className="left-0 py-6 px-8 w-full bg-white"
          style={{ borderTop: '1px solid var(--color-border-secondary)' }}
        >
          <Button
            disabled={isSubmitDisabled}
            loading={update.isPaused}
            size="large"
            type="primary"
            onClick={form.submit}
          >
            开始任务
          </Button>
        </div>
      </>
    );
  } else {
    return (
      <div className="p-8 flex flex-col flex-1">
        <div className="flex justify-between mb-2">
          <h3 className="flex items-center">
            <span className="font-semibold mr-4">进度总览</span>
            {tabs}
          </h3>
          <div className="flex">
            <Dropdown
              menu={{
                onClick: handleMenuClick,
                items: [
                  {
                    key: 'download',
                    label: '直接下载',
                  },
                  // TODO：暂时不做同步
                  // {
                  //   key: 'sync',
                  //   label: '同步到Inferstore',
                  //   children: [
                  //     {
                  //       key: 'switch',
                  //       disabled: true,
                  //       label: (
                  //         <div className="w-[250px] cursor-default">
                  //           <div className="flex justify-between mb-4">
                  //             <span className="text-black">自动同步至Inferstore</span>
                  //             <Switch />
                  //           </div>
                  //           <div className="text-gray-400">
                  //             温馨提示：开启自动同步后，如标注结果有更新，每1小时同步一次，准点同步；如无更新，则无同步
                  //           </div>
                  //         </div>
                  //       ),
                  //     },
                  //   ],
                  // },
                ],
              }}
            >
              <Button type="text">
                获取标注结果
                <CaretDownFilled />
              </Button>
            </Dropdown>
            <Button type="link" className="ml-2 !px-0" icon={<DownloadOutlined />} onClick={handleExportWorkload}>
              导出工作量
            </Button>
          </div>
        </div>
        {/* 当前审核任务不为结束，target_task的状态为结束的时候，显示异常 */}
        {taskInfo.is_data_recreate &&
          taskInfo?.status !== TaskStatus.Done &&
          taskInfo?.target_task?.status === TaskStatus.Done && (
            <Alert
              className="mb-4"
              icon={<InfoCircleOutlined />}
              message="未达标数据自动打回异常，对应标注任务已结束"
              type="error"
              showIcon
            />
          )}
        {/* 第二行 */}
        <div className="flex h-[160px] rounded bg-[var(--color-fill-quaternary)] items-center gap-4 justify-around mb-6">
          <div className="flex-1 h-full flex items-center justify-around">
            <div className="px-8">
              <PercentageCircle
                size={118}
                strokeWidth={16}
                percentage={
                  _.get(currentProgress, 'total')
                    ? (_.get(currentProgress, 'completed') * 100) / _.get(currentProgress, 'total')
                    : 0
                }
              >
                <div className="flex flex-col items-center absolute top-0 left-0 h-full w-full justify-center">
                  <div className="text-primary text-lg">
                    {_.get(currentProgress, 'total')
                      ? ((_.get(currentProgress, 'completed') * 100) / _.get(currentProgress, 'total')).toFixed(0)
                      : 0}
                    %
                  </div>
                  <div className="text-[12px] text-secondary">
                    完成进度<Help>本流程完成多次审核的题数 / {currentFlowIndex > 0 ? '应审题数' : '总题数'}</Help>
                  </div>
                </div>
              </PercentageCircle>
            </div>
            <div className="flex flex-col gap-1 pr-2 flex-1">
              <div className="text-[var(--color-text-secondary)] flex justify-between items-center">
                已完成题数
                <span className="text-[var(--color-text)] text-lg">{_.get(currentProgress, 'completed', 0)}</span>
              </div>
              <div className="text-[var(--color-text-secondary)] flex justify-between items-center">
                <span>
                  抽审题数
                  <Help>
                    {currentFlowIndex > 0
                      ? '上一轮审核最终达标的题数*审核比例，会存在一定题数偏差'
                      : '上传题数*审核比例，会存在一定题数偏差'}
                  </Help>
                </span>
                <span className="text-[var(--color-text)] text-lg">{_.get(currentProgress, 'total', 0)}</span>
              </div>
            </div>
          </div>
          <Divider type="vertical" className="h-12" />
          <div className="basis-[40%] h-full flex items-center justify-around">
            <div className="flex flex-col items-start ml-3">
              <div className="text-2xl">
                {_.get(currentProgress, 'passed')}
                <span className="text-sm text-[var(--color-text-secondary)]"> 题</span>
              </div>
              <div className="mb-2">
                达标<Help>本流程完成多次审核，达到达标要求的题数</Help>
              </div>
            </div>
            {/* 已完成题目个数 */}
            <div className="flex flex-col items-start ml-3">
              <div className="text-2xl">
                {_.get(currentProgress, 'unpassed')}
                <span className="text-sm text-[var(--color-text-secondary)]"> 题</span>
              </div>
              <div className="mb-2">未达标</div>
            </div>
          </div>
        </div>
        {/* 第三行 */}
        <div>
          <h4 className="mb-4 font-semibold flex justify-between">
            <div>
              每题审核 {_.get(currentFlow, 'max_audit_count')} 次， 共{' '}
              {_.get(currentProgress, 'total') * _.get(currentFlow, 'max_audit_count')} 次
              <span className="text-secondary font-normal">
                （<span>审核效率：</span>
                {Math.round(
                  _.get(currentProgress, 'audit_time', 1)
                    ? ((_.get(currentProgress, 'approved', 0) + _.get(currentProgress, 'rejected', 0)) /
                        _.get(currentProgress, 'audit_time', 1)) *
                        3600
                    : 0,
                )}
                <span className="text-secondary text-sm ml-2">题/小时</span>）
              </span>
            </div>
          </h4>
          <span>
            <span className="text-[var(--color-text-secondary)]">待审核</span>
            <span className="ml-2 mr-12">{_.get(currentProgress, 'pending')}</span>
            <span className="text-[var(--color-text-secondary)]">审核中</span>
            <span className="ml-2 mr-12">{_.get(currentProgress, 'auditing')}</span>
            <span className="text-[var(--color-text-secondary)]">审核通过</span>
            <span className="ml-2 mr-12">{_.get(currentProgress, 'approved')}</span>
            <span className="text-[var(--color-text-secondary)]">审核未通过</span>
            <span className="ml-2 mr-12">{_.get(currentProgress, 'rejected')}</span>
            <span className="text-[var(--color-text-secondary)]">
              跳过审核
              <Help>已判定是否达标，无需继续审核的题</Help>
            </span>
            <span className="ml-2 mr-12">{_.get(currentProgress, 'skipped')}</span>
          </span>
        </div>
        <Divider className="my-4" />
        {/* 标注员表格 */}
        <div className="flex flex-col flex-1">
          <AuditorsTable flowIndex={currentFlow?.flow_index} />
        </div>
      </div>
    );
  }
}
