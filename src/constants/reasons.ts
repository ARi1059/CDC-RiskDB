/** 拉黑原因选项：button 为键盘文案（带 emoji），label 为入库与展示文案（纯中文）。 */
export interface ReasonOption {
  button: string;
  label: string;
}

export const REASONS: ReasonOption[] = [
  { button: '💰 诈骗', label: '诈骗' },
  { button: '🏃 跑单', label: '跑单' },
  { button: '🖼️ 盗图', label: '盗图' },
  { button: '⚠️ 骚扰', label: '骚扰' },
  { button: '🎭 虚假资料', label: '虚假资料' },
  { button: '❓ 其他', label: '其他' },
];

/** 用于 hears 匹配的原因按钮文案集合 */
export const REASON_BUTTONS: string[] = REASONS.map((r) => r.button);

/** 由按钮文案反查入库 label */
export function reasonLabelFromButton(button: string): string | undefined {
  return REASONS.find((r) => r.button === button)?.label;
}
