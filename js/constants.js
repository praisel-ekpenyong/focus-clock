export const APP_NAME = 'Focus Clock';

export const ROUTES = {
  '/pomodoro': { title: 'Pomodoro', pageTitle: `${APP_NAME} — Pomodoro` },
  '/timezones': { title: 'Timezones', pageTitle: `${APP_NAME} — Timezones` },
  '/daily-planner': { title: 'Daily Planner', pageTitle: `${APP_NAME} — Daily Planner` },
  '/time': { title: 'World Clock', pageTitle: `${APP_NAME} — World Clock` },
  '/timer': { title: 'Timer', pageTitle: `${APP_NAME} — Timer` },
  '/stopwatch': { title: 'Stopwatch', pageTitle: `${APP_NAME} — Stopwatch` },
};

export const ALARM_SOUND_OPTIONS = [
  { value: 'beep', label: 'Beep' },
  { value: 'chime', label: 'Chime' },
  { value: 'alarm', label: 'Alarm' },
];

export const STORAGE_KEY = 'focus_clock_app';
export const LEGACY_STORAGE_KEY = 'timefyi_app';