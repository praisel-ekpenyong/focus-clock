import {
  saveState,
  formatDateKey,
  formatDateLabel,
  isToday,
  escapeHtml,
} from '../storage.js';
import { PomodoroTimer } from '../timer.js';
import {
  getPendingTasks,
  getCompletedTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  findTask,
  reorderTasks,
} from '../tasks.js';
import { playAlarm } from '../sounds.js';
import { showToast } from '../shared.js';

let cleanup = null;
let timer = null;

const TOMATO_SVG = `<svg class="tomato-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 2 7.5 3.5 7 5.5 5 5 3.5 6.5 3 8.5 3 11c0 4 3.5 7 9 7s9-3 9-7c0-2-.5-3.5-2-4-.5-2-2.5-3.5-5-3.5-.5-2-2.5-3.5-5-3.5z"/></svg>`;

export function renderPomodoro(outlet, state) {
  if (cleanup) cleanup();

  let viewDate = new Date();
  let taskTab = 'pending';
  let showTaskForm = false;
  let editingTaskId = null;
  let pipWindow = null;
  const listeners = [];

  function on(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options);
    listeners.push({ el, event, handler, options });
  }

  function removeListeners() {
    listeners.forEach(({ el, event, handler, options }) => {
      el.removeEventListener(event, handler, options);
    });
    listeners.length = 0;
  }

  timer = new PomodoroTimer(state.settings, {
    onUpdate: () => {
      renderTimerUI();
      updatePipWindow();
    },
    onComplete: () => {
      playAlarm(state.settings.alarmSound);

      if (timer.mode === 'focus') {
        state.sessions = timer.recordSession(state.sessions);
        saveState(state);
        const todayCount = state.sessions[formatDateKey(new Date())] || 0;
        const nextMode = todayCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        timer.setMode(nextMode);
        showToast('Focus session complete!');
      } else {
        timer.setMode('focus');
        showToast('Break complete!');
      }

      renderSessions();
      renderTimerUI();
      updatePipWindow();
    },
  });

  outlet.innerHTML = `
    <div class="main-content">
      <section class="tasks-panel">
        <div class="tasks-header">
          <div class="task-tabs">
            <button class="task-tab active" data-tab="pending" id="pendingTab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Pending
            </button>
            <button class="task-tab" data-tab="completed" id="completedTab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Completed
            </button>
          </div>
          <div class="date-nav">
            <button class="icon-btn" id="datePrev" title="Previous day">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="date-btn" id="dateBtn"></button>
            <input type="date" class="hidden-date-input" id="dateInput">
            <button class="icon-btn" id="dateNext" title="Next day">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
        <div class="tasks-body" id="tasksBody"></div>
        <div class="task-form hidden" id="taskForm">
          <input type="text" id="taskInput" placeholder="What are you working on?">
          <div class="task-form-actions">
            <button class="btn-secondary" id="taskCancel">Cancel</button>
            <button class="btn-primary" id="taskSave">Save</button>
          </div>
        </div>
      </section>

      <section class="timer-panel" id="timerPanel">
        <div class="timer-actions">
          <button class="action-icon-btn" id="fullscreenBtn" title="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
          <button class="action-icon-btn" id="pipBtn" title="Picture in Picture">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="4" width="20" height="14" rx="2"/><rect x="12" y="10" width="8" height="6" rx="1" fill="currentColor" stroke="none"/></svg>
          </button>
          <button class="action-icon-btn" id="settingsBtn" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
        </div>

        <div class="active-task-banner hidden" id="activeTaskBanner">
          <span class="active-task-title" id="activeTaskTitle"></span>
          <button class="task-complete-btn" id="bannerCompleteBtn" title="Complete task">✓</button>
          <button class="task-clear-btn" id="bannerClearBtn" title="Clear task">×</button>
        </div>

        <div class="timer-content">
          <div class="mode-tabs">
            <button class="mode-tab active" data-mode="focus">
              <svg class="mode-icon-mobile" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13,2a11.32,11.32,0,0,0-1,2c-.12.33-.22.66-.31,1C11.07,3.26,8.19,3.54,7,3c0,3.38,3.52,2.21,4.25,2.72C8.42,5.48,7.39,7.39,6,8c3.1,1.57,5,.06,5.72-1.84-.11.74-.65,4.92,2.28,4.84a8.14,8.14,0,0,0-1.31-4.91h.06C14,7.59,15.94,9.3,18,8a7.19,7.19,0,0,0-3.75-2.06C15.84,6,16.91,6.13,18,4a8.42,8.42,0,0,0-4.69,1c.47-.8,1.18-2,1.69-3ZM7,5c-3.91.89-5,4.23-5,8C2,18,6.47,22,12,22c4.89,0,10-2.84,10-10,0-3-1.17-6-4-7a1.88,1.88,0,0,1-1,1c.54.19,1.42,1.39,2,2-.31.81-1.8,1.52-4.34,1a9.86,9.86,0,0,1,0,3,4.07,4.07,0,0,1-4-3C8.25,10.5,4.93,8.68,5,8c.88-.61,2-1.83,3-2A2.82,2.82,0,0,1,7,5Z"/></svg>
              <span>Focus</span>
            </button>
            <button class="mode-tab" data-mode="shortBreak">
              <svg class="mode-icon-mobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              <span>Short Break</span>
            </button>
            <button class="mode-tab" data-mode="longBreak">
              <svg class="mode-icon-mobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              <span>Long Break</span>
            </button>
          </div>

          <div class="timer-display" id="timerDisplay"></div>
          <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>

          <div class="time-adjust">
            ${[25, 10, 5, 1].map((n) => `
              <button class="adjust-btn" data-add="${n}">+<span class="adjust-space"> </span>${n}<span class="adjust-label"> min</span></button>
            `).join('')}
          </div>

          <div class="timer-controls" id="timerControls"></div>
        </div>

        <div class="sessions-counter" id="sessionsCounter">
          <div class="session-tomatoes" id="sessionTomatoes"></div>
          <span id="sessionLabel"></span>
        </div>
      </section>
    </div>

    <div class="modal-overlay hidden" id="settingsModal">
      <div class="modal">
        <label class="modal-label">Focus duration (minutes)</label>
        <input type="number" class="modal-input" id="focusMinutesInput" min="1" max="180" value="${state.settings.focusMinutes}">
        <label class="modal-label">Short break (minutes)</label>
        <input type="number" class="modal-input" id="shortBreakInput" min="1" max="60" value="${state.settings.shortBreakMinutes}">
        <label class="modal-label">Long break (minutes)</label>
        <input type="number" class="modal-input" id="longBreakInput" min="1" max="60" value="${state.settings.longBreakMinutes}">
        <label class="modal-label">Alarm sound</label>
        <select class="modal-input" id="alarmSoundSelect">
          <option value="beep">Beep</option>
          <option value="chime">Chime</option>
          <option value="alarm">Alarm</option>
        </select>
        <button class="btn-primary modal-submit" id="settingsSave">Save</button>
      </div>
    </div>
  `;

  function getTodaySessionCount() {
    return state.sessions[formatDateKey(new Date())] || 0;
  }

  function renderSessions() {
    const count = getTodaySessionCount();
    const tomatoes = outlet.querySelector('#sessionTomatoes');
    const label = outlet.querySelector('#sessionLabel');

    tomatoes.innerHTML = Array.from({ length: count }, () =>
      TOMATO_SVG.replace('class="tomato-icon"', 'class="tomato-icon active"')
    ).join('');

    if (count === 0) {
      label.textContent = 'No sessions today';
    } else if (count === 1) {
      label.textContent = '1 session today';
    } else {
      label.textContent = `${count} sessions today`;
    }
  }

  function renderTimerUI() {
    const { hours, minutes, seconds } = timer.getDisplayTime();
    const pad = (n) => String(n).padStart(2, '0');

    const display = outlet.querySelector('#timerDisplay');
    if (hours > 0) {
      display.innerHTML = `
        <span>${pad(hours)}</span><span class="timer-sep">:</span>
        <span>${pad(minutes)}</span><span class="timer-sep">:</span>
        <span>${pad(seconds)}</span>
      `;
    } else {
      display.innerHTML = `
        <span>${pad(minutes)}</span><span class="timer-sep">:</span>
        <span>${pad(seconds)}</span>
      `;
    }

    outlet.querySelector('#progressFill').style.width = `${timer.getProgress()}%`;

    outlet.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === timer.mode);
    });

    const controls = outlet.querySelector('#timerControls');
    if (timer.isCompleted) {
      controls.innerHTML = `
        <button class="control-btn primary" id="startBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start</span>
        </button>
        <button class="control-btn" id="resetBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Reset</span>
        </button>
      `;
    } else if (timer.isRunning) {
      controls.innerHTML = `
        <button class="control-btn" id="pauseBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <span>Pause</span>
        </button>
        <button class="control-btn" id="resetBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Reset</span>
        </button>
      `;
    } else if (timer.isPaused) {
      controls.innerHTML = `
        <button class="control-btn primary" id="startBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Resume</span>
        </button>
        <button class="control-btn" id="resetBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Reset</span>
        </button>
      `;
    } else {
      controls.innerHTML = `
        <button class="control-btn primary" id="startBtn">
          <svg class="control-icon-mobile" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start</span>
        </button>
      `;
    }

    bindTimerControls();
    updateActiveTaskBanner();
    updateDocumentTitle();
  }

  function updateDocumentTitle() {
    if (timer.isRunning) {
      document.title = `${timer.formatTimeString()} - ${timer.getModeLabel()}`;
    } else if (timer.isCompleted) {
      document.title = `${timer.getModeLabel()} complete!`;
    } else {
      document.title = 'time.fyi - pomodoro timer';
    }
  }

  function bindTimerControls() {
    outlet.querySelector('#startBtn')?.addEventListener('click', () => timer.start());
    outlet.querySelector('#pauseBtn')?.addEventListener('click', () => timer.pause());
    outlet.querySelector('#resetBtn')?.addEventListener('click', () => timer.reset());
  }

  function updateActiveTaskBanner() {
    const banner = outlet.querySelector('#activeTaskBanner');
    const titleEl = outlet.querySelector('#activeTaskTitle');

    if (!timer.activeTaskId) {
      banner.classList.add('hidden');
      return;
    }

    const task = findTask(state.tasks, timer.activeTaskId);
    if (!task) {
      timer.clearActiveTask();
      banner.classList.add('hidden');
      return;
    }

    titleEl.textContent = task.title;
    banner.classList.remove('hidden');
  }

  function setActiveTask(taskId) {
    timer.setActiveTask(taskId);
    renderTasks();
    updateActiveTaskBanner();
  }

  function clearActiveTask() {
    timer.clearActiveTask();
    renderTasks();
    updateActiveTaskBanner();
  }

  function renderTasks() {
    const body = outlet.querySelector('#tasksBody');
    const dateBtn = outlet.querySelector('#dateBtn');
    const dateInput = outlet.querySelector('#dateInput');

    dateBtn.textContent = formatDateLabel(viewDate);
    dateInput.value = formatDateKey(viewDate);

    outlet.querySelector('#pendingTab').classList.toggle('active', taskTab === 'pending');
    outlet.querySelector('#completedTab').classList.toggle('active', taskTab === 'completed');

    const tasks = taskTab === 'pending'
      ? getPendingTasks(state.tasks, viewDate)
      : getCompletedTasks(state.tasks, viewDate);

    if (tasks.length === 0) {
      body.innerHTML = `
        <div class="tasks-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>No tasks for this day</p>
          ${taskTab === 'pending' ? '<button class="add-task-link" id="emptyAddTask">Add a new task</button>' : ''}
        </div>
      `;
      outlet.querySelector('#emptyAddTask')?.addEventListener('click', openTaskForm);
    } else {
      body.innerHTML = `
        <ul class="task-list">
          ${tasks.map((t) => `
            <li class="task-item ${t.completed ? 'completed' : ''} ${timer.activeTaskId === t.id ? 'playing' : ''}" data-id="${t.id}" ${taskTab === 'pending' ? 'draggable="true"' : ''}>
              ${!t.completed ? `
                <button class="task-play-btn ${timer.activeTaskId === t.id ? 'playing' : ''}" data-play="${t.id}" title="Start with this task">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
              ` : `
                <button class="task-check-btn" data-uncomplete="${t.id}" title="Mark pending">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><path d="M9 11l3 3L22 4"/></svg>
                </button>
              `}
              <span class="task-text" data-edit="${t.id}">${escapeHtml(t.title)}</span>
              <div class="task-actions">
                ${!t.completed ? `<button class="task-action-btn" data-complete="${t.id}" title="Complete">✓</button>` : ''}
                <button class="task-action-btn" data-delete="${t.id}" title="Delete">×</button>
              </div>
            </li>
          `).join('')}
        </ul>
        ${taskTab === 'pending' ? `
          <button class="add-task-btn" id="addTaskBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add task
          </button>
        ` : ''}
      `;

      body.querySelectorAll('[data-play]').forEach((btn) => {
        btn.onclick = () => {
          setActiveTask(btn.dataset.play);
          if (!timer.isRunning && !timer.isPaused) timer.start();
        };
      });

      body.querySelectorAll('[data-complete]').forEach((btn) => {
        btn.onclick = () => {
          state.tasks = toggleTaskComplete(state.tasks, btn.dataset.complete);
          if (timer.activeTaskId === btn.dataset.complete) clearActiveTask();
          saveState(state);
          renderTasks();
        };
      });

      body.querySelectorAll('[data-uncomplete]').forEach((btn) => {
        btn.onclick = () => {
          state.tasks = toggleTaskComplete(state.tasks, btn.dataset.uncomplete);
          saveState(state);
          renderTasks();
        };
      });

      body.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.onclick = () => {
          state.tasks = deleteTask(state.tasks, btn.dataset.delete);
          if (timer.activeTaskId === btn.dataset.delete) clearActiveTask();
          saveState(state);
          renderTasks();
        };
      });

      body.querySelectorAll('[data-edit]').forEach((el) => {
        el.onclick = () => startEditTask(el.dataset.edit, el.textContent);
      });

      if (taskTab === 'pending') {
        bindTaskDragDrop(body);
      }

      body.querySelector('#addTaskBtn')?.addEventListener('click', openTaskForm);
    }
  }

  let draggedId = null;

  function bindTaskDragDrop(body) {
    const items = body.querySelectorAll('.task-item[draggable]');

    items.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        draggedId = item.dataset.id;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        body.querySelectorAll('.task-item').forEach((el) => el.classList.remove('drag-over'));
        draggedId = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (item.dataset.id !== draggedId) {
          body.querySelectorAll('.task-item').forEach((el) => el.classList.remove('drag-over'));
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedId || draggedId === item.dataset.id) return;
        const dayTasks = getPendingTasks(state.tasks, viewDate);
        const fromIdx = dayTasks.findIndex((t) => t.id === draggedId);
        const toIdx = dayTasks.findIndex((t) => t.id === item.dataset.id);
        if (fromIdx === -1 || toIdx === -1) return;
        state.tasks = reorderTasks(state.tasks, draggedId, toIdx, viewDate);
        saveState(state);
        renderTasks();
      });
    });
  }

  function openTaskForm() {
    showTaskForm = true;
    editingTaskId = null;
    const form = outlet.querySelector('#taskForm');
    const input = outlet.querySelector('#taskInput');
    form.classList.remove('hidden');
    input.value = '';
    input.focus();
  }

  function closeTaskForm() {
    showTaskForm = false;
    editingTaskId = null;
    outlet.querySelector('#taskForm').classList.add('hidden');
    outlet.querySelector('#taskInput').value = '';
  }

  function startEditTask(id, title) {
    editingTaskId = id;
    showTaskForm = true;
    const form = outlet.querySelector('#taskForm');
    const input = outlet.querySelector('#taskInput');
    form.classList.remove('hidden');
    input.value = title;
    input.focus();
  }

  function saveTask() {
    const input = outlet.querySelector('#taskInput');
    const title = input.value.trim();
    if (!title) return;

    if (editingTaskId) {
      state.tasks = updateTask(state.tasks, editingTaskId, { title });
    } else {
      state.tasks = addTask(state.tasks, title, viewDate);
    }

    saveState(state);
    closeTaskForm();
    renderTasks();
  }

  async function openPiP() {
    if (!('documentPictureInPicture' in window)) {
      showToast('Picture-in-Picture is not supported in this browser');
      return;
    }

    if (pipWindow) {
      pipWindow.close();
      pipWindow = null;
      return;
    }

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 160,
      });

      const doc = pipWindow.document;
      doc.body.style.margin = '0';
      doc.body.style.background = '#18181b';
      doc.body.style.color = '#f4f4f5';
      doc.body.style.fontFamily = 'system-ui, sans-serif';
      doc.body.style.display = 'flex';
      doc.body.style.flexDirection = 'column';
      doc.body.style.alignItems = 'center';
      doc.body.style.justifyContent = 'center';
      doc.body.style.height = '100vh';

      doc.body.innerHTML = `
        <div id="pipMode" style="font-size:12px;color:#71717a;margin-bottom:8px;"></div>
        <div id="pipTime" style="font-size:48px;font-weight:700;font-variant-numeric:tabular-nums;"></div>
      `;

      updatePipWindow();

      pipWindow.addEventListener('pagehide', () => {
        pipWindow = null;
      });
    } catch {
      showToast('Could not open Picture-in-Picture');
      pipWindow = null;
    }
  }

  function updatePipWindow() {
    if (!pipWindow || pipWindow.closed) {
      pipWindow = null;
      return;
    }

    const modeEl = pipWindow.document.getElementById('pipMode');
    const timeEl = pipWindow.document.getElementById('pipTime');
    if (modeEl) modeEl.textContent = timer.getModeLabel();
    if (timeEl) timeEl.textContent = timer.formatTimeString();
  }

  function closePiP() {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    pipWindow = null;
  }

  // Task tabs
  on(outlet.querySelector('#pendingTab'), 'click', () => {
    taskTab = 'pending';
    renderTasks();
  });
  on(outlet.querySelector('#completedTab'), 'click', () => {
    taskTab = 'completed';
    renderTasks();
  });

  // Date navigation
  on(outlet.querySelector('#datePrev'), 'click', () => {
    viewDate.setDate(viewDate.getDate() - 1);
    renderTasks();
  });
  on(outlet.querySelector('#dateNext'), 'click', () => {
    viewDate.setDate(viewDate.getDate() + 1);
    renderTasks();
  });
  on(outlet.querySelector('#dateBtn'), 'click', () => {
    outlet.querySelector('#dateInput').showPicker?.() || outlet.querySelector('#dateInput').click();
  });
  on(outlet.querySelector('#dateInput'), 'change', (e) => {
    const [y, m, d] = e.target.value.split('-').map(Number);
    viewDate = new Date(y, m - 1, d);
    renderTasks();
  });

  // Task form
  on(outlet.querySelector('#taskCancel'), 'click', closeTaskForm);
  on(outlet.querySelector('#taskSave'), 'click', saveTask);
  on(outlet.querySelector('#taskInput'), 'keydown', (e) => {
    if (e.key === 'Enter') saveTask();
    if (e.key === 'Escape') closeTaskForm();
  });

  // Mode tabs
  outlet.querySelectorAll('.mode-tab').forEach((tab) => {
    on(tab, 'click', () => {
      if (timer.isRunning || timer.isPaused) {
        timer.pause();
      }
      timer.setMode(tab.dataset.mode);
      renderTimerUI();
    });
  });

  // Time adjust
  outlet.querySelectorAll('.adjust-btn').forEach((btn) => {
    on(btn, 'click', () => {
      timer.addMinutes(parseInt(btn.dataset.add, 10));
      if (!timer.isRunning && !timer.isPaused && !timer.isCompleted) {
        timer.start();
      }
    });
  });

  // Timer panel actions
  on(outlet.querySelector('#fullscreenBtn'), 'click', () => {
    outlet.querySelector('#timerPanel').classList.toggle('fullscreen');
  });
  on(outlet.querySelector('#pipBtn'), 'click', openPiP);
  on(outlet.querySelector('#settingsBtn'), 'click', () => {
    outlet.querySelector('#focusMinutesInput').value = state.settings.focusMinutes;
    outlet.querySelector('#shortBreakInput').value = state.settings.shortBreakMinutes;
    outlet.querySelector('#longBreakInput').value = state.settings.longBreakMinutes;
    outlet.querySelector('#alarmSoundSelect').value = state.settings.alarmSound;
    outlet.querySelector('#settingsModal').classList.remove('hidden');
  });

  // Settings modal
  on(outlet.querySelector('#settingsSave'), 'click', () => {
    const focus = parseInt(outlet.querySelector('#focusMinutesInput').value, 10);
    const shortBreak = parseInt(outlet.querySelector('#shortBreakInput').value, 10);
    const longBreak = parseInt(outlet.querySelector('#longBreakInput').value, 10);
    const alarm = outlet.querySelector('#alarmSoundSelect').value;

    if (!focus || !shortBreak || !longBreak) return;

    state.settings.focusMinutes = focus;
    state.settings.shortBreakMinutes = shortBreak;
    state.settings.longBreakMinutes = longBreak;
    state.settings.alarmSound = alarm;
    saveState(state);
    timer.setSettings(state.settings);
    outlet.querySelector('#settingsModal').classList.add('hidden');
    showToast('Settings updated successfully');
  });

  // Active task banner
  on(outlet.querySelector('#bannerCompleteBtn'), 'click', () => {
    if (!timer.activeTaskId) return;
    state.tasks = toggleTaskComplete(state.tasks, timer.activeTaskId);
    saveState(state);
    clearActiveTask();
    renderTasks();
  });
  on(outlet.querySelector('#bannerClearBtn'), 'click', clearActiveTask);

  // Close settings on overlay click
  on(outlet.querySelector('#settingsModal'), 'click', (e) => {
    if (e.target === outlet.querySelector('#settingsModal')) {
      outlet.querySelector('#settingsModal').classList.add('hidden');
    }
  });

  timer.setMode('focus');

  renderTasks();
  renderSessions();
  renderTimerUI();

  cleanup = () => {
    if (timer) {
      timer.stopTicking();
      timer = null;
    }
    removeListeners();
    closePiP();
    document.title = 'time.fyi';
    cleanup = null;
  };
}

export function destroyPomodoro() {
  if (cleanup) cleanup();
}

export const pomodoroBreadcrumb = `
  <span class="breadcrumb-item">Pomodoro</span>
  <span class="breadcrumb-sep">/</span>
  <button class="breadcrumb-btn" id="workspaceBtn">Workspace</button>
  <span class="breadcrumb-sep">/</span>
  <button class="breadcrumb-btn" id="projectBtn">Project</button>
`;