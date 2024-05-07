import { Form, Select, Button, Dropdown } from 'antd';
import { useCallback, useMemo } from 'react';
import Icon, { PlusOutlined } from '@ant-design/icons';
import type { InternalNamePath, NamePath } from 'antd/es/form/interface';
import styled, { css } from 'styled-components';

import { QuestionType } from '../../types';
import { useCondition } from '../context';
import { ReactComponent as DeleteIcon } from '../../svgs/delete.svg';

const operatorMapping: Record<
  QuestionType,
  {
    label: string;
    value: string;
  }[]
> = {
  [QuestionType.Enum]: [
    {
      label: '等于',
      value: 'eq',
    },
    {
      label: '不等于',
      value: 'neq',
    },
  ],
  [QuestionType.Array]: [
    {
      label: '包含',
      value: 'in',
    },
    {
      label: '不包含',
      value: 'nin',
    },
  ],
  [QuestionType.String]: [
    {
      label: '等于',
      value: 'eq',
    },
  ],
};

const connectOptions = [
  {
    label: '且',
    value: 'and',
  },
  {
    label: '或',
    value: 'or',
  },
];

const ConnectorWrapper = styled.div<{ hidden: boolean }>`
  --width: 1rem;

  ${({ hidden }) =>
    hidden &&
    css`
      display: none;
    `}

  display: flex;
  align-items: flex-end;
  position: relative;
  align-self: stretch;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 5rem;

  &::before {
    flex: 1;
    content: ' ';
    width: var(--width);
    right: 0;
    top: -4px;
    border-radius: var(--border-radius) 0 0 0;
    border-left: 1px solid var(--color-border);
    border-top: 1px solid var(--color-border);
  }

  &::after {
    flex: 1;
    border-radius: 0 0 0 var(--border-radius);
    border-left: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    content: ' ';
    width: var(--width);
    right: 0;
    bottom: -4px;
  }
`;

const ConditionItem = styled.div<{ bordered: boolean }>`
  display: flex;
  flex: 1;
  gap: 0.5rem;

  ${({ bordered }) =>
    bordered &&
    css`
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: 1rem;
    `}
`;

const ConditionWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
`;

const ConditionGroup = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
`;

const ItemsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Items = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
`;

export interface RecursiveConditionProps {
  parentPath?: InternalNamePath;
  name: NamePath;
  onChange?: (path: NamePath) => (value: string) => void;
}

export default function RecursiveCondition({ name, ...props }: RecursiveConditionProps) {
  const parentPath = useMemo(() => props.parentPath ?? [name as string], [name, props.parentPath]);
  const { currentQuestion, questions, form, disabled } = useCondition();
  const isHeadDepth = parentPath.length === 1;
  const fieldOptions = useMemo(() => {
    if (!currentQuestion?.value) {
      return [];
    }

    return (
      questions
        .filter((item) => item.type !== 'string' && item.value !== currentQuestion.value)
        .map((item) => {
          return {
            label: item.label,
            value: item.value,
          };
        }) || []
    );
  }, [currentQuestion?.value, questions]);

  const handleConditionValueChange = useCallback(
    (path: InternalNamePath) => (changedValue: string) => {
      const field = form.getFieldValue([...path, 'field']);
      const valueOptions = questions.find((item) => item.value === field)?.options || [];
      const option = valueOptions.find((item) => item.value === changedValue);
      const question = questions.find((item) => item.value === field);

      form.setFieldValue([...path, 'option_id'], option?.id);
      form.setFieldValue([...path, 'question_id'], question?.id);
    },
    [form, questions],
  );

  const handleAddCondition = useCallback(() => {
    let targetPath = parentPath;

    if (isHeadDepth) {
      targetPath = [...parentPath, 0, 'items'];
    } else {
      targetPath = [...parentPath.slice(0, -1), 'items'];
    }

    const existItems = form.getFieldValue(targetPath);

    if (!existItems) {
      form.setFieldValue(targetPath.slice(0, -1), {
        items: [
          {
            value: undefined,
            field: undefined,
            operator: 'eq',
          },
        ],
        connector: 'and',
        children: [],
      });
    } else {
      form.setFieldValue(targetPath, [
        ...existItems,
        {
          value: undefined,
          field: undefined,
          operator: 'eq',
        },
      ]);
    }
  }, [form, isHeadDepth, parentPath]);

  return (
    <Form.Item noStyle shouldUpdate>
      {() => (
        <Form.List name={name}>
          {(connectors, { add, remove }) => {
            const addition = (
              <Form.Item className="flex">
                <Dropdown.Button
                  size="small"
                  disabled={disabled}
                  type="text"
                  menu={{
                    items: [
                      {
                        label: '添加条件组',
                        key: 'group',
                        onClick: () => {
                          add({
                            items: [
                              {
                                value: undefined,
                                field: undefined,
                                operator: 'eq',
                              },
                            ],
                            children: [],
                            connector: 'and',
                          });
                        },
                      },
                    ],
                  }}
                  onClick={handleAddCondition}
                >
                  <PlusOutlined />
                  &nbsp;添加条件
                </Dropdown.Button>
              </Form.Item>
            );

            return (
              <ConditionWrapper>
                {connectors.map((field, connectorIndex) => {
                  const _conditions = form.getFieldValue([...parentPath, connectorIndex, 'items']);
                  const children = form.getFieldValue([...parentPath, connectorIndex, 'children']);
                  const shouldConnectorHide = (_conditions?.length ?? 0) + (children?.length ?? 0) <= 1;

                  return (
                    <div className="flex items-center gap-2" key={field.key}>
                      <ConditionItem bordered={!isHeadDepth}>
                        <ConnectorWrapper hidden={shouldConnectorHide}>
                          <Form.Item
                            className="!mb-0"
                            label=""
                            name={[connectorIndex, 'connector']}
                            rules={[
                              {
                                required: true,
                                message: '连接符为必填',
                              },
                            ]}
                          >
                            <Select defaultValue="and" disabled={disabled} size="small" options={connectOptions} />
                          </Form.Item>
                        </ConnectorWrapper>

                        {/* 条件条目 */}
                        <ConditionGroup>
                          <ItemsWrapper>
                            <Form.List name={[connectorIndex, 'items']}>
                              {(items, { remove: removeCondition }) => (
                                <>
                                  <Items>
                                    {items.map((conditionItem, conditionIndex) => (
                                      <div key={conditionItem.key} className="flex gap-2 justify-between">
                                        <div className="flex gap-2 flex-1 items-start">
                                          <Form.Item
                                            label=""
                                            className="flex-1"
                                            name={[conditionIndex, 'field']}
                                            rules={[
                                              {
                                                required: true,
                                                message: '字段为必填',
                                              },
                                            ]}
                                          >
                                            <Select
                                              placeholder="请选择题目"
                                              disabled={disabled}
                                              style={{ width: '11rem' }}
                                              options={fieldOptions}
                                              onChange={(_field) => {
                                                const _input = questions.find((item) => item.value === _field);
                                                form.setFieldValue(
                                                  [...parentPath, connectorIndex, 'items', conditionIndex, 'value'],
                                                  undefined,
                                                );
                                                form.setFieldValue(
                                                  [...parentPath, connectorIndex, 'items', conditionIndex, 'operator'],
                                                  operatorMapping[_input!.type]?.[0].value,
                                                );
                                              }}
                                              popupMatchSelectWidth={false}
                                            />
                                          </Form.Item>
                                          <Form.Item noStyle shouldUpdate>
                                            {() => {
                                              const _field = form.getFieldValue([
                                                ...parentPath,
                                                connectorIndex,
                                                'items',
                                                conditionIndex,
                                                'field',
                                              ]);
                                              const _input = questions.find((item) => item.value === _field);

                                              return (
                                                <Form.Item
                                                  label=""
                                                  className="flex-1"
                                                  name={[conditionIndex, 'operator']}
                                                >
                                                  <Select
                                                    placeholder=""
                                                    disabled={disabled}
                                                    options={operatorMapping[_input?.type || QuestionType.String]}
                                                    popupMatchSelectWidth={false}
                                                  />
                                                </Form.Item>
                                              );
                                            }}
                                          </Form.Item>
                                          <Form.Item noStyle shouldUpdate>
                                            {() => {
                                              const _field = form.getFieldValue([
                                                ...parentPath,
                                                connectorIndex,
                                                'items',
                                                conditionIndex,
                                                'field',
                                              ]);
                                              const valueOptions =
                                                questions.find((item) => item.value === _field)?.options || [];

                                              return (
                                                <Form.Item
                                                  className="flex-1"
                                                  name={[conditionIndex, 'value']}
                                                  rules={[{ required: true, message: '选项值为必填' }]}
                                                >
                                                  <Select
                                                    placeholder="请选择选项"
                                                    disabled={disabled}
                                                    options={valueOptions}
                                                    onChange={handleConditionValueChange([
                                                      ...parentPath,
                                                      connectorIndex,
                                                      'items',
                                                      conditionIndex,
                                                    ])}
                                                    popupMatchSelectWidth={false}
                                                  />
                                                </Form.Item>
                                              );
                                            }}
                                          </Form.Item>
                                        </div>
                                        <div className="leading-8">
                                          <Button
                                            className="text-[var(--color-text-secondary)]"
                                            icon={<Icon component={DeleteIcon} />}
                                            type="text"
                                            disabled={disabled}
                                            size="small"
                                            onClick={() => !disabled && removeCondition(conditionItem.name)}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </Items>
                                </>
                              )}
                            </Form.List>
                          </ItemsWrapper>
                          <RecursiveCondition
                            name={[connectorIndex, 'children']}
                            parentPath={[...parentPath, connectorIndex, 'children']}
                          />
                        </ConditionGroup>
                      </ConditionItem>
                      {!isHeadDepth && (
                        <Button
                          size="small"
                          type="text"
                          disabled={disabled}
                          icon={<Icon component={DeleteIcon} />}
                          danger
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </div>
                  );
                })}

                {/* 没有条件时，需要显示「添加」按钮 */}
                {isHeadDepth && connectors.length === 0 && addition}
                {/* 顶部条件只存在一个，非顶部条件时显示「添加」按钮 */}
                {!isHeadDepth && addition}
              </ConditionWrapper>
            );
          }}
        </Form.List>
      )}
    </Form.Item>
  );
}
