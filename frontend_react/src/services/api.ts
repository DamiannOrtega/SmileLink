/**
 * SmileLink API Service Layer
 * 
 * Arquitectura Dual Mode:
 * - VITE_USE_MOCK=true: Retorna datos simulados con delay de red
 * - VITE_USE_MOCK=false: Ejecuta peticiones HTTP reales al Backend Django
 * 
 * IMPORTANTE: Los nombres de campos respetan estrictamente data_models.md
 */

// ============================================================================
// INTERFACES TYPESCRIPT (Basadas en data_models.md)
// ============================================================================

export interface Padrino {
  id_padrino: string;
  nombre: string;
  email: string;
  password_hash?: string;
  fecha_registro: string; // YYYY-MM-DD
  id_google_auth?: string;
  direccion: string;
  telefono: string;
  historial_apadrinamiento_ids: string[]; // FKs to Apadrinamiento
}

export interface Nino {
  id_nino: string;
  nombre: string;
  edad: number;
  genero: "Masculino" | "Femenino";
  descripcion: string;
  necesidades: string[]; // Lista de necesidades
  id_padrino_actual?: string; // FK to Padrino (Nullable)
  estado_apadrinamiento: "Disponible" | "Apadrinado";
  fecha_apadrinamiento_actual?: string; // Date (Nullable)
  foto?: string; // URL de la foto/avatar almacenada en MongoDB
}

export interface Apadrinamiento {
  id_apadrinamiento: string;
  id_padrino: string; // FK to Padrino
  id_nino: string; // FK to Nino
  id_evento?: string; // FK to Evento (Nullable)
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin?: string; // Date (Nullable)
  tipo_apadrinamiento: "Aleatorio" | "Elección Padrino";
  estado_apadrinamiento_registro: "Activo" | "Finalizado";
  entregas_ids: string[]; // FKs to Entrega
}

export interface Entrega {
  id_entrega: string;
  id_apadrinamiento: string; // FK to Apadrinamiento
  descripcion_regalo: string;
  fecha_programada: string; // YYYY-MM-DD
  fecha_entrega_real?: string; // Date (Nullable)
  estado_entrega: "Pendiente" | "En Proceso" | "Entregado";
  observaciones: string;
  id_punto_entrega: string; // FK to PuntoEntrega
  evidencia_foto_path?: string; // Path to encrypted image
  mongo_evidencia_id?: string; // MongoDB evidence ID
  evidencias_nosql?: Array<{
    _id: string;
    tipo: string;
    url_archivo: string;
    timestamp: string;
    subido_por: string;
  }>;
}

export interface SolicitudRegalo {
  id_solicitud: string;
  id_nino: string; // FK to Nino
  id_padrino_interesado?: string; // FK to Padrino (Nullable)
  descripcion_solicitud: string;
  fecha_solicitud: string; // YYYY-MM-DD
  fecha_cierre?: string; // Date (Nullable)
  estado_solicitud: "Abierta" | "En Proceso" | "Cumplida";
  id_entrega_asociada?: string; // FK to Entrega (Nullable)
}

export interface PuntoEntrega {
  id_punto_entrega: string;
  nombre_punto: string;
  direccion_fisica: string;
  latitud: number;
  longitud: number;
  horario_atencion: string;
  contacto_referencia: string;
  estado_punto: "Activo" | "Inactivo";
}

export interface Administrador {
  id_admin: string;
  nombre: string;
  email: string;
  password_hash: string;
  fecha_registro: string; // YYYY-MM-DD
  rol: "Gestor" | "Superadmin";
}

export interface Evento {
  id_evento: string;
  nombre_evento: string;
  tipo_evento: "Navidad" | "Día del Niño" | "Otro";
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  estado_evento: "Planeado" | "Activo" | "Cerrado";
  descripcion?: string;
}

// ============================================================================
// DATOS MOCK (Relacionalmente Coherentes)
// ============================================================================

const MOCK_PADRINOS: Padrino[] = [
  {
    id_padrino: "P001",
    nombre: "Juan Damián Ortega",
    email: "juan@smilelink.org",
    password_hash: "sha256_hash_example_1",
    fecha_registro: "2025-10-20",
    id_google_auth: "google_12345",
    direccion: "Av. Universidad 100, Aguascalientes",
    telefono: "449-123-4567",
    historial_apadrinamiento_ids: ["AP001", "AP005"],
  },
  {
    id_padrino: "P002",
    nombre: "María González López",
    email: "maria.gonzalez@email.com",
    fecha_registro: "2025-09-15",
    direccion: "Calle Principal 456, Aguascalientes",
    telefono: "449-234-5678",
    historial_apadrinamiento_ids: ["AP002"],
  },
  {
    id_padrino: "P003",
    nombre: "Roberto Sánchez García",
    email: "roberto.sanchez@email.com",
    fecha_registro: "2024-11-10",
    id_google_auth: "google_67890",
    direccion: "Blvd. Norte 789, Aguascalientes",
    telefono: "449-345-6789",
    historial_apadrinamiento_ids: ["AP003"],
  },
];

const MOCK_NINOS: Nino[] = [
  {
    id_nino: "N001",
    nombre: "Sofía Martínez",
    edad: 8,
    genero: "Femenino",
    descripcion: "Le gusta dibujar y los gatos.",
    necesidades: ["Mochila", "Zapatos escolares"],
    id_padrino_actual: "P001",
    estado_apadrinamiento: "Apadrinado",
    fecha_apadrinamiento_actual: "2025-11-01",
    foto: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sof%C3%ADa%20Mart%C3%ADnez&size=128",
  },
  {
    id_nino: "N002",
    nombre: "Carlos Ramírez",
    edad: 10,
    genero: "Masculino",
    descripcion: "Apasionado por el fútbol y las ciencias.",
    necesidades: ["Balón de fútbol", "Libros de ciencia"],
    id_padrino_actual: "P002",
    estado_apadrinamiento: "Apadrinado",
    fecha_apadrinamiento_actual: "2025-10-15",
    foto: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos%20Ram%C3%ADrez&size=128",
  },
  {
    id_nino: "N003",
    nombre: "Ana Patricia López",
    edad: 7,
    genero: "Femenino",
    descripcion: "Le encanta bailar y la música.",
    necesidades: ["Zapatos de ballet", "Vestido"],
    estado_apadrinamiento: "Disponible",
    foto: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Ana%20Patricia%20L%C3%B3pez&size=128",
  },
  {
    id_nino: "N004",
    nombre: "Miguel Ángel Torres",
    edad: 9,
    genero: "Masculino",
    descripcion: "Interesado en robótica y videojuegos.",
    necesidades: ["Kit de robótica básico", "Mochila"],
    id_padrino_actual: "P003",
    estado_apadrinamiento: "Apadrinado",
    fecha_apadrinamiento_actual: "2025-11-10",
    foto: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Miguel%20%C3%81ngel%20Torres&size=128",
  },
];

