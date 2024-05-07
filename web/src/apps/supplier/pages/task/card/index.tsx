import { Tag, Typography } from 'antd';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import React from 'react';

import type { ITaskItem } from '@/apps/supplier/services/task';
import { ETaskStatus } from '@/apps/supplier/services/task';

import style from './index.module.css';

const { Text, Paragraph } = Typography;

interface IProps extends Omit<ITaskItem, 'task_id'> {
  isAudit?: boolean;
  onClick?: () => void;
}

const Card: React.FC<PropsWithChildren<IProps>> = ({
  title,
  status,
  description,
  remain_count,
  completed_count,
  onClick,
}) => {
  const unRemain = remain_count === 0;
  // 任务是否结束
  const isDone = status === ETaskStatus.done;
  return (
    <div
      data-wiz="task-card"
      data-wiz-task-title={title}
      className={clsx(style.card, 'relative rounded-lg h-40 p-px box-border', { 'pointer-events-none': isDone })}
      onClick={onClick}
    >
      <div className="h-full w-full bg-white rounded-[7px] box-border p-5">
        <div className="flex">
          <Text
            className={clsx('font-bold mb-2 text-base', isDone ? 'text-secondary' : 'group-hover:text-primary')}
            ellipsis={{ tooltip: true }}
          >
            {title}
          </Text>
          {status === ETaskStatus.done && (
            <span className="ml-2">
              <Tag bordered={false} color="error">
                已结束
              </Tag>
            </span>
          )}
        </div>
        <Paragraph className={clsx(isDone && 'text-secondary')} ellipsis={{ tooltip: true, rows: 3 }}>
          {description}
        </Paragraph>
        <div
          className={clsx(
            'flex justify-between absolute bottom-3 px-5 left-0 w-full',
            (unRemain || isDone) && 'text-secondary',
          )}
        >
          <span>
            剩余：<span className={clsx(!unRemain && !isDone && 'text-primary')}>{remain_count}</span> 题
          </span>
          <span className="text-secondary">我已答：{completed_count} 题</span>
        </div>
      </div>
    </div>
  );
};

export default Card;
