import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';

import { useUserInfo } from '@/apps/operator/hooks/useUserInfo';
import CustomEmpty from '@/apps/operator/components/CustomEmpty';

import empty from '../assets/noAuth.svg';

type IProps = HTMLAttributes<HTMLDivElement>;

const NoAuth: React.FC<PropsWithChildren<IProps>> = () => {
  const { data } = useUserInfo();
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center">
      <CustomEmpty
        image={empty}
        description={
          <div>
            <div className="text-base">您无相关页面操作权限，请联系运营开通</div>
            <div className="text-secondary mt-2">您的账户信息 - 用户名：{data?.name}</div>
          </div>
        }
      />
    </div>
  );
};

export default NoAuth;