const MOCK_APADRINAMIENTOS: Apadrinamiento[] = [
  {
    id_apadrinamiento: "AP001",
    id_padrino: "P001",
    id_nino: "N001",
    fecha_inicio: "2025-11-01",
    tipo_apadrinamiento: "Elección Padrino",
    estado_apadrinamiento_registro: "Activo",
    entregas_ids: ["E001", "E002"],
  },
  {
    id_apadrinamiento: "AP002",
    id_padrino: "P002",
    id_nino: "N002",
    fecha_inicio: "2025-10-15",
    tipo_apadrinamiento: "Aleatorio",
    estado_apadrinamiento_registro: "Activo",
    entregas_ids: ["E003"],
  },
  {
    id_apadrinamiento: "AP003",
    id_padrino: "P003",
    id_nino: "N004",
    fecha_inicio: "2025-11-10",
    tipo_apadrinamiento: "Elección Padrino",
    estado_apadrinamiento_registro: "Activo",
    entregas_ids: [],
  },
  {
    id_apadrinamiento: "AP005",
    id_padrino: "P001",
    id_nino: "N002",
    fecha_inicio: "2024-12-01",
    fecha_fin: "2025-09-30",
    tipo_apadrinamiento: "Aleatorio",
    estado_apadrinamiento_registro: "Finalizado",
    entregas_ids: ["E004"],
  },
];

const MOCK_PUNTOS_ENTREGA: PuntoEntrega[] = [
  {
    id_punto_entrega: "PE001",
    nombre_punto: "Centro de Acopio Norte",
    direccion_fisica: "Calle Norte 45, Centro, Aguascalientes",
    latitud: 21.8853,
    longitud: -102.2916,
    horario_atencion: "Lun-Vie 9:00-17:00",
    contacto_referencia: "Sra. Martha",
    estado_punto: "Activo",
  },
  {
    id_punto_entrega: "PE002",
    nombre_punto: "Centro de Acopio Sur",
    direccion_fisica: "Av. Sur 123, Aguascalientes",
    latitud: 21.8700,
    longitud: -102.2900,
    horario_atencion: "Lun-Sab 10:00-18:00",
    contacto_referencia: "Sr. José",
    estado_punto: "Activo",
  },
  {
    id_punto_entrega: "PE003",
    nombre_punto: "Centro de Acopio Este",
    direccion_fisica: "Blvd. Este 789, Aguascalientes",
    latitud: 21.8900,
    longitud: -102.2800,
    horario_atencion: "Lun-Vie 8:00-16:00",
    contacto_referencia: "Sra. Laura",
    estado_punto: "Inactivo",
  },
];

const MOCK_ENTREGAS: Entrega[] = [
  {
    id_entrega: "E001",
    id_apadrinamiento: "AP001",
    descripcion_regalo: "Bicicleta roja",
    fecha_programada: "2025-12-24",
    fecha_entrega_real: "2025-12-23",
    estado_entrega: "Entregado",
    observaciones: "Entregado a la madre del niño",
    id_punto_entrega: "PE001",
    evidencia_foto_path: "/uploads/E001_proof.jpg.enc",
  },
  {
    id_entrega: "E002",
    id_apadrinamiento: "AP001",
    descripcion_regalo: "Mochila escolar con útiles",
    fecha_programada: "2025-08-15",
    estado_entrega: "Pendiente",
    observaciones: "Programado para inicio de ciclo escolar",
    id_punto_entrega: "PE001",
  },
  {
    id_entrega: "E003",
    id_apadrinamiento: "AP002",
    descripcion_regalo: "Balón de fútbol profesional",
    fecha_programada: "2025-12-20",
    estado_entrega: "En Proceso",
    observaciones: "Regalo en tránsito",
    id_punto_entrega: "PE002",
  },
  {
    id_entrega: "E004",
    id_apadrinamiento: "AP005",
    descripcion_regalo: "Set de libros educativos",
    fecha_programada: "2025-04-30",
    fecha_entrega_real: "2025-04-28",
    estado_entrega: "Entregado",
    observaciones: "Entrega exitosa",
    id_punto_entrega: "PE001",
    evidencia_foto_path: "/uploads/E004_proof.jpg.enc",
  },
];

const MOCK_SOLICITUDES: SolicitudRegalo[] = [
  {
    id_solicitud: "SR001",
    id_nino: "N001",
    id_padrino_interesado: "P001",
    descripcion_solicitud: "Zapatos talla 22",
    fecha_solicitud: "2025-11-15",
    estado_solicitud: "Cumplida",
    id_entrega_asociada: "E001",
    fecha_cierre: "2025-12-23",
  },
  {
    id_solicitud: "SR002",
    id_nino: "N003",
    descripcion_solicitud: "Zapatos de ballet talla 20",
    fecha_solicitud: "2025-11-18",
    estado_solicitud: "Abierta",
  },
  {
    id_solicitud: "SR003",
    id_nino: "N002",
    id_padrino_interesado: "P002",
    descripcion_solicitud: "Libros de ciencia para niños",
    fecha_solicitud: "2025-11-10",
    estado_solicitud: "En Proceso",
  },
];

const MOCK_ADMINISTRADORES: Administrador[] = [
  {
    id_admin: "A001",
    nombre: "Admin Principal",
    email: "admin@smilelink.org",
    password_hash: "sha256_hash_admin_1",
    fecha_registro: "2025-01-01",
    rol: "Superadmin",
  },
  {
    id_admin: "A002",
    nombre: "Gestor Regional",
    email: "gestor@smilelink.org",
    password_hash: "sha256_hash_admin_2",
    fecha_registro: "2025-02-15",
    rol: "Gestor",
  },
];

const MOCK_EVENTOS: Evento[] = [
  {
    id_evento: "EV001",
    nombre_evento: "Navidad 2025",
    tipo_evento: "Navidad",
    fecha_inicio: "2025-11-01",
    fecha_fin: "2025-12-25",
    estado_evento: "Activo",
    descripcion: "Campaña navideña anual de apadrinamiento",
  },
  {
    id_evento: "EV002",
    nombre_evento: "Día del Niño 2026",
    tipo_evento: "Día del Niño",
    fecha_inicio: "2026-03-01",
    fecha_fin: "2026-04-30",
    estado_evento: "Planeado",
    descripcion: "Celebración del Día del Niño",
  },
];

// ============================================================================
// UTILIDADES
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Simula latencia de red (500ms)
 */
const delay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wrapper genérico para peticiones HTTP
 * Maneja automáticamente las respuestas paginadas de Django REST Framework
 * (que retornan {count, next, previous, results:[...]})
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errBody = await response.json();
      if (typeof errBody?.error === "string") {
        message = errBody.error;
      } else if (errBody && typeof errBody === "object") {
        message = Object.entries(errBody)
          .map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
          })
          .join("; ");
      }
    } catch {
      // Mantener mensaje HTTP genérico
    }
    throw new Error(message);
  }

  const data = await response.json();

  // Django REST Framework retorna respuestas paginadas: {count, next, previous, results:[...]}
  // El frontend espera arrays directos, así que extraemos .results si existe
  if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
    return data.results as T;
  }

  return data as T;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}


