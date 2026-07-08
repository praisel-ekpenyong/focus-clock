import { COMMON_TIMEZONES } from './timezone-data.js';
import { saveState } from './storage.js';

function resolveTimezone(id) {
  const found = COMMON_TIMEZONES.find((t) => t.id === id);
  if (found) return { ...found };
  const city = id.split('/').pop()?.replace(/_/g, ' ') || id;
  return { id, city, country: '' };
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
      const entries = d.split(',').filter(Boolean);
      const primary = entries.find((e) => e.includes('-primary'))?.replace('-primary', '')
        || entries[0]?.replace('-primary', '');
      state.timezones = entries.map((entry) =>
        resolveTimezone(entry.replace('-primary', ''))
      );
      if (primary) state.primaryTimezone = primary;
      const h = params.get('h');
      if (h) state.settings.hourFormat = parseInt(h, 10) === 24 ? 24 : 12;
      changed = true;
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