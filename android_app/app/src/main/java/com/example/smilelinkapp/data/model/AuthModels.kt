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
    val padrino: Padrino
)

data class ErrorResponse(
    val error: String
)
