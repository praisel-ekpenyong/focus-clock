import { saveState } from './storage.js';
import { startAmbientSound, stopAmbientSound } from './sounds.js';
import { emitHourFormatChange } from './event-bus.js';

let clockInterval = null;

export function initShared(state) {
  updateHeaderClock(state);
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => updateHeaderClock(state), 1000);

  const hourBtn = document.getElementById('hourFormatBtn');
  if (hourBtn) {
    hourBtn.textContent = state.settings.hourFormat === 12 ? '12hr' : '24hr';
    hourBtn.onclick = () => {
      state.settings.hourFormat = state.settings.hourFormat === 12 ? 24 : 12;
      saveState(state);
      hourBtn.textContent = state.settings.hourFormat === 12 ? '12hr' : '24hr';
      updateHeaderClock(state);
      emitHourFormatChange();
    };
  }

  initMobileMenu();
  initPlaceholderButtons();
  initFocusSounds(state);
}

function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const app = document.querySelector('.app');
  if (!menuBtn || !sidebar || !app) return;

  let backdrop = document.getElementById('sidebarBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebarBackdrop';
    backdrop.className = 'sidebar-backdrop';
    app.appendChild(backdrop);
  }

  const close = () => app.classList.remove('sidebar-open');
  menuBtn.onclick = () => app.classList.toggle('sidebar-open');
  backdrop.onclick = close;
  sidebar.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', close);
  });
}

function initPlaceholderButtons() {
  document.querySelector('.upgrade-btn')?.addEventListener('click', () => {
    showToast('Account features coming soon');
  });
  document.querySelector('a.header-link[href="#"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Thanks for your interest! Feedback form coming soon.');
  });
}

export function updateHeaderClock(state) {
  const el = document.getElementById('headerClock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: state.settings.hourFormat === 12,
  });
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function initFocusSounds(state) {
  const btn = document.getElementById('focusSoundsBtn');
  const dropdown = document.getElementById('focusSoundsDropdown');
  if (!btn || !dropdown) return;

  btn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  };

  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  dropdown.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.sound === state.settings.focusSound);
    b.onclick = (e) => {
      e.stopPropagation();
      state.settings.focusSound = b.dataset.sound;
      saveState(state);
      startAmbientSound(b.dataset.sound).catch(() => {});
      dropdown.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      btn.textContent = b.dataset.sound === 'none' ? 'Focus' : b.textContent;
      dropdown.classList.add('hidden');
    };
  });

  if (state.settings.focusSound !== 'none') {
    startAmbientSound(state.settings.focusSound).catch(() => {});
  }
}

export function destroyShared() {
  if (clockInterval) clearInterval(clockInterval);
  stopAmbientSound();
}