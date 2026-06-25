import { Markup } from 'telegraf';
import type { Telegraf } from 'telegraf';
import type { BotContext } from '../context';
import { BTN } from '../constants/buttons';
import { getFlow, setFlow, clearFlow } from '../session';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import {
  systemSettingsMenu,
  announcementMgmtInlineKeyboard,
  confirmDeleteAnnouncementInlineKeyboard,
} from '../keyboards/systemSettings';
import { formatAnnouncement, formatPublishSuccess, announcementListItem } from '../views/announcement';
import {
  getLatestAnnouncement,
  listRecentAnnouncements,
  findAnnouncementById,
  createAnnouncement,
  deleteAnnouncement,
} from '../services/announcement.service';
import { logger } from '../utils/logger';

function isAdmin(ctx: BotContext): boolean {
  return ctx.dbUser?.role === 'admin';
}

/**
 * 在文本兜底前调用：若当前处于「发布公告」流程，则把这条文本作为公告内容入库，返回 true（已消费）。
 * 否则返回 false，交由兜底（回主菜单）。
 */
export async function handleAnnouncementText(ctx: BotContext, text: string): Promise<boolean> {
  const flow = getFlow(ctx);
  if (flow?.kind !== 'publishAnnouncement') return false;
  const user = ctx.dbUser;
  if (!user) {
    clearFlow(ctx);
    return true;
  }
  const content = text.trim();
  if (!content) {
    await ctx.reply('内容不能为空，请重新输入，或点返回首页取消。');
    return true;
  }
  const a = await createAnnouncement(content, user.telegramId);
  clearFlow(ctx);
  await ctx.reply(formatPublishSuccess(a), systemSettingsMenu());
  logger.info({ id: String(a.id), by: String(user.telegramId) }, '公告已发布');
  return true;
}

/** 注册「机器人公告」查看 + 「系统设置」公告发布 / 管理 */
export function registerAnnouncements(bot: Telegraf<BotContext>): void {
  // 📢 机器人公告 → 查看最新（所有授权用户）
  bot.hears(BTN.ANNOUNCEMENT, async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;
    const a = await getLatestAnnouncement();
    await ctx.reply(formatAnnouncement(a), mainMenuKeyboard(user.role));
  });

  // ⚙️ 系统设置（管理员）
  bot.hears(BTN.SYSTEM_SETTINGS, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('⛔ 仅管理员可用');
      return;
    }
    await ctx.reply('系统设置', systemSettingsMenu());
  });

  // 📢 发布公告（管理员）→ 进入文本输入流程
  bot.hears(BTN.PUBLISH_ANNOUNCEMENT, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('⛔ 仅管理员可用');
      return;
    }
    setFlow(ctx, { kind: 'publishAnnouncement' });
    await ctx.reply(
      '请输入公告内容（直接发送文本；点返回首页取消）：',
      Markup.keyboard([[BTN.HOME]]).resize(),
    );
  });

  // 📜 公告管理（管理员）→ inline 列表
  bot.hears(BTN.ANNOUNCEMENT_MGMT, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('⛔ 仅管理员可用');
      return;
    }
    const list = await listRecentAnnouncements();
    if (list.length === 0) {
      await ctx.reply('暂无公告。', systemSettingsMenu());
      return;
    }
    await ctx.reply('公告管理（点击某条删除）：', announcementMgmtInlineKeyboard(list));
  });

  // 删除某公告 → 二次确认
  bot.action(/^delann:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    const a = await findAnnouncementById(BigInt(idStr));
    if (!a) {
      await ctx.editMessageText('该公告已不存在。');
      return;
    }
    await ctx.editMessageText(
      `确认删除该公告？\n\n${announcementListItem(a)}`,
      confirmDeleteAnnouncementInlineKeyboard(BigInt(idStr)),
    );
  });

  // 确认删除
  bot.action(/^delannc:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('仅管理员');
      return;
    }
    const idStr = ctx.match[1];
    await ctx.answerCbQuery();
    if (!idStr) return;
    try {
      await deleteAnnouncement(BigInt(idStr));
      await ctx.editMessageText('🗑 公告已删除。');
      logger.info({ id: idStr }, '公告已删除');
    } catch {
      await ctx.editMessageText('删除失败：该公告可能已被删除。');
    }
  });

  // 取消删除
  bot.action('delannx', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('已取消。');
  });
}
