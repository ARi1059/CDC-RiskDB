/** 拉黑原因选项：button 为键盘文案（带 emoji），label 为入库与展示文案（纯中文）。 */
export interface ReasonOption {
  button: string;
  label: string;
}

export const REASONS: ReasonOption[] = [
  { button: '🔨 桩机', label: '桩机' },
  { button: '📏 粗大长', label: '粗大长' },
  { button: '💊 磕药', label: '磕药' },
  { button: '😈 变态', label: '变态' },
  { button: '⛓️ SM', label: 'SM' },
  { button: '🏃 跑单', label: '跑单' },
  { button: '👀 专门看人', label: '专门看人' },
  { button: '👥 同行', label: '同行' },
  { button: '🤝 中介', label: '中介' },
  { button: '💉 吸毒', label: '吸毒' },
  { button: '🦹 抢劫或偷盗', label: '抢劫或偷盗' },
  { button: '💰 诈骗', label: '诈骗' },
  { button: '👊 暴力', label: '暴力' },
  { button: '👎 素质不高', label: '素质不高' },
  { button: '🧼 个人卫生差', label: '个人卫生差' },
  { button: '🎣 钓鱼', label: '钓鱼' },
];

/** 用于 hears 匹配的原因按钮文案集合 */
export const REASON_BUTTONS: string[] = REASONS.map((r) => r.button);

/** 由按钮文案反查入库 label */
export function reasonLabelFromButton(button: string): string | undefined {
  return REASONS.find((r) => r.button === button)?.label;
}
