import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Tooltip } from 'antd';
import clsx from 'clsx';

import IconFont from '@/components/IconFont';
import { message } from '@/components/StaticAnt';
import { useIntl } from 'react-intl';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  val: string;
  children?: React.ReactNode;
}

const Copy: React.FC<PropsWithChildren<IProps>> = ({ val, className, children }) => {
  const { formatMessage } = useIntl();
  return (
    <CopyToClipboard
      text={val}
      onCopy={() => {
        message.success(formatMessage({ id: 'common.copy.success' }));
      }}
    >
      {children || (
        <Tooltip title={formatMessage({ id: 'common.copy' })}>
          <span
            className={clsx(
              'inline-flex text-secondary border border-solid border-borderSecondary p-1 cursor-pointer bg-white rounded group/c',
              className,
            )}
          >
            <span className="inline-flex w-5 h-5 justify-center items-center rounded-sm group-hover/c:bg-fill-tertiary group-hover/c:text-primary">
              <IconFont type="icon-fuzhi" className="text-base" />
            </span>
          </span>
        </Tooltip>
      )}
    </CopyToClipboard>
  );
};

export default Copy;
