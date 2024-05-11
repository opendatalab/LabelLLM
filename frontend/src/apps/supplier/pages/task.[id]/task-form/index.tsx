import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm, ProFormCheckbox } from '@ant-design/pro-components';
import { Button, Tooltip } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

import AuditInfo from '@/apps/supplier/pages/task.[id]/audit-info';
import CheckTaskType from '@/apps/supplier/pages/task.[id]/check-task-type';
import { message } from '@/components/StaticAnt';
import ChatBox from '@/apps/supplier/pages/task.[id]/chat-box';
import Answer from '@/apps/supplier/pages/task.[id]/answer';
import Countdown from '@/apps/supplier/pages/task.[id]/countdown';
import type { IAnswer, ILabelData, ITaskRes } from '@/apps/supplier/services/task';
import { EMessageType, submitLabelData } from '@/apps/supplier/services/task';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';

import { DatasetsDetailContext, useDatasetsContext } from '../context';

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
  const parentContext = useDatasetsContext();

  const navigate = useNavigate();

  const [sortOptions, setSortOptions] = useState<any[]>([]);

  const { type } = useTaskParams();

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
    // 预览模式不需要设置表单值
    // if (type === ERouterTaskType.preview) return;
    const isEvaluation = Object.values(questionDetail?.evaluation || {}).some((item) => !!item);
    const labelData = isEvaluation ? questionDetail?.evaluation : questionDetail?.reference_evaluation;
    if (labelData) {
      formRef.current?.setFieldsValue(labelData);
    }
  }, [questionDetail, formRef, type]);

  const CountdownComponent = () => {
    return (
      <div className="flex items-center rounded-md mt-4">
        <div className="mr-4">
          <ProFormCheckbox noStyle name={['questionnaire_evaluation', 'is_invalid_questionnaire']}>
            此题存在问题，无法作答
          </ProFormCheckbox>
        </div>
        {questionDetail?.remain_time && (
          <CheckTaskType types={[ERouterTaskType.task]}>
            <Countdown
              whetherTimeout={() => showModalInfo?.('当前题目超时未完成，已自动回收。请认领其他题目继续答题～')}
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
      return;
    }
    formRef?.current?.validateFields().then(
      () => {
        submit({ ...data, data_id: questionDetail?.data_id as string });
      },
      () => {
        message.error('有必填项未填写');
      },
    );
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
                      data-wiz="task-submit"
                    >
                      提交
                    </Button>
                    <Button
                      loading={loading}
                      className="mr-4"
                      onClick={() => skipQuestionHandle?.()}
                      data-wiz="task-skip"
                    >
                      跳过
                    </Button>
                    <Tooltip title="直接退出，当前输入的内容将不做保持">
                      <Button
                        className="mr-4"
                        type="text"
                        onClick={() => skipQuestionHandle?.(true)}
                        data-wiz="task-exit"
                      >
                        退出
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
                <div className="mt-4 font-bold text-base mb-2">标注结果</div>
              )}
            </CheckTaskType>
            <Answer
              name="conversation_evaluation"
              conversation={taskDetail?.label_tool_config?.conversation?.questions}
            />

            <div className="flex justify-between items-end">
              <CountdownComponent />
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
            </div>
          </div>
        </ProForm>
      </div>
    </DatasetsDetailContext.Provider>
  );
};

export default TaskForm;
