import type { FormItemProps } from 'antd';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React from 'react';
import styled, { css } from 'styled-components';

import FancyInput from '../FancyInput';
import type { FancyInputParams } from '../FancyInput/types';

export interface FancyGroupProps {
  className?: string;
  disabled?: boolean;
  group: FancyInputParams[];
  value?: any;
  name?: NamePath;
}

export interface FancyFormItemProps extends FormItemProps {
  children: React.ReactNode;
}

const StyledGroupFormItem = styled<
  React.FC<
    FormItemProps & {
      layout?: 'vertical' | 'horizontal';
    }
  >
>(Form.Item)`
  ${({ layout }) =>
    layout === 'horizontal'
      ? css`
          .ant-form-item-control-input-content {
            display: flex;
          }
          .ant-form-item {
            margin-right: 0.5rem;
            margin-bottom: 0;

            &:last-child {
              margin-right: 0;
            }
          }
        `
      : ''}
`;

export const FancyGroup: React.FC<FancyGroupProps> = ({ group, disabled, value, name }) => {
  const form = Form.useFormInstance();

  if (!Array.isArray(group)) {
    // eslint-disable-next-line no-console
    console.warn('FancyGroup: group is not an array');

    return null;
  }

  return (
    <>
      {group.map((itemConfig) => {
        const {
          label,
          rules,
          type,
          children,
          key: someKey,
          field,
          initialValue,
          hidden,
          layout,
          dependencies,
          renderFormItem,
          tooltip,
          antProps,
          fieldProps,
          renderGroup,
        } = itemConfig;
        let finalName: NamePath = [field];

        if (!name) {
          finalName = [field];
        } else if (typeof field === 'undefined' || field === null) {
          finalName = name;
        } else if (Array.isArray(name)) {
          finalName = [...name, field];
        } else if (typeof name === 'string' && name !== '') {
          finalName = [name, field];
        } else {
          finalName = [field];
        }

        if (type === 'group' && Array.isArray(children)) {
          if (typeof renderGroup === 'function') {
            return renderGroup({ ...itemConfig, disabled }, form, finalName);
          }

          return (
            <StyledGroupFormItem
              key={someKey}
              layout={layout}
              label={label}
              rules={rules}
              preserve={false}
              initialValue={initialValue}
              hidden={hidden}
            >
              <FancyGroup key={someKey} disabled={disabled} group={children} value={value} name={finalName} />
            </StyledGroupFormItem>
          );
        }

        if (typeof renderFormItem !== 'function') {
          return (
            <Form.Item
              key={someKey}
              label={label}
              preserve={false}
              name={finalName}
              rules={rules}
              initialValue={initialValue}
              tooltip={tooltip}
              hidden={hidden}
              {...fieldProps}
            >
              <FancyInput disabled={disabled} {...itemConfig} {...antProps} fullField={finalName} key={someKey} />
            </Form.Item>
          );
        }

        return (
          <Form.Item noStyle shouldUpdate dependencies={dependencies} key={someKey}>
            {() => {
              let input: React.ReactNode = (
                <FancyInput {...itemConfig} {...antProps} disabled={disabled} fullField={finalName} key={someKey} />
              );

              if (typeof renderFormItem === 'function') {
                input = renderFormItem({ ...itemConfig, disabled }, form, finalName);

                if (!input) {
                  return null;
                }
              }

              return (
                <Form.Item
                  label={label}
                  preserve={false}
                  name={finalName}
                  tooltip={tooltip}
                  rules={rules}
                  initialValue={initialValue}
                  hidden={hidden}
                  {...fieldProps}
                >
                  {input}
                </Form.Item>
              );
            }}
          </Form.Item>
        );
      })}
    </>
  );
};
