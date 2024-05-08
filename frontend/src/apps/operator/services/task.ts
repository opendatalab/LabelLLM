import request from '@/api/request';
import type { ConditionItem } from '@/apps/supplier/services/task';

import type { ListPayload } from './types';
import downloadFromUrl from '../utils/downloadFromUrl';

export interface TaskQueryBody {
  title?: string; // 任务标题
  status?: string; // 任务状态
  page?: number; // 页码
  page_size?: number; // 每页数量
  sort?: string; // 排序
  creator_id?: string | string[] | null; // 创建人
  order?: string; // 排序方式
}

export enum TaskStatus {
  Created = 'created', // 待开始
  Open = 'open', // 进行中
  Done = 'done', // 已结束
}

export const TaskStatusMapping = {
  [TaskStatus.Created]: '待开始',
  [TaskStatus.Open]: '进行中',
  [TaskStatus.Done]: '已结束',
};

export interface TeamWithName {
  /** Team Id 团队 id */
  team_id: string;
  /** Name 团队名称 */
  name: string;
}

export interface ConversationConfig {
  /** Questions 问题列表 */
  questions: Question[];
}

export interface MessageConfig {
  /** Questions 问题列表 */
  questions: Question[];
  /** Is Sortable 是否对所有回复排序 */
  is_sortable: boolean;
  /** Is Sn Unique 序号是否可重复，默认不可重复 */
  is_sn_unique?: boolean;
}

export interface PluginConfig {
  message_send_diff?: boolean;
}

export interface TaskToolConfig {
  /** Conversation 针对整个对话的配置 */
  conversation: ConversationConfig;
  /** Message 针对每条回复的配置 */
  message: MessageConfig;
  /** Message 针对每个提问的配置 */
  question: ConversationConfig;
  plugins: {
    content: PluginConfig;
    conversation: PluginConfig;
  };
}

export interface QuestionOption {
  /** 选项内容 */
  label: string;
  /** 选项的值 */
  value: string;
  /** 选项的 id，添加和删除题目选项时的唯一标示 */
  id: string;
  /** 是否默认选中 */
  is_default?: boolean;
}

export interface Question {
  id: string;
  /** string 为填空题，enum 为单选题，array 为多选题 */
  type: 'string' | 'enum' | 'array';
  /** 题目内容 */
  label: string;
  /** 题目的值 */
  value: string;
  /** 题目的选项，当type为string是可为空 */
  options?: QuestionOption[];
  /** 填空的最大长度， */
  max_length?: number;
  /** 填空的默认值 */
  default_value?: string;
  /** 当 type 为 string时，是否预览默认展开 */
  is_preview_expanded?: boolean;
  /** 当 type 为 string时，是否可上传附件 */
  is_upload_available?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 题目可见性条件，有条件存在时，默认不可见，当条件满足时才可见 */
  conditions?: ConditionItem[];
}

export interface TaskConfig {
  /** Expire Time 过期时间/秒 */
  expire_time?: number;
  /** Distribute Num 分发数量 */
  distribute_num?: number;
  /** Base Questions 基础问题 */
  conversation?: Question[];
  /** Message Questions 消息问题 */
  message?: Question[];
}

export interface LabelTaskProgress {
  /** Completed 已完成题数 */
  completed: number;
  /** Total 总题数 */
  total: number;
  /** Pending 待标注题数 */
  pending: number;
  /** Labeling 标注中题数 */
  labeling: number;
  /** Labeled 标注完成题数 */
  labeled: number;
  /** Label Time 标注时长/秒 */
  label_time?: number;
  /** Discarded 未达标数 */
  discarded?: number;
}

export interface OperatorTask {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** 任务状态 */
  status: TaskStatus;
  /** Created Time 创建时间/秒 */
  created_time: number;
  /** Creator 创建人 */
  creator: string;
  /** Completed Count 已完成数据量 */
  completed_count: number;
  total_count: number;
  progress: LabelTaskProgress;
}

export interface Team {
  team_id: string;
  name: string;
}

export interface OperatorTaskDetail {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** Description 任务描述 */
  description: string;
  /** 任务状态 */
  status: TaskStatus;
  /** Created Time 创建时间/秒 */
  created_time: number;
  /** Creator 创建人 */
  creator: string;
  /** Distribute Count 分发数量 */
  distribute_count: number;
  /** Tool Config 工具配置 */
  tool_config: TaskToolConfig;
  /** Expire Time 过期时间/秒 */
  expire_time: number;
  /** Teams 执行团队 */
  teams: Team[];
  /** Progress 任务进度 */
  progress: LabelTaskProgress;
  /** Audit Tasks 配置的审核任务们 */
  audit_tasks: AuditTargetTask[];
}