// ============================================================================
// NORMALIZADORES — Mapean campos del nuevo Django API al formato del frontend
// Django retorna: id, id_padrino_actual_id, etc.
// Frontend espera: id_padrino, id_nino, historial_apadrinamiento_ids, etc.
// ============================================================================

const normNino = (n: any): Nino => ({
  id_nino: String(n.id),
  nombre: n.nombre || '',
  edad: n.edad ?? 0,
  genero: n.genero,
  descripcion: n.descripcion || '',
  necesidades: Array.isArray(n.necesidades) ? n.necesidades : [],
  id_padrino_actual: n.id_padrino_actual != null ? String(n.id_padrino_actual) : undefined,
  estado_apadrinamiento: n.estado_apadrinamiento,
  fecha_apadrinamiento_actual: n.fecha_apadrinamiento_actual ?? undefined,
  foto: n.foto || undefined,
});

const normPadrino = (p: any): Padrino => ({
  id_padrino: String(p.id),
  nombre: p.nombre || '',
  email: p.email,
  telefono: p.telefono || '',
  direccion: p.direccion || '',
  fecha_registro: p.fecha_registro || '',
  id_google_auth: p.id_google_auth ?? undefined,
  historial_apadrinamiento_ids: [], // Se obtiene por separado si se necesita
});

const normApadrinamiento = (a: any): Apadrinamiento => ({
  id_apadrinamiento: String(a.id),
  id_padrino: String(a.id_padrino ?? a.id_padrino_id ?? ""),
  id_nino: String(a.id_nino ?? a.id_nino_id ?? ""),
  id_evento: a.id_evento != null ? String(a.id_evento) : undefined,
  fecha_inicio: a.fecha_inicio,
  fecha_fin: a.fecha_fin ?? undefined,
  tipo_apadrinamiento: a.tipo_apadrinamiento,
  estado_apadrinamiento_registro: a.estado_apadrinamiento_registro,
  entregas_ids: [],
});

const normEntrega = (e: any): Entrega => ({
  id_entrega: String(e.id),
  id_apadrinamiento: String(e.id_apadrinamiento),
  descripcion_regalo: e.descripcion_regalo || '',
  fecha_programada: e.fecha_programada,
  fecha_entrega_real: e.fecha_entrega_real ?? undefined,
  estado_entrega: e.estado_entrega,
  observaciones: e.observaciones || '',
  id_punto_entrega: String(e.id_punto_entrega),
  evidencia_foto_path: undefined,
  mongo_evidencia_id: e.mongo_evidencia_id,
  evidencias_nosql: Array.isArray(e.evidencias_nosql) ? e.evidencias_nosql : [],
});

const normSolicitud = (s: any): SolicitudRegalo => ({
  id_solicitud: String(s.id),
  id_nino: String(s.id_nino),
  id_padrino_interesado: s.id_padrino_interesado != null ? String(s.id_padrino_interesado) : undefined,
  descripcion_solicitud: s.descripcion_solicitud || '',
  fecha_solicitud: s.fecha_solicitud,
  fecha_cierre: s.fecha_cierre ?? undefined,
  estado_solicitud: s.estado_solicitud,
  id_entrega_asociada: s.id_entrega_asociada != null ? String(s.id_entrega_asociada) : undefined,
});

const normPuntoEntrega = (p: any): PuntoEntrega => ({
  id_punto_entrega: String(p.id),
  nombre_punto: p.nombre_punto,
  direccion_fisica: p.direccion_fisica,
  latitud: Number(p.latitud),
  longitud: Number(p.longitud),
  horario_atencion: p.horario_atencion || '',
  contacto_referencia: p.contacto_referencia || '',
  estado_punto: p.estado_punto,
});

const normEvento = (e: any): Evento => ({
  id_evento: String(e.id),
  nombre_evento: e.nombre_evento,
  tipo_evento: e.tipo_evento,
  fecha_inicio: e.fecha_inicio,
  fecha_fin: e.fecha_fin,
  estado_evento: e.estado_evento,
  descripcion: e.descripcion ?? undefined,
});

const normAdministrador = (a: any): Administrador => ({
  id_admin: String(a.id),
  nombre: a.nombre,
  email: a.email,
  password_hash: '',
  fecha_registro: a.created_at ? a.created_at.split('T')[0] : '',
  rol: a.rol,
});

// ============================================================================
// SERVICIOS POR ENTIDAD
// ============================================================================

