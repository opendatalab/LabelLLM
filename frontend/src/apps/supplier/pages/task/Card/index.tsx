import { Tag, Typography } from 'antd';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import React from 'react';

import type { ITaskItem } from '@/apps/supplier/services/task';
import { ETaskStatus } from '@/apps/supplier/services/task';

import style from './index.module.css';
import { FormattedMessage } from 'react-intl';

const { Text, Paragraph } = Typography;

interface IProps extends Omit<ITaskItem, 'task_id'> {
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
                <FormattedMessage id="task.card.end" />
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
            <FormattedMessage
              id="task.card.remain"
              values={{
                count: <span className={clsx(!unRemain && !isDone && 'text-primary')}>{remain_count}</span>,
              }}
            />
          </span>
          <FormattedMessage
            id="task.card.finish"
            values={{
              count: completed_count,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;
