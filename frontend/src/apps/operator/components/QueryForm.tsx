import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import type { FormInstance, FormProps } from 'antd';
import { Button, Form } from 'antd';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import _ from 'lodash';

import { FancyGroup } from '@/components/FancyGroup';
import type { FancyInputParams } from '@/components/FancyInput/types';

export interface QueryFormProps extends Omit<FormProps, 'form'> {
  template: FancyInputParams[];
  trigger?: 'change' | 'click';
  showSearch?: boolean;
  searchText?: string;
  initialParams?: Record<string, string>;
  className?: string;
  onSearch?: (values: Record<string, string>) => void;
  extra?: React.ReactNode;
}

function QueryForm(
  {
    template = [],
    showSearch = true,
    layout = 'inline',
    onSearch,
    searchText = '搜索',
    initialParams = {},
    extra,
    className,
    ...rest
  }: QueryFormProps,
  ref: React.Ref<FormInstance<any>>,
) {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams(initialParams);
  const fields = useMemo(() => template.map((item) => item.field), [template]);

  useImperativeHandle(ref, () => form);
  const handleSearch = (values: Record<string, string>) => {
    fields.forEach((field) => {
      if (!_.isEmpty(values[field])) {
        searchParams.set(field, values[field]);
      } else {
        searchParams.delete(field);
      }
    });

    // reset page
    searchParams.set('page', '1');
    setSearchParams(searchParams);
    onSearch?.(Object.fromEntries(searchParams.entries()));
  };

  const initialValues = useMemo(() => {
    const fieldsMapping = Object.fromEntries(template.map((item) => [item.field, item]));
    const _initialParams = Object.fromEntries(searchParams.entries());

    Object.entries(_initialParams).forEach(([key, value]) => {
      if (
        fieldsMapping[key]?.type === 'enum' &&
        typeof value === 'string' &&
        fieldsMapping[key]?.antProps?.mode === 'multiple'
      ) {
        // @ts-ignore
        _initialParams[key] = value.split(',');
      }
    });

    return _initialParams;
  }, []);

  return (
    <div className={clsx('flex justify-between w-full', className)}>
      <Form form={form} layout={layout} onFinish={handleSearch} {...rest} initialValues={initialValues}>
        <FancyGroup group={template} />
        {showSearch && (
          <Form.Item>
            <Button onClick={form.submit} type="primary">
              {searchText}
            </Button>
          </Form.Item>
        )}
      </Form>
      {extra}
    </div>
  );
}

export default forwardRef(QueryForm);
