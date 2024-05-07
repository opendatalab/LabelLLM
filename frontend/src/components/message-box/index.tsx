import type { PropsWithChildren } from 'react';
import React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import clsx from 'clsx';

const base = 'rounded-md inline-block py-2 px-5';
const variants = cva(base, {
  variants: {
    type: {
      default: 'bg-white',
      secondary: 'chat-secondary',
      primary: 'chat-primary',
    },
    bordered: {
      true: 'border border-solid border-borderSecondary',
    },
  },
  defaultVariants: {
    type: 'default',
  },
});
// 消除框的基本样式
interface IMessageBox extends VariantProps<typeof variants> {
  className?: string;
}
const MessageBox: React.FC<PropsWithChildren<IMessageBox>> = ({ type, bordered, className, children }) => {
  return <div className={clsx(variants({ type, bordered, className }))}>{children}</div>;
};

export default MessageBox;
