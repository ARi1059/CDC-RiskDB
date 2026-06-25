import type { User } from '@prisma/client';

/** 老师展示：优先 @username，其次名称，再次 id */
export function teacherDisplay(u: User): string {
  if (u.username) return '@' + u.username;
  if (u.firstName) return u.firstName;
  return `老师 ${u.telegramId}`;
}

/** 老师列表（仅在职） */
export function formatTeacherList(teachers: User[]): string {
  if (teachers.length === 0) return '当前没有在职老师。';
  const lines = [`当前老师数量：${teachers.length}`, ''];
  teachers.forEach((t, i) => lines.push(`${i + 1}. ${teacherDisplay(t)}`));
  return lines.join('\n');
}

/** 添加老师结果文案 */
export function addTeacherResultMessage(status: string, user: User): string {
  switch (status) {
    case 'created':
      return ['授权成功', '', '身份：', 'Teacher', '', teacherDisplay(user)].join('\n');
    case 'reactivated':
      return ['已恢复该老师权限', '', '身份：', 'Teacher', '', teacherDisplay(user)].join('\n');
    case 'already_teacher':
      return `该用户已是在职老师：${teacherDisplay(user)}`;
    case 'is_admin':
      return '⛔ 该用户是管理员，无法添加为老师。';
    default:
      return '操作完成';
  }
}
