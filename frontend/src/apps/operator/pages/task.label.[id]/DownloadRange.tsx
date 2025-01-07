import { ModalForm, ProFormRadio, ProFormCheckbox } from '@ant-design/pro-components';
import { Form } from 'antd';

import type { ExportLabelTaskParams } from '@/apps/operator/services/task';
import { exportLabelTask } from '@/apps/operator/services/task';
import Help from '@/components/Help';

interface DownloadRangeProps {
  taskId: string | string[];
  type?: 'label' | 'audit';
}

function DownloadRange({ taskId, type }: DownloadRangeProps) {
  const [form] = Form.useForm<ExportLabelTaskParams>();

  const labelComponent = (
    <>
      <ProFormRadio.Group
        name="submit"
        label="题目是否完成标注"
        initialValue={undefined}
        options={[
          {
            label: '全部',
            value: undefined,
          },
          {
            label: '已标注',
            value: 'submitted',
          },
          {
            label: '未标注',
            value: 'un_submitted',
          },
        ]}
      />
      <ProFormRadio.Group
        name="qualified"
        label="标注结果是否达标"
        initialValue={undefined}
        options={[
          {
            label: '全部',
            value: undefined,
          },
          {
            label: '已达标',
            value: 'completed',
          },
          {
            label: '未达标',
            value: 'discarded',
          },
        ]}
      />
      <ProFormRadio.Group
        name="invalid"
        label="题目是否被标为 ”此题存在问题，无法作答“"
        initialValue={undefined}
        options={[
          {
            label: '全部',
            value: undefined,
          },
          {
            label: '是',
            value: true,
          },
          {
            label: '否',
            value: false,
          },
        ]}
      />
    </>
  );

  const auditComponent = (
    <>
      <ProFormCheckbox.Group
        name="status"
        label="审核结果是否达标"
        initialValue={['completed', 'discarded', 'pending', 'un_audited']}
        options={[
          {
            label: '审核达标',
            value: 'completed',
          },
          {
            label: '审核未达标',
            value: 'discarded',
          },
          {
            label: (
              <span>
                待定<Help>未开始审核/多轮审核仅完成部分</Help>
              </span>
            ),
            value: 'pending',
          },
          {
            label: '未抽审',
            value: 'un_audited',
          },
        ]}
      />
      <ProFormRadio.Group
        name="invalid"
        label="题目是否在【标注阶段】被标为 ”此题存在问题，无法作答“"
        initialValue={undefined}
        options={[
          {
            label: '全部',
            value: undefined,
          },
          {
            label: '是',
            value: true,
          },
          {
            label: '否',
            value: false,
          },
        ]}
      />
    </>
  );

  return (
    <ModalForm<ExportLabelTaskParams>
      title="指定范围"
      trigger={<a>{type === 'audit' ? '审核结果' : '标注结果'}</a>}
      form={form}
      submitter={{
        searchConfig: {
          submitText: '确认下载',
        },
      }}
      modalProps={{
        centered: true,
        destroyOnClose: true,
        onCancel: () => console.log('run'),
      }}
      onFinish={async (values) => {
        await exportLabelTask({ ...values, task_id: taskId });
        return true;
      }}
    >
      <div className="mt-6" />
      {type === 'audit' ? auditComponent : labelComponent}
    </ModalForm>
  );
}

export default DownloadRange;
