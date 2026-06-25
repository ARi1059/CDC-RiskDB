import type { SessionStore } from 'telegraf';
import { redis } from './client';

/**
 * 基于现有 ioredis 单例的 Telegraf 会话存储。
 * 复用同一连接、不引入额外依赖；键带前缀，可选 TTL（秒）。
 */
export function redisSessionStore<T>(prefix = 'tg:sess:', ttlSeconds?: number): SessionStore<T> {
  return {
    async get(name) {
      const raw = await redis.get(prefix + name);
      return raw ? (JSON.parse(raw) as T) : undefined;
    },
    async set(name, value) {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(prefix + name, data, 'EX', ttlSeconds);
      } else {
        await redis.set(prefix + name, data);
      }
    },
    async delete(name) {
      await redis.del(prefix + name);
    },
  };
}
