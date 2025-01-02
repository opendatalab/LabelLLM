import store from 'storejs';

// 特殊 code 业务里自行处理
export enum EECode {
  // 跳过任务 code
  RELEASE_ERROR = 400305,
  // 没有权限
  USER_PERMISSION_DENIED = 403002,
  // 翻译服务不可用
  TRANSLATE_SERVICE_UNAVAILABLE = 400801,
}

export const ECode = {
  500001: '服务器错误',
  403002: '用户权限不足',
  403003: '参数格式错误',
  4011001: 'Token 无效',
  // 用户
  400201: '此账号不存在，请确定账号已登录过平台',
  400202: '此账号已是运营，添加失败',
  400203: '此账号已是运营，添加失败',
  // 任务
  400301: '任务不存在',
  400302: '任务已结束, 不支持修改',
  400303: '任务流程不存在',
  400304: '此标注任务已存在对应的审核任务，请选择其他任务',
  // 数据
  400401: '数据不存在',
  400402: '数据不属于用户',
  400403: '此任务已无更多题目了，请换个任务吧',
  // 团队
  400901: '团队不存在',
  400902: '默认团队不允许移除',
  400903: '用户尚未加入该团队',
  400904: '用户已加入该团队',
  400905: '团队成员角色为空',
  400906: '团队应该至少有一个超级管理员',
  400951: '链接不存在',
} as Record<string, string>;

const ECodeEn = {
  500001: 'Server error',
  403002: 'Insufficient user permissions',
  403003: 'Invalid parameter format',
  4011001: 'Invalid Token',
  // User
  400201: 'This account does not exist, please ensure the account has logged into the platform',
  400202: 'This account is already an operator, addition failed',
  400203: 'This account is already an operator, addition failed',
  // Task
  400301: 'Task does not exist',
  400302: 'An error occurred, please choose a different task',
  400303: 'Task process does not exist',
  400304: '此标注任务已存在对应的审核任务，请选择其他任务',
  // Data
  400401: 'Data does not exist',
  400402: 'Data does not belong to the user',
  400403: 'No more questions available for this task, please choose a different task',
  // Team
  400901: 'Team does not exist',
  400902: 'The default team cannot be removed',
  400903: 'User has not joined the team',
  400904: 'User has already joined the team',
  400905: 'Team member role is empty',
  400906: 'The team should have at least one super administrator',
  400951: 'Link does not exist',
} as Record<string, string>;

export const getErrorText = (code: number) => {
  const lang = store('lang') || 'zh-CN';
  return lang === 'zh-CN' ? ECode[code] : ECodeEn[code];
};
