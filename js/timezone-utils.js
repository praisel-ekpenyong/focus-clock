const INVALID_PARTS = { hour: '--', minute: '--', amPm: '' };

function safeZoneCall(tz, fn, fallback) {
  if (!tz || typeof tz !== 'string') return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function isValidTimezone(tz) {
  return safeZoneCall(tz, () => {
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return true;
  }, false);
}

export function formatTimeInZone(tz, hour12 = true, date = new Date()) {
  return safeZoneCall(tz, () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(date),
    '--:--'
  );
}

export function formatTimeParts(tz, hour12 = true, date = new Date()) {
  return safeZoneCall(tz, () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';
    return { hour, minute, amPm: dayPeriod };
  }, INVALID_PARTS);
}

export function getGmtOffset(tz, date = new Date()) {
  return safeZoneCall(tz, () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT';
    return offset.replace('GMT', 'GMT');
  }, 'GMT');
}

export function formatDateInZone(tz, date = new Date()) {
  return safeZoneCall(tz, () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }).format(date),
    'Invalid timezone'
  );
}

export function formatShortDateInZone(tz, date = new Date()) {
  return safeZoneCall(tz, () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: 'short',
      day: '2-digit',
    }).format(date),
    '--'
  );
}

export function getHourInZone(tz, date = new Date()) {
  return safeZoneCall(tz, () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(date);
    return parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  }, 0);
}

export function isDifferentDay(tz1, tz2, date = new Date()) {
  const d1 = formatShortDateInZone(tz1, date);
  const d2 = formatShortDateInZone(tz2, date);
  return d1 !== d2;
}

export function getDisplayNow(state) {
  return new Date(Date.now() + (state.tzScrubOffsetMs || 0));
}

export function setScrubHour(state, primaryTz, targetHour) {
  const now = new Date();
  const currentHour = getHourInZone(primaryTz, now);
  const diffHours = targetHour - currentHour;
  state.tzScrubOffsetMs = diffHours * 3600000;
}