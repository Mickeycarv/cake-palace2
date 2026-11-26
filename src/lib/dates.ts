// Date helpers. Dates are "YYYY-MM-DD" strings in the browser's local time.
// Assumption: customers, the shop and delivery staff are all in Hyderabad (IST).

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(fromIso: string, toIso: string): number {
  const ms = fromISODate(toIso).getTime() - fromISODate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

/** "16:00" -> 960 */
export function parseHHMM(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesNow(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** 14 -> "2 PM", 12 -> "12 PM", 0 -> "12 AM" */
export function formatHour(h: number): string {
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${suffix}`;
}

/** "16:30" -> "4:30 PM" */
export function formatHHMM(value: string): string {
  const mins = parseHHMM(value);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${pad(m)} ${suffix}`;
}

/** "Tue, 24 Nov" */
export function formatDateShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "Tuesday, 24 November 2026" */
export function formatDateLong(iso: string): string {
  return fromISODate(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "Today", "Tomorrow" or "Tue, 24 Nov" */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const diff = diffDays(todayISO(now), iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatDateShort(iso);
}

/** ISO timestamp -> "24 Nov, 3:05 PM" */
export function formatDateTime(isoTs: string): string {
  const d = new Date(isoTs);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
