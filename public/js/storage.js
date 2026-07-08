import { STORAGE_KEY, LEGACY_STORAGE_KEY } from './constants.js';
import { DEFAULT_CITIES, mergeDefaultCities, ensureSelectedId } from './cities.js';
import { formatDateKey, parseDateKey, formatDateLabel, formatDayHeader, isToday, generateId } from './format-date.js';
import { escapeHtml } from './dom.js';
import { emitStorageSaveFailed } from './event-bus.js';

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

function asArray(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function asTasks(value) {
  return asArray(value, []).filter(
    (t) => t && typeof t === 'object' && typeof t.id === 'string' && typeof t.title === 'string'
  );
}

function asRoutines(value) {
  return asArray(value, []).filter(
    (r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.title === 'string' && r.frequency
  );
}

function asCityList(value, fallback) {
  return asArray(value, fallback).filter(
    (c) => c && typeof c === 'object' && typeof c.id === 'string' && c.id
  );
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function asString(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeState(raw = {}) {
  const state = { ...structuredClone(defaults), ...raw };
  state.settings = mergeSettings(raw.settings);

  state.settings.focusMinutes = clampInt(state.settings.focusMinutes, 1, 180, 25);
  state.settings.shortBreakMinutes = clampInt(state.settings.shortBreakMinutes, 1, 60, 5);
  state.settings.longBreakMinutes = clampInt(state.settings.longBreakMinutes, 1, 60, 15);
  state.settings.hourFormat = state.settings.hourFormat === 24 ? 24 : 12;
  state.settings.timerChimeInterval = clampInt(state.settings.timerChimeInterval, 0, 60, 0);

  state.tasks = asTasks(raw.tasks);
  state.routines = asRoutines(raw.routines);
  state.taskDump = asArray(raw.taskDump, []).filter(
    (t) => t && typeof t === 'object' && typeof t.id === 'string' && typeof t.title === 'string'
  );
  state.timerPresets = asArray(raw.timerPresets, []).filter(
    (p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.label === 'string'
  );
  state.sessions = raw.sessions && typeof raw.sessions === 'object' && !Array.isArray(raw.sessions)
    ? raw.sessions
    : {};

  state.workspace = asString(raw.workspace, defaults.workspace);
  state.project = asString(raw.project, defaults.project);
  state.plannerTab = ['planner', 'routine', 'dump'].includes(raw.plannerTab) ? raw.plannerTab : 'planner';
  state.timezoneView = raw.timezoneView === 'list' ? 'list' : 'grid';
  state.tzScrubOffsetMs = typeof raw.tzScrubOffsetMs === 'number' ? raw.tzScrubOffsetMs : 0;

  state.worldClockCities = mergeDefaultCities(
    asCityList(raw.worldClockCities, defaults.worldClockCities).length
      ? asCityList(raw.worldClockCities, defaults.worldClockCities)
      : defaults.worldClockCities
  );
  state.timezones = mergeDefaultCities(
    asCityList(raw.timezones, defaults.timezones).length
      ? asCityList(raw.timezones, defaults.timezones)
      : defaults.timezones
  );

  state.selectedWorldCity = ensureSelectedId(
    state.worldClockCities,
    raw.selectedWorldCity,
    'America/Edmonton'
  );
  state.primaryTimezone = ensureSelectedId(
    state.timezones,
    raw.primaryTimezone,
    'America/Edmonton'
  );

  return state;
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

    const prevWorld = JSON.stringify(parsed.worldClockCities);
    const prevTz = JSON.stringify(parsed.timezones);

    const state = normalizeState(parsed);
    const citiesChanged =
      JSON.stringify(state.worldClockCities) !== prevWorld ||
      JSON.stringify(state.timezones) !== prevTz;

    if (migrated || citiesChanged) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* migration write failed — in-memory state still valid */
      }
    }

    return state;
  } catch {
    return structuredClone(defaults);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    emitStorageSaveFailed();
    return false;
  }
}