export interface OperatorTaskCreatePayload {
  /** Title 任务标题 */
  title: string;
  /** Description 任务描述 */
  description: string;
  /** Distribute Count 分发数量 */
  distribute_count: number;
  /** Tool Config 工具配置 */
  tool_config: TaskToolConfig;
}

/**
 * 创建标注任务
 */
export const createLabelTask = (
  body: OperatorTaskCreatePayload,
): Promise<{
  task_id: string;
}> => {
  return request.post('/v1/operator/task/label/create', body);
};

/**
 * 获取标注任务列表
 */
export const getLabelTaskList = (body: TaskQueryBody): Promise<ListPayload<OperatorTask>> => {
  return request.post('/v1/operator/task/label/list', body);
};

/**
 * 清空标注任务的数据
 */
export const clearLabelTaskData = (body: { task_id: string }): Promise<any> => {
  return request.post('/v1/operator/task/label/data/clear', body);
};

export interface TaskDetailBody {
  task_id: string;
}

/**
 * 获取标注任务详情
 */
export const getLabelTaskDetail = (
  params: Record<string, unknown>,
  body: TaskDetailBody,
): Promise<OperatorTaskDetail> => {
  return request.post(`/v1/operator/task/label/detail`, body, {
    params,
  });
};

export interface OperatorTaskUpdatePayload {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title?: string;
  /** Description 任务描述 */
  description?: string;
  /** Tool Config 工具配置 */
  tool_config?: TaskToolConfig;
  /** Expire Time 过期时间/秒 */
  expire_time?: number;
  /** Teams 执行团队 */
  teams?: string[];
  /** 任务状态 */
  status?: TaskStatus;
}

/**
 * 更新标注任务
 */
export const updateLabelTask = (
  body: OperatorTaskUpdatePayload,
): Promise<{
  task_id: string;
}> => {
  return request.patch(`/v1/operator/task/label/update`, body);
};

/**
 * 删除标注任务
 */
export const deleteLabelTask = (body: { task_id: string }): Promise<OperatorTaskDetail> => {
  return request.post(`/v1/operator/task/label/delete`, body);
};

/**
 * 打回标注任务
 */
export const rejectLabelTask = (body: { task_id: string; user_id: string[] }): Promise<any> => {
  return request.post(`/v1/operator/task/label/data/reject`, body);
};

/**
 * 导出标注任务数据
 * @param taskId 任务id
 */
export const exportLabelTask = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/label/data/export?task_id=${taskId}`);
};

/**
 * 导出标注记录
 * @param taskId 任务id
 */
export const exportLabelRecord = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/label/record/export?task_id=${taskId}`);
};

/**
 * 导出标注工作量
 * @param taskId 任务id
 */
