import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { clsx } from 'clsx';

import type { IQuestion } from '@/apps/supplier/services/task';

import Widget from '../Widget';

type IProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  conversation?: IQuestion[];
};

const Answer: React.FC<PropsWithChildren<IProps>> = ({ className, name, conversation }) => {
  if (!conversation?.length) {
    return null;
  }
  return (
    <div className={clsx('rounded-md p-6 pt-4 mt-4 bg-[#F8F9FF]', className)}>
      {conversation?.map((item) => {
        return <Widget key={item.id} names={[name, item.value]} {...item} />;
      })}
    </div>
  );
};

export default React.memo(Answer);
