import {
  saveState,
  formatDateKey,
  formatDayHeader,
  isToday,
  escapeHtml,
  generateId,
} from '../storage.js';
import {
  getPendingTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from '../tasks.js';
import { showToast } from '../shared.js';
import { applyRoutines } from '../routines.js';

let cleanup = null;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function renderDailyPlanner(outlet, state) {
  if (cleanup) cleanup();

  if (applyRoutines(state)) saveState(state);

  const today = new Date();
  const days = [-1, 0, 1].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d;
  });

  outlet.innerHTML = `
    <div class="page-daily-planner">
      <div class="planner-tabs">
        <button class="planner-tab active" data-tab="planner">Daily Planner</button>
        <button class="planner-tab" data-tab="routine">Routine</button>
        <button class="planner-tab" data-tab="dump">Task Dump</button>
      </div>
      <div class="planner-toolbar">
        <button class="planner-today-btn" id="plannerToday">Today</button>
      </div>
      <div id="plannerContent"></div>
    </div>
  `;

  let activeTab = state.plannerTab || 'planner';

  function renderContent() {
    const content = outlet.querySelector('#plannerContent');
    state.plannerTab = activeTab;
    saveState(state);

    outlet.querySelectorAll('.planner-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === activeTab);
    });

    if (activeTab === 'planner') {
      content.innerHTML = `<div class="planner-columns">${days.map((date) => renderDayColumn(date)).join('')}</div>`;
      bindDayEvents(content);
    } else if (activeTab === 'routine') {
      content.innerHTML = renderRoutineTab();
      bindRoutineEvents(content);
    } else {
      content.innerHTML = renderDumpTab();
      bindDumpEvents(content);
    }
  }

  function renderDayColumn(date) {
    const key = formatDateKey(date);
    const tasks = getPendingTasks(state.tasks, date);
    const todayClass = isToday(date) ? 'planner-day-today' : '';

    return `
      <div class="planner-day ${todayClass}" data-date="${key}">
        <div class="planner-day-header">
          <span>${formatDayHeader(date)}</span>
          ${isToday(date) ? '<span class="planner-today-badge">TODAY</span>' : ''}
        </div>
        <div class="planner-day-body">
          ${tasks.length === 0 ? `
            <div class="planner-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <p>No tasks for this day</p>
              <button class="add-task-link" data-add="${key}">Add a new task</button>
            </div>
          ` : `
            <ul class="planner-task-list">
              ${tasks.map((t) => `
                <li class="planner-task" data-id="${t.id}">
                  <button class="task-check-btn" data-complete="${t.id}" title="Complete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </button>
                  <span class="task-text">${escapeHtml(t.title)}</span>
                  <button class="task-action-btn" data-delete="${t.id}">×</button>
                </li>
              `).join('')}
            </ul>
            <button class="add-task-link planner-add-more" data-add="${key}">Add a new task</button>
          `}
        </div>
        <div class="planner-task-form hidden" data-form="${key}">
          <input type="text" placeholder="What are you working on?" data-input="${key}">
          <div class="task-form-actions">
            <button class="btn-secondary" data-cancel="${key}">Cancel</button>
            <button class="btn-primary" data-save="${key}">Save</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindDayEvents(content) {
    content.querySelectorAll('[data-add]').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.add;
        const form = content.querySelector(`[data-form="${key}"]`);
        form.classList.remove('hidden');
        form.querySelector(`[data-input="${key}"]`).focus();
      };
    });

    content.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.onclick = () => {
        content.querySelector(`[data-form="${btn.dataset.cancel}"]`).classList.add('hidden');
      };
    });

    content.querySelectorAll('[data-save]').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.save;
        const input = content.querySelector(`[data-input="${key}"]`);
        const title = input.value.trim();
        if (!title) return;
        const [y, m, d] = key.split('-').map(Number);
        state.tasks = addTask(state.tasks, title, new Date(y, m - 1, d));
        saveState(state);
        renderContent();
      };
    });

    content.querySelectorAll('[data-complete]').forEach((btn) => {
      btn.onclick = () => {
        state.tasks = toggleTaskComplete(state.tasks, btn.dataset.complete);
        saveState(state);
        renderContent();
      };
    });

    content.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.onclick = () => {
        state.tasks = deleteTask(state.tasks, btn.dataset.delete);
        saveState(state);
        renderContent();
      };
    });
  }

  function renderRoutineTab() {
    if (state.routines.length === 0) {
      return `
        <div class="planner-single-panel">
          <div class="planner-empty">
            <p>No routines yet</p>
            <p class="planner-hint">Create recurring tasks that repeat on a schedule.</p>
            <button class="add-task-link" id="addRoutine">Add a routine</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="planner-single-panel">
        <ul class="planner-task-list">
          ${state.routines.map((r) => `
            <li class="planner-task" data-routine="${r.id}">
              <span class="task-text">${escapeHtml(r.title)}</span>
              <span class="routine-freq">${r.frequency}${r.frequency === 'weekly' && r.weekday != null ? ' · ' + WEEKDAYS[r.weekday] : ''}</span>
              <button class="task-action-btn" data-del-routine="${r.id}">×</button>
            </li>
          `).join('')}
        </ul>
        <button class="add-task-link" id="addRoutine">Add a routine</button>
      </div>
      <div class="modal-overlay hidden" id="routineModal">
        <div class="modal">
          <input type="text" class="modal-input" id="routineTitle" placeholder="Routine name">
          <select class="modal-input" id="routineFreq">
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekly">Weekly</option>
          </select>
          <select class="modal-input hidden" id="routineWeekday">
            ${WEEKDAYS.map((d, i) => '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + d + '</option>').join('')}
          </select>
          <button class="btn-primary" id="routineSave">Save</button>
          <button class="btn-secondary" id="routineCancel">Cancel</button>
        </div>
      </div>
    `;
  }

  function saveRoutineFromModal(modal) {
    const title = modal.querySelector('#routineTitle').value.trim();
    const frequency = modal.querySelector('#routineFreq').value;
    if (!title) return;
    const routine = { id: generateId(), title, frequency };
    if (frequency === 'weekly') {
      routine.weekday = parseInt(modal.querySelector('#routineWeekday').value, 10);
    }
    state.routines.push(routine);
    applyRoutines(state);
    saveState(state);
    modal.classList.add('hidden');
    modal.querySelector('#routineTitle').value = '';
    renderContent();
  }

  function bindRoutineModal(modal) {
    const freqSelect = modal.querySelector('#routineFreq');
    const weekdaySelect = modal.querySelector('#routineWeekday');
    freqSelect.onchange = () => {
      weekdaySelect.classList.toggle('hidden', freqSelect.value !== 'weekly');
    };
    modal.querySelector('#routineSave').onclick = () => saveRoutineFromModal(modal);
    const cancelBtn = modal.querySelector('#routineCancel');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
  }

  function bindRoutineEvents(content) {
    const existingModal = content.querySelector('#routineModal');
    if (existingModal) bindRoutineModal(existingModal);

    content.querySelector('#addRoutine')?.addEventListener('click', () => {
      let modal = content.querySelector('#routineModal');
      if (!modal) {
        const panel = content.querySelector('.planner-single-panel');
        panel.insertAdjacentHTML('afterend', `
          <div class="modal-overlay" id="routineModal">
            <div class="modal">
              <input type="text" class="modal-input" id="routineTitle" placeholder="Routine name">
              <select class="modal-input" id="routineFreq">
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
              </select>
              <select class="modal-input hidden" id="routineWeekday">
                ${WEEKDAYS.map((d, i) => '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + d + '</option>').join('')}
              </select>
              <button class="btn-primary" id="routineSave">Save</button>
              <button class="btn-secondary" id="routineCancel">Cancel</button>
            </div>
          </div>
        `);
        modal = content.querySelector('#routineModal');
        bindRoutineModal(modal);
      }
      modal.classList.remove('hidden');
      modal.querySelector('#routineTitle').focus();
    });

    content.querySelectorAll('[data-del-routine]').forEach((btn) => {
      btn.onclick = () => {
        state.routines = state.routines.filter((r) => r.id !== btn.dataset.delRoutine);
        saveState(state);
        renderContent();
      };
    });
  }

  function renderDumpTab() {
    return `
      <div class="planner-single-panel">
        ${state.taskDump.length === 0 ? `
          <div class="planner-empty">
            <p>Task dump is empty</p>
            <p class="planner-hint">Quickly capture tasks without assigning a date.</p>
          </div>
        ` : `
          <ul class="planner-task-list" id="dumpList">
            ${state.taskDump.map((t) => `
              <li class="planner-task" data-dump="${t.id}">
                <span class="task-text">${escapeHtml(t.title)}</span>
                <button class="task-action-btn" data-move="${t.id}" title="Move to today">→</button>
                <button class="task-action-btn" data-del-dump="${t.id}">×</button>
              </li>
            `).join('')}
          </ul>
        `}
        <div class="dump-input-row">
          <input type="text" id="dumpInput" placeholder="Quick capture a task...">
          <button class="btn-primary" id="dumpAdd">Add</button>
        </div>
      </div>
    `;
  }

  function bindDumpEvents(content) {
    content.querySelector('#dumpAdd')?.addEventListener('click', () => {
      const input = content.querySelector('#dumpInput');
      const title = input.value.trim();
      if (!title) return;
      state.taskDump.push({ id: generateId(), title, createdAt: Date.now() });
      saveState(state);
      renderContent();
    });
    content.querySelector('#dumpInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') content.querySelector('#dumpAdd')?.click();
    });
    content.querySelectorAll('[data-del-dump]').forEach((btn) => {
      btn.onclick = () => {
        state.taskDump = state.taskDump.filter((t) => t.id !== btn.dataset.delDump);
        saveState(state);
        renderContent();
      };
    });
    content.querySelectorAll('[data-move]').forEach((btn) => {
      btn.onclick = () => {
        const item = state.taskDump.find((t) => t.id === btn.dataset.move);
        if (!item) return;
        state.tasks = addTask(state.tasks, item.title, new Date());
        state.taskDump = state.taskDump.filter((t) => t.id !== item.id);
        saveState(state);
        showToast('Moved to today');
        renderContent();
      };
    });
  }

  outlet.querySelectorAll('.planner-tab').forEach((tab) => {
    tab.onclick = () => { activeTab = tab.dataset.tab; renderContent(); };
  });

  outlet.querySelector('#plannerToday')?.addEventListener('click', () => {
    outlet.querySelector('.planner-day-today')?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  });

  renderContent();

  cleanup = () => { cleanup = null; };
}

export function destroyDailyPlanner() {
  if (cleanup) cleanup();
}

export const dailyPlannerBreadcrumb = `
  <span class="breadcrumb-item">Daily Planner</span>
  <span class="breadcrumb-sep">/</span>
  <button class="breadcrumb-btn" id="workspaceBtn">Workspace</button>
  <span class="breadcrumb-sep">/</span>
  <button class="breadcrumb-btn" id="projectBtn">Project</button>
`;