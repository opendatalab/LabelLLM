import React from 'react';
import { clsx } from 'clsx';

interface IProps {
  type: string;
  rotate?: number;
  className?: string;
}

const IconFont = ({ type, rotate, className }: IProps) => {
  return <span className={clsx('icon iconfont', type, className)}></span>;
};

export default IconFont;
