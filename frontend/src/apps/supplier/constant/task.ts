export enum ERouterTaskType {
  task = 'task',
  audit = 'audit',
  preview = 'preview', // 管理端 左边栏点击 预览配置
  previewAudit = 'preview_audit', // 管理端 左边栏点击 预览配置
  review = 'review', // 管理端 点击查看题目 单题 源题 统计分析里面的点击跳转
  reviewTask = 'review_task', // 预览某个标注员任务 精确到人
  reviewAudit = 'review_audit', // 预览某个审核员审核 精确到人
  reviewAudits = 'review_audits', // 预览 所有审核任务 审核查看题目
}
