import type { FormInstance } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { map, omit } from 'lodash/fp';

import { gid } from '@/utils/gid';

export function wrapWithId(item: any) {
  return {
    ...item,
    id: item.id || gid(),
  };
}

export const listOmitWithId = map(omit(['id']));

export const listWrapWithId = map(wrapWithId);

export const duplicatedValueValidator =
  (path: NamePath, index: number) =>
  ({ getFieldValue }: FormInstance) => ({
    validator(unused: any, _value: string) {
      const values = getFieldValue(path);

      for (let i = 0; i < values.length; i++) {
        if (i === index) {
          continue;
        }

        if (values[i].value === _value && _value !== undefined && _value !== '') {
          return Promise.reject(new Error('请勿填写重复值'));
        }
      }

      // 编辑通用标签时不需要再重复校验
      if (Array.isArray(path) && path.length === 1 && path[0] === 'attributes') {
        return Promise.resolve();
      }

      // 通用标签也不可重复
      const commonAttributes = getFieldValue('attributes');

      if (!commonAttributes) {
        return Promise.resolve();
      }

      for (let i = 0; i < commonAttributes.length; i++) {
        if (commonAttributes[i].value === _value && _value !== undefined && _value !== '') {
          return Promise.reject(new Error('不可与通用标签的value重复'));
        }
      }

      return Promise.resolve();
    },
  });
