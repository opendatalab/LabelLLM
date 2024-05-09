import type { PropsWithChildren, HTMLAttributes } from 'react';
import React from 'react';
import { clsx } from 'clsx';
import { ProFormCheckbox, ProFormRadio } from '@ant-design/pro-components';
import { Form } from 'antd';
import type { FormInstance } from 'antd/lib/form';

import type { ConditionContent, ConditionItem, IQuestion } from '@/apps/supplier/services/task';
import { EQuestionType } from '@/apps/supplier/services/task';

import CustomizeTextarea from '../customize-textarea';

interface IWidgetBoxProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  horizontal?: boolean;
  required?: boolean;
  value?: string;
}

const requiredSymbol =
  "before:content-['*'] before:text-sm before:me-1 before:text-error before:font before:font-['SimSun,sans-serif']";

export const WidgetBox: React.FC<IWidgetBoxProps> = ({ label, horizontal, required, className, children }) => {
  return (
    <div className={clsx('mt-3', horizontal && 'flex', className)}>
      <div className={clsx('mr-4', horizontal && 'pt-1', required && requiredSymbol)}>{label}</div>
      <div>{children}</div>
    </div>
  );
};

// 销毁form组件时，重置表单项
const ResetFormItem = ({
  names,
  setFieldValue,
}: {
  names: string[];
  setFieldValue: (names: string[], value: undefined) => void;
}) => {
  React.useEffect(() => {
    return () => {
      setFieldValue(names, undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <span className="block mb-3 last:mb-0" />;
};

const recursiveConditionResult = (
  conditions: ConditionItem[],
  getFieldValue: FormInstance['getFieldValue'],
  names: string[],
): boolean => {
  const newNames = names.slice(0, -1);

  return conditions?.reduce((prev, curr) => {
    const connector = curr.connector || 'and';
    // 当连接符是 and 时，初始值为 true，否则为 false
    const preResult = prev ?? connector === 'and';
    const itemsResult = curr.items?.reduce((prevItemsResult, currItems) => {
      // 监听父组件的 value
      const depVal = getFieldValue([...newNames, currItems.field]);
      const operator = currItems.operator || 'eq';
      const isIncluded = depVal?.includes(currItems.value);
      const isEquals = depVal === currItems.value;

      if (operator === 'eq') {
        return connector === 'and' ? prevItemsResult && isEquals : prevItemsResult || isEquals;
      } else if (operator === 'neq') {
        return connector === 'and'
          ? prevItemsResult && depVal !== currItems.value
          : prevItemsResult || depVal !== currItems.value;
      } else if (operator === 'in') {
        return connector === 'and' ? prevItemsResult && isIncluded : prevItemsResult || isIncluded;
      } else {
        return connector === 'and' ? prevItemsResult && !isIncluded : prevItemsResult || !isIncluded;
      }
    }, curr.connector === 'and');

    if (curr.children?.length) {
      const childrenResult = recursiveConditionResult(curr.children, getFieldValue, names);

      return connector === 'and'
        ? preResult && childrenResult && itemsResult
        : preResult || childrenResult || itemsResult;
    }

    return itemsResult;
  }, undefined as unknown as boolean);
};

interface IProps extends IQuestion {
  className?: string;
  names: string[];
}

const shortcutKeySeparation = '判断左侧标注结果是否正确，且符合要求';
const Widget: React.FC<PropsWithChildren<IProps>> = (props) => {
  const { names, label, options, type, conditions, ...rest } = props;
  // console.log(label.split('（快捷键：'));
  const l = label.includes(shortcutKeySeparation) ? (
    <div>
      {shortcutKeySeparation}
      <br />
      <span className="text-secondary text-xs">快捷键：是 - Alt+1；否 - Alt+2</span>
    </div>
  ) : (
    label
  );
  const getWidget = (setFieldValue: (name: string[], value: any) => void, getFieldValue: (name: string[]) => any) => {
    return (
      <>
        {EQuestionType.enum === type && (
          <ProFormRadio.Group
            label={l}
            name={names}
            rules={[{ required: rest.required }]}
            options={options || undefined}
            initialValue={options?.find((item) => item.is_default)?.value}
          />
        )}
        {EQuestionType.array === type && (
          <ProFormCheckbox.Group
            name={names}
            label={label}
            rules={[{ required: rest.required }]}
            options={options || undefined}
            initialValue={options?.filter((item) => item.is_default).map((item) => item.value)}
          />
        )}
        {EQuestionType.string === type && (
          <CustomizeTextarea
            names={names}
            question={props}
            mdValue={getFieldValue(names)}
            setFieldValue={setFieldValue}
          />
        )}
        <ResetFormItem names={names} setFieldValue={setFieldValue} />
      </>
    );
  };

  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue, setFieldValue }) => {
        // 题目可见性条件，有条件存在时，默认不可见，当条件满足时才可见
        if (conditions?.length) {
          let shouldShow = false;

          // 兼容旧版本无分组的条件
          if (conditions.length > 0 && !('connector' in conditions[0])) {
            shouldShow = (conditions as unknown as ConditionContent[])?.reduce((prev, curr) => {
              const newNames = names.slice(0, -1);
              // 监听父组件的 value
              const depVal = getFieldValue([...newNames, curr.field]);
              // depVal 为数组时，表示多选，需要判断是否包含当前值
              return prev || (depVal && (Array.isArray(depVal) ? depVal.includes(curr.value) : depVal === curr.value));
            }, false);
          } else {
            shouldShow = recursiveConditionResult(conditions, getFieldValue, names);
          }

          return shouldShow ? getWidget(setFieldValue, getFieldValue) : null;
        } else {
          return getWidget(setFieldValue, getFieldValue);
        }
      }}
    </Form.Item>
  );
};

export default React.memo(Widget);
