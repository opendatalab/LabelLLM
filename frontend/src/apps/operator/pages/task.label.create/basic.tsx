import { Button, Form } from 'antd';
import { useNavigate, useParams, useRouteLoaderData } from 'react-router';
import { useContext, useMemo } from 'react';
import { useSessionStorageState } from 'ahooks';

import FancyInput from '@/components/FancyInput';

import TaskFormContext from './context';
import type { OperatorTaskDetail } from '../../services/task';
interface PartialProps {
  onStepChange: (step: number) => void;
}

export default function TaskBasic({ onStepChange }: PartialProps) {
  const { basicForm } = useContext(TaskFormContext);
  const routeParams = useParams();
  const taskInfo = useRouteLoaderData('labelTask') as OperatorTaskDetail;
  const [basicInfoFromCache, setBasicCache] = useSessionStorageState<OperatorTaskDetail>('label_task_basic_cache', {});
  const navigate = useNavigate();
  const initialValues = useMemo(() => {
    if (routeParams.id) {
      return taskInfo;
    }

    return Object.assign(
      {},
      {
        distribute_count: 1,
      },
      basicInfoFromCache,
    );
  }, [basicInfoFromCache, routeParams.id, taskInfo]);

  const handleNextStep = () => {
    basicForm.validateFields().then(async (values) => {
      try {
        // 此步骤不保存到服务器，将基本信息缓存以供下一步使用
        setBasicCache(values);
      } catch (err) {
        return;
      }

      onStepChange(1);
    });
  };

  const handleCancel = () => {
    if (routeParams.id) {
      navigate(`/task/${routeParams.id}`, { replace: true });
      return;
    }

    navigate('/task', { replace: true });
  };

  return (
    <div className="flex justify-center mt-8">
      <Form
        className="w-[552px]"
        form={basicForm}
        colon={false}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        initialValues={initialValues}
      >
        <Form.Item
          label="任务名称"
          name="title"
          required
          rules={[
            {
              required: true,
              message: '请输入任务名称',
            },
          ]}
        >
          <FancyInput autoFocus placeholder="请输入任务名称，20字符以内" maxLength="20" type="string" />
        </Form.Item>
        <Form.Item
          label="任务描述"
          name="description"
          required
          rules={[
            {
              required: true,
              message: '请输入任务描述',
            },
          ]}
        >
          <FancyInput
            placeholder="请输入任务描述，200字符以内"
            maxLength="200"
            type="string"
            alias="textArea"
            rows={3}
          />
        </Form.Item>
        <Form.Item
          label="标注规则"
          name="distribute_count"
          required
          rules={[
            {
              required: true,
              message: '请输入标注规则',
            },
          ]}
          tooltip="配置一道题需要被回答几次"
        >
          <FancyInput
            min={1}
            disabled={routeParams.id}
            addonBefore="每题"
            className="w-full"
            addonAfter="轮答题"
            type="number"
          />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <div className="flex justify-end">
            <Button type="default" onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" className="ml-4" onClick={handleNextStep}>
              下一步
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}
