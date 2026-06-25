import type { Telegraf } from 'telegraf';
import type { BotContext } from '../context';
import type { SharedTarget } from '../telegram/userShareTypes';
import { REQUEST_ID } from '../constants/requests';
import { BTN } from '../constants/buttons';
import { selectUserKeyboard } from '../keyboards/selectUser';
import {
  teacherMgmtMenu,
  removeTeacherInlineKeyboard,
  confirmRemoveTeacherInlineKeyboard,
} from '../keyboards/teacherMgmt';
import { formatTeacherList, addTeacherResultMessage, teacherDisplay } from '../views/teacher';
import { listActiveTeachers, addTeacher, disableTeacher, findUserById } from '../services/user.service';
import { logger } from '../utils/logger';

function isAdmin(ctx: BotContext): boolean {
  return ctx.dbUser?.role === 'admin';
}

/** 返回 true 表示已拦截（非管理员） */
async function denyIfNotAdmin(ctx: BotContext): Promise<boolean> {
  if (isAdmin(ctx)) return false;
  await ctx.reply('⛔ 仅管理员可用');
  return true;
}

/** 添加老师：users_shared(ADD_TEACHER) 回调 */
export async function handleSelectedUserForAddTeacher(
  ctx: BotContext,
  target: SharedTarget,
): Promise<void> {
  if (!isAdmin(ctx)) return;
  const result = await addTeacher({
    telegramId: target.telegramId,
    username: target.username,
    firstName: target.firstName,
  });
  await ctx.reply(addTeacherResultMessage(result.status, result.user), teacherMgmtMenu());
  logger.info({ target: String(target.telegramId), status: result.status }, '添加老师');
}

/** 注册老师管理全流程（仅管理员） */
export function registerTeacherMgmt(bot: Telegraf<BotContext>): void {
  // 入口
  bot.hears(BTN.TEACHER_MGMT, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    await ctx.reply('老师管理', teacherMgmtMenu());
  });

  // 添加老师 → 选用户
  bot.hears(BTN.ADD_TEACHER, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    await ctx.reply('请选择需要授权的用户', selectUserKeyboard(REQUEST_ID.ADD_TEACHER));
  });

  // 老师列表
  bot.hears(BTN.TEACHER_LIST, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    const teachers = await listActiveTeachers();
    await ctx.reply(formatTeacherList(teachers), teacherMgmtMenu());
  });

  // 移除老师 → 在职老师列表（inline）
  bot.hears(BTN.REMOVE_TEACHER, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    const teachers = await listActiveTeachers();
    if (teachers.length === 0) {
      await ctx.reply('当前没有在职老师。', teacherMgmtMenu());
      return;
    }
    await ctx.reply('选择要停用的老师：', removeTeacherInlineKeyboard(teachers));
  });

  // 选中某老师 → 二次确认
  bot.action(/^rmt:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const id = BigInt(idStr);
    const t = await findUserById(id);
    if (!t || t.role !== 'teacher' || !t.isActive) {
      await ctx.editMessageText('该老师已不在在职列表中。');
      return;
    }
    await ctx.editMessageText(
      `确认停用老师 ${teacherDisplay(t)}？\n停用后其历史录入记录保留并继续生效。`,
      confirmRemoveTeacherInlineKeyboard(id),
    );
  });

  // 确认停用
  bot.action(/^rmtc:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const updated = await disableTeacher(BigInt(idStr));
    if (!updated) {
      await ctx.editMessageText('停用失败：该老师可能已被停用。');
      return;
    }
    await ctx.editMessageText(`✅ 已停用老师 ${teacherDisplay(updated)}\n其历史录入记录全部保留。`);
    logger.info({ teacher: idStr }, '老师已停用');
  });

  // 取消
  bot.action('rmtx', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('已取消。');
  });
}
