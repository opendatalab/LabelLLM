import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Button, Input, Segmented, Select, Space, Tag, Tooltip } from 'antd';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';

import { EKind, EQueryQuestionType, useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';
import CheckTaskType from '@/apps/supplier/pages/task.[id]/CheckTaskType';
import type { IPreviewIdParams, IPreviewIdRRes } from '@/apps/supplier/services/task';
import {
  ERecordStatus,
  getLabelRecord,
  getPreviewId,
  getLabelTaskUserList,
  getAuditTaskUserList,
  getLabelDataId,
  getAuditDataId,
} from '@/apps/supplier/services/task';
import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';
import CustomizeQuestion from '@/apps/supplier/pages/task.[id]/CustomizeQuestion';
import { useStoreIds } from '@/hooks/useStoreIds';
import { message } from '@/components/StaticAnt';

import PluginSet from '../PluginSet';
import { FormattedMessage, useIntl } from 'react-intl';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  loading?: boolean;
  onChangeTheQuestion?: (t: string) => Promise<void>;
}

/**
 * 普通任务 + 普通任务预览
 *
 * 任务预览  1. 全部题目 2.某个标注员做得题目
 *
 * */

const { Search } = Input;

const HeaderWrapper: React.FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <div className="h-[var(--header-height)] flex-shrink-0 flex items-center justify-between border-0 border-solid border-b border-borderSecondary text-xl px-8">
      {children}
    </div>
  );
};

const tagText: Record<string, string> = {
  [ERouterTaskType.preview]: '预览',
  [ERouterTaskType.review]: '单题查看模式',
  [ERouterTaskType.reviewTask]: '查看',
};

const Title: React.FC<PropsWithChildren<{ title: string; type: ERouterTaskType; tag?: string | false }>> = ({
  title,
  type,
  tag,
}) => {
  const text = tagText[type];
  return (
    <div className="flex items-center">
      <span className="font-bold">{title}</span>
      {text && (
        <Tag className="ml-2 !font-medium" color="success">
          {tag || text}
        </Tag>
      )}
    </div>
  );
};

const QuestionOptions = ({
  value,
  isLoading,
  mutateAsync,
}: {
  value: EQueryQuestionType;
  isLoading: boolean;
  mutateAsync: UseMutateAsyncFunction<IPreviewIdRRes, unknown, IPreviewIdParams, unknown>;
}) => {
  const { formatMessage } = useIntl();
  const { urlState, type, taskId, setUrlState } = useTaskParams();

  const { getIds } = useStoreIds();

  // 源题查看模式
  const isWithDuplicate = EKind.with_duplicate === urlState.kind;

  const onSearch = async (v: string) => {
    if (v === 'all') {
      setUrlState({ record_status: undefined, data_id: undefined, questionnaire_id: undefined, user_id: undefined });
      return;
    }
    if ([ERecordStatus.completed, ERecordStatus.discarded, ERecordStatus.invalid].includes(v as ERecordStatus)) {
      const d = await mutateAsync({
        task_id: taskId as string,
        data_id: urlState.data_id,
        user_id: urlState.user_id,
        questionnaire_id: urlState.questionnaire_id,
        kind: urlState.kind, // 是否是源题模式
        pos_locate: 'current',
        record_status: v as ERecordStatus,
      });
      if (!d || !d.data_id) {
        message.error(formatMessage({ id: 'task.error.msg1' }));
        return;
      }
      setUrlState({
        record_status: v,
        data_id: d?.data_id,
        questionnaire_id: EKind.with_duplicate === urlState.kind ? d?.questionnaire_id : undefined,
      });
      return;
    }
    // 缓存里面读取
    setUrlState({
      record_status: v,
      data_id: getIds('data_id')[0] || undefined,
      questionnaire_id: undefined,
    });
  };

  // 是否是全部审核题目
  const isReviewAudits = ERouterTaskType.reviewAudits === type;
  const options = isReviewAudits
    ? [
        { value: 'all', label: formatMessage({ id: 'task.question.all' }) },
        { value: ERecordStatus.customize, label: formatMessage({ id: 'task.question.scope' }) },
      ]
    : [
        { value: 'all', label: formatMessage({ id: 'task.question.all' }) },
        ...(isWithDuplicate
          ? []
          : [
              // 单题查看模式
              { value: ERecordStatus.completed, label: '仅看已达标' },
              { value: ERecordStatus.discarded, label: '仅看未达标' },
            ]),
        { value: ERecordStatus.invalid, label: formatMessage({ id: 'task.question.question' }) },
        { value: ERecordStatus.customize, label: formatMessage({ id: 'task.question.scope' }) },
      ];

  return (
    <Select
      size="small"
      variant="borderless"
      loading={isLoading}
      onChange={onSearch}
      value={value || 'all'}
      popupMatchSelectWidth={false}
      options={options}
    />
  );
};

