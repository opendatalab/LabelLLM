import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Button, Tooltip } from 'antd';

import IconFont from '@/components/IconFont';
import { useTaskParams } from '@/apps/supplier/hooks/useTaskParams';
import { ERouterTaskType } from '@/apps/supplier/constant/task';
import Copy from '@/apps/supplier/components/Copy';
import type { ILabelUser } from '@/apps/supplier/services/task';
import { FormattedMessage, useIntl } from 'react-intl';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  dataId?: string;
  questionnaire_id?: string;
  label_user?: ILabelUser;
}

const AuditInfo: React.FC<PropsWithChildren<IProps>> = ({ dataId, questionnaire_id, label_user }) => {
  const { formatMessage } = useIntl();
  const { type } = useTaskParams();
  const list = [
    {
      name: formatMessage({ id: 'task.detail.audit.root.id' }),
      show: [ERouterTaskType.review, ERouterTaskType.reviewTask, ERouterTaskType.preview].includes(type),
      icon: 'icon-yuanti',
      text: (
        <span>
          <span className="break-all">{questionnaire_id}</span>
          <Copy val={questionnaire_id || ''}>
            <span className="ml-4 text-blue-500 cursor-pointer hover:text-blue-600">
              <FormattedMessage id={'common.copy'} />
            </span>
          </Copy>
        </span>
      ),
    },
    {
      name: formatMessage({ id: 'task.detail.audit.question.id' }),
      icon: 'icon-timu',
      show: true,
      text: (
        <span>
          <span className="break-all">{dataId}</span>
          <Copy val={dataId || ''}>
            <span className="ml-4 text-blue-500 cursor-pointer hover:text-blue-600">
              <FormattedMessage id={'common.copy'} />
            </span>
          </Copy>
        </span>
      ),
    },
    {
      name: formatMessage({ id: 'task.detail.audit.annotator' }),
      icon: 'icon-gerenzhongxin',
      show: [ERouterTaskType.reviewTask, ERouterTaskType.review].includes(type),
      text: label_user ? (
        <div className="break-all">
          <span>
            <FormattedMessage id={'common.username'} />：{label_user?.username || '-'}
          </span>
        </div>
      ) : (
        <FormattedMessage id={'common.none'} />
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
