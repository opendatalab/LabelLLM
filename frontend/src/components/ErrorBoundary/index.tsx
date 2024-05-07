import { Result } from 'antd';
import React, { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default function CustomErrorBoundary({ children }: React.PropsWithChildren) {
  const fallback = <Result status="error" title="Something went wrong." />;

  useEffect(() => {
    const isRefreshed = Boolean(sessionStorage.getItem('error::refreshed'));

    // 如果遇到文件更新（比如升级）时，异步文件加载失败，刷新一次页面
    if (!isRefreshed) {
      sessionStorage.setItem('error::refreshed', 'true');
      window.location.reload();
    }
  }, []);

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
