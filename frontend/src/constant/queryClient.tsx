import type { PropsWithChildren } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 创建一个 client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const QueryProvider: React.FC<PropsWithChildren> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default queryClient;
