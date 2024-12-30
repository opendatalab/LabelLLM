import Icon, { FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Modal, Upload } from 'antd';
import React, { useState } from 'react';
import type { RcFile } from 'antd/es/upload';
import { set } from 'lodash/fp';
import type { Draft, JSONSchema, JSONValidator } from 'json-schema-library';

import request from '@/api/request';
import { message } from '@/components/StaticAnt';

import { ReactComponent as UploadCloud } from '../../assets/upload-cloud.svg';
import { ReactComponent as DeleteIcon } from '../CustomFancy/QuestionEditor/svgs/delete.svg';
import Help from '../Help';
import schema from './jsonl.schema.json';

const { Dragger } = Upload;

function uuidValidator(_core: Draft, _schema: JSONSchema, value: unknown, pointer: string) {
  if (value === '') {
    return {
      name: 'uuid',
      type: 'error',
      keyword: 'uuid',
      message: `${pointer}: uuid不可为空字符串`,
      data: {},
      code: 'uuid',
    };
  }

  if (typeof value !== 'string' && Array.isArray(_schema.type) && _schema.type.includes('null') && value !== null) {
    return {
      name: 'uuid',
      type: 'error',
      keyword: 'uuid',
      message: `${pointer}: uuid必须是字符串`,
      data: {},
      code: 'uuid',
    };
  }

  const uuidRegex = /^[a-f\d]{4}(?:[a-f\d]{4}-){4}[a-f\d]{12}$/i;
  if (value && typeof value === 'string' && !uuidRegex.test(value)) {
    return {
      name: 'uuid',
      type: 'error',
      keyword: 'uuid',
      message: `${pointer}: uuid 格式错误`,
      data: {},
      code: 'uuid',
    };
  }
}

interface Conversation {
  content: string;
  message_id: string;
  parent_id: string | null;
  user_id: string;
  user_type: string;
}

export interface JsonlItem {
  questionnaire_id: string;
  conversation_id: string;
  prompt: string;
  conversation: Conversation[];
}

const uploadStatusMapping: Record<string, string> = {
  uploading: '上传中',
  success: '解析成功',
  error: '解析失败',
  removed: '已移除',
  done: '已完成',
};

export interface JsonLResult {
  status: 'success' | 'error' | 'uploading' | 'done';
  content?: JsonlItem[];
  name: string;
  uid: string;
  error?: string;
}

export type JsonlUploadProps = Omit<UploadProps, 'onChange'> & {
  onFinish?: (value: JsonLResult[]) => void;
  taskId: string;
  url?: string;
};

function parseFile(file: RcFile, onSuccess?: (value: JsonLResult) => void, onError?: (value: JsonLResult) => void) {
  const reader = new FileReader();

  reader.onload = async (e) => {
    const { Draft07 } = await import('json-schema-library');
    const jsonSchema = new Draft07(schema, {
      validateFormat: {
        uuid: uuidValidator as JSONValidator,
      },
    });
    const contents = e.target?.result as string;
    const lines = contents.split('\n');
    const result: JsonlItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line) {
        continue;
      }

      try {
        const json = JSON.parse(line);
        // 校验 jsonl 文件格式
        const errors = jsonSchema.validate(json);

        if (errors.length > 0) {
          throw new Error(errors.map((error) => error.message).join('; \n'));
        }

        result.push(json);
      } catch (err: any) {
        onError?.({
          name: file.name,
          uid: file.uid,
          status: 'error',
          error: err.message,
        });

        return;
      }
    }

    onSuccess?.({
      name: file.name,
      uid: file.uid,
      status: 'uploading',
      content: result,
    });
  };

  reader.readAsText(file);
}

