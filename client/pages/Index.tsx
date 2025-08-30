import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeatherResponse } from "@shared/api";
import { SearchBar } from "@/components/weather/SearchBar";
import { WeatherNowCard } from "@/components/weather/WeatherNowCard";
import { ForecastList } from "@/components/weather/ForecastList";
import { FavoritesBar } from "@/components/weather/FavoritesBar";
import { Loader } from "@/components/weather/Loader";
import { FavoriteCity, loadFavorites, saveFavorites, toggleFavorite } from "@/lib/storage";

export default function Index() {
  const [query, setQuery] = useState("San Francisco");
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const isFavorite = useMemo(() => {
    if (!data) return false;
    const key = favoriteKey(data);
    return favorites.some((f) => f.key === key);
  }, [favorites, data]);

  const onToggleFavorite = useCallback(() => {
    if (!data) return;
    const fav = { key: favoriteKey(data), name: favoriteName(data) };
    const next = toggleFavorite(fav);
    setFavorites(next);
  }, [data]);

  const fetchWeather = useCallback(async (q: string) => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`/api/weather?query=${encodeURIComponent(q)}`);
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || "Failed to fetch weather");
      }
      setData(payload as WeatherResponse);
      setQuery(q);
    } catch (e: any) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(query);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-sky-50 to-indigo-100 dark:from-[#0a0e1a] dark:via-[#0b1222] dark:to-[#0d162a]">
      <header className="mx-auto max-w-5xl px-6 pt-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <a href="/" className="group inline-flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-brand to-indigo-500 p-[2px]">
              <div className="h-full w-full rounded-[14px] bg-white/90 p-1 dark:bg-white/10" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-foreground">
                Cirrus Weather
              </div>
              <div className="text-xs text-foreground/60">Forecasts at a glance</div>
            </div>
          </a>
          <div className="w-full max-w-lg md:w-auto">
            <SearchBar initial={query} onSearch={fetchWeather} />
            <FavoritesBar
              items={favorites}
              onSelect={(name) => fetchWeather(name)}
              onRemove={(key) => {
                const next = favorites.filter((f) => f.key !== key);
                saveFavorites(next);
                setFavorites(next);
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            {error.includes("OPENWEATHER_API_KEY") ? (
              <span>
                Missing API key. Set OPENWEATHER_API_KEY in the environment to enable live data.
              </span>
            ) : (
              <span>{error}</span>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <WeatherNowCard
                data={data}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
            <div className="md:col-span-3">
              <section className="rounded-3xl bg-white/60 p-6 ring-1 ring-inset ring-border backdrop-blur dark:bg-white/5">
                <h3 className="text-lg font-semibold text-foreground">Next 5 days</h3>
                <ForecastList days={data.forecast} />
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-sm text-foreground/60">
        Data by OpenWeather • Save favorites for quick access
      </footer>
    </div>
  );
}

function favoriteKey(d: WeatherResponse) {
  return [d.location.name, d.location.state, d.location.country].filter(Boolean).join(", ");
}
function favoriteName(d: WeatherResponse) {
  return favoriteKey(d);
}
