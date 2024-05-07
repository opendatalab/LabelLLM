import { inputs, add, remove } from './fancyInput';
import type { FancyInputProps } from './types';

export default function FancyInput({
  type,
  field,
  key,
  label,
  hidden,
  rules,
  tooltip,
  dependencies,
  fieldProps,
  fullField,
  antProps,
  ...props
}: FancyInputProps) {
  const Input = inputs[type];

  if (!Input) {
    console.warn(`FancyInput: ${type} is not supported`);
    return <>Not supported yet</>;
  }

  return <Input {...props} />;
}

export { add, remove };
