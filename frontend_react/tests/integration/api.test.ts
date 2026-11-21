import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NinosService, PuntosEntregaService } from "@/services/api";

/** Respuesta fetch mínima para simular al backend Django. */
function respuesta(body: unknown, init: { status?: number; statusText?: string } = {}) {
  const status = init.status ?? 200;
  const text = body === undefined ? "" : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: init.statusText ?? "",
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Capa de servicios (api.ts) contra un backend simulado", () => {
  it("normaliza la lista de niños del backend al modelo del frontend", async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta([
        {
          id: 12,
          nombre: "Pepito",
          edad: 8,
          genero: "Masculino",
          necesidades: ["útiles"],
          estado_apadrinamiento: "Disponible",
          id_padrino_actual: null,
        },
      ])
    );

    const ninos = await NinosService.getAll();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/ninos\/$/);
    expect(ninos).toEqual([
      expect.objectContaining({
        id_nino: "12",
        nombre: "Pepito",
        necesidades: ["útiles"],
        estado_apadrinamiento: "Disponible",
        id_padrino_actual: undefined,
      }),
    ]);
  });

  it("extrae .results de las respuestas paginadas de DRF", async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta({
        count: 1,
        next: null,
        previous: null,
        results: [
          { id: 3, nombre: "Ana", edad: 5, genero: "Femenino", estado_apadrinamiento: "Apadrinado", id_padrino_actual: 9 },
        ],
      })
    );
    const ninos = await NinosService.getAll();
    expect(ninos).toHaveLength(1);
    expect(ninos[0].id_padrino_actual).toBe("9");
  });

  it("devuelve [] si el backend responde algo que no es lista", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ detalle: "raro" }));
    expect(await NinosService.getAll()).toEqual([]);
  });

  it("propaga el mensaje de error { error } del backend", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ error: "No autorizado" }, { status: 401 }));
    await expect(NinosService.getAll()).rejects.toThrow("No autorizado");
  });

  it("compone un mensaje legible con errores de validación por campo", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ nombre: ["Este campo es requerido."] }, { status: 400 }));
    await expect(PuntosEntregaService.getAll()).rejects.toThrow("nombre: Este campo es requerido.");
  });

  it("usa un mensaje HTTP genérico si el cuerpo de error no es JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => {
        throw new Error("no json");
      },
    } as unknown as Response);
    await expect(NinosService.getAll()).rejects.toThrow("HTTP Error 500: Server Error");
  });

  it("envía POST con el cuerpo JSON y normaliza coordenadas numéricas", async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta({
        id: 5,
        nombre_punto: "DIF",
        direccion_fisica: "Av 1",
        latitud: "21.8853000",
        longitud: "-102.2915000",
        estado_punto: "Activo",
      })
    );

    const creado = await PuntosEntregaService.create({
      nombre_punto: "DIF",
      direccion_fisica: "Av 1",
      latitud: 21.8853,
      longitud: -102.2915,
      horario_atencion: "",
      contacto_referencia: "",
      estado_punto: "Activo",
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/puntos-entrega\/$/);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body).nombre_punto).toBe("DIF");
    expect(creado.id_punto_entrega).toBe("5");
    expect(creado.latitud).toBeCloseTo(21.8853);
    expect(typeof creado.longitud).toBe("number");
  });
});
