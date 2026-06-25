import type { Context } from 'telegraf';
import type { User as DbUser } from '@prisma/client';

/** 暂存于会话的目标用户。bigint 以 string 保存，避免 JSON 序列化问题。 */
export interface TargetLite {
  id: string;
  username: string | null;
  firstName: string | null;
}

/**
 * 多步流程状态（存于 Redis 会话）。
 * - add：录入流程（选原因 → 确认）
 * - dup：判重命中后的「重复提示」待操作态
 * - updateReason：更新原因待选新原因态
 */
export type Flow =
  | { kind: 'add'; step: 'reason' | 'confirm'; target: TargetLite; reason?: string }
  | { kind: 'dup'; target: TargetLite; recordId: string }
  | { kind: 'updateReason'; target: TargetLite; recordId: string }
  | { kind: 'publishAnnouncement' };

/** 会话数据（存于 Redis） */
export interface SessionData {
  flow?: Flow;
}

/** 全局 Bot 上下文：附带 Redis 会话与鉴权后注入的当前用户 */
export interface BotContext extends Context {
  session?: SessionData;
  /** 鉴权中间件注入；通过鉴权后的处理器中必有值 */
  dbUser?: DbUser;
}
