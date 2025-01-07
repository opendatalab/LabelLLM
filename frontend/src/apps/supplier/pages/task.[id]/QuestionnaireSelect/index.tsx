import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { ERecordStatus, getTaskDataIds } from '@/apps/supplier/services/task';
import { EKind, useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { FormattedMessage, useIntl } from 'react-intl';

const QuestionnaireSelect = ({ data_id, questionnaire_id }: { data_id?: string; questionnaire_id?: string }) => {
  const { formatMessage } = useIntl();
  const { urlState, taskId, setUrlState } = useTaskParams();
  const { data } = useQuery({
    queryKey: ['getTaskDataIds', taskId, questionnaire_id],
    queryFn: async () =>
      getTaskDataIds({
        task_id: taskId!,
        questionnaire_id: questionnaire_id,
        record_status: urlState.record_status === ERecordStatus.invalid ? ERecordStatus.invalid : undefined,
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
      <span>
        <FormattedMessage id={'task.question.switch.sub'} />：
      </span>
      <Select
        showSearch
        placeholder={formatMessage({ id: 'task.question.switch.sub.placeholder' })}
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
