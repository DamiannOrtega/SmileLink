package com.example.smilelinkapp.data.api

import com.example.smilelinkapp.data.local.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Agrega el token JWT a TODAS las peticiones al backend:
 *     Authorization: Bearer <token>
 *
 * El token se guarda en SessionManager al iniciar sesión o registrarse.
 * Si el backend responde 401 (token vencido o inválido), se borra la sesión
 * para que la próxima vez la app pida iniciar sesión otra vez.
 */
class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = sessionManager.getToken()

        val request = if (!token.isNullOrBlank()) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        val response = chain.proceed(request)

        val esRutaDeLogin = original.url.encodedPath.contains("/auth/login/") ||
                original.url.encodedPath.contains("/auth/register/")
        if (response.code == 401 && !token.isNullOrBlank() && !esRutaDeLogin) {
            sessionManager.clearSession()
        }
        return response
    }
}
