import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { useNavigate, useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import { EllipsisOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';

import { message, modal } from '@/components/StaticAnt';

import CustomPageContainer from '../../layouts/CustomPageContainer';
import type { OperatorTaskDetail } from '../../services/task';
import { updateLabelTask, TaskStatus, deleteLabelTask } from '../../services/task';
import LabelDetailLeft from './left';
import LabelDetailRight from './right';
import CopyTask from '../../components/CopyTask';

export default function LabelTaskDetail() {
  const routeParams = useParams();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const taskInfo = (useRouteLoaderData('labelTask') || {}) as OperatorTaskDetail;
  const update = useMutation({
    mutationFn: updateLabelTask,
  });

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'delete') {
      modal.confirm({
        title: '确认删除此内容？',
        content: '是否确认删除任务？删除后不可恢复',
        onOk: async () => {
          await deleteLabelTask({ task_id: routeParams.id! });
          message.success('任务已删除');
          navigate('/task', { replace: true });
        },
        okText: '确定',
        cancelText: '取消',
        okButtonProps: {
          danger: true,
        },
      });
    }
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
        } catch (error) {
          /* empty */
        }
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
          <CopyTask id={routeParams.id!} type="label" />
          {_.get(taskInfo, 'status') === TaskStatus.Open && (
            <a className="text-error hover:text-error" onClick={handleEndTask}>
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
      <CustomPageContainer.Left className="w-[457px]">
        <LabelDetailLeft />
      </CustomPageContainer.Left>
      <CustomPageContainer.Right className="flex flex-col">
        <LabelDetailRight />
      </CustomPageContainer.Right>
    </CustomPageContainer>
  );
}
