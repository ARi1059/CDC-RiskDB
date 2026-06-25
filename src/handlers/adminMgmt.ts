import type { Telegraf } from 'telegraf';
import type { BotContext } from '../context';
import type { SharedTarget } from '../telegram/userShareTypes';
import { REQUEST_ID } from '../constants/requests';
import { BTN } from '../constants/buttons';
import { selectUserKeyboard } from '../keyboards/selectUser';
import {
  adminMgmtMenu,
  removeAdminInlineKeyboard,
  confirmRemoveAdminInlineKeyboard,
} from '../keyboards/adminMgmt';
import { formatAdminList, addAdminResultMessage, removeAdminResultMessage } from '../views/admin';
import { teacherDisplay } from '../views/teacher';
import { listAdmins, addAdmin, removeAdmin, findUserById } from '../services/user.service';
import { logger } from '../utils/logger';

function isAdmin(ctx: BotContext): boolean {
  return ctx.dbUser?.role === 'admin';
}

async function denyIfNotAdmin(ctx: BotContext): Promise<boolean> {
  if (isAdmin(ctx)) return false;
  await ctx.reply('⛔ 仅管理员可用');
  return true;
}

/** 添加管理员：users_shared(ADD_ADMIN) 回调 */
export async function handleSelectedUserForAddAdmin(
  ctx: BotContext,
  target: SharedTarget,
): Promise<void> {
  if (!isAdmin(ctx)) return;
  const result = await addAdmin({
    telegramId: target.telegramId,
    username: target.username,
    firstName: target.firstName,
  });
  await ctx.reply(addAdminResultMessage(result.status, result.user), adminMgmtMenu());
  logger.info({ target: String(target.telegramId), status: result.status }, '添加管理员');
}

/** 注册管理员管理全流程（仅管理员） */
export function registerAdminMgmt(bot: Telegraf<BotContext>): void {
  // 入口
  bot.hears(BTN.ADMIN_MGMT, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    await ctx.reply('管理员管理', adminMgmtMenu());
  });

  // 添加管理员 → 选用户
  bot.hears(BTN.ADD_ADMIN, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    await ctx.reply('请选择需要设为管理员的用户', selectUserKeyboard(REQUEST_ID.ADD_ADMIN));
  });

  // 管理员列表
  bot.hears(BTN.ADMIN_LIST, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    await ctx.reply(formatAdminList(await listAdmins()), adminMgmtMenu());
  });

  // 移除管理员 → 列表（inline）
  bot.hears(BTN.REMOVE_ADMIN, async (ctx) => {
    if (await denyIfNotAdmin(ctx)) return;
    const admins = await listAdmins();
    if (admins.length <= 1) {
      await ctx.reply('当前仅 1 名管理员，不能移除（系统须至少保留 1 名）。', adminMgmtMenu());
      return;
    }
    await ctx.reply('选择要移除（降为老师）的管理员：', removeAdminInlineKeyboard(admins));
  });

  // 选中某管理员 → 二次确认
  bot.action(/^rma:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const t = await findUserById(BigInt(idStr));
    if (!t || t.role !== 'admin') {
      await ctx.editMessageText('该用户已不是管理员。');
      return;
    }
    await ctx.editMessageText(
      `确认将管理员 ${teacherDisplay(t)} 降为老师？`,
      confirmRemoveAdminInlineKeyboard(BigInt(idStr)),
    );
  });

  // 确认移除
  bot.action(/^rmac:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const result = await removeAdmin(BigInt(idStr));
    await ctx.editMessageText(
      removeAdminResultMessage(result.status, result.status === 'demoted' ? result.user : undefined),
    );
    if (result.status === 'demoted') {
      logger.info({ admin: idStr }, '管理员已降为老师');
    }
  });

  // 取消
  bot.action('rmax', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('已取消。');
  });
}
