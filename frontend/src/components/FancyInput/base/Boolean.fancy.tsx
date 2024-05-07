import type { SwitchProps } from 'antd';
import { Switch } from 'antd';

export interface FancyBooleanProps extends SwitchProps {
  value: boolean;
}

export function FancyBoolean({ value, ...rest }: FancyBooleanProps) {
  return <Switch checked={value} {...rest} />;
}
