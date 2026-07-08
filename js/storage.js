const STORAGE_KEY = 'timefyi_app';

export const DEFAULT_WORLD_CLOCK_CITIES = [
  { id: 'America/Edmonton', city: 'Edmonton', country: 'Alberta' },
  { id: 'America/Toronto', city: 'Toronto', country: 'Ontario' },
];

const defaults = {
  settings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    alarmSound: 'beep',
    hourFormat: 12,
    focusSound: 'none',
    timerSound: 'beep',
    timerChimeInterval: 0,
  },
  tasks: [],
  sessions: {},
  workspace: 'Workspace',
  project: 'Project',
  timezones: [...DEFAULT_WORLD_CLOCK_CITIES],
  primaryTimezone: 'America/Edmonton',
  timezoneView: 'grid',
  worldClockCities: [...DEFAULT_WORLD_CLOCK_CITIES],
  selectedWorldCity: 'America/Edmonton',
  timerPresets: [],
  routines: [],
  taskDump: [],
  plannerTab: 'planner',
  tzScrubOffsetMs: 0,
};

function mergeSettings(saved = {}) {
  return { ...defaults.settings, ...saved };
}

function mergeDefaultCities(existing = []) {
  const merged = existing.map((c) => ({ ...c }));
  for (const city of DEFAULT_WORLD_CLOCK_CITIES) {
    const idx = merged.findIndex((c) => c.id === city.id);
    if (idx === -1) {
      merged.push({ ...city });
    } else {
      merged[idx] = { ...merged[idx], city: city.city, country: city.country };
    }
  }
  return merged;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    const state = { ...structuredClone(defaults), ...parsed };
    state.settings = mergeSettings(parsed.settings);

    const prevWorld = JSON.stringify(state.worldClockCities);
    const prevTz = JSON.stringify(state.timezones);

    state.worldClockCities = mergeDefaultCities(state.worldClockCities);
    state.timezones = mergeDefaultCities(state.timezones);

    if (!state.worldClockCities.some((c) => c.id === state.selectedWorldCity)) {
      state.selectedWorldCity = state.worldClockCities[0]?.id || 'America/Edmonton';
    }
    if (!state.timezones.some((c) => c.id === state.primaryTimezone)) {
      state.primaryTimezone = state.timezones[0]?.id || 'America/Edmonton';
    }

    if (
      JSON.stringify(state.worldClockCities) !== prevWorld ||
      JSON.stringify(state.timezones) !== prevTz
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    return state;
  } catch {
    return structuredClone(defaults);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLabel(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatDayHeader(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase();
}

export function isToday(date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}