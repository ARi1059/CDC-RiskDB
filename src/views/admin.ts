import type { User } from '@prisma/client';
import { teacherDisplay } from './teacher';

/** 管理员列表 */
export function formatAdminList(admins: User[]): string {
  const lines = [`当前管理员数量：${admins.length}`, ''];
  admins.forEach((a, i) => lines.push(`${i + 1}. ${teacherDisplay(a)}`));
  return lines.join('\n');
}

/** 添加管理员结果文案 */
export function addAdminResultMessage(status: string, user: User): string {
  switch (status) {
    case 'created':
      return ['授权成功', '', '身份：', 'Admin', '', teacherDisplay(user)].join('\n');
    case 'promoted':
      return ['已提升为管理员', '', '身份：', 'Admin', '', teacherDisplay(user)].join('\n');
    case 'already_admin':
      return `该用户已是管理员：${teacherDisplay(user)}`;
    default:
      return '操作完成';
  }
}

/** 移除管理员结果文案 */
export function removeAdminResultMessage(status: string, user?: User): string {
  switch (status) {
    case 'demoted':
      return `✅ 已移除管理员，降为老师：${user ? teacherDisplay(user) : ''}`;
    case 'last_admin':
      return '⛔ 不能移除最后一名管理员，系统须至少保留 1 名。';
    case 'not_admin':
      return '该用户已不是管理员。';
    default:
      return '操作完成';
  }
}
