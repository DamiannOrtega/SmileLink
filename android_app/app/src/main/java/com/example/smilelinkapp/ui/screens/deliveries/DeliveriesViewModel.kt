package com.example.smilelinkapp.ui.screens.deliveries

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.Apadrinamiento
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.data.model.PuntoEntrega
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for Deliveries Screen
 */
class DeliveriesViewModel : ViewModel() {
    
    private val repository = SmileLinkRepository()
    
    private val _uiState = MutableStateFlow(DeliveriesUiState())
    val uiState: StateFlow<DeliveriesUiState> = _uiState.asStateFlow()
    
    fun loadDeliveries(context: Context) {
        val sessionManager = SessionManager(context)
        val padrinoId = sessionManager.getPadrinoId() ?: return
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                // Get apadrinamientos for the current padrino
                val apadrinamientosResult = repository.getApadrinamientosForPadrino(padrinoId)
                
                if (apadrinamientosResult.isFailure) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = apadrinamientosResult.exceptionOrNull()?.message ?: "Error desconocido"
                    )
                    return@launch
                }
                
                val apadrinamientos = apadrinamientosResult.getOrNull() ?: emptyList()
                
                // Filter only active sponsorships (location is optional now)
                val activeDeliveries = apadrinamientos.filter { 
                    it.estadoApadrinamientoRegistro == "Activo"
                }
                
                // Load ninos data
                val ninosMap = mutableMapOf<String, Nino>()
                activeDeliveries.forEach { apadrinamiento ->
                    val ninoResult = repository.getNino(apadrinamiento.idNino)
                    ninoResult.getOrNull()?.let { nino ->
                        ninosMap[nino.idNino] = nino
                    }
                }
                
                // Load puntos de entrega
                val puntosResult = repository.getPuntosEntrega()
                val puntosMap = puntosResult.getOrNull()?.associateBy { it.idPuntoEntrega } ?: emptyMap()
                
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    apadrinamientos = activeDeliveries,
                    ninosMap = ninosMap,
                    puntosEntregaMap = puntosMap,
                    error = null
                )
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Error al cargar entregas"
                )
            }
        }
    }
    
    fun markAsDelivered(apadrinamientoId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdating = true)
            
            try {
                val apadrinamiento = _uiState.value.apadrinamientos.find { 
                    it.idApadrinamiento == apadrinamientoId 
                }
                
                if (apadrinamiento != null) {
                    // Get child name for delivery description
                    val nino = _uiState.value.ninosMap[apadrinamiento.idNino]
                    val ninoName = nino?.nombre ?: "Niño"
                    
                    // Get punto de entrega - use first available or empty string
                    val puntoEntregaId = _uiState.value.puntosEntregaMap.keys.firstOrNull() ?: ""
                    
                    if (puntoEntregaId.isEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            isUpdating = false,
                            error = "No hay puntos de entrega disponibles"
                        )
                        return@launch
                    }
                    
                    // Get current date in ISO format
                    val currentDate = java.time.LocalDate.now().toString()
                    
                    // Step 1: Create Entrega record
                    val nuevaEntrega = com.example.smilelinkapp.data.model.Entrega(
                        idApadrinamiento = apadrinamientoId,
                        descripcionRegalo = "Regalo para $ninoName",
                        fechaProgramada = currentDate,
                        fechaEntregaReal = currentDate,
                        estadoEntrega = "Entregado",
                        observaciones = "Entrega realizada desde la app móvil",
                        idPuntoEntrega = puntoEntregaId
                    )
                    
                    val entregaResult = repository.createEntrega(nuevaEntrega)
                    
                    if (entregaResult.isFailure) {
                        _uiState.value = _uiState.value.copy(
                            isUpdating = false,
                            error = "Error al crear registro de entrega: ${entregaResult.exceptionOrNull()?.message}"
                        )
                        return@launch
                    }
                    
                    // Step 2: Update Apadrinamiento status
                    val updatedApadrinamiento = apadrinamiento.copy(
                        estadoApadrinamientoRegistro = "Entregado"
                    )
                    
                    val result = repository.updateApadrinamiento(apadrinamientoId, updatedApadrinamiento)
                    
                    if (result.isSuccess) {
                        // Update local state - remove from active deliveries
                        val updatedList = _uiState.value.apadrinamientos.filter { 
                            it.idApadrinamiento != apadrinamientoId 
                        }
                        
                        _uiState.value = _uiState.value.copy(
                            apadrinamientos = updatedList,
                            isUpdating = false,
                            deliverySuccess = true
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isUpdating = false,
                            error = "Error al actualizar el estado de apadrinamiento: ${result.exceptionOrNull()?.message}"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isUpdating = false,
                    error = e.message ?: "Error al marcar como entregado"
                )
            }
        }
    }
    
    fun clearDeliverySuccess() {
        _uiState.value = _uiState.value.copy(deliverySuccess = false)
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class DeliveriesUiState(
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val apadrinamientos: List<Apadrinamiento> = emptyList(),
    val ninosMap: Map<String, Nino> = emptyMap(),
    val puntosEntregaMap: Map<String, PuntoEntrega> = emptyMap(),
    val error: String? = null,
    val deliverySuccess: Boolean = false
)

