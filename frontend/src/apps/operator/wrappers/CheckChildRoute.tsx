import { useOutlet } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type React from 'react';

const CheckChildRoute: React.FC<PropsWithChildren<any>> = ({ children }) => {
  const outlet = useOutlet();

  // 如果有子路由，不渲染当前组件
  if (outlet) {
    return outlet;
  }

  return children;
};

export default CheckChildRoute;
