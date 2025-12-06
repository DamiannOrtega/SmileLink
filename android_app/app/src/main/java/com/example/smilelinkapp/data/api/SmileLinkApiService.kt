package com.example.smilelinkapp.data.api

import com.example.smilelinkapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API service interface for SmileLink backend
 */
interface SmileLinkApiService {
    
    // ===== NIÑOS (Children) =====
    @GET("ninos/")
    suspend fun getNinos(): Response<List<Nino>>
    
    @GET("ninos/{id}/")
    suspend fun getNino(@Path("id") id: String): Response<Nino>
    
    @POST("ninos/")
    suspend fun createNino(@Body nino: Nino): Response<Nino>
    
    @PATCH("ninos/{id}/")
    suspend fun updateNino(@Path("id") id: String, @Body nino: Nino): Response<Nino>
    
    // ===== PADRINOS (Sponsors) =====
    @GET("padrinos/")
    suspend fun getPadrinos(): Response<List<Padrino>>
    
    @GET("padrinos/{id}/")
    suspend fun getPadrino(@Path("id") id: String): Response<Padrino>
    
    @POST("padrinos/")
    suspend fun createPadrino(@Body padrino: Padrino): Response<Padrino>
    
    @PATCH("padrinos/{id}/")
    suspend fun updatePadrino(@Path("id") id: String, @Body padrino: Padrino): Response<Padrino>
    
    // ===== APADRINAMIENTOS (Sponsorships) =====
    @GET("apadrinamientos/")
    suspend fun getApadrinamientos(): Response<List<Apadrinamiento>>
    
    @GET("apadrinamientos/{id}/")
    suspend fun getApadrinamiento(@Path("id") id: String): Response<Apadrinamiento>
    
    @POST("apadrinamientos/")
    suspend fun createApadrinamiento(@Body apadrinamiento: Apadrinamiento): Response<Apadrinamiento>
    
    @PATCH("apadrinamientos/{id}/")
    suspend fun updateApadrinamiento(@Path("id") id: String, @Body apadrinamiento: Apadrinamiento): Response<Apadrinamiento>
    
    // ===== ENTREGAS (Deliveries) =====
    @GET("entregas/")
    suspend fun getEntregas(): Response<List<Entrega>>
    
    @GET("entregas/{id}/")
    suspend fun getEntrega(@Path("id") id: String): Response<Entrega>
    
    @POST("entregas/")
    suspend fun createEntrega(@Body entrega: Entrega): Response<Entrega>
    
    @PATCH("entregas/{id}/")
    suspend fun updateEntrega(@Path("id") id: String, @Body entrega: Entrega): Response<Entrega>

    @Multipart
    @POST("entregas/{id}/upload_evidence/")
    suspend fun uploadDeliveryEvidence(
        @Path("id") id: String,
        @Part file: okhttp3.MultipartBody.Part
    ): Response<Map<String, String>>
    
    // ===== PUNTOS DE ENTREGA (Delivery Points) =====
    @GET("puntos-entrega/")
    suspend fun getPuntosEntrega(): Response<List<PuntoEntrega>>
    
    @GET("puntos-entrega/{id}/")
    suspend fun getPuntoEntrega(@Path("id") id: String): Response<PuntoEntrega>
    
    // ===== SOLICITUDES (Gift Requests) =====
    @GET("solicitudes/")
    suspend fun getSolicitudes(): Response<List<SolicitudRegalo>>
    
    @GET("solicitudes/{id}/")
    suspend fun getSolicitud(@Path("id") id: String): Response<SolicitudRegalo>
    
    // ===== AUTHENTICATION =====
    @POST("auth/register/")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login/")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("auth/logout/")
    suspend fun logout(): Response<Map<String, String>>
    
    @GET("auth/me/")
    suspend fun getCurrentUser(@Query("padrino_id") padrinoId: String): Response<Padrino>
    
    @POST("auth/google/")
    suspend fun googleLogin(@Body body: Map<String, String>): Response<AuthResponse>
}