// ----------------------------------------------------------------------------
// NIÑOS SERVICE
// ----------------------------------------------------------------------------
export const NinosService = {
  async getAll(): Promise<Nino[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_NINOS];
    }
    const raw = await fetchAPI<any[]>("/ninos/");
    return ensureArray<any>(raw).map(normNino);
  },

  async getById(id: string): Promise<Nino | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_NINOS.find((n) => n.id_nino === id) || null;
    }
    const raw = await fetchAPI<any>(`/ninos/${id}/`);
    return normNino(raw);
  },

  async create(data: Omit<Nino, "id_nino">): Promise<Nino> {
    if (USE_MOCK) {
      await delay();
      const newNino: Nino = {
        id_nino: `N${String(MOCK_NINOS.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_NINOS.push(newNino);
      return newNino;
    }
    const raw = await fetchAPI<any>("/ninos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await fetchAPI<any>(`/ninos/${raw.id}/`);
    return normNino(created);
  },

  async update(id: string, data: Partial<Nino>): Promise<Nino> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_NINOS.findIndex((n) => n.id_nino === id);
      if (index === -1) throw new Error("Niño no encontrado");
      MOCK_NINOS[index] = { ...MOCK_NINOS[index], ...data };
      return MOCK_NINOS[index];
    }
    const raw = await fetchAPI<any>(`/ninos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return normNino(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_NINOS.findIndex((n) => n.id_nino === id);
      if (index !== -1) MOCK_NINOS.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/ninos/${id}/`, { method: "DELETE" });
  },
};

// ----------------------------------------------------------------------------
// PADRINOS SERVICE
// ----------------------------------------------------------------------------
export const PadrinosService = {
  async getAll(): Promise<Padrino[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_PADRINOS];
    }
    const raw = await fetchAPI<any[]>("/padrinos/");
    return ensureArray<any>(raw).map(normPadrino);
  },

  async getById(id: string): Promise<Padrino | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PADRINOS.find((p) => p.id_padrino === id) || null;
    }
    const raw = await fetchAPI<any>(`/padrinos/${id}/`);
    return normPadrino(raw);
  },

  async create(data: Omit<Padrino, "id_padrino">): Promise<Padrino> {
    if (USE_MOCK) {
      await delay();
      const newPadrino: Padrino = {
        id_padrino: `P${String(MOCK_PADRINOS.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_PADRINOS.push(newPadrino);
      return newPadrino;
    }
    const raw = await fetchAPI<any>("/padrinos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await fetchAPI<any>(`/padrinos/${raw.id}/`);
    return normPadrino(created);
  },

  async update(id: string, data: Partial<Padrino>): Promise<Padrino> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PADRINOS.findIndex((p) => p.id_padrino === id);
      if (index === -1) throw new Error("Padrino no encontrado");
      MOCK_PADRINOS[index] = { ...MOCK_PADRINOS[index], ...data };
      return MOCK_PADRINOS[index];
    }
    await fetchAPI<any>(`/padrinos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const updated = await fetchAPI<any>(`/padrinos/${id}/`);
    return normPadrino(updated);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PADRINOS.findIndex((p) => p.id_padrino === id);
      if (index !== -1) MOCK_PADRINOS.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/padrinos/${id}/`, { method: "DELETE" });
  },
};

// ----------------------------------------------------------------------------
// APADRINAMIENTOS SERVICE
// ----------------------------------------------------------------------------
export const ApadrinamientosService = {
  async getAll(): Promise<Apadrinamiento[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_APADRINAMIENTOS];
    }
    const raw = await fetchAPI<any[]>("/apadrinamientos/");
    return ensureArray<any>(raw).map(normApadrinamiento);
  },

  async getById(id: string): Promise<Apadrinamiento | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_APADRINAMIENTOS.find((a) => a.id_apadrinamiento === id) || null;
    }
    const raw = await fetchAPI<any>(`/apadrinamientos/${id}/`);
    return normApadrinamiento(raw);
  },

  async create(data: Omit<Apadrinamiento, "id_apadrinamiento">): Promise<Apadrinamiento> {
    if (USE_MOCK) {
      await delay();
      const newApadrinamiento: Apadrinamiento = {
        id_apadrinamiento: `AP${String(MOCK_APADRINAMIENTOS.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_APADRINAMIENTOS.push(newApadrinamiento);
      return newApadrinamiento;
    }
    const raw = await fetchAPI<any>("/apadrinamientos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await fetchAPI<any>(`/apadrinamientos/${raw.id}/`);
    return normApadrinamiento(created);
  },

  async update(id: string, data: Partial<Apadrinamiento>): Promise<Apadrinamiento> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_APADRINAMIENTOS.findIndex((a) => a.id_apadrinamiento === id);
      if (index === -1) throw new Error("Apadrinamiento no encontrado");
      MOCK_APADRINAMIENTOS[index] = { ...MOCK_APADRINAMIENTOS[index], ...data };
      return MOCK_APADRINAMIENTOS[index];
    }
    const raw = await fetchAPI<any>(`/apadrinamientos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return normApadrinamiento(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_APADRINAMIENTOS.findIndex((a) => a.id_apadrinamiento === id);
      if (index !== -1) MOCK_APADRINAMIENTOS.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/apadrinamientos/${id}/`, { method: "DELETE" });
  },

  async getByPadrino(id_padrino: string): Promise<Apadrinamiento[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_APADRINAMIENTOS.filter((a) => a.id_padrino === id_padrino);
    }
    const raw = await fetchAPI<any[]>(`/apadrinamientos/?padrino=${id_padrino}`);
    return raw.map(normApadrinamiento);
  },

  async getByNino(id_nino: string): Promise<Apadrinamiento[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_APADRINAMIENTOS.filter((a) => a.id_nino === id_nino);
    }
    const raw = await fetchAPI<any[]>(`/apadrinamientos/?nino=${id_nino}`);
    return raw.map(normApadrinamiento);
  },
};

// ----------------------------------------------------------------------------
// ENTREGAS SERVICE
// ----------------------------------------------------------------------------
export const EntregasService = {
  async getAll(): Promise<Entrega[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_ENTREGAS];
    }
    const raw = await fetchAPI<any[]>("/entregas/");
    return ensureArray<any>(raw).map(normEntrega);
  },

  async getById(id: string): Promise<Entrega | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_ENTREGAS.find((e) => e.id_entrega === id) || null;
    }
    const raw = await fetchAPI<any>(`/entregas/${id}/detalle/`);
    return normEntrega(raw);
  },

  async create(data: Omit<Entrega, "id_entrega">): Promise<Entrega> {
    if (USE_MOCK) {
      await delay();
      const newEntrega: Entrega = {
        id_entrega: `E${String(MOCK_ENTREGAS.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_ENTREGAS.push(newEntrega);
      return newEntrega;
    }
    const raw = await fetchAPI<any>("/entregas/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await fetchAPI<any>(`/entregas/${raw.id}/detalle/`);
    return normEntrega(created);
  },

  async update(id: string, data: Partial<Entrega>): Promise<Entrega> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_ENTREGAS.findIndex((e) => e.id_entrega === id);
      if (index === -1) throw new Error("Entrega no encontrada");
      MOCK_ENTREGAS[index] = { ...MOCK_ENTREGAS[index], ...data };
      return MOCK_ENTREGAS[index];
    }
    return fetchAPI<Entrega>(`/entregas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_ENTREGAS.findIndex((e) => e.id_entrega === id);
      if (index !== -1) MOCK_ENTREGAS.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/entregas/${id}/`, { method: "DELETE" });
  },

  async getByApadrinamiento(id_apadrinamiento: string): Promise<Entrega[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_ENTREGAS.filter((e) => e.id_apadrinamiento === id_apadrinamiento);
    }
    const raw = await fetchAPI<any[]>(`/entregas/?apadrinamiento=${id_apadrinamiento}`);
    return raw.map(normEntrega);
  },
};

// ----------------------------------------------------------------------------
// SOLICITUDES REGALO SERVICE
// ----------------------------------------------------------------------------
export const SolicitudesService = {
  async getAll(): Promise<SolicitudRegalo[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_SOLICITUDES];
    }
    const raw = await fetchAPI<any[]>("/solicitudes/");
    return ensureArray<any>(raw).map(normSolicitud);
  },

  async getById(id: string): Promise<SolicitudRegalo | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_SOLICITUDES.find((s) => s.id_solicitud === id) || null;
    }
    const raw = await fetchAPI<any>(`/solicitudes/${id}/`);
    return normSolicitud(raw);
  },

  async create(data: Omit<SolicitudRegalo, "id_solicitud">): Promise<SolicitudRegalo> {
    if (USE_MOCK) {
      await delay();
      const newSolicitud: SolicitudRegalo = {
        id_solicitud: `SR${String(MOCK_SOLICITUDES.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_SOLICITUDES.push(newSolicitud);
      return newSolicitud;
    }
    const raw = await fetchAPI<any>("/solicitudes/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await fetchAPI<any>(`/solicitudes/${raw.id}/`);
    return normSolicitud(created);
  },

  async update(id: string, data: Partial<SolicitudRegalo>): Promise<SolicitudRegalo> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_SOLICITUDES.findIndex((s) => s.id_solicitud === id);
      if (index === -1) throw new Error("Solicitud no encontrada");
      MOCK_SOLICITUDES[index] = { ...MOCK_SOLICITUDES[index], ...data };
      return MOCK_SOLICITUDES[index];
    }
    const raw = await fetchAPI<any>(`/solicitudes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return normSolicitud(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_SOLICITUDES.findIndex((s) => s.id_solicitud === id);
      if (index !== -1) MOCK_SOLICITUDES.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/solicitudes/${id}/`, { method: "DELETE" });
  },

  async getByNino(id_nino: string): Promise<SolicitudRegalo[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_SOLICITUDES.filter((s) => s.id_nino === id_nino);
    }
    const raw = await fetchAPI<any[]>(`/solicitudes/?nino=${id_nino}`);
    return raw.map(normSolicitud);
  },
};

// ----------------------------------------------------------------------------
// PUNTOS ENTREGA SERVICE
// ----------------------------------------------------------------------------
export const PuntosEntregaService = {
  async getAll(): Promise<PuntoEntrega[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_PUNTOS_ENTREGA];
    }
    const raw = await fetchAPI<any[]>("/puntos-entrega/");
    return raw.map(normPuntoEntrega);
  },

  async getById(id: string): Promise<PuntoEntrega | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PUNTOS_ENTREGA.find((p) => p.id_punto_entrega === id) || null;
    }
    const raw = await fetchAPI<any>(`/puntos-entrega/${id}/`);
    return normPuntoEntrega(raw);
  },

  async create(data: Omit<PuntoEntrega, "id_punto_entrega">): Promise<PuntoEntrega> {
    if (USE_MOCK) {
      await delay();
      const newPunto: PuntoEntrega = {
        id_punto_entrega: `PE${String(MOCK_PUNTOS_ENTREGA.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_PUNTOS_ENTREGA.push(newPunto);
      return newPunto;
    }
    const raw = await fetchAPI<any>("/puntos-entrega/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return normPuntoEntrega(raw);
  },

  async update(id: string, data: Partial<PuntoEntrega>): Promise<PuntoEntrega> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PUNTOS_ENTREGA.findIndex((p) => p.id_punto_entrega === id);
      if (index === -1) throw new Error("Punto de entrega no encontrado");
      MOCK_PUNTOS_ENTREGA[index] = { ...MOCK_PUNTOS_ENTREGA[index], ...data };
      return MOCK_PUNTOS_ENTREGA[index];
    }
    const raw = await fetchAPI<any>(`/puntos-entrega/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return normPuntoEntrega(raw);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PUNTOS_ENTREGA.findIndex((p) => p.id_punto_entrega === id);
      if (index !== -1) MOCK_PUNTOS_ENTREGA.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/puntos-entrega/${id}/`, { method: "DELETE" });
  },

  async getActivos(): Promise<PuntoEntrega[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PUNTOS_ENTREGA.filter((p) => p.estado_punto === "Activo");
    }
    const raw = await fetchAPI<any[]>("/puntos-entrega/?activo=true");
    return raw.map(normPuntoEntrega);
  },
};

// ----------------------------------------------------------------------------
// ADMINISTRADORES SERVICE
// ----------------------------------------------------------------------------
export const AdministradoresService = {
  async getAll(): Promise<Administrador[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_ADMINISTRADORES];
    }
    const raw = await fetchAPI<any[]>("/administradores/");
    return raw.map(normAdministrador);
  },

  async getById(id: string): Promise<Administrador | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_ADMINISTRADORES.find((a) => a.id_admin === id) || null;
    }
    const raw = await fetchAPI<any>(`/administradores/${id}/`);
    return normAdministrador(raw);
  },

  async create(data: Omit<Administrador, "id_admin">): Promise<Administrador> {
    if (USE_MOCK) {
      await delay();
      const newAdmin: Administrador = {
        id_admin: `A${String(MOCK_ADMINISTRADORES.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_ADMINISTRADORES.push(newAdmin);
      return newAdmin;
    }
    return fetchAPI<Administrador>("/administradores/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Administrador>): Promise<Administrador> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_ADMINISTRADORES.findIndex((a) => a.id_admin === id);
      if (index === -1) throw new Error("Administrador no encontrado");
      MOCK_ADMINISTRADORES[index] = { ...MOCK_ADMINISTRADORES[index], ...data };
      return MOCK_ADMINISTRADORES[index];
    }
    return fetchAPI<Administrador>(`/administradores/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_ADMINISTRADORES.findIndex((a) => a.id_admin === id);
      if (index !== -1) MOCK_ADMINISTRADORES.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/administradores/${id}/`, { method: "DELETE" });
  },
};

// ----------------------------------------------------------------------------
// EVENTOS SERVICE
// ----------------------------------------------------------------------------
export const EventosService = {
  async getAll(): Promise<Evento[]> {
    if (USE_MOCK) {
      await delay();
      return [...MOCK_EVENTOS];
    }
    const raw = await fetchAPI<any[]>("/eventos/");
    return ensureArray<any>(raw).map(normEvento);
  },

  async getById(id: string): Promise<Evento | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_EVENTOS.find((e) => e.id_evento === id) || null;
    }
    const raw = await fetchAPI<any>(`/eventos/${id}/`);
    return normEvento(raw);
  },

  async create(data: Omit<Evento, "id_evento">): Promise<Evento> {
    if (USE_MOCK) {
      await delay();
      const newEvento: Evento = {
        id_evento: `EV${String(MOCK_EVENTOS.length + 1).padStart(3, "0")}`,
        ...data,
      };
      MOCK_EVENTOS.push(newEvento);
      return newEvento;
    }
    return fetchAPI<Evento>("/eventos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Evento>): Promise<Evento> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_EVENTOS.findIndex((e) => e.id_evento === id);
      if (index === -1) throw new Error("Evento no encontrado");
      MOCK_EVENTOS[index] = { ...MOCK_EVENTOS[index], ...data };
      return MOCK_EVENTOS[index];
    }
    return fetchAPI<Evento>(`/eventos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_EVENTOS.findIndex((e) => e.id_evento === id);
      if (index !== -1) MOCK_EVENTOS.splice(index, 1);
      return;
    }
    return fetchAPI<void>(`/eventos/${id}/`, { method: "DELETE" });
  },

  async getActivos(): Promise<Evento[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_EVENTOS.filter((e) => e.estado_evento === "Activo");
    }
    const raw = await fetchAPI<any[]>("/eventos/?activo=true");
    return raw.map(normEvento);
  },
};

