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
