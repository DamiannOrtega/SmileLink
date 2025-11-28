SmileLink Data Models (JSON Schema)Architecture Note: The system uses a Distributed File System (NFS + HDFS). There is no relational database.Data is stored as JSON files encrypted with AES-256 before being written to disk.1. Padrino (Godparent)File Path: padrinos/{id_padrino}.json.encDescription: Registered donors who support children.{
  "id_padrino": "P001",              // PK, String
  "nombre": "Juan Damián Ortega",    // String (Required)
  "email": "juan@smilelink.org",     // String (Unique, Required)
  "password_hash": "sha256_hash...", // String (Required if no Google Auth)
  "fecha_registro": "2025-10-20",    // Date (YYYY-MM-DD)
  "id_google_auth": "google_12345",  // String (Optional, from Google API)
  "direccion": "Av. Universidad 100",// String
  "telefono": "449-123-4567",        // String
  "historial_apadrinamiento_ids": ["AP001", "AP005"] // List<String> (FKs to Apadrinamiento)
}
2. Niño (Child)File Path: ninos/{id_nino}.json.encDescription: Beneficiaries receiving support.{
  "id_nino": "N001",                 // PK, String
  "nombre": "Sofía Martínez",        // String
  "edad": 8,                         // Integer
  "genero": "Femenino",              // String
  "descripcion": "Le gusta dibujar y los gatos.", // String
  "necesidades": ["Mochila", "Zapatos escolares"], // List<String>
  "id_padrino_actual": "P001",       // FK to Padrino (Nullable/Optional)
  "estado_apadrinamiento": "Apadrinado", // String (e.g., "Disponible", "Apadrinado")
  "fecha_apadrinamiento_actual": "2025-11-01" // Date (Nullable)
}
3. Apadrinamiento (Assignment)File Path: apadrinamientos/{id_apadrinamiento}.json.encDescription: Linking entity between a Child and a Godparent.{
  "id_apadrinamiento": "AP001",      // PK, String
  "id_padrino": "P001",              // FK to Padrino
  "id_nino": "N001",                 // FK to Niño
  "fecha_inicio": "2025-11-01",      // Date
  "fecha_fin": null,                 // Date (Nullable)
  "tipo_apadrinamiento": "Elección Padrino", // String (e.g., "Aleatorio", "Elección")
  "estado_apadrinamiento_registro": "Activo", // String (e.g., "Activo", "Finalizado")
  "entregas_ids": ["E001", "E002"]   // List<String> (FKs to Entrega)
}
4. Entrega (Delivery)File Path: entregas/{id_entrega}.json.encDescription: Tracking of gifts delivered.{
  "id_entrega": "E001",              // PK, String
  "id_apadrinamiento": "AP001",      // FK to Apadrinamiento
  "descripcion_regalo": "Bicicleta roja", // String
  "fecha_programada": "2025-12-24",  // Date
  "fecha_entrega_real": "2025-12-23",// Date (Nullable)
  "estado_entrega": "Entregado",     // String (e.g., "Pendiente", "En Proceso", "Entregado")
  "observaciones": "Entregado a la madre del niño", // String
  "id_punto_entrega": "PE001",       // FK to PuntoEntrega
  
  // Additional field for file storage logic
  "evidencia_foto_path": "/uploads/E001_proof.jpg.enc" // Path to encrypted image
}
5. SolicitudRegalo (Wishlist/Request)File Path: solicitudes/{id_solicitud}.json.encDescription: Specific requests made by the child/foundation.{
  "id_solicitud": "SR001",           // PK, String
  "id_nino": "N001",                 // FK to Niño
  "id_padrino_interesado": "P001",   // FK to Padrino (Nullable)
  "descripcion_solicitud": "Zapatos talla 22", // String
  "fecha_solicitud": "2025-11-15",   // Date
  "fecha_cierre": null,              // Date (Nullable)
  "estado_solicitud": "En Proceso",  // String (e.g., "Abierta", "Cumplida")
  "id_entrega_asociada": "E001"      // FK to Entrega (Nullable)
}
6. PuntoEntrega (Location)File Path: puntos_entrega/{id_punto_entrega}.json.encDescription: Physical locations for gathering gifts.{
  "id_punto_entrega": "PE001",       // PK, String
  "nombre_punto": "Centro de Acopio Norte", // String
  "direccion_fisica": "Calle Norte 45, Centro", // String
  "latitud": 21.8853,                // Decimal (Float)
  "longitud": -102.2916,             // Decimal (Float)
  "horario_atencion": "Lun-Vie 9:00-17:00", // String
  "contacto_referencia": "Sra. Martha", // String
  "estado_punto": "Activo"           // String
}
7. Administrador (Admin User)File Path: admins/{id_admin}.json.encDescription: System administrators (Web platform users).{
  "id_admin": "A001",                // PK, String
  "nombre": "Admin Principal",       // String
  "email": "admin@smilelink.org",    // String
  "password_hash": "sha256_hash...", // String
  "fecha_registro": "2025-01-01",    // Date
  "rol": "Superadmin"                // String (e.g., "Gestor", "Superadmin")
}
