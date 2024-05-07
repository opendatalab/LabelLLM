import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';

export type FancyNumberProps = InputNumberProps;

export function FancyNumber(props: FancyNumberProps) {
  return <InputNumber {...props} />;
}
