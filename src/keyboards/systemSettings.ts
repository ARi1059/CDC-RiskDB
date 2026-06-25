import { Markup } from 'telegraf';
import type { Announcement } from '@prisma/client';
import { BTN } from '../constants/buttons';
import { announcementListItem } from '../views/announcement';

/** 系统设置子菜单（reply 键盘）。管理员管理将于后续里程碑加入。 */
export function systemSettingsMenu() {
  return Markup.keyboard([
    [BTN.PUBLISH_ANNOUNCEMENT],
    [BTN.ANNOUNCEMENT_MGMT],
    [BTN.HOME],
  ]).resize();
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
