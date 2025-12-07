package com.example.smilelinkapp.data.model

import com.google.gson.annotations.SerializedName

/**
 * Data model for a Child (Niño)
 */
data class Nino(
    @SerializedName("id_nino")
    val idNino: String = "",
    
    @SerializedName("nombre")
    val nombre: String,
    
    @SerializedName("edad")
    val edad: Int,
    
    @SerializedName("genero")
    val genero: String, // "Masculino" or "Femenino"
    
    @SerializedName("descripcion")
    val descripcion: String,
    
    @SerializedName("necesidades")
    val necesidades: List<String>,
    
    @SerializedName("id_padrino_actual")
    val idPadrinoActual: String? = null,
    
    @SerializedName("estado_apadrinamiento")
    val estadoApadrinamiento: String = "Disponible", // "Disponible" or "Apadrinado"
    
    @SerializedName("fecha_apadrinamiento_actual")
    val fechaApadrinamientoActual: String? = null,
    
    @SerializedName("avatar_url")
    val avatarUrl: String? = null
)

/**
 * Data model for a Sponsor (Padrino)
 */
data class Padrino(
    @SerializedName("id_padrino")
    val idPadrino: String = "",
    
    @SerializedName("nombre")
    val nombre: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password_hash")
    val passwordHash: String? = null,
    
    @SerializedName("fecha_registro")
    val fechaRegistro: String,
    
    @SerializedName("id_google_auth")
    val idGoogleAuth: String? = null,
    
    @SerializedName("direccion")
    val direccion: String? = null,
    
    @SerializedName("telefono")
    val telefono: String? = null,
    
    @SerializedName("foto_perfil")
    val fotoPerfil: String? = null,
    
    @SerializedName("historial_apadrinamiento_ids")
    val historialApadrinamientoIds: List<String> = emptyList()
)

/**
 * Data model for Sponsorship (Apadrinamiento)
 */
data class Apadrinamiento(
    @SerializedName("id_apadrinamiento")
    val idApadrinamiento: String = "",
    
    @SerializedName("id_padrino")
    val idPadrino: String,
    
    @SerializedName("id_nino")
    val idNino: String,
    
    @SerializedName("fecha_inicio")
    val fechaInicio: String,
    
    @SerializedName("fecha_fin")
    val fechaFin: String? = null,
    
    @SerializedName("tipo_apadrinamiento")
    val tipoApadrinamiento: String, // "Aleatorio" or "Elección Padrino"
    
    @SerializedName("estado_apadrinamiento_registro")
    val estadoApadrinamientoRegistro: String = "Activo", // "Activo", "Finalizado", "Entregado"
    
    @SerializedName("entregas_ids")
    val entregasIds: List<String> = emptyList(),
    
    @SerializedName("ubicacion_entrega_lat")
    val ubicacionEntregaLat: Double? = null,
    
    @SerializedName("ubicacion_entrega_lng")
    val ubicacionEntregaLng: Double? = null,
    
    @SerializedName("direccion_entrega")
    val direccionEntrega: String? = null,
    
    @SerializedName("id_punto_entrega")
    val idPuntoEntrega: String? = null
)

/**
 * Data model for Delivery (Entrega)
 */
data class Entrega(
    @SerializedName("id_entrega")
    val idEntrega: String = "",
    
    @SerializedName("id_apadrinamiento")
    val idApadrinamiento: String,
    
    @SerializedName("descripcion_regalo")
    val descripcionRegalo: String,
    
    @SerializedName("fecha_programada")
    val fechaProgramada: String,
    
    @SerializedName("fecha_entrega_real")
    val fechaEntregaReal: String? = null,
    
    @SerializedName("estado_entrega")
    val estadoEntrega: String = "Pendiente", // "Pendiente", "En Proceso", "Entregado"
    
    @SerializedName("observaciones")
    val observaciones: String? = null,
    
    @SerializedName("id_punto_entrega")
    val idPuntoEntrega: String,
    
    @SerializedName("evidencia_foto_path")
    val evidenciaFotoPath: String? = null
)

/**
 * Data model for Delivery Point (Punto de Entrega)
 */
data class PuntoEntrega(
    @SerializedName("id_punto_entrega")
    val idPuntoEntrega: String = "",
    
    @SerializedName("nombre_punto")
    val nombrePunto: String,
    
    @SerializedName("direccion_fisica")
    val direccionFisica: String,
    
    @SerializedName("latitud")
    val latitud: Double,
    
    @SerializedName("longitud")
    val longitud: Double,
    
    @SerializedName("horario_atencion")
    val horarioAtencion: String? = null,
    
    @SerializedName("contacto_referencia")
    val contactoReferencia: String? = null,
    
    @SerializedName("estado_punto")
    val estadoPunto: String = "Activo" // "Activo" or "Inactivo"
)

/**
 * Data model for Gift Request (Solicitud de Regalo)
 */
data class SolicitudRegalo(
    @SerializedName("id_solicitud")
    val idSolicitud: String = "",
    
    @SerializedName("id_nino")
    val idNino: String,
    
    @SerializedName("id_padrino_interesado")
    val idPadrinoInteresado: String? = null,
    
    @SerializedName("descripcion_solicitud")
    val descripcionSolicitud: String,
    
    @SerializedName("fecha_solicitud")
    val fechaSolicitud: String,
    
    @SerializedName("fecha_cierre")
    val fechaCierre: String? = null,
    
    @SerializedName("estado_solicitud")
    val estadoSolicitud: String = "Abierta", // "Abierta", "En Proceso", "Cumplida"
    
    @SerializedName("id_entrega_asociada")
    val idEntregaAsociada: String? = null
)
