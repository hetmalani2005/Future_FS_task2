import type { RequestHandler } from "express";

const OPENWEATHER_BASE = "https://api.openweathermap.org";

interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export const handleWeather: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing OPENWEATHER_API_KEY environment variable" });
      return;
    }

    const query = (req.query.query as string | undefined)?.trim();
    if (!query) {
      res.status(400).json({ error: "Missing required 'query' parameter" });
      return;
    }

    // 1) Geocode the query to lat/lon (try multiple and choose best match)
    const geoUrl = new URL("/geo/1.0/direct", OPENWEATHER_BASE);
    geoUrl.searchParams.set("q", query);
    geoUrl.searchParams.set("limit", "5");
    geoUrl.searchParams.set("appid", apiKey);

    const geoResp = await fetch(geoUrl);
    const geoText = await geoResp.text();
    if (!geoResp.ok) {
      res.status(geoResp.status).json({ error: `Geocoding failed: ${geoText}` });
      return;
    }
    const geoData = JSON.parse(geoText) as GeoResult[];
    if (!Array.isArray(geoData) || geoData.length === 0) {
      res.status(404).json({ error: "Location not found" });
      return;
    }

    const qLower = query.toLowerCase();
    const tokens = qLower.split(/[^a-z0-9]+/).filter(Boolean);
    const countryHints: Record<string, string> = { india: "IN", bharat: "IN" };
    const hintedCountry = Object.entries(countryHints).find(([k]) => qLower.includes(k))?.[1];

    const score = (p: GeoResult) => {
      let s = 0;
      const name = (p.name || "").toLowerCase();
      const state = (p.state || "").toLowerCase();
      const country = (p.country || "").toUpperCase();

      if (tokens[0] && name === tokens[0]) s += 3;
      if (tokens.some((t) => t.length >= 3 && name.includes(t))) s += 1;
      if (state && tokens.some((t) => t.length >= 3 && state.includes(t))) s += 3;
      if (hintedCountry && country === hintedCountry) s += 3;
      if (tokens.includes(country.toLowerCase())) s += 2;
      return s;
    };

    const place = geoData
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      [0].p;

    // 2) Fetch current weather (free tier)
    const currentUrl = new URL("/data/2.5/weather", OPENWEATHER_BASE);
    currentUrl.searchParams.set("lat", String(place.lat));
    currentUrl.searchParams.set("lon", String(place.lon));
    currentUrl.searchParams.set("units", "metric");
    currentUrl.searchParams.set("appid", apiKey);

    const currentResp = await fetch(currentUrl);
    const currentText = await currentResp.text();
    if (!currentResp.ok) {
      res.status(currentResp.status).json({ error: `Current weather failed: ${currentText}` });
      return;
    }
    const current = JSON.parse(currentText);

    // 3) Fetch 5 day / 3 hour forecast (free tier) and aggregate to daily
    const forecastUrl = new URL("/data/2.5/forecast", OPENWEATHER_BASE);
    forecastUrl.searchParams.set("lat", String(place.lat));
    forecastUrl.searchParams.set("lon", String(place.lon));
    forecastUrl.searchParams.set("units", "metric");
    forecastUrl.searchParams.set("appid", apiKey);

    const forecastResp = await fetch(forecastUrl);
    const forecastText = await forecastResp.text();
    if (!forecastResp.ok) {
      res.status(forecastResp.status).json({ error: `Forecast failed: ${forecastText}` });
      return;
    }
    const forecastData = JSON.parse(forecastText);

    // timezone shift in seconds from response city
    const tzShift: number = forecastData?.city?.timezone ?? 0;

    type Bucket = {
      date: string; // yyyy-mm-dd in local tz
      min: number;
      max: number;
      icon: string | null;
      description: string | null;
      ts: number; // representative timestamp (ms)
    };

    const map = new Map<string, Bucket>();
    for (const it of (forecastData?.list ?? []) as any[]) {
      const dt: number = it.dt ?? 0; // seconds
      const localMs = (dt + tzShift) * 1000;
      const d = new Date(localMs);
      const key = d.toISOString().slice(0, 10);
      const temp = it.main?.temp as number | undefined;
      const min = it.main?.temp_min as number | undefined;
      const max = it.main?.temp_max as number | undefined;
      const icon = it.weather?.[0]?.icon ?? null;
      const desc = it.weather?.[0]?.description ?? null;

      const bucket = map.get(key);
      if (!bucket) {
        map.set(key, {
          date: key,
          min: typeof min === "number" ? min : (typeof temp === "number" ? temp : NaN),
          max: typeof max === "number" ? max : (typeof temp === "number" ? temp : NaN),
          icon,
          description: desc,
          ts: localMs,
        });
      } else {
        if (typeof min === "number") bucket.min = Math.min(bucket.min, min);
        if (typeof max === "number") bucket.max = Math.max(bucket.max, max);
        // prefer midday icon (~12:00)
        const hour = new Date(localMs).getUTCHours();
        const currentHour = new Date(bucket.ts).getUTCHours();
        if (Math.abs(hour - 12) < Math.abs(currentHour - 12) && icon) {
          bucket.icon = icon;
          bucket.description = desc;
          bucket.ts = localMs;
        }
      }
    }

    // Skip today, take next 5 days
    const todayKey = new Date(Date.now() + tzShift * 1000).toISOString().slice(0, 10);
    const days = Array.from(map.values())
      .filter((b) => b.date !== todayKey)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 5)
      .map((b) => ({
        date: b.ts,
        min: Number.isFinite(b.min) ? b.min : null,
        max: Number.isFinite(b.max) ? b.max : null,
        description: b.description,
        icon: b.icon,
      }));

    const response = {
      location: {
        name: place.name,
        country: place.country,
        state: place.state ?? null,
        lat: place.lat,
        lon: place.lon,
      },
      current: {
        temp: current?.main?.temp ?? null,
        humidity: current?.main?.humidity ?? null,
        description: current?.weather?.[0]?.description ?? null,
        icon: current?.weather?.[0]?.icon ?? null,
        feels_like: current?.main?.feels_like ?? null,
        wind_speed: current?.wind?.speed ?? null,
      },
      forecast: days,
    };

    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Unexpected server error" });
  }
};
