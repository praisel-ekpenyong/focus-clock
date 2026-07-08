import { saveState } from '../storage.js';
import { formatCityLabel } from '../dom.js';
import { addCityToList, removeCityFromList, ensureSelectedId } from '../cities.js';
import { formatTimeParts, formatDateInZone } from '../timezone-utils.js';
import { citySearchModalHtml, bindCitySearchModal } from '../city-search-modal.js';
import { createPageScope } from '../page-lifecycle.js';

let scope = null;

export function renderWorldClock(outlet, state) {
  if (scope) scope.destroy();
  scope = createPageScope();

  let hour12 = state.settings.hourFormat === 12;

  outlet.innerHTML = `
    <div class="page-world-clock">
      <section class="wc-list-panel">
        <button class="wc-add-btn" id="wcAddBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ADD CITY, COUNTRY, OR TIMEZONE
        </button>
        <ul class="wc-city-list" id="wcCityList"></ul>
      </section>
      <section class="wc-display-panel" id="wcDisplay">
        <div class="wc-display-actions">
          <button class="action-icon-btn" id="wcFullscreen" title="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
        <div class="wc-main-display" id="wcMainDisplay"></div>
      </section>
    </div>
    ${citySearchModalHtml('wc')}
  `;

  const cityModal = bindCitySearchModal(outlet, 'wc', {
    getExistingIds: () => state.worldClockCities.map((c) => c.id),
    onSelect: (city) => {
      state.worldClockCities = addCityToList(state.worldClockCities, city);
      state.selectedWorldCity = city.id;
      saveState(state);
      renderList();
      renderDisplay();
    },
    emptyMessage: 'No cities found',
  });

  function formatCityTime(cityId, now) {
    const parts = formatTimeParts(cityId, hour12, now);
    return hour12
      ? `${parts.hour}:${parts.minute} ${parts.amPm}`
      : `${parts.hour}:${parts.minute}`;
  }

  function renderList() {
    const now = new Date();
    const list = outlet.querySelector('#wcCityList');
    list.innerHTML = state.worldClockCities.map((city) => {
      const isActive = city.id === state.selectedWorldCity;
      return (
        '<li class="wc-city-item' + (isActive ? ' active' : '') + '" data-id="' + city.id + '">' +
        '<span class="wc-city-name">' + formatCityLabel(city.city, city.country) + '</span>' +
        '<span class="wc-city-time">' + formatCityTime(city.id, now) + '</span>' +
        (state.worldClockCities.length > 1 ? '<button class="wc-city-delete" data-delete>×</button>' : '') +
        '</li>'
      );
    }).join('');

    list.querySelectorAll('.wc-city-item').forEach((item) => {
      item.onclick = (e) => {
        if (e.target.closest('[data-delete]')) {
          const id = item.dataset.id;
          state.worldClockCities = removeCityFromList(state.worldClockCities, id);
          state.selectedWorldCity = ensureSelectedId(
            state.worldClockCities,
            state.selectedWorldCity,
            'America/Edmonton'
          );
          saveState(state);
          renderList();
          renderDisplay();
          return;
        }
        state.selectedWorldCity = item.dataset.id;
        saveState(state);
        list.querySelectorAll('.wc-city-item').forEach((el) => {
          el.classList.toggle('active', el.dataset.id === item.dataset.id);
        });
        renderDisplay();
      };
    });
  }

  function updateListTimes() {
    const now = new Date();
    const items = outlet.querySelectorAll('.wc-city-item');
    if (items.length !== state.worldClockCities.length) {
      renderList();
      return;
    }
    items.forEach((item) => {
      const timeEl = item.querySelector('.wc-city-time');
      if (timeEl) timeEl.textContent = formatCityTime(item.dataset.id, now);
    });
  }

  function renderDisplay() {
    const city = state.worldClockCities.find((c) => c.id === state.selectedWorldCity);
    if (!city) return;
    const now = new Date();
    const parts = formatTimeParts(city.id, hour12, now);
    const dateStr = formatDateInZone(city.id, now);

    outlet.querySelector('#wcMainDisplay').innerHTML = (
      '<p class="wc-location">' + formatCityLabel(city.city, city.country) + '</p>' +
      '<div class="wc-big-time">' +
      '<span class="wc-big-hour">' + parts.hour + '</span>' +
      '<span class="wc-big-colon wc-blink">:</span>' +
      '<span class="wc-big-minute">' + parts.minute + '</span>' +
      (hour12 ? '<span class="wc-big-ampm">' + parts.amPm + '</span>' : '') +
      '</div>' +
      '<p class="wc-date">' + dateStr + '</p>'
    );
  }

  function updateDisplayTime() {
    const city = state.worldClockCities.find((c) => c.id === state.selectedWorldCity);
    const display = outlet.querySelector('#wcMainDisplay');
    if (!city || !display.querySelector('.wc-big-hour')) {
      renderDisplay();
      return;
    }
    const now = new Date();
    const parts = formatTimeParts(city.id, hour12, now);
    display.querySelector('.wc-big-hour').textContent = parts.hour;
    display.querySelector('.wc-big-minute').textContent = parts.minute;
    const ampm = display.querySelector('.wc-big-ampm');
    if (ampm) ampm.textContent = parts.amPm;
    const dateEl = display.querySelector('.wc-date');
    if (dateEl) dateEl.textContent = formatDateInZone(city.id, now);
  }

  outlet.querySelector('#wcAddBtn').onclick = () => cityModal.open();
  outlet.querySelector('#wcFullscreen').onclick = () => {
    outlet.querySelector('.wc-display-panel').classList.toggle('wc-fullscreen');
  };

  scope.onHourFormatChange(() => {
    hour12 = state.settings.hourFormat === 12;
    renderList();
    renderDisplay();
  });

  renderList();
  renderDisplay();
  scope.interval(() => {
    updateListTimes();
    updateDisplayTime();
  }, 1000);
}

export function destroyWorldClock() {
  if (scope) {
    scope.destroy();
    scope = null;
  }
}

export const worldClockBreadcrumb = '<span class="breadcrumb-item">World Clock</span>';