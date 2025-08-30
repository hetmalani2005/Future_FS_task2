const KEY = "weather_favorites_v1";

export interface FavoriteCity {
  key: string; // name + country (and state if present)
  name: string;
}

export function loadFavorites(): FavoriteCity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

export function saveFavorites(list: FavoriteCity[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleFavorite(city: FavoriteCity): FavoriteCity[] {
  const current = loadFavorites();
  const exists = current.some((c) => c.key === city.key);
  const next = exists
    ? current.filter((c) => c.key !== city.key)
    : [{ key: city.key, name: city.name }, ...current].slice(0, 12);
  saveFavorites(next);
  return next;
}
