import 'dotenv/config';
import { z } from 'zod';

/** 将逗号分隔的数字ID字符串解析为 bigint 数组（至少一个，且均为纯数字） */
const adminIdsSchema = z.string().transform((value, ctx) => {
  const ids = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ADMIN_TELEGRAM_IDS 至少需要一个ID' });
    return z.NEVER;
  }

  const result: bigint[] = [];
  for (const id of ids) {
    if (!/^\d+$/.test(id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `非法的管理员ID: ${id}` });
      return z.NEVER;
    }
    result.push(BigInt(id));
  }
  return result;
});

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN 不能为空'),
  DATABASE_URL: z.string().url('DATABASE_URL 必须是合法 URL'),
  REDIS_URL: z.string().url('REDIS_URL 必须是合法 URL'),
  ADMIN_TELEGRAM_IDS: adminIdsSchema,
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BROADCAST_RATE_PER_SEC: z.coerce.number().int().positive().default(25),
  TZ: z.string().default('Asia/Shanghai'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // 此处早于 logger 初始化（logger 依赖本模块），故用 console.error
  console.error('❌ 环境变量校验失败：', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
