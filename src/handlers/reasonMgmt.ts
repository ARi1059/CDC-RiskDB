import type { Telegraf } from 'telegraf';
import { Prisma } from '@prisma/client';
import type { BotContext } from '../context';
import { BTN } from '../constants/buttons';
import { getFlow, setFlow, clearFlow } from '../session';
import { Markup } from 'telegraf';
import {
  reasonMgmtMenu,
  reasonMgmtInlineKeyboard,
  confirmDeleteReasonInlineKeyboard,
} from '../keyboards/systemSettings';
import { reasonButtonText, parseReasonInput } from '../constants/reasons';
import {
  listReasons,
  findReasonById,
  createReason,
  deleteReason,
} from '../services/reason.service';
import { logger } from '../utils/logger';

function isAdmin(ctx: BotContext): boolean {
  return ctx.dbUser?.role === 'admin';
}

/** 回复当前原因列表（inline 可删 + 提示）。列表为空时给出引导。 */
async function replyReasonList(ctx: BotContext): Promise<void> {
  const list = await listReasons();
  if (list.length === 0) {
    await ctx.reply('当前没有拉黑原因。点「➕ 新增原因」添加。', reasonMgmtMenu());
    return;
  }
  await ctx.reply(
    `当前拉黑原因（共 ${list.length} 项，点条目可删除）：`,
    reasonMgmtInlineKeyboard(list),
  );
  await ctx.reply('点「➕ 新增原因」添加，或「🏠 返回首页」。', reasonMgmtMenu());
}

/**
 * 文本兜底前调用：处于「新增原因」态时，把文本解析为 emoji + label 并入库。
 * 返回 true 表示已消费（否则交回兜底）。
 */
export async function handleAddReasonText(ctx: BotContext, text: string): Promise<boolean> {
  const flow = getFlow(ctx);
  if (flow?.kind !== 'addReasonInput') return false;
  const user = ctx.dbUser;
  if (!user || user.role !== 'admin') {
    clearFlow(ctx);
    return true;
  }
  const parsed = parseReasonInput(text);
  if (!parsed) {
    await ctx.reply('原因不能为空，请重新输入，或点返回首页取消。');
    return true;
  }
  if (parsed.label.length > 50) {
    await ctx.reply('原因过长（最多 50 字），请重新输入。');
    return true;
  }
  try {
    const reason = await createReason(parsed.label, parsed.emoji, user.telegramId);
    clearFlow(ctx);
    await ctx.reply(`✅ 已新增拉黑原因：${reasonButtonText(reason)}`);
    await replyReasonList(ctx);
    logger.info({ label: reason.label, by: String(user.telegramId) }, '拉黑原因已新增');
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      await ctx.reply('该原因已存在，请换一个，或点返回首页取消。');
      return true; // 保留流程可重试
    }
    logger.error({ err }, '新增拉黑原因失败');
    clearFlow(ctx);
    await ctx.reply('新增失败，请重试。', reasonMgmtMenu());
  }
  return true;
}

/** 注册「拉黑原因管理」（仅管理员）。 */
export function registerReasonMgmt(bot: Telegraf<BotContext>): void {
  // 🏷 拉黑原因管理 → 列表
  bot.hears(BTN.REASON_MGMT, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('⛔ 仅管理员可用');
      return;
    }
    await replyReasonList(ctx);
  });

  // ➕ 新增原因 → 进入文本输入流程
  bot.hears(BTN.ADD_REASON, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('⛔ 仅管理员可用');
      return;
    }
    setFlow(ctx, { kind: 'addReasonInput' });
    await ctx.reply(
      '请输入新的拉黑原因（纯文字，可在开头带一个 emoji，如「🎣 钓鱼」；点返回首页取消）：',
      Markup.keyboard([[BTN.HOME]]).resize(),
    );
  });

  // 删除某原因 → 二次确认
  bot.action(/^delreason:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const reason = await findReasonById(BigInt(idStr));
    if (!reason) {
      await ctx.editMessageText('该原因已不存在。');
      return;
    }
    await ctx.editMessageText(
      `确认删除该拉黑原因？\n\n${reasonButtonText(reason)}\n\n（删除不影响已录入的历史记录）`,
      confirmDeleteReasonInlineKeyboard(BigInt(idStr)),
    );
  });

  // 确认删除
  bot.action(/^delreasonc:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    try {
      const removed = await deleteReason(BigInt(idStr));
      await ctx.editMessageText(`🗑 已删除拉黑原因：${reasonButtonText(removed)}`);
      logger.info({ label: removed.label }, '拉黑原因已删除');
    } catch {
      await ctx.editMessageText('删除失败：该原因可能已被删除。');
    }
  });

  // 取消删除
  bot.action('delreasonx', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('已取消。');
  });
}
