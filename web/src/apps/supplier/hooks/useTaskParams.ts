import { useParams } from 'react-router-dom';
import useUrlState from '@ahooksjs/use-url-state';

import { ERouterTaskType } from '@/apps/supplier/constant/task';
import type { ERecordStatus } from '@/apps/supplier/services/task';

/**
 * type 当前任务类型
 * isAudit 是否是审核任务
 * taskId 任务id
 * isPreview 是否是预览任务
 * flow_index 审核任务的流程index
 * */

export enum EQueryQuestionType {
  all = 'all',
  problem = 'problem',
  customize = 'customize',
}
// 源题组合展示  默认不传 单题模式
export enum EKind {
  with_duplicate = 'with_duplicate',
}

interface IQuery {
  user_id?: string;
  // 全部题目 未达标的题录
  record_status?: ERecordStatus;
  // 审核任务的流程index
  flow_index?: string;
  // 是否是搜索
  is_search?: string;
  data_id?: string; // 题目 id
  questionnaire_id?: string; // 问卷 id
  // 题目类型 包含 全部题目 仅看标为有问题 自定义题目范围
  question_type?: EQueryQuestionType;
  kind?: EKind; // 源题组合展示  默认不传 单题模式
}

// 预览任务 https://labelu-llm-dev.shlab.tech/supplier/preview/beebc1fa-9b7f-406a-b498-194dab40d673;
// 查看题目 https://labelu-llm-dev.shlab.tech/supplier/review/beebc1fa-9b7f-406a-b498-194dab40d673;
// 查看标注员标注任务 https://labelu-llm-dev.shlab.tech/supplier/review_task/beebc1fa-9b7f-406a-b498-194dab40d673?user_id=1011;
// 查看标注员审核任务 https://labelu-llm-dev.shlab.tech/supplier/review_audit/beebc1fa-9b7f-406a-b498-194dab40d673?user_id=1101;

export const useTaskParams = () => {
  const params = useParams<{ type: ERouterTaskType; id: string }>();
  const [urlState, setUrlState] = useUrlState<IQuery>({
    flow_index: undefined,
    user_id: undefined,
    record_status: undefined,
    is_search: undefined,
    data_id: undefined,
    question_type: undefined,
  });

  const type = params.type || ERouterTaskType.task;

  return {
    type,
    taskId: params.id,
    isAudit: [ERouterTaskType.audit, ERouterTaskType.reviewAudit].includes(type),
    isPreview: [
      ERouterTaskType.preview,
      ERouterTaskType.review,
      ERouterTaskType.reviewTask,
      ERouterTaskType.reviewAudit,
    ].includes(type),
    flow_index: urlState.flow_index,
    urlState,
    setUrlState,
  } as const;
};
