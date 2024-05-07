import { Popover } from 'antd';
import { useLayoutEffect, useState } from 'react';

import { ReactComponent as WeChatIcon } from './assets/wechat.svg';
import weChatQRcode from './assets/qrcode.png';

export default function WeChatPopover() {
  const [visible, setVisible] = useState(true);

  // 进入页面默认显示3秒
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handlePopoverChange = (value: boolean) => {
    setVisible(value);
  };

  return (
    <Popover
      open={visible}
      trigger="hover"
      onOpenChange={handlePopoverChange}
      content={
        <div className="flex flex-col text-[12px] text-center gap-1 font-semibold">
          <img className="w-[120px] h-[120px] mb-2.5" src={weChatQRcode} alt="扫描联系小助手微信号" />
          <span>扫描联系小助手微信号</span>
          <span>运营“一对一”沟通</span>
        </div>
      }
      placement="topLeft"
    >
      <div className="absolute right-8 bottom-8 text-2xl rounded-full bg-white w-[40px] h-[40px] flex items-center justify-center cursor-help">
        <WeChatIcon />
      </div>
    </Popover>
  );
}
