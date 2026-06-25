import type { Telegram } from 'telegraf';
import type { User, Blacklist } from '@prisma/client';
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

/** 收件老师称呼超链接：名称指向其用户名主页；无 username 时降级 tg://user?id=（内联提及）。 */
function recipientMention(recipient: User): string {
  const name = escapeHtml(recipient.firstName || recipient.username || `老师${recipient.telegramId}`);
  const href = recipient.username
    ? `https://t.me/${recipient.username}`
    : `tg://user?id=${recipient.telegramId}`;
  return `<a href="${href}">${name}</a>`;
}

/** 被拉黑用户展示：优先 @username，其次名称，再次占位（与查询结果一致）。 */
function targetDisplay(record: Blacklist): string {
  if (record.username) return '@' + record.username;
  if (record.firstName) return escapeHtml(record.firstName);
  return '（未公开）';
}

/** 录入老师展示：优先 @username，否则用 id 兜底（与查询结果一致）。 */
function operatorLabel(record: Blacklist): string {
  return record.operatorUsername ? '@' + record.operatorUsername : `老师 ${record.operatorId}`;
}

/**
 * 构造发给某位收件老师的广播文案（HTML）。
 * - 开头以收件老师本人名称超链接做称呼提醒；
 * - 含被拉黑用户的用户名 / 数字ID / 状态 / 录入原因，并在末尾标注录入老师。
 */
export function buildBroadcastMessage(recipient: User, record: Blacklist): string {
  return [
    `${recipientMention(recipient)} 请注意！有新的黑名单录入，请查看`,
    '',
    '用户名：',
    targetDisplay(record),
    '',
    '数字ID：',
    String(record.telegramId),
    '',
    '状态：',
    '🚫 已加入黑名单',
    '',
    `录入原因：${escapeHtml(record.reason)}`,
    '',
    `录入老师：${operatorLabel(record)}`,
  ].join('\n');
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 异步广播「有新黑名单录入」给在职老师（除录入人）。
 * fire-and-forget：调用方不应 await，避免阻塞录入回执。
 * - 逐人 try/catch：某人未启动 / 已拉黑机器人（403）时跳过并继续。
 * - 限流：按 BROADCAST_RATE_PER_SEC 控制发送间隔。
 */
export async function broadcastNewEntry(
  telegram: Telegram,
  operator: User,
  record: Blacklist,
): Promise<void> {
  const recipients = await getBroadcastRecipients(operator.telegramId);
  if (recipients.length === 0) return;

  const delay = Math.floor(1000 / Math.max(1, env.BROADCAST_RATE_PER_SEC));
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await telegram.sendMessage(r.telegramId.toString(), buildBroadcastMessage(r, record), {
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
