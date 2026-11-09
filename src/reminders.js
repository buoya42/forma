const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const REMINDER_GRACE_MS = 15 * 60 * 1000;
export const REMINDER_RECHECK_MS = 6 * 60 * 60 * 1000;

/** Returns a local-device timestamp for a valid, opted-in workout reminder. */
export function getReminderTimestamp(item) {
  if (!item || item.kind !== 'workout' || item.remind !== true) return null;
  if (!DATE_PATTERN.test(item.date || '') || !TIME_PATTERN.test(item.time || '')) return null;
  const [year, month, day] = item.date.split('-').map(Number);
  const [hour, minute] = item.time.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day || localDate.getHours() !== hour || localDate.getMinutes() !== minute) return null;
  const timestamp = localDate.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getDueReminders(schedule, now = Date.now(), graceMs = REMINDER_GRACE_MS) {
  return (Array.isArray(schedule) ? schedule : []).filter(item => {
    if (item?.notifiedAt || item?.reminderExpiredAt) return false;
    const timestamp = getReminderTimestamp(item);
    return timestamp !== null && timestamp <= now && now - timestamp <= graceMs;
  });
}

export function getExpiredReminders(schedule, now = Date.now(), graceMs = REMINDER_GRACE_MS) {
  return (Array.isArray(schedule) ? schedule : []).filter(item => {
    if (item?.notifiedAt || item?.reminderExpiredAt) return false;
    const timestamp = getReminderTimestamp(item);
    return timestamp !== null && timestamp < now - graceMs;
  });
}

export function getUpcomingReminders(schedule, now = Date.now()) {
  return (Array.isArray(schedule) ? schedule : [])
    .filter(item => !item?.notifiedAt && !item?.reminderExpiredAt)
    .map(item => ({ item, timestamp: getReminderTimestamp(item) }))
    .filter(entry => entry.timestamp !== null && entry.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp);
}
