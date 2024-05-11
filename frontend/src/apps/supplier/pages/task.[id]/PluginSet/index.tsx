import { Button, Checkbox, Popover } from 'antd';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';

import { useDatasetsContext } from '@/apps/supplier/pages/task.[id]/context';
import IconFont from '@/components/IconFont';

type IProps = HTMLAttributes<HTMLDivElement>;

export enum EPlugin {
  messagesSendDiff = 'messagesSendDiff', // 针对对话（messages） 对比
}

const PluginSet: React.FC<PropsWithChildren<IProps>> = () => {
  const { plugins, setPlugins, pluginConfig } = useDatasetsContext();

  const RenderTitle = ({ title }: { title: string }) => {
    return <div className="px-4 py-2 text-secondary text-xs">{title}</div>;
  };

  const RenderItem: React.FC<PropsWithChildren> = ({ children }) => {
    return <div className="cursor-pointer px-8 py-2 hover:bg-fill-tertiary">{children}</div>;
  };

  const pluginList = [
    {
      title: '针对对话中的提问',
      show: pluginConfig?.conversation?.message_send_diff,
      options: [
        {
          text: '内容对比',
          value: EPlugin.messagesSendDiff,
          show: pluginConfig?.conversation?.message_send_diff,
        },
      ],
    },
  ];

  // 当有插件的时候显示
  if (pluginList?.some((item) => item.show)) {
    return (
      <div className="flex items-center">
        <Popover
          arrow={false}
          placement="bottomRight"
          overlayInnerStyle={{
            padding: 4,
          }}
          content={
            <div className="w-[212px] py-1">
              <Checkbox.Group value={plugins} style={{ width: '100%' }} onChange={(e) => setPlugins?.(e as EPlugin[])}>
                <div className="w-full">
                  {pluginList.map((item) => {
                    if (item.show) {
                      return (
                        <div key={item.title}>
                          <RenderTitle title={item.title} />
                          {item.options.map((option) => {
                            return (
                              option?.show && (
                                <RenderItem key={option.value}>
                                  <Checkbox value={option.value}>{option.text}</Checkbox>
                                </RenderItem>
                              )
                            );
                          })}
                        </div>
                      );
                    }
                  })}
                </div>
              </Checkbox.Group>
            </div>
          }
        >
          <Button className="mr-1 leading-none" size="small" type="text">
            <div className="flex items-center">
              <IconFont className="text-xl mr-1" type="icon-chajian" />
              <span>插件</span>
            </div>
          </Button>
        </Popover>
        <span className="rounded-full w-5 h-5 bg-fill-tertiary text-sm text-center">{plugins?.length}</span>
      </div>
    );
  }

  return null;
};

export default PluginSet;
