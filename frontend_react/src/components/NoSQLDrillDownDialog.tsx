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
  NoSQLColeccion,
  NoSQLContenidoItem,
} from "@/services/api";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  ScrollText,
  User,
} from "lucide-react";

export type NoSQLDrillDownTarget = {
  coleccion: NoSQLColeccion;
  label: string;
  tipoFilter?: string;
};

interface NoSQLDrillDownDialogProps {
  target: NoSQLDrillDownTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ninosMap: Map<string, string>;
}

function resolveMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (import.meta.env.VITE_API_URL === "/api") {
    return `/${clean}`;
  }
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
  return `${base}/${clean}`;
}

function ninoLabel(ninoId: number | undefined, ninosMap: Map<string, string>): string {
  if (!ninoId) return "Niño desconocido";
  const byId = ninosMap.get(String(ninoId));
  if (byId) return byId;
  for (const [key, name] of ninosMap.entries()) {
    if (key.replace(/\D/g, "") === String(ninoId)) return name;
  }
  return `Niño #${ninoId}`;
}

export function NoSQLDrillDownDialog({
  target,
  open,
  onOpenChange,
  ninosMap,
}: NoSQLDrillDownDialogProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<NoSQLContenidoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !target) return;

    let cancelled = false;
    setLoading(true);
    setItems([]);

    DashboardService.getNoSQLContenido(target.coleccion, {
      limit: 50,
      tipo: target.tipoFilter,
    })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, target]);

  const renderEvidencia = (item: NoSQLContenidoItem) => {
    const fullUrl = resolveMediaUrl(item.url_archivo || "");
    return (
      <div
        key={item._id}
        className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          {item.tipo === "video" ? (
            <video src={fullUrl} className="w-full h-full object-cover" controls />
          ) : fullUrl ? (
            <img
              src={fullUrl}
              alt="Evidencia"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="capitalize">
              {item.tipo || "archivo"}
            </Badge>
            {item.entrega_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/entregas/${item.entrega_id}`);
                }}
              >
                Entrega #{item.entrega_id}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {ninoLabel(item.nino_id, ninosMap)}
            {item.subido_por ? ` · ${item.subido_por}` : ""}
          </p>
          {item.timestamp && (
            <p className="text-[10px] text-muted-foreground font-mono">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderFotoNino = (item: NoSQLContenidoItem) => {
    const fullUrl = resolveMediaUrl(item.foto_url || "");
    return (
      <div
        key={item._id}
        className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow text-center"
      >
        <div className="aspect-square bg-muted flex items-center justify-center p-4">
          {fullUrl ? (
            <img
              src={fullUrl}
              alt={ninoLabel(item.nino_id, ninosMap)}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <User className="h-12 w-12 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-3 border-t space-y-2">
          <p className="text-sm font-semibold truncate">{ninoLabel(item.nino_id, ninosMap)}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              if (!item.nino_id) return;
              onOpenChange(false);
              navigate(`/ninos/${item.nino_id}`);
            }}
          >
            Ver perfil
          </Button>
        </div>
      </div>
    );
  };

  const renderCarta = (item: NoSQLContenidoItem) => (
    <div key={item._id} className="rounded-lg border bg-card p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{ninoLabel(item.nino_id, ninosMap)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.remitente ? `Remitente: ${item.remitente}` : "Carta digitalizada"}
          {item.apadrinamiento_id ? ` · Apadrinamiento #${item.apadrinamiento_id}` : ""}
        </p>
        {item.timestamp && (
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            {new Date(item.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );

  const renderBitacora = (item: NoSQLContenidoItem) => (
    <div key={item._id} className="rounded-lg border bg-card p-3 flex items-center gap-3 text-sm">
      <ScrollText className="h-4 w-4 text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-muted-foreground">{item.tabla}</span>
        <Badge variant="outline" className="ml-2 text-[10px] uppercase">
          {item.accion}
        </Badge>
      </div>
      {item.timestamp && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="py-16 text-center text-muted-foreground">
          <p className="font-medium">Sin documentos en esta colección</p>
          <p className="text-xs mt-1 opacity-70">Los registros aparecerán aquí al crearse en MongoDB</p>
        </div>
      );
    }

    if (target?.coleccion === "evidencias") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(renderEvidencia)}
        </div>
      );
    }

    if (target?.coleccion === "ninos_fotos") {
      return (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(renderFotoNino)}
        </div>
      );
    }

    if (target?.coleccion === "cartas") {
      return <div className="space-y-3">{items.map(renderCarta)}</div>;
    }

    return <div className="space-y-2 max-h-[60vh] overflow-y-auto">{items.map(renderBitacora)}</div>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target?.label ?? "Detalle NoSQL"}</DialogTitle>
          <DialogDescription>
            {target?.tipoFilter
              ? `Filtrado por tipo «${target.tipoFilter}». Clic en una entrega para ver el detalle completo.`
              : "Explora el contenido almacenado en MongoDB. Haz clic en las tarjetas para ir al detalle."}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
