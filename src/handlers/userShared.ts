import { message } from 'telegraf/filters';
import type { Telegraf } from 'telegraf';
import type { BotContext } from '../context';
import { REQUEST_ID } from '../constants/requests';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { SharedTarget, UsersSharedCompat } from '../telegram/userShareTypes';
import { findActiveByTarget } from '../services/blacklist.service';
import { formatQueryResult } from '../views/queryResult';
import { handleSelectedUserForAdd } from './addBlacklist';

/**
 * 从 users_shared 服务消息提炼目标用户。
 * 兼容 7.2+ 的 users（含 username/first_name）与 7.1 旧版的 user_ids（仅 id）。
 */
export function extractSharedTarget(usersShared: unknown): SharedTarget | null {
  const data = usersShared as UsersSharedCompat;

  if (data.users && data.users.length > 0) {
    const u = data.users[0];
    if (!u) return null;
    return {
      telegramId: BigInt(u.user_id),
      username: u.username ?? null,
      firstName: u.first_name ?? null,
    };
  }

  if (data.user_ids && data.user_ids.length > 0) {
    const id = data.user_ids[0];
    if (id === undefined) return null;
    return { telegramId: BigInt(id), username: null, firstName: null };
  }

  return null;
}

/**
 * 注册 users_shared 统一处理（「选择用户」底座）。
 * 按 request_id 路由到对应业务场景；M3 仅实现查询场景的字段回显以验证底座，
 * 录入 / 加老师将在 M5 / M9 接入。
 */
export function registerUserShared(bot: Telegraf<BotContext>): void {
  bot.on(message('users_shared'), async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;

    const shared = ctx.message.users_shared;
    const target = extractSharedTarget(shared);
    if (!target) {
      await ctx.reply('未获取到所选用户，请重试', mainMenuKeyboard(user.role));
      return;
    }

    logger.info(
      {
        requestId: shared.request_id,
        target: {
          id: String(target.telegramId),
          username: target.username,
          firstName: target.firstName,
        },
      },
      'users_shared 已接收',
    );

    switch (shared.request_id) {
      case REQUEST_ID.QUERY: {
        // M4：按 telegram_id 查询有效黑名单记录并渲染结果
        const records = await findActiveByTarget(target.telegramId);
        await ctx.reply(formatQueryResult(target, records), mainMenuKeyboard(user.role));
        break;
      }
      case REQUEST_ID.ADD_BLACKLIST:
        // M5：判重并分流到选原因 / 重复提示
        await handleSelectedUserForAdd(ctx, target);
        break;
      default:
        await ctx.reply('（该选择用户场景将于后续里程碑接入）', mainMenuKeyboard(user.role));
    }
  });
}
