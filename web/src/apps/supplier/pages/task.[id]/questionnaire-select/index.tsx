import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { getTaskDataIds } from '@/apps/supplier/services/task';
import { EKind, useTaskParams } from '@/apps/supplier/hooks/useTaskParams';

const QuestionnaireSelect = ({ data_id, questionnaire_id }: { data_id?: string; questionnaire_id?: string }) => {
  const { urlState, taskId, setUrlState } = useTaskParams();
  const { data } = useQuery({
    queryKey: ['getTaskDataIds', taskId, questionnaire_id],
    queryFn: async () =>
      getTaskDataIds({
        task_id: taskId!,
        questionnaire_id: questionnaire_id,
      }),
    enabled: urlState.kind === EKind.with_duplicate && !!questionnaire_id,
  });
  if (urlState.kind !== EKind.with_duplicate) {
    return null;
  }

  const options = data?.data?.map((item) => ({
    value: item,
    label: item,
  }));
  return (
    <div>
      <span>切换子题：</span>
      <Select
        showSearch
        placeholder="选择题目 ID"
        value={urlState.data_id || data_id}
        style={{ width: 330 }}
        options={options}
        onChange={(v) => {
          setUrlState({ data_id: v });
        }}
      />
    </div>
  );
};

export default QuestionnaireSelect;
