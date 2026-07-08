import { COMMON_TIMEZONES } from './timezone-data.js';
import { saveState } from './storage.js';
import { isValidTimezone } from './timezone-utils.js';

const MAX_TIMEZONE_URL_ENTRIES = 20;

function resolveTimezone(id) {
  const clean = id.replace('-primary', '').trim();
  if (!isValidTimezone(clean)) {
    const found = COMMON_TIMEZONES.find((t) => t.id === clean);
    if (found) return { ...found };
    return null;
  }
  const found = COMMON_TIMEZONES.find((t) => t.id === clean);
  if (found) return { ...found };
  const city = clean.split('/').pop()?.replace(/_/g, ' ') || clean;
  return { id: clean, city, country: '' };
}

export function applyHashParams(state) {
  const hash = window.location.hash.slice(1);
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return false;

  const path = hash.slice(0, queryIndex);
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  let changed = false;

  if (path === '/timezones' || path === 'timezones') {
    const d = params.get('d');
    if (d) {
      const entries = d.split(',').filter(Boolean).slice(0, MAX_TIMEZONE_URL_ENTRIES);
      const primary = entries.find((e) => e.includes('-primary'))?.replace('-primary', '')
        || entries[0]?.replace('-primary', '');
      const zones = entries
        .map((entry) => resolveTimezone(entry))
        .filter(Boolean);
      if (zones.length > 0) {
        state.timezones = zones;
        if (primary && zones.some((z) => z.id === primary)) {
          state.primaryTimezone = primary;
        } else {
          state.primaryTimezone = zones[0].id;
        }
        state.tzScrubOffsetMs = 0;
        const h = params.get('h');
        if (h) state.settings.hourFormat = parseInt(h, 10) === 24 ? 24 : 12;
        changed = true;
      }
    }
  }

  if (changed) saveState(state);
  return changed;
}

export function parseRoutePath(hash) {
  const raw = hash.slice(1) || '/pomodoro';
  const path = raw.split('?')[0];
  return path.startsWith('/') ? path : `/${path}`;
}