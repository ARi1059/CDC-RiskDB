import type { Reason } from '@prisma/client';
import { prisma } from '../db/prisma';

/** 全部拉黑原因，按 sort_order、id 升序（用于录入键盘与管理列表）。 */
export function listReasons(): Promise<Reason[]> {
  return prisma.reason.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
}

/** 按 label 精确查（录入时校验所选原因是否有效）。 */
export function findReasonByLabel(label: string): Promise<Reason | null> {
  return prisma.reason.findUnique({ where: { label } });
}

/** 按 id 查（删除二次确认用）。 */
export function findReasonById(id: bigint): Promise<Reason | null> {
  return prisma.reason.findUnique({ where: { id } });
}

/**
 * 新增原因。排序号取当前最大 +1（追加到末尾）。
 * label 唯一冲突（P2002）由调用方捕获并提示「已存在」。
 */
export async function createReason(
  label: string,
  emoji: string | null,
  createdBy: bigint,
): Promise<Reason> {
  const last = await prisma.reason.findFirst({ orderBy: { sortOrder: 'desc' } });
  const sortOrder = (last?.sortOrder ?? 0) + 1;
  return prisma.reason.create({ data: { label, emoji, sortOrder, createdBy } });
}

/** 删除原因（硬删除；不影响已录入的 blacklist 记录）。 */
export function deleteReason(id: bigint): Promise<Reason> {
  return prisma.reason.delete({ where: { id } });
}