// ============================================================================
// DASHBOARD KPIs
// ============================================================================
export interface DashboardKPIs {
  total_ninos: number;
  ninos_disponibles: number;
  ninos_apadrinados: number;
  total_padrinos: number;
  padrinos_activos: number;
  apadrinamientos_activos: number;
  entregas_pendientes: number;
  entregas_completadas: number;
  solicitudes_abiertas: number;
}

export interface NoSQLStats {
  documentos_totales: {
    evidencias: number;
    bitacora_eventos: number;
    cartas: number;
    ninos_fotos: number;
  };
  eventos_por_tabla: Array<{ tabla: string; cantidad: number }>;
  eventos_por_accion: Array<{ accion: string; cantidad: number }>;
  evidencias_por_tipo: Array<{ tipo: string; cantidad: number }>;
}

export type NoSQLColeccion = "evidencias" | "ninos_fotos" | "cartas" | "bitacora_eventos";

export interface NoSQLContenidoItem {
  _id: string;
  tipo?: string;
  url_archivo?: string;
  entrega_id?: number;
  nino_id?: number;
  apadrinamiento_id?: number;
  foto_url?: string;
  remitente?: string;
  tabla?: string;
  accion?: string;
  usuario_id?: number | string;
  subido_por?: string;
  timestamp?: string;
}

