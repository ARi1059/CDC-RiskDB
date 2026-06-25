import type { Telegram } from 'telegraf';
import type { User } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * 广播收件人：在职老师（role=teacher 且 is_active=true），排除本次录入人。
 * 管理员与已停用老师不接收。
 */
export function getBroadcastRecipients(operatorId: bigint): Promise<User[]> {
  return prisma.user.findMany({
    where: { role: 'teacher', isActive: true, telegramId: { not: operatorId } },
  });
}

/** HTML 转义，避免名称中的特殊字符破坏排版 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 构造广播文案（HTML）：录入人名称做超链接（指向其用户名主页；无 username 时降级 tg://user?id=）。
 */
export function buildBroadcastMessage(operator: User): string {
  const name = escapeHtml(operator.firstName || operator.username || `老师${operator.telegramId}`);
  const href = operator.username
    ? `https://t.me/${operator.username}`
    : `tg://user?id=${operator.telegramId}`;
  return `<a href="${href}">${name}</a> 有新的黑名单录入，请查看`;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 异步广播「有新黑名单录入」给在职老师（除录入人）。
 * fire-and-forget：调用方不应 await，避免阻塞录入回执。
 * - 逐人 try/catch：某人未启动 / 已拉黑机器人（403）时跳过并继续。
 * - 限流：按 BROADCAST_RATE_PER_SEC 控制发送间隔。
 */
export async function broadcastNewEntry(telegram: Telegram, operator: User): Promise<void> {
  const recipients = await getBroadcastRecipients(operator.telegramId);
  if (recipients.length === 0) return;

  const text = buildBroadcastMessage(operator);
  const delay = Math.floor(1000 / Math.max(1, env.BROADCAST_RATE_PER_SEC));
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await telegram.sendMessage(r.telegramId.toString(), text, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      logger.warn(
        { to: String(r.telegramId), err: err instanceof Error ? err.message : String(err) },
        '广播单发失败，跳过',
      );
    }
    if (delay > 0) await sleep(delay);
  }

  logger.info({ total: recipients.length, sent, failed }, '录入广播完成');
}
