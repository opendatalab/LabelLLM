import { createContext, useContext } from 'react';
import type { FormInstance } from 'antd';

import type { QuestionItem } from '../types';

export type ConditionContextType = {
  currentQuestion: QuestionItem;
  questions: QuestionItem[];
  form: FormInstance;
  disabled?: boolean;
} | null;

export const ConditionContext = createContext<ConditionContextType>(null);

export function useCondition() {
  const value = useContext(ConditionContext);

  if (!value) {
    throw new Error('useCondition must be used within a ConditionContext');
  }

  return value;
}
