import { useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import styled from 'styled-components';
import type { ProDescriptionsProps } from '@ant-design/pro-components';
import { ProDescriptions } from '@ant-design/pro-components';
import { Link } from 'react-router-dom';
import { Button, Form, Select } from 'antd';
import Icon, { CheckOutlined, CloseOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { FormProps } from 'antd/lib/form';
import _ from 'lodash';

import { message } from '@/components/StaticAnt';

import downloadFromUrl from '../../utils/downloadFromUrl';
import { TaskStatus, TaskStatusMapping, updateLabelTask } from '../../services/task';
import type { AuditTask, OperatorTaskDetail, TaskToolConfig } from '../../services/task';
import type { JsonlUploadProps } from '../../components/JsonlUpload';
import JsonlUpload from '../../components/JsonlUpload';
import { ReactComponent as BookIcon } from '../../assets/book.svg';
import { teamKey } from '../../constant/query-key-factories';
import { getTeamList } from '../../services/team';
import dayjs from 'dayjs';

export const fillDefaultPluginValues = (toolConfig: TaskToolConfig) => {
  const result = _.cloneDeep(toolConfig);

  if (!result.plugins) {
    result.plugins = {
      content: {},
      conversation: {
        message_send_diff: false,
      },
    };
  } else {
    if (_.isNil(result.plugins.conversation.message_send_diff)) {
      _.set(result, 'plugins.conversation.message_send_diff', false);
    }
  }

  return result;
};

const StyledDescription = styled(ProDescriptions)`
  .ant-descriptions-row:last-child .ant-descriptions-item {
    padding-bottom: 0;
  }
  .ant-descriptions-item-label {
    color: var(--color-text-secondary);
  }

  .ant-descriptions-header {
    margin-bottom: 1rem;
  }
`;

const handleToolConfigExport = (toolConfig: TaskToolConfig) => {
  const result = fillDefaultPluginValues(toolConfig);

  downloadFromUrl(
    'data:application/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(result, null, 2)),
    `tool_config_${Date.now()}.json`,
  );
};

const basicInfoColumns: ProDescriptionsProps['columns'] = [
  {
    title: '任务ID',
    key: 'task_id',
    dataIndex: 'task_id',
    ellipsis: true,
    copyable: true,
  },
  {
    title: '任务状态',
    key: 'status',
    dataIndex: 'status',
    valueType: 'select',
    valueEnum: Object.values(TaskStatus).reduce((acc, status) => {
      return Object.assign(acc, {
        [status]: { text: TaskStatusMapping[status as TaskStatus], status },
      });
    }, {}),
  },
  {
    title: '任务描述',
    key: 'description',
    dataIndex: 'description',
  },
  {
    title: '工具配置',
    render: (text, record) => {
      return (
        <>
          <Button
            size="small"
            className="!py-0 !px-0"
            type="link"
            onClick={() => {
              if (!record?.progress?.total) {
                message.error('请先上传数据');
                return;
              }

              window.open(`/supplier/preview/${record.task_id}`, '_blank');
            }}
          >
            预览配置
          </Button>
          <Button
            size="small"
            className="!py-0 !px-0 ml-2"
            type="link"
            onClick={() => {
              handleToolConfigExport(record.tool_config as TaskToolConfig);
            }}
          >
            导出配置
          </Button>
        </>
      );
    },
  },
  {
    title: '创建人',
    key: 'creator',
    dataIndex: 'creator',
  },
  {
    title: '创建时间',
    key: 'created_time',
    dataIndex: 'created_time',
    render: (text) => {
      return dayjs(text as string).format('YYYY-MM-DD HH:mm:ss');
    },
  },
];

const dataColumns: ProDescriptionsProps['columns'] = [
  {
    title: '总题数',
    key: 'total',
    dataIndex: 'total',
    render: (text, record) => {
      return record.progress?.total || 0;
    },
  },
  {
    title: '关联审核任务',
    key: 'audit_tasks',
    dataIndex: 'audit_tasks',
    render: (value, record) => {
      if (!record?.audit_tasks || !record?.audit_tasks.length) {
        return '-';
      }

      return (
        <div className="flex flex-col">
          {record?.audit_tasks.map((task: AuditTask) => {
            return (
              <Link className="mb-2" key={task.task_id} to={`/task/audit/${task.task_id}`} target="_blank">
                {task.title}
              </Link>
            );
          })}
        </div>
      );
    },
  },
];

const descriptionLabelStyle = { width: 96, flexShrink: 0 };

export default function LabelDetailLeft() {
  const taskInfo = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const [form] = Form.useForm<{
    teams: string[];
  }>();
  const update = useMutation({
    mutationFn: updateLabelTask,
  });
  // teams的初始值应该为string[],但是proDescription的值为Team[]，使用proDescription的api非常麻烦
  const [editable, setIsEditable] = useState(false);
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
    enabled: taskInfo?.status !== TaskStatus.Done,
  });
  const teamOptions = useMemo(() => {
    return data?.list.map((team) => ({
      label: team.name,
      value: team.team_id,
    }));
  }, [data]);

  const handleJsonlFinished: JsonlUploadProps['onFinish'] = () => {
    revalidator.revalidate();
  };

  const handleSaveTeams: FormProps['onFinish'] = async (values) => {
    try {
      await update.mutateAsync({
        task_id: routeParams.id!,
        teams: values.teams,
      });
      message.success('团队已更新');
      revalidator.revalidate();
      setIsEditable(false);
    } catch (error) {}
  };

  const taskColumns: ProDescriptionsProps['columns'] = [
    {
      title: '答题倒计时',
      key: 'expire_time',
      editable: false,
      dataIndex: 'expire_time',
      render: (text) => {
        if (text) {
          return `${(Number(text) / 60).toFixed(1)} 分钟`;
        }
      },
    },
    {
      title: '执行团队',
      key: 'teams',
      dataIndex: 'teams',
      valueType: 'select',
      formItemProps: {
        noStyle: true,
      },
      render: (text, record) => {
        if (editable) {
          return (
            <div className="flex items-baseline">
              <Form form={form} onFinish={handleSaveTeams}>
                <Form.Item
                  name="teams"
                  className="!mb-0"
                  initialValue={taskInfo.teams?.map((item) => item.team_id)}
                  rules={[{ required: true, message: '请至少选择一个团队' }]}
                >
                  <Select mode="multiple" style={{ width: 200 }} options={teamOptions} />
                </Form.Item>
              </Form>
              <div className="flex gap-1 ml-2">
                <CheckOutlined className="mx-1 text-primary" onClick={form.submit} />
                <CloseOutlined className="mx-1 text-primary" onClick={() => setIsEditable(false)} />
              </div>
            </div>
          );
        }
        return (
          <div>
            {record.teams?.map((team: any) => team.name).join('、')}
            {taskInfo?.status !== TaskStatus.Done && (
              <Button
                className="!py-0 h-auto"
                onClick={() => setIsEditable(true)}
                type="link"
                icon={<EditOutlined />}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <StyledDescription
        className="mb-4"
        title="任务信息"
        labelStyle={descriptionLabelStyle}
        extra={
          <Link to={`/task/label/${routeParams.id}/edit#basic`}>
            <Button type="link" className="pr-0" icon={<EditOutlined />}>
              编辑任务
            </Button>
          </Link>
        }
        colon={false}
        dataSource={taskInfo}
        column={1}
        // @ts-ignore
        columns={basicInfoColumns}
      />
      {taskInfo.status !== TaskStatus.Created && (
        <>
          <StyledDescription
            className="mb-4"
            labelStyle={descriptionLabelStyle}
            title="数据信息"
            colon={false}
            dataSource={taskInfo}
            column={1}
            // @ts-ignore
            columns={dataColumns}
            extra={
              <div>
                <Link
                  className="text-[var(--color-text)]"
                  to="https://aicarrier.feishu.cn/docx/Wj5FdpLePo5UIbxMoC0c6D9TnDe "
                  target="_blank"
                >
                  <Icon component={BookIcon} className="mr-1" />
                  示例
                </Link>
                <JsonlUpload taskId={routeParams.id!} onFinish={handleJsonlFinished}>
                  <Button
                    className="!pr-0"
                    disabled={taskInfo?.status === TaskStatus.Done}
                    type="link"
                    icon={<UploadOutlined />}
                  >
                    数据上传
                  </Button>
                </JsonlUpload>
              </div>
            }
          />
          <StyledDescription
            labelStyle={descriptionLabelStyle}
            title="任务派发"
            colon={false}
            dataSource={taskInfo}
            column={1}
            // @ts-ignore
            columns={taskColumns}
          />
        </>
      )}
    </>
  );
}
