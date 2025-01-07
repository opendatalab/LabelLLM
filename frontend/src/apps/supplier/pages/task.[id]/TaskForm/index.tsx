import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ModalForm, ProForm, ProFormCheckbox, ProFormRadio } from '@ant-design/pro-components';
import { Button, Form, Tag, Tooltip } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

import AuditInfo from '@/apps/supplier/pages/task.[id]/AuditInfo';
import CheckTaskType from '@/apps/supplier/pages/task.[id]/CheckTaskType';
import { message } from '@/components/StaticAnt';
import ChatBox from '@/apps/supplier/pages/task.[id]/ChatBox';
import Answer from '@/apps/supplier/pages/task.[id]/Answer';
import Countdown from '@/apps/supplier/pages/task.[id]/Countdown';
import type { IAnswer, ILabelData, ITaskRes } from '@/apps/supplier/services/task';
import { EMessageType, submitLabelData, rejectLabelTask, ELabelStatus } from '@/apps/supplier/services/task';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';

import { DatasetsDetailContext, useDatasetsContext } from '../context';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useActiveKey } from '@/apps/supplier/hooks/useTaskData';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalStorageState } from 'ahooks';
import Help from '@/components/Help';

const statusMap = {
  [ELabelStatus.pending]: '待标注',
  [ELabelStatus.processing]: '标注中',
  [ELabelStatus.completed]: '已完成',
  [ELabelStatus.discarded]: '标注完成(未达标)',
};

// 打回重做
function ReAudit({ questionDetail }: { questionDetail: ILabelData }) {
  const [form] = Form.useForm<{ is_data_recreate: boolean }>();
  const { taskId, urlState, setUrlState } = useTaskParams();
  const { activeKey } = useActiveKey('question_key');
  const queryClient = useQueryClient();

  const onFinish = async (values: { is_data_recreate: boolean }) => {
    await rejectLabelTask({
      task_id: taskId!,
      user_id: [questionDetail.label_user!.user_id!],
      data_id: questionDetail.data_id!,
      is_data_recreate: values.is_data_recreate,
    });
    if (urlState.data_id) {
      setUrlState({ data_id: undefined });
    } else {
      queryClient.setQueryData(activeKey, (old: any) => {
        return {
          ...old,
          status: ELabelStatus.discarded,
        };
      });
    }
    message.success('提交成功');
    return true;
  };
  return (
    <ModalForm<{
      is_data_recreate: boolean;
    }>
      disabled={false}
      form={form} // 确保使用自己的 form 实例
      title={
        <>
          <ExclamationCircleOutlined className="text-warning mr-2" />
          打回重做
        </>
      }
      trigger={
        <Button size="small" type="primary" disabled={false}>
          打回重做
        </Button>
      }
      width={500}
      autoFocusFirstInput
      modalProps={{
        centered: true,
        destroyOnClose: true,
        onCancel: () => console.log('run'),
      }}
      onFinish={onFinish}
    >
      <div className="my-4">是否确定打回？打回后题目将自动被标为未达标</div>
      <ProFormRadio.Group
        rules={[{ required: true, message: '请选择打回设置' }]}
        name="is_data_recreate"
        label="打回设置"
        options={[
          { label: '仅打回', value: false },
          { label: '打回，同时生成新题', value: true },
        ]}
      />
    </ModalForm>
  );
}

interface IProps extends HTMLAttributes<HTMLDivElement> {
  formRef: React.MutableRefObject<ProFormInstance | undefined>;
  loading?: boolean;
  questionDetail?: ILabelData;
  taskDetail?: ITaskRes;
  showModalInfo?: (content: string) => void;
  skipQuestionHandle?: (isQuit?: boolean) => void;
  onChangeTheQuestion?: (t: string) => void;
}

