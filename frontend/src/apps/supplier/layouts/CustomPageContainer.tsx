import { PageContainer } from '@ant-design/pro-components';
import type { PropsWithChildren } from 'react';
import React from 'react';
import { clsx } from 'clsx';

interface IProps {
  className?: string;
  title: string | React.ReactNode;
  bodyClassName?: string;
}

const CustomPageContainer: React.FC<PropsWithChildren<IProps>> = ({ className, title, children, bodyClassName }) => {
  return (
    <PageContainer
      className={clsx('px-8 pt-6 min-h-screen', className)}
      header={{
        title: title,
      }}
    >
      <div className={clsx('pt-4', bodyClassName)}>{children}</div>
    </PageContainer>
  );
};

export default CustomPageContainer;
