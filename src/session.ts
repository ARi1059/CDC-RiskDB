import type { BotContext, Flow } from './context';

/** 读取当前流程状态 */
export function getFlow(ctx: BotContext): Flow | undefined {
  return ctx.session?.flow;
}

/** 写入 / 清除当前流程状态（确保 ctx.session 存在） */
export function setFlow(ctx: BotContext, flow: Flow | undefined): void {
  if (!ctx.session) ctx.session = {};
  ctx.session.flow = flow;
}

/** 清除当前流程状态 */
export function clearFlow(ctx: BotContext): void {
  setFlow(ctx, undefined);
}
