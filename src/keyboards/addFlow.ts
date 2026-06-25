import { Markup } from 'telegraf';
import { REASONS } from '../constants/reasons';
import { BTN } from '../constants/buttons';

/** 选择拉黑原因键盘（每行两个原因 + 返回首页） */
export function reasonKeyboard() {
  const rows: string[][] = [];
  for (let i = 0; i < REASONS.length; i += 2) {
    rows.push(REASONS.slice(i, i + 2).map((r) => r.button));
  }
  rows.push([BTN.HOME]);
  return Markup.keyboard(rows).resize();
}

/** 确认录入键盘 */
export function confirmKeyboard() {
  return Markup.keyboard([[BTN.CONFIRM_ADD], [BTN.CANCEL_ADD]]).resize();
}

/** 重复提示键盘（更新原因 / 删除记录 / 返回首页） */
export function duplicateKeyboard() {
  return Markup.keyboard([[BTN.UPDATE_REASON], [BTN.DELETE_RECORD], [BTN.HOME]]).resize();
}

/** 录入成功 / 更新成功后的键盘（查询 / 继续录入 / 返回首页） */
export function successKeyboard() {
  return Markup.keyboard([[BTN.QUERY], [BTN.CONTINUE_ADD], [BTN.HOME]]).resize();
}
