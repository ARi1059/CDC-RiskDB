import type { Announcement } from '@prisma/client';
import { prisma } from '../db/prisma';

/** 最新一条公告 */
export function getLatestAnnouncement(): Promise<Announcement | null> {
  return prisma.announcement.findFirst({ orderBy: { createdAt: 'desc' } });
}

/** 最近若干条公告（用于公告管理列表） */
export function listRecentAnnouncements(limit = 10): Promise<Announcement[]> {
  return prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}

export function findAnnouncementById(id: bigint): Promise<Announcement | null> {
  return prisma.announcement.findUnique({ where: { id } });
}

/** 发布公告 */
export function createAnnouncement(content: string, createdBy: bigint): Promise<Announcement> {
  return prisma.announcement.create({ data: { content, createdBy } });
}

/** 删除公告（硬删除） */
export function deleteAnnouncement(id: bigint): Promise<Announcement> {
  return prisma.announcement.delete({ where: { id } });
}
