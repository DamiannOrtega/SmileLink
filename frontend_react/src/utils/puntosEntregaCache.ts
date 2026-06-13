import { PuntoEntrega } from "@/services/api";

const INACTIVE_PUNTOS_CACHE_KEY = "smilelink_puntos_inactivos";

export function rememberInactivePunto(punto: PuntoEntrega) {
  if (typeof window === "undefined") return;

  const cached = readInactivePuntosCache().filter(
    (item) => item.id_punto_entrega !== punto.id_punto_entrega
  );

  if (punto.estado_punto === "Inactivo") {
    cached.unshift(punto);
    sessionStorage.setItem(INACTIVE_PUNTOS_CACHE_KEY, JSON.stringify(cached));
    return;
  }

  sessionStorage.setItem(INACTIVE_PUNTOS_CACHE_KEY, JSON.stringify(cached));
}

export function readInactivePuntosCache(): PuntoEntrega[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(INACTIVE_PUNTOS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mergePuntosEntrega(
  fromApi: PuntoEntrega[],
  cachedInactive: PuntoEntrega[]
): PuntoEntrega[] {
  const merged = new Map<string, PuntoEntrega>();

  for (const punto of fromApi) {
    merged.set(punto.id_punto_entrega, punto);
  }

  for (const punto of cachedInactive) {
    if (!merged.has(punto.id_punto_entrega)) {
      merged.set(punto.id_punto_entrega, punto);
    }
  }

  return [...merged.values()];
}
