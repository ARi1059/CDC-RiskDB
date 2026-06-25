/** 用户名展示：优先 @username，其次名称，再次占位。 */
export function displayUsername(u: { username: string | null; firstName: string | null }): string {
  if (u.username) return '@' + u.username;
  if (u.firstName) return u.firstName;
  return '（未公开）';
}
