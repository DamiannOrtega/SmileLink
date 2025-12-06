import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ApadrinamientosService,
  EntregasService,
  SolicitudesService,
  Apadrinamiento,
  Entrega,
  SolicitudRegalo,
} from "@/services/api";

interface NotificationConfig {
  notifNuevos: boolean;
  notifEntregas: boolean;
  notifCartas: boolean;
}

interface NotificationState {
  lastApadrinamientos: Set<string>;
  lastEntregas: Set<string>;
  lastSolicitudes: Set<string>;
}

/**
 * Hook para manejar notificaciones del sistema
 * Detecta cambios y muestra notificaciones según la configuración
 */
export function useNotifications(enabled: boolean = true) {
  const stateRef = useRef<NotificationState>({
    lastApadrinamientos: new Set(),
    lastEntregas: new Set(),
    lastSolicitudes: new Set(),
  });

  const configRef = useRef<NotificationConfig>({
    notifNuevos: true,
    notifEntregas: true,
    notifCartas: true,
  });

  // Cargar configuración de notificaciones
  useEffect(() => {
    const saved = localStorage.getItem("appConfig");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        configRef.current = {
          notifNuevos: parsed.notifNuevos ?? true,
          notifEntregas: parsed.notifEntregas ?? true,
          notifCartas: parsed.notifCartas ?? true,
        };
      } catch (e) {
        console.error("Error al cargar configuración de notificaciones:", e);
      }
    }
  }, []);

  // Inicializar estado con datos actuales
  useEffect(() => {
    if (!enabled) return;

    const initializeState = async () => {
      try {
        // Cargar datos actuales para establecer baseline
        const [apadrinamientos, entregas, solicitudes] = await Promise.all([
          ApadrinamientosService.getAll().catch(() => []),
          EntregasService.getAll().catch(() => []),
          SolicitudesService.getAll().catch(() => []),
        ]);

        stateRef.current.lastApadrinamientos = new Set(
          apadrinamientos.map((a) => a.id_apadrinamiento)
        );
        stateRef.current.lastEntregas = new Set(
          entregas.map((e) => e.id_entrega)
        );
        stateRef.current.lastSolicitudes = new Set(
          solicitudes.map((s) => s.id_solicitud)
        );
      } catch (error) {
        console.error("Error inicializando estado de notificaciones:", error);
      }
    };

    initializeState();
  }, [enabled]);

  // Verificar cambios periódicamente
  useEffect(() => {
    if (!enabled) return;

    const checkForChanges = async () => {
      try {
        const config = configRef.current;
        const state = stateRef.current;

        // Verificar nuevos apadrinamientos
        if (config.notifNuevos) {
          const apadrinamientos = await ApadrinamientosService.getAll().catch(() => []);
          const nuevos = apadrinamientos.filter(
            (a) => !state.lastApadrinamientos.has(a.id_apadrinamiento)
          );

          nuevos.forEach((apadrinamiento) => {
            // Solo notificar si es muy reciente (últimas 24 horas)
            const fechaInicio = new Date(apadrinamiento.fecha_inicio);
            const ahora = new Date();
            const horasDiferencia = (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

            if (horasDiferencia < 24) {
              toast.success("Nuevo Apadrinamiento", {
                description: `Se ha registrado un nuevo apadrinamiento (${apadrinamiento.id_apadrinamiento})`,
                duration: 5000,
              });
            }
          });

          state.lastApadrinamientos = new Set(
            apadrinamientos.map((a) => a.id_apadrinamiento)
          );
        }

        // Verificar entregas pendientes
        if (config.notifEntregas) {
          const entregas = await EntregasService.getAll().catch(() => []);
          const pendientes = entregas.filter(
            (e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso"
          );

          const nuevasPendientes = pendientes.filter(
            (e) => !state.lastEntregas.has(e.id_entrega)
          );

          nuevasPendientes.forEach((entrega) => {
            toast.warning("Nueva Entrega Pendiente", {
              description: `Entrega pendiente: ${entrega.descripcion_regalo}`,
              duration: 5000,
            });
          });

          // Notificar si hay muchas entregas pendientes
          if (pendientes.length > 0 && pendientes.length % 5 === 0) {
            toast.info("Entregas Pendientes", {
              description: `Hay ${pendientes.length} entregas pendientes de verificación`,
              duration: 4000,
            });
          }

          state.lastEntregas = new Set(entregas.map((e) => e.id_entrega));
        }

        // Verificar nuevas solicitudes
        if (config.notifCartas) {
          const solicitudes = await SolicitudesService.getAll().catch(() => []);
          const abiertas = solicitudes.filter((s) => s.estado_solicitud === "Abierta");

          const nuevasAbiertas = abiertas.filter(
            (s) => !state.lastSolicitudes.has(s.id_solicitud)
          );

          nuevasAbiertas.forEach((solicitud) => {
            toast.info("Nueva Solicitud Abierta", {
              description: `Nueva solicitud: ${solicitud.descripcion_solicitud}`,
              duration: 5000,
            });
          });

          state.lastSolicitudes = new Set(solicitudes.map((s) => s.id_solicitud));
        }
      } catch (error) {
        console.error("Error verificando notificaciones:", error);
      }
    };

    // Verificar inmediatamente
    checkForChanges();

    // Verificar cada 30 segundos
    const interval = setInterval(checkForChanges, 30000);

    return () => clearInterval(interval);
  }, [enabled]);
}

/**
 * Hook para mostrar notificaciones inmediatas basadas en eventos
 */
export function useNotificationEvents() {
  const showNotification = (
    type: "success" | "warning" | "info" | "error",
    title: string,
    description: string
  ) => {
    // Verificar configuración antes de mostrar
    const saved = localStorage.getItem("appConfig");
    let shouldShow = true;

    if (saved) {
      try {
        const config = JSON.parse(saved);
        
        if (title.includes("Apadrinamiento") && !config.notifNuevos) {
          shouldShow = false;
        }
        if (title.includes("Entrega") && !config.notifEntregas) {
          shouldShow = false;
        }
        if (title.includes("Solicitud") && !config.notifCartas) {
          shouldShow = false;
        }
      } catch (e) {
        // Si hay error, mostrar la notificación de todas formas
      }
    }

    if (!shouldShow) return;

    switch (type) {
      case "success":
        toast.success(title, { description, duration: 5000 });
        break;
      case "warning":
        toast.warning(title, { description, duration: 5000 });
        break;
      case "info":
        toast.info(title, { description, duration: 5000 });
        break;
      case "error":
        toast.error(title, { description, duration: 5000 });
        break;
    }
  };

  return { showNotification };
}