export default function JsonlUpload({ children, taskId, url, onFinish, ...rest }: JsonlUploadProps) {
  const [open, setOpen] = useState(false);
  const [jsonlList, setJsonlList] = useState<JsonLResult[]>([]);
  const [loading, setLoading] = useState(false);
  const action = (payload: { task_id: string; datas: JsonlItem[] }) =>
    request.post(url || '/v1/operator/task/label/data/batch_create', payload);

  const child = React.Children.only(
    React.cloneElement(children as React.ReactElement, {
      onClick: () => setOpen(true),
    }),
  );

  const handleFileChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'removed') {
      setJsonlList((pre) => pre.filter((item) => item.uid !== file.uid));
    }
  };

  const handleRemove = (uid: string) => {
    setJsonlList((pre) => pre.filter((item) => item.uid !== uid));
  };

  const handleUpload: UploadProps['customRequest'] = (file) => {
    const rcFile = file.file as RcFile;

    parseFile(
      rcFile,
      (result) => {
        setJsonlList((pre) => [...pre, { ...result, status: 'success' }]);
      },
      (result) => {
        setJsonlList((pre) => [...pre, result]);
      },
    );
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file: RcFile, fileList) => {
    if (jsonlList.find((item) => item.name === file.name)) {
      message.error('文件已存在');
      return false;
    }

    if (file.size > 1024 * 1024 * 15) {
      message.error('文件大小不能超过15M');
      return false;
    }

    if (fileList.length > 5 || jsonlList.length >= 5) {
      message.destroy();
      message.error('最多上传5个文件');
      return false;
    }

    return true;
  };

  const handleOk = async () => {
    const validList = jsonlList.filter((item) => item.status === 'success');
    const invalidList = jsonlList.filter((item) => item.status === 'error');

    if (invalidList.length > 0) {
      message.error('请处理完解析错误的文件');
      return;
    }

    setLoading(true);
    try {
      // 依次上传
      for (let i = 0; i < validList.length; i++) {
        const item = validList[i];
        let status = item.status;
        try {
          await action({
            task_id: taskId,
            datas: item.content || [],
          });
          status = 'done';
        } catch (err) {
          status = 'error';
          continue;
        }
        setJsonlList((prevList) => {
          const newList = [...prevList];
          newList[i] = { ...newList[i], status: status };
          return newList;
        });
      }
    } catch (err) {
      setLoading(false);
      return;
    }
    setOpen(false);
    setJsonlList([]);
    onFinish?.(validList);
    setLoading(false);
  };

  return (
    <>
      {child}
      <Modal
        open={open}
        title="数据上传"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        maskClosable={false}
        okText="确认"
        okButtonProps={{ loading, disabled: jsonlList.length === 0 }}
      >
        <div className="py-4">
          <Dragger
            {...rest}
            beforeUpload={handleBeforeUpload}
            multiple
            accept=".jsonl"
            fileList={jsonlList as any}
            customRequest={handleUpload}
            maxCount={5}
            // @ts-ignore
            onChange={handleFileChange}
            itemRender={(node, file) => (
              <div className="flex justify-between bg-[var(--color-bg-layout)] py-1 px-2 mt-4">
                <div className="flex items-center">
                  <FileTextOutlined />
                  <div title={file.name} className="mx-2 truncate max-w-[320px]">
                    {file.name}
                  </div>
                  <span style={{ color: `var(--color-${file.status})` }}>
                    {file.status ? uploadStatusMapping[file.status] : '未知状态'}
                  </span>
                  {file.status === 'error' && <Help>{file.error ? `失败原因：${file.error}` : '内容格式错误'}</Help>}
                </div>
                <Icon className="text-error" component={DeleteIcon} onClick={() => handleRemove(file.uid)} />
              </div>
            )}
          >
            <div className="flex flex-col items-center py-8">
              <div className="text-gray-400">
                <UploadCloud className="text-gray-400 mb-2" />
                <p className="mb-2">
                  将文件拖到此处，或 <span className="text-primary">点击上传</span>
                </p>
                <p className="mb-0">格式要求：.jsonl 单个文件15M以内，每次最多上传5个</p>
              </div>
            </div>
          </Dragger>
        </div>
      </Modal>
    </>
  );
}
