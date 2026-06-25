/**
 * 格式化为「YYYY-MM-DD HH:mm」（Asia/Shanghai）。
 * 用 Intl 显式指定时区，避免依赖进程 TZ。
 */
export function formatDateTime(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const p = (t: string): string => parts.find((x) => x.type === t)?.value ?? '';
  return `${p('year')}-${p('month')}-${p('day')} ${p('hour')}:${p('minute')}`;
}

/** 仅日期「YYYY-MM-DD」（Asia/Shanghai） */
export function formatDate(d: Date): string {
  return formatDateTime(d).slice(0, 10);
}
