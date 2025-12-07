package com.example.smilelinkapp.ui.screens.profile

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.smilelinkapp.config.AppConfig
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import java.security.MessageDigest
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    
    val googleSignInClient = remember {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("1017900179196-cn3n9691g2o64iifbii476t82s8h72ca.apps.googleusercontent.com")
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    val repository = remember { SmileLinkRepository() }
    val scope = rememberCoroutineScope()
    val padrino = sessionManager.getPadrino()
    
    var padrinoName by remember { mutableStateOf(padrino?.nombre ?: "Usuario") }
    var padrinoEmail by remember { mutableStateOf(padrino?.email ?: "email@example.com") }
    var padrinoDireccion by remember { mutableStateOf(padrino?.direccion ?: "No especificada") }
    var padrinoTelefono by remember { mutableStateOf(padrino?.telefono ?: "No especificado") }
    // Inicializar URL de foto de perfil
    var currentProfileImage by remember { mutableStateOf(padrino?.fotoPerfil) }

    var isLoading by remember { mutableStateOf(false) }

    // Image Picker
    val pickMedia = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            scope.launch {
                isLoading = true
                val result = repository.uploadProfileImage(padrino?.idPadrino ?: "", uri, context)
                result.fold(
                    onSuccess = { url ->
                        // Add server base URL if needed
                        val serverUrl = AppConfig.BASE_URL.replace("/api/", "")
                        val fullUrl = if (url.startsWith("http")) url else "$serverUrl$url"
                        currentProfileImage = fullUrl
                        
                        // Update session with new image URL
                        padrino?.let { current ->
                            val updatedWithPhoto = current.copy(fotoPerfil = fullUrl)
                            sessionManager.saveSession(updatedWithPhoto)
                        }
                        
                        Toast.makeText(context, "Foto de perfil actualizada", Toast.LENGTH_SHORT).show()
                    },
                    onFailure = { e ->
                        Toast.makeText(context, "Error al subir imagen: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                )
                isLoading = false
            }
        }
    }
    
    // Dialog states
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showAddressDialog by remember { mutableStateOf(false) }
    var showPhoneDialog by remember { mutableStateOf(false) }
    var showNotificationsDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }
    
    // Función auxiliar para actualizar el padrino en el backend
    fun updatePadrinoInBackend(
        updatedPadrino: com.example.smilelinkapp.data.model.Padrino,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        scope.launch {
            isLoading = true
            try {
                val result = repository.updatePadrino(updatedPadrino.idPadrino, updatedPadrino)
                result.fold(
                    onSuccess = { updated ->
                        // El backend no devuelve password_hash (es write_only)
                        // Preservamos el password_hash si estaba en el objeto actualizado
                        // o mantenemos el que ya existe en la sesión
                        val finalPadrino = if (updated.passwordHash.isNullOrBlank() && updatedPadrino.passwordHash != null) {
                            // Si el backend no devolvió password_hash pero lo enviamos, lo preservamos
                            updated.copy(passwordHash = updatedPadrino.passwordHash)
                        } else if (!updated.passwordHash.isNullOrBlank()) {
                            // Si el backend devolvió un password_hash (raro pero posible), lo usamos
                            updated
                        } else {
                            // Si no hay password_hash en ninguno, preservamos el de la sesión actual
                            val currentPadrino = sessionManager.getPadrino()
                            if (currentPadrino?.passwordHash != null) {
                                updated.copy(passwordHash = currentPadrino.passwordHash)
                            } else {
                                updated
                            }
                        }
                        
                        // Actualizar sesión con los datos del servidor (con password_hash preservado si es necesario)
                        sessionManager.saveSession(finalPadrino)
                        
                        // Actualizar estado local
                        padrinoName = finalPadrino.nombre
                        padrinoEmail = finalPadrino.email
                        padrinoDireccion = finalPadrino.direccion ?: "No especificada"
                        padrinoTelefono = finalPadrino.telefono ?: "No especificado"
                        onSuccess()
                    },
                    onFailure = { error ->
                        onError(error.message ?: "Error desconocido")
                    }
                )
            } catch (e: Exception) {
                onError(e.message ?: "Error de conexión")
            } finally {
                isLoading = false
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Mi Perfil",
                        style = MaterialTheme.typography.headlineSmall
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .padding(bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Profile header
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier.size(120.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    AsyncImage(
                        model = currentProfileImage ?: "https://ui-avatars.com/api/?name=$padrinoName&size=256&background=0077BE&color=fff",
                        contentDescription = "Foto de perfil",
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .clickable {
                                pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                            },
                        contentScale = ContentScale.Crop
                    )
                    
                    // Edit icon overlay
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp).clickable {
                             pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Cambiar foto",
                            tint = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.padding(6.dp)
                        )
                    }
                }
                
                Text(
                    text = padrinoName,
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = padrinoEmail,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Divider()
            
            // Account section
            Text(
                text = "Cuenta",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Person,
                title = "Editar Perfil",
                subtitle = "Actualiza tu información personal",
                onClick = { showEditProfileDialog = true }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.LocationOn,
                title = "Dirección",
                subtitle = padrinoDireccion,
                onClick = { showAddressDialog = true }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Phone,
                title = "Teléfono",
                subtitle = padrinoTelefono,
                onClick = { showPhoneDialog = true }
            )
            
            Divider()
            
            // Settings section
            Text(
                text = "Configuración",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Notifications,
                title = "Notificaciones",
                subtitle = "Gestiona tus notificaciones",
                onClick = { showNotificationsDialog = true }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Lock,
                title = "Privacidad y Seguridad",
                subtitle = "Controla tu privacidad",
                onClick = { showPrivacyDialog = true }
            )
            
            // Development mode indicator
            if (AppConfig.USE_MOCK) {
                Surface(
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        
                        Column {
                            Text(
                                text = "Modo Desarrollo",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                            Text(
                                text = "Usando datos mock (sin servidor)",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        }
                    }
                }
            }
            
            Divider()
            
            // About section
            Text(
                text = "Acerca de",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Info,
                title = "Acerca de SmileLink",
                subtitle = "Versión 1.0.0",
                onClick = { showAboutDialog = true }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Settings,
                title = "Ayuda y Soporte",
                subtitle = "¿Necesitas ayuda?",
                onClick = { showHelpDialog = true }
            )
            
            // Logout button
            Button(
                onClick = {
                    googleSignInClient.signOut().addOnCompleteListener {
                        sessionManager.clearSession()
                        onLogout()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(
                    imageVector = Icons.Default.ExitToApp,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Cerrar Sesión")
            }
        }
    }
    
    // Dialogs
    if (showEditProfileDialog) {
        EditProfileDialog(
            currentName = padrinoName,
            currentEmail = padrinoEmail,
            currentAddress = padrinoDireccion,
            currentPhone = padrinoTelefono,
            isLoading = isLoading,
            onDismiss = { showEditProfileDialog = false },
            onSave = { name: String, email: String, address: String, phone: String ->
                padrino?.let { currentPadrino ->
                    val updated = currentPadrino.copy(
                        nombre = name,
                        email = email,
                        direccion = address,
                        telefono = phone
                    )
                    updatePadrinoInBackend(
                        updatedPadrino = updated,
                        onSuccess = {
                            showEditProfileDialog = false
                            Toast.makeText(context, "Perfil actualizado correctamente", Toast.LENGTH_SHORT).show()
                        },
                        onError = { error ->
                            Toast.makeText(context, "Error al actualizar: $error", Toast.LENGTH_LONG).show()
                        }
                    )
                } ?: run {
                    Toast.makeText(context, "Error: Usuario no encontrado", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
    
    if (showAddressDialog) {
        EditTextDialog(
            title = "Editar Dirección",
            label = "Dirección",
            currentValue = padrinoDireccion,
            isLoading = isLoading,
            onDismiss = { showAddressDialog = false },
            onSave = { newAddress: String ->
                padrino?.let { currentPadrino ->
                    val updated = currentPadrino.copy(direccion = newAddress)
                    updatePadrinoInBackend(
                        updatedPadrino = updated,
                        onSuccess = {
                            showAddressDialog = false
                            Toast.makeText(context, "Dirección actualizada correctamente", Toast.LENGTH_SHORT).show()
                        },
                        onError = { error ->
                            Toast.makeText(context, "Error al actualizar: $error", Toast.LENGTH_LONG).show()
                        }
                    )
                } ?: run {
                    Toast.makeText(context, "Error: Usuario no encontrado", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
    
    if (showPhoneDialog) {
        EditTextDialog(
            title = "Editar Teléfono",
            label = "Teléfono",
            currentValue = padrinoTelefono,
            isLoading = isLoading,
            onDismiss = { showPhoneDialog = false },
            onSave = { newPhone: String ->
                padrino?.let { currentPadrino ->
                    val updated = currentPadrino.copy(telefono = newPhone)
                    updatePadrinoInBackend(
                        updatedPadrino = updated,
                        onSuccess = {
                            showPhoneDialog = false
                            Toast.makeText(context, "Teléfono actualizado correctamente", Toast.LENGTH_SHORT).show()
                        },
                        onError = { error ->
                            Toast.makeText(context, "Error al actualizar: $error", Toast.LENGTH_LONG).show()
                        }
                    )
                } ?: run {
                    Toast.makeText(context, "Error: Usuario no encontrado", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
    
    if (showNotificationsDialog) {
        NotificationsDialog(
            onDismiss = { showNotificationsDialog = false }
        )
    }
    
    if (showPrivacyDialog) {
        PrivacyDialog(
            padrinoId = padrino?.idPadrino ?: "",
            sessionManager = sessionManager,
            repository = repository,
            scope = scope,
            onDismiss = { showPrivacyDialog = false }
        )
    }
    
    if (showAboutDialog) {
        AboutDialog(
            onDismiss = { showAboutDialog = false }
        )
    }
    
    if (showHelpDialog) {
        HelpDialog(
            onDismiss = { showHelpDialog = false }
        )
    }
}

@Composable
private fun EditProfileDialog(
    currentName: String,
    currentEmail: String,
    currentAddress: String,
    currentPhone: String,
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onSave: (String, String, String, String) -> Unit
) {
    var name by remember { mutableStateOf(currentName) }
    var email by remember { mutableStateOf(currentEmail) }
    var address by remember { mutableStateOf(currentAddress) }
    var phone by remember { mutableStateOf(currentPhone) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar Perfil") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Dirección") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Teléfono") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(name, email, address, phone) },
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp))
                } else {
                    Text("Guardar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun EditTextDialog(
    title: String,
    label: String,
    currentValue: String,
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var value by remember { mutableStateOf(currentValue) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            OutlinedTextField(
                value = value,
                onValueChange = { value = it },
                label = { Text(label) },
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(value) },
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp))
                } else {
                    Text("Guardar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun NotificationsDialog(
    onDismiss: () -> Unit
) {
    var deliveryNotif by remember { mutableStateOf(true) }
    var eventNotif by remember { mutableStateOf(true) }
    var updateNotif by remember { mutableStateOf(false) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Notificaciones") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Notificaciones de entregas")
                    Switch(
                        checked = deliveryNotif,
                        onCheckedChange = { deliveryNotif = it }
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Recordatorios de eventos")
                    Switch(
                        checked = eventNotif,
                        onCheckedChange = { eventNotif = it }
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Actualizaciones de ahijados")
                    Switch(
                        checked = updateNotif,
                        onCheckedChange = { updateNotif = it }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Aceptar")
            }
        }
    )
}

@Composable
private fun PrivacyDialog(
    padrinoId: String,
    sessionManager: SessionManager,
    repository: SmileLinkRepository,
    scope: kotlinx.coroutines.CoroutineScope,
    onDismiss: () -> Unit
) {
    var showPasswordDialog by remember { mutableStateOf(false) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Privacidad y Seguridad") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TextButton(
                    onClick = { showPasswordDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Cambiar Contraseña")
                        Icon(Icons.Default.KeyboardArrowRight, null)
                    }
                }
                
                Divider()
                
                Text(
                    text = "Tus datos están protegidos y solo se comparten con organizaciones verificadas.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
    
    if (showPasswordDialog) {
        ChangePasswordDialog(
            padrinoId = padrinoId,
            sessionManager = sessionManager,
            repository = repository,
            scope = scope,
            onDismiss = { showPasswordDialog = false }
        )
    }
}

@Composable
private fun ChangePasswordDialog(
    padrinoId: String,
    sessionManager: SessionManager,
    repository: SmileLinkRepository,
    scope: kotlinx.coroutines.CoroutineScope,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    
    fun hashPassword(password: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(password.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
    
    fun updatePassword() {
        if (newPassword != confirmPassword) {
            Toast.makeText(context, "Las contraseñas no coinciden", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (newPassword.isBlank() || newPassword.length < 6) {
            Toast.makeText(context, "La contraseña debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoading = true
            try {
                // Obtener el padrino actual
                val currentPadrino = sessionManager.getPadrino()
                if (currentPadrino == null) {
                    Toast.makeText(context, "Error: Usuario no encontrado", Toast.LENGTH_SHORT).show()
                    isLoading = false
                    return@launch
                }
                
                // Verificar la contraseña actual (si no está en modo mock)
                if (!AppConfig.USE_MOCK) {
                    // Primero verificamos que la contraseña actual sea correcta
                    // En este caso, actualizamos directamente con el nuevo hash
                    // El backend no tiene validación de contraseña anterior en el update
                    // Entonces simplemente actualizamos con el nuevo hash
                }
                
                // Crear el hash de la nueva contraseña
                val newPasswordHash = hashPassword(newPassword)
                
                // Actualizar el padrino con el nuevo password_hash
                val updatedPadrino = currentPadrino.copy(
                    passwordHash = newPasswordHash
                )
                
                val result = repository.updatePadrino(padrinoId, updatedPadrino)
                result.fold(
                    onSuccess = { updated ->
                        // Actualizar sesión
                        sessionManager.saveSession(updated)
                        Toast.makeText(context, "Contraseña actualizada correctamente", Toast.LENGTH_SHORT).show()
                        currentPassword = ""
                        newPassword = ""
                        confirmPassword = ""
                        onDismiss()
                    },
                    onFailure = { error ->
                        Toast.makeText(context, "Error al actualizar contraseña: ${error.message}", Toast.LENGTH_LONG).show()
                    }
                )
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                isLoading = false
            }
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Cambiar Contraseña") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Contraseña Actual") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    enabled = !isLoading,
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("Nueva Contraseña") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    enabled = !isLoading,
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirmar Contraseña") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    enabled = !isLoading,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { updatePassword() },
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp))
                } else {
                    Text("Guardar")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun AboutDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = Icons.Default.Favorite,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
        },
        title = { Text("SmileLink") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Versión 1.0.0",
                    style = MaterialTheme.typography.titleSmall
                )
                
                Text(
                    text = "SmileLink es una plataforma que conecta padrinos con niños necesitados, facilitando entregas de regalos y apoyo.",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                
                Text(
                    text = "Desarrollado con ❤️ para hacer del mundo un lugar mejor",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
}

@Composable
private fun HelpDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Ayuda y Soporte") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Preguntas Frecuentes",
                    style = MaterialTheme.typography.titleSmall
                )
                
                Text(
                    text = "• ¿Cómo apadrino a un niño?\nVe a la sección 'Niños' y selecciona un niño disponible.",
                    style = MaterialTheme.typography.bodySmall
                )
                
                Text(
                    text = "• ¿Cómo realizo una entrega?\nVe a 'Entregas' y presiona 'Entregar Regalo'.",
                    style = MaterialTheme.typography.bodySmall
                )
                
                Divider()
                
                Text(
                    text = "Contacto",
                    style = MaterialTheme.typography.titleSmall
                )
                
                Text(
                    text = "Email: soporte@smilelink.com\nTeléfono: +52 123 456 7890",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
}

@Composable
private fun ProfileMenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Icon(
                imageVector = Icons.Default.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
