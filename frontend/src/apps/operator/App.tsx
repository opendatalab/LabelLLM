import AppContainer from '@/components/AppContainer';
import RouterContainer from '@/components/RouterContainer';
import { QueryProvider } from '@/constant/queryClient';

import routes from './routes';
import { ReactComponent as EmptyElement } from './assets/empty.svg';

const customEmpty = () => {
  return (
    <div className="flex flex-col justify-center items-center py-4">
      <EmptyElement className="w-20 h-20" />
      <p className="text-[var(--color-text-secondary)]">暂无数据</p>
    </div>
  );
};

export default function App() {
  return (
    <QueryProvider>
      <AppContainer renderEmpty={customEmpty}>
        <RouterContainer routes={routes} basename="/operator" />
      </AppContainer>
    </QueryProvider>
  );
}
