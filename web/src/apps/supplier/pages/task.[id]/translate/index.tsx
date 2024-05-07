import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';

import Markdown from '@/components/markdown';
import type { ITranslateParams, ITranslateRes } from '@/apps/supplier/services/task';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  tool?: string;
  api: (params: ITranslateParams) => Promise<ITranslateRes>;
  value: string;
  showOriginalText?: boolean; // 是否显示原文不需要markdown渲染
  render?: (value: string) => React.ReactNode;
  from: string;
  to: string;
}

const Translate: React.FC<PropsWithChildren<IProps>> = ({ tool, api, value, showOriginalText, render, from, to }) => {
  const { taskId } = useTaskParams();

  const { data, isFetching, isError } = useQuery({
    queryKey: ['translate', tool, taskId, value],
    queryFn: async () => api({ source: from, target: to, text: value }),
    staleTime: 30 * 60 * 1000,
  });

  if (isError) {
    return <div className="text-error">翻译服务暂时不可用</div>;
  }

  return (
    <>
      <Spin spinning={isFetching}>
        <div className="mb-2 font-bold">译文：</div>
        {showOriginalText ? (
          <div className="whitespace-pre-wrap break-words leading-[1.75]">{data?.text || value}</div>
        ) : (
          <Markdown value={data?.text || value} />
        )}
      </Spin>
      {render?.(data?.text || value)}
    </>
  );
};

export default Translate;
