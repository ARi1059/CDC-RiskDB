import { Markup } from 'telegraf';
import type { User } from '@prisma/client';
import { BTN } from '../constants/buttons';
import { teacherDisplay } from '../views/teacher';

/** 老师管理子菜单（reply 键盘） */
export function teacherMgmtMenu() {
  return Markup.keyboard([
    [BTN.ADD_TEACHER],
    [BTN.REMOVE_TEACHER],
    [BTN.TEACHER_LIST],
    [BTN.HOME],
  ]).resize();
}

/** 移除老师：在职老师列表（inline，callback 携带 telegram_id） */
export function removeTeacherInlineKeyboard(teachers: User[]) {
  const rows = teachers.map((t) => [
    Markup.button.callback(teacherDisplay(t), `rmt:${t.telegramId}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

/** 停用某老师的二次确认（inline） */
export function confirmRemoveTeacherInlineKeyboard(id: bigint) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ 确认停用', `rmtc:${id}`)],
    [Markup.button.callback('↩️ 取消', 'rmtx')],
  ]);
}
