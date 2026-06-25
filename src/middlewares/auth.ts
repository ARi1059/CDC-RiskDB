import type { MiddlewareFn } from 'telegraf';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import type { BotContext } from '../context';

/**
 * 鉴权 + 白名单门禁中间件。
 * - 不在 users 表，或 is_active=false → 拦截（不进入后续处理）。
 * - 通过 → 注入 ctx.dbUser，并顺带回填变化的 username / first_name。
 */
export const authMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const from = ctx.from;
  if (!from) return; // 无来源用户（如频道消息），忽略

  const telegramId = BigInt(from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user || !user.isActive) {
    logger.warn(
      { telegramId: String(telegramId), username: from.username },
      '未授权访问被拦截',
    );
    await ctx.reply('⛔ 无权限：你尚未被授权使用本机器人，请联系管理员。');
    return; // 门禁：不调用 next()
  }

  // 资料回填（仅在变化时写库），让引导期为空的 username / first_name 得到补全
  const username = from.username ?? null;
  const firstName = from.first_name ?? null;
  if (user.username !== username || user.firstName !== firstName) {
    await prisma.user.update({ where: { telegramId }, data: { username, firstName } });
    user.username = username;
    user.firstName = firstName;
  }

  ctx.dbUser = user;
  await next();
};
