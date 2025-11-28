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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val padrino = sessionManager.getPadrino()
    
    val padrinoName = padrino?.nombre ?: "Usuario"
    val padrinoEmail = padrino?.email ?: "email@example.com"
    val padrinoDireccion = padrino?.direccion ?: "No especificada"
    val padrinoTelefono = padrino?.telefono ?: "No especificado"
    
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
                    model = "https://ui-avatars.com/api/?name=$padrinoName&size=256&background=0077BE&color=fff",
                    contentDescription = "Foto de perfil",
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                
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
                onClick = { /* TODO */ }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.LocationOn,
                title = "Dirección",
                subtitle = padrinoDireccion,
                onClick = { /* TODO */ }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Phone,
                title = "Teléfono",
                subtitle = padrinoTelefono,
                onClick = { /* TODO */ }
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
                onClick = { /* TODO */ }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Lock,
                title = "Privacidad y Seguridad",
                subtitle = "Controla tu privacidad",
                onClick = { /* TODO */ }
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
                onClick = { /* TODO */ }
            )
            
            ProfileMenuItem(
                icon = Icons.Default.Settings,
                title = "Ayuda y Soporte",
                subtitle = "¿Necesitas ayuda?",
                onClick = { /* TODO */ }
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
