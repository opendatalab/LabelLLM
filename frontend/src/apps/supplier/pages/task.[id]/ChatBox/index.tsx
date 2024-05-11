import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import clsx from 'clsx';

import type { IMessage, IMessageQuestion, IQuestion } from '@/apps/supplier/services/task';
import { EMessageType } from '@/apps/supplier/services/task';
import MessageBox from '@/components/MessageBox';
import Copy from '@/apps/supplier/components/Copy';
import { userInfoKey } from '@/constant/query-key-factories';
import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';

import Widget, { WidgetBox } from '../Widget';
import { IUserInfo } from '@/api/user';
import Markdown from '@/components/Markdown';

type IProps = HTMLAttributes<HTMLDivElement> & {
  id: string;
  prompt?: string; // 问答题的内容
  messages: IMessage[];
  messageQuestion?: IMessageQuestion;
  grid: number;
  userQuestions?: IQuestion[];
};

type MessageType = 'default' | 'secondary' | 'primary';
const UserMessage: React.FC<
  PropsWithChildren<{
    message: IMessage;
    avatar?: string;
    name?: string;
    type: MessageType;
    userQuestions?: IQuestion[];
  }>
> = ({ message, avatar, name, type, userQuestions }) => {
  return (
    <div className="flex justify-end relative">
      <div className="flex min-w-0 w-full items-end flex-col">
        <MessageBox type={type} className="relative group max-w-full">
          <>
            <div className="whitespace-pre-wrap break-words leading-[1.75]">{message.content}</div>
            <div className="absolute pr-1.5 pb-4 left-1 top-1 hidden group-hover:block">
              <Copy val={message.content} />
            </div>
          </>
        </MessageBox>
        <div className="w-full">
          {!!userQuestions?.length && (
            <ProFormText
              hidden
              name={['message_evaluation', message.message_id, '__sys_message_type']}
              initialValue={EMessageType.send}
            />
          )}
          {userQuestions?.map((item) => {
            return (
              <div key={item.id} className="mt-3">
                <Widget names={['message_evaluation', message.message_id, item.value]} {...item} />
              </div>
            );
          })}
        </div>
      </div>
      {avatar ? (
        <Avatar className="ml-4 shrink-0" src={avatar} />
      ) : (
        <Avatar className="ml-4 bg-primary shrink-0">
          <span className="text-base">{name?.[0]}</span>
        </Avatar>
      )}
    </div>
  );
};

const BotMessage: React.FC<PropsWithChildren<{ message: IMessage; messageQuestion?: IMessageQuestion }>> = ({
  message,
  messageQuestion,
}) => {
  const { sortOptions, setSortOptionsHandle } = useDatasetsContext();

  return (
    <div className="flex relative">
      <Avatar className="shrink-0 mr-4 bg-primary" icon={<RobotOutlined />} />
      <div className="flex min-w-0 w-full items-start flex-col">
        <MessageBox type="primary" className="relative group max-w-full">
          <>
            <Markdown value={message.content} />
            <div className="absolute pl-1.5 pb-4 right-1 top-1 hidden group-hover:block">
              <Copy val={message.content} />
            </div>
          </>
        </MessageBox>

        <div className="w-full">
          {messageQuestion?.is_sortable ? (
            <WidgetBox label="排序" horizontal={true} required={true} className="mb-3">
              <ProFormSelect
                style={{ width: 40 }}
                options={sortOptions || undefined}
                rules={[{ required: true }]}
                name={['message_evaluation', message.message_id, 'sort']}
                fieldProps={{
                  size: 'small',
                  onChange: (value: number) => {
                    setSortOptionsHandle?.(value);
                  },
                }}
              />
            </WidgetBox>
          ) : (
            <div className="h-3" />
          )}
          {!!messageQuestion?.questions?.length && (
            <ProFormText
              hidden
              name={['message_evaluation', message.message_id, '__sys_message_type']}
              initialValue={EMessageType.receive}
            />
          )}
          {messageQuestion?.questions?.map((item) => {
            return <Widget key={item.id} names={['message_evaluation', message.message_id, item.value]} {...item} />;
          })}
        </div>
      </div>
    </div>
  );
};

const ChatBox: React.FC<PropsWithChildren<IProps>> = ({
  id,
  prompt,
  messages,
  messageQuestion,
  grid,
  userQuestions,
}) => {
  const queryClient = useQueryClient();
  const userInfo = queryClient.getQueryData<IUserInfo>(userInfoKey.all);

  return (
    <div className="text-color">
      {!!prompt && (
        <div className="rounded-md p-8 max-h-[700px] mb-4 overflow-y-auto task-box-bg relative group">
          <Markdown value={prompt} />
          <Copy val={prompt} className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100" />
        </div>
      )}
      {!!messages?.length && (
        <div className="rounded-md task-box-bg">
          <div
            id={id}
            className={clsx('max-h-[680px] p-8 rounded overflow-y-auto', {
              grid: grid > 1,
              'grid-cols-2 gap-4 items-stretch': grid === 2,
              'grid-cols-3 gap-4 items-stretch': grid === 3,
              'grid-cols-4 gap-4 items-stretch': grid === 4,
            })}
          >
            {messages?.map((item, index) => (
              <div
                key={`${item.message_id}_${index}`}
                className={clsx('', item.message_type === EMessageType.send ? 'pl-16' : 'pr-16', {
                  'mb-6 last:mb-0': grid === 1,
                  '!px-5 !py-6 bg-white rounded-md': grid > 1,
                })}
              >
                {item.message_type === EMessageType.send ? (
                  <UserMessage
                    type={grid > 1 ? 'secondary' : 'default'}
                    name={userInfo?.name}
                    message={item}
                    userQuestions={userQuestions}
                  />
                ) : (
                  <BotMessage message={item} messageQuestion={messageQuestion} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
