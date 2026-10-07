package com.example.smilelinkapp.ui.screens.verification

import android.app.Application
import android.content.Context
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.Padrino
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class VerificationUiState(
    val padrino: Padrino? = null,
    val isLoading: Boolean = false,
    val isUploading: Boolean = false,
    val ineUri: Uri? = null,
    val rostroUri: Uri? = null,
    val successMessage: String? = null,
    val errorMessage: String? = null
)

class VerificationViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = SmileLinkRepository()
    private val sessionManager = SessionManager(application)

    private val _uiState = MutableStateFlow(
        VerificationUiState(padrino = sessionManager.getPadrino())
    )
    val uiState: StateFlow<VerificationUiState> = _uiState.asStateFlow()

    init {
        refreshPadrinoStatus()
    }

    fun refreshPadrinoStatus() {
        val padrinoId = sessionManager.getPadrinoId() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getPadrino(padrinoId)
                .onSuccess { updatedPadrino ->
                    sessionManager.updatePadrino(updatedPadrino)
                    _uiState.value = _uiState.value.copy(
                        padrino = updatedPadrino,
                        isLoading = false
                    )
                }
                .onFailure {
                    // Mantener el padrino de la sesión si falla la red
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
        }
    }

    fun setIneUri(uri: Uri?) {
        _uiState.value = _uiState.value.copy(ineUri = uri, errorMessage = null)
    }

    fun setRostroUri(uri: Uri?) {
        _uiState.value = _uiState.value.copy(rostroUri = uri, errorMessage = null)
    }

    fun uploadDocuments(context: Context) {
        val currentState = _uiState.value
        val padrinoId = sessionManager.getPadrinoId()

        if (padrinoId == null) {
            _uiState.value = currentState.copy(errorMessage = "No hay sesión activa")
            return
        }

        if (currentState.ineUri == null && currentState.rostroUri == null) {
            _uiState.value = currentState.copy(errorMessage = "Selecciona al menos una fotografía para continuar")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUploading = true, errorMessage = null, successMessage = null)

            val ineBytes = currentState.ineUri?.let { readBytesFromUri(context, it) }
            val rostroBytes = currentState.rostroUri?.let { readBytesFromUri(context, it) }

            repository.subirIdentificacion(
                padrinoId = padrinoId,
                ineBytes = ineBytes,
                ineFileName = "ine_${System.currentTimeMillis()}.jpg",
                rostroBytes = rostroBytes,
                rostroFileName = "rostro_${System.currentTimeMillis()}.jpg"
            ).onSuccess { response ->
                // Recargar información completa desde el backend
                repository.getPadrino(padrinoId).onSuccess { updatedPadrino ->
                    sessionManager.updatePadrino(updatedPadrino)
                    _uiState.value = _uiState.value.copy(
                        padrino = updatedPadrino,
                        isUploading = false,
                        ineUri = null,
                        rostroUri = null,
                        successMessage = response.mensaje ?: "Fotografías enviadas a revisión exitosamente"
                    )
                }.onFailure {
                    _uiState.value = _uiState.value.copy(
                        isUploading = false,
                        successMessage = response.mensaje ?: "Documentos recibidos"
                    )
                }
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isUploading = false,
                    errorMessage = error.message ?: "Error al subir documentos"
                )
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(successMessage = null, errorMessage = null)
    }

    private fun readBytesFromUri(context: Context, uri: Uri): ByteArray? {
        return try {
            context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        } catch (e: Exception) {
            null
        }
    }
}
