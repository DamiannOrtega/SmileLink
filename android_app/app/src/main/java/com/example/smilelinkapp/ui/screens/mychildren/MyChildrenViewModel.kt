package com.example.smilelinkapp.ui.screens.mychildren

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.Apadrinamiento
import com.example.smilelinkapp.data.model.Entrega
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SponsoredChildInfo(
    val nino: Nino,
    val apadrinamiento: Apadrinamiento,
    val entregas: List<Entrega>
)

sealed class MyChildrenUiState {
    object Loading : MyChildrenUiState()
    data class Success(
        val children: List<SponsoredChildInfo>,
        val history: List<SponsoredChildInfo> = emptyList()
    ) : MyChildrenUiState()
    data class Error(val message: String) : MyChildrenUiState()
    object Empty : MyChildrenUiState()
}

class MyChildrenViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = SmileLinkRepository()
    private val sessionManager = SessionManager(application)
    
    private val _uiState = MutableStateFlow<MyChildrenUiState>(MyChildrenUiState.Loading)
    val uiState: StateFlow<MyChildrenUiState> = _uiState.asStateFlow()
    
    init {
        loadSponsoredChildren()
    }
    
    fun loadSponsoredChildren() {
        viewModelScope.launch {
            _uiState.value = MyChildrenUiState.Loading
            
            // Get current padrino from session
            val currentPadrinoId = sessionManager.getPadrinoId()
            
            if (currentPadrinoId == null) {
                _uiState.value = MyChildrenUiState.Error("No hay sesión activa")
                return@launch
            }
            
            try {
                // Get sponsorships for current padrino
                val apadrinamientosResult = repository.getApadrinamientosForPadrino(currentPadrinoId)
                
                if (apadrinamientosResult.isFailure) {
                    _uiState.value = MyChildrenUiState.Error(
                        apadrinamientosResult.exceptionOrNull()?.message ?: "Error al cargar apadrinamientos"
                    )
                    return@launch
                }
                
                val apadrinamientos = apadrinamientosResult.getOrNull() ?: emptyList()
                
                // Get details for all sponsorships
                val activeChildrenInfo = mutableListOf<SponsoredChildInfo>()
                val historyChildrenInfo = mutableListOf<SponsoredChildInfo>()
                
                for (apadrinamiento in apadrinamientos) {
                    val ninoResult = repository.getNino(apadrinamiento.idNino)
                    val entregasResult = repository.getEntregasForApadrinamiento(apadrinamiento.idApadrinamiento)
                    
                    if (ninoResult.isSuccess) {
                        val info = SponsoredChildInfo(
                            nino = ninoResult.getOrNull()!!,
                            apadrinamiento = apadrinamiento,
                            entregas = entregasResult.getOrNull() ?: emptyList()
                        )
                        
                        if (apadrinamiento.estadoApadrinamientoRegistro == "Activo") {
                            activeChildrenInfo.add(info)
                        } else {
                            historyChildrenInfo.add(info)
                        }
                    }
                }
                
                if (activeChildrenInfo.isEmpty() && historyChildrenInfo.isEmpty()) {
                    _uiState.value = MyChildrenUiState.Empty
                } else {
                    _uiState.value = MyChildrenUiState.Success(activeChildrenInfo, historyChildrenInfo)
                }
                
            } catch (e: Exception) {
                _uiState.value = MyChildrenUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }
}
