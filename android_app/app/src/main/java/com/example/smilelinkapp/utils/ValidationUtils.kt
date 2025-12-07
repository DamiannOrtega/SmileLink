package com.example.smilelinkapp.utils

import java.util.regex.Pattern

object ValidationUtils {
    
    /**
     * Valida formato de email
     */
    fun isValidEmail(email: String): Boolean {
        if (email.isBlank()) return false
        val emailPattern = android.util.Patterns.EMAIL_ADDRESS
        return emailPattern.matcher(email.trim()).matches()
    }
    
    /**
     * Valida que el nombre contenga solo letras, espacios y algunos caracteres especiales
     */
    fun isValidName(name: String): Boolean {
        if (name.isBlank()) return false
        if (name.length < 2) return false
        if (name.length > 100) return false
        
        // Permite letras (incluye acentos), espacios, guiones y apóstrofes
        val namePattern = Pattern.compile("^[\\p{L}\\s'-]+$", Pattern.CASE_INSENSITIVE or Pattern.UNICODE_CASE)
        return namePattern.matcher(name.trim()).matches()
    }
    
    /**
     * Valida que la contraseña tenga al menos 6 caracteres
     */
    fun isValidPassword(password: String): Boolean {
        return password.length >= 6 && password.length <= 50
    }
    
    /**
     * Valida formato de teléfono mexicano (10 dígitos)
     */
    fun isValidPhone(phone: String): Boolean {
        if (phone.isBlank()) return true // Teléfono es opcional
        
        // Remover espacios, guiones y paréntesis
        val cleanPhone = phone.replace(Regex("[\\s()-]"), "")
        
        // Debe tener exactamente 10 dígitos
        val phonePattern = Pattern.compile("^[0-9]{10}$")
        return phonePattern.matcher(cleanPhone).matches()
    }
    
    /**
     * Limpia el teléfono removiendo caracteres no numéricos
     */
    fun cleanPhone(phone: String): String {
        return phone.replace(Regex("[^0-9]"), "")
    }
    
    /**
     * Valida que la dirección no esté vacía si es requerida
     */
    fun isValidAddress(address: String): Boolean {
        if (address.isBlank()) return false
        if (address.length < 5) return false
        if (address.length > 200) return false
        return true
    }
    
    /**
     * Mensajes de error para cada tipo de validación
     */
    object ErrorMessages {
        const val EMAIL_REQUIRED = "El email es requerido"
        const val EMAIL_INVALID = "Por favor ingresa un email válido"
        
        const val NAME_REQUIRED = "El nombre es requerido"
        const val NAME_TOO_SHORT = "El nombre debe tener al menos 2 caracteres"
        const val NAME_TOO_LONG = "El nombre no puede tener más de 100 caracteres"
        const val NAME_INVALID = "El nombre solo puede contener letras, espacios, guiones y apóstrofes"
        
        const val PASSWORD_REQUIRED = "La contraseña es requerida"
        const val PASSWORD_TOO_SHORT = "La contraseña debe tener al menos 6 caracteres"
        const val PASSWORD_TOO_LONG = "La contraseña no puede tener más de 50 caracteres"
        
        const val PHONE_INVALID = "El teléfono debe tener 10 dígitos"
        
        const val ADDRESS_REQUIRED = "La dirección es requerida"
        const val ADDRESS_TOO_SHORT = "La dirección debe tener al menos 5 caracteres"
        const val ADDRESS_TOO_LONG = "La dirección no puede tener más de 200 caracteres"
        
        const val PASSWORDS_DONT_MATCH = "Las contraseñas no coinciden"
    }
}
