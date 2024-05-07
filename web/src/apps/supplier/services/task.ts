import request from '@/api/request';
import type { EKind } from '@/apps/supplier/hooks/useTaskParams';

export interface IPagination {
  page?: number; // 页码
  page_size?: number; // 每页数量
}

/**
 * 获取标注任务列表
 */

export enum ETaskStatus {
  created = 'created',
  open = 'open',
  done = 'done',
}
export interface ITaskItem {
  task_id: string;
  title: string;
  description: string;
  remain_count: number; // 剩余问题数
  completed_count: number; // 已完成问题数
  status: ETaskStatus; // 任务状态
  flow_index?: string; // 任务流程
}
export const getTaskLabelList = async (params: IPagination): Promise<{ list: ITaskItem[]; total: number }> => {
  return request.post('/v1/task/label/list', params);
};

/**
 * 获取审核任务列表
 */
export const getAuditTaskList = async (params: IPagination): Promise<{ list: ITaskItem[]; total: number }> => {
  return request.post('/v1/task/audit/list', params);
};

/**
 * 获取任务详情
 */
// 问题类型
export enum EQuestionType {
  string = 'string', // 填空
  enum = 'enum', // 单选
  array = 'array', // 多选
}

export interface ConditionContent {
  // 依赖的题目的值
  field: string;
  // 依赖的题目的选项的值
  value: string;
  option_id: string;
  question_id: string;
  /**
   * 运算符
   * @description eq 等于；neq 不等于；in 包含；nin 不包含
   */
  operator: 'eq' | 'neq' | 'in' | 'nin';
}

export interface ConditionItem {
  connector: 'and' | 'or';
  items: ConditionContent[];
  children: ConditionItem[];
}

export interface IQuestion {
  id: string;
  // string 为填空题，enum 为单选题，array 为多选题 */
  type: EQuestionType;
  // 题目内容
  label: string;
  // 题目的值 也就是 key
  value: string;
  // 题目的选项，当type为string是可为空
  options?: {
    // 选项内容 */
    label: string;
    // 选项的值 */
    value: string;
    // 选项的 id，添加和删除题目选项时的唯一标示
    id: string;
    // 是否默认选中
    is_default?: boolean;
  }[];
  // 填空的最大长度
  max_length?: number;
  // 填空的默认值
  default_value?: string;
  // 是否必填
  required?: boolean;
  // 当type 为string时，是否预览默认展开
  is_preview_expanded?: boolean;
  // 当type 为string时，是否可上传附件
  is_upload_available?: boolean;
  // 题目可见性条件，有条件存在时，默认不可见，当条件满足时才可见
  conditions?: ConditionItem[];
}

export enum EMessageType {
  send = 'send',
  receive = 'receive',
}
export interface IMessage {
  message_id: string;
  parent_id?: string;
  content: string;
  message_type: EMessageType;
  user_id: string;
}

export interface IMessageQuestion {
  // 是否对所有回复排序
  is_sortable: boolean;
  // 序号是否可重复，默认不可重复
  is_sn_unique: boolean;
  questions: IQuestion[];
}

// 插件配置
export interface IPlugin {
  grammar_checking_enabled: boolean; // 是否开启语法检查
  translator_enabled: boolean; // 是否开启翻译 默认 deepl
  translate_from: string; // 翻译源语言
  translate_to: string; // 翻译目标语言
  google_translator_enabled: boolean; // google 翻译
  google_translate_from: string; //google 翻译源语言
  google_translate_to: string; // google 翻译目标语言
  grammar_checking_from: string; // 语法检查源语言
  message_send_diff: boolean;
}

export interface IPluginConfig {
  content: IPlugin;
  conversation: IPlugin;
}

export interface ITaskRes {
  task_id: string;
  title: string; // 任务标题
  description: string; // 任务描述
  // 标注任务配置
  label_tool_config?: {
    // 针对整个对话的配置
    conversation: {
      questions: IQuestion[];
    };
    // 针对每个提问的配置
    question: {
      questions: IQuestion[];
    };
    // 针对每条回复的配置
    message: IMessageQuestion;

    plugins?: IPluginConfig;

    layout?: {
      grid: number; // 布局设置 grid 布局的列数
    };
  };
  // 审核任务配置
  audit_tool_config?: {
    // 针对整个对话的配置
    conversation: {
      questions: IQuestion[];
    };
    // 针对每条回复的配置
    message: IMessageQuestion;
  };
}

// 标注任务
export const getTaskDetail = (params: { task_id: string }): Promise<ITaskRes> => {
  return request.post('/v1/task/label/detail', params);
};
// 审核任务详情
export const getAuditTaskDetail = (params: { task_id: string }): Promise<ITaskRes> => {
  return request.post('/v1/task/audit/detail', params);
};
// 预览任务详情
export const getPreviewTaskDetail = (params: { task_id: string }): Promise<ITaskRes> => {
  return request.post('/v1/operator/task/label/detail', params).then((res: any) => {
    return { ...res, label_tool_config: res.tool_config };
  });
};
// 预览审核任务详情
export const getPreviewAuditDetail = (params: { task_id: string }): Promise<ITaskRes> => {
  return request.post('/v1/operator/task/audit/detail', params).then((res: any) => {
    return { ...res, label_tool_config: res.target_task?.tool_config, audit_tool_config: res?.tool_config };
  });
};

/**
 * 获取标注数据
 */
export enum ERecordStatus {
  processing = 'processing', // 处理中
  completed = 'completed', // 已完成
  discarded = 'discarded', // 已废弃
}

export interface IQuestionParams {
  task_id: string;
  // 审核任务需要的字段 放在url的query里
  flow_index?: string;

