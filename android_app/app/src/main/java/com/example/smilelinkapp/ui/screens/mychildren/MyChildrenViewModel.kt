package com.example.smilelinkapp.ui.screens.mychildren

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.model.Apadrinamiento
import com.example.smilelinkapp.data.model.Entrega
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import android.content.Context
import android.net.Uri
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

data class SponsoredChildInfo(
    val nino: Nino,
    val apadrinamiento: Apadrinamiento,
    val entregas: List<Entrega>
)

sealed class MyChildrenUiState {
    object Loading : MyChildrenUiState()
    data class Success(val children: List<SponsoredChildInfo>) : MyChildrenUiState()
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

            val currentPadrinoId = sessionManager.getPadrinoId()
            if (currentPadrinoId == null) {
                _uiState.value = MyChildrenUiState.Error("No hay sesión activa")
                return@launch
            }

            try {
                // 1. Fetch all sponsorships for this padrino
                val apadrinamientosResult = repository.getApadrinamientosForPadrino(currentPadrinoId)
                if (apadrinamientosResult.isFailure) {
                    _uiState.value = MyChildrenUiState.Error(
                        apadrinamientosResult.exceptionOrNull()?.message ?: "Error al cargar apadrinamientos"
                    )
                    return@launch
                }

                val apadrinamientos = apadrinamientosResult.getOrNull() ?: emptyList()
                if (apadrinamientos.isEmpty()) {
                    _uiState.value = MyChildrenUiState.Empty
                    return@launch
                }

                // 2. Load all niños and entregas IN PARALLEL (one async per sponsorship)
                val childrenInfo = apadrinamientos
                    .map { apadrinamiento ->
                        async {
                            // Fetch niño and entregas concurrently for this sponsorship
                            val ninoDeferred = async {
                                repository.getNino(apadrinamiento.idNino)
                            }
                            val entregasDeferred = async {
                                repository.getEntregasForApadrinamiento(apadrinamiento.idApadrinamiento)
                            }
                            val ninoResult = ninoDeferred.await()
                            val entregasResult = entregasDeferred.await()

                            if (ninoResult.isSuccess) {
                                SponsoredChildInfo(
                                    nino = ninoResult.getOrNull()!!,
                                    apadrinamiento = apadrinamiento,
                                    entregas = entregasResult.getOrNull() ?: emptyList()
                                )
                            } else null
                        }
                    }
                    .awaitAll()
                    .filterNotNull()

                _uiState.value = if (childrenInfo.isEmpty()) {
                    MyChildrenUiState.Empty
                } else {
                    MyChildrenUiState.Success(childrenInfo)
                }

            } catch (e: Exception) {
                _uiState.value = MyChildrenUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }
    
    fun uploadEvidence(
        context: Context,
        entregaId: String,
        uri: Uri,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val contentResolver = context.contentResolver
                val type = contentResolver.getType(uri) ?: "image/*"
                
                val ext = when (type) {
                    "image/jpeg" -> ".jpg"
                    "image/png" -> ".png"
                    "image/webp" -> ".webp"
                    else -> ".jpg"
                }
                
                val file = File(context.cacheDir, "evidencia_${entregaId}_${System.currentTimeMillis()}$ext")
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    FileOutputStream(file).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
                
                val requestFile = file.asRequestBody(type.toMediaTypeOrNull())
                val archivoPart = MultipartBody.Part.createFormData("archivo", file.name, requestFile)
                
                val subidoPor = "Padrino".toRequestBody("text/plain".toMediaTypeOrNull())
                val descripcion = "Evidencia subida desde la app móvil".toRequestBody("text/plain".toMediaTypeOrNull())
                
                val result = repository.uploadEvidencia(entregaId, archivoPart, subidoPor, descripcion)
                
                if (result.isSuccess) {
                    onSuccess()
                    loadSponsoredChildren()
                } else {
                    val errMsg = result.exceptionOrNull()?.message ?: "Error al subir la evidencia"
                    onError(errMsg)
                }
            } catch (e: Exception) {
                onError(e.message ?: "Error al procesar la imagen")
            }
        }
    }
}
