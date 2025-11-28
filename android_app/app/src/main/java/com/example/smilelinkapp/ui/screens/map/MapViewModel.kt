package com.example.smilelinkapp.ui.screens.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.model.PuntoEntrega
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class MapUiState {
    object Loading : MapUiState()
    data class Success(val deliveryPoints: List<PuntoEntrega>) : MapUiState()
    data class Error(val message: String) : MapUiState()
}

class MapViewModel : ViewModel() {
    
    private val repository = SmileLinkRepository()
    
    private val _uiState = MutableStateFlow<MapUiState>(MapUiState.Loading)
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()
    
    private val _selectedPoint = MutableStateFlow<PuntoEntrega?>(null)
    val selectedPoint: StateFlow<PuntoEntrega?> = _selectedPoint.asStateFlow()
    
    init {
        loadDeliveryPoints()
    }
    
    fun loadDeliveryPoints() {
        viewModelScope.launch {
            _uiState.value = MapUiState.Loading
            
            repository.getPuntosEntrega()
                .onSuccess { points ->
                    _uiState.value = MapUiState.Success(points.filter { it.estadoPunto == "Activo" })
                }
                .onFailure { error ->
                    _uiState.value = MapUiState.Error(
                        error.message ?: "Error al cargar puntos de entrega"
                    )
                }
        }
    }
    
    fun selectPoint(point: PuntoEntrega?) {
        _selectedPoint.value = point
    }
}
