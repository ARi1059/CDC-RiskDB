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
