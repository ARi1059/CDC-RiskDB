/** 全部键盘按钮文案常量。菜单渲染与 hears 匹配共用同一来源，避免不一致。 */
export const BTN = {
  QUERY: '🔍 查询用户',
  ADD_BLACKLIST: '🚫 录入黑名单',
  MY_BLACKLIST: '📋 我的黑名单',
  ANNOUNCEMENT: '📢 机器人公告',
  TEACHER_MGMT: '👨‍🏫 老师管理',
  SYSTEM_SETTINGS: '⚙️ 系统设置',
  HOME: '🏠 返回首页',
} as const;

/** Teacher 与 Admin 共有的功能按钮 */
export const TEACHER_FEATURE_BUTTONS: string[] = [
  BTN.QUERY,
  BTN.ADD_BLACKLIST,
  BTN.MY_BLACKLIST,
  BTN.ANNOUNCEMENT,
];

/** 仅 Admin 可见的按钮 */
export const ADMIN_ONLY_BUTTONS: string[] = [BTN.TEACHER_MGMT, BTN.SYSTEM_SETTINGS];
