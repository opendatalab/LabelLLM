import type { InputProps } from 'antd';
import { Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';

export interface FancyStringProps extends InputProps {
  alias?: 'input' | 'textarea';
  fieldProps?: any;
  antProps?: any;
  fullField?: any;
}

export function FancyString({ alias = 'input', fieldProps, antProps, fullField, ...rest }: FancyStringProps) {
  if (alias === 'input') {
    return <Input {...rest} />;
  }

  return <Input.TextArea {...(rest as TextAreaProps)} />;
}
