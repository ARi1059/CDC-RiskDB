import type { Announcement } from '@prisma/client';
import { formatDate } from '../utils/datetime';

/** 查看公告（最新一条） */
export function formatAnnouncement(a: Announcement | null): string {
  if (!a) return ['系统公告', '', '暂无公告。'].join('\n');
  return ['系统公告', '', formatDate(a.createdAt), '', a.content].join('\n');
}

/** 发布成功回执 */
export function formatPublishSuccess(a: Announcement): string {
  return ['✅ 公告已发布', '', formatDate(a.createdAt), '', a.content].join('\n');
}

/** 公告列表项（用于 inline 按钮 / 确认）：日期 + 内容预览 */
export function announcementListItem(a: Announcement): string {
  const preview = a.content.length > 20 ? a.content.slice(0, 20) + '…' : a.content;
  return `${formatDate(a.createdAt)} ${preview}`;
}
