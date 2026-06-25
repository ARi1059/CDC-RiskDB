import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  // 开发环境使用 pino-pretty 美化输出；生产环境输出结构化 JSON
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
