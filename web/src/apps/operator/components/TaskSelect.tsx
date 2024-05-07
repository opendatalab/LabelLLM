import type { SelectProps } from 'antd';
import { Select, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from 'react-use';

import type { AuditTask, OperatorTask } from '../services/task';
import { getLabelTaskList } from '../services/task';
import { labelTaskKey } from '../constant/query-key-factories';
import CustomEmpty from './CustomEmpty';

interface TaskSelectOption {
  label: string;
  value: string;
  data: OperatorTask | AuditTask;
}

export interface TaskSelectProps extends SelectProps {
  afterSelect?: (task: OperatorTask | AuditTask) => void;
}

export default function TaskSelect({ afterSelect, onChange, ...props }: TaskSelectProps) {
  // 只支持任务名称搜索
  const [taskTitle, setTaskTitle] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  useDebounce(
    () => {
      setDebouncedValue(taskTitle);
    },
    500,
    [taskTitle],
  );

  const { data, isFetching } = useQuery({
    queryKey: labelTaskKey.list({ title: debouncedValue }),
    queryFn: async () =>
      getLabelTaskList({
        title: debouncedValue,
        page_size: 20,
      }),
  });

  const options: TaskSelectOption[] = useMemo(() => {
    return (
      data?.list.map((item) => {
        return {
          label: item.title,
          value: item.task_id,
          data: item,
        };
      }) ?? []
    );
  }, [data?.list]);

  const handleOnSearch = useCallback((_value: string) => {
    setTaskTitle(_value);
  }, []);

  const handleOnChange = useCallback(
    (_value: string, _option: TaskSelectOption) => {
      onChange?.(_value, _option);
      afterSelect?.(_option.data);
    },
    [onChange, afterSelect],
  );

  return (
    <Select
      showSearch
      filterOption={false}
      popupMatchSelectWidth={false}
      onSearch={handleOnSearch}
      onChange={handleOnChange as SelectProps['onChange']}
      placeholder="请输入任务名称进行搜索"
      notFoundContent={
        isFetching ? (
          <Spin className="w-full py-6" size="small" />
        ) : (
          <CustomEmpty className="py-6" description={taskTitle ? '未搜索到相应内容' : '输入任务名称开始搜索'} />
        )
      }
      {...props}
      options={options}
      className="w-full"
    />
  );
}
