package com.example.smilelinkapp.ui.screens.detail

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.Apadrinamiento
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID

sealed class ChildDetailUiState {
    object Loading : ChildDetailUiState()
    data class Success(val nino: Nino) : ChildDetailUiState()
    data class Error(val message: String) : ChildDetailUiState()
}

class ChildDetailViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = SmileLinkRepository()
    private val sessionManager = SessionManager(application)
    
    private val _uiState = MutableStateFlow<ChildDetailUiState>(ChildDetailUiState.Loading)
    val uiState: StateFlow<ChildDetailUiState> = _uiState.asStateFlow()
    
    private val _sponsorshipInProgress = MutableStateFlow(false)
    val sponsorshipInProgress: StateFlow<Boolean> = _sponsorshipInProgress.asStateFlow()
    
    fun loadChild(childId: String) {
        viewModelScope.launch {
            _uiState.value = ChildDetailUiState.Loading
            
            repository.getNino(childId)
                .onSuccess { nino ->
                    _uiState.value = ChildDetailUiState.Success(nino)
                }
                .onFailure { error ->
                    _uiState.value = ChildDetailUiState.Error(
                        error.message ?: "Error al cargar información del niño"
                    )
                }
        }
    }
    
    fun sponsorChild(childId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _sponsorshipInProgress.value = true
            
            // Get current padrino from session
            val padrinoId = sessionManager.getPadrinoId()
            
            if (padrinoId == null) {
                _sponsorshipInProgress.value = false
                onError("No hay sesión activa")
                return@launch
            }
            
            // Generate unique ID for apadrinamiento
            val apadrinamientoId = "AP${System.currentTimeMillis().toString().takeLast(6)}"
            
            val apadrinamiento = Apadrinamiento(
                idApadrinamiento = apadrinamientoId,
                idPadrino = padrinoId,
                idNino = childId,
                fechaInicio = LocalDate.now().toString(),
                tipoApadrinamiento = "Elección Padrino",
                estadoApadrinamientoRegistro = "Activo"
            )
            
            repository.createApadrinamiento(apadrinamiento)
                .onSuccess {
                    _sponsorshipInProgress.value = false
                    onSuccess()
                }
                .onFailure { error ->
                    _sponsorshipInProgress.value = false
                    onError(error.message ?: "Error al crear apadrinamiento")
                }
        }
    }
}
