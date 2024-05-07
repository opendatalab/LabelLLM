import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { TooltipProps } from 'antd';
import React from 'react';

export default function Help({
  children,
  placement,
  className,
}: React.PropsWithChildren<{
  placement?: TooltipProps['placement'];
  className?: string;
}>) {
  return (
    <Tooltip title={children} placement={placement}>
      <QuestionCircleOutlined className={`ml-2 text-[var(--color-text-secondary)] ${className}`} />
    </Tooltip>
  );
}
