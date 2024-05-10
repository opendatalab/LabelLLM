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
  400302: '出错啦，换个任务吧',
  400303: '任务流程不存在',
  400304: '此标注任务已存在对应的审核任务，请选择其他任务',
  401101: '用户名或密码错误',
  // 数据
  400401: '数据不存在',
  400402: '数据不属于用户',
  400403: '此任务已无更多题目了，请换个任务吧',
  400501: '记录不存在',
  // 团队
  400901: '团队不存在',
  400902: '默认团队不允许移除',
  400903: '用户尚未加入该团队',
  400904: '用户已加入该团队',
  400905: '团队成员角色为空',
  400906: '团队应该至少有一个超级管理员',
  400951: '链接不存在',
  400601: '上传限制',
  400701: '流程不存在',
  400702: '抽样比例不合理',
  400801: '翻译服务错误',
  400204: '禁止注册',
  400205: '用户名已被占用',
  400305: '任务已结束',
  400306: '有后续任务，不允许删除当前任务',
  400404: '数据余额不足',
  400907: '邀请链接不存在',
};
