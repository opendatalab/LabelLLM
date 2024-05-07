import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { ERouterTaskType } from '@/apps/supplier/constant/task';
import {
  getAuditData,
  getAuditDataByUserId,
  getAuditTaskDetail,
  getLabelData,
  getLabelDataByUserId,
  getPreviewAuditDetail,
  getPreviewData,
  getPreviewTaskDetail,
  getTaskDetail,
  releaseAuditData,
  releaseLabelData,
} from '@/apps/supplier/services/task';
import { auditQuestionKey, auditTaskKey, questionKey, taskKey } from '@/apps/supplier/constant/query-key-factories';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { message } from '@/components/StaticAnt';
import { EPlugin } from '@/apps/supplier/pages/task.[id]/pluginSet';

export const apiMap = {
  [ERouterTaskType.task]: { getLabelData, getTaskDetail, releaseLabelData, taskKey: taskKey, questionKey: questionKey },
  [ERouterTaskType.audit]: {
    getTaskDetail: getAuditTaskDetail,
    getLabelData: getAuditData,
    releaseLabelData: releaseAuditData,
    taskKey: auditTaskKey,
    questionKey: auditQuestionKey,
  },
  [ERouterTaskType.preview]: {
    getTaskDetail: getPreviewTaskDetail,
    getLabelData: getPreviewData,
    releaseLabelData,
    taskKey: taskKey,
    questionKey: questionKey,
  },
  [ERouterTaskType.review]: {
    getTaskDetail: getPreviewTaskDetail,
    getLabelData: getPreviewData,
    releaseLabelData,
    taskKey: taskKey,
    questionKey: questionKey,
  },
  [ERouterTaskType.reviewTask]: {
    getTaskDetail: getPreviewTaskDetail,
    getLabelData: getLabelDataByUserId,
    releaseLabelData,
    taskKey: taskKey,
    questionKey: questionKey,
  },
  [ERouterTaskType.reviewAudit]: {
    getTaskDetail: getPreviewAuditDetail,
    getLabelData: getAuditDataByUserId,
    releaseLabelData,
    taskKey: taskKey,
    questionKey: questionKey,
  },
};

const messageMap: Record<string, string> = {
  submit: '提交成功',
  skip: '跳过',
  next: '变更成功',
  default: '',
};

// 获取任务详情
export const useTaskDetail = ({ setPlugins }: { setPlugins: (data: EPlugin[]) => void }) => {
  const { type, taskId } = useTaskParams();
  const api = apiMap[type];
  const query = useQuery({
    queryKey: api.taskKey.detail(taskId as string),
    queryFn: async () => api.getTaskDetail({ task_id: taskId as string }),
  });
  useEffect(() => {
    if (query.isSuccess) {
      const plugins = query.data.label_tool_config?.plugins;
      setPlugins(
        [
          plugins?.content?.translator_enabled && EPlugin.promptTranslate,
          plugins?.conversation?.translator_enabled && EPlugin.messagesTranslate,
          plugins?.content?.google_translator_enabled && EPlugin.promptGoogleTranslate,
          plugins?.conversation?.google_translator_enabled && EPlugin.googleMessagesTranslate,
          plugins?.content?.grammar_checking_enabled && EPlugin.promptGrammarCheck,
          plugins?.conversation?.grammar_checking_enabled && EPlugin.messagesGrammarCheck,
          plugins?.conversation?.message_send_diff && EPlugin.messagesSendDiff,
        ].filter(Boolean) as EPlugin[],
      );
    }
  }, [query.data, query.isSuccess, setPlugins]);
  return query;
};

// 获取任务问题
export const useTaskQuestion = ({ messageRef }: { messageRef: any }) => {
  const navigate = useNavigate();
  const { type, taskId, flow_index, urlState } = useTaskParams();

  const isView = [
    ERouterTaskType.preview,
    ERouterTaskType.review,
    ERouterTaskType.reviewTask,
    ERouterTaskType.reviewAudit,
  ].includes(type);

  const sendData = {
    task_id: taskId as string,
    flow_index,
    data_id: urlState?.data_id,
    questionnaire_id: urlState?.questionnaire_id,
    record_status: urlState?.record_status,
    user_id: urlState?.user_id,
  };

  const api = apiMap[type];
  const query = useQuery({
    queryKey: api.questionKey.detail(sendData),
    queryFn: async () => api.getLabelData(sendData),
  });

  useEffect(() => {
    if (query.isError) {
      if (isView) {
        message.error('没有找到相关内容');
        return;
      }
      return navigate(`/${type}`);
    }
    if (query.isSuccess) {
      const t = messageMap[messageRef.current || 'default'];
      if (messageRef.current && t) {
        message.success(t);
      }
    }
    messageRef.current = '';
  }, [query, isView, messageRef, navigate, type]);
  return query;
};

// 跳过题目
export const useSkipQuestion = () => {
  const navigate = useNavigate();
  const { type } = useTaskParams();
  const api = apiMap[type];
  return useMutation({
    mutationFn: api.releaseLabelData,
    onError: () => {
      navigate(`/${type}`);
    },
  });
};
