import { saveState } from '../storage.js';
import { formatCityLabel } from '../dom.js';
import { addCityToList, removeCityFromList, replaceCityInList, ensureSelectedId } from '../cities.js';
import { createPageScope } from '../page-lifecycle.js';
import {
  formatTimeParts,
  getGmtOffset,
  formatShortDateInZone,
  getHourInZone,
  isDifferentDay,
  getDisplayNow,
  setScrubHour,
} from '../timezone-utils.js';
import { showToast } from '../shared.js';
import { citySearchModalHtml, bindCitySearchModal } from '../city-search-modal.js';

let scope = null;

const GRID_ICON = '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>';
const LIST_ICON = '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';

export function renderTimezones(outlet, state) {
  if (scope) scope.destroy();
  scope = createPageScope();

  let hour12 = state.settings.hourFormat === 12;
  const primary = () =>
    state.timezones.find((t) => t.id === state.primaryTimezone) || state.timezones[0];

  outlet.innerHTML = `
    <div class="page-timezones">
      <div class="tz-toolbar">
        <button class="toolbar-btn" id="tzCopyUrl" title="Copy URL">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span class="toolbar-label">Copy URL</span>
        </button>
        <button class="toolbar-btn" id="tzViewToggle" title="Toggle view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17" id="tzViewIcon"></svg>
        </button>
      </div>
      <div class="tz-grid ${state.timezoneView === 'list' ? 'tz-list-view' : ''}" id="tzGrid"></div>
    </div>
    ${citySearchModalHtml('tz')}
  `;

  const grid = outlet.querySelector('#tzGrid');
  const viewIcon = outlet.querySelector('#tzViewIcon');
  let scrubbing = false;

  const cityModal = bindCitySearchModal(outlet, 'tz', {
    getExistingIds: () => state.timezones.map((t) => t.id),
    onSelect: (tz, { replaceId }) => {
      if (replaceId) {
        state.timezones = replaceCityInList(state.timezones, replaceId, tz);
        if (state.primaryTimezone === replaceId) state.primaryTimezone = tz.id;
      } else {
        state.timezones = addCityToList(state.timezones, tz);
      }
      saveState(state);
      renderGrid();
    },
    showTimezoneId: true,
    emptyMessage: 'No timezones found',
  });

  function updateViewIcon() {
    viewIcon.innerHTML = state.timezoneView === 'grid' ? LIST_ICON : GRID_ICON;
  }

  function buildCardHtml(tz, now) {
    const p = primary();
    const isPrimary = tz.id === state.primaryTimezone;
    const parts = formatTimeParts(tz.id, hour12, now);
    const offset = getGmtOffset(tz.id, now);
    const dateStr = formatShortDateInZone(tz.id, now);
    const hour = getHourInZone(tz.id, now);
    const diffDay = p && isDifferentDay(p.id, tz.id, now);
    const sliderPos = (hour / 24) * 100;
    const interactive = isPrimary && state.tzScrubOffsetMs !== 0;
    return (
      '<div class="tz-card' + (isPrimary ? ' tz-card-primary' : '') +
      (interactive ? ' tz-card-scrubbed' : '') + '" data-id="' + tz.id + '">' +
      '<div class="tz-card-header">' +
      '<span class="tz-card-location">' + formatCityLabel(tz.city, tz.country) + '</span>' +
      '<div class="tz-card-actions">' +
      (state.tzScrubOffsetMs !== 0 && isPrimary ? '<button class="tz-reset-btn" data-reset title="Reset to now">↺</button>' : '') +
      '<button class="tz-edit-btn" data-edit title="Change timezone">✎</button>' +
      (state.timezones.length > 1 ? '<button class="tz-delete-btn" data-delete title="Remove">×</button>' : '') +
      '</div></div>' +
      '<div class="tz-card-time">' +
      '<span class="tz-hour">' + parts.hour + '</span>' +
      '<span class="tz-colon tz-blink">:</span>' +
      '<span class="tz-minute">' + parts.minute + '</span>' +
      (hour12 ? '<span class="tz-ampm">' + parts.amPm + '</span>' : '') +
      '</div>' +
      '<div class="tz-card-meta">' +
      '<span>' + offset + '</span><span>·</span>' +
      '<span class="' + (diffDay ? 'tz-date-diff' : '') + '">' + dateStr + '</span>' +
      '</div>' +
      '<div class="tz-slider' + (isPrimary ? ' tz-slider-interactive' : '') + '">' +
      '<div class="tz-slider-track" data-track="' + (isPrimary ? '1' : '') + '">' +
      '<div class="tz-slider-fill" style="width:' + sliderPos + '%"></div>' +
      '<div class="tz-slider-thumb" style="left:calc(' + sliderPos + '% - 6px)"></div>' +
      '</div>' +
      '<div class="tz-slider-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>' +
      '</div></div>'
    );
  }

  function updateTimes() {
    const now = getDisplayNow(state);
    const cards = grid.querySelectorAll('.tz-card');
    if (cards.length !== state.timezones.length) {
      renderGrid();
      return;
    }

    const p = primary();
    state.timezones.forEach((tz) => {
      const card = grid.querySelector('.tz-card[data-id="' + tz.id + '"]');
      if (!card) return;

      const parts = formatTimeParts(tz.id, hour12, now);
      const offset = getGmtOffset(tz.id, now);
      const dateStr = formatShortDateInZone(tz.id, now);
      const hour = getHourInZone(tz.id, now);
      const diffDay = p && isDifferentDay(p.id, tz.id, now);
      const sliderPos = (hour / 24) * 100;

      card.querySelector('.tz-hour').textContent = parts.hour;
      card.querySelector('.tz-minute').textContent = parts.minute;
      const ampmEl = card.querySelector('.tz-ampm');
      if (ampmEl) ampmEl.textContent = parts.amPm;

      const metaSpans = card.querySelectorAll('.tz-card-meta span');
      if (metaSpans[0]) metaSpans[0].textContent = offset;
      if (metaSpans[2]) {
        metaSpans[2].textContent = dateStr;
        metaSpans[2].classList.toggle('tz-date-diff', !!diffDay);
      }

      const fill = card.querySelector('.tz-slider-fill');
      const thumb = card.querySelector('.tz-slider-thumb');
      if (fill) fill.style.width = sliderPos + '%';
      if (thumb) thumb.style.left = 'calc(' + sliderPos + '% - 6px)';
    });
  }

  function renderGrid() {
    const now = getDisplayNow(state);
    const cards = state.timezones.map((tz) => buildCardHtml(tz, now)).join('');

    grid.innerHTML = cards + (
      '<button class="tz-add-card" id="tzAddBtn">' +
      '<span class="tz-add-icon">+</span><span>Add Timezone</span></button>'
    );

    grid.querySelectorAll('.tz-card').forEach((card) => {
      card.onclick = (e) => {
        if (e.target.closest('[data-delete]')) {
          const id = card.dataset.id;
          state.timezones = removeCityFromList(state.timezones, id);
          if (state.primaryTimezone === id) {
            state.primaryTimezone = ensureSelectedId(state.timezones, state.primaryTimezone, 'America/Edmonton');
            state.tzScrubOffsetMs = 0;
          }
          saveState(state);
          renderGrid();
          return;
        }
        if (e.target.closest('[data-reset]')) {
          state.tzScrubOffsetMs = 0;
          saveState(state);
          renderGrid();
          return;
        }
        if (e.target.closest('[data-edit]')) {
          openModal(card.dataset.id);
          return;
        }
        if (e.target.closest('[data-track]')) return;
        state.primaryTimezone = card.dataset.id;
        saveState(state);
        renderGrid();
      };
    });

    bindSlider();
    outlet.querySelector('#tzAddBtn').onclick = () => openModal();
  }

  function scrubFromEvent(e, track) {
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, (e.clientX || e.touches?.[0]?.clientX) - rect.left));
    const hour = Math.round((x / rect.width) * 24) % 24;
    setScrubHour(state, state.primaryTimezone, hour);
    saveState(state);
    updateTimes();
  }

  function bindSlider() {
    const track = grid.querySelector('[data-track="1"]');
    if (!track) return;

    const onMove = (e) => {
      if (!scrubbing) return;
      e.preventDefault();
      scrubFromEvent(e, track);
    };

    const onEnd = () => {
      scrubbing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    track.onmousedown = (e) => {
      scrubbing = true;
      scrubFromEvent(e, track);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    };

    track.ontouchstart = (e) => {
      scrubbing = true;
      scrubFromEvent(e, track);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };
  }

  function openModal(replaceId = null) {
    cityModal.open({ replaceId });
  }

  outlet.querySelector('#tzViewToggle').onclick = () => {
    state.timezoneView = state.timezoneView === 'grid' ? 'list' : 'grid';
    saveState(state);
    grid.classList.toggle('tz-list-view', state.timezoneView === 'list');
    updateViewIcon();
  };

  outlet.querySelector('#tzCopyUrl').onclick = () => {
    const ids = state.timezones.map((t) =>
      t.id === state.primaryTimezone ? t.id + '-primary' : t.id
    ).join(',');
    const url = window.location.origin + window.location.pathname +
      '#/timezones?d=' + encodeURIComponent(ids) + '&h=' + state.settings.hourFormat;
    navigator.clipboard.writeText(url).then(() => showToast('URL copied!'));
  };

  scope.onHourFormatChange(() => {
    hour12 = state.settings.hourFormat === 12;
    renderGrid();
  });

  updateViewIcon();
  renderGrid();
  scope.interval(updateTimes, 1000);
}

export function destroyTimezones() {
  if (scope) {
    scope.destroy();
    scope = null;
  }
}

export const timezonesBreadcrumb = `
  <span class="breadcrumb-item">Timezones</span>
  <span class="breadcrumb-sep">/</span>
  <button class="breadcrumb-btn">Teams</button>
`;