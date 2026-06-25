import { Markup } from 'telegraf';
import type { Role } from '@prisma/client';
import { BTN } from '../constants/buttons';

/**
 * 按角色生成主菜单 reply 键盘。
 * Teacher：查询 / 录入 / 我的黑名单 / 公告
 * Admin：在此之上追加「老师管理 / 系统设置」
 */
export function mainMenuKeyboard(role: Role) {
  const rows: string[][] = [
    [BTN.QUERY, BTN.ADD_BLACKLIST],
    [BTN.MY_BLACKLIST, BTN.ANNOUNCEMENT],
  ];
  if (role === 'admin') {
    rows.push([BTN.TEACHER_MGMT, BTN.SYSTEM_SETTINGS]);
  }
  return Markup.keyboard(rows).resize();
}
