import type { SwitchProps } from 'antd';
import { Switch } from 'antd';

export interface FancyBooleanProps extends SwitchProps {
  value: boolean;
  fieldProps?: any;
  fullField?: any;
}

export function FancyBoolean({ value, fieldProps, fullField, ...rest }: FancyBooleanProps) {
  return <Switch checked={value} {...rest} />;
}
