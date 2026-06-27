const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const FIXED = {
  years: 365 * DAY_MS,
  months: 30 * DAY_MS,
  days: DAY_MS,
  hours: HOUR_MS,
};

function matchUnit(str, pattern) {
  const m = str.match(pattern);
  return m ? parseInt(m[1], 10) : 0;
}

export function intervalToParts(intervalStr) {
  const zero = { years: 0, months: 0, days: 0, hours: 0 };
  if (!intervalStr || typeof intervalStr !== "string") return zero;

  const s = intervalStr.trim();
  if (s === "") return zero;

  const years = matchUnit(s, /(\d+)\s+years?/);
  const months = matchUnit(s, /(\d+)\s+(?:mons?|months?)/);
  const days = matchUnit(s, /(\d+)\s+days?/);

  let hours = matchUnit(s, /(\d+)\s+hours?/);
  const time = s.match(/(\d+):(\d{2}):(\d{2})/);
  if (time) hours = parseInt(time[1], 10);

  return { years, months, days, hours };
}

export function partsToInterval(parts) {
  const p = parts || {};
  const years = Number(p.years) || 0;
  const months = Number(p.months) || 0;
  const days = Number(p.days) || 0;
  const hours = Number(p.hours) || 0;
  return `${years} years ${months} months ${days} days ${hours} hours`;
}

function partsToMs(parts) {
  return (
    parts.years * FIXED.years +
    parts.months * FIXED.months +
    parts.days * FIXED.days +
    parts.hours * FIXED.hours
  );
}

export function isStale(lastSyncedAt, intervalStr, now = Date.now()) {
  if (!lastSyncedAt) return true;

  const last = new Date(lastSyncedAt).getTime();
  if (isNaN(last)) return true;

  const periodMs = partsToMs(intervalToParts(intervalStr));
  return now - last > periodMs;
}

export function formatLastSynced(lastSyncedAt) {
  if (!lastSyncedAt) return "Never";

  const date = new Date(lastSyncedAt);
  if (isNaN(date.getTime())) return "Never";

  return date.toLocaleString();
}
