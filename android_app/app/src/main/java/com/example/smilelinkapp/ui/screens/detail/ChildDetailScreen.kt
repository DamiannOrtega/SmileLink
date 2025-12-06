package com.example.smilelinkapp.ui.screens.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.smilelinkapp.data.model.Nino
import com.example.smilelinkapp.ui.components.ErrorMessage
import com.example.smilelinkapp.ui.components.LoadingIndicator
import com.example.smilelinkapp.ui.theme.MintGreen
import com.example.smilelinkapp.ui.theme.OceanBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildDetailScreen(
    childId: String,
    onBackClick: () -> Unit,
    onSponsorSuccess: () -> Unit,
    viewModel: ChildDetailViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val sponsorshipInProgress by viewModel.sponsorshipInProgress.collectAsState()
    
    LaunchedEffect(childId) {
        viewModel.loadChild(childId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Perfil del Niño") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is ChildDetailUiState.Loading -> {
                LoadingIndicator()
            }
            
            is ChildDetailUiState.Success -> {
                var errorMessage by remember { mutableStateOf<String?>(null) }
                
                ChildDetailContent(
                    nino = state.nino,
                    onSponsorClick = {
                        viewModel.sponsorChild(
                            childId = childId,
                            onSuccess = onSponsorSuccess,
                            onError = { error -> errorMessage = error }
                        )
                    },
                    sponsorshipInProgress = sponsorshipInProgress,
                    errorMessage = errorMessage,
                    modifier = Modifier.padding(paddingValues)
                )
            }
            
            is ChildDetailUiState.Error -> {
                ErrorMessage(
                    message = state.message,
                    onRetry = { viewModel.loadChild(childId) }
                )
            }
        }
    }
}

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

@Composable
private fun ChildDetailContent(
    nino: Nino,
    onSponsorClick: () -> Unit,
    sponsorshipInProgress: Boolean,
    errorMessage: String?,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 80.dp)
        ) {
            // Hero image section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
            ) {
                AsyncImage(
                    model = resolveAvatarUrl(nino.avatarUrl, nino.nombre),
                    contentDescription = "Foto de ${nino.nombre}",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                
                // Gradient overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.surface.copy(alpha = 0f),
                                    MaterialTheme.colorScheme.surface
                                ),
                                startY = 200f
                            )
                        )
                )
            }
            
            // Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Name and basic info
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = nino.nombre,
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        InfoChip("${nino.edad} años")
                        InfoChip(nino.genero)
                    }
                }
                
                Divider()
                
                // Description
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Sobre ${nino.nombre.split(" ").first()}",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Text(
                        text = nino.descripcion,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Divider()
                
                // Wish letter section
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MintGreen.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "✉️",
                                style = MaterialTheme.typography.headlineSmall
                            )
                            Text(
                                text = "Mi Carta de Deseos",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        
                        Text(
                            text = "Estas son las cosas que más necesito:",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        nino.necesidades.forEach { necesidad ->
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = OceanBlue,
                                    shape = CircleShape,
                                    modifier = Modifier.size(8.dp)
                                ) {}
                                
                                Text(
                                    text = necesidad,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }
        
        // Floating action button
        if (nino.estadoApadrinamiento == "Disponible") {
            Button(
                onClick = onSponsorClick,
                enabled = !sponsorshipInProgress,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(24.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                if (sponsorshipInProgress) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "¡Quiero Apadrinar!",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoChip(text: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
