import type { FormInstance, FormItemProps, Rule } from 'antd/es/form';
import type { NamePath } from 'antd/es/form/interface';

export interface FancyInputParams {
  /** form field type */
  type: string;
  /** form field name */
  field: string;
  /** uniq key */
  key: string;
  label?: React.ReactNode;
  disabled?: boolean;
  initialValue?: any;
  children?: FancyInputParams[];
  hidden?: boolean;
  tooltip?: string;
  rules?: Rule[];
  layout?: 'horizontal' | 'vertical';
  dependencies?: (string | number)[];
  fieldProps?: FormItemProps;
  renderFormItem?: (params: FancyInputParams, form: FormInstance, fullField: NamePath) => React.ReactNode;
  renderGroup?: (params: FancyInputParams, form: FormInstance, fullField: NamePath) => React.ReactNode;
  /** antd input component props, only in template definition */
  antProps?: Record<string, unknown>;
}

export interface FancyInputProps {
  type: string;
  [key: string]: any;
}
