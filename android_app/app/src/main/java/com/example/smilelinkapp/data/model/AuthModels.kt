package com.example.smilelinkapp.data.model

import com.google.gson.annotations.SerializedName

/**
 * Authentication request/response models
 */

data class RegisterRequest(
    val nombre: String,
    val email: String,
    val password: String,
    val direccion: String,
    val telefono: String = ""
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val message: String,
    val padrino: Padrino,
    val token: String? = null
)

data class ErrorResponse(
    val error: String,
    @SerializedName("puede_apadrinar")
    val puedeApadrinar: Boolean? = null,
    @SerializedName("estado_verificacion")
    val estadoVerificacion: String? = null,
    @SerializedName("motivo_rechazo")
    val motivoRechazo: String? = null
)

data class VerificationUploadResponse(
    val mensaje: String? = null,
    @SerializedName("estado_verificacion")
    val estadoVerificacion: String? = null,
    @SerializedName("ia_sospecha")
    val iaSospecha: Boolean? = null
)
