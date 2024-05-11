import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Button, Tooltip } from 'antd';

import IconFont from '@/components/IconFont';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';
import Copy from '@/apps/supplier/components/Copy';
import type { ILabelUser } from '@/apps/supplier/services/task';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  dataId?: string;
  questionnaire_id?: string;
  label_user?: ILabelUser;
}

const AuditInfo: React.FC<PropsWithChildren<IProps>> = ({ dataId, questionnaire_id, label_user }) => {
  const { type } = useTaskParams();
  const list = [
    {
      name: '源题ID',
      show: [ERouterTaskType.review, ERouterTaskType.reviewTask, ERouterTaskType.preview].includes(type),
      icon: 'icon-yuanti',
      text: (
        <span>
          <span className="break-all">{questionnaire_id}</span>
          <Copy val={questionnaire_id || ''}>
            <span className="ml-4 text-blue-500 cursor-pointer hover:text-blue-600">复制</span>
          </Copy>
        </span>
      ),
    },
    {
      name: '题目ID',
      icon: 'icon-timu',
      show: true,
      text: (
        <span>
          <span className="break-all">{dataId}</span>
          <Copy val={dataId || ''}>
            <span className="ml-4 text-blue-500 cursor-pointer hover:text-blue-600">复制</span>
          </Copy>
        </span>
      ),
    },
    {
      name: '标注员',
      icon: 'icon-gerenzhongxin',
      show: [ERouterTaskType.reviewTask, ERouterTaskType.review].includes(type),
      text: label_user ? (
        <div className="break-all">
          <span>用户名：{label_user?.username || '-'}</span>
        </div>
      ) : (
        '无'
      ),
    },
  ].filter((item) => item.show);

  return (
    <div className="flex ">
      {list.map((item) => (
        <Tooltip placement="leftBottom" key={item.name} title={item.text}>
          <Button size="small" type="text" icon={item.icon && <IconFont type={item.icon} />} disabled={false}>
            {item.name}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
};

export default AuditInfo;
