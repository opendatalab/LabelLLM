import type { TooltipPropsWithTitle } from 'antd/lib/tooltip';
import React from 'react';

/**
 * 此文件用于应用初始化时的准备工作，比如一些注册处理函数，库的初始配置等
 */

declare global {
  interface Window {
    // 是否开发环境
    DEV: boolean;
  }
}

// ==========================【formatter】=========================

interface EllipseOption extends TooltipPropsWithTitle {
  maxWidth?: Pick<React.CSSProperties, 'maxWidth'> | string;
  maxLength: number;
  type?: 'tooltip' | 'popover';
}
