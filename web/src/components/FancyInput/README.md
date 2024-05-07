# FancyInput

基于模板生成 antd 表单的组件，支持自定义模板。

## 使用

```tsx
import { Form } from 'antd';
import type { FancyInputParams } from '@/components/FancyInput/types';
import FancyGroup from '@/components/FancyGroup';

const template: FancyInputParams[] = [
  {
    field: 'name',
    key: 'name',
    type: 'string',
    initialValue: 'AI',
  },
  {
    field: 'tool',
    key: 'tool',
    type: 'enum',
    initialValue: 'lineTool',
    antProps: {
      options: [
        { label: '直线', value: 0 },
        { label: '贝塞尔曲线', value: 1 },
      ],
    },
  },
];

function MyForm() {
  const [form] = Form.useForm();

  return (
    <Form name="myForm">
      <FancyGroup
        form={form}
        template={template}
        onFinish={(values) => {
          console.log(values);
        }}
      />
    </Form>
  );
}
```

## 注册自定义表单组件，然后在模板中使用

```tsx
import { Form } from 'antd';
import type { FancyInputParams } from '@/components/FancyInput/types';
import FancyGroup from '@/components/FancyGroup';
import FancyInput, { add } from '@/components/FancyInput';

interface MyInputProps {
  value: string;
  onChange: (value: string) => void;
}

// 与 antd form 自定义表单组件一致，见：https://ant.design/components/form-cn#components-form-demo-customized-form-controls
function MyInput({ value, onChange }: MyInputProps) {
  const [stateValue, setStateValue] = useState(value);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: newValue } = e.target;
    setStateValue(newValue);
    onChange?.(newValue);
  };

  return <input value={stateValue} onChange={handleOnChange} {...props} />;
}

// 注册fancyInput自定义输入组件
add('my-input', FancyAttributeList);

// 在template 中声明使用
const template: FancyInputParams[] = [
  {
    field: 'name',
    key: 'name',
    type: 'my-input',
    initialValue: 'AI',
  },
  {
    field: 'tool',
    key: 'tool',
    type: 'enum',
    initialValue: 'lineTool',
    antProps: {
      options: [
        { label: '直线', value: 0 },
        { label: '贝塞尔曲线', value: 1 },
      ],
    },
  },
];

function MyForm() {
  const [form] = Form.useForm();

  return (
    <Form name="myForm">
      <FancyGroup
        form={form}
        template={template}
        onFinish={(values) => {
          console.log(values);
        }}
      />
    </Form>
  );
}

// 直接使用FancyInput
<FancyInput type="my-input" value="123" />;
```
