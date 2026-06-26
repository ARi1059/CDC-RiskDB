import type { Reason } from '@prisma/client';

/** 拉黑原因键盘按钮文案：有 emoji 则前缀，否则纯 label。 */
export function reasonButtonText(reason: Pick<Reason, 'label' | 'emoji'>): string {
  return reason.emoji ? `${reason.emoji} ${reason.label}` : reason.label;
}

/** 检测单个 token 是否为 emoji（含变体选择符）。 */
const EMOJI_RE = /^\p{Extended_Pictographic}(️)?$/u;

/**
 * 解析管理员输入的「新原因」文本，拆出可选 emoji 前缀与 label。
 * - 「🎣 钓鱼」→ { emoji: '🎣', label: '钓鱼' }
 * - 「钓鱼」  → { emoji: null, label: '钓鱼' }
 * label 为空时返回 null（交由调用方提示重输）。
 */
export function parseReasonInput(raw: string): { emoji: string | null; label: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const sepIndex = trimmed.search(/\s/);
  if (sepIndex > 0) {
    const head = trimmed.slice(0, sepIndex);
    const rest = trimmed.slice(sepIndex + 1).trim();
    if (EMOJI_RE.test(head) && rest) {
      return { emoji: head, label: rest };
    }
  }
  return { emoji: null, label: trimmed };
}
