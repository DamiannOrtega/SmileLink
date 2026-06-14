import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface DrillDownSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalCount: number;
  filteredCount: number;
  disabled?: boolean;
}

export function DrillDownSearchBar({
  value,
  onChange,
  placeholder = "Buscar…",
  totalCount,
  filteredCount,
  disabled = false,
}: DrillDownSearchBarProps) {
  const isFiltering = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || totalCount === 0}
          autoFocus
          className="pl-9 pr-9"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {!disabled && totalCount > 0 ? (
        <p className="text-xs text-muted-foreground px-1">
          {isFiltering
            ? `${filteredCount} de ${totalCount} coincidencias`
            : `${totalCount} registros`}
        </p>
      ) : null}
    </div>
  );
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function textMatchesQuery(text: string, query: string): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return text.toLowerCase().includes(q);
}
