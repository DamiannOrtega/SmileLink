package com.example.smilelinkapp.ui.screens.profile

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
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.smilelinkapp.config.AppConfig
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.data.repository.SmileLinkRepository
import com.example.smilelinkapp.data.model.Padrino
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val padrino = sessionManager.getPadrino()
    val repository = remember { SmileLinkRepository() }
    val coroutineScope = rememberCoroutineScope()
    
    val padrinoName = padrino?.nombre ?: "Usuario"
    val padrinoEmail = padrino?.email ?: "email@example.com"
    val padrinoDireccion = padrino?.direccion ?: "No especificada"
    val padrinoTelefono = padrino?.telefono ?: "No especificado"

    var nameState by remember { mutableStateOf(padrinoName) }
    var addressState by remember { mutableStateOf(padrinoDireccion) }
    var phoneState by remember { mutableStateOf(padrinoTelefono) }

    var showEditDialog by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf("") }
    var editAddress by remember { mutableStateOf("") }
    var editPhone by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    
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
                .padding(bottom = 80.dp), // Extra padding for bottom navigation
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Profile header
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AsyncImage(
                    model = "https://ui-avatars.com/api/?name=$nameState&size=256&background=0077BE&color=fff",
                    contentDescription = "Foto de perfil",
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                
                Text(
                    text = nameState,
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
                onClick = {
                    editName = nameState
                    editAddress = if (addressState == "No especificada") "" else addressState
                    editPhone = if (phoneState == "No especificado") "" else phoneState
                    showEditDialog = true
                }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.LocationOn,
                title = "Dirección",
                subtitle = addressState,
                onClick = {
                    editName = nameState
                    editAddress = if (addressState == "No especificada") "" else addressState
                    editPhone = if (phoneState == "No especificado") "" else phoneState
                    showEditDialog = true
                }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Phone,
                title = "Teléfono",
                subtitle = phoneState,
                onClick = {
                    editName = nameState
                    editAddress = if (addressState == "No especificada") "" else addressState
                    editPhone = if (phoneState == "No especificado") "" else phoneState
                    showEditDialog = true
                }
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
                onClick = {
                    android.widget.Toast.makeText(context, "Configuración de notificaciones próximamente", android.widget.Toast.LENGTH_SHORT).show()
                }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Lock,
                title = "Privacidad y Seguridad",
                subtitle = "Controla tu privacidad",
                onClick = {
                    android.widget.Toast.makeText(context, "Configuración de privacidad próximamente", android.widget.Toast.LENGTH_SHORT).show()
                }
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
                onClick = {
                    android.widget.Toast.makeText(context, "SmileLink v1.0.0", android.widget.Toast.LENGTH_SHORT).show()
                }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Settings,
                title = "Ayuda y Soporte",
                subtitle = "¿Necesitas ayuda?",
                onClick = {
                    android.widget.Toast.makeText(context, "Soporte: soporte@smilelink.org", android.widget.Toast.LENGTH_LONG).show()
                }
            )
            
            // Logout button
            Button(
                onClick = {
                    sessionManager.clearSession()
                    onLogout()
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

    if (showEditDialog) {
        AlertDialog(
            onDismissRequest = { if (!isSaving) showEditDialog = false },
            title = { Text("Editar Perfil") },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Nombre") },
                        enabled = !isSaving,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editAddress,
                        onValueChange = { editAddress = it },
                        label = { Text("Dirección") },
                        enabled = !isSaving,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Teléfono") },
                        enabled = !isSaving,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (editName.isBlank()) {
                            android.widget.Toast.makeText(context, "El nombre es requerido", android.widget.Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        coroutineScope.launch {
                            isSaving = true
                            val originalPadrino = sessionManager.getPadrino()
                            if (originalPadrino != null) {
                                val updatedPadrino = Padrino(
                                    idPadrino = (originalPadrino.idPadrino as? String) ?: "",
                                    nombre = editName,
                                    email = (originalPadrino.email as? String) ?: "",
                                    passwordHash = originalPadrino.passwordHash,
                                    fechaRegistro = (originalPadrino.fechaRegistro as? String) ?: "",
                                    idGoogleAuth = originalPadrino.idGoogleAuth,
                                    direccion = editAddress,
                                    telefono = editPhone,
                                    historialApadrinamientoIds = (originalPadrino.historialApadrinamientoIds as? List<String>) ?: emptyList()
                                )
                                val result = repository.updatePadrino(updatedPadrino.idPadrino, updatedPadrino)
                                if (result.isSuccess) {
                                    val savedPadrino = result.getOrNull() ?: updatedPadrino
                                    sessionManager.saveSession(savedPadrino)
                                    nameState = savedPadrino.nombre
                                    addressState = savedPadrino.direccion ?: "No especificada"
                                    phoneState = savedPadrino.telefono ?: "No especificado"
                                    showEditDialog = false
                                    android.widget.Toast.makeText(context, "Perfil actualizado con éxito", android.widget.Toast.LENGTH_SHORT).show()
                                } else {
                                    val errorMsg = result.exceptionOrNull()?.message ?: "Error al conectar con el servidor"
                                    android.widget.Toast.makeText(context, errorMsg, android.widget.Toast.LENGTH_SHORT).show()
                                }
                            } else {
                                android.widget.Toast.makeText(context, "Error de sesión", android.widget.Toast.LENGTH_SHORT).show()
                            }
                            isSaving = false
                        }
                    },
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Guardar")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showEditDialog = false },
                    enabled = !isSaving
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
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