export interface NoSQLContenidoResponse {
  coleccion: NoSQLColeccion;
  total: number;
  items: NoSQLContenidoItem[];
}

/** Fallback cuando el servidor aún no tiene /dashboard/nosql_contenido/ */
async function loadNoSQLContenidoFallback(
  coleccion: NoSQLColeccion,
  options?: { limit?: number; tipo?: string }
): Promise<NoSQLContenidoResponse> {
  const limit = options?.limit ?? 50;
  const tipo = options?.tipo?.toLowerCase();

  if (coleccion === "evidencias") {
    const entregas = await EntregasService.getAll();
    let candidatas = entregas.filter((e) => e.mongo_evidencia_id);
    if (candidatas.length === 0) {
      candidatas = entregas.filter(
        (e) => e.estado_entrega === "Entregado" || e.estado_entrega === "En Proceso"
      );
    }
    if (candidatas.length === 0) {
      candidatas = entregas.slice(0, 30);
    }

    const detalles = await Promise.all(
      candidatas.map((e) => EntregasService.getById(e.id_entrega))
    );

    const items: NoSQLContenidoItem[] = [];
    for (const entrega of detalles) {
      if (!entrega?.evidencias_nosql?.length) continue;
      for (const ev of entrega.evidencias_nosql) {
        if (tipo && ev.tipo?.toLowerCase() !== tipo) continue;
        items.push({
          _id: ev._id,
          tipo: ev.tipo,
          url_archivo: ev.url_archivo,
          entrega_id: Number(entrega.id_entrega) || undefined,
          subido_por: ev.subido_por,
          timestamp: ev.timestamp,
        });
      }
    }

    return { coleccion, total: items.length, items: items.slice(0, limit) };
  }

  if (coleccion === "ninos_fotos") {
    const ninos = await NinosService.getAll();
    const items = ninos
      .filter((n) => n.foto)
      .slice(0, limit)
      .map((n) => ({
        _id: `nino-foto-${n.id_nino}`,
        nino_id: Number(n.id_nino) || undefined,
        foto_url: n.foto,
      }));
    return { coleccion, total: items.length, items };
  }

  return { coleccion, total: 0, items: [] };
}

function isNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /404|not found|no encontrad/i.test(msg);
}

function ninoToListItem(n: Nino): RelationalListItem {
  return {
    id_nino: n.id_nino,
    nombre: n.nombre,
    edad: n.edad,
    genero: n.genero,
    estado_apadrinamiento: n.estado_apadrinamiento,
  };
}

function padrinoToListItem(p: Padrino): RelationalListItem {
  return {
    id_padrino: p.id_padrino,
    nombre: p.nombre,
    email: p.email,
  };
}

function apadrinamientoToListItem(
  a: Apadrinamiento,
  ninosMap?: Map<string, string>,
  padrinosMap?: Map<string, string>
): RelationalListItem {
  return {
    id_apadrinamiento: a.id_apadrinamiento,
    id_padrino: a.id_padrino,
    id_nino: a.id_nino,
    nino_nombre: ninosMap?.get(a.id_nino),
    padrino_nombre: padrinosMap?.get(a.id_padrino),
    estado_apadrinamiento_registro: a.estado_apadrinamiento_registro,
    tipo_apadrinamiento: a.tipo_apadrinamiento,
    fecha_inicio: a.fecha_inicio,
  };
}

function entregaToListItem(e: Entrega): RelationalListItem {
  return {
    id_entrega: e.id_entrega,
    descripcion_regalo: e.descripcion_regalo,
    fecha_programada: e.fecha_programada,
    estado_entrega: e.estado_entrega,
  };
}

function solicitudToListItem(s: SolicitudRegalo, ninosMap?: Map<string, string>): RelationalListItem {
  return {
    id_solicitud: s.id_solicitud,
    id_nino: s.id_nino,
    nino_nombre: ninosMap?.get(s.id_nino),
    descripcion_solicitud: s.descripcion_solicitud,
    estado_solicitud: s.estado_solicitud,
  };
}

function eventoToListItem(ev: Evento): RelationalListItem {
  return {
    id_evento: ev.id_evento,
    nombre_evento: ev.nombre_evento,
    tipo_evento: ev.tipo_evento,
    fecha_inicio: ev.fecha_inicio,
    estado_evento: ev.estado_evento,
  };
}

