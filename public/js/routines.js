import { formatDateKey } from './format-date.js';
import { addTask } from './tasks.js';

function shouldRunToday(routine, dayOfWeek) {
  if (routine.frequency === 'daily') return true;
  if (routine.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (routine.frequency === 'weekly') return dayOfWeek === (routine.weekday ?? 1);
  return false;
}

export function applyRoutines(state) {
  const today = new Date();
  const key = formatDateKey(today);
  const day = today.getDay();
  let changed = false;

  for (const routine of state.routines) {
    if (!routine || typeof routine !== 'object' || !routine.title || !routine.frequency) continue;
    if (!shouldRunToday(routine, day)) continue;
    const exists = state.tasks.some(
      (t) => t.routineId === routine.id && t.date === key
    );
    if (!exists) {
      state.tasks = addTask(state.tasks, routine.title, today, {
        routineId: routine.id,
      });
      changed = true;
    }
  }

  return changed;
}