export const exportLabelTaskWorkload = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/label/data/export_workload?task_id=${taskId}`);
};

// ----------------- 审核任务 -----------------

export interface AuditTargetTask {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** Description 任务描述 */
  description: string;
  /** Tool Config 工具配置 */
  tool_config: TaskToolConfig;
  status: TaskStatus;
}

export interface AuditTaskFlowProgressForDetail {
  /** Flow Index 流程索引 */
  flow_index: number;
  /** Completed 已完成题数 */
  completed: number;
  /** Total 总题数 */
  pre_total: number;
  /** Total 总题数 */
  total: number;
  /** Pending 待审核题数 */
  pending: number;
  /** Auditing 审核中题数 */
  auditing: number;
  /** Passed 审核通过题数 */
  passed: number;
  /** Rejected 审核不通过题数 */
  rejected: number;
  /** Skipped 跳过题数 */
  skipped: number;
}

export interface AuditTaskConfig {
  /** Expire Time 过期时间/秒 */
  expire_time?: number;
  /** Distribute Num 分发数量 */
  distribute_num?: number;
  /** Base Questions 基础问题 */
  conversation?: Question[];
  /** Message Questions 消息问题 */
  message?: Question[];
}

export interface AuditTask {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** 任务状态 */
  status: TaskStatus;
  /** Created Time 创建时间/秒 */
  created_time: number;
  /** Creator 创建人 */
  creator: string;
  /** Completed Count 已完成数据量 */
  completed_count: number;
  total_count: number;
  progress: {
    /** Total Count 总数据量 */
    total: number;
    /** Completed Count 已完成数据量 */
    completed: number;
    pending: number;
    labeling: number;
    labeled: number;
  };
}

export interface AuditTaskFlowForDetail {
  /** Expire Time 问卷答题限制时间/秒 */
  expire_time: number;
  /** Max Audit Count 最多可审核次数 */
  max_audit_count: number;
  /** Pass Audit Count 达标所需审核次数 */
  pass_audit_count: number;
  /** Flow Index 流程索引 */
  flow_index: number;
  /** Teams 执行团队 */
  teams: TeamWithName[];
}

export interface AuditTaskDetail {
  is_data_recreate: any;
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** Description 任务描述 */
  description: string;
  /** 任务状态 */
  status: TaskStatus;
  /** Created Time 创建时间/秒 */
  created_time: number;
  /** Creator 创建人 */
  creator: string;
  /** Tool Config 工具配置 */
  tool_config: TaskToolConfig;
  /** Target Task 数据来源任务 */
  target_task?: AuditTargetTask;
  /** Flow 审核流程 */
  flow: AuditTaskFlowForDetail[];
  /** Progress 任务进度 */
  progress: AuditTaskFlowProgressForDetail[];
}

export interface AuditTaskCreatePayload {
  /** Title 任务标题 */
  title: string;
  /** Description 任务描述 */
  description: string;
  /** Tool Config 工具配置 */
  tool_config: Record<string, any>;
}

/**
 * 创建审核任务
 */
export const createAuditTask = (
  body: AuditTaskCreatePayload,
): Promise<{
  task_id: string;
}> => {
  return request.post('/v1/operator/task/audit/create', body);
};

export interface AuditTaskFlowProgressForList {
  /** Flow Index 流程索引 */
  flow_index: number;
  /** Completed Count 已完成数据量 */
  completed_count: number;
  /** Total Count 总数据量 */
  total_count: number;
}

export interface AuditTaskListItem {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title: string;
  /** 任务状态 */
  status: TaskStatus;
  /** Created Time 创建时间/秒 */
  created_time: number;
  /** Creator 创建人 */
  creator: string;
  /** Flow 审核流程 */
  flow: AuditTaskFlowProgressForList[];
}

/**
 * 获取审核任务列表
 */
export const getAuditTaskList = (body: TaskQueryBody): Promise<ListPayload<AuditTaskListItem>> => {
  return request.post('/v1/operator/task/audit/list', body);
};

/**
 * 获取审核任务详情
 */
export const getAuditTaskDetail = (params: Record<string, unknown>, body: TaskDetailBody): Promise<AuditTaskDetail> => {
  return request.post(`/v1/operator/task/audit/detail`, body, {
    params,
  });
};

export interface AuditTaskFlow {
  /** Expire Time 问卷答题限制时间/秒 */
  expire_time: number;
  /** Max Audit Count 最多可审核次数 */
  max_audit_count: number;
  /** Pass Audit Count 达标所需审核次数 */
  pass_audit_count: number;
  /** Teams 执行团队 */
  teams: string[];
  /** 审核比例 */
  sample_ratio: number;
}

export interface AuditTaskUpdatePayload {
  /** Task Id 任务id */
  task_id: string;
  /** Title 任务标题 */
  title?: string;
  /** Description 任务描述 */
  description?: string;
  /** Tool Config 工具配置 */
  tool_config?: TaskToolConfig;
  /** 任务状态 */
  status?: TaskStatus;
  /** Target Task Id 数据来源任务 */
  target_task_id?: string;
  /** Is Data Recreate 未达标自动打回至标注 */
  is_data_recreate?: boolean;
  /** Flow 审核流程 */
  flow?: AuditTaskFlow[];
}
/**
 * 更新审核任务
 */
export const updateAuditTask = (
  body: AuditTaskUpdatePayload,
): Promise<{
  task_id: string;
}> => {
  return request.patch(`/v1/operator/task/audit/update`, body);
};

export interface UpdateTeamPayload {
  task_id: string;
  flow_index: number;
  teams: string[];
}

/**
 * 更新进行中的审核任务的团队
 */
export const updateAuditTaskTeams = (body: UpdateTeamPayload): Promise<{ task_id: string }> => {
  return request.put(`/v1/operator/task/audit/flow/team/update`, body);
};

/**
 * 删除审核任务
 */
export const deleteAuditTask = (body: { task_id: string }): Promise<any> => {
  return request.post(`/v1/operator/task/audit/delete`, body);
};

/**
 * 导出审核任务数据
 * @param taskId 任务id
 */
export const exportAuditTask = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/audit/data/export?task_id=${taskId}`);
};

/**
 * 导出标注工作量
 * @param taskId 任务id
 */
