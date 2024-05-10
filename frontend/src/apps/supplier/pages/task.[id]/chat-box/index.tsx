import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import clsx from 'clsx';

import type { IMessage, IMessageQuestion, IQuestion } from '@/apps/supplier/services/task';
import { EMessageType, translate, googleTranslate } from '@/apps/supplier/services/task';
import MessageBox from '@/components/MessageBox';
import Copy from '@/apps/supplier/components/copy';
import { userInfoKey } from '@/constant/query-key-factories';
import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';
import GrammarCheck from '@/apps/supplier/pages/task.[id]/grammar-check';
import { EPlugin } from '@/apps/supplier/pages/task.[id]/pluginSet';
import Translate from '@/apps/supplier/pages/task.[id]/translate';

import Widget, { WidgetBox } from '../widget';
import { IUserInfo } from '@/api/user';

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
  const { pluginConfig, plugins } = useDatasetsContext();
  return (
    <div className="flex justify-end relative">
      <div className="flex min-w-0 w-full items-end flex-col">
        <MessageBox type={type} className="relative group max-w-full">
          <>
            <GrammarCheck
              showOriginalText={true}
              className="text-right"
              value={message.content}
              language={pluginConfig?.conversation?.grammar_checking_from}
              plugin={EPlugin.messagesGrammarCheck}
            />
            <div className="absolute pr-1.5 pb-4 left-1 top-1 hidden group-hover:block">
              <Copy val={message.content} />
            </div>
          </>
        </MessageBox>
        {/* Google 翻译 */}
        {plugins?.includes(EPlugin.googleMessagesTranslate) && (
          <MessageBox type={type} className="relative group max-w-full mt-2">
            <Translate
              api={googleTranslate}
              tool="Google"
              showOriginalText={true}
              value={message.content}
              from={pluginConfig?.conversation?.google_translate_from as string}
              to={pluginConfig?.conversation?.google_translate_to as string}
              render={(value: string) => (
                <div className="absolute pr-1.5 pb-4 left-1 top-1 hidden group-hover:block">
                  <Copy val={value} />
                </div>
              )}
            />
          </MessageBox>
        )}
        {/* Deepl 翻译 */}
        {plugins?.includes(EPlugin.messagesTranslate) && (
          <MessageBox type={type} className="relative group max-w-full mt-2">
            <Translate
              tool="Deepl"
              showOriginalText={true}
              api={translate}
              value={message.content}
              from={pluginConfig?.conversation?.translate_from as string}
              to={pluginConfig?.conversation?.translate_to as string}
              render={(value: string) => (
                <div className="absolute pr-1.5 pb-4 left-1 top-1 hidden group-hover:block">
                  <Copy val={value} />
                </div>
              )}
            />
          </MessageBox>
        )}
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
  const { pluginConfig, plugins } = useDatasetsContext();

  return (
    <div className="flex relative">
      <Avatar className="shrink-0 mr-4 bg-primary" icon={<RobotOutlined />} />
      <div className="flex min-w-0 w-full items-start flex-col">
        <MessageBox type="primary" className="relative group max-w-full">
          <>
            <GrammarCheck
              className="text-right"
              value={message.content}
              language={pluginConfig?.conversation?.grammar_checking_from}
              plugin={EPlugin.messagesGrammarCheck}
            />
            <div className="absolute pl-1.5 pb-4 right-1 top-1 hidden group-hover:block">
              <Copy val={message.content} />
            </div>
          </>
        </MessageBox>

        {/* Google 翻译 */}
        {plugins?.includes(EPlugin.googleMessagesTranslate) && (
          <MessageBox type="primary" className="relative group max-w-full mt-2">
            <Translate
              tool="Google"
              api={googleTranslate}
              value={message.content}
              from={pluginConfig?.conversation?.google_translate_from as string}
              to={pluginConfig?.conversation?.google_translate_to as string}
              render={(value: string) => (
                <div className="absolute pl-1.5 pb-4 right-1 top-1 hidden group-hover:block">
                  <Copy val={value} />
                </div>
              )}
            />
          </MessageBox>
        )}
        {/* Deepl 翻译 */}
        {plugins?.includes(EPlugin.messagesTranslate) && (
          <MessageBox type="primary" className="relative group max-w-full mt-2">
            <Translate
              tool="Deepl"
              api={translate}
              value={message.content}
              from={pluginConfig?.conversation?.translate_from as string}
              to={pluginConfig?.conversation?.translate_to as string}
              render={(value: string) => (
                <div className="absolute pl-1.5 pb-4 right-1 top-1 hidden group-hover:block">
                  <Copy val={value} />
                </div>
              )}
            />
          </MessageBox>
        )}

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
  const { pluginConfig, plugins } = useDatasetsContext();

  return (
    <div className="text-color">
      {!!prompt && (
        <div className="rounded-md p-8 max-h-[700px] mb-4 overflow-y-auto task-box-bg relative group">
          <GrammarCheck
            className="text-right"
            value={prompt}
            language={pluginConfig?.content?.grammar_checking_from}
            plugin={EPlugin.promptGrammarCheck}
          />
          <Copy val={prompt} className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100" />
          {plugins?.includes(EPlugin.promptGoogleTranslate) && (
            <div className="relative border-0 border-t border-solid border-fill-secondary mt-2 pt-4">
              <Translate
                tool="Google"
                api={googleTranslate}
                value={prompt}
                from={pluginConfig?.content?.google_translate_from as string}
                to={pluginConfig?.content?.google_translate_to as string}
                render={(v) => <Copy val={v} className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100" />}
              />
            </div>
          )}
          {plugins?.includes(EPlugin.promptTranslate) && (
            <div className="relative border-0 border-t border-solid border-fill-secondary mt-2 pt-4">
              <Translate
                tool="Deepl"
                api={translate}
                value={prompt}
                from={pluginConfig?.content?.translate_from as string}
                to={pluginConfig?.content?.translate_to as string}
                render={(v) => <Copy val={v} className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100" />}
              />
            </div>
          )}
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
