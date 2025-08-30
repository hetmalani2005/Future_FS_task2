import { Star } from "lucide-react";
import type { WeatherResponse } from "@shared/api";
import { cn } from "@/lib/utils";

interface Props {
  data: WeatherResponse;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  className?: string;
}

function iconUrl(code: string | null) {
  return code ? `https://openweathermap.org/img/wn/${code}@2x.png` : "";
}

export function WeatherNowCard({ data, isFavorite, onToggleFavorite, className }: Props) {
  const { location, current } = data;
  const title = [location.name, location.state, location.country].filter(Boolean).join(", ");

  return (
    <div className={cn(
      "rounded-3xl bg-white/80 dark:bg-white/5 p-6 shadow-xl ring-1 ring-inset ring-border backdrop-blur",
      className,
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-tight text-foreground">{title}</h2>
          <p className="text-foreground/70 capitalize">{current.description ?? ""}</p>
        </div>
        <button
          onClick={onToggleFavorite}
          className={cn(
            "rounded-full p-2 ring-1 ring-inset ring-border transition-colors",
            isFavorite ? "text-brand" : "text-foreground/60 hover:text-foreground",
          )}
          aria-label={isFavorite ? "Remove favorite" : "Save favorite"}
        >
          <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>
      </div>

      <div className="mt-6 flex items-end gap-6">
        {current.icon && (
          <img alt="weather icon" src={iconUrl(current.icon)} className="h-20 w-20" />
        )}
        <div className="flex items-end gap-3">
          <span className="text-6xl font-extrabold tracking-tight text-foreground">
            {typeof current.temp === "number" ? Math.round(current.temp) : "--"}
          </span>
          <span className="mb-2 text-2xl text-foreground/70">°C</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl bg-brand/10 p-3 text-brand ring-1 ring-inset ring-brand/20">
          <div className="text-foreground/70">Humidity</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {typeof current.humidity === "number" ? `${current.humidity}%` : "--"}
          </div>
        </div>
        <div className="rounded-xl bg-accent p-3 ring-1 ring-inset ring-border">
          <div className="text-foreground/70">Feels like</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {typeof current.feels_like === "number" ? `${Math.round(current.feels_like)}°C` : "--"}
          </div>
        </div>
      </div>
    </div>
  );
}
