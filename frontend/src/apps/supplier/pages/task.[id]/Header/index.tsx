import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Button, Input, Segmented, Select, Space, Tag, Tooltip } from 'antd';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';

import { EKind, EQueryQuestionType, useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';
import CheckTaskType from '@/apps/supplier/pages/task.[id]/CheckTaskType';
import type { IPreviewIdParams, IPreviewIdRRes } from '@/apps/supplier/services/task';
import { ERecordStatus, getLabelRecord, getPreviewId } from '@/apps/supplier/services/task';
import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';
import CustomizeQuestion from '@/apps/supplier/pages/task.[id]/CustomizeQuestion';
import { useStoreIds } from '@/hooks/useStoreIds';
import { message } from '@/components/StaticAnt';

import PluginSet from '../PluginSet';

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
  const { urlState, taskId, setUrlState } = useTaskParams();

  const { getIds } = useStoreIds();

  const onSearch = async (v: string) => {
    // const val = v === EQueryQuestionType.all ? undefined : v;
    if (v === EQueryQuestionType.all) {
      setUrlState({ question_type: undefined, data_id: undefined, questionnaire_id: undefined });
      return;
    }
    if (v === EQueryQuestionType.problem) {
      const d = await mutateAsync({
        task_id: taskId as string,
        data_id: urlState.data_id,
        questionnaire_id: urlState.questionnaire_id,
        kind: urlState.kind, // 是否是源题模式
        is_invalid_questionnaire: true,
        pos_locate: 'current',
      });
      if (!d || !d.data_id) {
        message.error('没有标为有问题的题目');
        return;
      }
      setUrlState({
        question_type: v,
        data_id: d?.data_id,
        questionnaire_id: EKind.with_duplicate === urlState.kind ? d?.questionnaire_id : undefined,
      });
      return;
    }
    // 缓存里面读取
    setUrlState({
      question_type: v,
      data_id: getIds('data_id')[0] || undefined,
      questionnaire_id: undefined,
    });
  };

  return (
    <Select
      size="small"
      variant="borderless"
      loading={isLoading}
      onChange={onSearch}
      value={value || EQueryQuestionType.all}
      popupMatchSelectWidth={false}
      options={[
        { value: EQueryQuestionType.all, label: '全部题目' },
        { value: EQueryQuestionType.problem, label: '仅看标为有问题' },
        { value: EQueryQuestionType.customize, label: '自定义题目范围' },
      ]}
    />
  );
};

/**
 * Header component for the task page.
 * @param title - The title of the task.
 * @param loading - Indicates whether the task is currently loading.
 * @param onChangeTheQuestion - Callback function to handle the "Next" button click.
 */
const Header: React.FC<PropsWithChildren<IProps>> = ({ title, loading, onChangeTheQuestion }) => {
  const { type, taskId, urlState, setUrlState } = useTaskParams();
  const { plugins } = useDatasetsContext();

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
    if (urlState.question_type === EQueryQuestionType.customize) {
      const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
      setCustomizeIds(nextId(urlState[key], key, pos_locate === 'next' ? 1 : -1));
    } else {
      const d = await mutateAsync({
        task_id: taskId as string,
        data_id: urlState.data_id,
        questionnaire_id: urlState.questionnaire_id,
        kind: urlState.kind, // 是否是源题模式
        is_invalid_questionnaire: urlState.question_type === EQueryQuestionType.problem,
        pos_locate,
      });
      if (!d.data_id || !d.questionnaire_id) {
        return message.warning('没有更多题目了');
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
    return (
      <HeaderWrapper>
        <div className="flex items-center">
          <Title title={title} type={type} />
          <Segmented
            value={urlState.record_status || ''}
            onChange={(v) => onSearch('record_status', v)}
            className="customize-segmented"
            options={[
              { label: '全部题目', value: '', disabled: false },
              {
                label: (
                  <Tooltip
                    title={
                      !data?.total
                        ? type === ERouterTaskType.reviewTask
                          ? `未达标题数为 0`
                          : '未采纳题数为 0'
                        : undefined
                    }
                  >
                    <CheckTaskType types={[ERouterTaskType.reviewTask]}>
                      <span>仅查看未达标</span>
                    </CheckTaskType>
                  </Tooltip>
                ),
                value: ERecordStatus.discarded,
                disabled: !data?.total,
              },
            ]}
          />
        </div>
        <Space split={isPlugin && <span className="text-quaternary font-normal mx-2">/</span>}>
          <Button type="primary" loading={loading} onClick={changeTheQuestion}>
            换一题
          </Button>
          {/*<CheckTaskType types={[ERouterTaskType.reviewTask]}>*/}
          <PluginSet />
          {/*</CheckTaskType>*/}
        </Space>
      </HeaderWrapper>
    );
  }

  // 2.任务预览-搜索
  if (ERouterTaskType.review === type) {
    const isCustomize = EQueryQuestionType.customize === urlState.question_type;
    const key = isWithDuplicate ? 'questionnaire_id' : 'data_id';
    const disabled = !getIds(key)?.length && isCustomize;
    return (
      <HeaderWrapper>
        <div className="flex items-center">
          <Title tag={urlState.kind === EKind.with_duplicate && '源题组合查看'} title={title} type={type} />
          <QuestionOptions value={urlState.question_type} isLoading={isLoading} mutateAsync={mutateAsync} />
          {isCustomize && <CustomizeQuestion storeKey={key} onSearch={setCustomizeIds} />}
        </div>
        <Space split={isPlugin && <span className="text-quaternary font-normal mx-2">/</span>}>
          {[EQueryQuestionType.problem, EQueryQuestionType.customize].includes(urlState.question_type) ? (
            <div className="flex space-x-4">
              <Button
                type="primary"
                loading={isLoading}
                disabled={disabled}
                onClick={async () => {
                  await onGetProblemCustomize('prev');
                }}
              >
                上一题
              </Button>
              <Button
                type="primary"
                loading={isLoading}
                disabled={disabled}
                onClick={async () => {
                  await onGetProblemCustomize('next');
                }}
              >
                下一题
              </Button>
            </div>
          ) : (
            <>
              {isWithDuplicate ? (
                <Search
                  key={urlState.questionnaire_id}
                  defaultValue={urlState.questionnaire_id}
                  placeholder="输入您想要查询的源题ID（Questionnaire_id），按回车键搜索"
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
                  placeholder="输入您想要查询的题目ID（Data_id），按回车键搜索"
                  onSearch={(v) => onSearch('data_id', v)}
                  style={{ width: 400 }}
                />
              )}
              <Button type="primary" loading={loading} onClick={changeTheQuestion}>
                换一题
              </Button>
            </>
          )}
          <PluginSet />
        </Space>
      </HeaderWrapper>
    );
  }

  const tag = !urlState.user_id && '预览';
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
            换一题
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
