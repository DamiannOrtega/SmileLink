// Servicios mock para datos de SmileLink

export interface Niño {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: number;
  genero: "Masculino" | "Femenino";
  escuela: string;
  tallaCamisa: string;
  tallaPantalon: string;
  tallaZapatos: string;
  intereses: string;
  observaciones?: string;
  estado: "Sin padrino" | "Asignado" | "Entrega completada" | "Inactivo";
  eventoActual?: string;
  foto?: string;
}

export interface Padrino {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaRegistro: string;
  metodoAuth: "Google" | "Normal";
  estado: "Activo" | "Inactivo";
  niñosApadrinados: number;
  notas?: string;
}

export interface Asignacion {
  id: string;
  niñoId: string;
  padrinoId: string;
  eventoId: string;
  estado: "Pendiente" | "Aceptado" | "Entrega registrada" | "Verificada" | "Cancelada";
  fechaCreacion: string;
  notas?: string;
}

export interface Carta {
  id: string;
  niñoId: string;
  eventoId: string;
  contenido: string;
  estado: "Pendiente" | "Revisada" | "Aprobada" | "Rechazada";
  fechaCarga: string;
  archivos?: string[];
}

export interface Regalo {
  id: string;
  niñoId: string;
  padrinoId: string;
  eventoId: string;
  descripcion: string;
  estado: "Pendiente compra" | "Comprado" | "Entregado" | "Verificado";
}

export interface Entrega {
  id: string;
  niñoId: string;
  padrinoId: string;
  eventoId: string;
  ubicacionId: string;
  fechaProgramada: string;
  fechaEfectiva?: string;
  estado: "Pendiente" | "Entrega registrada" | "Verificada";
  evidencias: string[];
  notasPadrino?: string;
  notasAdmin?: string;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  latitud: number;
  longitud: number;
  capacidad: number;
  contacto: string;
  telefono: string;
  notas: string;
  activo: boolean;
}

export interface Evento {
  id: string;
  nombre: string;
  tipo: "Navidad" | "Día del Niño" | "Otro";
  fechaInicio: string;
  fechaFin: string;
  estado: "Planeado" | "Activo" | "Cerrado";
  niñosIncluidos: number;
  apadrinamientosActivos: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "Superadmin" | "Admin" | "Voluntario";
  estado: "Activo" | "Inactivo";
  ultimoAcceso: string;
}

// Mock data
export const niñosMock: Niño[] = [
  {
    id: "1",
    nombre: "María",
    apellidos: "González López",
    fechaNacimiento: "2015-03-15",
    edad: 9,
    genero: "Femenino",
    escuela: "Escuela Primaria Benito Juárez",
    tallaCamisa: "10",
    tallaPantalon: "10",
    tallaZapatos: "3",
    intereses: "Dibujo, música, lectura",
    estado: "Asignado",
    eventoActual: "Navidad 2025",
  },
  {
    id: "2",
    nombre: "Carlos",
    apellidos: "Martínez Ruiz",
    fechaNacimiento: "2016-07-22",
    edad: 8,
    genero: "Masculino",
    escuela: "Escuela Primaria Miguel Hidalgo",
    tallaCamisa: "8",
    tallaPantalon: "8",
    tallaZapatos: "2",
    intereses: "Fútbol, ciencias, videojuegos",
    estado: "Sin padrino",
  },
  {
    id: "3",
    nombre: "Ana",
    apellidos: "Rodríguez Pérez",
    fechaNacimiento: "2014-11-08",
    edad: 10,
    genero: "Femenino",
    escuela: "Escuela Primaria José María Morelos",
    tallaCamisa: "12",
    tallaPantalon: "12",
    tallaZapatos: "4",
    intereses: "Danza, matemáticas, animales",
    estado: "Entrega completada",
    eventoActual: "Navidad 2025",
  },
];

export const padrinosMock: Padrino[] = [
  {
    id: "1",
    nombre: "Roberto",
    apellidos: "Sánchez García",
    email: "roberto.sanchez@email.com",
    telefono: "555-1234",
    direccion: "Av. Principal 123, Col. Centro",
    fechaRegistro: "2024-01-15",
    metodoAuth: "Google",
    estado: "Activo",
    niñosApadrinados: 2,
  },
  {
    id: "2",
    nombre: "Laura",
    apellidos: "Fernández Torres",
    email: "laura.fernandez@email.com",
    telefono: "555-5678",
    direccion: "Calle Secundaria 456, Col. Norte",
    fechaRegistro: "2024-03-20",
    metodoAuth: "Normal",
    estado: "Activo",
    niñosApadrinados: 1,
  },
  {
    id: "3",
    nombre: "Miguel",
    apellidos: "Ramírez Cruz",
    email: "miguel.ramirez@email.com",
    telefono: "555-9012",
    direccion: "Blvd. Este 789, Col. Sur",
    fechaRegistro: "2023-11-05",
    metodoAuth: "Google",
    estado: "Activo",
    niñosApadrinados: 3,
  },
];

export const asignacionesMock: Asignacion[] = [
  {
    id: "1",
    niñoId: "1",
    padrinoId: "1",
    eventoId: "1",
    estado: "Aceptado",
    fechaCreacion: "2024-11-01",
  },
  {
    id: "2",
    niñoId: "3",
    padrinoId: "2",
    eventoId: "1",
    estado: "Verificada",
    fechaCreacion: "2024-10-15",
  },
];

