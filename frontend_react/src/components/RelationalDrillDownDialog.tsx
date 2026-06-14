import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardService,
  RelationalListItem,
} from "@/services/api";
import { ChevronRight, ExternalLink } from "lucide-react";

export type RelationalDrillView =
  | "ninos_todos"
  | "ninos_disponibles"
  | "ninos_apadrinados"
  | "padrinos_activos"
  | "padrinos_todos"
  | "apadrinamientos_activos"
  | "apadrinamientos_todos"
  | "entregas_completadas"
  | "entregas_pendientes"
  | "entregas_todas"
  | "solicitudes_abiertas"
  | "eventos_activos";

export type RelationalDrillDownTarget = {
  view: RelationalDrillView;
  label: string;
};

type DrillKind =
  | "ninos"
  | "padrinos"
  | "asignaciones"
  | "entregas"
  | "solicitudes"
  | "eventos";

function viewToKind(view: RelationalDrillView): DrillKind {
  if (view.startsWith("ninos_")) return "ninos";
  if (view.startsWith("padrinos_")) return "padrinos";
  if (view.startsWith("apadrinamientos_")) return "asignaciones";
  if (view.startsWith("entregas_")) return "entregas";
  if (view === "solicitudes_abiertas") return "solicitudes";
  return "eventos";
}

function strId(value: unknown): string {
  return value == null ? "" : String(value);
}

interface RelationalDrillDownDialogProps {
  target: RelationalDrillDownTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ninosMap: Map<string, string>;
  padrinosMap: Map<string, string>;
}

export function RelationalDrillDownDialog({
  target,
  open,
  onOpenChange,
  ninosMap,
  padrinosMap,
}: RelationalDrillDownDialogProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<RelationalListItem[]>([]);
  const [kind, setKind] = useState<DrillKind>("ninos");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !target) return;

    let cancelled = false;
    setLoading(true);
    setItems([]);
    setLoadError(null);
    setKind(viewToKind(target.view));

    DashboardService.getRelationalList(target.view, { limit: 300 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        if (res._error) {
          setLoadError(res._error);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "No se pudo cargar el listado";
        setLoadError(message);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, target]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const resolveNinoName = (id: unknown, fallback?: unknown) => {
    if (fallback) return String(fallback);
    const key = strId(id);
    return ninosMap.get(key) || (key ? `Niño #${key}` : "Niño desconocido");
  };

  const resolvePadrinoName = (id: unknown, fallback?: unknown) => {
    if (fallback) return String(fallback);
    const key = strId(id);
    return padrinosMap.get(key) || key || "Padrino desconocido";
  };

  const emptyState = () => (
    <div className="py-16 text-center text-muted-foreground">
      <p className="font-medium">Sin registros en esta categoría</p>
      {loadError ? (
        <p className="text-xs mt-2 text-destructive/90 max-w-md mx-auto">{loadError}</p>
      ) : (
        <p className="text-xs mt-1 opacity-70">
          El contador del dashboard puede incluir registros fuera del límite mostrado (300).
        </p>
      )}
    </div>
  );

  const loadingState = () => (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );

  const renderList = () => {
    if (loading) return loadingState();
    if (items.length === 0) return emptyState();

    if (kind === "ninos") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((n) => (
            <button
              key={strId(n.id_nino)}
              type="button"
              onClick={() => go(`/ninos/${n.id_nino}`)}
              className="w-full flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors text-left group"
            >
              <div>
                <p className="font-semibold">{String(n.nombre ?? "")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {n.edad} años · {String(n.genero ?? "")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={n.estado_apadrinamiento === "Apadrinado" ? "default" : "secondary"}
                >
                  {String(n.estado_apadrinamiento ?? "")}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (kind === "padrinos") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((p) => (
            <button
              key={strId(p.id_padrino)}
              type="button"
              onClick={() => go(`/padrinos/${p.id_padrino}`)}
              className="w-full flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors text-left group"
            >
              <div>
                <p className="font-semibold">{String(p.nombre ?? "")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{String(p.email ?? "")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      );
    }

    if (kind === "asignaciones") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((a) => (
            <button
              key={strId(a.id_apadrinamiento)}
              type="button"
              onClick={() => go(`/asignaciones/${a.id_apadrinamiento}`)}
              className="w-full flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors text-left group"
            >
              <div>
                <p className="font-semibold">
                  {resolveNinoName(a.id_nino, a.nino_nombre)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Padrino: {resolvePadrinoName(a.id_padrino, a.padrino_nombre)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{String(a.estado_apadrinamiento_registro ?? "")}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (kind === "entregas") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((e) => (
            <button
              key={strId(e.id_entrega)}
              type="button"
              onClick={() => go(`/entregas/${e.id_entrega}`)}
              className="w-full flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors text-left group"
            >
              <div>
                <p className="font-semibold line-clamp-1">{String(e.descripcion_regalo ?? "")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Programada:{" "}
                  {e.fecha_programada
                    ? new Date(String(e.fecha_programada)).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant={e.estado_entrega === "Entregado" ? "default" : "secondary"}>
                  {String(e.estado_entrega ?? "")}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (kind === "solicitudes") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((s) => (
            <button
              key={strId(s.id_solicitud)}
              type="button"
              onClick={() => go(`/cartas/${s.id_solicitud}`)}
              className="w-full flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors text-left group"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {resolveNinoName(s.id_nino, s.nino_nombre)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {String(s.descripcion_solicitud ?? "")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
            </button>
          ))}
        </div>
      );
    }

    if (kind === "eventos") {
      return (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((ev) => (
            <div
              key={strId(ev.id_evento)}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div>
                <p className="font-semibold">{String(ev.nombre_evento ?? "")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.fecha_inicio
                    ? new Date(String(ev.fecha_inicio)).toLocaleDateString()
                    : "—"}{" "}
                  — {String(ev.tipo_evento ?? "")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => go("/eventos")} className="gap-1">
                Ver eventos <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    }

    return emptyState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target?.label ?? "Detalle"}</DialogTitle>
          <DialogDescription>
            Datos desde MySQL. Selecciona un registro para ir a su detalle.
            {!loading && items.length > 0 ? ` Mostrando ${items.length} registros.` : null}
          </DialogDescription>
        </DialogHeader>
        {renderList()}
      </DialogContent>
    </Dialog>
  );
}
