import { useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import styled from 'styled-components';
import type { FormProps, MenuProps } from 'antd';
import { Button, Divider, Dropdown, Form, Popconfirm, Steps, Tooltip, message } from 'antd';
import _ from 'lodash';
import Icon, {
  CaretDownFilled,
  CheckOutlined,
  DownloadOutlined,
  DownOutlined,
  EllipsisOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import FancyInput from '@/components/FancyInput';
import { useStoreIds } from '@/hooks/useStoreIds';

import Analyze from './Analyze';
import type { OperatorTaskDetail } from '../../services/task';
import {
  EKind,
  TaskStatus,
  clearLabelTaskData,
  exportLabelRecord,
  exportLabelTask,
  exportLabelTaskWorkload,
  updateLabelTask,
} from '../../services/task';
import type { JsonlUploadProps } from '../../components/JsonlUpload';
import JsonlUpload from '../../components/JsonlUpload';
import { ReactComponent as BookIcon } from '../../assets/book.svg';
import PercentageCircle from '../../components/PercentageCircle';
import Help from '@/components/Help';
import LabelersTable from './users';
import { teamKey } from '../../constant/query-key-factories';
import { getTeamList } from '../../services/team';
import DownloadRange from './DownloadRange';
import { ProFormSelect } from '@ant-design/pro-components';
import clsx from 'clsx';
import useLang from '@/hooks/useLang';

const FormWrapper = styled.div`
  .ant-steps-item-content {
    padding-left: 2rem;
    padding-right: 1rem;
  }

  .ant-steps-item-tail {
    inset-inline-start: 12px !important;
  }

  .ant-steps-item-icon {
    margin-top: 4px;
  }

  .ant-form-item-label {
    width: 110px;
  }
`;

const getItems = (id: string) => {
  return [
    {
      key: '1',
      label: (
        <a target="_blank" rel="noopener noreferrer" href={`/supplier/review/${id}?inlet=operator`}>
          单题展示
        </a>
      ),
    },
    {
      key: '2',
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`/supplier/review/${id}?kind=${EKind.with_duplicate}&inlet=operator`}
        >
          源题组合展示{' '}
          <Help placement="left" className="relative z-10">
            适用于一题多答，多个答案组合查看
          </Help>
        </a>
      ),
    },
  ];
};

