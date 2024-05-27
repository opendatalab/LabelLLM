import type { AffixProps, ButtonProps } from 'antd';
import { Affix, InputNumber, Button, Form, Input, Tag, Tooltip, Tree, Switch } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { filter, isEqual, set, size, update } from 'lodash/fp';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import Icon, { PlusOutlined, StarFilled, SwapOutlined } from '@ant-design/icons';
import _ from 'lodash';

import type { FancyInputProps } from '@/components/FancyInput/types';
import { bfsEach } from '@/apps/operator/utils/bfsEach';
import type { ConditionContent, ConditionItem } from '@/apps/supplier/services/task';

import { ReactComponent as TreeSwitcherIcon } from './svgs/tree-switcher.svg';
import { ReactComponent as DeleteIcon } from './svgs/delete.svg';
import { duplicatedValueValidator, wrapWithId } from '../utils';
import { QuestionType } from './types';
import type { QuestionItem, QuestionOption } from './types';
import TagSwitcher from './TagSwitcher';
import Condition from './Condition';

export interface QuestionEditorProps extends FancyInputProps {
  disabled?: boolean;
  value: QuestionItem[];
  defaultValue?: QuestionItem[];
  onChange?: (value: QuestionItem[]) => void;
  className?: string;
  style?: React.CSSProperties;
  affixProps?: AffixProps;
  addTagText?: string;
  addStringText?: string;
  showAddTag?: boolean;
  showAddString?: boolean;
  disabledStringOptions?: string[];
  // 审核题目有一个预设的默认维度，不可编辑也不可删除，但是需要在自定义维度中的条件设置中可选择
  hideFirst?: boolean;
}

export interface QuestionEditorRef {
  addCategory: (cateType: QuestionType) => () => void;
  removeCategory: (category: QuestionItem) => () => void;
}

// ====================== style ======================
const StyledTree = styled<React.FC<TreeProps>>(Tree)`
  ${({ treeData }: TreeProps) =>
    treeData &&
    treeData.length > 0 &&
    css`
      margin-bottom: 1rem;
    `}

  .ant-tree-switcher {
    /* height: 1.5rem; */
  }
  .ant-tree-treenode {
    padding-left: 0.6rem;
    position: relative;
    padding-bottom: 0;
    margin-bottom: 0.5rem;
  }
  .ant-tree-node-content-wrapper {
    &:hover {
      background-color: transparent;
    }

    cursor: default;
  }

  .category {
    display: flex;
    align-items: baseline;
  }

  .option {
    display: flex;
    align-items: baseline;
  }

  .sn {
    position: absolute;
    top: 0.3rem;
    left: -2rem;
  }

  .icon {
    font-size: 2rem !important;
  }

  .category .ant-form-item,
  .option .ant-form-item {
    margin-bottom: 0;
    flex-grow: 1;
    margin-right: 0.5rem;
  }

  .add-option {
    padding-left: 0;
    margin-bottom: 0.5rem;
  }

  .remove {
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-error);
    }
  }

  .multiple-switcher {
    cursor: pointer;
  }

  .text-form-wrapper {
    .ant-form-item {
      margin-bottom: 0.5rem;
    }
    .ant-form-item-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .ant-form-item-control {
      min-height: auto;
      width: 100%;
    }
  }

  .should-align-center {
    display: flex;
    align-items: center;
  }

  .ant-badge-count {
    color: var(--color-text);
  }
`;

export const StyledEditorWrapper = styled.div`
  .buttons {
    background-color: #fff;
  }
`;

const StyledStar = styled<React.FC<ButtonProps & { active: boolean }>>(Button)`
  color: ${(props) => (props.active ? 'var(--color-warning)' : 'var(--color-text-secondary)')} !important;

  &:hover .star-icon,
  &:active .star-icon {
    color: ${(props) => (props.active ? 'var(--color-warning)' : 'var(--color-text-secondary)')};
  }
`;

// ======================= end =======================

