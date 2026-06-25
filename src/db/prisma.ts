import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/** PrismaClient 单例 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
