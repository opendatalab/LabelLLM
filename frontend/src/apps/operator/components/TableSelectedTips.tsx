import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Button, Divider, Dropdown, Tooltip } from 'antd';
import clsx from 'clsx';

import IconFont from '@/components/IconFont';

interface IExportComponentProps {
  disabled: boolean;
  isLoading: boolean;
  onChange: (key: string) => void;
}

export const ExportComponent = ({ disabled, isLoading, onChange }: IExportComponentProps) => {
  return (
    <Dropdown
      placement="topLeft"
      arrow={false}
      menu={{
        items: [
          { label: '全量导出', key: 'all' },
          { label: '仅导出勾选项', key: 'selected', disabled },
        ],
        onClick: (e) => {
          onChange(e.key);
        },
      }}
    >
      <Button
        type="link"
        className="!p-0 text-color"
        size="small"
        loading={isLoading}
        icon={<IconFont type="icon-daochu1" className="!text-base" />}
      />
    </Dropdown>
  );
};

interface IProps extends HTMLAttributes<HTMLDivElement> {
  // 不显示悬停
  noHover?: boolean;
  ids: (string | number)[];
  clear?: () => void;
}

const TableSelectedTips: React.FC<PropsWithChildren<IProps>> = ({ ids, className, children, clear, noHover }) => {
  const isIds = ids.length > 0;

  return (
    <div className={clsx('inline-flex items-center relative space-x-2 -top-[54px]', className)}>
      {isIds && (
        <Tooltip title={noHover ? undefined : ids.join(', ')} placement="topRight">
          <span className="cursor-default">
            已选 <span>{ids.length}</span> 项
          </span>
        </Tooltip>
      )}
      <div className="flex items-center space-x-2">{children}</div>
      {isIds && (
        <>
          <Divider type="vertical" />
          <span onClick={clear} className="cursor-pointer text-secondary hover:text-primary">
            清空
          </span>
        </>
      )}
    </div>
  );
};

export default TableSelectedTips;
