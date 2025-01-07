import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Statistic, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from 'react-intl';

const { Countdown } = Statistic;

interface IProps extends HTMLAttributes<HTMLDivElement> {
  remain_time?: number;
  whetherTimeout: () => void;
}

const CountdownBox: React.FC<PropsWithChildren<IProps>> = ({ remain_time, whetherTimeout }) => {
  const { formatMessage } = useIntl();
  return (
    <Countdown
      valueStyle={{ color: '#2126C0', fontSize: '14px' }}
      className="text-primary inline-block"
      prefix={
        <span className="text-primary">
          <FormattedMessage id="task.detail.time.left" />
          <Tooltip title={formatMessage({ id: 'task.detail.time.left.desc' })}>
            <QuestionCircleOutlined className="ml-1 mr-2" />
          </Tooltip>
        </span>
      }
      format="mm:ss"
      value={(remain_time ?? 0) * 1000}
      onFinish={whetherTimeout}
    />
  );
};

export default CountdownBox;
