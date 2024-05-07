import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import clsx from 'clsx';
import { Tooltip } from 'antd';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  total: number;
  errorNum?: number;
}

const NumOfCharacters: React.FC<PropsWithChildren<IProps>> = ({ className, total, errorNum }) => {
  return (
    <div className={clsx('cursor-pointer', className)}>
      <Tooltip title="错误处/总字符数">
        <span className="text-error">{errorNum ?? 0}</span>
        <span className="mx-1">/</span>
        <span>{total}</span>
      </Tooltip>
    </div>
  );
};

export default NumOfCharacters;