// 渲染用户列表
const UserList = () => {
  const { formatMessage } = useIntl();
  const { urlState, taskId, setUrlState, flow_index, type } = useTaskParams();

  const isLabel = [ERouterTaskType.reviewTask, ERouterTaskType.review].includes(type);

  const { data } = useQuery({
    queryKey: ['getLabelTaskUserList', taskId],
    queryFn: () =>
      isLabel
        ? getLabelTaskUserList({ task_id: taskId as string, inlet: urlState.inlet })
        : getAuditTaskUserList({ task_id: taskId as string, flow_index, inlet: urlState.inlet }),
  });
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-normal">
        {isLabel ? (
          <FormattedMessage id="task.detail.audit.annotator" />
        ) : (
          <FormattedMessage id="task.detail.audit.auditor" />
        )}
      </span>
      <Select
        popupMatchSelectWidth={false}
        value={urlState.user_id}
        onChange={(v) => setUrlState({ data_id: undefined, questionnaire_id: undefined, user_id: v })}
        options={data?.list}
        fieldNames={{ label: 'username', value: 'user_id' }}
        style={{ minWidth: 150 }}
        placeholder={formatMessage({ id: 'common.select' })}
        // mode="multiple"
        optionFilterProp="username"
        allowClear
        showSearch
        maxTagCount="responsive"
      />
    </div>
  );
};

// reviewAudit 和 reviewTask 模式
function ReviewAuditAndReviewTask({ title }: { title: string }) {
  const { formatMessage } = useIntl();
  const { urlState, taskId, setUrlState, flow_index, type } = useTaskParams();
  const { plugins, data_id } = useDatasetsContext();
  const isPlugin = !!plugins?.length;

  const isLabel = ERouterTaskType.reviewTask === type;

  const { mutate, isPending } = useMutation({
    mutationFn: isLabel ? getLabelDataId : getAuditDataId,
    onSuccess: (d, param) => {
      if (!d.data_id) {
        return message.warning(formatMessage({ id: 'task.error.msg1' }));
      }
      setUrlState({ data_id: d.data_id, record_status: param.record_status });
    },
  });

  const getDataId = async (record_status: string, pos_locate: 'prev' | 'next' | 'current') => {
    if (record_status === 'all') {
      setUrlState({ data_id: undefined, record_status: undefined });
      return;
    }
    const data = {
      task_id: taskId as string,
      flow_index,
      user_id: urlState.user_id,
      data_id: urlState.data_id || data_id,
      record_status: record_status as ERecordStatus,
      inlet: urlState.inlet,
      pos_locate,
    };
    mutate(data);
  };

  return (
    <HeaderWrapper>
      <div className="flex items-center">
        <Title title={title} type={type} />
        <Select
          loading={isPending}
          variant="borderless"
          value={urlState.record_status || 'all'}
          popupMatchSelectWidth={false}
          onChange={(v) => getDataId(v, 'current')}
          options={[
            ...(ERouterTaskType.reviewTask === type
              ? [
                  { label: formatMessage({ id: 'task.question.all1' }), value: 'all', disabled: false },
                  {
                    label: <FormattedMessage id={'task.hint3'} />,
                    value: ERecordStatus.discarded,
                  },
                ]
              : [
                  { label: formatMessage({ id: 'task.question.all2' }), value: 'all', disabled: false },
                  { label: <FormattedMessage id="task.manage.total.audit.approved" />, value: 'approved' },
                  { label: <FormattedMessage id="task.manage.total.audit.not.approved" />, value: 'rejected' },
                  {
                    label: <FormattedMessage id={'task.hint4'} />,
                    value: 'discarded',
                  },
                ]),
          ]}
        />
      </div>
      <Space>
        <UserList />
        <span className="text-quaternary font-normal mx-2">/</span>
        <div className="flex items-center space-x-2">
          <Button type="primary" onClick={() => getDataId(urlState.record_status, 'prev')}>
            <FormattedMessage id={'common.prev'} />
          </Button>
          <Button type="primary" onClick={() => getDataId(urlState.record_status, 'next')}>
            <FormattedMessage id={'common.next'} />
          </Button>
        </div>
        {isPlugin && <span className="text-quaternary font-normal mx-2">/</span>}
        <PluginSet />
      </Space>
    </HeaderWrapper>
  );
}

