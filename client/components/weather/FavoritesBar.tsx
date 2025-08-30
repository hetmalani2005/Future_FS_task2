import { X } from "lucide-react";
import { FavoriteCity } from "@/lib/storage";

interface Props {
  items: FavoriteCity[];
  onSelect: (name: string) => void;
  onRemove: (key: string) => void;
}

export function FavoritesBar({ items, onSelect, onRemove }: Props) {
  if (!items.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((c) => (
        <button
          key={c.key}
          className="group flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-sm text-foreground/80 ring-1 ring-inset ring-border backdrop-blur hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/15"
          onClick={() => onSelect(c.name)}
        >
          <span>{c.name}</span>
          <X
            className="h-4 w-4 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(c.key);
            }}
          />
        </button>
      ))}
    </div>
  );
}
