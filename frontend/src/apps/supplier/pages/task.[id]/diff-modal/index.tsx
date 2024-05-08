import { DrawerForm } from '@ant-design/pro-components';
import { Form, Select, Tooltip } from 'antd';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import { useKeyPressEvent } from 'react-use';

import Empty from '@/apps/supplier/components/empty';
import type { IMessage } from '@/apps/supplier/services/task';
import { EMessageType } from '@/apps/supplier/services/task';
import IconFont from '@/components/IconFont';
import 'diff2html/bundles/css/diff2html.min.css';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  oldStr: string;
  newStr: string;
}
// 解析 unified diff 字符 添加和删除的行数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseDiff(diffString: string) {
  // 正则表达式匹配增加和删除的行
  const additionRegex = /^\+[^+]/gm;
  const deletionRegex = /^-[^-]/gm;

  // 使用正则表达式与统计匹配行数
  const additions = (diffString.match(additionRegex) || []).length;
  const deletions = (diffString.match(deletionRegex) || []).length;

  // 返回添加和删除的行数
  return { additions, deletions };
}

// 判断是否有改动
const hasChange = (str: string) => {
  const lines = str.split('\n');
  // 忽略 --- 和 +++ 开头的行
  return lines
    .filter((item) => !(item.startsWith('---') || item.startsWith('+++')))
    .some((item) => item.startsWith('+') || item.startsWith('-'));
};

export const DiffText: React.FC<PropsWithChildren<IProps>> = ({ oldStr, newStr }) => {
  const [diff, setDiff] = useState('');

  useEffect(() => {
    const str = createPatch('content', oldStr, newStr, '', '');

    if (!hasChange(str)) {
      setDiff('');
      return;
    }

    const diffHtml = html(str, {
      drawFileList: true,
      matching: 'lines',
      outputFormat: 'side-by-side',
      renderNothingWhenEmpty: false,
    });
    setDiff(diffHtml);
  }, [oldStr, newStr]);

  if (!diff) {
    return (
      <div className="border border-solid border-quaternary rounded-sm py-20 text-center bg-fill-quaternary">
        没有更改的内容
      </div>
    );
  }

  return <div id="code-diff" dangerouslySetInnerHTML={{ __html: diff }} />;
};

export default ({ conversation }: { conversation: IMessage[] }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(true);
  const [send, setSend] = useState({
    datum: 0,
    compared: 1,
  });

  const options = conversation
    ?.filter((item) => item.message_type === EMessageType.send)
    ?.map((item, index) => ({
      value: index,
      label: `send-${index + 1}`,
      content: item.content,
    }));

  const onChange = (key: string, n: number) => {
    setSend({ ...send, [key]: n });
  };

  useKeyPressEvent(
    (e) => {
      // 检查是否同时按下了 'Alt' 键 和 '1' 键 或 'Alt' 键 和 '2' 键
      return e.altKey && e.code === 'Digit3';
    },
    () => {
      setOpen((s) => !s);
    },
  );

  return (
    <DrawerForm
      title="内容对比"
      open={open}
      form={form}
      // @ts-ignore
      resize={{
        onResize() {
          console.log('resize!');
        },
        maxWidth: window.innerWidth * 0.9,
        minWidth: window.innerWidth * 0.618,
      }}
      trigger={
        <Tooltip placement="left" title="快捷键：展开/收起 - Alt+3">
          <span
            onClick={() => setOpen(!open)}
            className="fixed cursor-pointer flex justify-center items-center right-0 top-20 z-10 w-8 h-7 border border-fill-secondary border-solid rounded-l-full hover:bg-fill-tertiary"
          >
            <IconFont rotate={180} className="text-xl font-bold" type="icon-cebianchoutishouqi" />
          </span>
        </Tooltip>
      }
      submitter={false}
      drawerProps={{
        mask: false,
        destroyOnClose: false,
        extra: (
          <Tooltip placement="left" title="快捷键：展开/收起 - Alt+3">
            <span
              className="inline-block cursor-pointer p-1 leading-none hover:bg-fill-tertiary"
              onClick={() => setOpen(!open)}
            >
              <IconFont className="text-2xl font-bold" type="icon-cebianchoutishouqi" />
            </span>
          </Tooltip>
        ),
        footer: null,
        closeIcon: false,
      }}
      onFinish={async () => {
        // 不返回不会关闭弹框
        return true;
      }}
    >
      {options?.length > 1 ? (
        <>
          <div className="flex text-base mb-4">
            <div className="flex items-center">
              <span>基准:</span>
              <Select
                size="small"
                value={send.datum}
                // style={{ width: 120 }}
                variant="borderless"
                options={options}
                onChange={(v) => {
                  onChange('datum', v);
                }}
              />
            </div>
            <div className="flex items-center">
              <span>对比:</span>
              <Select
                size="small"
                value={send.compared}
                // style={{ width: 120 }}
                variant="borderless"
                options={options}
                onChange={(v) => {
                  onChange('compared', v);
                }}
              />
            </div>
          </div>
          <DiffText oldStr={options[send.datum]?.content} newStr={options[send.compared]?.content} />
        </>
      ) : (
        <Empty className="mt-[18vh]" description="无可对比内容" />
      )}
    </DrawerForm>
  );
};
