# 标签分类和文本描述 FancyInput 组件

> 本组件来自于 Labelu kit 的标注工具配置业务组件

## 使用

### 与 FancyGroup 模板结合使用

```tsx
import FancyCategoryAttribute from './index';

// 注册组件
add('category-attribute', FancyCategoryAttribute);

const template: FancyInputParams[] = [
  {
    type: 'category-attribute',
    key: 'field',
    field: 'attributes',
    label: '',
    addStringText: '新建',
    disabledStringOptions: ['order'],
    showAddTag: false,
    initialValue: [
      {
        key: '标签-1',
        value: 'label-1',
        type: 'string',
        maxLength: 1000,
        stringType: 'text',
        required: false,
        defaultValue: '',
      },
    ],
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

### 作为 FancyInput 使用

```tsx
import FancyCategoryAttribute from './index';

// 注册组件
add('category-attribute', FancyCategoryAttribute);

function MyForm() {
  const [form] = Form.useForm();

  return (
    <Form name="myForm">
      <Form.Item name="abc" label="文本描述">
        <FancyInput
          type="category-attribute"
          addStringText="新建"
          disabledStringOptions={['order']}
          showAddTag={false}
        />
    </Form.Item>
  );
}
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 值 | CategoryAttributeItem[] | [] |
| defaultValue | 默认值 | CategoryAttributeItem[] | [] |
| onChange | 值变化时的回调 | (value: CategoryAttributeItem[]) => void | - |
| className | 样式类名 | string | - |
| style | 样式 | React.CSSProperties | - |
| affixProps | Affix 组件的属性，当编辑区域超过容器需要固定「新建」按钮时可设置此属性，见[Affix](https://ant.design/components/affix-cn#api) | AffixProps | - |
| addTagText | 添加标签的文本 | string | '新建分类属性' |
| addStringText | 添加文本的文本 | string | '新建文本分类' |
| showAddTag | 是否显示添加标签按钮 | boolean | true |
| showAddString | 是否显示添加文本按钮 | boolean | true |
| disabledStringOptions | 禁用的文本类型 | string[] | [] |
