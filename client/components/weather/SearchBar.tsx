import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initial?: string;
  onSearch: (q: string) => void;
  className?: string;
}

export function SearchBar({ initial = "", onSearch, className }: Props) {
  const [value, setValue] = useState(initial);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) onSearch(q);
  };

  return (
    <form onSubmit={submit} className={cn("relative", className)}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search city or region"
        className="w-full rounded-2xl bg-white/70 dark:bg-white/10 px-5 py-3 pl-12 text-base text-foreground placeholder:text-foreground/60 shadow-sm ring-1 ring-inset ring-border focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-3 top-1/2 -translate-y-2.5 text-foreground/70 hover:text-foreground"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}
