import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Statistic, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Countdown } = Statistic;

interface IProps extends HTMLAttributes<HTMLDivElement> {
  remain_time?: number;
  whetherTimeout: () => void;
}

const CountdownBox: React.FC<PropsWithChildren<IProps>> = ({ remain_time, whetherTimeout }) => {
  return (
    <Countdown
      valueStyle={{ color: '#2126C0', fontSize: '14px' }}
      className="text-primary inline-block"
      prefix={
        <span className="text-primary">
          距结束还剩
          <Tooltip title="超时未提交，题目将自动回收，已填写内容不做保存">
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
