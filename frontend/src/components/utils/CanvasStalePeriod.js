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

export function formatLastSynced(lastSyncedAt) {
  if (!lastSyncedAt) return "Never";

  const date = new Date(lastSyncedAt);
  if (isNaN(date.getTime())) return "Never";

  return date.toLocaleString();
}
