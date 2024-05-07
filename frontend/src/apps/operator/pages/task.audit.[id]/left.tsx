import { useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import styled from 'styled-components';
import type { ProDescriptionsProps } from '@ant-design/pro-components';
import { ProDescriptions } from '@ant-design/pro-components';
import { Link } from 'react-router-dom';
import { Button, Card, Form, Select } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { FormProps } from 'antd/lib/form';

import FancyInput from '@/components/FancyInput';
import { message } from '@/components/StaticAnt';

import downloadFromUrl from '../../utils/downloadFromUrl';
import { TaskStatus, TaskStatusMapping, updateAuditTaskTeams } from '../../services/task';
import type { AuditTaskDetail } from '../../services/task';
import chineseCharMap from '../../constant/chineseCharMap';
import Help from '../../components/Help';
import { teamKey } from '../../constant/query-key-factories';
import { getTeamList } from '../../services/team';
import { fillDefaultPluginValues } from '../task.label.[id]/left';
import dayjs from 'dayjs';

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
            className="!py-0 !px-0 mr-2"
            type="link"
            onClick={() => {
              window.open(`/supplier/review_audit/${record.task_id}?flow_index=1`, '_blank');
            }}
          >
            预览配置
          </Button>
          <Button
            size="small"
            className="!py-0 !px-0"
            type="link"
            onClick={() => {
              // 去掉默认维度的题目
              const toolConfig = fillDefaultPluginValues(record.tool_config);

              toolConfig.conversation.questions.splice(0, 1);

              downloadFromUrl(
                'data:application/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(toolConfig, null, 2)),
                `tool_config_${Date.now()}.json`,
              );
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
    title: (
      <div>
        总题数<Help>来自标注任务的总题数；如存在返工，重新提交至审核，题数 +1</Help>
      </div>
    ),
    key: 'progress',
    dataIndex: 'progress',
    render: (title, record) => {
      return record?.progress?.[0]?.pre_total;
    },
  },
  {
    title: '来自于标注任务',
    key: 'target_task',
    dataIndex: 'target_task',
    render: (title, record) => {
      return (
        <Link target="_blank" to={`/task/label/${record?.target_task?.task_id}`}>
          {record?.target_task?.title}
        </Link>
      );
    },
  },
];

const descriptionLabelStyle = { width: 108, flexShrink: 0 };

export default function AuditDetailLeft() {
  const taskInfo = (useRouteLoaderData('auditTask') || {}) as AuditTaskDetail;
  const routeParams = useParams();
  const [form] = Form.useForm<{
    teams: string[];
  }>();
  const revalidator = useRevalidator();
  const updateTeam = useMutation({
    mutationFn: updateAuditTaskTeams,
  });
  // teams的初始值应该为string[],但是proDescription的值为Team[]，使用proDescription的api非常麻烦
  const [editable, setIsEditable] = useState(false);
  const [currentFlowIndex, setCurrentFlowIndex] = useState<number>();
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

  const handleSaveTeams: FormProps['onFinish'] = async (values) => {
    try {
      await updateTeam.mutateAsync({
        task_id: routeParams.id!,
        flow_index: currentFlowIndex!,
        teams: values.teams,
      });
      message.success('团队已更新');
      revalidator.revalidate();
      setIsEditable(false);
    } catch (error) {}
  };

  const handleEdit = (flowIndex: number) => () => {
    setIsEditable(true);
    setCurrentFlowIndex(flowIndex);
  };

  const getFlowColumns = (flowIndex: number) => {
    return [
      {
        title: '审核规则',
        key: 'max_audit_count',
        dataIndex: 'max_audit_count',
        render: (text, record) => {
          return `每题 ${text} 次审核，${record.pass_audit_count} 次通过为达标`;
        },
      },
      {
        title: '审核比例',
        key: 'sample_ratio',
        editable: false,
        dataIndex: 'sample_ratio',
        render: (text) => {
          return `${text}%`;
        },
      },
      {
        title: '答题倒计时',
        key: 'expire_time',
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
        render: (text, record) => {
          if (editable && flowIndex === currentFlowIndex) {
            const flow = taskInfo.flow?.find((item) => item.flow_index === flowIndex);
            return (
              <div className="flex items-baseline">
                <Form form={form} onFinish={handleSaveTeams}>
                  <Form.Item
                    name="teams"
                    className="!mb-0"
                    initialValue={flow?.teams?.map((item) => item.team_id)}
                    rules={[{ required: true, message: '请至少选择一个团队' }]}
                  >
                    <Select mode="multiple" style={{ minWidth: 180 }} options={teamOptions} />
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
                <Button className="!py-0 h-auto" onClick={handleEdit(flowIndex)} type="link" icon={<EditOutlined />} />
              )}
            </div>
          );
        },
      },
    ] as ProDescriptionsProps['columns'];
  };

  return (
    <>
      <StyledDescription
        className="mb-8"
        title="任务信息"
        labelStyle={descriptionLabelStyle}
        extra={
          <Link to={`/task/audit/${routeParams.id}/edit#basic`}>
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
            className="mb-8"
            labelStyle={descriptionLabelStyle}
            title="数据信息"
            colon={false}
            dataSource={taskInfo}
            column={1}
            // @ts-ignore
            columns={dataColumns}
          />
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">审核派发</h3>
            <div>
              <FancyInput size="small" className="mr-2" type="boolean" disabled value={taskInfo.is_data_recreate} />
              未达标自动打回至标注
            </div>
          </div>
          {taskInfo?.flow?.map((flow) => (
            <Card className="mb-4" key={flow.flow_index}>
              <div className="text-secondary mb-3">{chineseCharMap[flow.flow_index]}审</div>
              <StyledDescription
                labelStyle={descriptionLabelStyle}
                colon={false}
                dataSource={flow}
                column={1}
                // @ts-ignore
                columns={getFlowColumns(flow.flow_index)}
              />
            </Card>
          ))}
        </>
      )}
    </>
  );
}
