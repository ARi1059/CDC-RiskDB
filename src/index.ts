import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';
import { redis } from './redis/client';
import { bot } from './bot';
import { ensureAdmins } from './services/user.service';

async function main(): Promise<void> {
  // 连接 PostgreSQL
  await prisma.$connect();
  logger.info('✅ PostgreSQL 已连接');

  // 引导初始管理员（M1）
  await ensureAdmins(env.ADMIN_TELEGRAM_IDS);

  // 连接 Redis（lazyConnect）
  await redis.connect();
  logger.info('✅ Redis 已连接');

  // 启动 Bot（long polling）。不 await：launch 的 Promise 在 bot 停止前不会 resolve。
  bot
    .launch({ dropPendingUpdates: true })
    .catch((err) => {
      logger.error({ err }, 'Bot 启动失败');
      process.exit(1);
    });

  logger.info({ env: env.NODE_ENV }, '🤖 Bot 启动中（long polling）...');
}

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, '正在优雅关闭...');
  try {
    bot.stop(signal);
  } catch {
    // bot 可能尚未完全启动，忽略
  }
  await redis.quit().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
  logger.info('已关闭，进程退出');
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

main().catch((err) => {
  logger.error({ err }, '启动过程异常');
  process.exit(1);
});
