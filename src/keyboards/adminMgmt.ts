import { Markup } from 'telegraf';
import type { User } from '@prisma/client';
import { BTN } from '../constants/buttons';
import { teacherDisplay } from '../views/teacher';

/** 管理员管理子菜单（reply 键盘） */
export function adminMgmtMenu() {
  return Markup.keyboard([
    [BTN.ADD_ADMIN],
    [BTN.REMOVE_ADMIN],
    [BTN.ADMIN_LIST],
    [BTN.HOME],
  ]).resize();
}

/** 移除管理员：管理员列表（inline，callback 携带 telegram_id） */
export function removeAdminInlineKeyboard(admins: User[]) {
  const rows = admins.map((a) => [
    Markup.button.callback(teacherDisplay(a), `rma:${a.telegramId}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

/** 移除管理员二次确认（inline） */
export function confirmRemoveAdminInlineKeyboard(id: bigint) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ 确认移除（降为老师）', `rmac:${id}`)],
    [Markup.button.callback('↩️ 取消', 'rmax')],
  ]);
}
