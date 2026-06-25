/**
 * request_users 按钮的场景标识。
 * 选择用户后，users_shared 会原样回传 request_id，据此路由到对应业务场景。
 * 取值需为有符号 32 位整数且在同一消息内唯一。
 */
export const REQUEST_ID = {
  QUERY: 1, // 查询用户
  ADD_BLACKLIST: 2, // 录入黑名单
  ADD_TEACHER: 3, // 添加老师
  ADD_ADMIN: 4, // 添加管理员
} as const;
