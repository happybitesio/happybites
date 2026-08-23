export const WORKING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type WorkingDay = (typeof WORKING_DAYS)[number];

export type WorkingHoursMap = Record<
  WorkingDay,
  { is_open: number; open_time: string; close_time: string }
>;

export function normalizeTimeValue(time: string | undefined, fallback = '09:00'): string {
  if (!time) return fallback;

  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function normalizeWorkingHours(
  raw: Record<string, { is_open?: number | boolean | string; open_time?: string; close_time?: string }> | undefined,
): WorkingHoursMap {
  const out = {} as WorkingHoursMap;

  for (const day of WORKING_DAYS) {
    const row = raw?.[day] ?? {};
    const isOpen = Number(row.is_open) === 1 || row.is_open === true;

    out[day] = {
      is_open: isOpen ? 1 : 0,
      open_time: normalizeTimeValue(row.open_time, '09:00'),
      close_time: normalizeTimeValue(row.close_time, '18:00'),
    };
  }

  return out;
}
