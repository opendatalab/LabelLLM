import { QuestionCircleOutlined } from '@ant-design/icons';
import { ProFormDependency, ProFormRadio, ProFormSwitch } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useSessionStorage } from 'react-use';
import type { CollapseProps, FormProps } from 'antd';
import { Button, Card, Checkbox, Collapse, Form, Popover } from 'antd';
import _ from 'lodash';
import { pick } from 'lodash/fp';
import { useContext } from 'react';
import { useNavigate, useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import { styled } from 'styled-components';

import { FancyGroup } from '@/components/FancyGroup';
import { add } from '@/components/FancyInput';
import type { FancyInputParams } from '@/components/FancyInput/types';
import { message, modal } from '@/components/StaticAnt';

import demoConversation from '../../assets/demo-conversation@2x.png';
import demoQuestion from '../../assets/demo-question@2x.png';
import demoReply from '../../assets/demo-reply@2x.png';
import diff from '../../assets/diff.png';
import grid1 from '../../assets/grid1.png';
import grid2 from '../../assets/grid2.png';
import grid3 from '../../assets/grid3.png';
import grid4 from '../../assets/grid4.png';
import { ToolConfigUpload } from '../../components/ToolConfigUpload';
import FancyQuestionEditor from '@/apps/operator/components/CustomFancy/QuestionEditor';
import type { OperatorTaskDetail, OperatorTaskUpdatePayload, TaskToolConfig } from '../../services/task';
import { TaskStatus, createLabelTask, updateLabelTask } from '../../services/task';
import TaskFormContext from './context';
import { filterInvalidConditions, validateOptions } from './utils';

const layoutDesc = {
  '1': grid1,
  '2': grid2,
  '3': grid3,
  '4': grid4,
};

add('question-editor', FancyQuestionEditor);

const StyledForm = styled(Form)`
  .ant-form-item {
    /* margin-bottom: 0.5rem; */

    &:last-child {
      margin-bottom: 0;
    }
  }

  .ant-collapse-header {
    align-items: center !important;
    width: 9rem;
    padding-left: 0 !important;
  }

  .ant-collapse-content-box {
    padding: 0 !important;
  }

  .ant-collapse-expand-icon {
    padding-inline-start: 0 !important;
  }

  .ant-collapse-arrow {
    font-size: 1rem !important;
  }
`;

const conversationFormTemplate: FancyInputParams[] = [
  {
    type: 'question-editor',
    field: 'questions',
    key: 'questions',
  },
];

const messageFormTemplate: FancyInputParams[] = [
  {
    type: 'question-editor',
    field: 'questions',
    key: 'questions',
  },
  {
    field: 'is_sortable',
    key: 'is_sortable',
    label: '对所有回复排序',
    type: 'boolean',
    tooltip: '默认为必填，根据答复条数自动生成序号个数',
    fieldProps: {
      className: 'mb-0',
    },
  },
  {
    field: 'is_sn_unique',
    key: 'is_sn_unique',
    label: '',
    dependencies: ['message, is_sortable'],
    type: 'boolean',
    renderFormItem(params, form, fullField) {
      const is_sortable = form.getFieldValue([...(fullField as any[]).slice(0, -1), 'is_sortable']);

      if (!is_sortable) {
        return null;
      }

      return (
        <Checkbox
          className="ml-32"
          disabled={params.disabled}
          defaultChecked={!form.getFieldValue(fullField)}
          onChange={(e) => {
            form.setFieldValue(fullField, !e.target.checked);
          }}
        >
          同一序号可重复选择
        </Checkbox>
      );
    },
  },
];

interface PartialProps {
  onStepChange: (step: number) => void;
}

export default function TaskTool({ onStepChange }: PartialProps) {
  const { toolForm } = useContext(TaskFormContext);
  const navigate = useNavigate();
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const create = useMutation({
    mutationFn: createLabelTask,
  });
  const update = useMutation({
    mutationFn: updateLabelTask,
  });
  const [preStepTaskCache] = useSessionStorage<OperatorTaskDetail>('label_task_basic_cache');
  const [toolFromCache, setToolCache] = useSessionStorage<TaskToolConfig>('label_task_tool_cache');
  const taskInfo = useRouteLoaderData('labelTask') as OperatorTaskDetail;
  const toolsDisabled = Boolean(routeParams.id) && taskInfo?.status !== TaskStatus.Created;

  const handleOnFinish: FormProps['onFinish'] = () => {
    toolForm.validateFields().then(async (_values: TaskToolConfig) => {
      if (
        _.isEmpty(_values.message?.questions) &&
        _.isEmpty(_values.conversation?.questions) &&
        _.isEmpty(_values.question?.questions) &&
        !_values.message?.is_sortable
      ) {
        message.error('请至少配置一种标注工具');
        return;
      }

      if (!validateOptions(_values)) {
        message.error('请检查选择题设置，每个选择题至少配置一个选项');
        return;
      }

      let createdResponse: { task_id: string } | null = null;
      try {
        if (!routeParams.id) {
          createdResponse = await create.mutateAsync({
            ...preStepTaskCache,
            tool_config: _values,
          } as any);
        } else {
          let payload = {
            ...taskInfo,
            ...preStepTaskCache,
            tool_config: _values,
          };

          if (toolsDisabled) {
            payload = pick(['task_id', 'description', 'title'])(payload) as OperatorTaskDetail;
          } else {
            payload = pick(['task_id', 'description', 'title', 'tool_config'])(payload) as OperatorTaskDetail;
          }
          await update.mutateAsync(payload as unknown as OperatorTaskUpdatePayload);
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
        navigate(`/task/label/${routeParams.id || createdResponse!.task_id}`);
      }, 1000);
    });
  };

  const handleImport = (values: TaskToolConfig) => {
    // 删除无效的条件
    const toolConfig = filterInvalidConditions(values);

    toolForm.setFieldsValue(toolConfig);
    setToolCache(toolConfig);
  };

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: <h3 className="mb-0">题目插件配置</h3>,
      forceRender: true,
      children: (
        <div>
          <Card className="mb-4">
            <h4 className="mb-4">
              针对对话中的提问（message_type: send）
              <Popover placement="bottom" content={<img width={752} alt="diff" src={diff} />}>
                <QuestionCircleOutlined className="ml-2 text-[var(--color-text-tertiary)] cursor-help" />
              </Popover>
              <div className="mt-4">
                <ProFormSwitch
                  disabled={toolsDisabled}
                  name={['plugins', 'conversation', 'message_send_diff']}
                  label={<span className="text-sm font-normal">内容对比</span>}
                />
                <div className="text-secondary -mt-4 font-normal">
                  注意，字符串比对受文本格式的影响，包括换行符的位置和数量。确保原始文本和目标文本的格式一致，以获得准确的比对结果。
                </div>
              </div>
            </h4>
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: <h3 className="mb-0">布局配置</h3>,
      forceRender: true,
      children: (
        <div>
          <Card className="mb-4">
            <h4 className="mb-4">针对对话（messages）</h4>
            <ProFormRadio.Group
              disabled={toolsDisabled}
              name={['layout', 'grid']}
              options={[
                {
                  label: '1栏',
                  value: 1,
                },
                {
                  label: '2栏',
                  value: 2,
                },
                {
                  label: '3栏',
                  value: 3,
                },
                {
                  label: '4栏',
                  value: 4,
                },
              ]}
            />
            <ProFormDependency name={['layout']}>
              {({ layout }) => {
                return (
                  <div className="flex -mt-4">
                    <span className="text-secondary">示例：</span>
                    <img
                      className="block w-[400px] shadow-lg rounded-lg"
                      src={layoutDesc[(layout?.grid || '1') as keyof typeof layoutDesc]}
                      alt=""
                    />
                  </div>
                );
              }}
            </ProFormDependency>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <StyledForm
        className="w-[614px] mt-8 mx-auto"
        form={toolForm}
        colon={false}
        requiredMark={false}
        onFinish={handleOnFinish}
        onValuesChange={() => {
          setTimeout(() => {
            setToolCache(toolForm.getFieldsValue() as TaskToolConfig);
          }, 0);
        }}
        initialValues={
          toolFromCache ||
          taskInfo?.tool_config || {
            conversation: {
              questions: [],
            },
            question: {
              questions: [],
            },
            message: {
              questions: [],
              is_sortable: false,
              is_sn_unique: false,
            },
            plugins: {
              content: {
                translator_enabled: false,
                google_translator_enabled: false,
                grammar_checking_enabled: false,
              },
              conversation: {
                translator_enabled: false,
                google_translator_enabled: false,
                grammar_checking_enabled: false,
                message_send_diff: false,
              },
            },
            layout: {
              grid: 1,
            },
          }
        }
      >
        <div className="flex items-center mb-4 w-full justify-between">
          <h3 className="mb-0">标注配置</h3>
          <ToolConfigUpload onFinish={handleImport}>
            <Button className="!py-0 !px-0" type="link" disabled={toolsDisabled}>
              上传 JSON 配置
            </Button>
          </ToolConfigUpload>
        </div>
        <Card className="mb-4">
          <h4 className="mb-4">
            针对整段内容/对话
            <Popover placement="bottom" content={<img width={752} src={demoConversation} />}>
              <QuestionCircleOutlined className="ml-2 text-[var(--color-text-tertiary)] cursor-help" />
            </Popover>
          </h4>
          <FancyGroup disabled={toolsDisabled} group={conversationFormTemplate} name="conversation" />
        </Card>
        <Card className="mb-4">
          <h4 className="mb-4">
            针对对话里的每条回复
            <Popover placement="bottom" content={<img width={752} src={demoReply} />}>
              <QuestionCircleOutlined className="ml-2 text-[var(--color-text-tertiary)] cursor-help" />
            </Popover>
          </h4>
          <FancyGroup disabled={toolsDisabled} group={messageFormTemplate} name="message" />
        </Card>
        <Card className="mb-4">
          <h4 className="mb-4">
            针对对话里的每个提问
            <Popover placement="bottom" content={<img width={752} src={demoQuestion} />}>
              <QuestionCircleOutlined className="ml-2 text-[var(--color-text-tertiary)] cursor-help" />
            </Popover>
          </h4>
          <FancyGroup disabled={toolsDisabled} group={conversationFormTemplate} name="question" />
        </Card>
        <Collapse className="mb-6" ghost items={items} expandIconPosition="end" />
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
