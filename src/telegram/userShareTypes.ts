/**
 * 「用户分享」相关的 Bot API 7.2+ 字段本地补充。
 *
 * 当前安装的 @telegraf/types@7.1.0 仅覆盖到 Bot API 7.1：
 *   - KeyboardButtonRequestUsers 无 request_name / request_username；
 *   - UsersShared 仅有 user_ids: number[]（不含 username / first_name）。
 * 但 api.telegram.org 始终为最新 Bot API，运行时支持这些字段。
 * 故在此本地补类型，并在键盘构造 / 回传解析的边界处做类型断言。
 */

/** request_users 按钮的完整字段（含 7.2+ 的 request_name / request_username / request_photo） */
export interface RequestUsersFull {
  request_id: number;
  user_is_bot?: boolean;
  user_is_premium?: boolean;
  max_quantity?: number;
  request_name?: boolean;
  request_username?: boolean;
  request_photo?: boolean;
}

/** users_shared 回传的单个用户（7.2+ 新格式） */
export interface SharedUser {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/** users_shared 服务消息：7.2+ 用 users；7.1 旧版用 user_ids（降级兜底） */
export interface UsersSharedCompat {
  request_id: number;
  users?: SharedUser[];
  user_ids?: number[];
}

/** 从分享结果提炼出的目标用户（业务层统一使用） */
export interface SharedTarget {
  telegramId: bigint;
  username: string | null;
  firstName: string | null;
}
