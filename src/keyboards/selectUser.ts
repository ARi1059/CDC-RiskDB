import { Markup } from 'telegraf';
import type { KeyboardButton } from 'telegraf/types';
import { BTN } from '../constants/buttons';
import type { RequestUsersFull } from '../telegram/userShareTypes';

const SELECT_USER_TEXT = '👤 选择用户';

/**
 * 「选择用户」reply 键盘：
 *   - 一个 request_users 按钮（开启 request_name / request_username，单选 1 人）
 *   - 一个「返回首页」
 * requestId 用于在 users_shared 回传时路由到对应场景（查询 / 录入 / 加老师）。
 */
export function selectUserKeyboard(requestId: number) {
  const requestUsers: RequestUsersFull = {
    request_id: requestId,
    user_is_bot: false,
    max_quantity: 1,
    request_name: true,
    request_username: true,
  };

  // 断言：request_name / request_username 超出 @telegraf/types@7.1.0 的定义，
  // 运行时由最新 Bot API 服务端支持（字段会随对象原样发送）。
  const selectButton = {
    text: SELECT_USER_TEXT,
    request_users: requestUsers,
  } as unknown as KeyboardButton.RequestUsersButton;

  return Markup.keyboard([[selectButton], [BTN.HOME]]).resize();
}
