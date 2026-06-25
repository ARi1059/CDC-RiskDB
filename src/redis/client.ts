import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Redis 单例。
 * - lazyConnect：由 index.ts 显式 connect()，便于在启动时统一处理连接错误
 * - maxRetriesPerRequest: null：用于后续 Scenes/Session 持久连接，避免请求级重试上限
 */
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => logger.error({ err }, 'Redis 连接错误'));