/**
 * Header component for the task page.
 * @param title - The title of the task.
 * @param loading - Indicates whether the task is currently loading.
 * @param onChangeTheQuestion - Callback function to handle the "Next" button click.
 */
const Header: React.FC<PropsWithChildren<IProps>> = ({ title, loading, onChangeTheQuestion }) => {
  const { type, taskId, urlState, setUrlState } = useTaskParams();
  const { plugins, data_id: current_data_id } = useDatasetsContext();
  const { formatMessage } = useIntl();
  const { getIds, nextId } = useStoreIds();

  const { data } = useQuery({
    queryKey: ['getLabelRecord', taskId, type],
    queryFn: async () => {
      const sendData = {
        task_id: taskId as string,
        status: ERecordStatus.discarded,
        user_id: urlState.user_id,
        page: 1,
        page_size: 0,
        flow_index: urlState.flow_index,
      };
      if (type === ERouterTaskType.reviewTask) {
        return await getLabelRecord(sendData);
      }
    },
    enabled: [ERouterTaskType.reviewTask].includes(type),
  });

  const onSearch = (key: string, value?: string | number) => {
    setUrlState({ [key]: value || undefined });
  };

  // 点击换一题
  const changeTheQuestion = async () => {
    if (urlState.data_id || urlState.questionnaire_id) {
      setUrlState({ data_id: undefined, questionnaire_id: undefined });
      return;
    }
    await onChangeTheQuestion?.('next');
  };

  const { mutateAsync, isPending: isLoading } = useMutation({
    mutationFn: getPreviewId,
  });

  const isWithDuplicate = EKind.with_duplicate === urlState.kind;

  const setCustomizeIds = (v: string) => {
    // 自定义题目范围 如果是源题模式 切换上一题下一题的时候 data_id 需要清空
    const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
    const d = isWithDuplicate ? { data_id: undefined } : {};
    setUrlState({
      [key]: v,
      ...d,
    });
  };

  // 获取有问题的题目和自定义题目
  const onGetProblemCustomize = async (pos_locate: 'prev' | 'next') => {
    if (urlState.record_status === ERecordStatus.customize) {
      const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
      const id = nextId(urlState[key], key, pos_locate === 'next' ? 1 : -1);
      if (!id) {
        return;
      }
      setCustomizeIds(id);
    } else {
      const d = await mutateAsync({
        task_id: taskId as string,
        data_id: current_data_id,
        questionnaire_id: urlState.questionnaire_id,
        kind: urlState.kind, // 是否是源题模式
        record_status: urlState.record_status,
        user_id: urlState.user_id,
        pos_locate,
      });
      if (!d.data_id || !d.questionnaire_id) {
        return message.warning(formatMessage({ id: 'task.error.msg1' }));
      }
      setUrlState({
        data_id: d?.data_id,
        questionnaire_id: d?.questionnaire_id,
      });
    }
  };

  // 是否开启插件
  const isPlugin = !!plugins?.length;

  // 1.任务预览-某个标注员做得题目
  if ([ERouterTaskType.reviewTask].includes(type) && urlState.user_id) {
    return <ReviewAuditAndReviewTask title={title} />;
  }

  // 2.任务预览-搜索
  if (ERouterTaskType.review === type) {
    const isCustomize = ERecordStatus.customize === urlState.record_status;
    const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
    const disabled = !getIds(key)?.length && isCustomize;
    return (
      <HeaderWrapper>
        <div className="flex items-center">
          <Title
            tag={urlState.kind === EKind.with_duplicate && formatMessage({ id: 'task.hint5' })}
            title={title}
            type={type}
          />
          <QuestionOptions value={urlState.record_status} isLoading={isLoading} mutateAsync={mutateAsync} />
          {isCustomize && <CustomizeQuestion storeKey={key} onSearch={setCustomizeIds} />}
        </div>
        <Space split={isPlugin && <span className="text-quaternary font-normal mx-2">/</span>}>
          {[ERecordStatus.invalid, ERecordStatus.completed, ERecordStatus.discarded, ERecordStatus.customize].includes(
            urlState.record_status,
          ) ? (
            <>
              {ERecordStatus.customize !== urlState.record_status && (
                <>
                  <UserList />
                  <span className="text-quaternary font-normal mx-2">/</span>
                </>
              )}

              <div className="flex space-x-4">
                <Button
                  type="primary"
                  loading={isLoading}
                  disabled={disabled}
                  onClick={async () => {
                    await onGetProblemCustomize('prev');
                  }}
                >
                  <FormattedMessage id={'common.prev'} />
                </Button>
                <Button
                  type="primary"
                  loading={isLoading}
                  disabled={disabled}
                  onClick={async () => {
                    await onGetProblemCustomize('next');
                  }}
                >
                  <FormattedMessage id={'common.next'} />
                </Button>
              </div>
            </>
          ) : (
            <>
              {isWithDuplicate ? (
                <Search
                  key={urlState.questionnaire_id}
                  defaultValue={urlState.questionnaire_id}
                  placeholder={formatMessage({ id: 'task.question.placeholder' })}
                  onSearch={(v) => {
                    setUrlState({
                      data_id: undefined,
                      questionnaire_id: v,
                    });
                  }}
                  style={{ width: 450 }}
                />
              ) : (
                <Search
                  key={urlState.data_id}
                  defaultValue={urlState.data_id}
                  placeholder={formatMessage({ id: 'task.question.placeholder2' })}
                  onSearch={(v) => onSearch('data_id', v)}
                  style={{ width: 400 }}
                />
              )}
              <Button type="primary" loading={loading} onClick={changeTheQuestion}>
                <FormattedMessage id={'common.switch'} />
              </Button>
            </>
          )}
          <PluginSet />
        </Space>
      </HeaderWrapper>
    );
  }

  const tag = !urlState.user_id && formatMessage({ id: 'common.preview' });
  // 默认
  return (
    <HeaderWrapper>
      <Title title={title} type={type} tag={tag} />
      <Space
        split={
          isPlugin && ERouterTaskType.preview === type && <span className="text-quaternary font-normal mx-2">/</span>
        }
      >
        <CheckTaskType types={[ERouterTaskType.preview]}>
          <Button type="primary" loading={loading} onClick={changeTheQuestion}>
            <FormattedMessage id={'common.switch'} />
          </Button>
        </CheckTaskType>
        {/*<CheckTaskType types={[ERouterTaskType.task, ERouterTaskType.preview]}>*/}
        <PluginSet />
        {/*</CheckTaskType>*/}
      </Space>
    </HeaderWrapper>
  );
};

export default Header;
