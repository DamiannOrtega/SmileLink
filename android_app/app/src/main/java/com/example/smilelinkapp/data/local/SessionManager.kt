package com.example.smilelinkapp.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.smilelinkapp.data.model.Padrino
import com.google.gson.Gson

/**
 * Session Manager - Handles user session persistence
 * Stores current padrino information in SharedPreferences
 */
class SessionManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREF_NAME,
        Context.MODE_PRIVATE
    )
    
    private val gson = Gson()
    
    companion object {
        private const val PREF_NAME = "SmileLinkSession"
        private const val KEY_IS_LOGGED_IN = "isLoggedIn"
        private const val KEY_PADRINO = "padrino"
        private const val KEY_PADRINO_ID = "padrinoId"
        private const val KEY_EMAIL = "email"
        private const val KEY_NOMBRE = "nombre"
    }
    
    /**
     * Save padrino session
     */
    fun saveSession(padrino: Padrino) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_PADRINO, gson.toJson(padrino))
            putString(KEY_PADRINO_ID, padrino.idPadrino)
            putString(KEY_EMAIL, padrino.email)
            putString(KEY_NOMBRE, padrino.nombre)
            apply()
        }
    }
    
    /**
     * Get current padrino
     */
    fun getPadrino(): Padrino? {
        val padrinoJson = prefs.getString(KEY_PADRINO, null) ?: return null
        return try {
            gson.fromJson(padrinoJson, Padrino::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Get padrino ID
     */
    fun getPadrinoId(): String? {
        return prefs.getString(KEY_PADRINO_ID, null)
    }
    
    /**
     * Check if user is logged in
     */
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }
    
    /**
     * Clear session (logout)
     */
    fun clearSession() {
        prefs.edit().clear().apply()
    }
    
    /**
     * Get user email
     */
    fun getEmail(): String? {
        return prefs.getString(KEY_EMAIL, null)
    }
    
    /**
     * Get user name
     */
    fun getNombre(): String? {
        return prefs.getString(KEY_NOMBRE, null)
    }
}
