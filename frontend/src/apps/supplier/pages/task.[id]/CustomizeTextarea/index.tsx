import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { ProFormTextArea } from '@ant-design/pro-components';
import { Switch, Button, Upload, Spin } from 'antd';
import type { UploadProps } from 'antd';

import Markdown from '@/components/Markdown';
import type { IQuestion } from '@/apps/supplier/services/task';
import { message } from '@/components/StaticAnt';
import IconFont from '@/components/IconFont';

import { upload } from './upload';
import { FormattedMessage, useIntl } from 'react-intl';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  mdValue?: string; // markdown 显示的内容
  names: string[];
  question: IQuestion;
  setFieldValue: (name: string[], value: any) => void;
}

const mediaType = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'audio/mp3',
  'audio/mpeg',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const CustomizeTextarea: React.FC<PropsWithChildren<IProps>> = ({ names, question, mdValue, setFieldValue }) => {
  const [checked, setChecked] = React.useState(question.is_preview_expanded);
  const [loading, setLoading] = React.useState(false);
  const { formatMessage } = useIntl();

  const opUpload = async (file: any) => {
    setLoading(true);
    try {
      return await upload(file);
    } finally {
      setLoading(false);
    }
  };

  const props: UploadProps = {
    // 支持格式：图片（png、jpg、jpeg、gif）、视频（mp4、mov）、音频（mp3）；单个文件大小不超过50M
    accept: mediaType.join(','),
    showUploadList: false,
    action: '/api/v1/file/file_upload',
    beforeUpload(file) {
      if (!mediaType.includes(file.type)) {
        message.error(formatMessage({ id: 'task.detail.upload.error1' }));
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        message.error(formatMessage({ id: 'task.detail.upload.error2' }));
        return false;
      }
      return true;
    },
    onChange(info) {
      const { response, name } = info.file || {};
      if (response) {
        if (response.get_path) {
          setFieldValue(names, `${mdValue} ![${name}](${response.get_path})`);
        } else {
          message.error('上传失败');
        }
      }
    },
  };

  // 粘贴图片
  const changePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (loading || !question?.is_upload_available) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          opUpload(file).then((res) => {
            // 获取光标所在字符串位置
            const { target } = e;
            const { selectionStart, selectionEnd } = target as HTMLTextAreaElement;
            const value = (target as HTMLTextAreaElement).value;
            // 裁切字符串 插入图片链接
            const newValue = `${value.slice(0, selectionStart)} ![${file.name}](${res}) ${value.slice(selectionEnd)}`;
            setFieldValue(names, newValue);
          });
        }
      }
    }
  };

  return (
    <div className="relative mb-4">
      {!!mdValue && (
        <span className="absolute z-10 right-0 top-1 text-sm flex items-center">
          <span className="mr-1">
            <FormattedMessage id={'common.preview'} />
          </span>
          <Switch checked={checked} onChange={setChecked} size="small" disabled={false} />
        </span>
      )}
      <Spin spinning={loading}>
        <>
          <ProFormTextArea
            name={names}
            label={<span className="mb-2">{question.label}</span>}
            rules={[{ required: question.required }]}
            initialValue={question.default_value as string}
            fieldProps={{
              className: 'task-form-textarea',
              maxLength: question.max_length || undefined,
              showCount: true,
              autoSize: { minRows: 5, maxRows: 8 },
              onPaste: changePaste,
            }}
          />
          {question?.is_upload_available && (
            <div className="mt-6">
              <Upload {...props}>
                <Button
                  icon={<IconFont type="icon-shangchuan" className="text-base" />}
                  size="small"
                  className="text-sm"
                >
                  <FormattedMessage id="task.detail.upload" />
                </Button>
              </Upload>
              <span className="ml-2 text-secondary">
                <FormattedMessage id="task.detail.upload.desc" />
              </span>
            </div>
          )}
          {checked && !!mdValue && (
            <div
              className="border border-solid rounded p-4 mt-8 break-all"
              style={{ borderColor: 'rgba(33, 38, 192, 0.20)' }}
            >
              <Markdown value={mdValue || ''} />
            </div>
          )}
        </>
      </Spin>
    </div>
  );
};

export default CustomizeTextarea;
