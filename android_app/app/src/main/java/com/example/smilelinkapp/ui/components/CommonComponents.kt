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
            val imageModel = androidx.compose.runtime.remember(nino.foto, nino.nombre) {
                val foto = nino.foto
                if (foto != null && foto.startsWith("data:image/")) {
                    try {
                        val base64Data = foto.substringAfter("base64,")
                        val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                        android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    } catch (e: Exception) {
                        "https://ui-avatars.com/api/?name=${nino.nombre}&size=128&background=7FD8BE&color=fff"
                    }
                } else {
                    foto ?: "https://ui-avatars.com/api/?name=${nino.nombre}&size=128&background=7FD8BE&color=fff"
                }
            }

            // Child photo/avatar
            AsyncImage(
                model = imageModel,
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
                
                val needs = nino.necesidades
                if (!needs.isNullOrEmpty()) {
                    Surface(
                        color = MintGreen.copy(alpha = 0.2f),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Text(
                            text = "Necesita: ${needs.first()}",
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