export const exportAuditTaskWorkload = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/audit/data/export_workload?task_id=${taskId}`);
};

// ----------------------------- 标注任务统计相关数据 -----------------------------

export interface LabelerWithUsername {
  /** User Id 用户ID */
  user_id: string;
  /** Username 用户名 */
  username: string;
}

export interface GroupDataByUser {
  /** Label User 标注员 */
  label_user: LabelerWithUsername;
  /** Completed Data Count 答题数 */
  completed: number;
  /** Discarded Data Count 未达标题数 */
  discarded: number;
}

export interface RespGroupRecordByUser {
  /** List */
  list: GroupDataByUser[];
  /** Total */
  total: number;
}

export interface LabelTaskStatisticsBody {
  /** Task Id 任务id */
  task_id: string;
  /** Username 用户名 */
  username: string;
  /** Page 跳过数量 */
  page?: number;
  /** Page Size 获取数量 */
  page_size?: number;
}

/**
 * 标注-数据统计-用户维度
 */
export const getLabelTaskUserStatistics = (body: LabelTaskStatisticsBody): Promise<RespGroupRecordByUser> => {
  return request.post(`/v1/operator/task/label/record/group/user`, body);
};

export interface AuditTaskStatisticsBody {
  /** Task Id 任务id */
  task_id: string;
  /** Flow Index 流程索引 */
  flow_index: number;
}

/**
 * 审核-数据统计-用户维度
 */
export const getAuditTaskUserStatistics = (body: AuditTaskStatisticsBody): Promise<RespGroupRecordByUser> => {
  return request.post(`/v1/operator/task/audit/record/group/user`, body);
};

/**
 * 任务-统计分析-数据分布
 */
export enum EScopeType {
  conversation = 'conversation',
  question = 'question',
  message = 'message',
}
interface ITaskLabelStatsParams {
  _id: string;
  scope: EScopeType;
}
interface ITaskLabelStatsItem {
  label: string;
  value: string;
  count?: number;
  total?: number;
  data: ITaskLabelStatsItem[];
}
export const getTaskLabelStats = (params: ITaskLabelStatsParams): Promise<{ data: ITaskLabelStatsItem[] }> => {
  return request.post('/v1/operator/task/label/stats', params);
};

/**
 * 任务-统计分析-数据分布-导出统计数据
 */
export interface ITaskLabelStatsExportParams {
  task_id: string;
  scope: EScopeType;
  question_value: string; // 选择的问题
  choice_value: string; // 选择的答案
}
export const exportTaskLabelStats = async (params: ITaskLabelStatsExportParams) => {
  return downloadFromUrl(
    `/api/v1/operator/task/label/stats/export?task_id=${params.task_id}&scope=${params.scope}&question_value=${params.question_value}&choice_value=${params.choice_value}`,
  );
};
// 获取 筛选标注 id
export const getTaskLabelId = async (params: ITaskLabelStatsExportParams): Promise<{ data: { data_id: string }[] }> => {
  return request.get('/v1/operator/task/label/stats/data', { params });
};

/**
 * 任务-统计分析-数据筛选
 */
export enum EKind {
  without_duplicate = 'without_duplicate', // 单题标注结果
  with_duplicate = 'with_duplicate', // 源题多结果对比
}
export interface ITaskLabelDataFilterParams {
  _id: string;
  kind: EKind;
  filters?: {
    scope: EScopeType;
    question: string;
    answer: string;
  }[];
  operator: string;
}
export const getTaskLabelDataFilter = (params: ITaskLabelDataFilterParams): Promise<{ count: number }> => {
  return request.post('/v1/operator/task/label/filters', params);
};
/**
 * 任务-统计分析-数据筛选-下载标注结果
 */
export const exportTaskLabelResultData = async (params: string) => {
  return downloadFromUrl(`/api/v1/operator/task/label/filters/data/export?params=${params}`);
};

/**
 * 任务-统计分析-数据筛选-下载标注 id
 */
export const exportTaskLabelIdData = async (params: string) => {
  return downloadFromUrl(`/api/v1/operator/task/label/filters/id/export?params=${params}`);
};
/**
 * 任务-统计分析-数据筛选-获取标注 id
 */
interface ITaskLabelDataFilterRes {
  data_id?: string | string[]; // 如果是源题模式  data_id 是数组
  questionnaire_id?: string;
}
export const getTaskLabelIds = async (
  params: ITaskLabelDataFilterParams,
): Promise<{ data: ITaskLabelDataFilterRes[] }> => {
  return request.post(`/v1/operator/task/label/filters/id/list`, params);
};
