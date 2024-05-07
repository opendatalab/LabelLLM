import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useRef, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useKeyPressEvent } from 'react-use';

import Answer from '@/apps/supplier/pages/task.[id]/answer';
import type { IAuditAnswer, ILabelData, ITaskRes } from '@/apps/supplier/services/task';
import { submitAuditData } from '@/apps/supplier/services/task';
import Countdown from '@/apps/supplier/pages/task.[id]/countdown';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { message } from '@/components/StaticAnt';
import AuditInfo from '@/apps/supplier/pages/task.[id]/audit-info';
import CheckTaskType from '@/apps/supplier/pages/task.[id]/check-task-type';
import { ERouterTaskType } from '@/apps/supplier/constant/task';

type IProps = HTMLAttributes<HTMLDivElement> & {
  loading?: boolean;
  taskDetail?: ITaskRes;
  questionDetail?: ILabelData;
  showModalInfo?: (content: string) => void;
  skipQuestionHandle?: (isQuit?: boolean) => void;
  onChangeTheQuestion?: (t: string) => void;
};

const isPassMap = {
  Digit1: 'yes',
  Digit2: 'no',
} as Record<string, string>;

const AuditForm: React.FC<PropsWithChildren<IProps>> = ({
  loading,
  taskDetail,
  questionDetail,
  showModalInfo,
  skipQuestionHandle,
  onChangeTheQuestion,
}) => {
  const navigate = useNavigate();

  const { flow_index, type } = useTaskParams();

  const auditFrom = useRef<ProFormInstance<IAuditAnswer>>();

  const { mutateAsync, isPending: isLoading } = useMutation({
    mutationFn: submitAuditData,
    onSuccess: () => {
      onChangeTheQuestion?.('submit');
    },
    onError: () => {
      navigate(`/${type}`);
    },
  });

  const onSubmit = async () => {
    const data = auditFrom?.current?.getFieldsValue() as IAuditAnswer;
    const { data_evaluation = { is_pass: false } } = data || {};
    auditFrom?.current?.validateFields().then(
      () => {
        mutateAsync({
          data_id: questionDetail?.data_id as string,
          flow_index: flow_index as string,
          is_pass: data_evaluation?.is_pass,
          data_evaluation,
        });
      },
      () => {
        message.error('有必填项未填写');
      },
    );
  };
  useEffect(() => {
    if (questionDetail?.evaluation?.data_evaluation) {
      auditFrom?.current?.setFieldsValue({ data_evaluation: questionDetail?.evaluation?.data_evaluation });
    }
  }, [questionDetail?.evaluation?.data_evaluation, auditFrom]);

  useKeyPressEvent(
    (e) => {
      // 检查是否同时按下了 'Alt' 键 和 '1' 键 或 'Alt' 键 和 '2' 键
      return (e.altKey && e.code === 'Digit1') || (e.altKey && e.code === 'Digit2');
    },
    (e) => {
      if (![ERouterTaskType.reviewAudit].includes(type)) {
        auditFrom?.current?.setFieldValue(['data_evaluation', 'is_pass'], isPassMap[e.code]);
      }
    },
  );

  return (
    <div className="w-[380px] border-box p-6 shrink-0 border-0 border-l border-solid border-borderSecondary h-full flex flex-col overflow-y-auto hidden-scrollbar">
      <div className="font-bold text-base mb-4">对左侧作答进行评判</div>
      <ProForm<IAuditAnswer>
        name="audit"
        disabled={[ERouterTaskType.reviewAudit].includes(type)}
        formRef={auditFrom}
        validateTrigger={false}
        autoFocusFirstInput={false}
        validateMessages={{
          required: '',
        }}
        submitter={{
          render: (_) => {
            return (
              <>
                <CheckTaskType types={[ERouterTaskType.audit]}>
                  <div className="mb-6 flex justify-between">
                    {questionDetail?.remain_time && (
                      <Countdown
                        whetherTimeout={() =>
                          showModalInfo?.('当前题目超时未完成，已自动回收。请认领其他题目继续答题～')
                        }
                        remain_time={questionDetail?.remain_time || 0}
                      />
                    )}
                    <AuditInfo dataId={questionDetail?.data_id} label_user={questionDetail?.label_user} />
                  </div>

                  <div>
                    <Button loading={isLoading} className="btn-primary-disabled" type="primary" onClick={onSubmit}>
                      提交
                    </Button>
                    <Button onClick={() => skipQuestionHandle?.()} loading={loading} className="mx-4">
                      跳过
                    </Button>
                    <Tooltip title="直接退出，当前输入的内容将不做保持">
                      <Button onClick={() => skipQuestionHandle?.(true)} loading={loading} className="mr-4" type="text">
                        退出
                      </Button>
                    </Tooltip>
                  </div>
                </CheckTaskType>
                <CheckTaskType types={[ERouterTaskType.reviewAudit]}>
                  <AuditInfo dataId={questionDetail?.data_id} label_user={questionDetail?.label_user} />
                </CheckTaskType>
              </>
            );
          },
        }}
      >
        <Answer
          className="!bg-white !pt-2 px-0 !mt-0 !pb-4"
          name="data_evaluation"
          conversation={taskDetail?.audit_tool_config?.conversation?.questions}
        />
      </ProForm>
    </div>
  );
};

export default AuditForm;
