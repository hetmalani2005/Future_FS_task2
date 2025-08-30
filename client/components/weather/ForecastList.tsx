import type { WeatherDay } from "@shared/api";

function dayLabel(ts: number | null) {
  if (!ts) return "--";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function iconUrl(code: string | null) {
  return code ? `https://openweathermap.org/img/wn/${code}.png` : "";
}

export function ForecastList({ days }: { days: WeatherDay[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
      {days.map((d, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 text-center ring-1 ring-inset ring-border"
        >
          <div className="text-sm text-foreground/70">{dayLabel(d.date)}</div>
          {d.icon && (
            <img alt="" src={iconUrl(d.icon)} className="mx-auto mt-2 h-10 w-10" />
          )}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{d.max !== null ? Math.round(d.max) : "--"}°</span>
            <span className="text-foreground/60">{d.min !== null ? Math.round(d.min) : "--"}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}