async function loadRelationalListFallback(
  view: string,
  limit: number
): Promise<RelationalListResponse> {
  const slice = (items: RelationalListItem[]) => ({
    view,
    total: items.length,
    items: items.slice(0, limit),
  });

  if (view.startsWith("ninos_")) {
    let endpoint = "/ninos/";
    if (view === "ninos_disponibles") {
      endpoint = "/ninos/disponibles/";
    } else if (view === "ninos_apadrinados") {
      endpoint = "/ninos/?estado=Apadrinado";
    }
    const raw = await fetchAPI<any[]>(endpoint);
    const ninos = ensureArray<any>(raw).map(normNino);
    return slice(ninos.map(ninoToListItem));
  }

  if (view.startsWith("padrinos_")) {
    const raw = await fetchAPI<any[]>("/padrinos/");
    let padrinos = ensureArray<any>(raw).map(normPadrino);
    if (view === "padrinos_activos") {
      const apRaw = await fetchAPI<any[]>("/apadrinamientos/?estado=Activo");
      const activos = new Set(
        ensureArray<any>(apRaw).map((a) => String(a.id_padrino ?? a.id_padrino_id ?? ""))
      );
      padrinos = padrinos.filter((p) => activos.has(p.id_padrino));
    }
    return slice(padrinos.map(padrinoToListItem));
  }

  if (view.startsWith("apadrinamientos_")) {
    let endpoint = "/apadrinamientos/";
    if (view === "apadrinamientos_activos") {
      endpoint = "/apadrinamientos/?estado=Activo";
    }
    const raw = await fetchAPI<any[]>(endpoint);
    let list = ensureArray<any>(raw).map(normApadrinamiento);
    if (view === "apadrinamientos_todos") {
      list = [...list].sort(
        (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
      );
    }
    return slice(list.map((a) => apadrinamientoToListItem(a)));
  }

  if (view.startsWith("entregas_")) {
    const raw = await fetchAPI<any[]>("/entregas/");
    let entregas = ensureArray<any>(raw).map(normEntrega);
    if (view === "entregas_completadas") {
      entregas = entregas.filter((e) => e.estado_entrega === "Entregado");
    } else if (view === "entregas_pendientes") {
      entregas = entregas.filter(
        (e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso"
      );
    }
    return slice(entregas.map(entregaToListItem));
  }

  if (view === "solicitudes_abiertas") {
    const raw = await fetchAPI<any[]>("/solicitudes/?estado=Abierta");
    const solicitudes = ensureArray<any>(raw).map(normSolicitud);
    return slice(solicitudes.map((s) => solicitudToListItem(s)));
  }

  if (view === "eventos_activos") {
    const raw = await fetchAPI<any[]>("/eventos/");
    const eventos = ensureArray<any>(raw)
      .map(normEvento)
      .filter((e) => e.estado_evento === "Activo" || e.estado_evento === "Planeado");
    return slice(eventos.map(eventoToListItem));
  }

  return { view, total: 0, items: [] };
}

export const DashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    if (USE_MOCK) {
      await delay();
      return {
        total_ninos: MOCK_NINOS.length,
        ninos_disponibles: MOCK_NINOS.filter((n) => n.estado_apadrinamiento === "Disponible").length,
        ninos_apadrinados: MOCK_NINOS.filter((n) => n.estado_apadrinamiento === "Apadrinado").length,
        total_padrinos: MOCK_PADRINOS.length,
        padrinos_activos: MOCK_PADRINOS.length,
        apadrinamientos_activos: MOCK_APADRINAMIENTOS.filter(
          (a) => a.estado_apadrinamiento_registro === "Activo"
        ).length,
        entregas_pendientes: MOCK_ENTREGAS.filter(
          (e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso"
        ).length,
        entregas_completadas: MOCK_ENTREGAS.filter((e) => e.estado_entrega === "Entregado").length,
        solicitudes_abiertas: MOCK_SOLICITUDES.filter((s) => s.estado_solicitud === "Abierta").length,
      };
    }
    return fetchAPI<DashboardKPIs>("/dashboard/kpis/");
  },

  async getNoSQLStats(): Promise<NoSQLStats> {
    if (USE_MOCK) {
      await delay();
      return {
        documentos_totales: {
          evidencias: MOCK_ENTREGAS.length,
          bitacora_eventos: 15,
          cartas: 5,
          ninos_fotos: MOCK_NINOS.length,
        },
        eventos_por_tabla: [
          { tabla: "api_nino", cantidad: 12 },
          { tabla: "api_padrino", cantidad: 6 },
          { tabla: "api_apadrinamiento", cantidad: 8 }
        ],
        eventos_por_accion: [
          { accion: "CREATE", cantidad: 18 },
          { accion: "UPDATE", cantidad: 8 }
        ],
        evidencias_por_tipo: [
          { tipo: "foto", cantidad: 8 },
          { tipo: "video", cantidad: 2 }
        ]
      };
    }
    return fetchAPI<NoSQLStats>("/dashboard/nosql_stats/");
  },

  async getNoSQLContenido(
    coleccion: NoSQLColeccion,
    options?: { limit?: number; tipo?: string }
  ): Promise<NoSQLContenidoResponse> {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString();
      if (coleccion === "evidencias") {
        return {
          coleccion,
          total: 2,
          items: [
            {
              _id: "mock-ev-1",
              tipo: "foto",
              url_archivo: "https://api.dicebear.com/7.x/thumbs/svg?seed=ev1",
              entrega_id: 1,
              nino_id: 1,
              subido_por: "admin@smilelink.org",
              timestamp: now,
            },
            {
              _id: "mock-ev-2",
              tipo: "foto",
              url_archivo: "https://api.dicebear.com/7.x/thumbs/svg?seed=ev2",
              entrega_id: 2,
              nino_id: 2,
              subido_por: "admin@smilelink.org",
              timestamp: now,
            },
          ],
        };
      }
      if (coleccion === "ninos_fotos") {
        return {
          coleccion,
          total: MOCK_NINOS.length,
          items: MOCK_NINOS.slice(0, 6).map((n, i) => ({
            _id: `mock-foto-${i}`,
            nino_id: Number(n.id_nino.replace(/\D/g, "")) || i + 1,
            foto_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.nombre}`,
          })),
        };
      }
      if (coleccion === "cartas") {
        return {
          coleccion,
          total: 2,
          items: [
            { _id: "mock-carta-1", nino_id: 1, apadrinamiento_id: 1, remitente: "Operador", timestamp: now },
            { _id: "mock-carta-2", nino_id: 2, apadrinamiento_id: 2, remitente: "Operador", timestamp: now },
          ],
        };
      }
      return {
        coleccion,
        total: 3,
        items: [
          { _id: "mock-log-1", tabla: "api_nino", accion: "CREATE", usuario_id: 1, timestamp: now },
          { _id: "mock-log-2", tabla: "api_entrega", accion: "UPDATE", usuario_id: 1, timestamp: now },
          { _id: "mock-log-3", tabla: "api_padrino", accion: "LOGIN", usuario_id: 2, timestamp: now },
        ],
      };
    }
    const params = new URLSearchParams({ coleccion, limit: String(options?.limit ?? 50) });
    if (options?.tipo) params.set("tipo", options.tipo);
    try {
      return await fetchAPI<NoSQLContenidoResponse>(`/dashboard/nosql_contenido/?${params.toString()}`);
    } catch {
      return loadNoSQLContenidoFallback(coleccion, options);
    }
  },

  async getRelationalList(
    view: string,
    options?: { limit?: number }
  ): Promise<RelationalListResponse> {
    const limit = options?.limit ?? 300;

    if (USE_MOCK) {
      await delay();
      const items = buildMockRelationalList(view, limit);
      return { view, total: items.length, items };
    }

    const params = new URLSearchParams({
      view,
      limit: String(limit),
    });
    try {
      return await fetchAPI<RelationalListResponse>(
        `/dashboard/relational_list/?${params.toString()}`
      );
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      return loadRelationalListFallback(view, limit);
    }
  },
};

export type RelationalListItem = Record<string, unknown>;

export interface RelationalListResponse {
  view: string;
  total: number;
  items: RelationalListItem[];
  _error?: string;
}

function buildMockRelationalList(view: string, limit: number): RelationalListItem[] {
  const cap = <T>(arr: T[]) => arr.slice(0, limit);

  if (view.startsWith("ninos_")) {
    let list = MOCK_NINOS;
    if (view === "ninos_disponibles") {
      list = list.filter((n) => n.estado_apadrinamiento === "Disponible");
    } else if (view === "ninos_apadrinados") {
      list = list.filter((n) => n.estado_apadrinamiento === "Apadrinado");
    }
    return cap(list).map((n) => ({
      id_nino: n.id_nino,
      nombre: n.nombre,
      edad: n.edad,
      genero: n.genero,
      estado_apadrinamiento: n.estado_apadrinamiento,
    }));
  }

  if (view.startsWith("padrinos_")) {
    let list = MOCK_PADRINOS;
    if (view === "padrinos_activos") {
      const activos = new Set(
        MOCK_APADRINAMIENTOS.filter((a) => a.estado_apadrinamiento_registro === "Activo").map(
          (a) => a.id_padrino
        )
      );
      list = list.filter((p) => activos.has(p.id_padrino));
    }
    return cap(list).map((p) => ({
      id_padrino: p.id_padrino,
      nombre: p.nombre,
      email: p.email,
    }));
  }

  if (view.startsWith("apadrinamientos_")) {
    let list = [...MOCK_APADRINAMIENTOS];
    if (view === "apadrinamientos_activos") {
      list = list.filter((a) => a.estado_apadrinamiento_registro === "Activo");
    } else {
      list.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
    }
    return cap(list).map((a) => {
      const nino = MOCK_NINOS.find((n) => n.id_nino === a.id_nino);
      const padrino = MOCK_PADRINOS.find((p) => p.id_padrino === a.id_padrino);
      return {
        id_apadrinamiento: a.id_apadrinamiento,
        id_padrino: a.id_padrino,
        id_nino: a.id_nino,
        nino_nombre: nino?.nombre ?? a.id_nino,
        padrino_nombre: padrino?.nombre ?? a.id_padrino,
        estado_apadrinamiento_registro: a.estado_apadrinamiento_registro,
        tipo_apadrinamiento: a.tipo_apadrinamiento,
        fecha_inicio: a.fecha_inicio,
      };
    });
  }

  if (view.startsWith("entregas_")) {
    let list = MOCK_ENTREGAS;
    if (view === "entregas_completadas") {
      list = list.filter((e) => e.estado_entrega === "Entregado");
    } else if (view === "entregas_pendientes") {
      list = list.filter((e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso");
    }
    return cap(list).map((e) => ({
      id_entrega: e.id_entrega,
      descripcion_regalo: e.descripcion_regalo,
      fecha_programada: e.fecha_programada,
      estado_entrega: e.estado_entrega,
    }));
  }

  if (view === "solicitudes_abiertas") {
    return cap(MOCK_SOLICITUDES.filter((s) => s.estado_solicitud === "Abierta")).map((s) => {
      const nino = MOCK_NINOS.find((n) => n.id_nino === s.id_nino);
      return {
        id_solicitud: s.id_solicitud,
        id_nino: s.id_nino,
        nino_nombre: nino?.nombre ?? s.id_nino,
        descripcion_solicitud: s.descripcion_solicitud,
        estado_solicitud: s.estado_solicitud,
      };
    });
  }

  if (view === "eventos_activos") {
    return cap(
      MOCK_EVENTOS.filter((e) => e.estado_evento === "Activo" || e.estado_evento === "Planeado")
    ).map((ev) => ({
      id_evento: ev.id_evento,
      nombre_evento: ev.nombre_evento,
      tipo_evento: ev.tipo_evento,
      fecha_inicio: ev.fecha_inicio,
      estado_evento: ev.estado_evento,
    }));
  }

  return [];
}

export function relationalItemsToNinos(items: RelationalListItem[]): Nino[] {
  return items.map((item) => ({
    id_nino: String(item.id_nino ?? ""),
    nombre: String(item.nombre ?? ""),
    edad: Number(item.edad ?? 0),
    genero: (item.genero as Nino["genero"]) ?? "Masculino",
    descripcion: "",
    necesidades: [],
    estado_apadrinamiento:
      (item.estado_apadrinamiento as Nino["estado_apadrinamiento"]) ?? "Disponible",
  }));
}

export function relationalItemsToPadrinos(items: RelationalListItem[]): Padrino[] {
  return items.map((item) => ({
    id_padrino: String(item.id_padrino ?? ""),
    nombre: String(item.nombre ?? ""),
    email: String(item.email ?? ""),
    fecha_registro: "",
    direccion: "",
    telefono: "",
    historial_apadrinamiento_ids: [],
  }));
}

export function relationalItemsToApadrinamientos(items: RelationalListItem[]): Apadrinamiento[] {
  return items.map((item) => ({
    id_apadrinamiento: String(item.id_apadrinamiento ?? ""),
    id_padrino: String(item.id_padrino ?? ""),
    id_nino: String(item.id_nino ?? ""),
    fecha_inicio: String(item.fecha_inicio ?? ""),
    tipo_apadrinamiento:
      (item.tipo_apadrinamiento as Apadrinamiento["tipo_apadrinamiento"]) ?? "Aleatorio",
    estado_apadrinamiento_registro:
      (item.estado_apadrinamiento_registro as Apadrinamiento["estado_apadrinamiento_registro"]) ??
      "Activo",
    entregas_ids: [],
  }));
}

export function relationalItemsToEntregas(items: RelationalListItem[]): Entrega[] {
  return items.map((item) => ({
    id_entrega: String(item.id_entrega ?? ""),
    id_apadrinamiento: "",
    descripcion_regalo: String(item.descripcion_regalo ?? ""),
    fecha_programada: String(item.fecha_programada ?? ""),
    estado_entrega: (item.estado_entrega as Entrega["estado_entrega"]) ?? "Pendiente",
    observaciones: "",
    id_punto_entrega: "",
  }));
}

export function relationalItemsToSolicitudes(items: RelationalListItem[]): SolicitudRegalo[] {
  return items.map((item) => ({
    id_solicitud: String(item.id_solicitud ?? ""),
    id_nino: String(item.id_nino ?? ""),
    descripcion_solicitud: String(item.descripcion_solicitud ?? ""),
    fecha_solicitud: "",
    estado_solicitud:
      (item.estado_solicitud as SolicitudRegalo["estado_solicitud"]) ?? "Abierta",
  }));
}

export function relationalItemsToEventos(items: RelationalListItem[]): Evento[] {
  return items.map((item) => ({
    id_evento: String(item.id_evento ?? ""),
    nombre_evento: String(item.nombre_evento ?? ""),
    tipo_evento: (item.tipo_evento as Evento["tipo_evento"]) ?? "Otro",
    fecha_inicio: String(item.fecha_inicio ?? ""),
    fecha_fin: "",
    estado_evento: (item.estado_evento as Evento["estado_evento"]) ?? "Activo",
    descripcion: "",
  }));
}

export interface DiagnosticResult {
  mysql: {
    status: "Operational" | "Error";
    details: string;
    latency_ms: number;
  };
  mongodb: {
    status: "Operational" | "Error";
    details: string;
    latency_ms: number;
  };
  encryption: {
    status: "Operational" | "Error";
    details: string;
  };
}

export const DiagnosticsService = {
  async check(): Promise<DiagnosticResult> {
    if (USE_MOCK) {
      await delay(800);
      return {
        mysql: {
          status: "Operational",
          details: "Simulado: Conexión activa a base de datos MySQL.",
          latency_ms: 15.5
        },
        mongodb: {
          status: "Operational",
          details: "Simulado: Conexión activa a MongoDB en local.",
          latency_ms: 8.2
        },
        encryption: {
          status: "Operational",
          details: "Simulado: Cifrado Fernet operando correctamente."
        }
      };
    }
    return fetchAPI<DiagnosticResult>("/diagnostics/check/");
  }
};



