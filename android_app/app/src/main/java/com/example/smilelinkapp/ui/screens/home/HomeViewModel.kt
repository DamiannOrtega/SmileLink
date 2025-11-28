package com.example.smilelinkapp.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * UI State for Home Screen
 */
sealed class HomeUiState {
    object Loading : HomeUiState()
    data class Success(val ninos: List<Nino>) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}

/**
 * ViewModel for Home (Discovery) Screen
 */
class HomeViewModel : ViewModel() {
    
    private val repository = SmileLinkRepository()
    
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    init {
        loadAvailableChildren()
    }
    
    fun loadAvailableChildren() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            
            repository.getAvailableNinos()
                .onSuccess { ninos ->
                    _uiState.value = HomeUiState.Success(ninos)
                }
                .onFailure { error ->
                    _uiState.value = HomeUiState.Error(
                        error.message ?: "Error al cargar los niños"
                    )
                }
        }
    }
    
    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }
    
    fun getFilteredChildren(ninos: List<Nino>): List<Nino> {
        val query = _searchQuery.value
        if (query.isBlank()) return ninos
        
        return ninos.filter { nino ->
            nino.nombre.contains(query, ignoreCase = true) ||
            nino.descripcion.contains(query, ignoreCase = true) ||
            nino.necesidades.any { it.contains(query, ignoreCase = true) }
        }
    }
}
