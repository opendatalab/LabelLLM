import type { ConditionItem } from '@/apps/supplier/services/task';

export enum QuestionType {
  Enum = 'enum',
  Array = 'array',
  String = 'string',
}

export interface QuestionItem {
  conditions?: ConditionItem[];
  label: string;
  value: string;
  id: string;
  /** enum 为单选；array为多选；string为文本描述 */
  type: Lowercase<keyof typeof QuestionType>;
  required?: boolean;
  /** 以下是属性分类才有的字段 */
  is_default?: boolean;
  options?: QuestionOption[];
}

export type QuestionOption = Omit<QuestionItem, 'options'>;
