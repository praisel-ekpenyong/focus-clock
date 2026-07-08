import { loadState, saveState } from './storage.js';
import { registerRoute, initRouter } from './router.js';
import { initShared } from './shared.js';
import { applyHashParams, parseRoutePath } from './url-state.js';
import { renderPomodoro, destroyPomodoro, pomodoroBreadcrumb } from './pages/pomodoro.js';
import { renderTimezones, destroyTimezones, timezonesBreadcrumb } from './pages/timezones.js';
import { renderDailyPlanner, destroyDailyPlanner, dailyPlannerBreadcrumb } from './pages/daily-planner.js';
import { renderWorldClock, destroyWorldClock, worldClockBreadcrumb } from './pages/world-clock.js';
import { renderTimerPage, destroyTimerPage, timerBreadcrumb } from './pages/timer-page.js';
import { renderStopwatchPage, destroyStopwatchPage, stopwatchBreadcrumb } from './pages/stopwatch-page.js';

const state = loadState();
applyHashParams(state);

function bindWorkspaceButtons() {
  const ws = document.getElementById('workspaceBtn');
  const proj = document.getElementById('projectBtn');
  if (ws) {
    ws.textContent = state.workspace;
    ws.onclick = () => {
      const name = prompt('Workspace name:', state.workspace);
      if (name) { state.workspace = name; saveState(state); ws.textContent = name; }
    };
  }
  if (proj) {
    proj.textContent = state.project;
    proj.onclick = () => {
      const name = prompt('Project name:', state.project);
      if (name) { state.project = name; saveState(state); proj.textContent = name; }
    };
  }
}

registerRoute('/pomodoro', {
  title: 'time.fyi - pomodoro timer',
  breadcrumb: pomodoroBreadcrumb,
  render: (outlet) => { renderPomodoro(outlet, state); bindWorkspaceButtons(); },
  destroy: destroyPomodoro,
});

registerRoute('/timezones', {
  title: 'time.fyi - timezones',
  breadcrumb: timezonesBreadcrumb,
  render: (outlet) => renderTimezones(outlet, state),
  destroy: destroyTimezones,
});

registerRoute('/daily-planner', {
  title: 'time.fyi - daily planner',
  breadcrumb: dailyPlannerBreadcrumb,
  render: (outlet) => { renderDailyPlanner(outlet, state); bindWorkspaceButtons(); },
  destroy: destroyDailyPlanner,
});

registerRoute('/time', {
  title: 'time.fyi - world clock',
  breadcrumb: worldClockBreadcrumb,
  render: (outlet) => renderWorldClock(outlet, state),
  destroy: destroyWorldClock,
});

registerRoute('/timer', {
  title: 'time.fyi - timer',
  breadcrumb: timerBreadcrumb,
  render: (outlet) => renderTimerPage(outlet, state),
  destroy: destroyTimerPage,
});

registerRoute('/stopwatch', {
  title: 'time.fyi - stopwatch',
  breadcrumb: stopwatchBreadcrumb,
  render: (outlet) => renderStopwatchPage(outlet),
  destroy: destroyStopwatchPage,
});

initShared(state);
initRouter('/pomodoro', parseRoutePath);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}