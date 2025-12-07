package com.example.smilelinkapp.data.repository

import com.example.smilelinkapp.config.AppConfig
import com.example.smilelinkapp.data.api.RetrofitClient
import com.example.smilelinkapp.data.mock.MockDataProvider
import com.example.smilelinkapp.data.model.*
import kotlinx.coroutines.delay
import okhttp3.MediaType.Companion.toMediaTypeOrNull

/**
 * Repository for managing SmileLink data
 * Implements the Repository pattern to abstract data sources
 */
class SmileLinkRepository {
    
    private val apiService = RetrofitClient.apiService
    
    // ===== NIÑOS (Children) =====
    
    suspend fun getNinos(): Result<List<Nino>> {
        return if (AppConfig.USE_MOCK) {
            delay(500) // Simulate network delay
            Result.success(MockDataProvider.mockNinos)
        } else {
            try {
                val response = apiService.getNinos()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun getAvailableNinos(): Result<List<Nino>> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(MockDataProvider.getAvailableNinos())
        } else {
            try {
                val response = apiService.getNinos()
                if (response.isSuccessful && response.body() != null) {
                    val available = response.body()!!.filter { it.estadoApadrinamiento == "Disponible" }
                    Result.success(available)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun getNino(id: String): Result<Nino> {
        return if (AppConfig.USE_MOCK) {
            delay(300)
            val nino = MockDataProvider.mockNinos.find { it.idNino == id }
            if (nino != null) {
                Result.success(nino)
            } else {
                Result.failure(Exception("Niño no encontrado"))
            }
        } else {
            try {
                val response = apiService.getNino(id)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    // ===== PADRINOS (Sponsors) =====
    
    suspend fun getPadrino(id: String): Result<Padrino> {
        return if (AppConfig.USE_MOCK) {
            delay(300)
            val padrino = MockDataProvider.mockPadrinos.find { it.idPadrino == id }
            if (padrino != null) {
                Result.success(padrino)
            } else {
                Result.failure(Exception("Padrino no encontrado"))
            }
        } else {
            try {
                val response = apiService.getPadrino(id)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun createPadrino(padrino: Padrino): Result<Padrino> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(padrino.copy(idPadrino = "P${System.currentTimeMillis()}"))
        } else {
            try {
                val response = apiService.createPadrino(padrino)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun updatePadrino(id: String, padrino: Padrino): Result<Padrino> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(padrino)
        } else {
            try {
                val response = apiService.updatePadrino(id, padrino)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()} - ${response.message()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    // ===== APADRINAMIENTOS (Sponsorships) =====
    
    suspend fun getApadrinamientosForPadrino(padrinoId: String): Result<List<Apadrinamiento>> {
        return if (AppConfig.USE_MOCK) {
            delay(400)
            Result.success(MockDataProvider.getApadrinamientosForPadrino(padrinoId))
        } else {
            try {
                val response = apiService.getApadrinamientos()
                if (response.isSuccessful && response.body() != null) {
                    val filtered = response.body()!!.filter { it.idPadrino == padrinoId }
                    Result.success(filtered)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun createApadrinamiento(apadrinamiento: Apadrinamiento): Result<Apadrinamiento> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(apadrinamiento.copy(idApadrinamiento = "AP${System.currentTimeMillis()}"))
        } else {
            try {
                val response = apiService.createApadrinamiento(apadrinamiento)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun updateApadrinamiento(id: String, apadrinamiento: Apadrinamiento): Result<Apadrinamiento> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(apadrinamiento)
        } else {
            try {
                val response = apiService.updateApadrinamiento(id, apadrinamiento)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    // ===== ENTREGAS (Deliveries) =====
    
    suspend fun getEntregasForApadrinamiento(apadrinamientoId: String): Result<List<Entrega>> {
        return if (AppConfig.USE_MOCK) {
            delay(400)
            Result.success(MockDataProvider.getEntregasForApadrinamiento(apadrinamientoId))
        } else {
            try {
                val response = apiService.getEntregas()
                if (response.isSuccessful && response.body() != null) {
                    val filtered = response.body()!!.filter { it.idApadrinamiento == apadrinamientoId }
                    Result.success(filtered)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun createEntrega(entrega: Entrega): Result<Entrega> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(entrega.copy(idEntrega = "E${System.currentTimeMillis()}"))
        } else {
            try {
                val response = apiService.createEntrega(entrega)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    suspend fun updateEntrega(id: String, entrega: Entrega): Result<Entrega> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(entrega)
        } else {
            try {
                val response = apiService.updateEntrega(id, entrega)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    suspend fun uploadEvidence(entregaId: String, imageUri: android.net.Uri, context: android.content.Context): Result<String> {
        return if (AppConfig.USE_MOCK) {
            delay(1000)
            Result.success("mock_evidence_url.jpg")
        } else {
            try {
                val contentResolver = context.contentResolver
                val inputStream = contentResolver.openInputStream(imageUri)
                    ?: return Result.failure(Exception("No se pudo abrir la imagen"))
                
                val bytes = inputStream.readBytes()
                inputStream.close()
                
                val requestFile = okhttp3.RequestBody.create(
                    "image/*".toMediaTypeOrNull(),
                    bytes
                )
                
                val body = okhttp3.MultipartBody.Part.createFormData("file", "evidence.jpg", requestFile)
                
                val response = apiService.uploadDeliveryEvidence(entregaId, body)
                if (response.isSuccessful && response.body() != null) {
                    val url = response.body()!!["evidence_url"] ?: ""
                    Result.success(url)
                } else {
                    Result.failure(Exception("Error subiendo evidencia: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    // ===== PUNTOS DE ENTREGA (Delivery Points) =====
    
    suspend fun getPuntosEntrega(): Result<List<PuntoEntrega>> {
        return if (AppConfig.USE_MOCK) {
            delay(400)
            Result.success(MockDataProvider.mockPuntosEntrega)
        } else {
            try {
                val response = apiService.getPuntosEntrega()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    // ===== SOLICITUDES (Gift Requests) =====
    
    suspend fun getSolicitudes(): Result<List<SolicitudRegalo>> {
        return if (AppConfig.USE_MOCK) {
            delay(400)
            Result.success(MockDataProvider.mockSolicitudes)
        } else {
            try {
                val response = apiService.getSolicitudes()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
