import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { env } from './config/env';
import { logger } from './utils/logger';

export const bot = new Telegraf(env.BOT_TOKEN);

// M0 占位：对任意文本消息回 "ok"。
// 后续里程碑（M2 起）将替换为鉴权中间件、角色主菜单与各业务场景。
bot.on(message('text'), async (ctx) => {
  await ctx.reply('ok');
  logger.info({ from: ctx.from.id, text: ctx.message.text }, '收到文本消息，已回复 ok');
});

// 全局错误兜底，避免单条更新异常导致进程崩溃
bot.catch((err, ctx) => {
  logger.error({ err, updateType: ctx.updateType }, 'Telegraf 未捕获异常');
});
