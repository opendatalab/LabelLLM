import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Empty as AntdEmpty } from 'antd';
import { clsx } from 'clsx';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

import emptyPic from '../../assets/empty.png';

const base = clsx('rounded-sm overflow-hidden');
const variants = cva(base, {
  variants: {
    size: {
      default: 'pt-16',
    },
    bordered: {
      true: 'border border-solid border-border-secondary',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface IProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof variants> {
  description?: React.ReactNode | string;
  imageHeight?: number;
}

const Empty: React.FC<PropsWithChildren<IProps>> = ({ className, bordered, description, imageHeight }) => {
  return (
    <div className={clsx(variants({ bordered, className }))}>
      <AntdEmpty image={emptyPic} description={description} imageStyle={{ height: imageHeight || 120 }} />
    </div>
  );
};

export default Empty;
