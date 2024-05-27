import { styled } from 'styled-components';
import clsx from 'clsx';
import React from 'react';

import Breadcrumb from '@/components/Breadcrumb';

export type CustomPageContainerProps = React.PropsWithChildren<{
  header?: React.ReactNode;
  extra?: React.ReactNode;
  title?: React.ReactNode;
  showBreadcrumb?: boolean;
  bodyClassName?: string;
  left?: React.ReactNode;
}>;

const BreadcrumbWrapper = styled.div`
  border-bottom: 1px solid var(--color-border-secondary);
`;

export default function CustomPageContainer({
  title,
  children,
  showBreadcrumb = true,
  bodyClassName,
  extra,
  header: customHeader,
}: CustomPageContainerProps) {
  let header = null;

  if (showBreadcrumb) {
    header = (
      <BreadcrumbWrapper className="flex justify-between items-center py-6 px-8">
        <Breadcrumb hideHome hiddenDepth={2} />
        {extra}
      </BreadcrumbWrapper>
    );
  }

  if (title) {
    header = (
      <div className="flex justify-between items-center px-8 pt-6">
        <div className="text-xl font-bold">{title}</div>
        {extra}
      </div>
    );
  }

  if (customHeader) {
    header = customHeader;
  }

  const isAllLeftOrRight = React.Children.toArray(children).some((child) => {
    const containerChild = child as React.ReactElement;
    return containerChild.type && (containerChild.type === Left || containerChild.type === Right);
  });

  let content = <div className={clsx('bg-white h-full py-6 px-8', bodyClassName)}>{children}</div>;

  if (isAllLeftOrRight) {
    content = <div className={clsx('bg-white flex h-full flex-grow', bodyClassName)}>{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {header}
      {content}
    </div>
  );
}

export interface LeftProps {
  className?: string;
  bordered?: boolean;
}

function Left({ children, className, bordered = true }: React.PropsWithChildren<LeftProps>) {
  return (
    <div
      className={clsx(
        'p-8 relative',
        {
          'after:block after:content-[""] after:absolute after:top-0 after:right-0 after:w-px after:h-full after:bg-borderSecondary':
            bordered,
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

function Right({
  children,
  className,
  style,
}: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div className={clsx(className, 'flex-1 p-8')} style={style}>
      {children}
    </div>
  );
}

CustomPageContainer.Left = Left;
CustomPageContainer.Right = Right;
