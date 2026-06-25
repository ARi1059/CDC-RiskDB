import type { Telegraf } from 'telegraf';
import { Prisma } from '@prisma/client';
import type { BotContext, TargetLite } from '../context';
import type { SharedTarget } from '../telegram/userShareTypes';
import { getFlow, setFlow, clearFlow } from '../session';
import { REQUEST_ID } from '../constants/requests';
import { BTN } from '../constants/buttons';
import { REASON_BUTTONS, reasonLabelFromButton } from '../constants/reasons';
import { selectUserKeyboard } from '../keyboards/selectUser';
import { reasonKeyboard, confirmKeyboard, duplicateKeyboard, successKeyboard } from '../keyboards/addFlow';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import { formatConfirm, formatSuccess, formatDuplicate, formatUpdated } from '../views/addBlacklist';
import {
  findActiveByOperatorAndTarget,
  createRecord,
  updateRecordReason,
  softDeleteRecord,
} from '../services/blacklist.service';
import { logger } from '../utils/logger';
import { broadcastNewEntry } from '../services/broadcast.service';

function toTargetLite(t: SharedTarget): TargetLite {
  return { id: String(t.telegramId), username: t.username, firstName: t.firstName };
}

function operatorDisplay(user: { username: string | null; telegramId: bigint }): string {
  return user.username ? '@' + user.username : `老师 ${user.telegramId}`;
}

/** 录入黑名单入口：清空旧流程，请选择目标用户 */
export async function startAddBlacklist(ctx: BotContext): Promise<void> {
  clearFlow(ctx);
  await ctx.reply('请选择需要录入黑名单的用户', selectUserKeyboard(REQUEST_ID.ADD_BLACKLIST));
}

/** users_shared(ADD_BLACKLIST) 回调：判重，分流到「选原因」或「重复提示」 */
export async function handleSelectedUserForAdd(ctx: BotContext, target: SharedTarget): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  const existing = await findActiveByOperatorAndTarget(user.telegramId, target.telegramId);
  const lite = toTargetLite(target);

  if (existing) {
    setFlow(ctx, { kind: 'dup', target: lite, recordId: String(existing.id) });
    await ctx.reply(formatDuplicate(lite, existing.reason, existing.createdAt), duplicateKeyboard());
    return;
  }

  setFlow(ctx, { kind: 'add', step: 'reason', target: lite });
  await ctx.reply('请选择拉黑原因', reasonKeyboard());
}

/** 注册录入黑名单全流程处理器 */
export function registerAddBlacklist(bot: Telegraf<BotContext>): void {
  // 入口：录入黑名单 / 继续录入
  bot.hears([BTN.ADD_BLACKLIST, BTN.CONTINUE_ADD], async (ctx) => {
    await startAddBlacklist(ctx);
  });

  // 选择原因（用于「录入」与「更新原因」两种流程）
  bot.hears(REASON_BUTTONS, async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;
    const reasonLabel = reasonLabelFromButton(ctx.message.text);
    if (!reasonLabel) return;
    const flow = getFlow(ctx);

    if (flow?.kind === 'add' && flow.step === 'reason') {
      flow.reason = reasonLabel;
      flow.step = 'confirm';
      setFlow(ctx, flow);
      await ctx.reply(formatConfirm(flow.target, reasonLabel, operatorDisplay(user)), confirmKeyboard());
      return;
    }

    if (flow?.kind === 'updateReason') {
      try {
        const updated = await updateRecordReason(BigInt(flow.recordId), reasonLabel);
        clearFlow(ctx);
        await ctx.reply(formatUpdated(flow.target, reasonLabel, updated.updatedAt), successKeyboard());
        logger.info({ recordId: flow.recordId, reason: reasonLabel }, '黑名单原因已更新');
      } catch (err) {
        logger.error({ err }, '更新原因失败');
        clearFlow(ctx);
        await ctx.reply('更新失败，请重试', mainMenuKeyboard(user.role));
      }
      return;
    }

    // 不在相关流程中：回主菜单
    await ctx.reply('请选择操作', mainMenuKeyboard(user.role));
  });

  // 确认录入
  bot.hears(BTN.CONFIRM_ADD, async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;
    const flow = getFlow(ctx);
    if (flow?.kind !== 'add' || flow.step !== 'confirm' || !flow.reason) {
      await ctx.reply('请选择操作', mainMenuKeyboard(user.role));
      return;
    }
    try {
      const record = await createRecord({
        telegramId: BigInt(flow.target.id),
        username: flow.target.username,
        firstName: flow.target.firstName,
        reason: flow.reason,
        operatorId: user.telegramId,
        operatorUsername: user.username,
      });
      clearFlow(ctx);
      await ctx.reply(formatSuccess(flow.target, record.reason, record.createdAt), successKeyboard());
      logger.info(
        { operator: String(user.telegramId), target: flow.target.id, reason: record.reason },
        '黑名单录入成功',
      );
      // M6：录入成功后异步私聊广播（fire-and-forget，不阻塞回执）
      void broadcastNewEntry(ctx.telegram, user).catch((e) =>
        logger.error({ err: e }, '录入广播异常'),
      );
    } catch (err) {
      clearFlow(ctx);
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        await ctx.reply('该用户您已录入过（并发提交已拦截）', mainMenuKeyboard(user.role));
      } else {
        logger.error({ err }, '黑名单录入失败');
        await ctx.reply('录入失败，请重试', mainMenuKeyboard(user.role));
      }
    }
  });

  // 取消录入
  bot.hears(BTN.CANCEL_ADD, async (ctx) => {
    const user = ctx.dbUser;
    clearFlow(ctx);
    await ctx.reply('已取消录入', mainMenuKeyboard(user?.role ?? 'teacher'));
  });

  // 重复提示 → 更新原因
  bot.hears(BTN.UPDATE_REASON, async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;
    const flow = getFlow(ctx);
    if (flow?.kind !== 'dup') {
      await ctx.reply('请选择操作', mainMenuKeyboard(user.role));
      return;
    }
    setFlow(ctx, { kind: 'updateReason', target: flow.target, recordId: flow.recordId });
    await ctx.reply('请选择新的拉黑原因', reasonKeyboard());
  });

  // 重复提示 → 删除记录（软删除）。M7「我的黑名单」删除将另行扩展。
  bot.hears(BTN.DELETE_RECORD, async (ctx) => {
    const user = ctx.dbUser;
    if (!user) return;
    const flow = getFlow(ctx);
    if (flow?.kind !== 'dup') {
      await ctx.reply('请选择操作', mainMenuKeyboard(user.role));
      return;
    }
    try {
      await softDeleteRecord(BigInt(flow.recordId));
      clearFlow(ctx);
      await ctx.reply('🗑 记录已删除，可重新录入该用户', mainMenuKeyboard(user.role));
      logger.info({ recordId: flow.recordId, operator: String(user.telegramId) }, '黑名单记录已软删除');
    } catch (err) {
      logger.error({ err }, '删除记录失败');
      clearFlow(ctx);
      await ctx.reply('删除失败，请重试', mainMenuKeyboard(user.role));
    }
  });
}
