package com.example.smilelinkapp.ui.screens.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.api.RetrofitClient
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.LoginRequest
import com.example.smilelinkapp.data.model.RegisterRequest
import com.example.smilelinkapp.data.model.Padrino
import com.example.smilelinkapp.utils.ValidationUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val padrino: Padrino) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    
    private val api = RetrofitClient.apiService
    private val sessionManager = SessionManager(application)
    
    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState
    
    /**
     * Login with email and password
     */
    fun login(email: String, password: String) {
        // Validate email
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.EMAIL_REQUIRED)
            return
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.EMAIL_INVALID)
            return
        }
        
        // Validate password
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_REQUIRED)
            return
        }
        
        if (password.length < 6) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_TOO_SHORT)
            return
        }
        
        _uiState.value = AuthUiState.Loading
        
        viewModelScope.launch {
            try {
                val response = api.login(LoginRequest(email.trim(), password))
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    sessionManager.saveSession(authResponse.padrino)
                    _uiState.value = AuthUiState.Success(authResponse.padrino)
                } else {
                    val errorMsg = when (response.code()) {
                        401 -> "Contraseña incorrecta"
                        404 -> "Email no registrado"
                        else -> "Error al iniciar sesión"
                    }
                    _uiState.value = AuthUiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error("Error de conexión: ${e.message}")
            }
        }
    }
    
    /**
     * Register new padrino
     */
    fun register(
        nombre: String,
        email: String,
        password: String,
        confirmPassword: String,
        telefono: String,
        direccion: String
    ) {
        // Validate nombre
        if (nombre.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.NAME_REQUIRED)
            return
        }
        
        if (!ValidationUtils.isValidName(nombre)) {
            val trimmedName = nombre.trim()
            when {
                trimmedName.length < 2 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.NAME_TOO_SHORT)
                }
                trimmedName.length > 100 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.NAME_TOO_LONG)
                }
                else -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.NAME_INVALID)
                }
            }
            return
        }
        
        // Validate email
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.EMAIL_REQUIRED)
            return
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.EMAIL_INVALID)
            return
        }
        
        // Validate password
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_REQUIRED)
            return
        }
        
        if (!ValidationUtils.isValidPassword(password)) {
            when {
                password.length < 6 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_TOO_SHORT)
                }
                password.length > 50 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_TOO_LONG)
                }
                else -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORD_TOO_SHORT)
                }
            }
            return
        }
        
        // Validate confirm password
        if (password != confirmPassword) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PASSWORDS_DONT_MATCH)
            return
        }
        
        // Validate telefono (opcional, pero si se proporciona debe ser válido)
        if (telefono.isNotBlank() && !ValidationUtils.isValidPhone(telefono)) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.PHONE_INVALID)
            return
        }
        
        // Validate direccion
        if (direccion.isBlank()) {
            _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.ADDRESS_REQUIRED)
            return
        }
        
        if (!ValidationUtils.isValidAddress(direccion)) {
            val trimmedAddress = direccion.trim()
            when {
                trimmedAddress.length < 5 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.ADDRESS_TOO_SHORT)
                }
                trimmedAddress.length > 200 -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.ADDRESS_TOO_LONG)
                }
                else -> {
                    _uiState.value = AuthUiState.Error(ValidationUtils.ErrorMessages.ADDRESS_TOO_SHORT)
                }
            }
            return
        }
        
        _uiState.value = AuthUiState.Loading
        
        viewModelScope.launch {
            try {
                // Limpiar teléfono (solo números)
                val cleanTelefono = if (telefono.isNotBlank()) {
                    ValidationUtils.cleanPhone(telefono)
                } else {
                    ""
                }
                
                val request = RegisterRequest(
                    nombre = nombre.trim(),
                    email = email.trim().lowercase(),
                    password = password,
                    direccion = direccion.trim(),
                    telefono = cleanTelefono
                )
                
                val response = api.register(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    sessionManager.saveSession(authResponse.padrino)
                    _uiState.value = AuthUiState.Success(authResponse.padrino)
                } else {
                    val errorMsg = when (response.code()) {
                        400 -> "Este email ya está registrado"
                        else -> "Error al registrarse"
                    }
                    _uiState.value = AuthUiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error("Error de conexión: ${e.message}")
            }
        }
    }
    
    /**
     * Reset state to idle
     */
    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
    
    /**
     * Login with Google
     */
    fun googleLogin(token: String) {
        _uiState.value = AuthUiState.Loading
        
        viewModelScope.launch {
            try {
                val response = api.googleLogin(mapOf("token" to token))
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    sessionManager.saveSession(authResponse.padrino)
                    _uiState.value = AuthUiState.Success(authResponse.padrino)
                } else {
                    _uiState.value = AuthUiState.Error("Error en login con Google")
                }
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error("Error de conexión: ${e.message}")
            }
        }
    }
}
