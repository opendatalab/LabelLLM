import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { useRef, useState } from 'react';
import type { FormItemProps } from 'antd/lib/form';
import _ from 'lodash';

import { useScrollFetch } from '@/apps/operator/hooks/useScrollFetch';
import { gid } from '@/utils/gid';

export interface FancyEnumProps extends SelectProps {
  fieldProps: FormItemProps;
  antProps?: any;
  fullField?: any;
  queryFn?: (
    filterValue: string,
    refs: { totalRef: React.Ref<number>; pageNoRef: React.Ref<number> },
  ) => Promise<{ label: string; value: string }[]>;
}

export function FancyEnum(props: FancyEnumProps) {
  const { queryFn, onSearch, options, fieldProps, fullField, antProps, ...rest } = props;
  const [value, setValue] = useState<string>('');
  const totalRef = useRef<number>(0);
  const pageNoRef = useRef<number>(1);
  const extraClassName = useRef(gid());
  const popupClassName = rest.popupClassName
    ? `${rest.popupClassName} ${extraClassName.current}`
    : extraClassName.current;

  const [list, loading] = useScrollFetch(
    (isReset) => {
      if (!queryFn) {
        return Promise.resolve([]);
      }

      if (isReset) {
        pageNoRef.current = 1;
      }

      return queryFn?.(value, { totalRef, pageNoRef });
    },
    () => document.querySelector(`.${extraClassName.current} .rc-virtual-list-holder`),
    {
      isEnd: (allData) => _.size(allData) >= totalRef.current,
      threshold: 50,
      watch: [value],
    },
  );

  const handleSearch: SelectProps['onSearch'] = _.debounce((_value: string) => {
    setValue(_value);
    onSearch?.(_value);
  }, 500);

  const handleResetSearch = () => {
    setValue('');
  };

  const _options = options || list;

  return (
    <Select
      loading={loading}
      optionFilterProp={queryFn ? 'label' : undefined}
      {...rest}
      options={_options}
      onBlur={handleResetSearch}
      popupClassName={popupClassName}
      onSearch={handleSearch}
    />
  );
}
