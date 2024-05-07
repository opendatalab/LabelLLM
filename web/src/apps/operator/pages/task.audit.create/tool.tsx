import type { FormProps } from 'antd';
import { Button, Card, Form } from 'antd';
import { useContext } from 'react';
import { styled } from 'styled-components';
import { useMutation } from '@tanstack/react-query';
import { useSessionStorage } from 'react-use';
import { useNavigate, useParams, useRouteLoaderData, useRevalidator } from 'react-router';
import _ from 'lodash';

import FancyInput, { add } from '@/components/FancyInput';
import { FancyGroup } from '@/components/FancyGroup';
import type { FancyInputParams } from '@/components/FancyInput/types';
import { message, modal } from '@/components/StaticAnt';

import FancyQuestionEditor from '../../components/customFancy/QuestionEditor';
import TaskFormContext from './context';
import type { AuditTaskCreatePayload, AuditTaskDetail, TaskToolConfig } from '../../services/task';
import { TaskStatus, createAuditTask, updateAuditTask } from '../../services/task';
import { filterInvalidConditions, validateOptions } from '../task.label.create/utils';
import { ToolConfigUpload } from '../../components/ToolConfigUpload';

add('question-editor', FancyQuestionEditor);

const StyledForm = styled(Form)`
  .ant-form-item {
    /* margin-bottom: 0.5rem; */

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const toolFormTemplate: FancyInputParams[] = [
  {
    type: 'question-editor',
    field: 'questions',
    key: 'questions',
    antProps: {
      hideFirst: true,
    },
  },
];

const defaultQuestion = {
  id: 'preset_question',
  type: 'enum' as const,
  label: '判断左侧标注结果是否正确，且符合要求',
  value: 'is_pass',
  required: true,
  options: [
    { label: '是', value: 'yes', id: 'preset_question_yes' },
    { label: '否', value: 'no', id: 'preset_question_no' },
  ],
};

interface PartialProps {
  onStepChange: (step: number) => void;
}

export default function TaskTool({ onStepChange }: PartialProps) {
  const { toolForm } = useContext(TaskFormContext);
  const navigate = useNavigate();
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const create = useMutation({
    mutationFn: createAuditTask,
  });
  const update = useMutation({
    mutationFn: updateAuditTask,
  });
  const [preStepTaskCache] = useSessionStorage<AuditTaskCreatePayload>('audit_task_basic_cache');
  const [toolFromCache, setToolCache] = useSessionStorage<TaskToolConfig>('audit_task_tool_cache');
  const taskInfo = useRouteLoaderData('auditTask') as AuditTaskDetail;
  const toolsDisabled = Boolean(routeParams.id) && taskInfo?.status !== TaskStatus.Created;

  const handleOnFinish: FormProps['onFinish'] = () => {
    toolForm.validateFields().then(async (_values) => {
      let createdResponse: { task_id: string } | null = null;

      if (!validateOptions(_values)) {
        message.error('请检查选择题设置，每个选择题至少配置一个选项');
        return;
      }

      try {
        if (!routeParams.id) {
          createdResponse = await create.mutateAsync({
            ...preStepTaskCache,
            tool_config: {
              ..._values,
              message: {
                questions: [],
                is_sortable: false,
                is_sn_unique: false,
              },
            },
          } as AuditTaskCreatePayload);
        } else {
          const payload = {
            ...taskInfo,
            ...preStepTaskCache,
            tool_config: _values,
          };

          if (toolsDisabled) {
            await update.mutateAsync({
              task_id: payload.task_id,
              description: payload.description,
              title: payload.title,
            });
          } else {
            await update.mutateAsync({
              task_id: payload.task_id,
              description: payload.description,
              title: payload.title,
              tool_config: payload.tool_config,
            });
          }
        }
      } catch (err) {
        return;
      }

      const modalInstance = modal.success({
        content: routeParams.id ? '任务已保存' : '任务已创建',
        width: 160,
        footer: null,
      });

      setTimeout(() => {
        modalInstance.destroy();
        revalidator.revalidate();
        navigate(`/task/audit/${routeParams.id || createdResponse!.task_id}`);
      }, 1000);
    });
  };

  const handleImport = (values: TaskToolConfig) => {
    // 如果存在默认维度，需要去掉
    let toolConfig = _.cloneDeep(values);
    toolConfig.conversation.questions = values.conversation.questions.filter(
      (item) => item.id !== 'preset_question' && item.value !== 'is_pass',
    );
    // 去除针对每条回复的问题
    toolConfig.message = {
      questions: [],
      is_sortable: false,
      is_sn_unique: false,
    };
    // 删除无效的条件
    toolConfig = filterInvalidConditions(toolConfig);
    // 重新设置默认维度
    toolConfig.conversation.questions.unshift(defaultQuestion);

    toolForm.setFieldsValue(toolConfig);
    setToolCache(toolConfig);
  };

  const initialValues = toolFromCache ||
    taskInfo?.tool_config || {
      conversation: {
        questions: [defaultQuestion],
      },
    };

  return (
    <div>
      <StyledForm
        className="w-[614px] mt-8 mx-auto"
        form={toolForm}
        layout="vertical"
        colon={false}
        onFinish={handleOnFinish}
        onValuesChange={() => {
          setTimeout(() => {
            setToolCache(toolForm.getFieldsValue());
          }, 0);
        }}
        initialValues={initialValues}
      >
        <h3 className="mb-4">审核配置</h3>
        <Card className="mb-4">
          <h4 className="mb-4 font-semibold">默认维度</h4>
          <Form.Item hidden name="message">
            <FancyInput type="string" />
          </Form.Item>
          <Form.Item
            required
            label={
              <div>
                判断左侧标注结果是否正确，且符合要求（ID: preset_question <span className="ml-2">value: is_pass</span>）
              </div>
            }
          >
            <div className="flex flex-col text-[var(--color-text-tertiary)]">
              <div className="mb-2">
                选项1：是（ID: preset_question_yes <span className="ml-2">value: yes</span>）
              </div>
              <div>
                选项2：否（ID: preset_question_no <span className="ml-2">value: no</span>）
              </div>
            </div>
          </Form.Item>
          <div className="flex items-center mb-4 w-full justify-between">
            <h4 className="!mb-0 font-semibold">自定义维度</h4>
            <ToolConfigUpload onFinish={handleImport}>
              <Button className="!py-0 !px-0" type="link" disabled={toolsDisabled}>
                上传 JSON 配置
              </Button>
            </ToolConfigUpload>
          </div>

          <FancyGroup disabled={toolsDisabled} group={toolFormTemplate} name="conversation" />
        </Card>
        <Form.Item>
          <Button
            type="primary"
            className="mr-4"
            onClick={toolForm.submit}
            loading={create.isPending || update.isPending}
          >
            {!routeParams.id ? '立即创建' : '保存'}
          </Button>
          <Button type="default" onClick={() => onStepChange(0)}>
            上一步
          </Button>
        </Form.Item>
      </StyledForm>
    </div>
  );
}
