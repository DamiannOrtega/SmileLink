package com.example.smilelinkapp.data.repository

import com.example.smilelinkapp.config.AppConfig
import com.example.smilelinkapp.data.api.RetrofitClient
import com.example.smilelinkapp.data.mock.MockDataProvider
import com.example.smilelinkapp.data.model.*
import kotlinx.coroutines.delay

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
                    Result.failure(Exception("Error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    suspend fun subirIdentificacion(
        padrinoId: String,
        ineBytes: ByteArray? = null,
        ineFileName: String? = null,
        rostroBytes: ByteArray? = null,
        rostroFileName: String? = null
    ): Result<VerificationUploadResponse> {
        return if (AppConfig.USE_MOCK) {
            delay(1000)
            Result.success(
                VerificationUploadResponse(
                    mensaje = "Documentos subidos con éxito (Modo Mock)",
                    estadoVerificacion = "Pendiente",
                    iaSospecha = false
                )
            )
        } else {
            try {
                val inePart = if (ineBytes != null) {
                    val reqFile = okhttp3.RequestBody.create(
                        okhttp3.MediaType.parse("image/*"),
                        ineBytes
                    )
                    okhttp3.MultipartBody.Part.createFormData("foto_ine", ineFileName ?: "ine.jpg", reqFile)
                } else null

                val rostroPart = if (rostroBytes != null) {
                    val reqFile = okhttp3.RequestBody.create(
                        okhttp3.MediaType.parse("image/*"),
                        rostroBytes
                    )
                    okhttp3.MultipartBody.Part.createFormData("foto_rostro", rostroFileName ?: "rostro.jpg", reqFile)
                } else null

                val response = apiService.subirIdentificacion(padrinoId, inePart, rostroPart)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val errBody = try {
                        val str = response.errorBody()?.string() ?: ""
                        com.google.gson.JsonParser.parseString(str).asJsonObject.get("error")?.asString
                    } catch (e: Exception) { null }
                    Result.failure(Exception(errBody ?: "Error al subir identificación (${response.code()})"))
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
                val response = apiService.getApadrinamientos(padrinoId)
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
                    val errBody = try {
                        val str = response.errorBody()?.string() ?: ""
                        com.google.gson.JsonParser.parseString(str).asJsonObject.get("error")?.asString
                    } catch (e: Exception) { null }
                    Result.failure(Exception(errBody ?: "Error al crear apadrinamiento (${response.code()})"))
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
                val response = apiService.getEntregas(apadrinamientoId)
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
    
    suspend fun uploadEvidencia(
        id: String,
        archivo: okhttp3.MultipartBody.Part,
        subidoPor: okhttp3.RequestBody? = null,
        descripcion: okhttp3.RequestBody? = null
    ): Result<Map<String, String>> {
        return if (AppConfig.USE_MOCK) {
            delay(500)
            Result.success(mapOf("mensaje" to "Evidencia guardada (mock)"))
        } else {
            try {
                val response = apiService.uploadEvidencia(id, archivo, subidoPor, descripcion)
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
