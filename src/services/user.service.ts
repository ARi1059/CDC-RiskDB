import type { User } from '@prisma/client';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

/**
 * 引导初始管理员。
 *
 * 将 env.ADMIN_TELEGRAM_IDS 中的每个 ID upsert 为 `admin` 且在职（is_active=true）。
 * 幂等：每次启动都确保这些用户为 admin —— 即便此前被降级或停用也会被恢复，
 * 保证「环境变量配置的管理员」始终有效，避免锁死（配合「至少保留 1 名管理员」护栏）。
 *
 * 注意：引导时无法获知其 username / first_name（无 Telegram 上下文），
 * 故新建时留空，待其与机器人交互后（M2）再回填资料。
 */
export async function ensureAdmins(adminIds: bigint[]): Promise<void> {
  for (const id of adminIds) {
    await prisma.user.upsert({
      where: { telegramId: id },
      update: { role: 'admin', isActive: true },
      create: { telegramId: id, role: 'admin', isActive: true },
    });
  }
  logger.info({ count: adminIds.length, ids: adminIds.map(String) }, '初始管理员引导完成');
}

/** 按 telegram_id 查用户 */
export function findUserById(telegramId: bigint): Promise<User | null> {
  return prisma.user.findUnique({ where: { telegramId } });
}

/** 在职老师列表（role=teacher 且 is_active=true），按创建时间升序 */
export function listActiveTeachers(): Promise<User[]> {
  return prisma.user.findMany({
    where: { role: 'teacher', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}

export interface AddTeacherInput {
  telegramId: bigint;
  username: string | null;
  firstName: string | null;
}

export interface AddTeacherResult {
  status: 'created' | 'reactivated' | 'already_teacher' | 'is_admin';
  user: User;
}

/**
 * 添加老师，覆盖四种情况：
 * - 已是管理员 → 拒绝（避免误降级）
 * - 已是在职老师 → 仅刷新资料
 * - 已停用老师 → 恢复在职
 * - 新用户 → 新建为在职老师
 */
export async function addTeacher(input: AddTeacherInput): Promise<AddTeacherResult> {
  const existing = await prisma.user.findUnique({ where: { telegramId: input.telegramId } });
  if (existing) {
    if (existing.role === 'admin') {
      return { status: 'is_admin', user: existing };
    }
    if (existing.isActive) {
      const user = await prisma.user.update({
        where: { telegramId: input.telegramId },
        data: { username: input.username, firstName: input.firstName },
      });
      return { status: 'already_teacher', user };
    }
    const user = await prisma.user.update({
      where: { telegramId: input.telegramId },
      data: { isActive: true, username: input.username, firstName: input.firstName },
    });
    return { status: 'reactivated', user };
  }
  const user = await prisma.user.create({
    data: {
      telegramId: input.telegramId,
      username: input.username,
      firstName: input.firstName,
      role: 'teacher',
      isActive: true,
    },
  });
  return { status: 'created', user };
}

/** 停用老师（仅对在职老师生效）。返回更新后的用户，或 null（非在职老师）。 */
export async function disableTeacher(telegramId: bigint): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (!existing || existing.role !== 'teacher' || !existing.isActive) {
    return null;
  }
  return prisma.user.update({ where: { telegramId }, data: { isActive: false } });
}
