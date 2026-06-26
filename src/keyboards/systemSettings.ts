import { Markup } from 'telegraf';
import type { Announcement, Reason } from '@prisma/client';
import { BTN } from '../constants/buttons';
import { announcementListItem } from '../views/announcement';
import { reasonButtonText } from '../constants/reasons';

/** 系统设置子菜单（reply 键盘）。 */
export function systemSettingsMenu() {
  return Markup.keyboard([
    [BTN.PUBLISH_ANNOUNCEMENT],
    [BTN.ANNOUNCEMENT_MGMT],
    [BTN.REASON_MGMT],
    [BTN.ADMIN_MGMT],
    [BTN.HOME],
  ]).resize();
}

/** 拉黑原因管理子菜单（reply 键盘）：新增 / 返回。 */
export function reasonMgmtMenu() {
  return Markup.keyboard([[BTN.ADD_REASON], [BTN.HOME]]).resize();
}

/** 拉黑原因管理：当前原因列表（inline，callback 携带原因 id） */
export function reasonMgmtInlineKeyboard(list: Reason[]) {
  const rows = list.map((r) => [
    Markup.button.callback('🗑 ' + reasonButtonText(r), `delreason:${r.id}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

/** 删除原因二次确认（inline） */
export function confirmDeleteReasonInlineKeyboard(id: bigint) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ 确认删除', `delreasonc:${id}`)],
    [Markup.button.callback('↩️ 取消', 'delreasonx')],
  ]);
}

/** 公告管理：最近公告列表（inline，callback 携带公告 id） */
export function announcementMgmtInlineKeyboard(list: Announcement[]) {
  const rows = list.map((a) => [
    Markup.button.callback('🗑 ' + announcementListItem(a), `delann:${a.id}`),
  ]);
  return Markup.inlineKeyboard(rows);
}

/** 删除公告二次确认（inline） */
export function confirmDeleteAnnouncementInlineKeyboard(id: bigint) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ 确认删除', `delannc:${id}`)],
    [Markup.button.callback('↩️ 取消', 'delannx')],
  ]);
}
