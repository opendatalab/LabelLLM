import { useNavigate, useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import { message, modal } from '@/components/StaticAnt';

import CustomPageContainer from '../../layouts/CustomPageContainer';
import type { AuditTaskDetail } from '../../services/task';
import { TaskStatus, deleteAuditTask, updateAuditTask } from '../../services/task';
import AuditDetailLeft from './left';
import AuditDetailRight from './right';

export default function AuditTaskDetailPage() {
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const taskInfo = (useRouteLoaderData('auditTask') || {}) as AuditTaskDetail;
  const update = useMutation({
    mutationFn: updateAuditTask,
  });

  const handleMenuClick: MenuProps['onClick'] = () => {
    modal.confirm({
      title: '确认删除此内容？',
      content: '是否确认删除任务？删除后不可恢复',
      onOk: async () => {
        await deleteAuditTask({ task_id: routeParams.id! });
        message.success('任务已删除');
        navigate('/task/audit', { replace: true });
      },
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
    });
  };

  const handleEndTask = () => {
    modal.confirm({
      title: '确认结束此任务？',
      content: '是否确定结束任务，结束后不可重新启动',
      onOk: async () => {
        try {
          await update.mutateAsync({
            task_id: routeParams.id!,
            status: TaskStatus.Done,
          });

          message.success('任务已结束');
          revalidator.revalidate();
        } catch (error) {}
      },
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
    });
  };

  return (
    <CustomPageContainer
      extra={
        <div>
          {_.get(taskInfo, 'status') === TaskStatus.Open && (
            <a className="text-error hover:text-error" href="javascript: void(0);" onClick={handleEndTask}>
              结束任务
            </a>
          )}
          <Dropdown
            menu={{
              onClick: handleMenuClick,
              items: [
                {
                  key: 'delete',
                  label: '删除任务',
                },
              ],
            }}
          >
            <Button className="ml-4" icon={<EllipsisOutlined />} type="text" size="small" />
          </Dropdown>
        </div>
      }
    >
      <CustomPageContainer.Left className="w-[460px]">
        <AuditDetailLeft />
      </CustomPageContainer.Left>
      <CustomPageContainer.Right className="flex flex-col !p-0" style={{ height: 'calc(100vh - 71px)' }}>
        <AuditDetailRight />
      </CustomPageContainer.Right>
    </CustomPageContainer>
  );
}
