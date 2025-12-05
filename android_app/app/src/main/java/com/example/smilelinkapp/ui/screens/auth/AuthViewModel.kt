package com.example.smilelinkapp.ui.screens.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.api.RetrofitClient
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.LoginRequest
import com.example.smilelinkapp.data.model.RegisterRequest
import com.example.smilelinkapp.data.model.Padrino
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
        // Validate inputs
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState.Error("Por favor completa todos los campos")
            return
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = AuthUiState.Error("Email inválido")
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
        // Validate inputs
        if (nombre.isBlank() || email.isBlank() || password.isBlank() || direccion.isBlank()) {
            _uiState.value = AuthUiState.Error("Por favor completa todos los campos obligatorios")
            return
        }
        
        if (nombre.length < 3) {
            _uiState.value = AuthUiState.Error("El nombre debe tener al menos 3 caracteres")
            return
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = AuthUiState.Error("Email inválido")
            return
        }
        
        if (password.length < 6) {
            _uiState.value = AuthUiState.Error("La contraseña debe tener al menos 6 caracteres")
            return
        }
        
        if (password != confirmPassword) {
            _uiState.value = AuthUiState.Error("Las contraseñas no coinciden")
            return
        }
        
        _uiState.value = AuthUiState.Loading
        
        viewModelScope.launch {
            try {
                val request = RegisterRequest(
                    nombre = nombre.trim(),
                    email = email.trim(),
                    password = password,
                    direccion = direccion.trim(),
                    telefono = telefono.trim()
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
