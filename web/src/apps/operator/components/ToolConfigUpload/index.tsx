import { Button, Modal, Upload, message } from 'antd';
import React, { useState } from 'react';
import type { RcFile, UploadProps } from 'antd/es/upload';
import { Link } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import _ from 'lodash';

import type { ConditionContent } from '@/apps/supplier/services/task';

import type { TaskToolConfig } from '../../services/task';
import { ReactComponent as UploadCloud } from '../../assets/upload-cloud.svg';
import schema from './toolConfig.schema.json';
import Help from '../Help';
import { isIdUnique } from '../../pages/task.label.create/utils';

/**
 * 将旧的条件设置转换为条件组的数据格式
 */
function convertOldConfigToNewCondition(value: Record<string, any>) {
  const result = _.cloneDeep(value);

  for (const key in result) {
    const questions = result[key]?.questions ?? [];

    if (questions.length === 0) {
      continue;
    }

    for (const option of questions) {
      if (!option.conditions || !option.conditions.length) {
        continue;
      }

      if (_.every(option.conditions, (condition) => !condition.connector)) {
        option.conditions = [
          {
            connector: 'or',
            items: option.conditions.map((item: ConditionContent) => ({
              field: item.field,
              operator: 'eq',
              question_id: item.question_id,
              value: item.value,
              option_id: item.option_id,
            })),
          },
        ];
      }
    }
  }

  return result as TaskToolConfig;
}

const { Dragger } = Upload;

function parseFile(file: RcFile, onSuccess?: (value: TaskToolConfig) => void, onError?: (err: string) => void) {
  const reader = new FileReader();

  reader.onload = async (e) => {
    const { Draft07 } = await import('json-schema-library');
    const jsonSchema = new Draft07(schema);
    const contents = e.target?.result as string;
    let result: TaskToolConfig;

    try {
      const json = convertOldConfigToNewCondition(JSON.parse(contents));
      // 校验 jsonl 文件格式
      const errors = jsonSchema.validate(json);

      if (errors.length > 0) {
        throw new Error(errors.map((error) => error.message).join('; \n'));
      }

      if (!isIdUnique(json)) {
        throw new Error('id 不能重复');
      }

      result = json;
    } catch (err: any) {
      onError?.(err.message);

      return;
    }

    onSuccess?.(result);
  };

  reader.readAsText(file);
}

interface JsonFile {
  name: string;
  uuid: string;
  status: 'success' | 'error' | 'uploading' | 'removed';
  error?: string;
  content?: TaskToolConfig;
}

export interface ToolConfigUploadProps {
  onFinish?: (value: TaskToolConfig) => void;
  disabled?: boolean;
}

export function ToolConfigUpload({ onFinish, disabled, children }: React.PropsWithChildren<ToolConfigUploadProps>) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<JsonFile>();

  const child = React.Children.only(
    React.cloneElement(children as React.ReactElement, {
      onClick: () => setOpen(true),
    }),
  );

  const handleFileChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'removed') {
      setResult(undefined);
    }
  };

  const handleUpload: UploadProps['customRequest'] = (file) => {
    const rcFile = file.file as RcFile;

    parseFile(
      rcFile,
      (toolConfig) => {
        setResult({
          name: rcFile.name,
          uuid: rcFile.uid,
          status: 'success',
          content: toolConfig,
        });
      },
      (err) => {
        setResult({
          name: rcFile.name,
          uuid: rcFile.uid,
          status: 'error',
          error: err,
        });
      },
    );
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file: RcFile, fileList) => {
    if (file.size > 1024 * 1024 * 15) {
      message.error('文件大小不能超过15M');
      return false;
    }

    if (fileList.length > 1) {
      message.error('只能上传一个文件');
      return false;
    }

    return true;
  };

  const handleOk = async () => {
    if (!result || !result.content) {
      return;
    }

    onFinish?.(result.content);
    setOpen(false);
    setResult(undefined);
  };

  return (
    <>
      {child}
      <Modal
        open={open}
        title="JSON 新建"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        maskClosable={false}
        okText="确认"
        okButtonProps={{ disabled: disabled || !result || !result.content }}
      >
        <div className="py-4">
          <Dragger
            beforeUpload={handleBeforeUpload}
            multiple
            accept=".json"
            customRequest={handleUpload}
            maxCount={1}
            onChange={handleFileChange}
            itemRender={() => null}
          >
            {result?.error && (
              <div className="h-[160px] flex flex-col items-center justify-center">
                {result.name}
                <div className="flex items-center">
                  <CloseCircleFilled className="mr-2 text-error" />
                  解析失败
                  <Help>{result.error}</Help>
                  <Button type="link">重新上传</Button>
                </div>
              </div>
            )}
            {!result?.content && !result?.error && (
              <div className="flex flex-col items-center py-8">
                <div className="text-gray-400">
                  <UploadCloud className="text-gray-400 mb-2" />
                  <p className="mb-2">
                    格式要求：.json，将文件拖到此处，或 <span className="text-primary">点击上传</span>
                  </p>
                  <p className="mb-0">单个文件15M以内，仅支持上传一个</p>
                </div>
              </div>
            )}

            {result?.content && (
              <div className="h-[160px] flex items-center justify-center">
                <div className="flex items-center">
                  <CheckCircleFilled className="mr-2 text-success" />
                  {result.name}
                  <Button type="link">重新上传</Button>
                </div>
              </div>
            )}
          </Dragger>
          <div className="flex mt-2">
            <Link target="_blank" to="https://aicarrier.feishu.cn/docx/Ieo7dYKPeoVixKxkUZacUAGlnDf?from=from_copylink">
              查看示例
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
