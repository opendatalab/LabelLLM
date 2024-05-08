import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useMemo } from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import type { EPlugin } from '@/apps/supplier/pages/task.[id]/pluginSet';
import EventGrammarCheck from '@/apps/supplier/components/eventGrammarCheck';
import Markdown from '@/components/Markdown';
import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';
import { grammarCheck } from '@/apps/supplier/services/task';
import { addSpanTags } from '@/apps/supplier/utils/addSpanTags';
import NumOfCharacters from '@/apps/supplier/pages/task.[id]/numOfCharacters';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  plugin: EPlugin;
  value: string;
  language?: string;
  isRobot?: boolean;
  showOriginalText?: boolean; // 是否显示原文
}

const GrammarCheck: React.FC<PropsWithChildren<IProps>> = ({
  value,
  language,
  plugin,
  showOriginalText,
  className,
}) => {
  const { plugins } = useDatasetsContext();

  // 是否校验
  const isCheck = !!plugins?.includes(plugin);

  const { data, isFetching } = useQuery({
    queryKey: ['grammarCheck', value],
    queryFn: async () => grammarCheck({ language: language as string, text: value }),
    enabled: !!value && isCheck,
    staleTime: 30 * 60 * 1000,
  });

  const val = useMemo(() => {
    if (data) {
      return isCheck ? addSpanTags(value, [...(data?.matches || [])].reverse()) : value;
    }
    return value;
  }, [data, value, isCheck]);

  return (
    <Spin spinning={isFetching}>
      <EventGrammarCheck value={val}>
        {showOriginalText ? (
          <div className="whitespace-pre-wrap break-words leading-[1.75]">{value}</div>
        ) : (
          <Markdown value={val} />
        )}
      </EventGrammarCheck>
      {isCheck && (
        <NumOfCharacters className={clsx(className)} total={value?.length} errorNum={data?.matches?.length ?? 0} />
      )}
    </Spin>
  );
};

export default GrammarCheck;
