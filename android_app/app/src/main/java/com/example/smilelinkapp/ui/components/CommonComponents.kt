package com.example.smilelinkapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.ui.theme.MintGreen

// Helper to resolve avatar URL
private fun resolveAvatarUrl(url: String?, childName: String): String {
    if (url.isNullOrEmpty()) {
        val encodedName = java.net.URLEncoder.encode(childName, "UTF-8")
        return "https://ui-avatars.com/api/?name=$encodedName&size=512&background=7FD8BE&color=fff"
    }
    
    // Replace localhost or 127.0.0.1 with the backend IP accessible from Android
    var resolvedUrl = url
    if (url.contains("localhost") || url.contains("127.0.0.1")) {
        resolvedUrl = url.replace("localhost", "192.168.193.177")
                         .replace("127.0.0.1", "192.168.193.177")
    }
    
    // If it's a relative path (e.g. /media/...), append base URL
    if (resolvedUrl.startsWith("/")) {
        resolvedUrl = "http://192.168.193.177:8000$resolvedUrl"
    } else if (!resolvedUrl.startsWith("http")) {
         // Assume relative if not starting with http
         resolvedUrl = "http://192.168.193.177:8000/$resolvedUrl"
    }
    
    return resolvedUrl
}

/**
 * Card component for displaying a child in the discovery list
 */
@Composable
fun ChildCard(
    nino: Nino,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Child photo/avatar
            AsyncImage(
                model = resolveAvatarUrl(nino.avatarUrl, nino.nombre),
                contentDescription = "Foto de ${nino.nombre}",
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            
            // Child info
            Column(
                modifier = Modifier
                    .weight(1f)
                    .align(Alignment.CenterVertically),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = nino.nombre,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = "${nino.edad} años • ${nino.genero}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                if (nino.necesidades.isNotEmpty()) {
                    Surface(
                        color = MintGreen.copy(alpha = 0.2f),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Text(
                            text = "Necesita: ${nino.necesidades.first()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
            
            // Status indicator
            if (nino.estadoApadrinamiento == "Disponible") {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = CircleShape,
                    modifier = Modifier
                        .size(12.dp)
                        .align(Alignment.Top)
                ) {}
            }
        }
    }
}

/**
 * Loading indicator component
 */
@Composable
fun LoadingIndicator(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

/**
 * Error message component
 */
@Composable
fun ErrorMessage(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "😔",
            style = MaterialTheme.typography.displayMedium
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        if (onRetry != null) {
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(onClick = onRetry) {
                Text("Reintentar")
            }
        }
    }
}

/**
 * Empty state component
 */
@Composable
fun EmptyState(
    title: String,
    message: String,
    emoji: String = "🤔",
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = emoji,
            style = MaterialTheme.typography.displayMedium
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
