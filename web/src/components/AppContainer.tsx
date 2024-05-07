import { App as AntApp, ConfigProvider } from 'antd';
import type { ConfigProviderProps } from 'antd/es/config-provider';

import StaticAnt from '@/components/StaticAnt';
import themeToken from '@/styles/theme.json';

interface AppProps extends ConfigProviderProps {
  children: React.ReactNode;
  className?: string;
}

const AppContainer: React.FC<AppProps> = ({ children, className, ...rest }) => {
  return (
    <ConfigProvider theme={themeToken} {...rest}>
      <AntApp className={className}>
        <StaticAnt />
        {children}
      </AntApp>
    </ConfigProvider>
  );
};

export default AppContainer;