export default function LabelDetailRight() {
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const { clearAll } = useStoreIds();
  const taskInfo = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;
  const [form] = Form.useForm();
  const { setLang } = useLang();
  const [stepStatus, setStepStatus] = useState<Record<string, 'processing' | 'finish'>>({
    0: 'processing',
    1: 'processing',
  });
  const update = useMutation({
    mutationFn: updateLabelTask,
  });

  const onOpenChange = () => {
    setLang('zh-CN');
    clearAll();
  };

  useEffect(() => {
    if (_.get(taskInfo, 'progress.total')) {
      setStepStatus((pre) => ({
        ...pre,
        0: 'finish',
      }));
    }
  }, [taskInfo]);

  const { data } = useQuery({
    staleTime: 3000,
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

  const handleExportWorkload = () => {
    exportLabelTaskWorkload(routeParams.id!);
  };

  const handleTaskStart = async (values: any) => {
    try {
      await update.mutateAsync({
        ...values,
        // 后端接收需要转换为秒
        expire_time: values.expire_time * 60,
        task_id: routeParams.id!,
        status: TaskStatus.Open,
      });
      message.success('任务已开始');
      revalidator.revalidate();
    } catch (error) {
      /* empty */
    }
  };

  const handleJsonlFinished: JsonlUploadProps['onFinish'] = (values) => {
    if (values.length > 0) {
      setStepStatus((pre) => ({
        ...pre,
        0: 'finish',
      }));
    }

    revalidator.revalidate();
  };

  const handleTaskFormOnChange: FormProps['onValuesChange'] = (changedValues, values) => {
    if (values.expire_time > 0 && !_.isEmpty(values.teams)) {
      setStepStatus((pre) => ({
        ...pre,
        1: 'finish',
      }));
    } else {
      setStepStatus((pre) => ({
        ...pre,
        1: 'processing',
      }));
    }
  };

  const handleClear = async () => {
    try {
      await clearLabelTaskData({
        task_id: routeParams.id!,
      });

      message.success('数据已清除');
      setStepStatus((pre) => ({
        ...pre,
        0: 'processing',
      }));

      revalidator.revalidate();
    } catch (error) {
      /* empty */
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'record') {
      exportLabelRecord(routeParams.id!);
    }
  };

  const isSubmitDisabled = useMemo(() => {
    return Object.values(stepStatus).some((status) => status !== 'finish');
  }, [stepStatus]);

  if (taskInfo.status === TaskStatus.Created) {
    return (
      <FormWrapper className="px-12 pt-12 flex">
        <Steps
          current={1}
          direction="vertical"
          items={[
            {
              title: '数据上传',
              description: (
                <div className="mt-2">
                  <div className="text-[var(--color-text-secondary)] mb-2">
                    总题数 {_.get(taskInfo, 'progress.total')}
                    <Popconfirm
                      disabled={!_.get(taskInfo, 'progress.total')}
                      onConfirm={handleClear}
                      title="是否确认清空数据？清空后不可恢复"
                    >
                      <Button type="link" danger disabled={!_.get(taskInfo, 'progress.total')}>
                        清空
                      </Button>
                    </Popconfirm>
                  </div>
                  <div className="mb-10 flex items-center">
                    <JsonlUpload taskId={routeParams.id!} onFinish={handleJsonlFinished}>
                      <Button ghost type="primary" icon={<UploadOutlined />}>
                        数据上传
                      </Button>
                    </JsonlUpload>
                    <Link
                      className="ml-4 text-secondary"
                      to="https://github.com/opendatalab/LabelLLM/wiki/%E6%95%B0%E6%8D%AE%E4%B8%8A%E4%BC%A0%E6%A0%BC%E5%BC%8F"
                      target="_blank"
                    >
                      <Icon component={BookIcon} className="mr-1" />
                      示例
                    </Link>
                  </div>
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
              title: '任务派发',
              description: (
                <Form
                  colon={false}
                  form={form}
                  className="mt-2"
                  onValuesChange={handleTaskFormOnChange}
                  onFinish={handleTaskStart}
                  labelAlign="left"
                >
                  <Form.Item
                    label="答题倒计时"
                    name="expire_time"
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
                  <ProFormSelect
                    name="teams"
                    label="标注团队"
                    options={teamOptions}
                    placeholder="请选择执行团队"
                    rules={[{ required: true, message: '请选择执行团队' }]}
                    fieldProps={{
                      mode: 'multiple',
                      maxTagCount: 'responsive',
                    }}
                  />
                  <Form.Item>
                    <Button disabled={isSubmitDisabled} loading={update.isPending} type="primary" htmlType="submit">
                      开始任务
                    </Button>
                  </Form.Item>
                </Form>
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
    );
  } else {
    return (
      <>
        <div className="flex justify-between mb-2 items-center">
          <h3 className="font-semibold">进度总览</h3>
          <div className="flex">
            <Dropdown
              menu={{
                onClick: handleMenuClick,
                items: [
                  {
                    key: 'result',
                    label: <DownloadRange type="label" taskId={routeParams.id!} />,
                  },
                  {
                    key: 'record',
                    label: '标注记录',
                  },
                ],
              }}
            >
              <Button type="text">
                下载
                <CaretDownFilled />
              </Button>
            </Dropdown>
            <Button type="link" className="ml-2 !px-0" icon={<DownloadOutlined />} onClick={handleExportWorkload}>
              导出工作量
            </Button>
          </div>
        </div>
        {/* 第二行 */}
        <div className="flex bg-[#f9f9f9] h-[158px] items-center justify-around rounded mb-6">
          {/* 总题目个数 */}
          <div className="px-8">
            <PercentageCircle
              size={110}
              strokeWidth={16}
              percentage={
                _.get(taskInfo, 'progress.total')
                  ? (_.get(taskInfo, 'progress.completed') * 100) / _.get(taskInfo, 'progress.total')
                  : 0
              }
            >
              <div className="flex flex-col items-center absolute top-0 left-0 h-full w-full justify-center">
                <div className="text-primary text-lg">
                  {_.get(taskInfo, 'progress.total')
                    ? ((_.get(taskInfo, 'progress.completed') * 100) / _.get(taskInfo, 'progress.total')).toFixed(0)
                    : 0}
                  %
                </div>
                <div className="text-[12px] text-secondary">完成进度</div>
              </div>
            </PercentageCircle>
          </div>
          <div className="flex flex-col gap-1 pr-8 flex-1">
            <div className="rounded px-4 text-[var(--color-text-secondary)] flex justify-between items-center">
              <span>
                已完成题数 <Help>标注完成题数 - 打回时生成新题的未达标题数</Help>
              </span>
              <span className="text-[var(--color-text)] text-lg">{_.get(taskInfo, 'progress.completed', 0)}</span>
            </div>
            <div className="rounded px-4 text-[var(--color-text-secondary)] flex justify-between items-center">
              <span>
                总题数
                <Help>上传题数*轮次数</Help>
              </span>
              <span className="text-[var(--color-text)] text-lg">{_.get(taskInfo, 'progress.total', 0)}</span>
            </div>
          </div>
          <Divider type="vertical" className="h-12" />
          <div className="flex flex-col basis-[33%] items-center">
            <Dropdown menu={{ items: getItems(routeParams.id as string) }} onOpenChange={onOpenChange}>
              <a onClick={(e) => e.preventDefault()}>
                查看题目 <DownOutlined />
              </a>
            </Dropdown>
            <div className="-ml-4">
              <Analyze />
            </div>
          </div>
        </div>
        {/* 第三行 */}
        <div>
          <h4 className="mb-4 font-semibold flex justify-between">
            <div>
              标注
              <span className="text-secondary font-normal">
                （<span>标注效率：</span>
                {_.get(taskInfo, 'progress.label_time')
                  ? Math.round(
                      ((_.get(taskInfo, 'progress.completed', 0) + _.get(taskInfo, 'progress.discarded', 0)) /
                        _.get(taskInfo, 'progress.label_time', 1)) *
                        3600,
                    )
                  : 0}
                <span className="text-secondary text-sm ml-2">题/小时</span>）
              </span>
            </div>
            <span className="font-normal">
              题数说明
              <Help placement="topLeft">一道题如被打回重新标注，标注题数+1；实际标注题数≥总题数</Help>
            </span>
          </h4>
          <span>
            <span>待标注</span>
            <span className="ml-2 mr-12">{_.get(taskInfo, 'progress.pending')}</span>
            <span>标注中</span>
            <span className="ml-2 mr-12">
              <Tooltip
                title={
                  taskInfo.users?.labeling?.length
                    ? taskInfo.users?.labeling?.map((user) => user.username).join(', ')
                    : undefined
                }
              >
                <span
                  className={clsx({
                    'cursor-default text-primary': !!taskInfo.users?.labeling?.length,
                  })}
                >
                  {_.get(taskInfo, 'progress.labeling')}
                </span>
              </Tooltip>
            </span>
            <span>标注完成</span>
            <span className="ml-2">{_.get(taskInfo, 'progress.labeled')}</span>
            <span className="text-secondary">
              （<span>未达标</span>
              <span className="ml-2">{_.get(taskInfo, 'progress.discarded', 0)}</span>）
            </span>
          </span>
        </div>
        <Divider className="my-4" />
        {/* 标注员表格 */}
        <div className="flex flex-col flex-1">
          <LabelersTable />
        </div>
      </>
    );
  }
}
