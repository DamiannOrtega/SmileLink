package com.example.smilelinkapp.config

import android.os.Build

/**
 * Application configuration
 * Toggle between mock data and real API
 */
object AppConfig {
    /**
     * Set to true to use mock data (no server needed)
     * Set to false to connect to Django backend
     */
    const val USE_MOCK = false  // Changed to connect to backend
    
    /**
     * Base URL for API calls
     * Automatically detects if running on emulator or physical device
     */
    val BASE_URL: String
        get() = if (isEmulator()) {
            "http://10.0.2.2:8000/api/"  // Emulator
        } else {
            "http://192.168.193.177:8000/api/"  // Physical device (your PC's IP) cambio ip
        }
    
    /**
     * Enable network logging for debugging
     */
    const val DEBUG_NETWORK = true
    
    /**
     * Detect if running on Android Emulator
     */
    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("google/sdk_gphone")
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.contains("emulator")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")
                || "google_sdk" == Build.PRODUCT)
    }
}
