import type { FormInstance } from 'antd';
import { createContext } from 'react';

export interface ITaskFormContext {
  basicForm: FormInstance;
  toolForm: FormInstance;
}

const TaskFormContext = createContext({} as ITaskFormContext);

export default TaskFormContext;