const tagTitleMapping: Record<QuestionType, string> = {
  [QuestionType.Enum]: '单选',
  [QuestionType.Array]: '多选',
  [QuestionType.String]: '文本',
};

const tooltipTitleMapping: Record<QuestionType, string> = {
  [QuestionType.Enum]: '切换多选',
  [QuestionType.Array]: '切换单选',
  [QuestionType.String]: '文本描述',
};

const QuestionEditor = forwardRef<QuestionEditorRef, QuestionEditorProps>(function ForwardRefQuestionEditor(
  {
    disabled,
    defaultValue = [],
    value,
    fullField = [],
    onChange,
    className,
    style,
    affixProps,
    addTagText = '选择题',
    addStringText = '文本题',
    showAddTag = true,
    showAddString = true,
    hideFirst,
  },
  ref,
) {
  const [stateValue, setValue] = useState<QuestionItem[]>(defaultValue);

  const handleOnChange = useCallback(
    (fieldPath: string) =>
      (changedValue: string | number | boolean | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null) => {
        const targetValue = ['string', 'number', 'boolean'].includes(typeof changedValue)
          ? changedValue
          : changedValue === null
          ? ''
          : (changedValue as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>).target.value;

        const newValue = set(fieldPath)(targetValue)(stateValue);
        setValue(newValue);
        onChange?.(newValue);
      },
    [onChange, stateValue],
  );

  const handleValueOnChange = useCallback(
    (fieldPath: string) => (changedValue: React.ChangeEvent<HTMLInputElement> | null) => {
      let newValue = set(fieldPath)(changedValue?.target.value || '')(stateValue);
      const questionId = _.get(stateValue, fieldPath.split('.').slice(0, -1).join('.')).id;

      // 更新所有受影响的条件
      for (let i = 0; i < stateValue.length; i += 1) {
        const item = stateValue[i];

        if (item.conditions) {
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          bfsEach<ConditionItem>(item.conditions, (_item, _i, _input, path) => {
            for (let j = 0; j < _item.items.length; j += 1) {
              if (_item.items[j].question_id === questionId) {
                newValue = set([i, 'conditions', ...path, 'items', j, 'field'])(changedValue?.target.value || '')(
                  newValue,
                );
              }
            }
          });
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  const handleOptionValueChange = useCallback(
    (fieldPath: string) => (changedValue: React.ChangeEvent<HTMLInputElement> | null) => {
      let newValue = set(fieldPath)(changedValue?.target.value || '')(stateValue);
      const optionId = _.get(stateValue, fieldPath.split('.').slice(0, -1).join('.')).id;

      // 更新所有受影响的条件
      for (let i = 0; i < stateValue.length; i += 1) {
        const item = stateValue[i];

        if (item.conditions) {
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          bfsEach<ConditionItem>(item.conditions, (_item, _i, _input, path) => {
            for (let j = 0; j < _item.items.length; j += 1) {
              const condition = _item.items[j];

              if (condition.option_id === optionId) {
                newValue = set([i, 'conditions', ...path, 'items', j, 'value'])(changedValue?.target.value || '')(
                  newValue,
                );
              }
            }
          });
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  // 新建分类属性：文本描述或分类属性
  const handleAddAttribute = useCallback(
    (cateType: QuestionType) => () => {
      const newAttribute =
        cateType === QuestionType.Enum
          ? wrapWithId({
              label: '',
              value: '',
              type: cateType,
              required: true,
              options: [],
            })
          : wrapWithId({
              label: '',
              value: '',
              type: cateType,
              required: true,
              default_value: '',
            });
      const newValue = [...stateValue, newAttribute];

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  const handleRemoveQuestion = useCallback(
    (question: QuestionItem) => () => {
      let newValue = stateValue.filter((item) => item.id !== question.id);

      // 删除所有受影响的条件
      for (let i = 0; i < newValue.length; i += 1) {
        const item = newValue[i];

        if (item.conditions) {
          newValue = update([i, 'conditions'])(
            filter((condition: ConditionContent) => condition.question_id !== question.id),
          )(newValue);
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  const handleAddOption = useCallback(
    (cateIndex: number) => () => {
      const newOption = wrapWithId({
        label: '',
        value: '',
      });
      const newValue = update(`[${cateIndex}]`)((cate) => {
        return {
          ...cate,
          options: [...cate.options, newOption],
        };
      })(stateValue);

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  const handleRemoveOption = useCallback(
    (cateIndex: number, option: QuestionItem) => () => {
      let newValue = update(`[${cateIndex}].options`)(filter((item: QuestionOption) => item.id !== option.id))(
        stateValue,
      );

      // 删除所有受影响的条件
      for (let i = 0; i < newValue.length; i += 1) {
        const item = newValue[i];

        if (item.conditions) {
          newValue = update([i, 'conditions'])(
            filter((condition: ConditionContent) => condition.option_id !== option.id),
          )(newValue);
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  const handleToggleDefault = useCallback(
    (cateIndex: number, optionIndex: number) => () => {
      if (disabled) {
        return;
      }
      const newValue = update(`[${cateIndex}].options[${optionIndex}].is_default`)((isDefault: boolean) => {
        return !isDefault;
      })(stateValue);

      // isMultiple true，可以有多个默认值
      if ((newValue[cateIndex].type as QuestionType) === QuestionType.Enum) {
        for (let i = 0; i < size(stateValue[cateIndex].options); i++) {
          if (i !== optionIndex) {
            newValue[cateIndex].options[i].is_default = false;
          }
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [disabled, onChange, stateValue],
  );

  const handleToggleMultiple = useCallback(
    (cateIndex: number) => () => {
      let newValue = update(`[${cateIndex}].type`)((itemType: QuestionType) => {
        return itemType === QuestionType.Enum ? QuestionType.Array : QuestionType.Enum;
      })(stateValue) as QuestionItem[];

      // 如果 isMultiple 由 true 变为 false，需要把所有 isDefault 为 true 的选项都变为 false
      if ((newValue[cateIndex].type as QuestionType) === QuestionType.Enum) {
        for (let i = 0; i < size(newValue[cateIndex].options); i++) {
          newValue = set(`[${cateIndex}].options[${i}].is_default`)(false)(newValue);
        }
      }

      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, stateValue],
  );

  // 暴露添加函数
  useImperativeHandle(
    ref,
    () => ({
      addCategory: handleAddAttribute,
      removeCategory: handleRemoveQuestion,
    }),
    [handleAddAttribute, handleRemoveQuestion],
  );

  // 给所有选项加上 id
  useEffect(() => {
    if (!Array.isArray(value) || isEqual(value)(stateValue)) {
      return;
    }

    setValue(value);
  }, [stateValue, value]);

  const makeTreeData = useCallback(
    (input: QuestionItem[], path: NamePath, preIndex?: number): DataNode[] => {
      if (!Array.isArray(input)) {
        // eslint-disable-next-line no-console
        console.warn('makeTreeData: input is not an array');
        return [];
      }

      return input.map((item, index) => {
        const itemType = item.type as QuestionType;
        const otherValueFields: NamePath[] = [];

        input.forEach((_item, inputIndex) => {
          if (inputIndex !== index) {
            otherValueFields.push([...path, inputIndex, 'value']);
          }
        });

        if (Array.isArray(item.options) && [QuestionType.Enum, QuestionType.Array].includes(itemType)) {
          return {
            className: hideFirst && index === 0 ? '!hidden' : '',
            title: (
              <div className="category">
                <div className="sn">{hideFirst ? index : index + 1}</div>
                <Form.Item name={[...path, index, 'label']} rules={[{ required: true, message: '请填写完整' }]}>
                  <Input
                    disabled={disabled}
                    placeholder={`题目/前端显示（中文）`}
                    onChange={handleOnChange(`[${index}].label`)}
                  />
                </Form.Item>
                <Form.Item
                  name={[...path, index, 'value']}
                  dependencies={otherValueFields}
                  // @ts-ignore
                  rules={[{ required: true, message: '请填写完整' }, duplicatedValueValidator(path, index)]}
                >
                  <Input
                    disabled={disabled}
                    placeholder={`保存结果（英文）`}
                    onChange={handleValueOnChange(`[${index}].value`)}
                  />
                </Form.Item>

                <Tooltip title={tooltipTitleMapping[itemType]}>
                  <Tag className="cursor-pointer" onClick={!disabled ? handleToggleMultiple(index) : undefined}>
                    {tagTitleMapping[itemType]} <SwapOutlined />
                  </Tag>
                </Tooltip>
                <div className="flex items-center">
                  <Tooltip title="是否必填">
                    <Form.Item className="!grow-0" name={[...path, index, 'required']} label="">
                      <TagSwitcher
                        disabled={disabled}
                        titleMapping={{
                          true: '必填',
                          false: '选填',
                        }}
                        onChange={handleOnChange(`[${index}].required`)}
                      />
                    </Form.Item>
                  </Tooltip>

                  <Form.Item className="!grow-0" shouldUpdate name={[...path, index, 'conditions']}>
                    <Condition disabled={disabled} parentField={fullField} index={index} />
                  </Form.Item>
                  <Tooltip title="删除">
                    <Button
                      className="text-[var(--color-text-secondary)]"
                      icon={<Icon component={DeleteIcon} />}
                      type="text"
                      size="small"
                      onClick={!disabled ? handleRemoveQuestion(item) : undefined}
                    />
                  </Tooltip>
                </div>
              </div>
            ),
            key: item.id,
            children: [
              // @ts-ignore
              ...makeTreeData(item.options, [...path, index, 'options'], index),
              {
                key: `${item.id}-add`,
                title: (
                  <Button
                    disabled={disabled}
                    className="add-option"
                    icon={<PlusOutlined />}
                    type="link"
                    onClick={handleAddOption(index)}
                  >
                    新建选项
                  </Button>
                ),
              },
            ],
          };
        } else if (itemType === QuestionType.String) {
          return {
            title: (
              <div className="category">
                <div className="sn">{hideFirst ? index : index + 1}</div>
                <Form.Item name={[...path, index, 'label']} rules={[{ required: true, message: '请填写完整' }]}>
                  <Input
                    disabled={disabled}
                    placeholder={`题目/前端显示（中文）`}
                    onChange={handleOnChange(`[${index}].label`)}
                  />
                </Form.Item>
                <Form.Item
                  name={[...path, index, 'value']}
                  dependencies={otherValueFields}
                  // @ts-ignore
                  rules={[{ required: true, message: '请填写完整' }, duplicatedValueValidator(path, index)]}
                >
                  <Input
                    disabled={disabled}
                    placeholder={`保存结果（英文）`}
                    onChange={handleOnChange(`[${index}].value`)}
                  />
                </Form.Item>

                <Tag>{tagTitleMapping[itemType]}</Tag>
                <div className="flex items-center">
                  <Tooltip title="是否必填">
                    <Form.Item className="!grow-0" name={[...path, index, 'required']} label="">
                      <TagSwitcher
                        disabled={disabled}
                        titleMapping={{
                          true: '必填',
                          false: '选填',
                        }}
                        onChange={handleOnChange(`[${index}].required`)}
                      />
                    </Form.Item>
                  </Tooltip>
                  <Form.Item className="!grow-0" shouldUpdate name={[...path, index, 'conditions']}>
                    <Condition disabled={disabled} parentField={fullField} index={index} />
                  </Form.Item>
                  <Tooltip title="删除">
                    <Button
                      className="text-[var(--color-text-secondary)]"
                      icon={<Icon component={DeleteIcon} />}
                      type="text"
                      size="small"
                      onClick={!disabled ? handleRemoveQuestion(item) : undefined}
                    />
                  </Tooltip>
                </div>
              </div>
            ),
            key: item.id,
            children: [
              {
                key: `${item.id}-string`,
                title: (
                  <div className="text-form-wrapper">
                    {/* @ts-ignore */}
                    <Form.Item
                      name={[...path, index, 'is_preview_expanded']}
                      valuePropName="checked"
                      label="预览默认展开"
                    >
                      <Switch disabled={disabled} />
                    </Form.Item>
                    <Form.Item name={[...path, index, 'is_upload_available']} valuePropName="checked" label="附件上传">
                      <Switch disabled={disabled} />
                    </Form.Item>
                    <Form.Item name={[...path, index, 'max_length']} label="最大字数">
                      <InputNumber
                        disabled={disabled}
                        style={{ width: '71.5%' }}
                        min={1}
                        onChange={handleOnChange(`[${index}].max_length`)}
                      />
                    </Form.Item>
                    <Form.Item name={[...path, index, 'default_value']} label="默认值">
                      <Input.TextArea
                        disabled={disabled}
                        style={{ width: '71.5%' }}
                        onChange={handleOnChange(`[${index}].default_value`)}
                      />
                    </Form.Item>
                  </div>
                ),
              },
            ],
          };
        }

        return {
          title: (
            <div className="option">
              <Form.Item
                name={[...path, index, 'label']}
                // @ts-ignore
                rules={[{ required: true, message: '请填写完整' }]}
              >
                <Input
                  disabled={disabled}
                  placeholder={`选项/前端显示（中文）`}
                  onChange={handleOnChange(`[${preIndex}]options[${index}].label`)}
                />
              </Form.Item>
              <Form.Item
                name={[...path, index, 'value']}
                // @ts-ignore
                rules={[{ required: true, message: '请填写完整' }, duplicatedValueValidator(path, index)]}
              >
                <Input
                  disabled={disabled}
                  placeholder={`保存结果（英文）`}
                  onChange={handleOptionValueChange(`[${preIndex}]options[${index}].value`)}
                />
              </Form.Item>
              <Tooltip title="设为默认值">
                <StyledStar
                  active={Boolean(item.is_default)}
                  icon={<StarFilled />}
                  size="small"
                  type="text"
                  onClick={handleToggleDefault(preIndex!, index)}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Button
                  className="text-[var(--color-text-secondary)]"
                  icon={<Icon component={DeleteIcon} />}
                  type="text"
                  size="small"
                  onClick={disabled ? undefined : handleRemoveOption(preIndex!, item)}
                />
              </Tooltip>
            </div>
          ),
          key: item.id,
        };
      });
    },
    [
      disabled,
      handleOnChange,
      handleOptionValueChange,
      handleToggleDefault,
      handleRemoveOption,
      hideFirst,
      handleValueOnChange,
      handleToggleMultiple,
      fullField,
      handleRemoveQuestion,
      handleAddOption,
    ],
  );

  const treeData = useMemo(() => makeTreeData(stateValue, fullField), [fullField, makeTreeData, stateValue]);
  const buttons = (
    <div className="buttons">
      {showAddTag && (
        <Button
          disabled={disabled}
          className="add"
          icon={<PlusOutlined />}
          type="primary"
          ghost
          onClick={handleAddAttribute(QuestionType.Enum)}
        >
          {addTagText}
        </Button>
      )}
      {showAddString && (
        <Button
          disabled={disabled}
          className="add ml-2"
          icon={<PlusOutlined />}
          type="primary"
          ghost
          onClick={handleAddAttribute(QuestionType.String)}
        >
          {addStringText}
        </Button>
      )}
    </div>
  );

  return (
    <StyledEditorWrapper className={className} style={style}>
      <StyledTree
        treeData={treeData}
        selectable={false}
        blockNode
        switcherIcon={<Icon className="icon" component={TreeSwitcherIcon} />}
      />
      {affixProps ? <Affix {...affixProps}>{buttons}</Affix> : buttons}
    </StyledEditorWrapper>
  );
});

export default QuestionEditor;
