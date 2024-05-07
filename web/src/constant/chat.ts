export const model = {
  name: 'PuYu000',
  description: '基于浦江PJLM-0进行了人类对齐训练的模型',
};

export enum EPlugins {
  calculator = 'calculator',
  equation = 'equation',
  search = 'search',
}

export const plugins = {
  [EPlugins.calculator]: {
    value: EPlugins.calculator,
    label: '计算器',
    desc: '执行加减乘除等数值运算',
  },
  [EPlugins.equation]: {
    value: EPlugins.equation,
    label: '解方程器',
    desc: '求解带有未知数的方程',
  },
  [EPlugins.search]: {
    value: EPlugins.search,
    label: '搜索',
    desc: '实时搜索引擎搜索',
  },
};
export enum EUserType {
  user = 'user',
  robot = 'robot',
}
