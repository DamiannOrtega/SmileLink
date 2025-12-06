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
  avatar_url?: string;
}

export interface Apadrinamiento {
  id_apadrinamiento: string;
  id_padrino: string; // FK to Padrino
  id_nino: string; // FK to Nino
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin?: string; // Date (Nullable)
  tipo_apadrinamiento: "Aleatorio" | "Elección Padrino";
  estado_apadrinamiento_registro: "Activo" | "Finalizado" | "Entregado";
  entregas_ids: string[]; // FKs to Entrega
  ubicacion_entrega_lat?: number;
  ubicacion_entrega_lng?: number;
  direccion_entrega?: string;
  id_punto_entrega?: string; // FK to PuntoEntrega
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
  },
  {
    id_nino: "N003",
    nombre: "Ana Patricia López",
    edad: 7,
    genero: "Femenino",
    descripcion: "Le encanta bailar y la música.",
    necesidades: ["Zapatos de ballet", "Vestido"],
    estado_apadrinamiento: "Disponible",
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
    ubicacion_entrega_lat: 21.8853,
    ubicacion_entrega_lng: -102.2916,
    direccion_entrega: "Calle Norte 45, Centro, Aguascalientes",
    id_punto_entrega: "PE001",
  },
  {
    id_apadrinamiento: "AP002",
    id_padrino: "P002",
    id_nino: "N002",
    fecha_inicio: "2025-10-15",
    tipo_apadrinamiento: "Aleatorio",
    estado_apadrinamiento_registro: "Activo",
    entregas_ids: ["E003"],
    ubicacion_entrega_lat: 21.8700,
    ubicacion_entrega_lng: -102.2900,
    direccion_entrega: "Av. Sur 123, Aguascalientes",
    id_punto_entrega: "PE002",
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.193.177:8000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Simula latencia de red (500ms)
 */
const delay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wrapper genérico para peticiones HTTP
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
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  // Para DELETE y otras operaciones que no retornan contenido, retornar void
  if (response.status === 204 || response.status === 200) {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Respuesta vacía o no JSON
      return undefined as T;
    }
  }

  // Intentar parsear JSON solo si hay contenido
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    // Si no es JSON válido, retornar undefined para void
    return undefined as T;
  }
}

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
    return fetchAPI<Nino[]>("/ninos/");
  },

  async getById(id: string): Promise<Nino | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_NINOS.find((n) => n.id_nino === id) || null;
    }
    return fetchAPI<Nino>(`/ninos/${id}/`);
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
    return fetchAPI<Nino>("/ninos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Nino>): Promise<Nino> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_NINOS.findIndex((n) => n.id_nino === id);
      if (index === -1) throw new Error("Niño no encontrado");
      MOCK_NINOS[index] = { ...MOCK_NINOS[index], ...data };
      return MOCK_NINOS[index];
    }
    return fetchAPI<Nino>(`/ninos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_NINOS.findIndex((n) => n.id_nino === id);
      if (index !== -1) MOCK_NINOS.splice(index, 1);

      // Eliminar asignaciones huérfanas (sin niño válido)
      const asignacionesHuérfanas = MOCK_APADRINAMIENTOS.filter(
        (a) => a.id_nino === id
      );
      asignacionesHuérfanas.forEach((asignacion) => {
        const indexAsig = MOCK_APADRINAMIENTOS.findIndex(
          (a) => a.id_apadrinamiento === asignacion.id_apadrinamiento
        );
        if (indexAsig !== -1) {
          MOCK_APADRINAMIENTOS.splice(indexAsig, 1);
        }
      });

      return;
    }
    return fetchAPI<void>(`/ninos/${id}/`, { method: "DELETE" });
  },

  async uploadAvatar(id: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Usamos fetch directo para poder enviar FormData (fetchAPI asume JSON)
    // Aseguramos que se usa la IP correcta y no localhost
    const response = await fetch(`${API_BASE_URL}/ninos/${id}/upload_avatar/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error uploading avatar");
    }
    return response.json();
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
    return fetchAPI<Padrino[]>("/padrinos/");
  },

  async getById(id: string): Promise<Padrino | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PADRINOS.find((p) => p.id_padrino === id) || null;
    }
    return fetchAPI<Padrino>(`/padrinos/${id}/`);
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
    return fetchAPI<Padrino>("/padrinos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Padrino>): Promise<Padrino> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PADRINOS.findIndex((p) => p.id_padrino === id);
      if (index === -1) throw new Error("Padrino no encontrado");
      MOCK_PADRINOS[index] = { ...MOCK_PADRINOS[index], ...data };
      return MOCK_PADRINOS[index];
    }
    return fetchAPI<Padrino>(`/padrinos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PADRINOS.findIndex((p) => p.id_padrino === id);
      if (index !== -1) MOCK_PADRINOS.splice(index, 1);

      // Eliminar asignaciones huérfanas (sin padrino válido)
      const asignacionesHuérfanas = MOCK_APADRINAMIENTOS.filter(
        (a) => a.id_padrino === id
      );
      asignacionesHuérfanas.forEach((asignacion) => {
        const indexAsig = MOCK_APADRINAMIENTOS.findIndex(
          (a) => a.id_apadrinamiento === asignacion.id_apadrinamiento
        );
        if (indexAsig !== -1) {
          MOCK_APADRINAMIENTOS.splice(indexAsig, 1);
        }
      });

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
    return fetchAPI<Apadrinamiento[]>("/apadrinamientos/");
  },

  async getById(id: string): Promise<Apadrinamiento | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_APADRINAMIENTOS.find((a) => a.id_apadrinamiento === id) || null;
    }
    return fetchAPI<Apadrinamiento>(`/apadrinamientos/${id}/`);
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
    return fetchAPI<Apadrinamiento>("/apadrinamientos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Apadrinamiento>): Promise<Apadrinamiento> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_APADRINAMIENTOS.findIndex((a) => a.id_apadrinamiento === id);
      if (index === -1) throw new Error("Apadrinamiento no encontrado");
      MOCK_APADRINAMIENTOS[index] = { ...MOCK_APADRINAMIENTOS[index], ...data };
      return MOCK_APADRINAMIENTOS[index];
    }
    return fetchAPI<Apadrinamiento>(`/apadrinamientos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
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
    return fetchAPI<Apadrinamiento[]>(`/apadrinamientos/?padrino=${id_padrino}`);
  },

  async getByNino(id_nino: string): Promise<Apadrinamiento[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_APADRINAMIENTOS.filter((a) => a.id_nino === id_nino);
    }
    return fetchAPI<Apadrinamiento[]>(`/apadrinamientos/?nino=${id_nino}`);
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
    return fetchAPI<Entrega[]>("/entregas/");
  },

  async getById(id: string): Promise<Entrega | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_ENTREGAS.find((e) => e.id_entrega === id) || null;
    }
    return fetchAPI<Entrega>(`/entregas/${id}/`);
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
    return fetchAPI<Entrega>("/entregas/", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
    return fetchAPI<Entrega[]>(`/entregas/?apadrinamiento=${id_apadrinamiento}`);
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
    return fetchAPI<SolicitudRegalo[]>("/solicitudes/");
  },

  async getById(id: string): Promise<SolicitudRegalo | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_SOLICITUDES.find((s) => s.id_solicitud === id) || null;
    }
    return fetchAPI<SolicitudRegalo>(`/solicitudes/${id}/`);
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
    return fetchAPI<SolicitudRegalo>("/solicitudes/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<SolicitudRegalo>): Promise<SolicitudRegalo> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_SOLICITUDES.findIndex((s) => s.id_solicitud === id);
      if (index === -1) throw new Error("Solicitud no encontrada");
      MOCK_SOLICITUDES[index] = { ...MOCK_SOLICITUDES[index], ...data };
      return MOCK_SOLICITUDES[index];
    }
    return fetchAPI<SolicitudRegalo>(`/solicitudes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
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
    return fetchAPI<SolicitudRegalo[]>(`/solicitudes/?nino=${id_nino}`);
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
    return fetchAPI<PuntoEntrega[]>("/puntos-entrega/");
  },

  async getById(id: string): Promise<PuntoEntrega | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PUNTOS_ENTREGA.find((p) => p.id_punto_entrega === id) || null;
    }
    return fetchAPI<PuntoEntrega>(`/puntos-entrega/${id}/`);
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
    return fetchAPI<PuntoEntrega>("/puntos-entrega/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<PuntoEntrega>): Promise<PuntoEntrega> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_PUNTOS_ENTREGA.findIndex((p) => p.id_punto_entrega === id);
      if (index === -1) throw new Error("Punto de entrega no encontrado");
      MOCK_PUNTOS_ENTREGA[index] = { ...MOCK_PUNTOS_ENTREGA[index], ...data };
      return MOCK_PUNTOS_ENTREGA[index];
    }
    return fetchAPI<PuntoEntrega>(`/puntos-entrega/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
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
    return fetchAPI<PuntoEntrega[]>("/puntos-entrega/?activo=true");
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
    return fetchAPI<Administrador[]>("/administradores/");
  },

  async getById(id: string): Promise<Administrador | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_ADMINISTRADORES.find((a) => a.id_admin === id) || null;
    }
    return fetchAPI<Administrador>(`/administradores/${id}/`);
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
      // Cargar eventos guardados en localStorage y combinarlos con los iniciales
      const allEventos = [...MOCK_EVENTOS];
      try {
        const saved = localStorage.getItem("mock_eventos");
        if (saved) {
          const parsed = JSON.parse(saved) as Evento[];
          parsed.forEach(evento => {
            if (!allEventos.find(e => e.id_evento === evento.id_evento)) {
              allEventos.push(evento);
            }
          });
        }
      } catch (e) {
        console.warn("Error al cargar eventos de localStorage:", e);
      }
      return [...allEventos];
    }
    // Si no es mock, usar API real pero también cargar de localStorage como respaldo
    const apiEventos = await fetchAPI<Evento[]>("/eventos/");
    try {
      const saved = localStorage.getItem("api_eventos");
      if (saved) {
        const parsed = JSON.parse(saved) as Evento[];
        // Combinar eventos de API con los de localStorage, evitando duplicados
        const allEventos = [...apiEventos];
        parsed.forEach(evento => {
          if (!allEventos.find(e => e.id_evento === evento.id_evento)) {
            allEventos.push(evento);
          }
        });
        return allEventos;
      }
    } catch (e) {
      console.warn("Error al cargar eventos de localStorage:", e);
    }
    return apiEventos;
  },

  async getById(id: string): Promise<Evento | null> {
    console.log("getById llamado con ID:", id, "USE_MOCK:", USE_MOCK);
    if (USE_MOCK) {
      await delay();
      // Buscar en MOCK_EVENTOS y localStorage
      let evento = MOCK_EVENTOS.find((e) => e.id_evento === id) || null;
      console.log("Evento encontrado en MOCK_EVENTOS:", evento);
      if (!evento) {
        try {
          const saved = localStorage.getItem("mock_eventos");
          if (saved) {
            const parsed = JSON.parse(saved) as Evento[];
            evento = parsed.find((e) => e.id_evento === id) || null;
            console.log("Evento encontrado en localStorage (mock):", evento);
          }
        } catch (e) {
          console.warn("Error al buscar evento en localStorage:", e);
        }
      }
      return evento;
    }
    // Si no es mock, buscar en localStorage primero (para eventos creados recientemente)
    // y luego en la API
    let evento: Evento | null = null;

    // Buscar primero en localStorage
    try {
      const saved = localStorage.getItem("api_eventos");
      if (saved) {
        const parsed = JSON.parse(saved) as Evento[];
        evento = parsed.find((e) => e.id_evento === id) || null;
        if (evento) {
          console.log("Evento encontrado en localStorage (api):", evento);
          return evento;
        }
      }
    } catch (localError) {
      console.warn("Error al buscar evento en localStorage:", localError);
    }

    // Si no se encuentra en localStorage, buscar en la API
    try {
      evento = await fetchAPI<Evento>(`/eventos/${id}/`);
      console.log("Evento encontrado en API:", evento);
      return evento;
    } catch (e) {
      console.log("Error al buscar en API:", e);
      // Si la API falla y no se encontró en localStorage, retornar null
      return null;
    }
  },

  async create(data: Omit<Evento, "id_evento">): Promise<Evento> {
    if (USE_MOCK) {
      await delay();
      // Obtener todos los eventos (iniciales + localStorage) para calcular el siguiente ID
      const allEventos = [...MOCK_EVENTOS];
      try {
        const saved = localStorage.getItem("mock_eventos");
        if (saved) {
          const parsed = JSON.parse(saved) as Evento[];
          parsed.forEach(evento => {
            if (!allEventos.find(e => e.id_evento === evento.id_evento)) {
              allEventos.push(evento);
            }
          });
        }
      } catch (e) {
        console.warn("Error al cargar eventos de localStorage:", e);
      }

      // Calcular el siguiente ID basado en el máximo ID existente
      const maxId = allEventos.length > 0
        ? Math.max(...allEventos.map(e => parseInt(e.id_evento.replace("EV", "")) || 0))
        : 0;
      const newEvento: Evento = {
        id_evento: `EV${String(maxId + 1).padStart(3, "0")}`,
        ...data,
      };

      // Agregar al array inicial
      MOCK_EVENTOS.push(newEvento);

      // Actualizar localStorage con todos los eventos
      try {
        const eventosParaGuardar = [...MOCK_EVENTOS];
        const saved = localStorage.getItem("mock_eventos");
        if (saved) {
          const parsed = JSON.parse(saved) as Evento[];
          parsed.forEach(evento => {
            if (!eventosParaGuardar.find(e => e.id_evento === evento.id_evento)) {
              eventosParaGuardar.push(evento);
            }
          });
        }
        localStorage.setItem("mock_eventos", JSON.stringify(eventosParaGuardar));
      } catch (e) {
        console.warn("No se pudo guardar eventos en localStorage:", e);
      }
      return newEvento;
    }
    // Si no es mock, usar API real pero también guardar en localStorage como respaldo
    const newEvento = await fetchAPI<Evento>("/eventos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Guardar en localStorage para que persista
    try {
      const saved = localStorage.getItem("api_eventos");
      const eventos = saved ? JSON.parse(saved) as Evento[] : [];
      eventos.push(newEvento);
      localStorage.setItem("api_eventos", JSON.stringify(eventos));
    } catch (e) {
      console.warn("No se pudo guardar evento en localStorage:", e);
    }
    return newEvento;
  },

  async update(id: string, data: Partial<Evento>): Promise<Evento> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_EVENTOS.findIndex((e) => e.id_evento === id);
      if (index === -1) throw new Error("Evento no encontrado");
      MOCK_EVENTOS[index] = { ...MOCK_EVENTOS[index], ...data };

      // Actualizar localStorage
      try {
        const eventosParaGuardar = [...MOCK_EVENTOS];
        const saved = localStorage.getItem("mock_eventos");
        if (saved) {
          const parsed = JSON.parse(saved) as Evento[];
          parsed.forEach(evento => {
            if (!eventosParaGuardar.find(e => e.id_evento === evento.id_evento)) {
              eventosParaGuardar.push(evento);
            }
          });
        }
        localStorage.setItem("mock_eventos", JSON.stringify(eventosParaGuardar));
      } catch (e) {
        console.warn("No se pudo actualizar eventos en localStorage:", e);
      }

      return MOCK_EVENTOS[index];
    }
    // Si no es mock, usar API real pero también actualizar localStorage
    const eventoActualizado = await fetchAPI<Evento>(`/eventos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    // Actualizar en localStorage
    try {
      const saved = localStorage.getItem("api_eventos");
      if (saved) {
        const eventos = JSON.parse(saved) as Evento[];
        const index = eventos.findIndex(e => e.id_evento === id);
        if (index !== -1) {
          eventos[index] = { ...eventos[index], ...eventoActualizado };
        } else {
          eventos.push(eventoActualizado);
        }
        localStorage.setItem("api_eventos", JSON.stringify(eventos));
      }
    } catch (e) {
      console.warn("No se pudo actualizar evento en localStorage:", e);
    }

    return eventoActualizado;
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const index = MOCK_EVENTOS.findIndex((e) => e.id_evento === id);
      if (index !== -1) MOCK_EVENTOS.splice(index, 1);

      // Eliminar también de localStorage
      try {
        const saved = localStorage.getItem("mock_eventos");
        if (saved) {
          const parsed = JSON.parse(saved) as Evento[];
          const filtered = parsed.filter(e => e.id_evento !== id);
          localStorage.setItem("mock_eventos", JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn("Error al eliminar evento de localStorage:", e);
      }

      return;
    }
    // Si no es mock, eliminar de la API y también de localStorage
    await fetchAPI<void>(`/eventos/${id}/`, { method: "DELETE" });

    // Eliminar también de localStorage
    try {
      const saved = localStorage.getItem("api_eventos");
      if (saved) {
        const parsed = JSON.parse(saved) as Evento[];
        const filtered = parsed.filter(e => e.id_evento !== id);
        localStorage.setItem("api_eventos", JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn("Error al eliminar evento de localStorage:", e);
    }
  },

  async getActivos(): Promise<Evento[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_EVENTOS.filter((e) => e.estado_evento === "Activo");
    }
    return fetchAPI<Evento[]>("/eventos/?activo=true");
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

export const DashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    if (USE_MOCK) {
      await delay();
      return {
        total_ninos: MOCK_NINOS.length,
        ninos_disponibles: MOCK_NINOS.filter((n) => n.estado_apadrinamiento === "Disponible").length,
        ninos_apadrinados: MOCK_NINOS.filter((n) => n.estado_apadrinamiento === "Apadrinado").length,
        total_padrinos: MOCK_PADRINOS.length,
        padrinos_activos: MOCK_PADRINOS.length, // En mock todos están activos
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
};
