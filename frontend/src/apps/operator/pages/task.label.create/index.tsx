import { Form, Steps } from 'antd';
import { useLocation, useNavigate, useParams, useRouteLoaderData } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSessionStorage } from 'react-use';

import CustomPageContainer from '../../layouts/CustomPageContainer';
import TaskBasic from './basic';
import TaskTool from './tool';
import TaskFormContext from './context';
import type { OperatorTaskDetail } from '../../services/task';

const stepItems = [
  {
    title: '基本信息',
  },
  {
    title: '工具配置',
  },
];

enum StepEnum {
  Basic = 'basic',
  Tool = 'tool',
}

const stepKeys = [StepEnum.Basic, StepEnum.Tool];
const stepIndex: Record<StepEnum, number> = {
  [StepEnum.Basic]: 0,
  [StepEnum.Tool]: 1,
};
const partialMap: Record<
  StepEnum,
  React.FC<{
    onStepChange: (nextStep: number) => void;
    isNewTask?: boolean;
  }>
> = {
  [StepEnum.Basic]: TaskBasic,
  [StepEnum.Tool]: TaskTool,
};

export default function CreateLabelTask() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeHash = location.hash.replace('#', '');
  const [currentStep, setCurrentStep] = useState(stepIndex[routeHash as StepEnum] || 0);
  const [basicForm] = Form.useForm();
  const [toolForm] = Form.useForm();
  const routeParams = useParams();
  const [, setBasicCache] = useSessionStorage('label_task_basic_cache');
  const [, setToolCache] = useSessionStorage('label_task_tool_cache');

  const taskInfo = useRouteLoaderData('labelTask') as OperatorTaskDetail;
  const isNewTask = typeof routeParams.id === 'undefined';

  useEffect(() => {
    return () => {
      setBasicCache(undefined);
      setToolCache(undefined);
    };
  }, [setBasicCache, setToolCache]);

  useEffect(() => {
    if (!isNewTask && taskInfo) {
      basicForm.setFieldsValue({
        name: taskInfo.title,
        description: taskInfo.description,
      });
    }
  }, [basicForm, isNewTask, taskInfo]);

  const forms = useMemo(() => {
    return {
      basicForm,
      toolForm,
    };
  }, [basicForm, toolForm]);
  const handleStepChange = useCallback(
    async (nextStep: number) => {
      if (nextStep > 0) {
        try {
          await basicForm.validateFields();
        } catch (e) {
          return;
        }
      }

      setCurrentStep(nextStep);
      navigate({
        pathname: location.pathname,
        hash: stepKeys[nextStep],
        search: searchParams.toString(),
      });
    },
    [basicForm, location.pathname, navigate, searchParams],
  );

  const steps = useMemo(() => {
    return (
      <Steps className="w-[525px]" size="small" onChange={handleStepChange} current={currentStep} items={stepItems} />
    );
  }, [currentStep, handleStepChange]);

  const Partial = partialMap[stepKeys[currentStep]];

  return (
    <TaskFormContext.Provider value={forms}>
      <CustomPageContainer>
        <div className="flex justify-center my-12">{steps}</div>
        <Partial onStepChange={handleStepChange} isNewTask={isNewTask} />
      </CustomPageContainer>
    </TaskFormContext.Provider>
  );
}
