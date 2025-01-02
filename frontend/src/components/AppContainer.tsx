import { App as AntApp, ConfigProvider } from 'antd';
import type { ConfigProviderProps } from 'antd/es/config-provider';
import { IntlProvider } from 'react-intl';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

import StaticAnt from '@/components/StaticAnt';
import locale from '../locales';
import UseLang from '@/hooks/useLang';

import themeToken from '../styles/theme.json';

interface AppProps extends ConfigProviderProps {
  children: React.ReactNode;
  className?: string;
}

const antdLocale = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as Record<string, any>;

// eslint-disable-next-line react/prop-types
const AppContainer: React.FC<AppProps> = ({ children, className, ...rest }) => {
  const { lang } = UseLang();
  return (
    <IntlProvider locale={lang || 'zh-CN'} messages={locale[lang || 'zh-CN']}>
      <ConfigProvider theme={themeToken} {...rest} locale={antdLocale[lang]}>
        <AntApp className={className}>
          <StaticAnt />
          {children}
        </AntApp>
      </ConfigProvider>
    </IntlProvider>
  );
};

export default AppContainer;
