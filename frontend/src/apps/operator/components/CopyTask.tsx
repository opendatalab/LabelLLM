import React from 'react';
import { Button } from 'antd';
import { useMutation } from '@tanstack/react-query';

import { copyTask, copyAuditTask } from '@/apps/operator/services/task';
import { modal } from '@/components/StaticAnt';

interface IProps {
  id: string;
  type: 'label' | 'audit';
}

function CopyTask({ id, type }: IProps) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: type === 'label' ? copyTask : copyAuditTask,
    onSuccess: (data) => {
      // 跳转到任务详情页面
      if (data.is_ok) {
        modal.confirm({
          title: '复制任务',
          cancelText: '知道了',
          okText: '前往查看',
          onOk: () => {
            window.open(`/operator/task/${data.task_id}`, '_blank');
          },
          content: '任务复制成功',
          centered: true,
        });
      } else {
        modal.error({
          title: '复制任务',
          content: `任务复制失败, 失败原因：${data?.msg}`,
          centered: true,
        });
      }
    },
  });

  const handleClick = async () => {
    await mutateAsync({ task_id: id });
  };
  return (
    <Button loading={isPending} type="link" onClick={handleClick}>
      复制任务
    </Button>
  );
}

export default CopyTask;
