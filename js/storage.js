import { STORAGE_KEY, LEGACY_STORAGE_KEY } from './constants.js';
import { DEFAULT_CITIES, mergeDefaultCities, ensureSelectedId } from './cities.js';
import { formatDateKey, parseDateKey, formatDateLabel, formatDayHeader, isToday, generateId } from './format-date.js';
import { escapeHtml } from './dom.js';

export { DEFAULT_CITIES as DEFAULT_WORLD_CLOCK_CITIES };
export { formatDateKey, parseDateKey, formatDateLabel, formatDayHeader, isToday, generateId, escapeHtml };

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
  timezones: [...DEFAULT_CITIES],
  primaryTimezone: 'America/Edmonton',
  timezoneView: 'grid',
  worldClockCities: [...DEFAULT_CITIES],
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

function readRawStorage() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return { raw: current, migrated: false };
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return { raw: legacy, migrated: true };
  }
  return { raw: null, migrated: false };
}

export function loadState() {
  try {
    const { raw, migrated } = readRawStorage();
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    const state = { ...structuredClone(defaults), ...parsed };
    state.settings = mergeSettings(parsed.settings);

    const prevWorld = JSON.stringify(state.worldClockCities);
    const prevTz = JSON.stringify(state.timezones);

    state.worldClockCities = mergeDefaultCities(state.worldClockCities);
    state.timezones = mergeDefaultCities(state.timezones);

    state.selectedWorldCity = ensureSelectedId(
      state.worldClockCities,
      state.selectedWorldCity,
      'America/Edmonton'
    );
    state.primaryTimezone = ensureSelectedId(
      state.timezones,
      state.primaryTimezone,
      'America/Edmonton'
    );

    if (
      migrated ||
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