  // -----------------以下字段都在预览场景下使用--------------------------
  data_id?: string;
  // 用户id
  user_id?: string;
  // 任务状态
  record_status?: ERecordStatus;
}

export interface ILabelUser {
  user_id: string;
  username: string;
}

export interface ILabelData {
  data_id: string;
  questionnaire_id: string;
  prompt?: string; // 提示语
  conversation?: IMessage[]; // 对话 问答题
  remain_time: number; // 剩余时间
  evaluation?: IAnswer; // 审核标注数据
  reference_evaluation?: IAnswer; // 预标注数据
  label_user?: ILabelUser; // 标注员信息
}

export const getLabelData = (params: IQuestionParams): Promise<ILabelData> => {
  return request.post('/v1/task/label/data/get', params);
};
// 获取审核任务数据
export const getAuditData = (params: IQuestionParams): Promise<ILabelData> => {
  return request.post('/v1/task/audit/data/get', params);
};
// 获取预览数据
export const getPreviewData = (params: IQuestionParams): Promise<ILabelData> => {
  return request.post('/v1/operator/task/label/data/preview', params);
};
// 获取某个标注员的标注数据
export const getLabelDataByUserId = (params: IQuestionParams): Promise<ILabelData> => {
  return request.post('/v1/operator/task/label/record/preview', params);
};
// 获取某个标注员的审核数据
export const getAuditDataByUserId = (params: IQuestionParams): Promise<ILabelData> => {
  return request.post('/v1/operator/task/audit/record/preview', params);
};
// 获取预览数据id
export interface IPreviewIdParams {
  task_id: string;
  data_id?: string;
  questionnaire_id?: string;
  kind?: EKind; // 是否是源题模式
  is_invalid_questionnaire?: boolean;
  pos_locate?: 'next' | 'prev' | 'current';
}
export interface IPreviewIdRRes {
  data_id: string;
  questionnaire_id: string;
  task_id: string;
}
export const getPreviewId = (params: IPreviewIdParams): Promise<IPreviewIdRRes> => {
  return request.post('/v1/operator/task/label/data/preview/ids', params);
};

// 根据 questionnaire_id 获取 data_id
export const getTaskDataIds = (params: { questionnaire_id?: string; task_id: string }): Promise<{ data: string[] }> => {
  return request.post('/v1/operator/task/label/data/list_by_questionnaire_id', params);
};

/**
 * 释放问题
 */
export const releaseLabelData = (params: { data_id: string }): Promise<void> => {
  return request.post('/v1/task/label/data/release', params);
};
export const releaseAuditData = (params: { data_id: string; flow_index?: string }): Promise<void> => {
  return request.post('/v1/task/audit/data/release', params);
};

/**
 * 提交问题结果
 */
export interface IAnswer {
  data_id: string;
  // 针对单挑消息的评价
  message_evaluation?: Record<string, any>;
  // 针对整个对话的评价
  conversation_evaluation?: Record<string, any>;
  // 针对整个问卷的评价
  questionnaire_evaluation?: {
    is_invalid_questionnaire?: boolean;
  };
  // 审核任务答案
  data_evaluation?: Record<string, any>;
}
export const submitLabelData = (params: IAnswer): Promise<void> => {
  return request.put('/v1/task/label/data/commit', params);
};

/**
 * 提交审核问题结果
 */
export interface IAuditAnswer {
  data_id: string;
  is_pass: boolean;
  flow_index: string;
  data_evaluation?: Record<string, any>;
}
export const submitAuditData = (params: IAuditAnswer): Promise<void> => {
  return request.put('/v1/task/audit/data/commit', params);
};

/**
 * 获取标注记录
 */
export interface ILabelRecordParams {
  task_id: string;
  status: ERecordStatus;
  user_id?: string;
  page?: number;
  page_size?: number;
  flow_index?: string;
}
export const getLabelRecord = (params: ILabelRecordParams): Promise<{ total: number }> => {
  return request.post('/v1/operator/task/label/record/list', params);
};
// 获取审核记录
export const getAuditRecord = (params: ILabelRecordParams): Promise<{ total: number }> => {
  return request.post('/v1/operator/task/audit/record/list', params);
};

/**
 * 文件上传
 */
interface IUploadParams {
  type: string;
  content_length: number;
  //后缀名
  suffix: string;
}
export interface IUploadRes {
  put_url: string;
  get_url: string;
}
export const getUploadUrl = (params: IUploadParams): Promise<IUploadRes> => {
  return request.post('/v1/file/create', params);
};

/**
 * 语法校验
 */
interface ICheckParams {
  language: string;
  text: string;
}
export enum ECheckGrammarType {
  Other = 'Other', // 其他 黄色
  Hint = 'Hint', // 提示 蓝色
  UnknownWord = 'UnknownWord', // 拼写错误  红色
}
export interface IMatche {
  shortMessage: string; // 短消息
  message: string; // 消息
  offset: number; // 偏移量
  length: number; // 长度
  type: {
    typeName: ECheckGrammarType;
  };
}

export const grammarCheck = (params: ICheckParams): Promise<{ matches: IMatche[] }> => {
  return request.post('/ws/v2/check', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

/**
 * 翻译
 */

export interface ITranslateParams {
  text: string;
  source: string; // 源语言
  target: string; // 目标语言
}

export interface ITranslateRes {
  text: string;
}
// Deepl 翻译
export const translate = (params: ITranslateParams): Promise<ITranslateRes> => {
  return request.post('/v1/tool/translate', params);
};
// Google 翻译
export const googleTranslate = (params: ITranslateParams): Promise<ITranslateRes> => {
  return request.post('/v1/tool/google_translate', params);
};
