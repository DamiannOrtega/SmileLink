package com.example.smilelinkapp.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smilelinkapp.utils.ValidationUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    var nombre by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var direccion by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    
    // Estados de validación
    var nombreError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var confirmPasswordError by remember { mutableStateOf<String?>(null) }
    var telefonoError by remember { mutableStateOf<String?>(null) }
    var direccionError by remember { mutableStateOf<String?>(null) }
    
    val uiState by viewModel.uiState.collectAsState()
    
    // Handle success
    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onRegisterSuccess()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Crear Cuenta") },
                navigationIcon = {
                    IconButton(onClick = onNavigateToLogin) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Text(
                text = "Únete a SmileLink",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Text(
                text = "Completa tus datos para comenzar",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 24.dp)
            )
            
            // Nombre completo
            OutlinedTextField(
                value = nombre,
                onValueChange = { 
                    nombre = it
                    nombreError = when {
                        it.isBlank() -> ValidationUtils.ErrorMessages.NAME_REQUIRED
                        !ValidationUtils.isValidName(it) -> {
                            when {
                                it.trim().length < 2 -> ValidationUtils.ErrorMessages.NAME_TOO_SHORT
                                it.trim().length > 100 -> ValidationUtils.ErrorMessages.NAME_TOO_LONG
                                else -> ValidationUtils.ErrorMessages.NAME_INVALID
                            }
                        }
                        else -> null
                    }
                },
                label = { Text("Nombre completo *") },
                leadingIcon = {
                    Icon(Icons.Default.Person, contentDescription = null)
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = nombreError != null,
                supportingText = nombreError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { 
                    email = it
                    emailError = when {
                        it.isBlank() -> ValidationUtils.ErrorMessages.EMAIL_REQUIRED
                        !ValidationUtils.isValidEmail(it) -> ValidationUtils.ErrorMessages.EMAIL_INVALID
                        else -> null
                    }
                },
                label = { Text("Email *") },
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null)
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = emailError != null,
                supportingText = emailError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { 
                    password = it
                    passwordError = when {
                        it.isBlank() -> ValidationUtils.ErrorMessages.PASSWORD_REQUIRED
                        it.length < 6 -> ValidationUtils.ErrorMessages.PASSWORD_TOO_SHORT
                        it.length > 50 -> ValidationUtils.ErrorMessages.PASSWORD_TOO_LONG
                        else -> null
                    }
                    // Validar confirmación también
                    if (confirmPassword.isNotBlank()) {
                        confirmPasswordError = if (it != confirmPassword) {
                            ValidationUtils.ErrorMessages.PASSWORDS_DONT_MATCH
                        } else {
                            null
                        }
                    }
                },
                label = { Text("Contraseña *") },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null)
                },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = passwordError != null,
                supportingText = {
                    if (passwordError != null) {
                        Text(passwordError!!, color = MaterialTheme.colorScheme.error)
                    } else {
                        Text("Mínimo 6 caracteres", style = MaterialTheme.typography.bodySmall)
                    }
                }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Confirm Password
            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { 
                    confirmPassword = it
                    confirmPasswordError = when {
                        it.isBlank() && password.isNotBlank() -> ValidationUtils.ErrorMessages.PASSWORD_REQUIRED
                        it != password && password.isNotBlank() -> ValidationUtils.ErrorMessages.PASSWORDS_DONT_MATCH
                        else -> null
                    }
                },
                label = { Text("Confirmar contraseña *") },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null)
                },
                trailingIcon = {
                    IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null
                        )
                    }
                },
                visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = confirmPasswordError != null,
                supportingText = confirmPasswordError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Teléfono
            OutlinedTextField(
                value = telefono,
                onValueChange = { 
                    telefono = it
                    telefonoError = if (it.isNotBlank() && !ValidationUtils.isValidPhone(it)) {
                        ValidationUtils.ErrorMessages.PHONE_INVALID
                    } else {
                        null
                    }
                },
                label = { Text("Teléfono (opcional)") },
                leadingIcon = {
                    Icon(Icons.Default.Phone, contentDescription = null)
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = telefonoError != null,
                supportingText = telefonoError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } }
                    ?: { Text("10 dígitos", style = MaterialTheme.typography.bodySmall) }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Dirección
            OutlinedTextField(
                value = direccion,
                onValueChange = { 
                    direccion = it
                    direccionError = when {
                        it.isBlank() -> ValidationUtils.ErrorMessages.ADDRESS_REQUIRED
                        !ValidationUtils.isValidAddress(it) -> {
                            when {
                                it.trim().length < 5 -> ValidationUtils.ErrorMessages.ADDRESS_TOO_SHORT
                                it.trim().length > 200 -> ValidationUtils.ErrorMessages.ADDRESS_TOO_LONG
                                else -> ValidationUtils.ErrorMessages.ADDRESS_TOO_SHORT
                            }
                        }
                        else -> null
                    }
                },
                label = { Text("Dirección *") },
                leadingIcon = {
                    Icon(Icons.Default.Home, contentDescription = null)
                },
                singleLine = false,
                maxLines = 2,
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                isError = direccionError != null,
                supportingText = direccionError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Error message
            if (uiState is AuthUiState.Error) {
                Text(
                    text = (uiState as AuthUiState.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }
            
            // Register button
            Button(
                onClick = {
                    viewModel.register(
                        nombre = nombre,
                        email = email,
                        password = password,
                        confirmPassword = confirmPassword,
                        telefono = telefono,
                        direccion = direccion
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = uiState !is AuthUiState.Loading,
                shape = MaterialTheme.shapes.medium
            ) {
                if (uiState is AuthUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Registrarse", style = MaterialTheme.typography.titleMedium)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Login link
            TextButton(onClick = onNavigateToLogin) {
                Text("¿Ya tienes cuenta? Inicia sesión")
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Required fields note
            Text(
                text = "* Campos obligatorios",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
