import { loadState, saveState } from './storage.js';
import { registerRoute, initRouter } from './router.js';
import { initShared, showToast } from './shared.js';
import { applyHashParams, parseRoutePath } from './url-state.js';
import { applyRoutines } from './routines.js';
import { ROUTES } from './constants.js';
import { renderPomodoro, destroyPomodoro, pomodoroBreadcrumb } from './pages/pomodoro.js';
import { renderTimezones, destroyTimezones, timezonesBreadcrumb } from './pages/timezones.js';
import { renderDailyPlanner, destroyDailyPlanner, dailyPlannerBreadcrumb } from './pages/daily-planner.js';
import { renderWorldClock, destroyWorldClock, worldClockBreadcrumb } from './pages/world-clock.js';
import { renderTimerPage, destroyTimerPage, timerBreadcrumb } from './pages/timer-page.js';
import { renderStopwatchPage, destroyStopwatchPage, stopwatchBreadcrumb } from './pages/stopwatch-page.js';

const state = loadState();
applyHashParams(state);

if (applyRoutines(state)) {
  saveState(state);
}

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
  title: ROUTES['/pomodoro'].pageTitle,
  breadcrumb: pomodoroBreadcrumb,
  render: (outlet) => { renderPomodoro(outlet, state); bindWorkspaceButtons(); },
  destroy: destroyPomodoro,
});

registerRoute('/timezones', {
  title: ROUTES['/timezones'].pageTitle,
  breadcrumb: timezonesBreadcrumb,
  render: (outlet) => renderTimezones(outlet, state),
  destroy: destroyTimezones,
});

registerRoute('/daily-planner', {
  title: ROUTES['/daily-planner'].pageTitle,
  breadcrumb: dailyPlannerBreadcrumb,
  render: (outlet) => { renderDailyPlanner(outlet, state); bindWorkspaceButtons(); },
  destroy: destroyDailyPlanner,
});

registerRoute('/time', {
  title: ROUTES['/time'].pageTitle,
  breadcrumb: worldClockBreadcrumb,
  render: (outlet) => renderWorldClock(outlet, state),
  destroy: destroyWorldClock,
});

registerRoute('/timer', {
  title: ROUTES['/timer'].pageTitle,
  breadcrumb: timerBreadcrumb,
  render: (outlet) => renderTimerPage(outlet, state),
  destroy: destroyTimerPage,
});

registerRoute('/stopwatch', {
  title: ROUTES['/stopwatch'].pageTitle,
  breadcrumb: stopwatchBreadcrumb,
  render: (outlet) => renderStopwatchPage(outlet),
  destroy: destroyStopwatchPage,
});

initShared(state);
initRouter('/pomodoro', parseRoutePath);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Update available — refresh when ready.');
        }
      });
    });
  }).catch(() => {
    /* silent: SW optional on localhost and non-HTTPS */
  });
}