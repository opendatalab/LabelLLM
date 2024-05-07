import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { ProFormTextArea } from '@ant-design/pro-components';
import { Switch, Button, Upload, Spin } from 'antd';
import type { UploadProps } from 'antd';

import Markdown from '@/components/markdown';
import type { IQuestion } from '@/apps/supplier/services/task';
import { message } from '@/components/StaticAnt';
import IconFont from '@/components/icon-font';

import { upload } from './upload';

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
];

const CustomizeTextarea: React.FC<PropsWithChildren<IProps>> = ({ names, question, mdValue, setFieldValue }) => {
  const [checked, setChecked] = React.useState(question.is_preview_expanded);
  const [loading, setLoading] = React.useState(false);

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
    beforeUpload(file) {
      if (!mediaType.includes(file.type)) {
        message.error('文件格式错误');
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小请控制在50以内M');
        return false;
      }
      opUpload(file).then((res) => {
        setFieldValue(names, `${mdValue} ![${file.name}](${res})`);
      });
      return false;
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
          <span className="mr-1">预览</span>
          <Switch checked={checked} onChange={setChecked} size="small" disabled={false} />
        </span>
      )}
      <Spin spinning={loading}>
        <>
          <ProFormTextArea
            name={names}
            label={<span className="mb-2">{question.label}</span>}
            placeholder="请输入"
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
                  上传附件
                </Button>
              </Upload>
              <span className="ml-2 text-secondary">
                支持格式：图片（png、jpg、jpeg、gif）、视频（mp4、mov）、音频（mp3）；单个文件大小不超过50M
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
