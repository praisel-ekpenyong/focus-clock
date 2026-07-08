export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

export function formatCityLabel(city, country, escaped = true) {
  const c = escaped ? escapeHtml(city) : city;
  if (!country) return c;
  const co = escaped ? escapeHtml(country) : country;
  return `${c}, ${co}`;
}

export function padTime(n, digits = 2) {
  return String(n).padStart(digits, '0');
}

export function bindOverlayModal(overlay, { onBackdropClose = true } = {}) {
  if (!overlay) return { open: () => {}, close: () => {} };
  const close = () => overlay.classList.add('hidden');
  const open = () => overlay.classList.remove('hidden');
  if (onBackdropClose) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  return { open, close };
}