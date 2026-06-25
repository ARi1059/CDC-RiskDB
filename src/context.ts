import type { Context } from 'telegraf';
import type { User as DbUser } from '@prisma/client';

/** 多步场景的会话状态（M3 起逐步填充：当前场景、暂存目标用户、待选原因等） */
export interface SessionData {
  // 预留
  placeholder?: never;
}

/** 全局 Bot 上下文：附带 Redis 会话与鉴权后注入的当前用户 */
export interface BotContext extends Context {
  session?: SessionData;
  /** 鉴权中间件注入；通过鉴权后的处理器中必有值 */
  dbUser?: DbUser;
}
