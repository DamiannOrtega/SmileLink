import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  ShieldCheck,
  Globe,
  Lock,
} from "lucide-react";
import { DiagnosticsService, DiagnosticResult } from "@/services/api";

interface DiagnosticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiagnosticsModal({ open, onOpenChange }: DiagnosticsModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [dicebearStatus, setDicebearStatus] = useState<"Operational" | "Error" | "Checking" | null>(null);
  const [dicebearLatency, setDicebearLatency] = useState(0);

  const runDiagnostics = async () => {
    setLoading(true);
    setDicebearStatus("Checking");
    const startTime = Date.now();

    // 1. Check DiceBear API locally from the browser
    let dbStatus: "Operational" | "Error" = "Error";
    try {
      const response = await fetch("https://api.dicebear.com/7.x/fun-emoji/svg?seed=test", {
        method: "HEAD",
        mode: "no-cors", // Dicebear might not have CORS for direct HEAD requests in some environments, but no-cors works for checking availability
      });
      dbStatus = "Operational";
    } catch (e) {
      dbStatus = "Error";
    }
    setDicebearStatus(dbStatus);
    setDicebearLatency(Date.now() - startTime);

    // 2. Check Backend + DBs
    try {
      const serverResult = await DiagnosticsService.check();
      setResults(serverResult);
    } catch (e) {
      console.error("Error during server diagnostics:", e);
      setResults({
        mysql: { status: "Error", details: "No se pudo comunicar con el servidor API.", latency_ms: 0 },
        mongodb: { status: "Error", details: "No se pudo comunicar con el servidor API.", latency_ms: 0 },
        encryption: { status: "Error", details: "No se pudo comunicar con el servidor API." },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      runDiagnostics();
    }
  }, [open]);

  const getStatusBadge = (status: "Operational" | "Error" | "Checking" | null) => {
    if (status === "Checking") {
      return (
        <Badge variant="outline" className="animate-pulse flex gap-1 items-center bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Loader2 className="h-3 w-3 animate-spin" /> Verificando
        </Badge>
      );
    }
    if (status === "Operational") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 flex gap-1 items-center">
          <CheckCircle2 className="h-3 w-3" /> Operacional
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex gap-1 items-center">
        <XCircle className="h-3 w-3" /> Fallo
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Diagnóstico de Base de Datos y Rutas
          </DialogTitle>
          <DialogDescription>
            Verificación en tiempo real del estado de los servicios distribuidos y el backend de SmileLink.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 1. MySQL Relational Check */}
          <div className="flex flex-col p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">Base de Datos Relacional (MySQL)</span>
              </div>
              {getStatusBadge(loading ? "Checking" : results?.mysql.status || null)}
            </div>
            {results?.mysql && (
              <div className="text-xs text-muted-foreground pl-6">
                <p>{results.mysql.details}</p>
                {results.mysql.status === "Operational" && (
                  <p className="mt-1 font-mono text-[10px] text-primary">Latencia: {results.mysql.latency_ms}ms</p>
                )}
              </div>
            )}
          </div>

          {/* 2. MongoDB NoSQL Check */}
          <div className="flex flex-col p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">Almacenamiento NoSQL Distribuido (MongoDB)</span>
              </div>
              {getStatusBadge(loading ? "Checking" : results?.mongodb.status || null)}
            </div>
            {results?.mongodb && (
              <div className="text-xs text-muted-foreground pl-6">
                <p>{results.mongodb.details}</p>
                {results.mongodb.status === "Operational" && (
                  <p className="mt-1 font-mono text-[10px] text-primary">Latencia: {results.mongodb.latency_ms}ms</p>
                )}
              </div>
            )}
          </div>

          {/* 3. Fernet Encryption Check */}
          <div className="flex flex-col p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Módulo de Seguridad y Cifrado (Fernet)</span>
              </div>
              {getStatusBadge(loading ? "Checking" : results?.encryption.status || null)}
            </div>
            {results?.encryption && (
              <div className="text-xs text-muted-foreground pl-6">
                <p>{results.encryption.details}</p>
              </div>
            )}
          </div>

          {/* 4. DiceBear Avatar API Check */}
          <div className="flex flex-col p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold">API de Avatares (DiceBear SVG)</span>
              </div>
              {getStatusBadge(dicebearStatus)}
            </div>
            {dicebearStatus && (
              <div className="text-xs text-muted-foreground pl-6">
                <p>
                  {dicebearStatus === "Operational"
                    ? "El navegador de internet puede conectarse correctamente con api.dicebear.com."
                    : "No se pudo establecer conexión con api.dicebear.com. Los avatares por defecto pueden no cargar."}
                </p>
                {dicebearStatus === "Operational" && (
                  <p className="mt-1 font-mono text-[10px] text-primary">Latencia: {dicebearLatency}ms</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <p className="text-[10px] text-muted-foreground">
            Estado de BD Activa: <span className="text-primary font-semibold">MySQL + MongoDB (Dual Store)</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button size="sm" onClick={runDiagnostics} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Reintentar"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
