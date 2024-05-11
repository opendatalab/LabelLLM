import type { ProFormInstance } from '@ant-design/pro-components';
import { Spin } from 'antd';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';

import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { message, modal } from '@/components/StaticAnt';
import QuestionnaireSelect from '@/apps/supplier/pages/task.[id]/questionnaire-select';

import { ERouterTaskType } from '../../constant/task';
import { useSkipQuestion, useTaskDetail, useTaskQuestion } from '../../hooks/useTaskData';
import CheckTaskType from './check-task-type';
import { DatasetsDetailContext } from './context';
import DiffModal from './diff-modal';
import Header from './header';
import { EPlugin } from './pluginSet';
import TaskForm from './task-form';

import './index.css';

type IProps = HTMLAttributes<HTMLDivElement>;

/**
 * 任务, 审核任务, 预览
 * 页面逻辑基本保持一致，只是数据来源不同
 * 通过路由参数来区分
 * 审核对比任务 多了一个侧边栏 有自己的提交操作逻辑 一些样式调整
 * 预览对比任务 去掉了 提交等操作按钮 多了个 换一题按钮
 * */

const TaskDetail: React.FC<PropsWithChildren<IProps>> = () => {
  const navigate = useNavigate();
  const formRef = useRef<ProFormInstance>();
  const { type, flow_index } = useTaskParams();
  const messageRef = useRef<string>();

  const [plugins, setPlugins] = useState<EPlugin[]>([]);

  const showModalInfo = (content: string) => {
    modal.info({
      title: '温馨提示',
      centered: true,
      okText: '确定',
      onOk: () => navigate(`/${type}`),
      content: content,
    });
  };

  // 获取任务详情
  const { data: taskDetail, isLoading: taskLoading } = useTaskDetail({
    setPlugins,
  });

  const {
    data: questionDetail,
    isFetching: questionLoading,
    refetch,
  } = useTaskQuestion({
    messageRef,
  });

  const { mutateAsync: releaseLabelDataMutate, isPending: skipLoading } = useSkipQuestion();

  const onChangeTheQuestion = async (t: string) => {
    messageRef.current = t;
    window.scrollTo(0, 0);
    document.getElementById('chat-box-wrap')?.scrollTo(0, 0);
    document.getElementById('task-content')?.scrollTo(0, 0);
    await refetch?.();
  };

  // 跳过题目
  const skipQuestionHandle = async (isQuit?: boolean) => {
    try {
      await releaseLabelDataMutate({ data_id: questionDetail?.data_id as string });
      messageRef.current = '';
      if (!isQuit) {
        onChangeTheQuestion('skip');
        return;
      }
    } catch (e) {
      if (!isQuit) {
        message.error('此任务已无更多题目了，请换个任务吧');
      }
    }
    navigate(`/${type}`);
  };

  return (
    <Spin spinning={taskLoading || questionLoading}>
      <DatasetsDetailContext.Provider
        value={{
          plugins,
          setPlugins,
          pluginConfig: taskDetail?.label_tool_config?.plugins,
          data_id: questionDetail?.data_id,
        }}
      >
        <div className="flex flex-col h-screen chat-task">
          <Header title={taskDetail?.title || ''} loading={questionLoading} onChangeTheQuestion={onChangeTheQuestion} />
          {plugins.includes(EPlugin.messagesSendDiff) && !!questionDetail?.conversation?.length && (
            <DiffModal conversation={questionDetail?.conversation} />
          )}
          <div className="flex-1 min-h-0 flex">
            <div
              className="px-8 py-6 box-border flex-1 min-w-0 min-h-0 max-h-full overflow-y-auto hidden-scrollbar"
              id="task-content"
            >
              <div className="flex items-end justify-between mb-2">
                <CheckTaskType types={[ERouterTaskType.review]}>
                  <div className="shrink-0">
                    <QuestionnaireSelect
                      questionnaire_id={questionDetail?.questionnaire_id}
                      data_id={questionDetail?.data_id}
                    />
                  </div>
                </CheckTaskType>
              </div>

              <Helmet>
                <title>{taskDetail?.title || ''}</title>
              </Helmet>
              <TaskForm
                loading={skipLoading || questionLoading}
                key={questionDetail?.data_id}
                formRef={formRef}
                taskDetail={taskDetail}
                questionDetail={questionDetail}
                onChangeTheQuestion={onChangeTheQuestion}
                skipQuestionHandle={skipQuestionHandle}
                showModalInfo={showModalInfo}
              />
            </div>
          </div>
        </div>
      </DatasetsDetailContext.Provider>
    </Spin>
  );
};

export default TaskDetail;
