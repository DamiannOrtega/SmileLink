import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ApadrinamientosService,
  EntregasService,
  SolicitudesService,
} from "@/services/api";

interface Notification {
  id: string;
  tipo: "success" | "warning" | "info" | "error";
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
}

interface NotificationCenterProps {
  maxNotifications?: number;
}

export function NotificationCenter({ maxNotifications = 5 }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const config = JSON.parse(localStorage.getItem("appConfig") || "{}");
      const nuevasNotificaciones: Notification[] = [];

      // Verificar entregas pendientes
      if (config.notifEntregas !== false) {
        const entregas = await EntregasService.getAll().catch(() => []);
        const pendientes = entregas.filter(
          (e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso"
        );

        if (pendientes.length > 0) {
          nuevasNotificaciones.push({
            id: "entregas-pendientes",
            tipo: "warning",
            titulo: "Entregas Pendientes",
            mensaje: `${pendientes.length} entrega(s) pendiente(s) de verificación`,
            fecha: new Date(),
            leida: false,
          });
        }
      }

      // Verificar solicitudes abiertas
      if (config.notifCartas !== false) {
        const solicitudes = await SolicitudesService.getAll().catch(() => []);
        const abiertas = solicitudes.filter((s) => s.estado_solicitud === "Abierta");

        if (abiertas.length > 0) {
          nuevasNotificaciones.push({
            id: "solicitudes-abiertas",
            tipo: "info",
            titulo: "Solicitudes Abiertas",
            mensaje: `${abiertas.length} solicitud(es) de regalos abierta(s)`,
            fecha: new Date(),
            leida: false,
          });
        }
      }

      // Verificar nuevos apadrinamientos recientes
      if (config.notifNuevos !== false) {
        const apadrinamientos = await ApadrinamientosService.getAll().catch(() => []);
        const recientes = apadrinamientos.filter((a) => {
          const fechaInicio = new Date(a.fecha_inicio);
          const ahora = new Date();
          const horasDiferencia = (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
          return horasDiferencia < 24 && a.estado_apadrinamiento_registro === "Activo";
        });

        if (recientes.length > 0) {
          nuevasNotificaciones.push({
            id: "nuevos-apadrinamientos",
            tipo: "success",
            titulo: "Nuevos Apadrinamientos",
            mensaje: `${recientes.length} nuevo(s) apadrinamiento(s) en las últimas 24 horas`,
            fecha: new Date(),
            leida: false,
          });
        }
      }

      // Cargar notificaciones guardadas
      const saved = localStorage.getItem("notifications");
      if (saved) {
        try {
          const savedNotifications = JSON.parse(saved) as Notification[];
          // Combinar con nuevas, evitando duplicados
          const allNotifications = [...nuevasNotificaciones, ...savedNotifications]
            .filter((n, index, self) => 
              index === self.findIndex((t) => t.id === n.id)
            )
            .slice(0, maxNotifications);
          setNotifications(allNotifications);
        } catch (e) {
          setNotifications(nuevasNotificaciones);
        }
      } else {
        setNotifications(nuevasNotificaciones);
      }

      const unread = nuevasNotificaciones.filter((n) => !n.leida).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Recargar cada 60 segundos
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      );
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getIcon = (tipo: Notification["tipo"]) => {
    switch (tipo) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "info":
        return <Info className="h-5 w-5 text-info" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 z-50 w-80 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay notificaciones
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.leida ? "bg-muted/30" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {getIcon(notification.tipo)}
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {notification.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.mensaje}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.fecha.toLocaleTimeString()}
                            </p>
                          </div>
                          {!notification.leida && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

