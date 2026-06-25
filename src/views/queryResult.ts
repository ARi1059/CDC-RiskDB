import type { Blacklist } from '@prisma/client';
import type { SharedTarget } from '../telegram/userShareTypes';

const LINE = '━━━━━━━━━━━━━━';

/** 目标用户名展示：优先 @username，其次名称，再次占位 */
function displayUsername(target: SharedTarget): string {
  if (target.username) return '@' + target.username;
  if (target.firstName) return target.firstName;
  return '（未公开）';
}

/** 录入老师展示：优先 @username，否则用 id 兜底 */
function operatorLabel(record: Blacklist): string {
  return record.operatorUsername ? '@' + record.operatorUsername : `老师 ${record.operatorId}`;
}

/**
 * 渲染「查询结果」消息（纯文本）。
 * - 有记录：状态徽标 + 共计条数 + 逐条「原因 / 录入老师」
 * - 无记录：✅ 未发现记录
 */
export function formatQueryResult(target: SharedTarget, records: Blacklist[]): string {
  const head = [
    LINE,
    '',
    '查询结果',
    '',
    '用户名：',
    displayUsername(target),
    '',
    '数字ID：',
    String(target.telegramId),
    '',
    '状态：',
  ];

  if (records.length === 0) {
    return [...head, '✅ 未发现记录', '', LINE].join('\n');
  }

  const lines = [...head, '🚫 已加入黑名单', '', '共有：', `${records.length}条记录`, ''];
  records.forEach((record, index) => {
    lines.push(`${index + 1}.`);
    lines.push(`原因：${record.reason}`);
    lines.push(`录入老师：${operatorLabel(record)}`);
    lines.push('');
  });
  lines.push(LINE);
  return lines.join('\n');
}