const TaskForm: React.FC<PropsWithChildren<IProps>> = ({
  formRef,
  loading,
  taskDetail,
  questionDetail,
  showModalInfo,
  skipQuestionHandle,
  onChangeTheQuestion,
}) => {
  const { formatMessage } = useIntl();
  const parentContext = useDatasetsContext();

  const navigate = useNavigate();

  const { taskId, urlState, setUrlState } = useTaskParams();

  const [sortOptions, setSortOptions] = useState<any[]>([]);

  const { type } = useTaskParams();

  const [storageLabelData, setStorageLabelData] = useLocalStorageState<IAnswer | undefined>(
    'use-local-storage-label-data',
  );

  const { mutateAsync: submit, isPending: isLoading } = useMutation({
    mutationFn: submitLabelData,
    onSuccess: () => {
      onChangeTheQuestion?.('submit');
    },
    onError: () => {
      navigate(`/${type}`);
    },
  });

  // 获取所有机器人消息
  const getQuestionRobotMessages = () => {
    return questionDetail?.conversation?.filter((item) => item.message_type === EMessageType.receive);
  };

  // 设置的 Select disabled 值
  const setSortOptionsHandle = () => {
    const reply = taskDetail?.label_tool_config?.message;
    if (reply?.is_sortable && !reply?.is_sn_unique) {
      return;
    }
    const sortValues: any[] = [];
    getQuestionRobotMessages()?.forEach((item) => {
      const sort = formRef?.current?.getFieldValue(['message_evaluation', item.message_id, 'sort']);
      if (sort) {
        sortValues.push(sort);
      }
    });
    setSortOptions(
      sortOptions.map((item) => ({
        ...item,
        disabled: sortValues.includes(item.value),
      })),
    );
  };

  useEffect(() => {
    // 本地存储有值，则设置表单值 本地存储的值权重大于预加载的值
    if (storageLabelData) {
      formRef.current?.setFieldsValue(storageLabelData);
      return;
    }
    const isEvaluation = Object.values(questionDetail?.evaluation || {}).some((item) => !!item);
    const labelData = isEvaluation ? questionDetail?.evaluation : questionDetail?.reference_evaluation;
    if (labelData) {
      formRef.current?.setFieldsValue(labelData);
      return;
    }
  }, [questionDetail, formRef, type, storageLabelData]);

  const CountdownComponent = () => {
    return (
      <div className="flex items-center rounded-md mt-4">
        <div className="mr-4">
          <ProFormCheckbox noStyle name={['questionnaire_evaluation', 'is_invalid_questionnaire']}>
            <FormattedMessage id="task.detail.problematical" />
          </ProFormCheckbox>
        </div>
        {questionDetail?.remain_time && (
          <CheckTaskType types={[ERouterTaskType.task]}>
            <Countdown
              whetherTimeout={() => {
                setStorageLabelData(undefined);
                showModalInfo?.(formatMessage({ id: 'task.detail.timeout.desc' }));
              }}
              remain_time={questionDetail?.remain_time || 0}
            />
          </CheckTaskType>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (questionDetail) {
      const robotsLen = getQuestionRobotMessages()?.length;

      if (robotsLen) {
        setSortOptions(
          Array.from({ length: robotsLen }, (v, k) => ({
            value: k + 1,
            label: k + 1,
            disabled: false,
          })),
        );
      }
    }
  }, [questionDetail]);

  const onSubmit = async () => {
    const data = formRef?.current?.getFieldsValue() as IAnswer;
    if (data?.questionnaire_evaluation?.is_invalid_questionnaire) {
      await submit({
        questionnaire_evaluation: data?.questionnaire_evaluation,
        data_id: questionDetail?.data_id as string,
      });
      setStorageLabelData(undefined);
      return;
    }
    formRef?.current?.validateFields().then(
      () => {
        setStorageLabelData(undefined);
        submit({ ...data, data_id: questionDetail?.data_id as string });
      },
      () => {
        message.error(formatMessage({ id: 'task.detail.error.required' }));
      },
    );
  };

  const saveHandle = () => {
    const data = formRef?.current?.getFieldsValue() as IAnswer;
    setStorageLabelData(data);
    message.success(formatMessage({ id: 'common.save.success' }));
  };

  return (
    <DatasetsDetailContext.Provider value={{ sortOptions, setSortOptionsHandle, ...parentContext }}>
      <div className="relative">
        <ProForm
          disabled={[ERouterTaskType.reviewTask, ERouterTaskType.review].includes(type)}
          formRef={formRef}
          name="validateOnly"
          validateTrigger={false}
          autoFocusFirstInput={false}
          validateMessages={{
            required: '',
          }}
          submitter={{
            render: (_) => {
              return (
                <CheckTaskType types={[ERouterTaskType.task]}>
                  <div className="mt-6 mb-4">
                    <Button
                      // disabled={!disabled}
                      loading={isLoading}
                      className="btn-primary-disabled mr-4"
                      type="primary"
                      onClick={onSubmit}
                    >
                      <FormattedMessage id="task.detail.submit" />
                    </Button>
                    <Button
                      loading={loading}
                      className="mr-4"
                      onClick={() => {
                        setStorageLabelData(undefined);
                        skipQuestionHandle?.();
                      }}
                    >
                      <FormattedMessage id="task.detail.skip" />
                    </Button>
                    <Button loading={loading} type="text" onClick={() => saveHandle?.()}>
                      <FormattedMessage id="common.save" />
                      <Help className="">{formatMessage({ id: 'task.detail.save.desc' })}</Help>
                    </Button>
                    <Tooltip title={formatMessage({ id: 'task.detail.cancel.desc' })}>
                      <Button
                        className="mr-4"
                        type="text"
                        onClick={() => {
                          setStorageLabelData(undefined);
                          skipQuestionHandle?.(true);
                        }}
                      >
                        <FormattedMessage id="task.detail.cancel" />
                      </Button>
                    </Tooltip>
                  </div>
                </CheckTaskType>
              );
            },
          }}
          // onFinish={async (values: any) => {
          //   console.log(values);
          //   return;
          //   await submit(values as any);
          //   message.success('提交成功');
          //   return true;
          // }}
        >
          <div className="min-h-[100px] task-wrap">
            <ChatBox
              id="chat-box-wrap"
              prompt={questionDetail?.prompt}
              messages={questionDetail?.conversation || []}
              grid={taskDetail?.label_tool_config?.layout?.grid || 1}
              messageQuestion={taskDetail?.label_tool_config?.message}
              userQuestions={taskDetail?.label_tool_config?.question?.questions}
            />
            <CheckTaskType types={[ERouterTaskType.review, ERouterTaskType.reviewTask]}>
              {!!taskDetail?.label_tool_config?.conversation?.questions?.length && (
                <div className="mt-4 font-bold text-base mb-2">
                  <FormattedMessage id="task.detail.label.result" />
                </div>
              )}
            </CheckTaskType>
            <Answer
              name="conversation_evaluation"
              conversation={taskDetail?.label_tool_config?.conversation?.questions}
            />

            <div className="flex justify-between items-end">
              <CountdownComponent />
              <div className="flex items-center space-x-2">
                <CheckTaskType
                  types={[
                    ERouterTaskType.task,
                    ERouterTaskType.review,
                    ERouterTaskType.reviewTask,
                    ERouterTaskType.preview,
                  ]}
                >
                  <AuditInfo
                    dataId={questionDetail?.data_id}
                    label_user={questionDetail?.label_user}
                    questionnaire_id={questionDetail?.questionnaire_id}
                  />
                </CheckTaskType>
                {/* 管理端跳转过来显示 */}
                {urlState.inlet === 'operator' && questionDetail && (
                  <CheckTaskType types={[ERouterTaskType.review, ERouterTaskType.reviewTask]}>
                    {questionDetail?.status && (
                      <Tag bordered={false} color="processing">
                        {statusMap[questionDetail?.status]}
                      </Tag>
                    )}
                    {questionDetail?.status === ELabelStatus.completed && <ReAudit questionDetail={questionDetail} />}
                  </CheckTaskType>
                )}
              </div>
            </div>
          </div>
        </ProForm>
      </div>
    </DatasetsDetailContext.Provider>
  );
};

export default TaskForm;
