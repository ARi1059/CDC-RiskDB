/** 全部键盘按钮文案常量。菜单渲染与 hears 匹配共用同一来源，避免不一致。 */
export const BTN = {
  QUERY: '🔍 查询用户',
  ADD_BLACKLIST: '🚫 录入黑名单',
  ANNOUNCEMENT: '📢 机器人公告',
  TEACHER_MGMT: '👨‍🏫 老师管理',
  SYSTEM_SETTINGS: '⚙️ 系统设置',
  HOME: '🏠 返回首页',
  CONFIRM_ADD: '✅ 确认录入',
  CANCEL_ADD: '❌ 取消录入',
  CONTINUE_ADD: '🚫 继续录入',
  UPDATE_REASON: '🔄 更新原因',
  DELETE_RECORD: '🗑 删除记录',
  ADD_TEACHER: '➕ 添加老师',
  REMOVE_TEACHER: '➖ 移除老师',
  TEACHER_LIST: '📋 老师列表',
  PUBLISH_ANNOUNCEMENT: '📢 发布公告',
  ANNOUNCEMENT_MGMT: '📜 公告管理',
} as const;

/** Teacher 与 Admin 共有的功能按钮 */
export const TEACHER_FEATURE_BUTTONS: string[] = [
  BTN.QUERY,
  BTN.ADD_BLACKLIST,
  BTN.ANNOUNCEMENT,
];

/** 仅 Admin 可见的按钮 */
export const ADMIN_ONLY_BUTTONS: string[] = [BTN.TEACHER_MGMT, BTN.SYSTEM_SETTINGS];