export const eventosMock: Evento[] = [
  {
    id: "1",
    nombre: "Navidad 2025",
    tipo: "Navidad",
    fechaInicio: "2024-11-01",
    fechaFin: "2024-12-25",
    estado: "Activo",
    niñosIncluidos: 150,
    apadrinamientosActivos: 120,
  },
  {
    id: "2",
    nombre: "Día del Niño 2025",
    tipo: "Día del Niño",
    fechaInicio: "2025-03-01",
    fechaFin: "2025-04-30",
    estado: "Planeado",
    niñosIncluidos: 0,
    apadrinamientosActivos: 0,
  },
];

export const ubicacionesMock: Ubicacion[] = [
  {
    id: "1",
    nombre: "Centro Principal - Norte",
    direccion: "Av. Insurgentes Norte 1234",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    codigoPostal: "07300",
    latitud: 19.4978,
    longitud: -99.1269,
    capacidad: 200,
    contacto: "María González",
    telefono: "55-1234-5678",
    notas: "Centro principal con mayor capacidad",
    activo: true,
  },
  {
    id: "2",
    nombre: "Centro Sur - Coyoacán",
    direccion: "Av. Universidad 456",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    codigoPostal: "04510",
    latitud: 19.3467,
    longitud: -99.1619,
    capacidad: 150,
    contacto: "Juan Pérez",
    telefono: "55-2345-6789",
    notas: "Ubicación cercana a escuelas",
    activo: true,
  },
  {
    id: "3",
    nombre: "Centro Oriente - Iztapalapa",
    direccion: "Calz. Ermita Iztapalapa 789",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    codigoPostal: "09820",
    latitud: 19.3524,
    longitud: -99.0586,
    capacidad: 100,
    contacto: "Ana Martínez",
    telefono: "55-3456-7890",
    notas: "Centro en zona de alta demanda",
    activo: true,
  },
  {
    id: "4",
    nombre: "Centro Poniente - Santa Fe",
    direccion: "Av. Santa Fe 321",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    codigoPostal: "01219",
    latitud: 19.3595,
    longitud: -99.2606,
    capacidad: 80,
    contacto: "Carlos Ramírez",
    telefono: "55-4567-8901",
    notas: "Centro de acopio temporal",
    activo: false,
  },
];

// KPIs para dashboard
export const getKPIs = () => ({
  totalNiños: niñosMock.length,
  padrinosActivos: padrinosMock.filter(p => p.estado === "Activo").length,
  apadrinamientosActivos: asignacionesMock.filter(a => a.estado === "Aceptado" || a.estado === "Entrega registrada").length,
  entregasVerificadas: asignacionesMock.filter(a => a.estado === "Verificada").length,
  entregasPendientes: asignacionesMock.filter(a => a.estado === "Pendiente" || a.estado === "Entrega registrada").length,
});

export const cartasMock: Carta[] = [
  {
    id: "1",
    niñoId: "1",
    eventoId: "1",
    contenido: "Querido padrino, me gustaría recibir libros de ciencia y un set de pintura porque me encanta dibujar y aprender sobre los planetas.",
    estado: "Aprobada",
    fechaCarga: "2024-11-05",
  },
  {
    id: "2",
    niñoId: "2",
    eventoId: "1",
    contenido: "Hola! Me gusta mucho el fútbol y quisiera una pelota nueva y unos tenis deportivos. También me gustan los videojuegos de carreras.",
    estado: "Revisada",
    fechaCarga: "2024-11-08",
  },
  {
    id: "3",
    niñoId: "3",
    eventoId: "1",
    contenido: "Mi nombre es Ana y me encanta bailar. Sueño con tener un tutu de ballet y zapatillas de danza. También me gustaría un libro de matemáticas divertido.",
    estado: "Pendiente",
    fechaCarga: "2024-11-10",
  },
];

// Helpers para buscar datos
export const getNiñoById = (id: string) => niñosMock.find(n => n.id === id);
export const getPadrinoById = (id: string) => padrinosMock.find(p => p.id === id);
export const getEventoById = (id: string) => eventosMock.find(e => e.id === id);
export const getUbicacionById = (id: string) => ubicacionesMock.find(u => u.id === id);
export const getCartaById = (id: string) => cartasMock.find(c => c.id === id);

export const usuariosMock: Usuario[] = [
  {
    id: "1",
    nombre: "Ana García Rodríguez",
    email: "ana.garcia@smilelink.org",
    rol: "Superadmin",
    estado: "Activo",
    ultimoAcceso: "2024-11-20 10:30",
  },
  {
    id: "2",
    nombre: "Carlos Méndez López",
    email: "carlos.mendez@smilelink.org",
    rol: "Admin",
    estado: "Activo",
    ultimoAcceso: "2024-11-20 09:15",
  },
  {
    id: "3",
    nombre: "Laura Torres Pérez",
    email: "laura.torres@smilelink.org",
    rol: "Voluntario",
    estado: "Activo",
    ultimoAcceso: "2024-11-19 16:45",
  },
  {
    id: "4",
    nombre: "Miguel Ángel Ramírez",
    email: "miguel.ramirez@smilelink.org",
    rol: "Admin",
    estado: "Inactivo",
    ultimoAcceso: "2024-10-15 14:20",
  },
];
