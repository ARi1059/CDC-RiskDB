import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { env } from './config/env';
import { logger } from './utils/logger';
import type { BotContext, SessionData } from './context';
import { redisSessionStore } from './redis/sessionStore';
import { authMiddleware } from './middlewares/auth';
import { mainMenuKeyboard } from './keyboards/mainMenu';
import { BTN, TEACHER_FEATURE_BUTTONS, ADMIN_ONLY_BUTTONS } from './constants/buttons';
import { REQUEST_ID } from './constants/requests';
import { selectUserKeyboard } from './keyboards/selectUser';
import { registerUserShared } from './handlers/userShared';
import { registerAddBlacklist } from './handlers/addBlacklist';
import { registerTeacherMgmt } from './handlers/teacherMgmt';
import { registerAnnouncements, handleAnnouncementText } from './handlers/announcement';
import { clearFlow } from './session';

export const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

// 会话（Redis）—— 为 M3 起的多步场景打底
bot.use(session({ store: redisSessionStore<SessionData>() }));

// 鉴权 + 白名单门禁（之后的处理器中 ctx.dbUser 必有值）
bot.use(authMiddleware);

/** 发送角色主菜单 */
async function showMainMenu(ctx: BotContext, greeting?: string): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;
  await ctx.reply(greeting ?? '请选择操作', mainMenuKeyboard(user.role));
  logger.info({ telegramId: String(user.telegramId), role: user.role }, '主菜单已发送');
}

// 入口：/start
bot.start(async (ctx) => {
  await showMainMenu(ctx, '欢迎使用黑名单共享系统');
});

// 返回首页（清除进行中的多步流程）
bot.hears(BTN.HOME, async (ctx) => {
  clearFlow(ctx);
  await showMainMenu(ctx);
});

// 🔍 查询用户 → 进入「选择用户」（M3 底座；M4 接真实查询）
bot.hears(BTN.QUERY, async (ctx) => {
  await ctx.reply('请选择需要查询的用户', selectUserKeyboard(REQUEST_ID.QUERY));
});

// 🚫 录入黑名单全流程（入口 / 选原因 / 确认 / 取消 / 更新原因 / 删除）（M5）
registerAddBlacklist(bot);

// 📢 机器人公告查看 + ⚙️ 系统设置（发布 / 管理公告）
registerAnnouncements(bot);

// M2 占位：其余功能按钮（QUERY / ADD_BLACKLIST 已被上面的具体处理器拦截）
bot.hears(TEACHER_FEATURE_BUTTONS, async (ctx) => {
  await ctx.reply(`「${ctx.message.text}」功能将于后续里程碑开放`);
});

// 👨‍🏫 老师管理全流程（添加 / 移除 / 列表，仅管理员）（M7）
registerTeacherMgmt(bot);

// M2 占位：Admin 专属按钮（系统设置；老师管理已被上面拦截）
bot.hears(ADMIN_ONLY_BUTTONS, async (ctx) => {
  if (ctx.dbUser?.role !== 'admin') {
    await ctx.reply('⛔ 该功能仅管理员可用');
    return;
  }
  await ctx.reply(`「${ctx.message.text}」功能将于后续里程碑开放`);
});

// 选择用户底座：统一处理 users_shared（M3；按 request_id 路由场景）
registerUserShared(bot);

// 其它文本：发布公告流程捕获正文；否则回到主菜单（全键盘交互）
bot.on(message('text'), async (ctx) => {
  if (await handleAnnouncementText(ctx, ctx.message.text)) return;
  await showMainMenu(ctx);
});

// 全局错误兜底，避免单条更新异常导致进程崩溃
bot.catch((err, ctx) => {
  logger.error({ err, updateType: ctx.updateType }, 'Telegraf 未捕获异常');
});
