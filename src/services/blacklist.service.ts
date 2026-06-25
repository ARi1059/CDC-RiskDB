import type { Blacklist } from '@prisma/client';
import { prisma } from '../db/prisma';

/**
 * 查询某目标用户的全部「有效」黑名单记录（软删除的不计入），按录入时间升序。
 * 用于「查询用户」结果展示。
 */
export function findActiveByTarget(telegramId: bigint): Promise<Blacklist[]> {
  return prisma.blacklist.findMany({
    where: { telegramId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
}

/** 判重：查某老师对某目标用户的「有效」记录（最多一条，受部分唯一索引约束）。 */
export function findActiveByOperatorAndTarget(
  operatorId: bigint,
  telegramId: bigint,
): Promise<Blacklist | null> {
  return prisma.blacklist.findFirst({ where: { operatorId, telegramId, deletedAt: null } });
}

/** 新增黑名单记录。 */
export function createRecord(input: {
  telegramId: bigint;
  username: string | null;
  firstName: string | null;
  reason: string;
  operatorId: bigint;
  operatorUsername: string | null;
}): Promise<Blacklist> {
  return prisma.blacklist.create({ data: input });
}

/** 更新某记录的拉黑原因（updated_at 自动刷新）。 */
export function updateRecordReason(id: bigint, reason: string): Promise<Blacklist> {
  return prisma.blacklist.update({ where: { id }, data: { reason } });
}

/** 软删除某记录（置 deleted_at；释放部分唯一索引名额，可重新录入）。 */
export function softDeleteRecord(id: bigint): Promise<Blacklist> {
  return prisma.blacklist.update({ where: { id }, data: { deletedAt: new Date() } });
}
