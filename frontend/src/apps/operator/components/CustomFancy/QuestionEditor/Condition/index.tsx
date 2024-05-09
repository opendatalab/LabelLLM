import { SettingOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Badge, Button, Form, Modal, Tooltip } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { ConditionContent } from '@/apps/supplier/services/task';

import type { QuestionItem } from '../types';
import { ConditionContext } from './context';
import RecursiveCondition from './RecursiveCondition';
import { bfsEach } from '../../../../utils/bfsEach';

function getConditionCount(conditions: ConnectorWrapper[]) {
  let count = 0;

  bfsEach<ConnectorWrapper>(conditions, (item) => {
    count += _.size(item.items);
  });

  return count;
}

const StyledCondition = styled.div`
  .ant-form-item {
    margin-bottom: 0.5rem;
  }
`;

interface ConditionItem {
  value: string;
  field: string;
  option_id: string;
  question_id: string;
  operator: 'eq' | 'neq' | 'in' | 'nin';
}

/**
 * 条件组合
 */
interface ConnectorWrapper {
  connector: 'and' | 'or';
  children: ConnectorWrapper[];
  items: ConditionItem[];
}

interface ConditionProps {
  disabled?: boolean;
  value?: ConnectorWrapper[];
  onChange?: (value: ConnectorWrapper[]) => void;
  parentField: NamePath;
  index: number;
}

export default function Condition({ value, disabled, onChange, parentField, index }: ConditionProps) {
  const form = Form.useFormInstance();
  const [conditionForm] = Form.useForm<{
    conditions: (ConnectorWrapper | ConnectorWrapper[])[];
  }>();
  const [open, setOpen] = useState(false);
  const [stateValue, setStateValue] = useState<ConnectorWrapper[]>(value || []);

  useEffect(() => {
    setStateValue(value || []);
    // 兼容旧的条件(无分组)
    let initialValue = value;
    if (Array.isArray(value) && value.length > 0 && !('connector' in value[0])) {
      initialValue = [
        {
          connector: 'and',
          children: [],
          items: value.map((item) => ({
            ...item,
            operator: Array.isArray((item as unknown as ConditionContent).value) ? 'in' : 'eq',
          })) as unknown as ConditionContent[],
        },
      ];
    }

    conditionForm.setFieldsValue({ conditions: initialValue });
  }, [conditionForm, value]);

  const handleToggleVisible = useCallback(() => {
    conditionForm.resetFields();
    setOpen(!open);
  }, [conditionForm, open]);
  const questions: QuestionItem[] = useMemo(() => form.getFieldValue(parentField) || [], [form, parentField, open]);
  const currentQuestion = useMemo(() => questions[index], [questions, index]);

  const handleFinish: FormProps['onFinish'] = (values) => {
    onChange?.(values.conditions);
    setStateValue(values.conditions);
  };

  const handleSave = async () => {
    try {
      await conditionForm.validateFields();
      await conditionForm.submit();
      setOpen(false);
    } catch (error) {
      console.error('error', error);
    }
  };

  const contextValue = useMemo(() => {
    return {
      currentQuestion,
      questions,
      form: conditionForm,
      disabled,
    };
  }, [conditionForm, currentQuestion, disabled, questions]);

  const content = (
    <StyledCondition className="mt-4">
      <ConditionContext.Provider value={contextValue}>
        <Form form={conditionForm} onFinish={handleFinish} initialValues={{ conditions: value }}>
          <RecursiveCondition name="conditions" />
        </Form>
      </ConditionContext.Provider>
    </StyledCondition>
  );

  const count = useMemo(() => getConditionCount(stateValue), [stateValue]);

  return (
    <>
      <div className="flex items-center">
        <Tooltip title="可见性条件设置（当不存在条件时，默认可见；否则条件满足时才可见）">
          <Button
            icon={<SettingOutlined />}
            className="text-[var(--color-text-secondary)]"
            type="text"
            size="small"
            onClick={handleToggleVisible}
          />
        </Tooltip>
        <Badge count={count} showZero color="#F4F5F9" className="!text-[var(--color-text)]" />
      </div>
      <Modal
        title="条件设置"
        destroyOnClose
        width={800}
        onCancel={handleToggleVisible}
        footer={
          <div className="flex justify-end">
            <div>
              <Button onClick={handleToggleVisible}>取消</Button>
              <Button type="primary" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        }
        open={open}
      >
        {content}
      </Modal>
    </>
  );
}
