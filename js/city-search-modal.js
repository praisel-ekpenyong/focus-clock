import { escapeHtml, DEFAULT_WORLD_CLOCK_CITIES } from './storage.js';
import { searchTimezones } from './timezone-data.js';

export function citySearchModalHtml(idPrefix) {
  return `
    <div class="modal-overlay hidden" id="${idPrefix}Modal">
      <div class="modal modal-wide">
        <input type="text" class="modal-input" id="${idPrefix}Search" placeholder="Search city or country...">
        <div class="tz-search-results" id="${idPrefix}Results"></div>
        <button class="btn-secondary modal-cancel" id="${idPrefix}Close">Cancel</button>
      </div>
    </div>
  `;
}

export function bindCitySearchModal(container, idPrefix, options) {
  const {
    getExistingIds,
    onSelect,
    showTimezoneId = false,
    emptyMessage = 'No cities found',
  } = options;

  const modal = container.querySelector(`#${idPrefix}Modal`);
  const search = container.querySelector(`#${idPrefix}Search`);
  const results = container.querySelector(`#${idPrefix}Results`);
  const closeBtn = container.querySelector(`#${idPrefix}Close`);

  function close() {
    modal.classList.add('hidden');
  }

  function showResults(query = '', replaceId = null) {
    const existingIds = getExistingIds();
    const available = searchTimezones(query).filter(
      (t) => !existingIds.includes(t.id) || t.id === replaceId
    );
    const pinned = !query && !replaceId
      ? DEFAULT_WORLD_CLOCK_CITIES.filter((t) => !existingIds.includes(t.id))
      : [];
    const list = [
      ...pinned,
      ...available.filter((t) => !pinned.some((p) => p.id === t.id)),
    ];

    results.innerHTML = list.map((t) => {
      const label = escapeHtml(t.city) + (t.country ? ', ' + escapeHtml(t.country) : '');
      const idLine = showTimezoneId
        ? '<span class="tz-search-id">' + escapeHtml(t.id) + '</span>'
        : '';
      return (
        '<button class="tz-search-item" data-id="' + escapeHtml(t.id) +
        '" data-city="' + escapeHtml(t.city) +
        '" data-country="' + escapeHtml(t.country) + '">' +
        label + idLine + '</button>'
      );
    }).join('') || '<p class="tz-no-results">' + emptyMessage + '</p>';

    results.querySelectorAll('.tz-search-item').forEach((btn) => {
      btn.onclick = () => {
        onSelect(
          {
            id: btn.dataset.id,
            city: btn.dataset.city,
            country: btn.dataset.country,
          },
          { replaceId }
        );
        close();
      };
    });
  }

  closeBtn.onclick = close;
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };

  return {
    open({ replaceId = null } = {}) {
      modal.classList.remove('hidden');
      search.value = '';
      search.oninput = () => showResults(search.value, replaceId);
      showResults('', replaceId);
      search.focus();
    },
    close,
  };
}