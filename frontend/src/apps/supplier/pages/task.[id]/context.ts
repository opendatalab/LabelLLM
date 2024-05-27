import React from 'react';

import type { EPlugin } from '@/apps/supplier/pages/task.[id]/PluginSet';
import type { IPluginConfig } from '@/apps/supplier/services/task';

interface IOptions {
  label: string | number;
  value: string | number;
  disabled?: boolean;
}

export const DatasetsDetailContext = React.createContext<{
  data_id?: string;
  pluginConfig?: IPluginConfig;
  plugins?: EPlugin[];
  setPlugins?: (plugins: EPlugin[]) => void;
  sortOptions?: IOptions[];
  setSortOptionsHandle?: (v: number) => void;
}>({});

export const useDatasetsContext = () => {
  const context = React.useContext(DatasetsDetailContext);
  if (!context) {
    throw new Error('useDatasetsContext 必须在 DatasetsDetailContext 中使用 ');
  }
  return context;
};
