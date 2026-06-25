import type { TargetLite } from '../context';
import { displayUsername } from './shared';
import { formatDateTime } from '../utils/datetime';

const LINE = '━━━━━━━━━━━━━━';

/** 确认录入面板 */
export function formatConfirm(target: TargetLite, reasonLabel: string, operatorDisplay: string): string {
  return [
    LINE,
    '',
    '确认录入黑名单',
    '',
    '目标用户：',
    displayUsername(target),
    '',
    '数字ID：',
    target.id,
    '',
    '拉黑原因：',
    reasonLabel,
    '',
    '录入人：',
    operatorDisplay,
    '',
    LINE,
    '',
    '确认后将立即加入共享黑名单',
  ].join('\n');
}

/** 录入成功面板 */
export function formatSuccess(target: TargetLite, reasonLabel: string, createdAt: Date): string {
  return [
    '✅ 录入成功',
    '',
    '目标用户：',
    displayUsername(target),
    '',
    '数字ID：',
    target.id,
    '',
    '拉黑原因：',
    reasonLabel,
    '',
    '录入时间：',
    formatDateTime(createdAt),
  ].join('\n');
}

/** 重复提示面板 */
export function formatDuplicate(target: TargetLite, existingReason: string, existingCreatedAt: Date): string {
  return [
    LINE,
    '',
    '⚠️ 您已录入过该用户',
    '',
    '目标用户：',
    displayUsername(target),
    '',
    '数字ID：',
    target.id,
    '',
    '原有原因：',
    existingReason,
    '',
    '录入时间：',
    formatDateTime(existingCreatedAt),
    '',
    LINE,
    '',
    '如需修改，可更新原因或删除记录',
  ].join('\n');
}

/** 原因已更新面板 */
export function formatUpdated(target: TargetLite, newReasonLabel: string, updatedAt: Date): string {
  return [
    '✅ 原因已更新',
    '',
    '目标用户：',
    displayUsername(target),
    '',
    '新原因：',
    newReasonLabel,
    '',
    '更新时间：',
    formatDateTime(updatedAt),
  ].join('\n');
}
