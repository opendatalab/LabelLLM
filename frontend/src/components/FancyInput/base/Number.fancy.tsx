import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';

export type FancyNumberProps = InputNumberProps & {
  fieldProps?: any;
};

export function FancyNumber({ fieldProps, ...rest }: FancyNumberProps) {
  return <InputNumber {...rest} />;
}
