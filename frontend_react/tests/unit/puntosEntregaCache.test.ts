import { describe, it, expect } from "vitest";
import {
  mergePuntosEntrega,
  readInactivePuntosCache,
  rememberInactivePunto,
} from "@/utils/puntosEntregaCache";
import type { PuntoEntrega } from "@/services/api";

const punto = (id: string, estado: "Activo" | "Inactivo" = "Activo"): PuntoEntrega => ({
  id_punto_entrega: id,
  nombre_punto: `Punto ${id}`,
  direccion_fisica: "Calle 1",
  latitud: 21.88,
  longitud: -102.29,
  horario_atencion: "9-17",
  contacto_referencia: "Ana",
  estado_punto: estado,
});

describe("puntosEntregaCache", () => {
  it("guarda en caché los puntos inactivos", () => {
    rememberInactivePunto(punto("1", "Inactivo"));
    expect(readInactivePuntosCache().map((p) => p.id_punto_entrega)).toEqual(["1"]);
  });

  it("no guarda puntos activos y elimina uno que se reactivó", () => {
    rememberInactivePunto(punto("1", "Inactivo"));
    rememberInactivePunto(punto("1", "Activo"));
    expect(readInactivePuntosCache()).toEqual([]);
  });

  it("no duplica un punto inactivo repetido", () => {
    rememberInactivePunto(punto("1", "Inactivo"));
    rememberInactivePunto(punto("1", "Inactivo"));
    expect(readInactivePuntosCache()).toHaveLength(1);
  });

  it("devuelve [] si el contenido guardado está corrupto o no es un arreglo", () => {
    sessionStorage.setItem("smilelink_puntos_inactivos", "{no es json");
    expect(readInactivePuntosCache()).toEqual([]);
    sessionStorage.setItem("smilelink_puntos_inactivos", JSON.stringify({ a: 1 }));
    expect(readInactivePuntosCache()).toEqual([]);
  });

  it("mergePuntosEntrega prioriza los datos de la API sobre la caché", () => {
    const api = [punto("1", "Activo")];
    const cache = [punto("1", "Inactivo"), punto("2", "Inactivo")];
    const merged = mergePuntosEntrega(api, cache);
    expect(merged).toHaveLength(2);
    expect(merged.find((p) => p.id_punto_entrega === "1")?.estado_punto).toBe("Activo");
    expect(merged.find((p) => p.id_punto_entrega === "2")).toBeDefined();
  });
});
