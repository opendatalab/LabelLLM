import { FancyBoolean } from './base/Boolean.fancy';
import { FancyEnum } from './base/Enum.fancy';
import { FancyString } from './base/String.fancy';
import { FancyNumber } from './base/Number.fancy';

export const inputs: Record<string, React.FC<any>> = {
  enum: FancyEnum,
  string: FancyString,
  number: FancyNumber,
  boolean: FancyBoolean,
};

export const inputMapping: Record<string, string> = {
  string: '字符串',
  number: '数字',
  boolean: '布尔值',
  enum: '选择',
};

export function add<T>(type: string, component: React.FC<T>) {
  if (inputs[type]) {
    console.warn(`[FancyInput] ${type} already exists`);
    return;
  }

  inputs[type] = component;
}

export function remove(type: string) {
  delete inputs[type];
}
