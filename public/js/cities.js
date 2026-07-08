export const DEFAULT_CITIES = [
  { id: 'America/Edmonton', city: 'Edmonton', country: 'Alberta' },
  { id: 'America/Toronto', city: 'Toronto', country: 'Ontario' },
];

export function mergeDefaultCities(existing = []) {
  const merged = existing.map((c) => ({ ...c }));
  for (const city of DEFAULT_CITIES) {
    const idx = merged.findIndex((c) => c.id === city.id);
    if (idx === -1) {
      merged.push({ ...city });
    } else {
      merged[idx] = { ...merged[idx], city: city.city, country: city.country };
    }
  }
  return merged;
}

export function addCityToList(list, city) {
  if (list.some((c) => c.id === city.id)) return list;
  return [...list, { ...city }];
}

export function removeCityFromList(list, id) {
  return list.filter((c) => c.id !== id);
}

export function replaceCityInList(list, replaceId, city) {
  return list.map((c) => (c.id === replaceId ? { ...city } : c));
}

export function ensureSelectedId(list, selectedId, fallbackId) {
  if (list.some((c) => c.id === selectedId)) return selectedId;
  return list[0]?.id || fallbackId;
}